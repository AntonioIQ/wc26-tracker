/**
 * Netlify Function: save-picks
 *
 * Recibe picks de un usuario autenticado y los commitea al repo via GitHub API.
 * Variables de entorno requeridas en Netlify:
 *   GITHUB_TOKEN — Personal access token con permiso "repo"
 *   GITHUB_REPO  — ej: "AntonioIQ/wc26-tracker"
 */

const REPO = process.env.GITHUB_REPO || "";
const GH_TOKEN = process.env.GITHUB_TOKEN || "";
const BRANCH = "main";

async function githubApi(endpoint, options = {}) {
  const url = `https://api.github.com/repos/${REPO}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${GH_TOKEN}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${body.slice(0, 200)}`);
  return body ? JSON.parse(body) : null;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  if (!GH_TOKEN || !REPO) {
    return { statusCode: 500, body: "Configuracion de servidor incompleta" };
  }

  // Verify Netlify Identity token
  const user = event.headers["authorization"]
    ? JSON.parse(Buffer.from(event.headers["authorization"].split(".")[1], "base64").toString())
    : null;

  if (!user?.sub) {
    return { statusCode: 401, body: "No autenticado" };
  }

  let picks;
  try {
    picks = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "JSON invalido" };
  }

  if (!picks.userId || !Array.isArray(picks.picks)) {
    return { statusCode: 400, body: "Faltan campos requeridos" };
  }

  const slug = picks.userId.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "participante";

  const filePath = `data/picks/${slug}.json`;
  const content = Buffer.from(JSON.stringify(picks, null, 2) + "\n").toString("base64");

  try {
    // Check if file exists (to get sha for update)
    let sha = null;
    try {
      const existing = await githubApi(`/contents/${filePath}?ref=${BRANCH}`);
      sha = existing.sha;
    } catch {
      // File doesn't exist yet, that's fine
    }

    await githubApi(`/contents/${filePath}`, {
      method: "PUT",
      body: JSON.stringify({
        message: `picks: ${picks.displayName || slug}`,
        content,
        branch: BRANCH,
        ...(sha ? { sha } : {})
      })
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, file: filePath })
    };
  } catch (err) {
    console.error("Error committing picks:", err);
    return { statusCode: 500, body: `Error guardando: ${err.message}` };
  }
};
