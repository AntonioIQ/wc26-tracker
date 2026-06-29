/**
 * Resuelve los equipos reales de la fase eliminatoria a partir de la tabla de
 * grupos y la propagación de ganadores. Los partidos de knockout vienen con
 * placeholders ("1st Group A", "Best 3rd (A/B/C/D/F)", "W74", "L101") y aquí se
 * sustituyen por los equipos ya decididos. Solo resuelve lo matemáticamente
 * determinado; el resto queda en placeholder.
 *
 * IMPORTANTE: mantener en sync con resolveBracket() de app/app.js (misma lógica;
 * la diferencia es que aquí recibe matches + array de results por separado, en
 * vez de matches con .result ya adjunto).
 */

// Slots de R32 que reciben un "mejor tercero": id de partido → grupos elegibles.
const THIRD_SLOTS = {
  "match-074": ["A", "B", "C", "D", "F"],
  "match-077": ["C", "D", "F", "G", "H"],
  "match-079": ["C", "E", "F", "H", "I"],
  "match-080": ["E", "H", "I", "J", "K"],
  "match-081": ["B", "E", "F", "I", "J"],
  "match-082": ["A", "E", "H", "I", "J"],
  "match-085": ["E", "F", "G", "I", "J"],
  "match-087": ["D", "E", "I", "J", "L"],
};

// Asignación oficial FIFA por combinación de grupos cuyo 3° clasifica (495
// combinaciones). Anclamos la combinación real del torneo; si los resultados
// arrojaran otra, caemos a un emparejamiento que respeta los grupos elegibles.
const THIRD_ALLOCATION = {
  "BDEFIJKL": { "match-074": "D", "match-077": "F", "match-079": "E", "match-080": "K", "match-081": "B", "match-082": "I", "match-085": "J", "match-087": "L" },
};

const normalizeStage = (s) => (s === "quarter-final" ? "quarterfinal" : s === "semi-final" ? "semifinal" : s);

function buildStandings(groupMatches, resultMap) {
  const t = {};
  for (const m of groupMatches) {
    [m.homeTeam, m.awayTeam].forEach((n) => { if (!t[n]) t[n] = { name: n, g: 0, gf: 0, gc: 0, pts: 0 }; });
    const r = resultMap.get(m.id);
    if (!r || r.homeScore == null) continue;
    const h = r.homeScore, a = r.awayScore;
    t[m.homeTeam].gf += h; t[m.homeTeam].gc += a;
    t[m.awayTeam].gf += a; t[m.awayTeam].gc += h;
    if (h > a) { t[m.homeTeam].g++; t[m.homeTeam].pts += 3; }
    else if (h < a) { t[m.awayTeam].g++; t[m.awayTeam].pts += 3; }
    else { t[m.homeTeam].pts++; t[m.awayTeam].pts++; }
  }
  return Object.values(t).sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf);
}

// Empareja (backtracking) grupos clasificados con slots respetando elegibilidad.
function matchThirdsToSlots(qualGroups) {
  const slotIds = Object.keys(THIRD_SLOTS);
  const out = {};
  const used = new Set();
  function bt(i) {
    if (i === slotIds.length) return used.size === qualGroups.length;
    for (const g of THIRD_SLOTS[slotIds[i]]) {
      if (qualGroups.includes(g) && !used.has(g)) {
        used.add(g); out[slotIds[i]] = g;
        if (bt(i + 1)) return true;
        used.delete(g); delete out[slotIds[i]];
      }
    }
    return false;
  }
  return bt(0) ? out : null;
}

/**
 * @param {Array} matches  matches.json -> matches (no se muta; se devuelve copia)
 * @param {Array} results  results.json -> results
 * @returns {Array} copia de matches con homeTeam/awayTeam resueltos donde se pueda
 */
