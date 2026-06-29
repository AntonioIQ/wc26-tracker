// =====================================================
// QUINIELA 26 — Vanilla JS port
// Visual: Volt palette, mobile-first, hi-fi.
// Backend integrations preserved:
//   - Netlify Identity (auth)
//   - GitHub raw + local fallback (data)
//   - Open-Meteo (weather)
//   - /.netlify/functions/save-picks (save)
//   - /.netlify/functions/match-context (live drawer)
// =====================================================

// ────────────────── CONSTANTS ──────────────────
const GH_RAW = "https://raw.githubusercontent.com/AntonioIQ/wc26-tracker/main/data";
const DATA_URLS = {
  matches: `${GH_RAW}/matches.json`,
  results: `${GH_RAW}/results.json`,
  leaderboard: `${GH_RAW}/leaderboard.json`,
  overrides: `${GH_RAW}/overrides.json`,
  venues: `${GH_RAW}/venues.json`,
};
const DATA_LOCAL = {
  matches: "./data/matches.json",
  results: "./data/results.json",
  leaderboard: "./data/leaderboard.json",
  overrides: "./data/overrides.json",
  venues: "./data/venues.json",
};

const STORAGE_KEY = "quiniela-wc26-draft";
const PROFILE_KEY = "quiniela-wc26-profile";

const FLAGS = {
  "Mexico":"🇲🇽","South Africa":"🇿🇦","South Korea":"🇰🇷","Czechia":"🇨🇿","Canada":"🇨🇦",
  "Bosnia and Herzegovina":"🇧🇦","Qatar":"🇶🇦","Switzerland":"🇨🇭","United States":"🇺🇸",
  "Paraguay":"🇵🇾","Australia":"🇦🇺","Turkey":"🇹🇷","Brazil":"🇧🇷","Morocco":"🇲🇦",
  "Haiti":"🇭🇹","Scotland":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","Germany":"🇩🇪","Curacao":"🇨🇼","Netherlands":"🇳🇱",
  "Japan":"🇯🇵","Ivory Coast":"🇨🇮","Cote d'Ivoire":"🇨🇮","Ecuador":"🇪🇨","Sweden":"🇸🇪",
  "Tunisia":"🇹🇳","Spain":"🇪🇸","Cape Verde":"🇨🇻","Belgium":"🇧🇪","Egypt":"🇪🇬",
  "Saudi Arabia":"🇸🇦","Uruguay":"🇺🇾","Iran":"🇮🇷","New Zealand":"🇳🇿","France":"🇫🇷",
  "Senegal":"🇸🇳","Iraq":"🇮🇶","Norway":"🇳🇴","Argentina":"🇦🇷","Algeria":"🇩🇿",
  "Austria":"🇦🇹","Jordan":"🇯🇴","Portugal":"🇵🇹","DR Congo":"🇨🇩","England":"🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Croatia":"🇭🇷","Ghana":"🇬🇭","Panama":"🇵🇦","Uzbekistan":"🇺🇿","Colombia":"🇨🇴",
  "Italy":"🇮🇹","Poland":"🇵🇱","Serbia":"🇷🇸","Wales":"🏴󠁧󠁢󠁷󠁬󠁳󠁿","Denmark":"🇩🇰",
};

const ISO = {
  "Mexico":"MEX","South Africa":"RSA","South Korea":"KOR","Czechia":"CZE","Canada":"CAN",
  "Bosnia and Herzegovina":"BIH","Qatar":"QAT","Switzerland":"SUI","United States":"USA",
  "Paraguay":"PAR","Australia":"AUS","Turkey":"TUR","Brazil":"BRA","Morocco":"MAR",
  "Haiti":"HAI","Scotland":"SCO","Germany":"GER","Netherlands":"NED","Japan":"JPN",
  "Ivory Coast":"CIV","Cote d'Ivoire":"CIV","Ecuador":"ECU","Sweden":"SWE","Tunisia":"TUN",
  "Spain":"ESP","Cape Verde":"CPV","Belgium":"BEL","Egypt":"EGY","Saudi Arabia":"KSA",
  "Uruguay":"URU","Iran":"IRN","New Zealand":"NZL","France":"FRA","Senegal":"SEN",
  "Iraq":"IRQ","Norway":"NOR","Argentina":"ARG","Algeria":"ALG","Austria":"AUT",
  "Jordan":"JOR","Portugal":"POR","DR Congo":"COD","England":"ENG","Croatia":"CRO",
  "Ghana":"GHA","Panama":"PAN","Uzbekistan":"UZB","Colombia":"COL","Italy":"ITA",
  "Poland":"POL","Serbia":"SRB","Wales":"WAL","Denmark":"DEN",
};

const SHORT = {
  "South Africa":"SUDÁFRICA","South Korea":"COREA","Bosnia and Herzegovina":"BOSNIA",
  "United States":"USA","Czechia":"R. CHECA","DR Congo":"RD CONGO",
  "Cote d'Ivoire":"C. MARFIL","Ivory Coast":"C. MARFIL","Saudi Arabia":"ARABIA",
  "Netherlands":"P. BAJOS","New Zealand":"N. ZELANDA","Cape Verde":"C. VERDE",
  "Mexico":"MÉXICO","Brazil":"BRASIL","Spain":"ESPAÑA","Italy":"ITALIA",
  "Germany":"ALEMANIA","France":"FRANCIA","Belgium":"BÉLGICA","Switzerland":"SUIZA",
  "Croatia":"CROACIA","Portugal":"PORTUGAL","Japan":"JAPÓN","Morocco":"MARRUECOS",
  "Tunisia":"TÚNEZ","Senegal":"SENEGAL","Cameroon":"CAMERÚN","Egypt":"EGIPTO",
  "Argentina":"ARGENTINA","Ecuador":"ECUADOR","Colombia":"COLOMBIA","Paraguay":"PARAGUAY",
  "Uruguay":"URUGUAY","Australia":"AUSTRALIA","Norway":"NORUEGA","Turkey":"TURQUÍA",
  "Iran":"IRÁN","Algeria":"ARGELIA","Austria":"AUSTRIA","Canada":"CANADÁ",
  "Ghana":"GHANA","Panama":"PANAMÁ","England":"INGLATERRA","Qatar":"QATAR",
  "Jordan":"JORDANIA","Uzbekistan":"UZBEKISTÁN","Scotland":"ESCOCIA","Nigeria":"NIGERIA",
};

const STAGE_LONG = {
  "group":"FASE DE GRUPOS","round-of-32":"DIECISEISAVOS","round-of-16":"OCTAVOS",
  "quarterfinal":"CUARTOS","quarter-final":"CUARTOS","semifinal":"SEMIFINAL","semi-final":"SEMIFINAL",
  "third-place":"3ER LUGAR","final":"GRAN FINAL",
};
const STAGE_BADGE = {
  "group":"badge-group","round-of-32":"badge-r32","round-of-16":"badge-r16",
  "quarterfinal":"badge-qf","quarter-final":"badge-qf",
  "semifinal":"badge-sf","semi-final":"badge-sf",
  "third-place":"badge-final","final":"badge-final",
};
const STAGE_SHORT = {
  "group":"GRUPOS","round-of-32":"16avos","round-of-16":"Octavos",
  "quarterfinal":"Cuartos","quarter-final":"Cuartos",
  "semifinal":"Semis","semi-final":"Semis","third-place":"3er Lugar","final":"FINAL",
};

const AVATAR_OPTIONS = ["⚽","🦁","🐯","🦅","🐉","🔥","⭐","💎","🎯","🏆","👑","🎩","🤖","🦈","🐺","🦂","🐢","🦉","🎪","🚀","🌮","🍕","🎸","🎲","💀","🧠","🦾","🫡"];

const WMO_ICONS = {"0":"☀️","1":"🌤️","2":"⛅","3":"☁️","45":"🌫️","48":"🌫️","51":"🌦️","53":"🌦️","55":"🌧️","61":"🌧️","63":"🌧️","65":"🌧️","71":"🌨️","73":"🌨️","75":"🌨️","80":"🌦️","81":"🌧️","82":"⛈️","95":"⛈️","96":"⛈️","99":"⛈️"};
const WMO_DESC = {"0":"Despejado","1":"Mayormente despejado","2":"Parcialmente nublado","3":"Nublado","45":"Neblina","48":"Neblina","51":"Llovizna","53":"Llovizna","55":"Llovizna fuerte","61":"Lluvia ligera","63":"Lluvia","65":"Lluvia fuerte","71":"Nieve","73":"Nieve","75":"Nieve fuerte","80":"Chubascos","81":"Chubascos","82":"Tormenta","95":"Tormenta","96":"Tormenta","99":"Tormenta"};

// ────────────────── STATE ──────────────────
const state = {
  currentUser: null,
  matches: [],            // merged with results + status
  rawMatches: [],
  results: {},            // by id
  venues: [],
  leaderboard: { entries: [] },
  picks: {},              // committed
  draft: {},              // unsaved edits
  tab: "picks",
  filter: "proximos",
  selectedDay: null,
  mapInstance: null,
  live: {},               // marcadores en vivo de ESPN, por matchId (solo display)
};

// ────────────────── HELPERS ──────────────────
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const flag = (team) => FLAGS[team] || "🏳️";
const iso = (team) => ISO[team] || (team ? team.slice(0,3).toUpperCase() : "TBD");
const shortName = (team) => {
  if (!team) return "";
  if (SHORT[team]) return SHORT[team];
  if (/Group [A-L]/.test(team)) {
    const letter = team.match(/Group ([A-L])/)[1];
    const ord = team.startsWith("1st") ? "1°" : team.startsWith("2nd") ? "2°" : "?";
    return `${ord} GRUPO ${letter}`;
  }
  if (/Best 3rd/.test(team)) return "MEJOR 3°";
  if (/Winner Match/.test(team)) return team.replace("Winner Match ", "GAN. ");
  return team.toUpperCase();
};
const slugify = (v) => String(v||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
const normalizeStage = (s) => (s === "quarter-final" ? "quarterfinal" : s === "semi-final" ? "semifinal" : s);
const fmtTime = (iso) => new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City", hour12: false });
// ESPN agrupa los partidos por fecha del Este de EE.UU. (no UTC): un partido a
// las 04:00Z cae en el día siguiente al de uno a la 01:00Z. Devuelve YYYYMMDD en
// America/New_York para pedir el scoreboard del día correcto (?dates=).
const espnDate = (iso) => iso
  ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso)).replace(/-/g, "")
  : undefined;
