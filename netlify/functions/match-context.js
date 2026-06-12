/**
 * Netlify Function: match-context
 *
 * Proxy seguro para obtener contexto de partido:
 * - Alineaciones y score en vivo desde ESPN
 * - Comentarios de periodistas desde Xpoz
 *
 * Variables de entorno:
 *   XPOZ_API_KEY — Token de Xpoz (opcional, si no está solo devuelve ESPN)
 */

const XPOZ_KEY = process.env.XPOZ_API_KEY || "";

const PERIODISTAS = [
  "DavidFaitelson_", "cmabortin", "LuisGarciaPlays",
  "meabortin", "AztecaDeportes", "TUDNMEX", "JosRamnFernndez1"
];

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const ESPN_SUMMARY = "https://site.web.api.espn.com/apis/site/v2/sports/soccer";

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function getEspnScoreboard(league) {
  return fetchJson(`${ESPN_BASE}/${league}/scoreboard`);
}

async function getEspnSummary(league, eventId) {
  return fetchJson(`${ESPN_SUMMARY}/${league}/summary?event=${eventId}`);
}

async function getXpozCommentary(teams) {
  if (!XPOZ_KEY) return { posts: [], available: false };

  try {
    const res = await fetch("https://mcp.xpoz.ai/mcp", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${XPOZ_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "getTwitterPostsByKeywords",
          arguments: { keywords: teams.join(" "), limit: 15 }
        },
        id: 1
      })
    });

    const data = await res.json();
    let posts = [];

    if (data.result && data.result.content) {
      const text = data.result.content
        .filter(c => c.type === "text")
        .map(c => c.text)
        .join("");

      try {
        const parsed = JSON.parse(text);
        posts = (parsed.posts || parsed.results || parsed || [])
          .slice(0, 15)
          .map(p => ({
            text: p.text || p.content || p.full_text || "",
            author: p.author || p.username || p.screen_name || "",
            likes: p.likes || p.favorite_count || 0,
            retweets: p.retweets || p.retweet_count || 0,
            date: p.created_at || p.date || ""
          }));
      } catch (e) { /* not JSON */ }
    }

    return { posts, available: true };
  } catch (e) {
    return { posts: [], available: false, error: e.message };
  }
}

function normalizeLineups(rosters) {
  if (!rosters || !rosters.length) return null;

  return rosters.map(r => {
    const team = r.team || {};
    const entries = r.roster || [];
    return {
      teamName: team.displayName || team.shortDisplayName || "Equipo",
      teamLogo: team.logo || null,
      formation: r.formation || null,
      starters: entries.filter(p => p.starter).map(normalizePlayer),
      subs: entries.filter(p => !p.starter).map(normalizePlayer)
    };
  });
}

function normalizePlayer(p) {
  const a = p.athlete || {};
  return {
    number: a.jersey || p.jersey || "",
    name: a.displayName || a.shortName || p.displayName || "",
    position: p.position?.abbreviation || a.position?.abbreviation || "",
    subbedIn: !!p.subbedIn,
    subbedOut: !!p.subbedOut,
    yellowCard: !!(p.yellowCard || p.didYellowCard),
    redCard: !!(p.redCard || p.didRedCard)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let body;
  try { body = JSON.parse(event.body); } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { action, league, eventId, teams } = body;

  try {
    if (action === "scoreboard") {
      const data = await getEspnScoreboard(league || "fifa.world");
      return ok(data);
    }

    if (action === "summary" && eventId) {
      const data = await getEspnSummary(league || "fifa.world", eventId);
      const lineups = normalizeLineups(data.rosters);
      return ok({ lineups, raw: { header: data.header } });
    }

    if (action === "commentary" && teams) {
      // Use ESPN play-by-play commentary instead of Xpoz
      const league2 = league || "fifa.world";
      const sb = await getEspnScoreboard(league2);
      const events = sb.events || [];
      // Find event matching teams
      const t0 = (teams[0] || "").toLowerCase(), t1 = (teams[1] || "").toLowerCase();
      const evt = events.find(e => {
        const c = e.competitions?.[0];
        if (!c) return false;
        const names = (c.competitors || []).map(x => (x.team?.displayName || "").toLowerCase());
        return names.some(n => n.includes(t0) || t0.includes(n)) &&
               names.some(n => n.includes(t1) || t1.includes(n));
      });
      if (!evt) return ok({ commentary: [], available: false, reason: "match not found in ESPN" });
      const summary = await getEspnSummary(league2, evt.id);
      const commentary = (summary.commentary || []).map(c => ({
        time: c.time?.displayValue || "",
        text: c.text || "",
        type: c.play?.type?.type || null,
      }));
      const keyEvents = (summary.keyEvents || []).map(e => ({
        time: e.clock?.displayValue || "",
        text: e.text || e.shortText || "",
        type: e.type?.type || null,
        team: e.team?.displayName || null,
      }));
      return ok({ commentary, keyEvents, available: true });
    }

    return { statusCode: 400, body: "Missing action or params" };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};

function ok(data) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify(data)
  };
}
