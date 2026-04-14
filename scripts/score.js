#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");

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

function getOutcome(homeScore, awayScore) {
  if (homeScore > awayScore) {
    return "home";
  }
  if (homeScore < awayScore) {
    return "away";
  }
  return "draw";
}

function scorePick(pick, result, match) {
  if (
    result.homeScore === null ||
    result.awayScore === null ||
    pick.homeScore === null ||
    pick.awayScore === null
  ) {
    return 0;
  }

  let points = 0;

  // Marcador exacto al 90 min: 3 puntos
  const exact = pick.homeScore === result.homeScore && pick.awayScore === result.awayScore;
  if (exact) {
    points = 3;
  } else {
    // Signo correcto al 90 min: 1 punto
    const predictedOutcome = getOutcome(pick.homeScore, pick.awayScore);
    const actualOutcome = getOutcome(result.homeScore, result.awayScore);
    if (predictedOutcome === actualOutcome) {
      points = 1;
    }
  }

  // Punto extra por clasificado en eliminatoria (solo si empate al 90)
  const isKnockout = match && match.stage !== "group";
  if (isKnockout && result.qualifiedTeam && pick.qualifiedTeam) {
    const drewAt90 = result.homeScore === result.awayScore;
    if (drewAt90 && pick.qualifiedTeam === result.qualifiedTeam) {
      points += 1;
    }
  }

  return points;
}

function buildLeaderboard() {
  const matchesData = readJson("matches.json");
  const matchMap = new Map((matchesData.matches || []).map((m) => [m.id, m]));
  const results = readJson("results.json").results || [];
  const overrides = readJson("overrides.json");
  const overrideMap = new Map(
    (overrides.results || []).map((r) => [r.matchId, r])
  );
  // Merge: overrides tienen prioridad sobre results
  const resultMap = new Map(results.map((result) => [result.matchId, result]));
  for (const [matchId, override] of overrideMap) {
    resultMap.set(matchId, override);
  }
  const picksDir = path.join(dataDir, "picks");
  const pickFiles = fs.readdirSync(picksDir).filter((file) => file.endsWith(".json"));

  const entries = pickFiles.map((file) => {
    const content = JSON.parse(fs.readFileSync(path.join(picksDir, file), "utf8"));
    const totalPoints = (content.picks || []).reduce((sum, pick) => {
      const result = resultMap.get(pick.matchId);
      const match = matchMap.get(pick.matchId);
      if (!result) {
        return sum;
      }
      return sum + scorePick(pick, result, match);
    }, 0);

    return {
      userId: content.userId,
      displayName: content.displayName,
      avatar: content.avatar || "",
      tagline: content.tagline || "",
      totalPoints
    };
  });

  entries.sort((left, right) => right.totalPoints - left.totalPoints);

  writeJson("leaderboard.json", {
    generatedAtUtc: new Date().toISOString(),
    entries
  });
}

buildLeaderboard();