const fmtDay = (iso) => {
  const d = new Date(iso);
  const day = d.toLocaleDateString("es-MX", { weekday: "short", timeZone: "America/Mexico_City" }).toUpperCase().replace(".","");
  const num = d.toLocaleDateString("es-MX", { day: "2-digit", timeZone: "America/Mexico_City" });
  const mon = d.toLocaleDateString("es-MX", { month: "short", timeZone: "America/Mexico_City" }).toUpperCase().replace(".","");
  return { day, num, mon };
};
const dayKey = (iso) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
const fmtCountdown = (ms) => {
  ms = Math.max(0, ms);
  const t = Math.floor(ms / 1000);
  const d = Math.floor(t / 86400), h = Math.floor((t % 86400) / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  if (d >= 1) return `${d}d ${h}h`;
  if (h >= 1) return `${h}h ${m}m`;
  if (m >= 1) return `${m}m ${s}s`;
  return `${s}s`;
};
const fmtCountdownParts = (ms) => {
  ms = Math.max(0, ms);
  const t = Math.floor(ms / 1000);
  return {
    d: Math.floor(t / 86400),
    h: Math.floor((t % 86400) / 3600),
    m: Math.floor((t % 3600) / 60),
    s: t % 60,
  };
};

function escapeHTML(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

// ────────────────── DATA FETCH ──────────────────
// Cache-busting: GitHub Raw CDN cachea 5 min y Safari iOS ignora "no-store".
// Agregar ?t=timestamp obliga a leer la última versión.
function bust(url) { return url + (url.includes("?") ? "&" : "?") + "t=" + Date.now(); }

async function fetchJson(url) {
  try {
    const r = await fetch(bust(url), { cache: "no-store" });
    if (!r.ok) throw new Error(`Error ${r.status} ${url}`);
    return r.json();
  } catch (e) {
    const key = Object.keys(DATA_URLS).find(k => DATA_URLS[k] === url);
    if (key && DATA_LOCAL[key]) {
      const r2 = await fetch(bust(DATA_LOCAL[key]), { cache: "no-store" });
      if (!r2.ok) throw new Error(`Error ${DATA_LOCAL[key]}`);
      return r2.json();
    }
    throw e;
  }
}

function mergeData(matches, results, overrides) {
  const bm = new Map(results.map(r => [r.matchId, r]));
  const om = new Map((overrides?.results || []).map(r => [r.matchId, r]));
  return matches.map(m => {
    const r = om.get(m.id) || bm.get(m.id) || {};
    return { ...m, result: r, displayStatus: r.status || m.status || "scheduled" };
  });
}

function matchState(m) {
  const now = Date.now();
  const ko = Date.parse(m.kickoffUtc);
  const lk = Date.parse(m.lockUtc);
  const finished = m.displayStatus === "finished" || m.displayStatus === "FINISHED";
  const espnState = state.live[m.id] && state.live[m.id].state;
  const live = !finished && (espnState === "in" || (now >= ko && now < ko + 110 * 60 * 1000));
  const locked = now >= lk;
  return { locked, live, finished, ko, lk };
}

// ────────────────── AUTH ──────────────────
function initAuth() {
  $("#btn-login").addEventListener("click", () => netlifyIdentity.open("login"));
  $("#btn-guest").addEventListener("click", () => {
    state.currentUser = { email: "guest@local", user_metadata: { full_name: "Invitado" }, token: null };
    showApp();
  });
  $("#btn-logout").addEventListener("click", () => netlifyIdentity.logout());
  netlifyIdentity.on("login", (u) => { state.currentUser = u; netlifyIdentity.close(); showApp(); });
  netlifyIdentity.on("logout", () => { state.currentUser = null; showAuth(); });
  const u = netlifyIdentity.currentUser();
  if (u) { state.currentUser = u; showApp(); } else { showAuth(); }
}
function showAuth() {
  $("#auth-screen").style.display = "";
  $("#app-main").style.display = "none";
  $("#global-loading").classList.add("hide");
}
function showApp() {
  $("#auth-screen").style.display = "none";
  $("#app-main").style.display = "flex";
  $("#global-loading").classList.remove("hide");
  $("#user-display").textContent = (getProfile().displayName || state.currentUser?.user_metadata?.full_name || state.currentUser?.email || "Tú");
  boot();
}

// ────────────────── PROFILE ──────────────────
function getProfile() {
  try { const raw = localStorage.getItem(PROFILE_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
function saveProfile(p) { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); }

// Mapa legacy: correos cuyo archivo de picks NO coincide con el prefijo del
// correo (cuentas antiguas). Debe estar en sync con EMAIL_TO_SLUG de save-picks.js.
const LEGACY_EMAIL_MAP = {
  "jacher7@gmail.com": "jacob",
  "ldrinaldi73@gmail.com": "luisdanielrinaldi",
};

function getStableUserId() {
  const profile = getProfile();
  const email = (state.currentUser?.email || "").toLowerCase();

  // La identidad se deriva SIEMPRE del correo autenticado (no del userId
  // cacheado en el navegador). Esto evita que un mismo correo termine con dos
  // archivos de picks si el caché local diverge entre dispositivos/sesiones.
  if (email) {
    const id = LEGACY_EMAIL_MAP[email] || slugify(email.split("@")[0]);
    if (profile.userId !== id) { profile.userId = id; saveProfile(profile); }
    return id;
  }

  // Sin correo (caso borde): usar caché previo o nombre.
  if (profile.userId) return profile.userId;
  const id = slugify(state.currentUser?.user_metadata?.full_name) || "anon";
  profile.userId = id; saveProfile(profile);
  return id;
}

function renderHeaderAvatar(avatar) {
  const el = $("#header-avatar");
  if (avatar?.startsWith("data:")) {
    el.innerHTML = `<img src="${escapeHTML(avatar)}" alt="">`;
  } else {
    el.innerHTML = `<span>${avatar || "⚽"}</span>`;
  }
}
function renderAvatarPreview(avatar) {
  const el = $("#account-avatar-preview");
  if (avatar?.startsWith("data:")) {
    el.innerHTML = `<img src="${escapeHTML(avatar)}" alt="">`;
  } else {
    el.textContent = avatar || "⚽";
  }
}

// ────────────────── WEATHER ──────────────────
async function loadWeatherBar() {
  const now = Date.now();
  const nextMatch = state.matches
    .filter(m => Date.parse(m.kickoffUtc) > now - 60*60*1000)
    .sort((a,b) => Date.parse(a.kickoffUtc) - Date.parse(b.kickoffUtc))[0];
  if (!nextMatch) return;
  const venue = state.venues.find(v => nextMatch.venue?.includes(v.name) || nextMatch.venue?.split(",")[0]?.trim() === v.name);
  const lat = venue?.lat ?? 19.3029;
  const lng = venue?.lng ?? -99.1505;
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`);
    if (!r.ok) return;
    const d = (await r.json()).current;
    const icon = WMO_ICONS[String(d.weather_code)] || "🌡️";
    const desc = WMO_DESC[String(d.weather_code)] || "";
    const city = venue?.city || nextMatch.venue?.split(",")[1]?.trim() || "Ciudad de México";
    const bar = $("#weather-bar");
    bar.innerHTML = `
      <span class="wb-icon">${icon}</span>
      <span class="wb-temp">${Math.round(d.temperature_2m)}°</span>
      <span class="wb-divider"></span>
      <span class="wb-venue">
        <span class="wb-city">${escapeHTML(city)}</span>
        <span class="wb-desc">${escapeHTML(desc)}</span>
      </span>
      <span class="wb-live">PRÓX. PARTIDO</span>`;
    bar.style.display = "";
  } catch {}
}

// ────────────────── BOTTOM NAV ──────────────────
const TABS = [
  { id: "picks", label: "Picks", svg: `<path d="m18 2 4 4-14 14H4v-4z"/>` },
  { id: "tabla", label: "Tabla", svg: `<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M6 4h12v7a6 6 0 0 1-12 0z"/><path d="M9 22h6M12 22v-4"/>` },
  { id: "grupos", label: "Grupos", svg: `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>` },
  { id: "calendario", label: "Calend.", svg: `<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>` },
  { id: "bracket", label: "Llaves", svg: `<path d="M6 3v6a3 3 0 0 0 3 3 3 3 0 0 1 3 3v6M18 3v6a3 3 0 0 1-3 3"/>` },
  { id: "sedes", label: "Sedes", svg: `<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>` },
];

function renderBottomNav() {
  $("#bottom-nav").innerHTML = TABS.map(t => `
    <button class="bn-btn ${state.tab === t.id ? "active" : ""}" data-tab="${t.id}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${t.svg}</svg>
      <span>${t.label}</span>
      ${t.id === "picks" && pendingCount() > 0 ? '<span class="badge-dot"></span>' : ""}
    </button>
  `).join("");
}

function switchTab(id) {
  state.tab = id;
  $$(".tab-panel").forEach(p => p.classList.remove("active"));
  $(`#tab-${id}`).classList.add("active");
  $("#scroll-area").scrollTop = 0;
  renderBottomNav();
  renderCurrentTab();
}

function renderCurrentTab() {
  switch (state.tab) {
    case "picks": renderPicks(); break;
    case "tabla": renderTabla(); break;
    case "grupos": renderGrupos(); break;
    case "calendario": renderCalendario(); break;
    case "bracket": renderBracket(); break;
    case "sedes": renderSedes(); break;
  }
}

// ────────────────── PICKS DRAFT ──────────────────
const displayPicks = () => ({ ...state.picks, ...state.draft });
const pendingCount = () => Object.keys(state.draft).length;
function isPickFilled(p) { return p && p.homeScore != null && p.awayScore != null && p.homeScore !== "" && p.awayScore !== ""; }

function setPick(matchId, pick) {
  state.draft = { ...state.draft, [matchId]: pick };
  refreshSaveBar();
  refreshDot();
}
function refreshSaveBar() {
  const n = pendingCount();
  $("#save-bar").classList.toggle("show", n > 0);
  $("#save-count").textContent = n;
}
function refreshDot() {
  // Bottom nav badge-dot for picks; cheaper to re-render just the picks button
  const btn = $('.bn-btn[data-tab="picks"]');
  if (!btn) return;
  let dot = btn.querySelector(".badge-dot");
  if (pendingCount() > 0) {
    if (!dot) { dot = document.createElement("span"); dot.className = "badge-dot"; btn.appendChild(dot); }
  } else if (dot) dot.remove();
}

// ────────────────── PICK CARD ──────────────────
function pickCardHTML(m, opts = {}) {
  const stage = normalizeStage(m.stage);
  const badgeCls = STAGE_BADGE[stage] || "badge-group";
  const stageLabel = stage === "group" ? `GRUPO ${m.group}` : (STAGE_SHORT[stage] || stage).toUpperCase();
  const st = matchState(m);
  const pick = displayPicks()[m.id];
  const filled = isPickFilled(pick);
  const home = m.homeTeam, away = m.awayTeam;
  const homeFlag = flag(home), awayFlag = flag(away);
  const cls = [
    "pick-card",
    filled ? "is-filled" : "",
    st.live ? "is-live" : "",
    st.locked && !st.live ? "is-locked" : "",
    st.finished ? "is-finished" : "",
  ].join(" ");

  let pts = null;
  if (st.finished && m.result && filled) {
    const rh = m.result.homeScore, ra = m.result.awayScore;
    const ph = Number(pick.homeScore), pa = Number(pick.awayScore);
    if (rh === ph && ra === pa) pts = 3;
    else if (Math.sign(rh - ra) === Math.sign(ph - pa)) pts = 1;
    else pts = 0;
  }

  const lockBadge = st.live ? "" :
    st.locked ? `<span class="lock-dot"></span><span style="font-size:9.5px;color:var(--accent-3);font-weight:700;letter-spacing:0.06em;white-space:nowrap">CERRADO</span>` :
    `<span style="font-size:9.5px;color:var(--text-muted);font-family:var(--font-mono);white-space:nowrap">Cierra en ${fmtCountdown(st.lk - Date.now())}</span>`;

  const ptsBadge = pts !== null ? `<span class="pc-points ${pts === 0 ? "zero" : ""}">+${pts} pts</span>` :
    st.live ? `<span class="pc-status live">EN VIVO</span>` :
    filled ? `<span class="pc-status filled">✓ PICK LISTO</span>` :
    `<span class="pc-status" style="color:var(--text-muted)">SIN PICK</span>`;

  // Marcador en vivo de ESPN: se sobrepone al de results.json mientras el partido
  // no esté finalizado oficialmente, para que el calendario no quede atrasado.
  const ls = state.live[m.id];
  const liveOn = ls && ls.homeScore != null && !st.finished;
  const liveDot = liveOn && ls.state === "in"
    ? `<span title="En vivo (ESPN)" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--live);margin-right:4px;vertical-align:middle"></span>`
    : "";
  const dispH = liveOn ? ls.homeScore : (m.result?.homeScore ?? "–");
  const dispA = liveOn ? ls.awayScore : (m.result?.awayScore ?? "–");
  const liveStyle = liveOn ? "color:var(--live);" : "";

  const showInputs = !opts.readonly;
  const scoreCol = showInputs ? `
    <div class="pc-score" data-stop>
      <input class="pc-input ${pick?.homeScore != null && pick.homeScore !== "" ? "has-value" : ""}" type="number" min="0" max="99" inputmode="numeric" placeholder="–" value="${pick?.homeScore ?? ""}" ${st.locked ? "disabled" : ""} data-match="${m.id}" data-side="home" aria-label="Goles local">
      <span class="pc-sep">–</span>
      <input class="pc-input ${pick?.awayScore != null && pick.awayScore !== "" ? "has-value" : ""}" type="number" min="0" max="99" inputmode="numeric" placeholder="–" value="${pick?.awayScore ?? ""}" ${st.locked ? "disabled" : ""} data-match="${m.id}" data-side="away" aria-label="Goles visitante">
    </div>` : `
    <div class="pc-score">
      <div class="pc-input" style="border-color:transparent;background:transparent;font-size:18px;${liveStyle}">${liveDot}${dispH}</div>
      <span class="pc-sep">–</span>
      <div class="pc-input" style="border-color:transparent;background:transparent;font-size:18px;${liveStyle}">${dispA}</div>
    </div>`;

  return `
    <div class="${cls}" data-match-id="${m.id}" data-open-match="${m.id}">
      <div class="pc-top">
        <div class="left">
          <span class="badge ${badgeCls}">${stageLabel}</span>
          <span class="time">${fmtTime(m.kickoffUtc)}</span>
        </div>
        <div class="left">${lockBadge}</div>
      </div>
      <div class="pc-body">
        <div class="pc-teams">
          <div class="pc-team">
            <span class="flag">${homeFlag}</span>
            <div class="info">
              <span class="nm">${escapeHTML(shortName(home))}</span>
              <span class="iso">${escapeHTML(iso(home))}</span>
            </div>
          </div>
          ${scoreCol}
          <div class="pc-team away">
            <span class="flag">${awayFlag}</span>
            <div class="info">
              <span class="nm">${escapeHTML(shortName(away))}</span>
              <span class="iso">${escapeHTML(iso(away))}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="pc-footer">
        <span class="pc-venue">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          <span class="v-name">${escapeHTML(m.venue?.split(",")[0] || "Por confirmar")}</span>
        </span>
        ${ptsBadge}
      </div>
    </div>`;
}

// ────────────────── MI QUINIELA ──────────────────
function renderPicks() {
  const now = Date.now();
  const ms = state.matches;
  const upcoming = ms.filter(m => Date.parse(m.kickoffUtc) > now).sort((a,b) => Date.parse(a.kickoffUtc) - Date.parse(b.kickoffUtc));
  const next = upcoming[0];
  const totalMatches = ms.length;
  const filledCount = Object.values(displayPicks()).filter(isPickFilled).length;
  const lockedSoon = ms.filter(m => {
    const dt = Date.parse(m.lockUtc) - now;
    return dt > 0 && dt < 24*3600*1000;
  }).length;

  const filters = [
    { id: "proximos", label: "Próximos", count: Math.min(12, upcoming.length) },
    { id: "hoy", label: "Hoy", count: ms.filter(m => dayKey(m.kickoffUtc) === dayKey(new Date(now).toISOString())).length },
    { id: "semana", label: "Esta semana", count: ms.filter(m => { const dt = Date.parse(m.kickoffUtc); return dt >= now - 24*3600*1000 && dt <= now + 7*24*3600*1000; }).length },
    { id: "vacios", label: "Sin pick", count: totalMatches - filledCount },
    { id: "grupos", label: "Grupos", count: ms.filter(m => normalizeStage(m.stage) === "group").length },
    { id: "eliminatoria", label: "Eliminatoria", count: ms.filter(m => normalizeStage(m.stage) !== "group").length },
  ];

  let visible;
  switch (state.filter) {
    case "proximos":
      visible = ms.filter(m => Date.parse(m.kickoffUtc) > now - 2*60*60*1000)
                  .sort((a,b) => Date.parse(a.kickoffUtc) - Date.parse(b.kickoffUtc))
                  .slice(0, 12);
      break;
    case "hoy":
      visible = ms.filter(m => dayKey(m.kickoffUtc) === dayKey(new Date(now).toISOString()));
      break;
    case "semana":
      visible = ms.filter(m => { const dt = Date.parse(m.kickoffUtc); return dt >= now - 24*3600*1000 && dt <= now + 7*24*3600*1000; });
      break;
    case "vacios":
      visible = ms.filter(m => {
        const p = displayPicks()[m.id];
        return !p || p.homeScore == null || p.awayScore == null || p.homeScore === "" || p.awayScore === "";
      }).slice(0, 60);
      break;
    case "grupos":
      visible = ms.filter(m => normalizeStage(m.stage) === "group");
      break;
    case "eliminatoria":
      visible = ms.filter(m => normalizeStage(m.stage) !== "group");
      break;
    default:
      visible = ms;
  }

  // Group by day
  const grouped = {};
  visible.forEach(m => { const k = dayKey(m.kickoffUtc); (grouped[k] = grouped[k] || []).push(m); });
  const days = Object.keys(grouped).sort();

  const heroHTML = next ? heroCardHTML(next) : "";

  const summaryHTML = `
    <div class="summary-strip">
      <div class="summary-card accent">
        <div class="label">Tus picks</div>
        <div class="value">${filledCount}<span class="sub">/${totalMatches}</span></div>
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${(filledCount/totalMatches)*100}%"></div></div>
      </div>
      <div class="summary-card accent-lime">
        <div class="label">Próx. cierre</div>
        <div class="value" style="font-size:16px">${next ? fmtCountdown(Date.parse(next.lockUtc) - now) : "—"}</div>
        <div class="delta" style="color:var(--text-muted)">${next ? `${iso(next.homeTeam)} vs ${iso(next.awayTeam)}` : ""}</div>
      </div>
      <div class="summary-card accent-gold">
        <div class="label">Cierran 24h</div>
        <div class="value">${lockedSoon}</div>
        <div class="delta" style="color:${lockedSoon > 0 ? 'var(--accent-3)' : 'var(--text-muted)'}">${lockedSoon > 0 ? "⏱ Apúrate" : "Todo a tiempo"}</div>
      </div>
    </div>`;

  const chipsHTML = `<div class="chips-row">${filters.map(f => `
    <button class="chip ${state.filter === f.id ? "active" : ""}" data-filter="${f.id}">
      ${f.label} <span class="count">${f.count}</span>
    </button>`).join("")}</div>`;

  const daysHTML = days.length === 0 ?
    `<div class="empty"><div class="icon">⚽</div><div class="title">Sin partidos</div><p>Cambia el filtro.</p></div>` :
    days.map(dk => {
      const dms = grouped[dk];
      const d = fmtDay(dms[0].kickoffUtc);
      return `
        <div>
          <div class="day-header">
            <div class="day-name"><span class="num">${d.num}</span>${d.day} · ${d.mon}</div>
            <div class="day-meta">${dms.length} ${dms.length === 1 ? "partido" : "partidos"}</div>
          </div>
          ${dms.map(m => pickCardHTML(m)).join("")}
        </div>`;
    }).join("");

  $("#tab-picks").innerHTML = heroHTML + summaryHTML + chipsHTML + daysHTML;
}

function heroCardHTML(m) {
  const home = flag(m.homeTeam), away = flag(m.awayTeam);
  const cd = fmtCountdownParts(Date.parse(m.kickoffUtc) - Date.now());
  const isLive = Date.now() >= Date.parse(m.kickoffUtc);
  return `
    <div class="hero">
      <div class="hero-tag ${isLive ? "live" : ""}">
        <span class="dot"></span>
        ${isLive ? "EN VIVO · ESTÁS A TIEMPO" : "PRÓXIMO PARTIDO"}
      </div>
      <div class="hero-matchup">
        <div class="hero-team">
          <span class="flag">${home}</span>
          <span class="name">${escapeHTML(shortName(m.homeTeam))}</span>
        </div>
        <div class="hero-vs">VS</div>
        <div class="hero-team">
          <span class="flag">${away}</span>
          <span class="name">${escapeHTML(shortName(m.awayTeam))}</span>
        </div>
      </div>
      <div class="hero-countdown">
        <div class="cd-cell"><div class="cd-num">${String(cd.d).padStart(2,'0')}</div><div class="cd-lbl">Días</div></div>
        <div class="cd-cell"><div class="cd-num">${String(cd.h).padStart(2,'0')}</div><div class="cd-lbl">Horas</div></div>
        <div class="cd-cell"><div class="cd-num">${String(cd.m).padStart(2,'0')}</div><div class="cd-lbl">Min</div></div>
        <div class="cd-cell"><div class="cd-num">${String(cd.s).padStart(2,'0')}</div><div class="cd-lbl">Seg</div></div>
      </div>
      <div class="hero-meta-row">
        <span class="where">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          ${escapeHTML(m.venue || "")}
        </span>
        <span class="text-mono" style="font-size:10.5px;color:var(--text-soft)">${fmtTime(m.kickoffUtc)} CDMX</span>
      </div>
      <button class="hero-cta" data-jump-to="${m.id}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="m6 3 14 9-14 9z"/></svg>
        Lanzar mi pick
      </button>
    </div>`;
}

// Hero countdown live tick
let heroTickHandle = null;
function startHeroTick() {
  stopHeroTick();
  heroTickHandle = setInterval(() => {
    if (state.tab !== "picks") return;
    const now = Date.now();
    const upcoming = state.matches.filter(m => Date.parse(m.kickoffUtc) > now).sort((a,b) => Date.parse(a.kickoffUtc) - Date.parse(b.kickoffUtc));
    const next = upcoming[0];
    if (!next) return;
    const cd = fmtCountdownParts(Date.parse(next.kickoffUtc) - now);
    const cells = $$(".hero-countdown .cd-num");
    if (cells.length === 4) {
      cells[0].textContent = String(cd.d).padStart(2,'0');
      cells[1].textContent = String(cd.h).padStart(2,'0');
      cells[2].textContent = String(cd.m).padStart(2,'0');
      cells[3].textContent = String(cd.s).padStart(2,'0');
    }
  }, 1000);
}
function stopHeroTick() { if (heroTickHandle) clearInterval(heroTickHandle); heroTickHandle = null; }

// ────────────────── TABLA ──────────────────
function renderTabla() {
  const entries = (state.leaderboard.entries || []).slice().sort((a,b) => (b.totalPoints||0) - (a.totalPoints||0));
  const [t1, t2, t3, ...rest] = entries;
  const myId = state.currentUser ? getStableUserId() : null;
  const podHTML = (p, rank, variant) => p ? `
    <div class="lb-pod ${variant}">
      <div class="medal">#${rank}</div>
      <div class="pod-avatar">${p.avatar?.startsWith("data:") ? `<img src="${escapeHTML(p.avatar)}" alt="">` : `<span>${p.avatar || "⚽"}</span>`}</div>
      <div class="pod-name">${escapeHTML(p.displayName)}</div>
      ${p.tagline ? `<div class="pod-tag">${escapeHTML(p.tagline)}</div>` : ""}
      <div class="pod-pts">${p.totalPoints || 0}<span class="lbl">PTS</span></div>
    </div>` : `<div></div>`;

  const podium = t1 ? `
    <div class="lb-podium">
      ${podHTML(t2, 2, "silver")}
      ${podHTML(t1, 1, "gold")}
      ${podHTML(t3, 3, "bronze")}
    </div>` : "";

  const rows = [t1, t2, t3, ...rest].filter(Boolean).slice(3).map((p, i) => `
    <div class="lb-row ${p.userId === myId ? "me" : ""}">
      <div class="rank">${i + 4}</div>
      <div class="av">${p.avatar?.startsWith("data:") ? `<img src="${escapeHTML(p.avatar)}" alt="">` : `<span>${p.avatar || "⚽"}</span>`}</div>
      <div class="meta">
        <div class="nm">${escapeHTML(p.displayName)}</div>
        ${p.tagline ? `<div class="tag">${escapeHTML(p.tagline)}</div>` : ""}
      </div>
      <span></span>
      <div class="pts">${p.totalPoints || 0}<span class="lbl">PTS</span></div>
    </div>`).join("");

  const meta = state.leaderboard.generatedAtUtc ?
    `Actualizado ${new Date(state.leaderboard.generatedAtUtc).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}` :
    "";

  $("#tab-tabla").innerHTML = `
    <div class="sec-title"><h2>Clasificación</h2><span class="meta">${meta}</span></div>
    ${podium}
    <div class="lb-list">${rows || `<div class="empty"><div class="icon">🏅</div><div class="title">Sin más jugadores</div><p>Invita a tus amigos.</p></div>`}</div>`;
}

// ────────────────── GRUPOS ──────────────────
function buildStandings(matches) {
  const t = {};
  matches.forEach(m => {
    [m.homeTeam, m.awayTeam].forEach(n => { if (!t[n]) t[n] = { name: n, pj:0, g:0, e:0, p:0, gf:0, gc:0, pts:0 }; });
    const r = m.result;
    if (!r || r.homeScore == null) return;
    const h = r.homeScore, a = r.awayScore;
    t[m.homeTeam].pj++; t[m.awayTeam].pj++;
    t[m.homeTeam].gf += h; t[m.homeTeam].gc += a;
    t[m.awayTeam].gf += a; t[m.awayTeam].gc += h;
    if (h > a) { t[m.homeTeam].g++; t[m.homeTeam].pts += 3; t[m.awayTeam].p++; }
    else if (h < a) { t[m.awayTeam].g++; t[m.awayTeam].pts += 3; t[m.homeTeam].p++; }
    else { t[m.homeTeam].e++; t[m.homeTeam].pts++; t[m.awayTeam].e++; t[m.awayTeam].pts++; }
  });
  return Object.values(t).sort((a,b) => b.pts - a.pts || (b.gf-b.gc) - (a.gf-a.gc) || b.gf - a.gf);
}

// ────────────────── RESOLUCIÓN DE LLAVES ──────────────────
// Los partidos de eliminatoria vienen con placeholders ("1st Group A",
// "Best 3rd (A/B/C/D/F)", "W74", "L101"). Esta función calcula los equipos
// reales a partir de la tabla de grupos y propaga ganadores/perdedores.
// Solo resuelve lo que ya está matemáticamente decidido; el resto queda en
// placeholder (shortName() lo formatea como "1° GRUPO A", "MEJOR 3°", etc.).

// Slots de R32 que reciben un "mejor tercero": id de partido → grupos elegibles.
const THIRD_SLOTS = {
  "match-074": ["A","B","C","D","F"],
  "match-077": ["C","D","F","G","H"],
  "match-079": ["C","E","F","H","I"],
  "match-080": ["E","H","I","J","K"],
  "match-081": ["B","E","F","I","J"],
  "match-082": ["A","E","H","I","J"],
  "match-085": ["E","F","G","I","J"],
  "match-087": ["D","E","I","J","L"],
};
// Asignación oficial FIFA por combinación de grupos cuyo 3° clasifica (495
// combinaciones). Anclamos la combinación real del torneo; si los resultados
// arrojaran otra, caemos a un emparejamiento que respeta los grupos elegibles.
const THIRD_ALLOCATION = {
  // combinación real WC2026: terceros de B,D,E,F,I,J,K,L
  "BDEFIJKL": { "match-074":"D","match-077":"F","match-079":"E","match-080":"K","match-081":"B","match-082":"I","match-085":"J","match-087":"L" },
};

// Empareja (backtracking) grupos clasificados con slots respetando elegibilidad.
function matchThirdsToSlots(qualGroups) {
  const slotIds = Object.keys(THIRD_SLOTS);
  const out = {};
  const used = new Set();
  function bt(i) {
    if (i === slotIds.length) return used.size === qualGroups.length;
    const sid = slotIds[i];
    for (const g of THIRD_SLOTS[sid]) {
      if (qualGroups.includes(g) && !used.has(g)) {
        used.add(g); out[sid] = g;
        if (bt(i + 1)) return true;
        used.delete(g); delete out[sid];
      }
    }
    return false;
  }
  return bt(0) ? out : null;
}

function resolveBracket(matches) {
  const byId = new Map(matches.map(m => [m.id, m]));
  const pad3 = (n) => String(n).padStart(3, "0");
  const isFinished = (m) => m.displayStatus === "finished" || m.displayStatus === "FINISHED";

  // 1) Tabla de cada grupo
  const groups = {}, standings = {}, groupDone = {};
  matches.forEach(m => { if (normalizeStage(m.stage) === "group") (groups[m.group] = groups[m.group] || []).push(m); });
  for (const [g, ms] of Object.entries(groups)) {
    standings[g] = buildStandings(ms);
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
    const qualGroups = thirds.slice(0, 8).map(x => x.grp);
    const key = [...qualGroups].sort().join("");
    const alloc = THIRD_ALLOCATION[key] || matchThirdsToSlots(qualGroups);
    if (alloc) {
      const teamByGroup = Object.fromEntries(thirds.map(x => [x.grp, x.name]));
      for (const [sid, g] of Object.entries(alloc)) thirdByMatch[sid] = teamByGroup[g];
    }
  }

  // 3) Ganador / perdedor de un partido ya resuelto y terminado
  const teamResolved = (name) => name && !/Group [A-L]|Best 3rd|^[WL]\d+/.test(name);
  const winnerOf = (m) => {
    if (!m || !isFinished(m)) return null;
    const r = m.result || {};
    const q = r.qualifiedTeam || (r.homeScore > r.awayScore ? "home" : r.awayScore > r.homeScore ? "away" : null);
    if (!q) return null;
    const name = q === "home" ? m.homeTeam : m.awayTeam;
    return teamResolved(name) ? name : null;
  };
  const loserOf = (m) => {
    if (!m || !isFinished(m)) return null;
    const r = m.result || {};
    const q = r.qualifiedTeam || (r.homeScore > r.awayScore ? "home" : r.awayScore > r.homeScore ? "away" : null);
    if (!q) return null;
    const name = q === "home" ? m.awayTeam : m.homeTeam;
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

  // 5) Recorrer en orden de id (grupos→R32→R16→…→final) mutando en el sitio,
  // para que cada ronda lea los equipos ya resueltos de la anterior.
  const ko = matches.filter(m => normalizeStage(m.stage) !== "group")
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const m of ko) {
    if (!teamResolved(m.homeTeam)) { const r = resolveSlot(m.homeTeam, m.id); if (r) m.homeTeam = r; }
    if (!teamResolved(m.awayTeam)) { const r = resolveSlot(m.awayTeam, m.id); if (r) m.awayTeam = r; }
  }
  return matches;
}

function renderGrupos() {
  const groupMatches = state.matches.filter(m => normalizeStage(m.stage) === "group");
  const groups = {};
  groupMatches.forEach(m => { const g = m.group; if (!groups[g]) groups[g] = []; groups[g].push(m); });

  const cards = Object.entries(groups).sort(([a],[b]) => a.localeCompare(b)).map(([g, items]) => {
    const teams = buildStandings(items);
    return `
      <div class="group-card">
        <div class="group-head">
          <div class="nm"><span class="gl">${g}</span>GRUPO</div>
          <div class="md">${items.length} partidos</div>
        </div>
        <table class="group-table">
          <thead><tr><th class="team">Equipo</th><th>PJ</th><th>DG</th><th>PTS</th></tr></thead>
          <tbody>
            ${teams.map((t,i) => `
              <tr class="${i < 2 ? "qualify" : ""}">
                <td class="team-cell"><span class="flag">${flag(t.name)}</span><span>${escapeHTML(shortName(t.name))}</span></td>
                <td>${t.pj}</td>
                <td>${t.gf-t.gc > 0 ? "+" : ""}${t.gf-t.gc}</td>
                <td class="pts">${t.pts}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  }).join("");

  $("#tab-grupos").innerHTML = `
    <div class="sec-title"><h2>Fase de grupos</h2><span class="meta">${Object.keys(groups).length} grupos · 48 equipos</span></div>
    <div class="groups-grid">${cards}</div>`;
}

// ────────────────── CALENDARIO ──────────────────
const WEEKDAYS_ES = ["L","M","X","J","V","S","D"];
const MONTHS = [
  { year: 2026, month: 5, label: "Junio" },
  { year: 2026, month: 6, label: "Julio" },
];

function stageColor(m) {
  const s = normalizeStage(m.stage);
  if (s === "group") return "var(--accent-2)";
  if (s === "round-of-32") return "var(--accent)";
  if (s === "round-of-16") return "var(--accent-3)";
  if (s === "quarterfinal") return "var(--accent-4)";
  if (s === "semifinal") return "var(--accent-3)";
  return "var(--accent-3)";
}

function renderCalendario() {
  const byDay = {};
  state.matches.forEach(m => { const k = dayKey(m.kickoffUtc); (byDay[k] = byDay[k] || []).push(m); });
  const allDays = Object.keys(byDay).sort();
  if (!state.selectedDay) {
    // Por default abrir en el día de hoy; si hoy no hay partidos, el próximo día
    // con partidos; si el torneo ya terminó, el último día.
    const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
    state.selectedDay = allDays.find(d => d >= todayKey) || allDays[allDays.length - 1] || todayKey;
  }

  const buildGrid = (year, month) => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDow = (first.getDay() + 6) % 7;
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= last.getDate(); d++) {
      const key = `${year}-${String(month + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      cells.push({ d, key });
    }
    while (cells.length % 7) cells.push(null);
    return cells;
  };

  const monthsHTML = MONTHS.map(mo => {
    const grid = buildGrid(mo.year, mo.month);
    return `
      <div class="cal-month">
        <div class="cal-month-head">
          <span class="cal-month-name">${mo.label}</span>
          <span class="cal-month-year">${mo.year}</span>
        </div>
        <div class="cal-grid cal-grid-head">
          ${WEEKDAYS_ES.map(w => `<div class="cal-dow">${w}</div>`).join("")}
        </div>
        <div class="cal-grid">
          ${grid.map(cell => {
            if (!cell) return `<div class="cal-cell empty"></div>`;
            const dms = byDay[cell.key] || [];
            const has = dms.length > 0;
            const sel = cell.key === state.selectedDay;
            const dots = dms.slice(0,3).map(dm => `<span class="cal-dot" style="background:${stageColor(dm)}"></span>`).join("");
            const extra = dms.length > 3 ? `<span class="cal-dots-extra">+${dms.length - 3}</span>` : "";
            return `
              <button class="cal-cell ${sel ? "selected" : ""} ${has ? "has" : ""}" ${has ? `data-cal-day="${cell.key}"` : "disabled"}>
                <span class="cal-num">${cell.d}</span>
                ${has ? `<span class="cal-dots">${dots}${extra}</span>` : ""}
              </button>`;
          }).join("")}
        </div>
      </div>`;
  }).join("");

  const dayMatches = byDay[state.selectedDay] || [];
  const selDate = new Date(state.selectedDay + "T12:00:00");
  const dayHeadHTML = `
    <div class="cal-day-section">
      <div class="cal-day-head">
        <div>
          <div class="cal-day-title">${selDate.toLocaleDateString("es-MX", { weekday: "long", day: "2-digit", month: "long" })}</div>
          <div class="cal-day-sub">${dayMatches.length} ${dayMatches.length === 1 ? "partido" : "partidos"}${dayMatches.length > 0 ? ` · ${fmtTime(dayMatches[0].kickoffUtc)} – ${fmtTime(dayMatches[dayMatches.length-1].kickoffUtc)}` : ""}</div>
        </div>
        <div class="cal-day-num">${selDate.getDate()}</div>
      </div>
      ${dayMatches.length === 0 ?
        `<div class="empty"><div class="icon">📅</div><div class="title">Día libre</div><p>No hay partidos este día.</p></div>` :
        dayMatches.map(m => pickCardHTML(m, { readonly: true })).join("")
      }
    </div>`;

  const legendHTML = `
    <div class="cal-legend">
      <div class="cal-leg-item"><span class="dot" style="background:var(--accent-2)"></span>Grupos</div>
      <div class="cal-leg-item"><span class="dot" style="background:var(--accent)"></span>16avos</div>
      <div class="cal-leg-item"><span class="dot" style="background:var(--accent-3)"></span>Octavos / Semis</div>
      <div class="cal-leg-item"><span class="dot" style="background:var(--accent-4)"></span>Cuartos / Final</div>
    </div>`;

  $("#tab-calendario").innerHTML = `
    <div class="sec-title"><h2>Calendario</h2><span class="meta">${state.matches.length} partidos · 39 días</span></div>
    <div class="cal-months">${monthsHTML}</div>
    ${dayHeadHTML}
    ${legendHTML}`;
}

// ────────────────── BRACKET ──────────────────
function renderBracket() {
  const rounds = [
    { id: "round-of-32", label: "Dieciseisavos de Final" },
    { id: "round-of-16", label: "Octavos de Final" },
    { id: "quarterfinal", label: "Cuartos de Final" },
    { id: "semifinal", label: "Semifinales" },
    { id: "third-place", label: "Tercer Lugar" },
    { id: "final", label: "GRAN FINAL" },
  ];

  const sections = rounds.map(r => {
    const ms = state.matches.filter(m => normalizeStage(m.stage) === r.id);
    if (ms.length === 0) return "";
    return `
      <div class="br-section">
        <div class="br-header"><div class="title">${r.label}</div><div class="line"></div><div class="count">${ms.length}</div></div>
        ${ms.map(m => pickCardHTML(m, { readonly: true })).join("")}
      </div>`;
  }).join("");

  $("#tab-bracket").innerHTML = `
    <div class="sec-title"><h2>Llaves</h2><span class="meta">60 partidos eliminatorios</span></div>
    <div class="bracket-rounds">${sections}</div>`;
}

// ────────────────── SEDES ──────────────────
function renderSedes() {
  const v = state.venues;
  const totalCap = v.reduce((s, x) => s + x.capacity, 0);
  const byCountry = v.reduce((acc, x) => { acc[x.country] = (acc[x.country] || 0) + 1; return acc; }, {});

  const cards = v.map(x => `
    <div class="venue-card" data-venue-id="${x.id}">
      <div class="vc-flag">${x.flag}</div>
      <div class="vc-info">
        <div class="nm">${escapeHTML(x.name)}</div>
        <div class="city">${escapeHTML(x.city)}, ${escapeHTML(x.country)}</div>
      </div>
      <div class="vc-cap">
        <span class="num">${(x.capacity/1000).toFixed(0)}K</span>
        <span>aforo</span>
      </div>
    </div>`).join("");

  $("#tab-sedes").innerHTML = `
    <div class="sec-title"><h2>Sedes</h2><span class="meta">16 estadios · 3 países</span></div>
    <div class="venues-map-wrap">
      <div class="venues-map" id="venues-map"></div>
      <div class="venues-map-legend">
        <div class="leg-row"><span class="dot" style="background:#ff6a00"></span>México (${byCountry.Mexico||0})</div>
        <div class="leg-row"><span class="dot" style="background:#00d4ff"></span>USA (${byCountry.USA||0})</div>
        <div class="leg-row"><span class="dot" style="background:#d6ff00"></span>Canadá (${byCountry.Canada||0})</div>
      </div>
    </div>
    <div class="venues-stats">
      <div class="vs-stat"><div class="vs-num">${v.length}</div><div class="vs-lbl">Estadios</div></div>
      <div class="vs-stat"><div class="vs-num">${(totalCap/1000000).toFixed(1)}M</div><div class="vs-lbl">Aforo total</div></div>
      <div class="vs-stat"><div class="vs-num">3</div><div class="vs-lbl">Países</div></div>
    </div>
    <div class="venues-list">${cards}</div>`;

  setTimeout(initMap, 50);
}

function initMap() {
  const el = $("#venues-map");
  if (!el || state.mapInstance) return;
  if (typeof L === "undefined") return;
  const map = L.map(el, { zoomControl: false, attributionControl: false, scrollWheelZoom: false }).setView([35, -100], 3);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", { maxZoom: 8, subdomains: "abcd" }).addTo(map);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png", { maxZoom: 8, subdomains: "abcd" }).addTo(map);
  L.control.zoom({ position: "topright" }).addTo(map);

  state.venues.forEach(v => {
    const color = v.country === "Mexico" ? "#ff6a00" : v.country === "USA" ? "#00d4ff" : "#d6ff00";
    const html = `<div class="venue-pin" style="--pc:${color}"><div class="pin-dot"></div><div class="pin-ring"></div></div>`;
    const icon = L.divIcon({ className: "venue-pin-icon", html, iconSize: [22,22], iconAnchor: [11,11] });
    const marker = L.marker([v.lat, v.lng], { icon }).addTo(map);
    marker.bindTooltip(`<strong>${v.name}</strong><br>${v.city}`, { direction: "top", offset: [0, -8], className: "venue-tooltip" });
    marker.on("click", () => {
      $$(".venue-card").forEach(c => c.classList.remove("selected"));
      const card = $(`.venue-card[data-venue-id="${v.id}"]`);
      if (card) { card.classList.add("selected"); card.scrollIntoView({ block: "center", behavior: "smooth" }); }
    });
  });
  state.mapInstance = map;
}

// ────────────────── MATCH DRAWER ──────────────────
function openMatchDrawer(matchId) {
  const m = state.matches.find(x => x.id === matchId);
  if (!m) return;
  const home = flag(m.homeTeam), away = flag(m.awayTeam);
  const stage = normalizeStage(m.stage);
  const st = matchState(m);
  const ko = new Date(m.kickoffUtc);

  $("#drawer-content").innerHTML = `
    <div class="drawer-body" style="padding-top:6px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:9.5px;font-weight:800;letter-spacing:0.14em;color:var(--accent);text-transform:uppercase">${STAGE_LONG[stage] || stage}${m.group ? ` · GRUPO ${m.group}` : ""}</span>
        <button class="icon-btn" id="drawer-close" style="width:28px;height:28px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      </div>
      <div class="drawer-title">${escapeHTML(shortName(m.homeTeam))} <span style="color:var(--text-muted);margin:0 6px">vs</span> ${escapeHTML(shortName(m.awayTeam))}</div>
      <div class="drawer-sub">${ko.toLocaleDateString("es-MX", { weekday: "long", day: "2-digit", month: "long", timeZone: "America/Mexico_City" })} · ${fmtTime(m.kickoffUtc)} CDMX</div>
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:14px 12px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;margin-bottom:14px">
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
          <span style="font-size:32px">${home}</span>
          <span class="text-display" style="font-size:12px;font-weight:800;text-transform:uppercase;text-align:center">${escapeHTML(shortName(m.homeTeam))}</span>
        </div>
        <div class="text-display" style="font-size:11px;color:var(--text-muted);letter-spacing:0.18em;font-weight:800">VS</div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
          <span style="font-size:32px">${away}</span>
          <span class="text-display" style="font-size:12px;font-weight:800;text-transform:uppercase;text-align:center">${escapeHTML(shortName(m.awayTeam))}</span>
        </div>
      </div>
    </div>
    <div class="drawer-tabs">
      <button class="drawer-tab active" data-dtab="resumen">📋 Resumen</button>
      <button class="drawer-tab" data-dtab="picks-all">👥 Picks</button>
      <button class="drawer-tab" data-dtab="live">⚽ En vivo</button>
      <button class="drawer-tab" data-dtab="lineup">👕 Alineaciones</button>
      <button class="drawer-tab" data-dtab="tv">📺 Jugadas</button>
    </div>
    <div class="drawer-body" id="drawer-tab-content" style="padding-top:0;flex:1;overflow-y:auto"></div>`;

  renderDrawerTab(m, "resumen");
  $("#drawer-overlay").classList.add("show");
  $("#match-drawer").classList.add("show");
  $("#drawer-close").addEventListener("click", closeDrawer);
  $$(".drawer-tab").forEach(b => b.addEventListener("click", () => {
    $$(".drawer-tab").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    renderDrawerTab(m, b.dataset.dtab);
  }));
}

function renderDrawerTab(m, tab) {
  const el = $("#drawer-tab-content");
  if (tab === "resumen") {
    const st = matchState(m);
    el.innerHTML = `
      <div class="kv-grid">
        <div class="kv"><div class="k">Sede</div><div class="v">${escapeHTML(m.venue?.split(",")[0] || "—")}</div></div>
        <div class="kv"><div class="k">Ciudad</div><div class="v">${escapeHTML(m.venue?.split(",")[1]?.trim() || "—")}</div></div>
        <div class="kv"><div class="k">Jornada</div><div class="v">${m.matchday ? `Jornada ${m.matchday}` : "Eliminatoria"}</div></div>
        <div class="kv"><div class="k">Cierre</div><div class="v">${st.locked ? "Cerrado" : fmtCountdown(st.lk - Date.now())}</div></div>
      </div>
      <div style="margin-top:14px;font-size:11px;color:var(--text-muted);line-height:1.5">
        <strong style="color:var(--text-soft)">Reglas rápidas:</strong> 3 pts marcador exacto · 1 pt resultado correcto · 0 si fallas. Cierre 1 seg. antes del kickoff.
      </div>`;
    return;
  }

  if (tab === "picks-all") {
    const st = matchState(m);
    if (!st.locked) {
      el.innerHTML = `<div class="empty"><div class="icon">🔒</div><div class="title">Picks ocultos</div><p>Los picks de todos se revelan cuando cierra el partido.</p></div>`;
      return;
    }
    el.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:11px">Cargando picks…</div>`;
    loadAllPicks(m);
    return;
  }

  if (tab === "live") {
    const st = matchState(m);
    const kickoffPassed = Date.now() >= st.ko;
    if (st.finished) {
      // Match finished — still show score from ESPN
      el.innerHTML = `<div style="text-align:center;padding:18px;color:var(--text-muted);font-size:11px">Cargando resultado…</div>`;
      loadCtxLive(m);
    } else if (kickoffPassed) {
      // Kickoff passed (live or just not yet marked finished) — fetch live data
      el.innerHTML = `<div class="live-mock"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span style="font-size:10px;font-weight:800;color:var(--live);letter-spacing:0.12em">● EN VIVO</span><span class="text-mono" style="font-size:11px;color:var(--text-soft)">${Math.floor((Date.now() - st.ko) / 60000)}'</span></div><div style="text-align:center;color:var(--text-muted);font-size:11px;padding:18px">Cargando datos en vivo…</div></div>`;
      loadCtxLive(m);
    } else {
      el.innerHTML = `<div class="empty"><div class="icon">🕒</div><div class="title">Aún no comienza</div><p>Los datos en vivo se activan al kickoff.<br>Cierre de picks: <strong style="color:var(--accent)">${fmtCountdown(st.lk - Date.now())}</strong></p></div>`;
    }
    return;
  }

  if (tab === "lineup") {
    el.innerHTML = `<div class="empty"><div class="icon">⏳</div><div class="title">Cargando alineaciones…</div></div>`;
    loadCtxLineups(m);
    return;
  }

  if (tab === "tv") {
    el.innerHTML = `<div class="empty"><div class="icon">⏳</div><div class="title">Buscando comentarios…</div></div>`;
    loadCtxCommentary(m);
    return;
  }
}

// Normaliza nombres de equipos para emparejar con ESPN.
// Maneja diferencias como "Bosnia and Herzegovina" vs "Bosnia-Herzegovina",
// acentos, guiones, "&"/"and" y alias oficiales FIFA (Türkiye, Côte d'Ivoire, etc).
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
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/\band\b/g, " ")
    .replace(/[^a-z0-9]/g, "");
  return TEAM_ALIASES[base] || base;
}

// Busca el evento de ESPN que corresponde al partido (home/away), tolerando
// nombres distintos y orden invertido de local/visitante.
function findEspnEvent(events, homeTeam, awayTeam) {
  const h = normTeam(homeTeam), a = normTeam(awayTeam);
  const hit = (x, y) => x && y && (x.includes(y) || y.includes(x));
  return (events || []).find(e => {
    const c = e.competitions?.[0];
    if (!c) return false;
    const eh = normTeam(c.competitors?.find(x => x.homeAway === "home")?.team?.displayName);
    const ea = normTeam(c.competitors?.find(x => x.homeAway === "away")?.team?.displayName);
    return (hit(eh, h) && hit(ea, a)) || (hit(eh, a) && hit(ea, h));
  });
}

async function callContext(body) {
  const r = await fetch("/.netlify/functions/match-context", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ── Marcadores en vivo (ESPN) para calendario/bracket/grupos ─────────────────
// El calendario lee results.json (football-data, vía cron) y puede ir atrasado
// mientras un partido está en juego o recién terminó. Aquí pedimos a ESPN (la
// misma fuente del drawer "En vivo") el marcador real y lo sobreponemos. NO
// afecta la puntuación: los puntos siguen saliendo del resultado oficial.
async function loadLiveScores() {
  const now = Date.now();
  const cand = state.matches.filter((m) => {
    const ko = Date.parse(m.kickoffUtc);
    const finishedOfficial = m.displayStatus === "finished" || m.displayStatus === "FINISHED";
    return ko <= now && now < ko + 4 * 60 * 60 * 1000 && !finishedOfficial;
  });
  if (!cand.length) return false;

  const dates = [...new Set(cand.map((m) => espnDate(m.kickoffUtc)).filter(Boolean))];
  let changed = false;
  for (const d of dates) {
    let sb;
    try { sb = await callContext({ action: "scoreboard", league: "fifa.world", dates: d }); }
    catch { continue; }
    const events = sb.events || [];
    for (const m of cand) {
      const evt = findEspnEvent(events, m.homeTeam, m.awayTeam);
      const comp = evt && evt.competitions && evt.competitions[0];
      if (!comp) continue;
      const estate = evt.status?.type?.state || "";
      if (estate !== "in" && estate !== "post") continue; // ignorar pre-partido
      const h = comp.competitors?.find((x) => x.homeAway === "home");
      const a = comp.competitors?.find((x) => x.homeAway === "away");
      if (h?.score == null || a?.score == null) continue;
      const next = { homeScore: Number(h.score), awayScore: Number(a.score), state: estate };
      const prev = state.live[m.id];
      if (!prev || prev.homeScore !== next.homeScore || prev.awayScore !== next.awayScore || prev.state !== next.state) {
        state.live[m.id] = next;
        changed = true;
      }
    }
  }
  return changed;
}

// Re-lee los datos compartidos que cambian durante el torneo (resultados
// oficiales, leaderboard, overrides) sin recargar la página. matches.json y
// venues.json son estáticos, así que no hace falta volver a pedirlos.
async function refreshSharedData() {
  try {
    const [rd, ld, od] = await Promise.all([
      fetchJson(DATA_URLS.results),
      fetchJson(DATA_URLS.leaderboard),
      fetchJson(DATA_URLS.overrides),
    ]);
    const results = rd.results || [];
    state.results = {};
    results.forEach((r) => { state.results[r.matchId] = r; });
    state.matches = resolveBracket(mergeData(state.rawMatches, results, od));
    state.leaderboard = ld;
    return true;
  } catch { return false; }
}

// ¿El usuario está capturando un marcador? Re-renderizar le quitaría el foco.
function isEditingPick() {
  const f = document.activeElement;
  return !!(f && f.classList && f.classList.contains("pc-input"));
}

// ── Auto-refresco mientras la app está abierta ───────────────────────────────
// Cada 60s actualiza tabla/resultados, marcadores en vivo (ESPN) y tus jugadas,
// y re-renderiza. Pausa en segundo plano y refresca al instante al volver.
let autoRefreshHandle = null;
function startAutoRefresh() {
  if (autoRefreshHandle) return;
  const tick = async () => {
    if (document.hidden) return; // no gastar red con la pestaña oculta
    const [dataChanged, liveChanged] = await Promise.all([
      refreshSharedData(),
      loadLiveScores().catch(() => false),
    ]);
    await syncPicksFromRepo().catch(() => {}); // re-renderiza adentro si cambió
    if (!dataChanged && !liveChanged) return;
    if (isEditingPick()) return;
    renderCurrentTab();
  };
  tick();
  autoRefreshHandle = setInterval(tick, 60 * 1000);
  // Al volver a la pestaña (o destrabar el teléfono) refrescar de inmediato.
  document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });
}

async function loadCtxLive(m) {
  const el = $("#drawer-tab-content");
  try {
    const sb = await callContext({ action: "scoreboard", league: "fifa.world", dates: espnDate(m.kickoffUtc) });
    const events = sb.events || [];
    const evt = findEspnEvent(events, m.homeTeam, m.awayTeam);
    if (!evt) {
      el.innerHTML = `<div class="empty"><div class="icon">📡</div><div class="title">Sin datos en vivo</div><p>ESPN no reporta este partido aún.</p></div>`;
      return;
    }

    const comp = evt.competitions?.[0];
    const status = evt.status?.type?.name || "";
    // ESPN reporta el estado por tiempo (STATUS_FIRST_HALF, STATUS_SECOND_HALF,
    // STATUS_HALFTIME, STATUS_EXTRA_TIME…), no un genérico STATUS_IN_PROGRESS.
    // Usamos type.state (pre | in | post) para detectar "en vivo" de forma robusta.
    const state = evt.status?.type?.state || "";
    const clock = evt.status?.displayClock || "";
    const period = evt.status?.period || 0;
    const homeComp = comp?.competitors?.find(x => x.homeAway === "home");
    const awayComp = comp?.competitors?.find(x => x.homeAway === "away");
    const homeScore = homeComp?.score || "0";
    const awayScore = awayComp?.score || "0";
    const homeName = homeComp?.team?.displayName || m.homeTeam;
    const awayName = awayComp?.team?.displayName || m.awayTeam;

    const isHalftime = status === "STATUS_HALFTIME";
    const isLive = state === "in";
    const isFT = state === "post";
    const statusText = isHalftime ? "⏸️ Medio Tiempo" :
                       isLive ? `⚽ ${clock} · ${period === 1 ? "1er Tiempo" : "2do Tiempo"}` :
                       isFT ? "✅ FINALIZADO" : "🕒 Por iniciar";

    // Try to get summary for stats
    let statsHTML = "";
    try {
      const summary = await callContext({ action: "summary", league: "fifa.world", eventId: evt.id });
      const stats = summary.raw?.header?.competitions?.[0]?.competitors;
      if (stats && stats.length === 2) {
        const hStats = stats.find(s => s.homeAway === "home")?.statistics || [];
        const aStats = stats.find(s => s.homeAway === "away")?.statistics || [];
        const statPairs = hStats.map((hs, i) => ({
          label: hs.abbreviation || hs.name || "",
          home: hs.displayValue || "0",
          away: aStats[i]?.displayValue || "0"
        })).filter(s => s.label);

        if (statPairs.length) {
          statsHTML = `<div style="margin-top:14px"><div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase">Estadísticas</div>${statPairs.map(s => `
            <div class="live-stat-row">
              <span class="l">${s.home}</span>
              <span class="lbl">${escapeHTML(s.label)}</span>
              <span class="r">${s.away}</span>
            </div>`).join("")}</div>`;
        }
      }
    } catch {}

    el.innerHTML = `
      <div class="live-mock">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <span style="font-size:10px;font-weight:800;letter-spacing:0.12em;color:${isLive ? 'var(--live)' : 'var(--text-muted)'}">${isLive ? '● EN VIVO' : statusText}</span>
          ${isLive ? `<span class="text-mono" style="font-size:12px;color:var(--text-soft);font-weight:700">${clock}</span>` : ""}
        </div>
        <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;text-align:center;padding:8px 0 14px">
          <div>
            <span style="font-size:28px">${flag(m.homeTeam)}</span>
            <div style="font-size:11px;font-weight:700;margin-top:4px;color:var(--text)">${escapeHTML(shortName(homeName))}</div>
          </div>
          <div style="font-family:var(--font-display);font-size:32px;font-weight:800;color:var(--text)">${homeScore} <span style="color:var(--text-muted);font-size:18px">–</span> ${awayScore}</div>
          <div>
            <span style="font-size:28px">${flag(m.awayTeam)}</span>
            <div style="font-size:11px;font-weight:700;margin-top:4px;color:var(--text)">${escapeHTML(shortName(awayName))}</div>
          </div>
        </div>
        <div style="text-align:center;font-size:11px;color:var(--text-muted);padding-bottom:8px">${statusText}</div>
      </div>
      ${statsHTML}`;
  } catch (e) {
    el.innerHTML = `<div class="empty"><div class="icon">⚠️</div><div class="title">Error</div><p>${escapeHTML(e.message)}</p></div>`;
  }
}

async function loadCtxLineups(m) {
  const el = $("#drawer-tab-content");
  try {
    const sb = await callContext({ action: "scoreboard", league: "fifa.world", dates: espnDate(m.kickoffUtc) });
    const events = sb.events || [];
    const evt = findEspnEvent(events, m.homeTeam, m.awayTeam);
    if (!evt) { el.innerHTML = `<div class="empty"><div class="icon">👕</div><div class="title">Alineaciones no disponibles</div><p>Se publican poco antes del inicio.</p></div>`; return; }
    const data = await callContext({ action: "summary", league: "fifa.world", eventId: evt.id });
    if (!data.lineups || !data.lineups.length) { el.innerHTML = `<div class="empty"><div class="icon">👕</div><div class="title">Alineaciones aún no confirmadas</div></div>`; return; }
    el.innerHTML = `<div class="lineup-grid">${data.lineups.map(t => `
      <div class="lineup-col">
        <h4>${t.teamLogo ? `<img src="${t.teamLogo}" alt="" style="width:18px;height:18px">` : ""}${escapeHTML(t.teamName)}${t.formation ? ` <span style="color:var(--accent-2);font-size:10px">${t.formation}</span>` : ""}</h4>
        <ul>${(t.starters || []).map(p => `<li><span class="num">${p.number || ""}</span><span style="flex:1">${escapeHTML(p.name)}</span><span class="pos">${escapeHTML(p.position || "")}</span></li>`).join("")}</ul>
      </div>`).join("")}</div>`;
  } catch (e) {
    el.innerHTML = `<div class="empty"><div class="icon">⚠️</div><div class="title">Error</div><p>${escapeHTML(e.message)}</p></div>`;
  }
}

async function loadCtxCommentary(m) {
  const el = $("#drawer-tab-content");
  try {
    const data = await callContext({ action: "commentary", teams: [m.homeTeam, m.awayTeam], dates: espnDate(m.kickoffUtc) });
    if (!data.available) {
      el.innerHTML = `<div class="empty"><div class="icon">📺</div><div class="title">Sin datos disponibles</div><p>ESPN no tiene commentary para este partido aún.</p></div>`;
      return;
    }

    // Show key events first, then full commentary
    const keyEvents = data.keyEvents || [];
    const commentary = data.commentary || [];

    if (!keyEvents.length && !commentary.length) {
      el.innerHTML = `<div class="empty"><div class="icon">📺</div><div class="title">Sin jugadas registradas</div><p>El commentary se activa durante el partido.</p></div>`;
      return;
    }

    const typeIcon = (type) => {
      if (type === "goal") return "⚽";
      if (type === "yellow-card" || type === "yellowCard") return "🟨";
      if (type === "red-card" || type === "redCard") return "🟥";
      if (type === "substitution") return "🔄";
      if (type === "offside") return "🚩";
      if (type === "foul") return "⚠️";
      return "▪️";
    };

    // Key events (goals, cards, subs)
    let html = "";
    if (keyEvents.length) {
      html += `<div style="margin-bottom:14px"><div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:var(--accent);text-transform:uppercase;margin-bottom:8px">Eventos clave</div>`;
      html += keyEvents.map(e => `
        <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 8px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;margin-bottom:4px;font-size:11.5px">
          <span style="flex-shrink:0;font-size:13px">${typeIcon(e.type)}</span>
          <span style="font-family:var(--font-mono);font-weight:700;color:var(--accent-2);min-width:28px;flex-shrink:0">${escapeHTML(e.time)}</span>
          <span style="color:var(--text-soft);line-height:1.4">${escapeHTML(e.text)}</span>
        </div>`).join("");
      html += `</div>`;
    }

    // Full commentary (last 30 entries, reversed so newest first)
    if (commentary.length) {
      const recent = commentary.slice(-30).reverse();
      html += `<div><div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px">Jugada por jugada</div>`;
      html += recent.map(c => `
        <div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);font-size:11px">
          <span style="font-family:var(--font-mono);font-weight:600;color:var(--text-muted);min-width:28px;flex-shrink:0">${escapeHTML(c.time)}</span>
          <span style="color:var(--text-soft);line-height:1.4">${escapeHTML(c.text)}</span>
        </div>`).join("");
      html += `</div>`;
    }

    el.innerHTML = html;
  } catch (e) {
    el.innerHTML = `<div class="empty"><div class="icon">⚠️</div><div class="title">Error</div><p>${escapeHTML(e.message)}</p></div>`;
  }
}

function closeDrawer() {
  $("#drawer-overlay").classList.remove("show");
  $("#match-drawer").classList.remove("show");
}

// ────────────────── ALL PICKS FOR A MATCH ──────────────────
async function loadAllPicks(m) {
  const el = $("#drawer-tab-content");
  const entries = state.leaderboard.entries || [];
  if (!entries.length) {
    el.innerHTML = `<div class="empty"><div class="icon">👥</div><div class="title">Sin jugadores</div></div>`;
    return;
  }

  const results = [];
  for (const entry of entries) {
    try {
      const url = `${GH_RAW}/picks/${entry.userId}.json`;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) continue;
      const data = await r.json();
      const pick = (data.picks || []).find(p => p.matchId === m.id);
      if (pick && pick.homeScore != null && pick.awayScore != null) {
        results.push({
          displayName: entry.displayName || data.displayName || entry.userId,
          avatar: entry.avatar || data.avatar || "⚽",
          homeScore: pick.homeScore,
          awayScore: pick.awayScore,
          points: calcPickPoints(pick, m)
        });
      }
    } catch {}
  }

  // Sort: highest points first, then by name
  results.sort((a, b) => b.points - a.points || a.displayName.localeCompare(b.displayName));

  if (!results.length) {
    el.innerHTML = `<div class="empty"><div class="icon">👥</div><div class="title">Nadie puso pick</div><p>Ningún jugador capturó predicción para este partido.</p></div>`;
    return;
  }

  const hasResult = m.result && m.result.homeScore != null;

  el.innerHTML = `
    <div style="padding:4px 0 8px">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.12em;color:var(--text-muted);text-transform:uppercase;margin-bottom:10px">
        ${results.length} picks · ${hasResult ? `Resultado: ${m.result.homeScore}–${m.result.awayScore}` : "Esperando resultado"}
      </div>
      ${results.map(r => {
        const avHTML = r.avatar?.startsWith("data:") ?
          `<img src="${escapeHTML(r.avatar)}" style="width:28px;height:28px;border-radius:50%;object-fit:cover">` :
          `<span style="font-size:16px">${r.avatar}</span>`;
        const ptsCls = r.points === 3 ? "color:var(--accent)" : r.points === 1 ? "color:var(--accent-2)" : "color:var(--text-muted)";
        const ptsLabel = hasResult ? `<span style="font-family:var(--font-mono);font-size:11px;font-weight:700;${ptsCls}">+${r.points}</span>` : "";
        return `
          <div style="display:grid;grid-template-columns:32px 1fr auto auto;gap:10px;align-items:center;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;margin-bottom:5px">
            <div style="display:grid;place-items:center">${avHTML}</div>
            <div style="font-size:12px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHTML(r.displayName)}</div>
            <div style="font-family:var(--font-display);font-weight:800;font-size:15px;color:var(--text);min-width:50px;text-align:center">${r.homeScore} – ${r.awayScore}</div>
            ${ptsLabel}
          </div>`;
      }).join("")}
    </div>`;
}

