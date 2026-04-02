#!/usr/bin/env node

const path = require("path");
const {
  getMatchMap,
  listJsonFiles,
  readJsonFile,
  validatePickFileContent
} = require("./lib/picks");

const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");

function ensureUniqueMatchIds(matches) {
  const seen = new Set();

  for (const match of matches) {
    if (seen.has(match.id)) {
      throw new Error(`Duplicate match id: ${match.id}`);
    }
    seen.add(match.id);
  }
}

function ensurePickFilesAreValid(matches, picksDir) {
  const matchMap = getMatchMap(matches);
  const pickFiles = listJsonFiles(picksDir);

  for (const filePath of pickFiles) {
    const content = readJsonFile(filePath);
    validatePickFileContent(content, matchMap, path.basename(filePath));
  }
}

function main() {
  const matches = readJsonFile(path.join(dataDir, "matches.json")).matches || [];
  const picksDir = path.join(dataDir, "picks");

  ensureUniqueMatchIds(matches);
  ensurePickFilesAreValid(matches, picksDir);

  console.log("Validation passed.");
}

main();
