# DecisionForge AI — architecture and agent workflow

<p align="center">
  <img src="./decisionforge-architecture.svg" alt="DecisionForge AI architecture diagram" width="100%" />
</p>

DecisionForge is deliberately structured as a **decision system**, not a single chatbot. The browser experience coordinates ten specialist decision roles, two explicit human approval gates, a deterministic implementation-roadmap planner, evidence traceability, and an optional synthesis sidecar.

## Core decision chain

1. **Executive question** — defines the situation, complication and decision to be made.
2. **Problem Structuring Agent** — builds the SCQ, issue tree and initial hypotheses.
3. **Human Gate 1** — the user must approve framing before downstream analysis is unlocked.
4. **Diagnostic Analyst Agent** — calculates company and regional KPIs and identifies evidence-backed findings.
5. **Hypothesis Agent** — tests competing explanations and attaches confidence plus evidence IDs.
6. **Scenario Agent** — evaluates the strategic alternatives under four sensitivity assumptions.
7. **Financial Impact Engine** — calculates annual impact, investment, margin effect and payback.
8. **Stakeholder & Change Agent** — identifies adoption dependencies and ownership needs.
9. **Risk Agent** — builds execution risks and mitigations.
10. **Red-Team Agent** — challenges double-counting, causal overreach and downside sensitivity.
11. **Recommendation Agent** — selects the highest risk-adjusted modeled option and states guardrails.
12. **Implementation Roadmap Planner** — creates 0–90, 90–180 and 180–365 day execution phases.
13. **Human Gate 2** — final recommendation approval is required before executive-brief export.
14. **Executive Communication Agent** — creates the traceable executive decision brief.

The user interface presents **10 specialist agent cards**. The financial engine and roadmap planner are deterministic analytical/planning components in that chain rather than additional generative agents.

## Optional synthesis sidecar

The UI can call `POST /api/synthesize` after a recommendation exists.

- With `AI_API_BASE`, `AI_API_KEY` and `AI_MODEL` configured, the endpoint calls an OpenAI-compatible chat-completions provider.
- Without those variables, the endpoint returns a deterministic evidence-based fallback.
- If the frontend is running on a plain local static server where `/api/synthesize` does not exist, the browser falls back client-side instead of failing the decision flow.

Optional synthesis is **not required** for scenario modeling, recommendation generation, red-team analysis or executive-brief export.

## Component map

| Layer | Main files | Responsibility |
| --- | --- | --- |
| Experience | `index.html`, `styles.css` | Executive Decision Room, gates, sensitivity controls and outputs |
| UI orchestration | `src/app.mjs` | State transitions, re-runs, rendering, export and optional synthesis |
| Decision engine | `src/engine.mjs` | KPIs, hypotheses, scenarios, financials, risks, red team and recommendation |
| Synthetic case | `src/case-data.mjs`, `data/*.csv` | Fictional company, regional metrics and evidence |
| Scenario references | `scenarios/*.json` | Inspectable strategic-option reference files |
| Optional AI | `api/synthesize.js` | Provider-backed or deterministic executive synthesis |
| Verification | `tests/*.test.mjs`, `scripts/validate-static.mjs` | Model, API, UI-contract and static-integrity checks |
| Deployment | `vercel.json` | Static delivery, serverless route and security headers |

## Governance and traceability

- Every major finding carries evidence IDs.
- Correlations are treated as directional evidence rather than proof of causality.
- Sensitivity assumptions are visible and user-adjustable.
- The first human gate prevents silent problem reframing.
- The second human gate prevents unapproved recommendation export.
- Synthetic data and the fictional-company disclaimer remain visible in the product and exported brief.

The deterministic engine is intentionally inspectable: calculations, thresholds and evidence IDs live in source control so the result can be reviewed rather than accepted as opaque model output.