function calcPickPoints(pick, m) {
  if (!m.result || m.result.homeScore == null) return 0;
  const rh = m.result.homeScore, ra = m.result.awayScore;
  const ph = Number(pick.homeScore), pa = Number(pick.awayScore);
  if (rh === ph && ra === pa) return 3;
  if (Math.sign(rh - ra) === Math.sign(ph - pa)) return 1;
  return 0;
}

// ────────────────── RULES MODAL ──────────────────
function openRules() {
  $("#rules-overlay").classList.add("show");
  $("#rules-modal").classList.add("show");
}
function closeRules() {
  $("#rules-overlay").classList.remove("show");
  $("#rules-modal").classList.remove("show");
}

// ────────────────── ACCOUNT PANEL ──────────────────
function openAccount() { $("#account-overlay").classList.add("open"); }
function closeAccount() { $("#account-overlay").classList.remove("open"); }

function initAccountPanel() {
  const profile = getProfile();
  const defaultName = state.currentUser?.user_metadata?.full_name || state.currentUser?.email?.split("@")[0] || "";
  $("#profile-name").value = profile.displayName || defaultName;
  $("#profile-tagline").value = profile.tagline || "";
  renderAvatarPreview(profile.avatar);
  renderHeaderAvatar(profile.avatar);

  $("#btn-account").addEventListener("click", openAccount);
  $("#account-close").addEventListener("click", closeAccount);
  $("#account-overlay").addEventListener("click", (e) => { if (e.target.id === "account-overlay") closeAccount(); });

  const picker = $("#avatar-picker");
  picker.innerHTML = AVATAR_OPTIONS.map(a => {
    const cur = profile.avatar || "⚽";
    return `<button class="avatar-option ${a === cur && !cur.startsWith("data:") ? "selected" : ""}" data-av="${a}">${a}</button>`;
  }).join("");

  $("#btn-pick-emoji").addEventListener("click", () => {
    picker.style.display = picker.style.display === "none" ? "flex" : "none";
  });
  picker.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-av]");
    if (!btn) return;
    const av = btn.dataset.av;
    const p = getProfile(); p.avatar = av; saveProfile(p);
    renderAvatarPreview(av); renderHeaderAvatar(av);
    picker.querySelectorAll(".avatar-option").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    picker.style.display = "none";
  });

  $("#input-avatar-photo").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5*1024*1024) { setProfileStatus("Imagen muy grande (max 5MB)", true); return; }
    try {
      const dataUrl = await resizeImageToDataUrl(file, 64);
      const p = getProfile(); p.avatar = dataUrl; saveProfile(p);
      renderAvatarPreview(dataUrl); renderHeaderAvatar(dataUrl);
      picker.querySelectorAll(".avatar-option").forEach(b => b.classList.remove("selected"));
      setProfileStatus("");
    } catch (err) {
      setProfileStatus("Error al procesar imagen", true);
    }
    e.target.value = "";
  });

  $("#btn-save-profile").addEventListener("click", async () => {
    const p = getProfile();
    p.displayName = $("#profile-name").value.trim() || defaultName;
    p.tagline = $("#profile-tagline").value.trim();
    saveProfile(p);
    $("#user-display").textContent = p.displayName;
    setProfileStatus("Sincronizando…");
    // Llamar savePicks para mandar el perfil al servidor (va en el payload)
    await savePicks();
    setProfileStatus("✓ Perfil guardado en el servidor");
    setTimeout(() => setProfileStatus(""), 2500);
  });
}

