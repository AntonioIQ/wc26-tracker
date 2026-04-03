/* === Quiniela Mundial 2026 — App === */

const DATA = {
  matches: "./data/matches.json",
  results: "./data/results.json",
  leaderboard: "./data/leaderboard.json",
  overrides: "./data/overrides.json"
};

const FLAGS = {
  "Mexico": "🇲🇽", "South Africa": "🇿🇦", "South Korea": "🇰🇷", "Czechia": "🇨🇿",
  "Canada": "🇨🇦", "Bosnia and Herzegovina": "🇧🇦", "Qatar": "🇶🇦", "Switzerland": "🇨🇭",
  "United States": "🇺🇸", "Paraguay": "🇵🇾", "Australia": "🇦🇺", "Turkey": "🇹🇷",
  "Brazil": "🇧🇷", "Morocco": "🇲🇦", "Haiti": "🇭🇹", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Germany": "🇩🇪", "Curacao": "🇨🇼", "Netherlands": "🇳🇱", "Japan": "🇯🇵",
  "Ivory Coast": "🇨🇮", "Ecuador": "🇪🇨", "Sweden": "🇸🇪", "Tunisia": "🇹🇳",
  "Spain": "🇪🇸", "Cape Verde": "🇨🇻", "Belgium": "🇧🇪", "Egypt": "🇪🇬",
  "Saudi Arabia": "🇸🇦", "Uruguay": "🇺🇾", "Iran": "🇮🇷", "New Zealand": "🇳🇿",
  "France": "🇫🇷", "Senegal": "🇸🇳", "Iraq": "🇮🇶", "Norway": "🇳🇴",
  "Argentina": "🇦🇷", "Algeria": "🇩🇿", "Austria": "🇦🇹", "Jordan": "🇯🇴",
  "Portugal": "🇵🇹", "DR Congo": "🇨🇩", "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croatia": "🇭🇷",
  "Ghana": "🇬🇭", "Panama": "🇵🇦", "Uzbekistan": "🇺🇿", "Colombia": "🇨🇴"
};

const STAGE_LABELS = {
  "group": "Fase de Grupos", "round-of-32": "Treintaidosavos",
  "round-of-16": "Octavos de Final", "quarterfinal": "Cuartos de Final",
  "semifinal": "Semifinal", "third-place": "Tercer Lugar", "final": "Final"
};

const STAGE_BADGE = {
  "group": "badge-group", "round-of-32": "badge-r32",
  "round-of-16": "badge-r16", "quarterfinal": "badge-qf",
  "semifinal": "badge-sf", "third-place": "badge-final", "final": "badge-final"
};

const STORAGE_KEY = "quiniela-wc26-draft";
let currentUser = null;
let allMatches = [];

/* === UTILS === */
async function fetchJson(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`Error cargando ${url}`);
  return r.json();
}

function flag(team) { return FLAGS[team] || "🏳️"; }

function fmtDate(utc) {
  if (!utc) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true
  }).format(new Date(utc));
}

function fmtScore(s) { return s !== null && s !== undefined ? String(s) : "-"; }

function slugify(v) {
  return String(v || "").trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/* === AUTH (Netlify Identity) === */
function initAuth() {
  const loginBtn = document.getElementById("btn-login");
  const logoutBtn = document.getElementById("btn-logout");

  loginBtn.addEventListener("click", () => {
    netlifyIdentity.open("login");
  });

  logoutBtn.addEventListener("click", () => {
    netlifyIdentity.logout();
  });

  netlifyIdentity.on("login", (user) => {
    currentUser = user;
    showApp();
    netlifyIdentity.close();
  });

  netlifyIdentity.on("logout", () => {
    currentUser = null;
    showAuth();
  });

  // Check if already logged in
  const user = netlifyIdentity.currentUser();
  if (user) {
    currentUser = user;
    showApp();
  } else {
    showAuth();
  }
}

function showAuth() {
  document.getElementById("auth-screen").style.display = "";
  document.getElementById("app-main").style.display = "none";
}

function showApp() {
  document.getElementById("auth-screen").style.display = "none";
  document.getElementById("app-main").style.display = "";
  const name = currentUser?.user_metadata?.full_name || currentUser?.email || "Jugador";
  document.getElementById("user-display").textContent = `👤 ${name}`;
  boot();
}

/* === TABS === */
function initTabs() {
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
    });
  });
}

