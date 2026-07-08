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
const { resolveBracket } = require("./lib/resolve-bracket");

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
  console.warn("Falta FOOTBALL_DATA_TOKEN. Saltando ingest API (los overrides manuales siguen aplicandose).");
  process.exit(0);
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

// ── ESPN: cierre rápido del partido ──────────────────────────────────────────
// ESPN reporta en tiempo real y marca "post"/completed apenas termina el juego,
// mucho antes que football-data. Lo usamos SOLO en fase de grupos, donde el
// marcador final == marcador al minuto 90 (la regla de la quiniela). En
// eliminatoria NO se usa: el final de ESPN puede incluir prórroga/penales y ahí
// necesitamos el regularTime que sí entrega football-data.
const ESPN_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

function espnGet(yyyymmdd) {
  return new Promise((resolve, reject) => {
    const url = /^\d{8}$/.test(yyyymmdd) ? `${ESPN_SCOREBOARD}?dates=${yyyymmdd}` : ESPN_SCOREBOARD;
    https.get(url, (res) => {
      let body = "";
      res.on("data", (c) => { body += c; });
      res.on("end", () => {
        if (res.statusCode !== 200) { reject(new Error(`ESPN ${res.statusCode}`)); return; }
        try { resolve(JSON.parse(body)); } catch (err) { reject(err); }
      });
    }).on("error", reject);
  });
}

function prevDayYmd(yyyymmdd) {
  const y = +yyyymmdd.slice(0, 4), m = +yyyymmdd.slice(4, 6), d = +yyyymmdd.slice(6, 8);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10).replace(/-/g, "");
}

// Lista de partidos de ESPN (con su marcador y si ya terminaron) para un set de
// fechas UTC. Best-effort: si una fecha falla, la salta.
async function getEspnFinals(dates) {
  const events = [];
  for (const d of dates) {
    let data;
    try { data = await espnGet(d); } catch { continue; }
    for (const ev of data.events || []) {
      const comp = ev.competitions && ev.competitions[0];
      if (!comp) continue;
      const cs = comp.competitors || [];
      const home = cs.find((c) => c.homeAway === "home");
      const away = cs.find((c) => c.homeAway === "away");
      if (!home || !away) continue;
      const t = ev.status && ev.status.type;
      const completed = !!(t && (t.completed === true || t.state === "post"));
      events.push({
        date: (ev.date || "").slice(0, 10),
        home: home.team && home.team.displayName,
        away: away.team && away.team.displayName,
        homeScore: Number(home.score),
        awayScore: Number(away.score),
        completed,
      });
    }
  }
  return events;
}