function setProfileStatus(msg, err = false) {
  const el = $("#profile-status");
  el.textContent = msg;
  el.className = "form-status" + (err ? " error" : "");
}

function resizeImageToDataUrl(file, size) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d");
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2, sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ────────────────── SAVE PICKS (Netlify) ──────────────────
function buildPickPayload() {
  const profile = getProfile();
  const email = state.currentUser?.email || "anon";
  const defaultName = state.currentUser?.user_metadata?.full_name || email.split("@")[0];
  const merged = displayPicks();
  return {
    userId: getStableUserId(),
    displayName: profile.displayName || defaultName,
    avatar: profile.avatar || "⚽",
    tagline: profile.tagline || "",
    email,
    submittedAtUtc: new Date().toISOString(),
    picks: state.matches.map(m => {
      const p = merged[m.id] || {};
      return { matchId: m.id, homeScore: p.homeScore ?? null, awayScore: p.awayScore ?? null };
    }),
  };
}

async function savePicks() {
  const payload = buildPickPayload();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  // Commit draft to picks state
  state.picks = { ...state.picks, ...state.draft };
  state.draft = {};
  refreshSaveBar();
  refreshDot();
  showToast("✓ Guardado local");
  try {
    const token = state.currentUser?.token?.access_token;
    const res = await fetch("/.netlify/functions/save-picks", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    showToast("✓ Guardado en el servidor");
  } catch (e) {
    showToast("⚠️ Local OK · Servidor falló: " + e.message, true);
  }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    const picks = {};
    (d.picks || []).forEach(p => {
      if (p.homeScore != null || p.awayScore != null) picks[p.matchId] = p;
    });
    state.picks = picks;
  } catch {}
}