/* === RENDER MATCHES === */
function renderMatches(matches) {
  const container = document.getElementById("matches-container");
  container.innerHTML = "";

  // Group by stage
  const stages = {};
  for (const m of matches) {
    const key = m.stage === "group" ? `group-${m.group}` : m.stage;
    if (!stages[key]) stages[key] = [];
    stages[key].push(m);
  }

  for (const [key, items] of Object.entries(stages)) {
    const section = document.createElement("div");
    section.className = "group-section";

    const isGroup = key.startsWith("group-");
    const groupLetter = isGroup ? key.split("-")[1] : null;
    const label = isGroup ? `Grupo ${groupLetter}` : (STAGE_LABELS[key] || key);
    const teams = isGroup
      ? [...new Set(items.flatMap(m => [m.homeTeam, m.awayTeam]))]
          .map(t => `${flag(t)} ${t}`).join(" · ")
      : "";

    section.innerHTML = `
      <div class="group-header">
        <h3>${label}</h3>
        <span class="group-teams">${teams}</span>
      </div>
    `;

    for (const m of items) {
      section.appendChild(createMatchCard(m));
    }
    container.appendChild(section);
  }
}

function createMatchCard(m) {
  const card = document.createElement("article");
  const statusClass = m.displayStatus === "live" ? "is-live" : m.displayStatus === "finished" ? "is-finished" : "";
  card.className = `match-card ${statusClass}`;

  const badgeClass = m.stage === "group" ? "badge-group" : (STAGE_BADGE[m.stage] || "badge-scheduled");
  const stageLabel = m.stage === "group" ? `Grupo ${m.group}` : (STAGE_LABELS[m.stage] || m.stage);
  const statusBadge = m.displayStatus === "live" ? "badge-live"
    : m.displayStatus === "finished" ? "badge-finished" : "badge-scheduled";
  const statusLabel = m.displayStatus === "live" ? "EN VIVO"
    : m.displayStatus === "finished" ? "FINAL" : "PROG";

  card.innerHTML = `
    <div class="match-topline">
      <span class="badge ${badgeClass}">${stageLabel}</span>
      <span class="badge ${statusBadge}">${statusLabel}</span>
      <span class="match-date">${fmtDate(m.kickoffUtc)}</span>
    </div>
    <div class="teams-row">
      <div class="team-block home">
        <span class="team-flag">${flag(m.homeTeam)}</span>
        <span class="team-name">${m.homeTeam}</span>
      </div>
      <div class="score-display">
        <span>${fmtScore(m.result?.homeScore)}</span>
        <span class="sep">-</span>
        <span>${fmtScore(m.result?.awayScore)}</span>
      </div>
      <div class="team-block away">
        <span class="team-flag">${flag(m.awayTeam)}</span>
        <span class="team-name">${m.awayTeam}</span>
      </div>
    </div>
    <p class="match-venue">${m.venue || "Sede por confirmar"}</p>
  `;
  return card;
}

