#!/usr/bin/env node

/**
 * ingest-results.js
 *
 * Actualiza results.json usando la API de football-data.org (v4).
 * Competicion: WC (FIFA World Cup).
 * Free tier: 10 req/min — mas que suficiente.
 *
 * Uso:
 *   FOOTBALL_DATA_TOKEN=tu_token node scripts/ingest-results.js
 *
 * Si la API falla, el script termina sin romper nada.
 * El organizador siempre puede editar results.json o overrides.json a mano.
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const envPath = path.join(rootDir, ".env");

// Leer .env sin dependencias externas
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const val = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const API_BASE = "https://api.football-data.org/v4";
const COMPETITION = "WC";
const TOKEN = process.env.FOOTBALL_DATA_TOKEN || "";

if (!TOKEN) {
  console.error("Falta FOOTBALL_DATA_TOKEN. Abortando sin cambios.");
  process.exit(1);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  fs.writeFileSync(
    path.join(dataDir, relativePath),
    JSON.stringify(value, null, 2) + "\n",
    "utf8"
  );
}

function apiGet(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${endpoint}`;
    const options = {
      headers: { "X-Auth-Token": TOKEN }
    };

    https.get(url, options, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        if (res.statusCode !== 200) {
          reject(new Error(`API respondio ${res.statusCode}: ${body.slice(0, 200)}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(new Error(`JSON invalido de la API: ${err.message}`));
        }
      });
      res.on("error", reject);
    }).on("error", reject);
  });
}

/**
 * Mapea el status de football-data.org a nuestro formato interno.
 */
function mapStatus(apiStatus) {
  const mapping = {
    SCHEDULED: "scheduled",
    TIMED: "scheduled",
    IN_PLAY: "live",
    PAUSED: "live",
    FINISHED: "finished",
    SUSPENDED: "suspended",
    POSTPONED: "postponed",
    CANCELLED: "cancelled",
    AWARDED: "finished"
  };
  return mapping[apiStatus] || "scheduled";
}

/**
 * Determina el ganador a partir del marcador.
 */
function getWinner(homeScore, awayScore) {
  if (homeScore === null || awayScore === null) return null;
  if (homeScore > awayScore) return "home";
  if (homeScore < awayScore) return "away";
  return "draw";
}

/**
 * Busca el matchId local que corresponde a un partido de la API.
 * Compara por fecha UTC (mismo dia) + equipos.
 * Si no encuentra match, retorna null (partido de fase eliminatoria aun sin mapear, etc).
 */
function findLocalMatchId(apiMatch, localMatches) {
  const apiDate = apiMatch.utcDate ? apiMatch.utcDate.slice(0, 10) : null;
  const apiHome = (apiMatch.homeTeam?.name || "").toLowerCase();
  const apiAway = (apiMatch.awayTeam?.name || "").toLowerCase();

  for (const local of localMatches) {
    const localDate = local.kickoffUtc ? local.kickoffUtc.slice(0, 10) : null;
    const localHome = (local.homeTeam || "").toLowerCase();
    const localAway = (local.awayTeam || "").toLowerCase();

    if (localDate === apiDate && localHome.includes(apiHome) && localAway.includes(apiAway)) {
      return local.id;
    }
    if (localDate === apiDate && apiHome.includes(localHome) && apiAway.includes(localAway)) {
      return local.id;
    }
  }
  return null;
}

async function main() {
  console.log("Consultando football-data.org para resultados del Mundial...");

  let apiData;
  try {
    apiData = await apiGet(`/competitions/${COMPETITION}/matches`);
  } catch (err) {
    console.error(`Error al consultar la API: ${err.message}`);
    console.log("Sin cambios en results.json. Puedes actualizar manualmente.");
    process.exit(0);
  }

  const apiMatches = apiData.matches || [];
  if (!apiMatches.length) {
    console.log("La API no devolvio partidos. Sin cambios.");
    process.exit(0);
  }

  const matchesData = readJson("matches.json");
  const localMatches = matchesData.matches || [];
  const existingResults = readJson("results.json");
  const resultMap = new Map(
    (existingResults.results || []).map((r) => [r.matchId, r])
  );

  let updated = 0;
  let skipped = 0;

  for (const apiMatch of apiMatches) {
    const localId = findLocalMatchId(apiMatch, localMatches);
    if (!localId) {
      skipped++;
      continue;
    }

    const status = mapStatus(apiMatch.status);
    const fullTime = apiMatch.score?.fullTime || {};
    const homeScore = fullTime.home ?? null;
    const awayScore = fullTime.away ?? null;

    const entry = {
      matchId: localId,
      status,
      homeScore,
      awayScore,
      winner: getWinner(homeScore, awayScore),
      source: "football-data.org",
      updatedAtUtc: new Date().toISOString()
    };

    const existing = resultMap.get(localId);
    // Solo actualizar si hay info nueva (status cambio o hay marcador)
    if (existing && existing.source === "manual" && existing.status === "finished") {
      // No sobreescribir resultados ingresados manualmente que ya estan finalizados
      continue;
    }

    resultMap.set(localId, entry);
    updated++;
  }

  const newResults = {
    results: Array.from(resultMap.values())
  };

  writeJson("results.json", newResults);
  console.log(`Listo. Actualizados: ${updated}, sin mapear: ${skipped}.`);
  console.log("Recuerda que overrides.json siempre tiene prioridad sobre estos datos.");
}

main().catch((err) => {
  console.error(`Error inesperado: ${err.message}`);
  process.exit(1);
});
