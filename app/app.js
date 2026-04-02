const DATA_FILES = {
  matches: "./data/matches.json",
  results: "./data/results.json",
  leaderboard: "./data/leaderboard.json",
  overrides: "./data/overrides.json"
};
const STORAGE_KEY = "quiniela-mundial-local-draft";

async function readJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${path}`);
  }
  return response.json();
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Pendiente";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(dateValue));
}

function formatStatus(status) {
  const labels = {
    finished: "Finalizado",
    scheduled: "Programado",
    live: "En juego"
  };

  return labels[status] || "Desconocido";
}

function formatStage(match) {
  if (match.stage === "group" && match.group) {
    return `Grupo ${match.group}`;
  }

  return match.stage || "Sin etapa";
}

function scoreText(score) {
  return Number.isFinite(score) ? String(score) : "-";
}

function normalizeText(value) {
  return String(value || "").trim();
}

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getStoredDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("No se pudo leer el borrador local.", error);
    return null;
  }
}

function saveStoredDraft(draft) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

function clearStoredDraft() {
  localStorage.removeItem(STORAGE_KEY);
}

function mergeMatchesWithResults(matches, results, overrides) {
  const baseResults = new Map(results.map((result) => [result.matchId, result]));
  const overrideResults = new Map((overrides.results || []).map((result) => [result.matchId, result]));

  return matches.map((match) => {
    const raw = overrideResults.get(match.id) || baseResults.get(match.id) || {};
    return {
      ...match,
      result: raw,
      displayStatus: raw.status || match.status || "scheduled"
    };
  });
}

function renderEmpty(container, message) {
  container.innerHTML = `<div class="empty-state">${message}</div>`;
}

function renderMatches(items) {
  const container = document.querySelector("#matches-list");
  const summary = document.querySelector("#matches-summary");
  const template = document.querySelector("#match-template");

  summary.textContent = `${items.length} partidos`;

  if (!items.length) {
    renderEmpty(container, "No hay partidos cargados todavia.");
    return;
  }

  container.innerHTML = "";

  for (const item of items) {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector(".stage-badge").textContent = formatStage(item);
    const statusNode = fragment.querySelector(".status-badge");
    statusNode.textContent = formatStatus(item.displayStatus);
    statusNode.classList.add(`status-${item.displayStatus}`);
    fragment.querySelector(".home-team").textContent = item.homeTeam;
    fragment.querySelector(".away-team").textContent = item.awayTeam;
    fragment.querySelector(".home-score").textContent = scoreText(item.result.homeScore);
    fragment.querySelector(".away-score").textContent = scoreText(item.result.awayScore);
    fragment.querySelector(".kickoff-value").textContent = formatDate(item.kickoffUtc);
    fragment.querySelector(".lock-value").textContent = formatDate(item.lockUtc);
    fragment.querySelector(".venue-value").textContent = item.venue || "Pendiente";
    fragment.querySelector(".group-value").textContent = item.group || "-";
    container.appendChild(fragment);
  }
}

function renderLeaderboard(entries, generatedAtUtc) {
  const container = document.querySelector("#leaderboard-list");
  const summary = document.querySelector("#leaderboard-summary");
  const template = document.querySelector("#leaderboard-template");

  summary.textContent = `${entries.length} participantes`;

  if (!entries.length) {
    renderEmpty(container, "Todavia no hay participantes importados.");
    return;
  }

  container.innerHTML = "";

  entries.forEach((entry, index) => {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector(".rank-slot").textContent = index + 1;
    fragment.querySelector(".player-name").textContent = entry.displayName;
    fragment.querySelector(".player-id").textContent = entry.userId;
    fragment.querySelector(".points-slot").textContent = entry.totalPoints;
    container.appendChild(fragment);
  });

  document.querySelector("#generation-time").textContent = `Tabla: ${formatDate(generatedAtUtc)}`;
}

function renderStats(matches, leaderboard, lastResultUpdate) {
  const now = Date.now();
  const locked = matches.filter((item) => Date.parse(item.lockUtc) <= now).length;

  document.querySelector("#stat-matches").textContent = matches.length;
  document.querySelector("#stat-locked").textContent = locked;
  document.querySelector("#stat-players").textContent = leaderboard.entries.length;
  document.querySelector("#stat-updated").textContent = formatDate(lastResultUpdate);
}

function renderNotes({ matches, leaderboard, overrides }) {
  const notes = [
    {
      title: "Fuente de verdad",
      body: "Los datos publicados salen del repositorio. Si una automatizacion falla, el sitio sigue mostrando el ultimo estado valido."
    },
    {
      title: "Correcciones",
      body: `Overrides activos: ${(overrides.results || []).length}. Este archivo debe ganar sobre cualquier ingest automatizado.`
    },
    {
      title: "Recalculo",
      body: `La tabla actual tiene ${leaderboard.entries.length} participante(s) y puede regenerarse por completo desde JSON y scripts.`
    }
  ];

  if (!matches.length) {
    notes.push({
      title: "Carga inicial",
      body: "Aun no hay calendario suficiente. El siguiente paso es completar matches.json con el torneo real."
    });
  }

  const container = document.querySelector("#system-notes");
  container.innerHTML = "";

  for (const note of notes) {
    const card = document.createElement("article");
    card.className = "note-card";
    card.innerHTML = `<h3>${note.title}</h3><p>${note.body}</p>`;
    container.appendChild(card);
  }
}

function buildDraftFromForm(matches) {
  const userIdNode = document.querySelector("#user-id");
  const displayNameNode = document.querySelector("#display-name");
  const fallbackId = slugify(displayNameNode.value) || slugify(userIdNode.value) || "participante";
  const picks = matches.map((match) => {
    const homeNode = document.querySelector(`[data-match-id="${match.id}"][data-side="home"]`);
    const awayNode = document.querySelector(`[data-match-id="${match.id}"][data-side="away"]`);
    const homeScore = homeNode.value === "" ? null : Number(homeNode.value);
    const awayScore = awayNode.value === "" ? null : Number(awayNode.value);

    return {
      matchId: match.id,
      homeScore,
      awayScore
    };
  });

  return {
    userId: normalizeText(userIdNode.value) || fallbackId,
    displayName: normalizeText(displayNameNode.value) || "Participante local",
    submittedAtUtc: new Date().toISOString(),
    picks
  };
}

function applyDraftToForm(matches, draft) {
  if (!draft) {
    return;
  }

  document.querySelector("#user-id").value = draft.userId || "";
  document.querySelector("#display-name").value = draft.displayName || "";

  const pickMap = new Map((draft.picks || []).map((pick) => [pick.matchId, pick]));

  for (const match of matches) {
    const pick = pickMap.get(match.id);
    if (!pick) {
      continue;
    }
    const homeNode = document.querySelector(`[data-match-id="${match.id}"][data-side="home"]`);
    const awayNode = document.querySelector(`[data-match-id="${match.id}"][data-side="away"]`);
    homeNode.value = Number.isFinite(pick.homeScore) ? pick.homeScore : "";
    awayNode.value = Number.isFinite(pick.awayScore) ? pick.awayScore : "";
  }
}

function getFilledPickCount(matches) {
  return matches.filter((match) => {
    const homeNode = document.querySelector(`[data-match-id="${match.id}"][data-side="home"]`);
    const awayNode = document.querySelector(`[data-match-id="${match.id}"][data-side="away"]`);
    return homeNode.value !== "" && awayNode.value !== "";
  }).length;
}

function updateEditorSummary(matches) {
  const filled = getFilledPickCount(matches);
  document.querySelector("#editor-summary").textContent = `${filled} de ${matches.length} picks capturados`;
}

function setFormStatus(message) {
  document.querySelector("#form-status").textContent = message;
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2) + "\n"], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function renderPickEditor(matches) {
  const container = document.querySelector("#pick-editor");
  const template = document.querySelector("#pick-row-template");

  if (!matches.length) {
    renderEmpty(container, "No hay partidos disponibles para capturar picks.");
    return;
  }

  container.innerHTML = "";

  for (const match of matches) {
    const fragment = template.content.cloneNode(true);
    const row = fragment.querySelector(".pick-row");
    const locked = Date.parse(match.lockUtc) <= Date.now();
    fragment.querySelector(".pick-match-title").textContent = `${match.homeTeam} vs ${match.awayTeam}`;
    fragment.querySelector(".pick-match-meta").textContent = `${formatStage(match)} · ${formatDate(match.kickoffUtc)}`;
    fragment.querySelector(".pick-lock-note").textContent = locked
      ? `Cerrado desde ${formatDate(match.lockUtc)}`
      : `Cierra ${formatDate(match.lockUtc)}`;

    const homeInput = fragment.querySelector(".pick-home-score");
    const awayInput = fragment.querySelector(".pick-away-score");
    homeInput.dataset.matchId = match.id;
    homeInput.dataset.side = "home";
    awayInput.dataset.matchId = match.id;
    awayInput.dataset.side = "away";
    homeInput.disabled = locked;
    awayInput.disabled = locked;

    if (locked) {
      row.classList.add("locked");
    }

    container.appendChild(fragment);
  }

  container.addEventListener("input", () => updateEditorSummary(matches), { passive: true });
}

function attachEditorActions(matches) {
  document.querySelector("#save-draft").addEventListener("click", () => {
    const draft = buildDraftFromForm(matches);
    saveStoredDraft(draft);
    updateEditorSummary(matches);
    setFormStatus("Borrador guardado en localStorage.");
  });

  document.querySelector("#export-picks").addEventListener("click", () => {
    const draft = buildDraftFromForm(matches);
    saveStoredDraft(draft);
    updateEditorSummary(matches);
    const safeUserId = slugify(draft.userId) || "participante";
    downloadJson(`pick-${safeUserId}.json`, draft);
    setFormStatus("JSON exportado. Ese archivo se puede importar despues al repo.");
  });

  document.querySelector("#clear-draft").addEventListener("click", () => {
    clearStoredDraft();
    document.querySelector("#pick-form").reset();
    document.querySelectorAll(".pick-home-score, .pick-away-score").forEach((node) => {
      if (!node.disabled) {
        node.value = "";
      }
    });
    updateEditorSummary(matches);
    setFormStatus("Borrador local eliminado.");
  });
}

async function boot() {
  try {
    const [matchesData, resultsData, leaderboardData, overridesData] = await Promise.all([
      readJson(DATA_FILES.matches),
      readJson(DATA_FILES.results),
      readJson(DATA_FILES.leaderboard),
      readJson(DATA_FILES.overrides)
    ]);

    const mergedMatches = mergeMatchesWithResults(
      matchesData.matches || [],
      resultsData.results || [],
      overridesData
    );

    const latestResultUpdate = (resultsData.results || []).reduce((latest, item) => {
      if (!item.updatedAtUtc) {
        return latest;
      }
      if (!latest || Date.parse(item.updatedAtUtc) > Date.parse(latest)) {
        return item.updatedAtUtc;
      }
      return latest;
    }, null);

    document.querySelector("#tournament-name").textContent =
      matchesData.tournament?.name || "Quiniela Mundial";
    document.querySelector("#tournament-timezone").textContent =
      `TZ base: ${matchesData.tournament?.timezone || "UTC"}`;

    renderStats(mergedMatches, leaderboardData, latestResultUpdate);
    renderMatches(mergedMatches);
    renderLeaderboard(
      leaderboardData.entries || [],
      leaderboardData.generatedAtUtc || latestResultUpdate
    );
    renderPickEditor(mergedMatches);
    applyDraftToForm(mergedMatches, getStoredDraft());
    updateEditorSummary(mergedMatches);
    attachEditorActions(mergedMatches);
    renderNotes({
      matches: mergedMatches,
      leaderboard: leaderboardData,
      overrides: overridesData
    });
  } catch (error) {
    document.querySelector(".shell").innerHTML = `
      <section class="panel">
        <p class="section-kicker">Error</p>
        <h2>No se pudo cargar la quiniela</h2>
        <p class="hero-copy">${error.message}</p>
      </section>
    `;
    console.error(error);
  }
}

boot();