async function syncPicksFromRepo() {
  if (!state.currentUser) return;
  const userId = getStableUserId();
  if (!userId) return;
  try {
    const url = `${GH_RAW}/picks/${userId}.json`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return;
    const remote = await r.json();
    const local = localStorage.getItem(STORAGE_KEY);
    const localData = local ? JSON.parse(local) : null;
    const remoteTime = Date.parse(remote.submittedAtUtc || "2000-01-01");
    const localTime = localData ? Date.parse(localData.submittedAtUtc || "2000-01-01") : 0;
    if (remoteTime >= localTime) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
      const picks = {};
      (remote.picks || []).forEach(p => {
        if (p.homeScore != null || p.awayScore != null) picks[p.matchId] = p;
      });
      state.picks = picks;
      // Sync profile if local is empty
      const lp = getProfile();
      if (!lp.displayName && (remote.displayName || remote.avatar || remote.tagline)) {
        saveProfile({
          userId: lp.userId,
          displayName: remote.displayName || "",
          avatar: remote.avatar || "",
          tagline: remote.tagline || "",
        });
        renderHeaderAvatar(remote.avatar);
        renderAvatarPreview(remote.avatar);
        $("#user-display").textContent = remote.displayName || "Tú";
        $("#profile-name").value = remote.displayName || "";
        $("#profile-tagline").value = remote.tagline || "";
      }
      // No re-renderizar si el usuario está capturando un marcador (perdería foco).
      if (!isEditingPick()) renderCurrentTab();
    }
  } catch {}
}

