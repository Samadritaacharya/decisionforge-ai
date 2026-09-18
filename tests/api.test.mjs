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

function snapshotEnv() {
  return {
    base: process.env.AI_API_BASE,
    key: process.env.AI_API_KEY,
    model: process.env.AI_MODEL
  };
}

function restoreEnv(old) {
  if (old.base === undefined) delete process.env.AI_API_BASE; else process.env.AI_API_BASE = old.base;
  if (old.key === undefined) delete process.env.AI_API_KEY; else process.env.AI_API_KEY = old.key;
  if (old.model === undefined) delete process.env.AI_MODEL; else process.env.AI_MODEL = old.model;
}

test("synthesis endpoint has a no-key deterministic fallback", async () => {
  const old = snapshotEnv();
  delete process.env.AI_API_BASE;
  delete process.env.AI_API_KEY;
  delete process.env.AI_MODEL;

  try {
    const req = {
      method: "POST",
      body: {
        recommendation: { recommendation: "Pilot the hybrid transformation." },
        evidence: ["E-FRAG"]
      }
    };
    const res = mockRes();
    await handler(req, res);
    assert.equal(res.code, 200);
    assert.equal(res.body.mode, "deterministic-fallback");
    assert.equal(res.body.evidenceCount, 1);
    assert.match(res.body.summary, /hybrid transformation/);
  } finally {
    restoreEnv(old);
  }
});

test("synthesis endpoint rejects non-POST", async () => {
  const res = mockRes();
  await handler({ method: "GET" }, res);
  assert.equal(res.code, 405);
  assert.match(res.body.error, /Method not allowed/);
});

test("configured provider path calls the OpenAI-compatible chat-completions endpoint", async () => {
  const old = snapshotEnv();
  const oldFetch = globalThis.fetch;
  process.env.AI_API_BASE = "https://provider.example/v1/";
  process.env.AI_API_KEY = "test-key";
  process.env.AI_MODEL = "test-model";

  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return {
      ok: true,
      status: 200,
      async json() {
        return { choices: [{ message: { content: "Provider-backed executive synthesis." } }] };
      }
    };
  };

  try {
    const res = mockRes();
    await handler({
      method: "POST",
      body: {
        recommendation: { recommendation: "Sequence the hybrid transformation." },
        evidence: [{ id: "E-FRAG", evidence: "Fragmented workflows." }]
      }
    }, res);

    assert.equal(res.code, 200);
    assert.equal(res.body.mode, "provider");
    assert.equal(res.body.summary, "Provider-backed executive synthesis.");
    assert.equal(res.body.evidenceCount, 1);
    assert.equal(captured.url, "https://provider.example/v1/chat/completions");
    assert.equal(captured.options.method, "POST");
    assert.equal(captured.options.headers.authorization, "Bearer test-key");
    const request = JSON.parse(captured.options.body);
    assert.equal(request.model, "test-model");
    assert.equal(request.temperature, 0.2);
    assert.equal(request.messages.length, 2);
  } finally {
    globalThis.fetch = oldFetch;
    restoreEnv(old);
  }
});

test("provider failures degrade to deterministic fallback instead of breaking the route", async () => {
  const old = snapshotEnv();
  const oldFetch = globalThis.fetch;
  process.env.AI_API_BASE = "https://provider.example/v1";
  process.env.AI_API_KEY = "test-key";
  process.env.AI_MODEL = "test-model";

  globalThis.fetch = async () => ({ ok: false, status: 503 });

  try {
    const res = mockRes();
    await handler({
      method: "POST",
      body: {
        recommendation: { recommendation: "Keep the deterministic recommendation." },
        evidence: []
      }
    }, res);

    assert.equal(res.code, 200);
    assert.equal(res.body.mode, "deterministic-fallback");
    assert.equal(res.body.summary, "Keep the deterministic recommendation.");
    assert.match(res.body.providerError, /503/);
  } finally {
    globalThis.fetch = oldFetch;
    restoreEnv(old);
  }
});