// Empareja un match local con el partido de ESPN (fecha + equipos, tolerante a
// nombres/acentos y orden invertido). Devuelve el marcador YA orientado al
// local/visitante del match local.
function findEspnFinal(localMatch, espnEvents) {
  const ld = localMatch.kickoffUtc ? localMatch.kickoffUtc.slice(0, 10) : null;
  const lh = normTeam(localMatch.homeTeam), la = normTeam(localMatch.awayTeam);
  const hit = (x, y) => x && y && (x.includes(y) || y.includes(x));
  for (const e of espnEvents) {
    if (e.date !== ld) continue;
    const eh = normTeam(e.home), ea = normTeam(e.away);
    if (hit(lh, eh) && hit(la, ea)) return { homeScore: e.homeScore, awayScore: e.awayScore, completed: e.completed };
    if (hit(lh, ea) && hit(la, eh)) return { homeScore: e.awayScore, awayScore: e.homeScore, completed: e.completed };
  }
  return null;
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

// Normaliza nombres de equipos para emparejar con football-data.org.
// Maneja diferencias como "Bosnia and Herzegovina" vs "Bosnia-Herzegovina",
// acentos (Curaçao), "&"/"and" y alias oficiales (Türkiye, Côte d'Ivoire, etc).
// Mantener en sync con normTeam/TEAM_ALIASES del frontend (app/app.js).
const TEAM_ALIASES = {
  turkiye: "turkey",
  cotedivoire: "ivorycoast",
  korearepublic: "southkorea", korea: "southkorea",
  iriran: "iran",
  congodr: "drcongo",
  czechrepublic: "czechia",
  caboverde: "capeverde",
  unitedstatesofamerica: "unitedstates", usa: "unitedstates",
};
function normTeam(s) {
  const base = (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/\band\b/g, " ")
    .replace(/[^a-z0-9]/g, "");
  return TEAM_ALIASES[base] || base;
}

/**
 * Busca el matchId local que corresponde a un partido de la API.
 * Compara por fecha UTC (mismo dia) + equipos normalizados (tolerante a
 * diferencias de nombre/acentos y orden invertido local/visitante).
 * Si no encuentra match, retorna null (partido de fase eliminatoria aun sin mapear, etc).
 */
function findLocalMatchId(apiMatch, localMatches) {
  const apiDate = apiMatch.utcDate ? apiMatch.utcDate.slice(0, 10) : null;
  const apiHome = normTeam(apiMatch.homeTeam?.name);
  const apiAway = normTeam(apiMatch.awayTeam?.name);
  if (!apiHome || !apiAway) return null;

  const hit = (x, y) => x && y && (x.includes(y) || y.includes(x));

  for (const local of localMatches) {
    const localDate = local.kickoffUtc ? local.kickoffUtc.slice(0, 10) : null;
    if (localDate !== apiDate) continue;
    const localHome = normTeam(local.homeTeam);
    const localAway = normTeam(local.awayTeam);

    // Misma orientación local/visitante que la API
    if (hit(localHome, apiHome) && hit(localAway, apiAway)) {
      return { id: local.id, flipped: false };
    }
    // Orientación invertida: la API trae home/away al revés que nosotros.
    // Devolvemos flipped para reorientar el marcador a NUESTRO home/away (que es
    // contra el que se hicieron los picks).
    if (hit(localHome, apiAway) && hit(localAway, apiHome)) {
      return { id: local.id, flipped: true };
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
  const existingResults = readJson("results.json");
  const resultMap = new Map(
    (existingResults.results || []).map((r) => [r.matchId, r])
  );

  // Resolvemos los equipos reales de la fase eliminatoria a partir de la tabla
  // de grupos y los resultados ya conocidos. Sin esto, los partidos de knockout
  // conservan sus placeholders ("2nd Group A") y NUNCA mapean contra la API
  // (que ya trae equipos reales), por lo que sus resultados no se ingieren.
  const localMatches = resolveBracket(matchesData.matches || [], existingResults.results || []);

  let updated = 0;
  let skipped = 0;

  for (const apiMatch of apiMatches) {
    const localHit = findLocalMatchId(apiMatch, localMatches);
    if (!localHit) {
      skipped++;
      continue;
    }
    const localId = localHit.id;
    const flipped = localHit.flipped;

    const status = mapStatus(apiMatch.status);
    const score = apiMatch.score || {};
    const duration = score.duration || "REGULAR";
    const regular = score.regularTime || {};
    const full = score.fullTime || {};
    const extra = score.extraTime || {};
    const penalties = score.penalties || {};

    // Marcador al 90 min para scoring de quiniela. Preferimos regularTime, pero
    // football-data a veces lo devuelve nulo (o como objeto {home:null,away:null})
    // y deja el marcador solo en fullTime; por eso el fallback es por campo con ??
    // (no con ||, que elegiria un objeto regularTime "truthy" con valores nulos).
    // Si flipped, la API trae home/away al revés que nosotros: reorientamos todos
    // los marcadores a NUESTRO home/away (contra el que se hicieron los picks).
    const rawHome = regular.home ?? full.home ?? null;
    const rawAway = regular.away ?? full.away ?? null;
    const homeScore = flipped ? rawAway : rawHome;
    const awayScore = flipped ? rawHome : rawAway;

    // Info de eliminatoria: prórroga, penales, clasificado
    const isKnockout = duration !== "REGULAR";
    const extraHome = flipped ? (extra.away ?? null) : (extra.home ?? null);
    const extraAway = flipped ? (extra.home ?? null) : (extra.away ?? null);
    const penHome = flipped ? (penalties.away ?? null) : (penalties.home ?? null);
    const penAway = flipped ? (penalties.home ?? null) : (penalties.away ?? null);

    // Determinar clasificado en eliminatoria (en NUESTRA orientación)
    let qualifiedTeam = null;
    if (status === "finished" && isKnockout) {
      const apiWinner = score.winner;
      let w = apiWinner === "HOME_TEAM" ? "home" : apiWinner === "AWAY_TEAM" ? "away" : null;
      if (w && flipped) w = w === "home" ? "away" : "home";
      // Fallback: football-data a veces marca el KO como FINISHED pero deja
      // score.winner en null (p. ej. tanda de penales cuyo ganador no cerró).
      // El marcador decisivo sigue llegando: primero la tanda (penHome/penAway,
      // ya reorientados) si no es empate; si no, fullTime, que en estos partidos
      // incluye el resultado de la tanda y su lado mayor es el clasificado.
      if (!w) {
        if (penHome !== null && penAway !== null && penHome !== penAway) {
          w = penHome > penAway ? "home" : "away";
        } else {
          const fh = flipped ? (full.away ?? null) : (full.home ?? null);
          const fa = flipped ? (full.home ?? null) : (full.away ?? null);
          if (fh !== null && fa !== null && fh !== fa) w = fh > fa ? "home" : "away";
        }
      }
      qualifiedTeam = w;
    } else if (status === "finished") {
      // Partido decidido en 90 min (homeScore/awayScore ya reorientados)
      if (homeScore !== null && awayScore !== null && homeScore !== awayScore) {
        qualifiedTeam = homeScore > awayScore ? "home" : "away";
      }
    }

    const entry = {
      matchId: localId,
      status,
      homeScore,
      awayScore,
      winner: getWinner(homeScore, awayScore),
      duration: isKnockout ? duration.toLowerCase() : "regular",
      extraHome,
      extraAway,
      penHome,
      penAway,
      qualifiedTeam,
      source: "football-data.org",
      updatedAtUtc: new Date().toISOString()
    };

    const existing = resultMap.get(localId);
    // Solo actualizar si hay info nueva (status cambio o hay marcador)
    if (existing && existing.source === "manual" && existing.status === "finished") {
      // No sobreescribir resultados ingresados manualmente que ya estan finalizados
      continue;
    }
    // No degradar: si ya está finalizado (p.ej. cierre provisional de ESPN), no
    // lo regreses a "live" con un snapshot intermedio de football-data. Cuando
    // football-data finalice, sí entra (finished -> finished) y valida/corrige.
    if (existing && existing.status === "finished" && status !== "finished") {
      continue;
    }
    // No borrar un marcador válido con null: football-data a veces devuelve un
    // partido "finished" pero con regularTime/fullTime en null de forma
    // transitoria. Si ya teníamos un marcador, conservamos el bueno; de lo
    // contrario score.js daría 0 y todos perderían los puntos de ese partido
    // hasta el siguiente ciclo (bug de "puntos que se reducen al consultar").
    if (existing && existing.homeScore !== null && existing.awayScore !== null &&
        (homeScore === null || awayScore === null)) {
      continue;
    }

    resultMap.set(localId, entry);
    updated++;
  }

  // ── Cierre rápido vía ESPN (solo fase de grupos) ────────────────────────────
  // Para partidos de grupos ya iniciados que football-data aún no marca finished,
  // si ESPN dice que terminaron, los cerramos de forma provisional. Football-data
  // los valida/corrige en un ciclo posterior (finished oficial pisa al provisional).
  const now = Date.now();
  const espnCandidates = localMatches.filter((m) => {
    if (m.stage !== "group" || !m.kickoffUtc || Date.parse(m.kickoffUtc) >= now) return false;
    const cur = resultMap.get(m.id);
    return !(cur && cur.status === "finished");
  });

  let espnClosed = 0;
  if (espnCandidates.length) {
    const dates = new Set();
    for (const m of espnCandidates) {
      const d = m.kickoffUtc.slice(0, 10).replace(/-/g, "");
      dates.add(d);
      dates.add(prevDayYmd(d)); // cubre el desfase de día de ESPN (agrupa por US Eastern)
    }
    let espnEvents = [];
    try { espnEvents = await getEspnFinals([...dates]); }
    catch (err) { console.warn(`ESPN no disponible: ${err.message}. Sigo solo con football-data.`); }

    for (const m of espnCandidates) {
      const ef = findEspnFinal(m, espnEvents);
      if (!ef || !ef.completed || !Number.isFinite(ef.homeScore) || !Number.isFinite(ef.awayScore)) continue;
      const existing = resultMap.get(m.id);
      if (existing && existing.source === "manual" && existing.status === "finished") continue;
      resultMap.set(m.id, {
        matchId: m.id,
        status: "finished",
        homeScore: ef.homeScore,
        awayScore: ef.awayScore,
        winner: getWinner(ef.homeScore, ef.awayScore),
        duration: "regular",
        extraHome: null,
        extraAway: null,
        penHome: null,
        penAway: null,
        qualifiedTeam: ef.homeScore !== ef.awayScore ? (ef.homeScore > ef.awayScore ? "home" : "away") : null,
        source: "espn-provisional",
        updatedAtUtc: new Date().toISOString(),
      });
      espnClosed++;
      updated++;
    }
  }

  const newResults = {
    results: Array.from(resultMap.values())
  };

  writeJson("results.json", newResults);
  console.log(`Listo. Actualizados: ${updated} (ESPN cerró ${espnClosed}), sin mapear: ${skipped}.`);
  console.log("Recuerda que overrides.json siempre tiene prioridad sobre estos datos.");
}

main().catch((err) => {
  console.error(`Error inesperado: ${err.message}`);
  process.exit(1);
});