function resolveBracket(matches, results) {
  const resultMap = new Map((results || []).map((r) => [r.matchId, r]));
  const out = matches.map((m) => ({ ...m }));
  const byId = new Map(out.map((m) => [m.id, m]));
  const pad3 = (n) => String(n).padStart(3, "0");
  const isFinished = (m) => { const r = resultMap.get(m.id); return !!r && (r.status === "finished" || r.status === "FINISHED"); };

  // 1) Tabla de cada grupo
  const groups = {}, standings = {}, groupDone = {};
  out.forEach((m) => { if (normalizeStage(m.stage) === "group") (groups[m.group] = groups[m.group] || []).push(m); });
  for (const [g, ms] of Object.entries(groups)) {
    standings[g] = buildStandings(ms, resultMap);
    groupDone[g] = ms.every(isFinished);
  }
  const allGroupsDone = Object.keys(groups).length > 0 && Object.values(groupDone).every(Boolean);

  // 2) Mejores terceros (solo cuando todos los grupos terminaron)
  let thirdByMatch = {};
  if (allGroupsDone) {
    // ojo: los objetos de buildStandings ya usan `g` (partidos ganados), por eso
    // la letra del grupo va en `grp` para no pisarla con el spread.
    const thirds = Object.entries(standings)
      .filter(([, t]) => t.length >= 3)
      .map(([grp, t]) => ({ grp, ...t[2] }))
      .sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf);
    const qualGroups = thirds.slice(0, 8).map((x) => x.grp);
    const alloc = THIRD_ALLOCATION[[...qualGroups].sort().join("")] || matchThirdsToSlots(qualGroups);
    if (alloc) {
      const teamByGroup = Object.fromEntries(thirds.map((x) => [x.grp, x.name]));
      for (const [sid, g] of Object.entries(alloc)) thirdByMatch[sid] = teamByGroup[g];
    }
  }

  // 3) Ganador / perdedor de un partido ya resuelto y terminado
  const teamResolved = (name) => name && !/Group [A-L]|Best 3rd|^[WL]\d+/.test(name);
  const sideWinner = (m) => {
    const r = resultMap.get(m.id) || {};
    if (r.qualifiedTeam === "home" || r.qualifiedTeam === "away") return r.qualifiedTeam;
    if (r.homeScore > r.awayScore) return "home";
    if (r.awayScore > r.homeScore) return "away";
    return null;
  };
  const winnerOf = (m) => {
    if (!m || !isFinished(m)) return null;
    const s = sideWinner(m); if (!s) return null;
    const name = s === "home" ? m.homeTeam : m.awayTeam;
    return teamResolved(name) ? name : null;
  };
  const loserOf = (m) => {
    if (!m || !isFinished(m)) return null;
    const s = sideWinner(m); if (!s) return null;
    const name = s === "home" ? m.awayTeam : m.homeTeam;
    return teamResolved(name) ? name : null;
  };

  // 4) Resolver un placeholder individual → nombre real o null
  const resolveSlot = (token, matchId) => {
    let mm;
    if ((mm = /^1st Group ([A-L])$/.exec(token))) return groupDone[mm[1]] ? standings[mm[1]][0].name : null;
    if ((mm = /^2nd Group ([A-L])$/.exec(token))) return groupDone[mm[1]] ? standings[mm[1]][1].name : null;
    if (/^Best 3rd/.test(token)) return thirdByMatch[matchId] || null;
    if ((mm = /^W(\d+)$/.exec(token))) return winnerOf(byId.get("match-" + pad3(mm[1])));
    if ((mm = /^L(\d+)$/.exec(token))) return loserOf(byId.get("match-" + pad3(mm[1])));
    return null;
  };

  // 5) Recorrer en orden de id (R32→R16→…→final) mutando la copia
  const ko = out.filter((m) => normalizeStage(m.stage) !== "group").sort((a, b) => a.id.localeCompare(b.id));
  for (const m of ko) {
    if (!teamResolved(m.homeTeam)) { const r = resolveSlot(m.homeTeam, m.id); if (r) m.homeTeam = r; }
    if (!teamResolved(m.awayTeam)) { const r = resolveSlot(m.awayTeam, m.id); if (r) m.awayTeam = r; }
  }
  return out;
}

module.exports = { resolveBracket, buildStandings };
