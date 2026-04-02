#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  buildPickFilename,
  getMatchMap,
  listJsonFiles,
  readJsonFile,
  validatePickFileContent
} = require("./lib/picks");

const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const inboxDir = path.join(rootDir, "inbox", "picks");
const targetDir = path.join(dataDir, "picks");

function main() {
  const matches = readJsonFile(path.join(dataDir, "matches.json")).matches || [];
  const matchMap = getMatchMap(matches);
  const files = listJsonFiles(inboxDir);

  if (!files.length) {
    console.log("No hay archivos para importar en inbox/picks.");
    return;
  }

  const imported = [];

  for (const filePath of files) {
    const content = readJsonFile(filePath);
    const label = path.basename(filePath);

    validatePickFileContent(content, matchMap, label);

    const targetName = buildPickFilename(content.userId);
    const targetPath = path.join(targetDir, targetName);
    fs.writeFileSync(targetPath, JSON.stringify(content, null, 2) + "\n", "utf8");
    imported.push({ source: label, target: targetName });
  }

  console.log(`Importados ${imported.length} archivo(s):`);
  for (const item of imported) {
    console.log(`- ${item.source} -> data/picks/${item.target}`);
  }
}

main();
