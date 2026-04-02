#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const appDir = path.join(rootDir, "app");
const sourceDataDir = path.join(rootDir, "data");
const targetDataDir = path.join(appDir, "data");

fs.rmSync(targetDataDir, { recursive: true, force: true });
fs.cpSync(sourceDataDir, targetDataDir, { recursive: true });
fs.writeFileSync(path.join(appDir, ".nojekyll"), "", "utf8");

console.log("Static site data copied to app/data.");
