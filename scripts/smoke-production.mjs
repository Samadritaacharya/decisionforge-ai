import assert from "node:assert/strict";

const base = process.env.BASE_URL || "https://decisionforge-ai.vercel.app";

async function get(path, options = {}) {
  const res = await fetch(new URL(path, base), { redirect: "follow", ...options });
  const text = await res.text();
  return { res, text };
}

const home = await get("/");
assert.equal(home.res.status, 200, "Homepage must return 200");
assert.match(home.res.headers.get("content-type") || "", /text\/html/i, "Homepage must be HTML");
assert.match(home.text, /DecisionForge AI/, "Homepage must contain product title");
assert.match(home.text, /src\/app\.mjs/, "Homepage must reference app module");

const requiredHeaders = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "cross-origin-opener-policy": "same-origin"
};
for (const [name, expected] of Object.entries(requiredHeaders)) {
  assert.equal(home.res.headers.get(name), expected, `Missing/incorrect ${name}`);
}
const csp = home.res.headers.get("content-security-policy") || "";
assert.match(csp, /default-src 'self'/, "CSP default-src is missing");
assert.match(csp, /connect-src 'self'/, "CSP connect-src is missing");
assert.match(csp, /frame-ancestors 'none'/, "CSP frame-ancestors is missing");

for (const [path, type] of [
  ["/assets/favicon.svg", /image\/svg\+xml/i],
  ["/robots.txt", /text\/plain/i],
  ["/src/app.mjs", /(javascript|text\/plain)/i],
  ["/src/engine.mjs", /(javascript|text\/plain)/i]
]) {
  const r = await get(path);
  assert.equal(r.res.status, 200, `${path} must return 200`);
  assert.match(r.res.headers.get("content-type") || "", type, `${path} has unexpected content-type`);
}

const apiGet = await get("/api/synthesize");
assert.equal(apiGet.res.status, 405, "GET /api/synthesize must be rejected");
assert.equal(apiGet.res.headers.get("allow"), "POST", "API must advertise POST");

const validPayload = {
  recommendation: { recommendation: "Pilot the hybrid transformation." },
  evidence: [{ id: "E-FRAG", evidence: "Fragmented workflows." }]
};
const apiPost = await get("/api/synthesize", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(validPayload)
});
assert.equal(apiPost.res.status, 200, "POST /api/synthesize must succeed");
assert.equal(apiPost.res.headers.get("cache-control"), "no-store", "Synthesis API must disable caching");
const apiBody = JSON.parse(apiPost.text);
assert.ok(["deterministic-fallback", "provider"].includes(apiBody.mode), "Unexpected synthesis mode");
assert.ok(typeof apiBody.summary === "string" && apiBody.summary.length > 0, "Synthesis summary missing");

const invalidPost = await get("/api/synthesize", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify([])
});
assert.equal(invalidPost.res.status, 400, "Malformed synthesis payload must return 400");

console.log(JSON.stringify({
  base,
  homepage: home.res.status,
  apiMode: apiBody.mode,
  securityHeaders: "ok",
  assets: "ok",
  malformedRequestGuard: "ok"
}, null, 2));
