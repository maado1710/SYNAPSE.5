#!/usr/bin/env node
/**
 * After `vite build`, fill the service worker's version and precache list with
 * the hashed files the build produced, so the whole app is cached for offline use.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const staticDir = join(process.cwd(), ".vercel/output/static");
const swPath = join(staticDir, "sw.js");
const assetsDir = join(staticDir, "assets");

if (!existsSync(swPath) || !existsSync(assetsDir)) {
  console.warn("[sw] build output not found — offline caching list not injected.");
  process.exit(0);
}

const assets = readdirSync(assetsDir)
  .filter((f) => !f.endsWith(".map"))
  .sort()
  .map((f) => `/assets/${f}`);
const precache = [...assets, "/favicon.svg"];
const version = createHash("sha1").update(precache.join("\n")).digest("hex").slice(0, 10);

const source = readFileSync(swPath, "utf8")
  .replace("__SW_VERSION__", version)
  .replace("/*__PRECACHE__*/ []", JSON.stringify(precache));
writeFileSync(swPath, source);
console.log(`[sw] injected ${precache.length} files, version ${version}`);
