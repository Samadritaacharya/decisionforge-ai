// Optional serverless synthesis endpoint.
// The core DecisionForge demo does not require an API key. When no provider
// configuration is present, this route returns a deterministic evidence-based summary.

const MAX_BODY_CHARS = 40_000;
const MAX_EVIDENCE_ITEMS = 20;
const PROVIDER_TIMEOUT_MS = 8_000;

function fallbackFor(recommendation, evidenceCount) {
  return {
    mode: "deterministic-fallback",
    summary: recommendation?.recommendation || "Run the DecisionForge analysis before requesting synthesis.",
    evidenceCount,
    note: "Set AI_API_BASE, AI_API_KEY and AI_MODEL on the deployment to enable optional provider-backed synthesis."
  };
}

function normalizePayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object." };
  }

  let serialized;
  try {
    serialized = JSON.stringify(body);
  } catch {
    return { error: "Request body must be JSON-serializable." };
  }

  if (serialized.length > MAX_BODY_CHARS) {
    return { error: "Request body is too large." };
  }

  const recommendation = body.recommendation;
  const evidence = body.evidence;

  if (!recommendation || typeof recommendation !== "object" || Array.isArray(recommendation)) {
    return { error: "recommendation must be an object." };
  }
  if (!Array.isArray(evidence)) {
    return { error: "evidence must be an array." };
  }
  if (evidence.length > MAX_EVIDENCE_ITEMS) {
    return { error: `evidence may contain at most ${MAX_EVIDENCE_ITEMS} items.` };
  }

  return { recommendation, evidence };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const normalized = normalizePayload(req.body);
  if (normalized.error) return res.status(400).json({ error: normalized.error });

  const { recommendation, evidence } = normalized;
  const fallback = fallbackFor(recommendation, evidence.length);

  const { AI_API_BASE, AI_API_KEY, AI_MODEL } = process.env;
  if (!AI_API_BASE || !AI_API_KEY || !AI_MODEL) {
    return res.status(200).json(fallback);
  }

  try {
    const response = await fetch(`${AI_API_BASE.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${AI_API_KEY}`
      },
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.2,
        max_tokens: 260,
        messages: [
          {
            role: "system",
            content: "You are an executive synthesis agent. Use only the supplied evidence. State uncertainty explicitly. Return no more than 160 words."
          },
          {
            role: "user",
            content: JSON.stringify({ recommendation, evidence })
          }
        ]
      })
    });

    if (!response.ok) {
      return res.status(200).json({ ...fallback, providerError: `Provider returned ${response.status}` });
    }

    const data = await response.json();
    const summary = data?.choices?.[0]?.message?.content;

    return res.status(200).json({
      mode: "provider",
      summary: typeof summary === "string" && summary.trim() ? summary.trim() : fallback.summary,
      evidenceCount: evidence.length
    });
  } catch (error) {
    const providerError = error?.name === "TimeoutError" ? "Provider request timed out" : "Provider request failed";
    return res.status(200).json({ ...fallback, providerError });
  }
}
