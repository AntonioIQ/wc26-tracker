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

function scorePick(pick, result) {
  if (
    result.homeScore === null ||
    result.awayScore === null ||
    pick.homeScore === null ||
    pick.awayScore === null
  ) {
    return 0;
  }

  const exact = pick.homeScore === result.homeScore && pick.awayScore === result.awayScore;
  if (exact) {
    return 3;
  }

  const predictedOutcome = getOutcome(pick.homeScore, pick.awayScore);
  const actualOutcome = getOutcome(result.homeScore, result.awayScore);

  return predictedOutcome === actualOutcome ? 1 : 0;
}

function buildLeaderboard() {
  const results = readJson("results.json").results || [];
  const resultMap = new Map(results.map((result) => [result.matchId, result]));
  const picksDir = path.join(dataDir, "picks");
  const pickFiles = fs.readdirSync(picksDir).filter((file) => file.endsWith(".json"));

  const entries = pickFiles.map((file) => {
    const content = JSON.parse(fs.readFileSync(path.join(picksDir, file), "utf8"));
    const totalPoints = (content.picks || []).reduce((sum, pick) => {
      const result = resultMap.get(pick.matchId);
      if (!result) {
        return sum;
      }
      return sum + scorePick(pick, result);
    }, 0);

    return {
      userId: content.userId,
      displayName: content.displayName,
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
