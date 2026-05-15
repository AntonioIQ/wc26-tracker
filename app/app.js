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
  "group":"FASE DE GRUPOS","round-of-32":"TREINTAIDOSAVOS","round-of-16":"OCTAVOS",
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
  "group":"GRUPOS","round-of-32":"32avos","round-of-16":"Octavos",
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
async function fetchJson(url) {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`Error ${r.status} ${url}`);
    return r.json();
  } catch (e) {
    const key = Object.keys(DATA_URLS).find(k => DATA_URLS[k] === url);
    if (key && DATA_LOCAL[key]) {
      const r2 = await fetch(DATA_LOCAL[key], { cache: "no-store" });
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
  const live = !finished && now >= ko && now < ko + 110 * 60 * 1000;
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
  $("#user-display").textContent = (getProfile().displayName || state.currentUser?.user_metadata?.full_name || state.currentUser?.email || "Tú");
  boot();
}

// ────────────────── PROFILE ──────────────────
function getProfile() {
  try { const raw = localStorage.getItem(PROFILE_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
function saveProfile(p) { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); }

function getStableUserId() {
  const profile = getProfile();
  if (profile.userId) return profile.userId;
  const email = state.currentUser?.email || "";
  const name = state.currentUser?.user_metadata?.full_name || email.split("@")[0];
  const id = slugify(name) || slugify(email) || "anon";
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

  const showInputs = !opts.readonly;
  const scoreCol = showInputs ? `
    <div class="pc-score" data-stop>
      <input class="pc-input ${pick?.homeScore != null && pick.homeScore !== "" ? "has-value" : ""}" type="number" min="0" max="99" inputmode="numeric" placeholder="–" value="${pick?.homeScore ?? ""}" ${st.locked ? "disabled" : ""} data-match="${m.id}" data-side="home" aria-label="Goles local">
      <span class="pc-sep">–</span>
      <input class="pc-input ${pick?.awayScore != null && pick.awayScore !== "" ? "has-value" : ""}" type="number" min="0" max="99" inputmode="numeric" placeholder="–" value="${pick?.awayScore ?? ""}" ${st.locked ? "disabled" : ""} data-match="${m.id}" data-side="away" aria-label="Goles visitante">
    </div>` : `
    <div class="pc-score">
      <div class="pc-input" style="border-color:transparent;background:transparent;font-size:18px">${m.result?.homeScore ?? "–"}</div>
      <span class="pc-sep">–</span>
      <div class="pc-input" style="border-color:transparent;background:transparent;font-size:18px">${m.result?.awayScore ?? "–"}</div>
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
  if (!state.selectedDay) state.selectedDay = allDays[0];

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
      <div class="cal-leg-item"><span class="dot" style="background:var(--accent)"></span>32avos</div>
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
    { id: "round-of-32", label: "32avos de Final" },
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
      <button class="drawer-tab" data-dtab="live">⚽ En vivo</button>
      <button class="drawer-tab" data-dtab="lineup">👕 Alineaciones</button>
      <button class="drawer-tab" data-dtab="tv">📺 Comentaristas</button>
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

  if (tab === "live") {
    const st = matchState(m);
    if (st.finished) {
      el.innerHTML = `<div class="live-mock"><div style="text-align:center;font-size:11px;color:var(--text-muted);letter-spacing:0.1em">FINALIZADO</div></div>`;
    } else if (!st.live) {
      el.innerHTML = `<div class="empty"><div class="icon">🕒</div><div class="title">Aún no comienza</div><p>Los datos en vivo se activan al kickoff.<br>Cierre de picks: <strong style="color:var(--accent)">${fmtCountdown(st.lk - Date.now())}</strong></p></div>`;
    } else {
      el.innerHTML = `<div class="live-mock"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span style="font-size:10px;font-weight:800;color:var(--live);letter-spacing:0.12em">● EN VIVO</span><span class="text-mono" style="font-size:11px;color:var(--text-soft)">${Math.floor((Date.now() - st.ko) / 60000)}'</span></div><div style="text-align:center;color:var(--text-muted);font-size:11px;padding:18px">Cargando datos en vivo…</div></div>`;
      // Try to fetch from match-context netlify function
      loadCtxLive(m);
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

async function callContext(body) {
  const r = await fetch("/.netlify/functions/match-context", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function loadCtxLive(m) {
  const el = $("#drawer-tab-content");
  try {
    const sb = await callContext({ action: "scoreboard", league: "fifa.world" });
    const events = sb.events || [];
    const h = m.homeTeam.toLowerCase(), a = m.awayTeam.toLowerCase();
    const evt = events.find(e => {
      const c = e.competitions?.[0];
      if (!c) return false;
      const eh = (c.competitors?.find(x => x.homeAway === "home")?.team?.displayName || "").toLowerCase();
      const ea = (c.competitors?.find(x => x.homeAway === "away")?.team?.displayName || "").toLowerCase();
      return (eh.includes(h) || h.includes(eh)) && (ea.includes(a) || a.includes(ea));
    });
    if (!evt) return; // keep loading state, no data
    // Could fetch summary stats here; for now just refresh with placeholder
  } catch (e) { /* silent */ }
}

async function loadCtxLineups(m) {
  const el = $("#drawer-tab-content");
  try {
    const sb = await callContext({ action: "scoreboard", league: "fifa.world" });
    const events = sb.events || [];
    const h = m.homeTeam.toLowerCase(), a = m.awayTeam.toLowerCase();
    const evt = events.find(e => {
      const c = e.competitions?.[0];
      if (!c) return false;
      const eh = (c.competitors?.find(x => x.homeAway === "home")?.team?.displayName || "").toLowerCase();
      const ea = (c.competitors?.find(x => x.homeAway === "away")?.team?.displayName || "").toLowerCase();
      return (eh.includes(h) || h.includes(eh)) && (ea.includes(a) || a.includes(ea));
    });
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
    const data = await callContext({ action: "commentary", teams: [m.homeTeam, m.awayTeam] });
    if (!data.available) { el.innerHTML = `<div class="empty"><div class="icon">📺</div><div class="title">Comentarios no disponibles</div><p>Xpoz no está configurado.</p></div>`; return; }
    if (!data.posts?.length) { el.innerHTML = `<div class="empty"><div class="icon">🤷</div><div class="title">Sin comentarios recientes</div></div>`; return; }
    el.innerHTML = data.posts.map(p => {
      const initials = (p.author || "?").slice(0,2).toUpperCase();
      return `
        <div class="com-row">
          <div class="com-av">${initials}</div>
          <div class="com-info">
            <div class="nm">${escapeHTML(p.author || "")}</div>
            <div class="role">${escapeHTML((p.text || "").slice(0, 80))}…</div>
          </div>
          <div class="com-channel">❤️ ${p.likes || 0}</div>
        </div>`;
    }).join("");
  } catch (e) {
    el.innerHTML = `<div class="empty"><div class="icon">⚠️</div><div class="title">Error</div><p>${escapeHTML(e.message)}</p></div>`;
  }
}

function closeDrawer() {
  $("#drawer-overlay").classList.remove("show");
  $("#match-drawer").classList.remove("show");
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

  $("#btn-save-profile").addEventListener("click", () => {
    const p = getProfile();
    p.displayName = $("#profile-name").value.trim() || defaultName;
    p.tagline = $("#profile-tagline").value.trim();
    saveProfile(p);
    $("#user-display").textContent = p.displayName;
    setProfileStatus("✓ Perfil guardado");
    setTimeout(() => setProfileStatus(""), 2000);
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
      renderCurrentTab();
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
    state.matches = mergeData(state.rawMatches, rd.results || [], od);
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
