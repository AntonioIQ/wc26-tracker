/**
 * Netlify Function: save-overrides
 *
 * Recibe resultados manuales del admin, los commitea como data/overrides.json
 * y dispara el workflow de build para recalcular la tabla.
 *
 * Variables de entorno requeridas en Netlify:
 *   GITHUB_TOKEN — mismo token que usa save-picks (permiso "repo" + "actions")
 *   GITHUB_REPO  — ej: "AntonioIQ/wc26-tracker"
 *   ADMIN_SECRET — contraseña libre que tú eliges (ej: "mundialito2026")
 */

const REPO = process.env.GITHUB_REPO || "";
const GH_TOKEN = process.env.GITHUB_TOKEN || "";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
const BRANCH = "main";

async function githubApi(endpoint, options = {}) {
  const url = `https://api.github.com/repos/${REPO}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${GH_TOKEN}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${body.slice(0, 300)}`);
  return body ? JSON.parse(body) : null;
}

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: "Method not allowed" };
  }

  if (!GH_TOKEN || !REPO) {
    return { statusCode: 500, headers: cors, body: "Configuracion de servidor incompleta" };
  }

  if (!ADMIN_SECRET) {
    return { statusCode: 500, headers: cors, body: "ADMIN_SECRET no configurado en Netlify" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: cors, body: "JSON invalido" };
  }

  if (!payload.secret || payload.secret !== ADMIN_SECRET) {
    return { statusCode: 401, headers: cors, body: "Contraseña incorrecta" };
  }

  const overrides = {
    results: (payload.results || []).map((r) => ({
      matchId: r.matchId,
      status: r.status || "finished",
      homeScore: r.homeScore ?? null,
      awayScore: r.awayScore ?? null,
      ...(r.qualifiedTeam ? { qualifiedTeam: r.qualifiedTeam } : {}),
      source: "manual",
      updatedAtUtc: new Date().toISOString(),
    })),
    notes: ["Este archivo tiene prioridad sobre cualquier actualizacion automatizada."],
  };

  const content = Buffer.from(JSON.stringify(overrides, null, 2) + "\n").toString("base64");

  // Obtener SHA actual del archivo para poder actualizarlo
  let sha = null;
  try {
    const existing = await githubApi(`/contents/data/overrides.json?ref=${BRANCH}`);
    sha = existing.sha;
  } catch {
    // El archivo no existe todavía, se crea nuevo
  }

  try {
    await githubApi(`/contents/data/overrides.json`, {
      method: "PUT",
      body: JSON.stringify({
        message: `manual: actualizar ${overrides.results.length} resultado(s) [skip netlify]`,
        content,
        branch: BRANCH,
        ...(sha ? { sha } : {}),
      }),
    });
  } catch (err) {
    return { statusCode: 500, headers: cors, body: `Error committing: ${err.message}` };
  }

  // Disparar workflow de build para recalcular tabla (~1-2 min)
  let buildTriggered = false;
  try {
    await githubApi(`/actions/workflows/refresh-results.yml/dispatches`, {
      method: "POST",
      body: JSON.stringify({ ref: BRANCH }),
    });
    buildTriggered = true;
  } catch {
    // No es crítico: overrides ya guardados, el siguiente cron los procesará
  }

  return {
    statusCode: 200,
    headers: { ...cors, "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: true,
      count: overrides.results.length,
      buildTriggered,
    }),
  };
};
