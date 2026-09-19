import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("vercel configuration is valid JSON with required production protections", () => {
  const config = JSON.parse(read("vercel.json"));
  assert.equal(config.cleanUrls, true);
  assert.equal(config.functions["api/*.js"].maxDuration, 10);

  const globalHeaders = config.headers.find(entry => entry.source === "/(.*)")?.headers || [];
  const headerMap = Object.fromEntries(globalHeaders.map(({ key, value }) => [key.toLowerCase(), value]));

  assert.equal(headerMap["x-content-type-options"], "nosniff");
  assert.equal(headerMap["x-frame-options"], "DENY");
  assert.equal(headerMap["referrer-policy"], "strict-origin-when-cross-origin");
  assert.equal(headerMap["cross-origin-opener-policy"], "same-origin");
  assert.match(headerMap["content-security-policy"], /default-src 'self'/);
  assert.match(headerMap["content-security-policy"], /connect-src 'self'/);
  assert.match(headerMap["content-security-policy"], /frame-ancestors 'none'/);

  const apiHeaders = config.headers.find(entry => entry.source === "/api/(.*)")?.headers || [];
  const apiHeaderMap = Object.fromEntries(apiHeaders.map(({ key, value }) => [key.toLowerCase(), value]));
  assert.equal(apiHeaderMap["cache-control"], "no-store");
});

test("production entrypoint exposes metadata, favicon and crawler policy", () => {
  const html = read("index.html");
  assert.match(html, /<meta name="description"/);
  assert.match(html, /<meta name="robots" content="index,follow"/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /property="og:url" content="https:\/\/decisionforge-ai\.vercel\.app\/"\s*\/?>/);
  assert.match(html, /rel="canonical" href="https:\/\/decisionforge-ai\.vercel\.app\/"\s*\/?>/);
  assert.match(html, /name="twitter:card"/);
  assert.match(html, /href="\.\/assets\/favicon\.svg"/);
  assert.match(html, /class="skip-link"/);
  assert.match(read("robots.txt"), /User-agent:\s*\*/);
  assert.match(read("assets/favicon.svg"), /^<svg\b/);
});
