#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const expectedEngine = ">=22.23.4 <23 || >=24.22.1 <25";
const expectedImage =
  "node:24.22.1-bookworm-slim@sha256:1681862882da07ee5476fee047bcf34138833f1df42633bb25bcb0f438d5bf3d";
const minimumVersions = new Map([
  [22, [22, 23, 4]],
  [24, [24, 22, 1]],
]);
const errors = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function compareVersions(left, right) {
  for (let i = 0; i < 3; i += 1) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return 0;
}

const packageJson = JSON.parse(read("package.json"));
if (packageJson.engines?.node !== expectedEngine) {
  errors.push(`package.json engines.node must be "${expectedEngine}"`);
}

const lockfile = JSON.parse(read("package-lock.json"));
if (lockfile.packages?.[""]?.engines?.node !== expectedEngine) {
  errors.push(`package-lock.json root engines.node must be "${expectedEngine}"`);
}

const dockerfile = read("Dockerfile");
const nodeImages = dockerfile
  .split(/\r?\n/u)
  .map((line) => line.match(/^FROM\s+(node:\S+)/iu)?.[1])
  .filter(Boolean);

if (nodeImages.length !== 2) {
  errors.push(
    `Dockerfile must contain exactly two Node.js base stages; found ${nodeImages.length}`,
  );
}
for (const image of nodeImages) {
  if (image !== expectedImage) {
    errors.push(`Dockerfile Node.js base must be pinned to ${expectedImage}; found ${image}`);
  }
}

const ciWorkflow = read(".github/workflows/ci.yml");
for (const version of ["22.23.4", "24.22.1"]) {
  if (!ciWorkflow.includes(`"${version}"`)) {
    errors.push(`CI matrix must test Node.js ${version}`);
  }
}
if (
  /node-version:\s*\[[^\]]*20/u.test(ciWorkflow) ||
  /node-version:\s*["']?20(?:\.|["'])/u.test(ciWorkflow)
) {
  errors.push("CI must not run on end-of-life Node.js 20");
}

const releaseWorkflow = read(".github/workflows/release-publish.yml");
if (!releaseWorkflow.includes('node-version: "24.22.1"')) {
  errors.push("npm release workflow must use Node.js 24.22.1");
}

if (process.argv.includes("--runtime")) {
  const current = process.versions.node.split(".").map(Number);
  const minimum = minimumVersions.get(current[0]);
  if (!minimum || compareVersions(current, minimum) < 0) {
    errors.push(
      `runtime Node.js ${process.versions.node} is below the secure supported baseline (${expectedEngine})`,
    );
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}

console.log(
  process.argv.includes("--runtime")
    ? `Secure Node.js runtime verified: ${process.versions.node}`
    : "Secure Node.js manifest, lockfile, Docker, and CI baselines verified",
);