/* === RENDER LEADERBOARD === */
function renderLeaderboard(entries, generatedAt) {
  const body = document.getElementById("leaderboard-body");
  body.innerHTML = "";

  if (!entries.length) {
    body.innerHTML = `<tr><td colspan="3" class="empty-state">Sin participantes aún</td></tr>`;
    return;
  }

  entries.forEach((e, i) => {
    const rankClass = i < 3 ? `rank-${i + 1}` : "";
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="rank-cell ${rankClass}">${medal}</td>
      <td>
        <span>${e.displayName}</span>
        <span class="player-id-cell"> · ${e.userId}</span>
      </td>
      <td class="points-cell">${e.totalPoints}</td>
    `;
    body.appendChild(tr);
  });

  document.getElementById("leaderboard-updated").textContent =
    generatedAt ? `Actualizado: ${fmtDate(generatedAt)}` : "";
}

/* === RENDER STATS === */
function renderStats(matches, leaderboard) {
  const now = Date.now();
  const locked = matches.filter(m => Date.parse(m.lockUtc) <= now).length;
  const finished = matches.filter(m => m.displayStatus === "finished").length;

  document.getElementById("stat-matches").textContent = matches.length;
  document.getElementById("stat-locked").textContent = locked;
  document.getElementById("stat-players").textContent = leaderboard.entries?.length || 0;
  document.getElementById("stat-finished").textContent = finished;
}

/* === PICK EDITOR === */
function renderPickEditor(matches) {
  const container = document.getElementById("pick-editor");
  container.innerHTML = "";

  const groupMatches = matches.filter(m => m.stage === "group");
  if (!groupMatches.length) {
    container.innerHTML = `<div class="empty-state">No hay partidos disponibles</div>`;
    return;
  }

  // Group by group letter
  const groups = {};
  for (const m of groupMatches) {
    const g = m.group || "?";
    if (!groups[g]) groups[g] = [];
    groups[g].push(m);
  }

  for (const [g, items] of Object.entries(groups)) {
    const section = document.createElement("div");
    section.className = "pick-section";
    section.innerHTML = `<div class="pick-section-title">Grupo ${g}</div>`;

    for (const m of items) {
      const locked = Date.parse(m.lockUtc) <= Date.now();
      const row = document.createElement("div");
      row.className = `pick-row ${locked ? "locked" : ""}`;
      row.innerHTML = `
        <div class="pick-match-info">
          <p class="pick-match-title">${flag(m.homeTeam)} ${m.homeTeam} vs ${m.awayTeam} ${flag(m.awayTeam)}</p>
          <p class="pick-match-meta">${fmtDate(m.kickoffUtc)}</p>
        </div>
        <div class="pick-inputs">
          <input class="pick-input" type="number" min="0" max="20" inputmode="numeric"
            data-match="${m.id}" data-side="home" ${locked ? "disabled" : ""} aria-label="Goles ${m.homeTeam}" />
          <span class="pick-sep">-</span>
          <input class="pick-input" type="number" min="0" max="20" inputmode="numeric"
            data-match="${m.id}" data-side="away" ${locked ? "disabled" : ""} aria-label="Goles ${m.awayTeam}" />
        </div>
        ${locked ? '<span class="pick-lock-note">🔒</span>' : ""}
      `;
      section.appendChild(row);
    }
    container.appendChild(section);
  }

  // Listen for changes to update summary
  container.addEventListener("input", () => updatePickSummary(groupMatches));
}

function updatePickSummary(matches) {
  const filled = matches.filter(m => {
    const h = document.querySelector(`[data-match="${m.id}"][data-side="home"]`);
    const a = document.querySelector(`[data-match="${m.id}"][data-side="away"]`);
    return h && a && h.value !== "" && a.value !== "";
  }).length;
  document.getElementById("pick-summary").innerHTML =
    `<strong>${filled}</strong> de <strong>${matches.length}</strong> picks capturados`;
}

function collectPicks(matches) {
  const groupMatches = matches.filter(m => m.stage === "group");
  return groupMatches.map(m => {
    const h = document.querySelector(`[data-match="${m.id}"][data-side="home"]`);
    const a = document.querySelector(`[data-match="${m.id}"][data-side="away"]`);
    return {
      matchId: m.id,
      homeScore: h && h.value !== "" ? Number(h.value) : null,
      awayScore: a && a.value !== "" ? Number(a.value) : null
    };
  });
}

function buildPickPayload(matches) {
  const email = currentUser?.email || "anon";
  const name = currentUser?.user_metadata?.full_name || email.split("@")[0];
  return {
    userId: slugify(name) || slugify(email),
    displayName: name,
    email: email,
    submittedAtUtc: new Date().toISOString(),
    picks: collectPicks(matches)
  };
}

function setStatus(msg, isError) {
  const el = document.getElementById("form-status");
  el.textContent = msg;
  el.className = isError ? "form-status error" : "form-status";
}

/* === SAVE PICKS (Netlify Function) === */
async function savePicks(matches) {
  const payload = buildPickPayload(matches);
  // Save locally as backup
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

  try {
    const token = currentUser?.token?.access_token;
    const res = await fetch("/.netlify/functions/save-picks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `Error ${res.status}`);
    }

    setStatus("✅ Picks guardados correctamente");
  } catch (err) {
    console.error("Error guardando picks:", err);
    setStatus("⚠️ Guardado local OK. Error al enviar al servidor: " + err.message, true);
  }
}

function loadDraft(matches) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    const pickMap = new Map((draft.picks || []).map(p => [p.matchId, p]));
    for (const m of matches) {
      const p = pickMap.get(m.id);
      if (!p) continue;
      const h = document.querySelector(`[data-match="${m.id}"][data-side="home"]`);
      const a = document.querySelector(`[data-match="${m.id}"][data-side="away"]`);
      if (h && p.homeScore !== null) h.value = p.homeScore;
      if (a && p.awayScore !== null) a.value = p.awayScore;
    }
  } catch (e) { console.warn("No se pudo cargar borrador", e); }
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2) + "\n"], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* === MERGE DATA === */
function mergeData(matches, results, overrides) {
  const baseMap = new Map(results.map(r => [r.matchId, r]));
  const overMap = new Map((overrides.results || []).map(r => [r.matchId, r]));

  return matches.map(m => {
    const r = overMap.get(m.id) || baseMap.get(m.id) || {};
    return { ...m, result: r, displayStatus: r.status || m.status || "scheduled" };
  });
}

/* === BOOT === */
async function boot() {
  try {
    const [matchesData, resultsData, leaderboardData, overridesData] = await Promise.all([
      fetchJson(DATA.matches), fetchJson(DATA.results),
      fetchJson(DATA.leaderboard), fetchJson(DATA.overrides)
    ]);

    allMatches = mergeData(
      matchesData.matches || [], resultsData.results || [], overridesData
    );

    document.getElementById("tournament-name").textContent =
      matchesData.tournament?.name || "Quiniela Mundial 2026";

    renderStats(allMatches, leaderboardData);
    renderMatches(allMatches);
    renderLeaderboard(leaderboardData.entries || [], leaderboardData.generatedAtUtc);
    renderPickEditor(allMatches);
    loadDraft(allMatches);
    updatePickSummary(allMatches.filter(m => m.stage === "group"));

    // Wire up buttons
    document.getElementById("btn-save-picks").addEventListener("click", () => savePicks(allMatches));
    document.getElementById("btn-export-picks").addEventListener("click", () => {
      const payload = buildPickPayload(allMatches);
      downloadJson(`pick-${payload.userId}.json`, payload);
      setStatus("📤 JSON exportado");
    });
    document.getElementById("btn-clear-picks").addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      document.querySelectorAll(".pick-input").forEach(el => { if (!el.disabled) el.value = ""; });
      updatePickSummary(allMatches.filter(m => m.stage === "group"));
      setStatus("🗑️ Borrador limpiado");
    });

  } catch (err) {
    document.getElementById("app-main").innerHTML = `
      <div class="empty-state">
        <p>⚠️ Error cargando datos</p>
        <p>${err.message}</p>
      </div>
    `;
    console.error(err);
  }
}

/* === INIT === */
initTabs();
initAuth();
