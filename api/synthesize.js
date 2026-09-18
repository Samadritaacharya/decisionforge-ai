// Optional serverless synthesis endpoint.
// The core DecisionForge demo does not require an API key: it returns a deterministic,
// evidence-based synthesis when no provider configuration is present.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const payload = req.body || {};
  const { recommendation = {}, evidence = [] } = payload;

  const fallback = {
    mode: "deterministic-fallback",
    summary: recommendation.recommendation || "Run the DecisionForge analysis before requesting synthesis.",
    evidenceCount: Array.isArray(evidence) ? evidence.length : 0,
    note: "Set AI_API_BASE, AI_API_KEY and AI_MODEL on the deployment to enable optional provider-backed synthesis."
  };

  const { AI_API_BASE, AI_API_KEY, AI_MODEL } = process.env;
  if (!AI_API_BASE || !AI_API_KEY || !AI_MODEL) return res.status(200).json(fallback);

  try {
    const response = await fetch(`${AI_API_BASE.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", "authorization": `Bearer ${AI_API_KEY}` },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.2,
        messages: [
          { role: "system", content: "You are an executive synthesis agent. Use only the supplied evidence. State uncertainty explicitly. Return no more than 160 words." },
          { role: "user", content: JSON.stringify({ recommendation, evidence }) }
        ]
      })
    });
    if (!response.ok) return res.status(200).json({ ...fallback, providerError: `Provider returned ${response.status}` });
    const data = await response.json();
    const summary = data?.choices?.[0]?.message?.content;
    return res.status(200).json({ mode: "provider", summary: summary || fallback.summary, evidenceCount: fallback.evidenceCount });
  } catch (error) {
    return res.status(200).json({ ...fallback, providerError: error.message });
  }
}
