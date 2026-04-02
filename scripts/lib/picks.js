const fs = require("fs");
const path = require("path");

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function getMatchMap(matches) {
  return new Map(matches.map((match) => [match.id, match]));
}

function validatePickFileContent(content, matchMap, contextLabel) {
  assert(content && typeof content === "object", `${contextLabel}: expected object root`);
  assert(typeof content.userId === "string" && content.userId.trim(), `${contextLabel}: missing userId`);
  assert(
    typeof content.displayName === "string" && content.displayName.trim(),
    `${contextLabel}: missing displayName`
  );
  assert(
    typeof content.submittedAtUtc === "string" && !Number.isNaN(Date.parse(content.submittedAtUtc)),
    `${contextLabel}: invalid submittedAtUtc`
  );
  assert(Array.isArray(content.picks), `${contextLabel}: picks must be an array`);

  const seenMatchIds = new Set();

  for (const pick of content.picks) {
    assert(pick && typeof pick === "object", `${contextLabel}: invalid pick entry`);
    assert(typeof pick.matchId === "string" && pick.matchId.trim(), `${contextLabel}: missing matchId`);
    assert(!seenMatchIds.has(pick.matchId), `${contextLabel}: duplicate matchId ${pick.matchId}`);
    seenMatchIds.add(pick.matchId);

    const match = matchMap.get(pick.matchId);
    assert(match, `${contextLabel}: unknown matchId ${pick.matchId}`);

    if (pick.homeScore !== null) {
      assert(Number.isInteger(pick.homeScore) && pick.homeScore >= 0, `${contextLabel}: invalid homeScore for ${pick.matchId}`);
    }
    if (pick.awayScore !== null) {
      assert(Number.isInteger(pick.awayScore) && pick.awayScore >= 0, `${contextLabel}: invalid awayScore for ${pick.matchId}`);
    }

    const hasBothScores = pick.homeScore !== null && pick.awayScore !== null;
    const hasSingleScore = (pick.homeScore === null) !== (pick.awayScore === null);
    assert(!hasSingleScore, `${contextLabel}: incomplete score for ${pick.matchId}`);

    if (hasBothScores) {
      const submittedAt = Date.parse(content.submittedAtUtc);
      const lockAt = Date.parse(match.lockUtc);
      assert(submittedAt <= lockAt, `${contextLabel}: late pick for ${pick.matchId}`);
    }
  }
}

function listJsonFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => path.join(directory, file));
}

function buildPickFilename(userId) {
  return `${slugify(userId) || "participante"}.json`;
}

module.exports = {
  buildPickFilename,
  getMatchMap,
  listJsonFiles,
  readJsonFile,
  validatePickFileContent
};