// ────────────────── TOAST ──────────────────
let toastTimer = null;
function showToast(msg, isError = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.style.color = isError ? "var(--danger)" : "var(--accent-2)";
  t.style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.display = "none"; }, 2500);
}

// ────────────────── EVENTS ──────────────────
function initEvents() {
  // Bottom nav
  $("#bottom-nav").addEventListener("click", (e) => {
    const btn = e.target.closest(".bn-btn");
    if (btn) switchTab(btn.dataset.tab);
  });

  // Filter chips + open match + jump-to + cal-day (event delegation on scroll area)
  $("#scroll-area").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip[data-filter]");
    if (chip) { state.filter = chip.dataset.filter; renderPicks(); return; }
    const jumpBtn = e.target.closest("[data-jump-to]");
    if (jumpBtn) {
      const id = jumpBtn.dataset.jumpTo;
      const el = $(`[data-match-id="${id}"]`);
      if (el) {
        const sa = $("#scroll-area");
        sa.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
        el.style.transition = "all 0.4s";
        el.style.boxShadow = "0 0 0 2px var(--accent)";
        setTimeout(() => { el.style.boxShadow = ""; }, 1800);
      }
      return;
    }
    const calDay = e.target.closest("[data-cal-day]");
    if (calDay) { state.selectedDay = calDay.dataset.calDay; renderCalendario(); return; }
    const venue = e.target.closest("[data-venue-id]");
    if (venue) {
      const v = state.venues.find(x => x.id === venue.dataset.venueId);
      if (v && state.mapInstance) state.mapInstance.flyTo([v.lat, v.lng], 6, { duration: 0.7 });
      $$(".venue-card").forEach(c => c.classList.remove("selected"));
      venue.classList.add("selected");
      return;
    }
    if (e.target.closest("[data-stop]")) return; // input area
    const card = e.target.closest("[data-open-match]");
    if (card) openMatchDrawer(card.dataset.openMatch);
  });

  // Pick inputs
  $("#scroll-area").addEventListener("input", (e) => {
    if (e.target.matches(".pc-input")) {
      const matchId = e.target.dataset.match;
      const side = e.target.dataset.side;
      const raw = e.target.value;
      const v = raw === "" ? null : Math.max(0, Math.min(99, parseInt(raw, 10) || 0));
      const cur = displayPicks()[matchId] || {};
      setPick(matchId, { ...cur, [side === "home" ? "homeScore" : "awayScore"]: v });
      // Live update has-value class on this input
      e.target.classList.toggle("has-value", v !== null);
    }
  });

  // Save bar
  $("#btn-save-picks").addEventListener("click", savePicks);
  $("#btn-discard-picks").addEventListener("click", () => {
    state.draft = {};
    refreshSaveBar();
    refreshDot();
    renderPicks();
    showToast("Cambios descartados");
  });

  // Header buttons
  $("#btn-rules").addEventListener("click", openRules);
  $("#rules-close").addEventListener("click", closeRules);
  $("#rules-overlay").addEventListener("click", closeRules);

  // Drawer overlay
  $("#drawer-overlay").addEventListener("click", closeDrawer);
}

