import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/synthesize.js";

function mockRes() {
  return {
    code: null,
    body: null,
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test("synthesis endpoint has a no-key deterministic fallback", async () => {
  const old = { base: process.env.AI_API_BASE, key: process.env.AI_API_KEY, model: process.env.AI_MODEL };
  delete process.env.AI_API_BASE; delete process.env.AI_API_KEY; delete process.env.AI_MODEL;
  const req = { method: "POST", body: { recommendation: { recommendation: "Pilot the hybrid transformation." }, evidence: ["E-FRAG"] } };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.code, 200);
  assert.equal(res.body.mode, "deterministic-fallback");
  assert.equal(res.body.evidenceCount, 1);
  assert.match(res.body.summary, /hybrid transformation/);
  if (old.base) process.env.AI_API_BASE = old.base;
  if (old.key) process.env.AI_API_KEY = old.key;
  if (old.model) process.env.AI_MODEL = old.model;
});

test("synthesis endpoint rejects non-POST", async () => {
  const res = mockRes();
  await handler({ method: "GET" }, res);
  assert.equal(res.code, 405);
});