// ────────────────── BOOT ──────────────────
async function boot() {
  try {
    const [md, rd, ld, od, vd] = await Promise.all([
      fetchJson(DATA_URLS.matches),
      fetchJson(DATA_URLS.results),
      fetchJson(DATA_URLS.leaderboard),
      fetchJson(DATA_URLS.overrides),
      fetchJson(DATA_URLS.venues),
    ]);
    state.rawMatches = md.matches || [];
    state.results = {};
    (rd.results || []).forEach(r => { state.results[r.matchId] = r; });
    state.matches = resolveBracket(mergeData(state.rawMatches, rd.results || [], od));
    state.venues = vd.venues || [];
    state.leaderboard = ld;

    loadDraft();
    await syncPicksFromRepo();

    initAccountPanel();
    initEvents();
    renderBottomNav();
    renderCurrentTab();
    loadWeatherBar();
    startHeroTick();
    startAutoRefresh();

    $("#global-loading").classList.add("hide");
  } catch (e) {
    console.error(e);
    $("#app-main").innerHTML = `<div class="empty" style="padding:80px 24px"><div class="icon">⚠️</div><div class="title">Error al cargar</div><p>${escapeHTML(e.message)}</p></div>`;
    $("#global-loading").classList.add("hide");
  }
}

// ────────────────── INIT ──────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Allow guest mode for local dev (no Netlify Identity available)
  const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.hostname === "" || location.protocol === "file:";
  const guestMode = isLocal || new URLSearchParams(location.search).has("guest");

  if (typeof netlifyIdentity !== "undefined" && !guestMode) {
    initAuth();
  } else {
    // Guest / local dev: skip auth, show app
    state.currentUser = { email: "guest@local", user_metadata: { full_name: "Invitado" }, token: null };
    showApp();
  }
});
