# DecisionForge AI

[![DecisionForge CI](https://github.com/Samadritaacharya/decisionforge-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/Samadritaacharya/decisionforge-ai/actions/workflows/ci.yml)
[![Live App](https://img.shields.io/badge/Live%20App-decisionforge--ai.vercel.app-111827?logo=vercel)](https://decisionforge-ai.vercel.app/)

### Agentic Strategy & Transformation Workbench

**DecisionForge AI** is an evidence-driven decision-support workspace that turns an ambiguous management problem into a structured, inspectable decision chain: **problem framing → hypotheses → diagnostics → strategic alternatives → financial impact → risk → red-team challenge → recommendation → implementation**.

The demo uses a fictional European B2B services company, **Northstar Services Group**, and entirely synthetic data. It is intentionally built to demonstrate structured business problem solving rather than company-specific knowledge.

## Executive case

Revenue has grown **11.0%**, yet EBIT margin has fallen from **14.0% to 8.0%**. Customer satisfaction is down, cycle time is up and performance varies materially across 12 regional business units.

> **Management question:** How should the company restore margin while protecting growth and customer experience?

## What makes this different from a chatbot

DecisionForge separates specialist responsibilities and keeps assumptions visible:

1. **Problem Structuring Agent** — SCQ, MECE-style issue tree and hypotheses.
2. **Diagnostic Analyst Agent** — KPI, regional and driver analysis.
3. **Hypothesis Agent** — tests competing explanations.
4. **Scenario Agent** — models four strategic alternatives.
5. **Financial Impact Engine** — value, investment, margin and payback.
6. **Stakeholder & Change Agent** — adoption dependencies and stakeholder needs.
7. **Risk Agent** — execution and value-realization risk register.
8. **Red-Team Agent** — challenges double-counting, causal overreach and downside sensitivity.
9. **Recommendation Agent** — synthesizes trade-offs into a decision.
10. **Executive Communication Agent** — produces an exportable management brief.

Two **human approval gates** keep accountability explicit. Evidence IDs are carried through the analysis so the recommendation has a traceable audit trail.

## Live product behavior

The app works with **no API key and no paid service**. Its deterministic decision engine is fully inspectable in `src/engine.mjs`. An optional OpenAI-compatible synthesis endpoint exists in `api/synthesize.js`; the UI calls it when available and safely falls back to an evidence-based deterministic summary when provider configuration or the serverless route is unavailable.

### Sensitivity controls

The live case lets users adjust:

- savings realization;
- implementation cost;
- disruption;
- adoption.

Scenario economics and the recommendation are recalculated immediately.

## Architecture

<p align="center">
  <img src="./architecture/decisionforge-architecture.svg" alt="DecisionForge AI decision architecture showing the executive question, specialist agents, two human approval gates, deterministic roadmap planning, optional synthesis, and the executive decision brief." width="100%" />
</p>

The core flow uses **10 specialist decision roles**, **2 explicit human approval gates**, and a deterministic implementation-roadmap planner. The optional `/api/synthesize` sidecar can use an OpenAI-compatible provider when configured and otherwise falls back safely.

Detailed workflow and component map: [`architecture/agent-workflow.md`](architecture/agent-workflow.md)

## Run locally

No dependencies are required.

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Test

```bash
npm test
npm run validate
# or
npm run check
```

The repository uses only Node's built-in test runner, so CI does not require dependency installation.

## Live app

**Production:** https://decisionforge-ai.vercel.app/

The deployed Vercel production URL is covered by a public smoke test that verifies the homepage, static assets, production security headers, deterministic synthesis fallback, and malformed-request handling.

## Production readiness

The project is deployment-ready for Vercel as a static frontend with an optional serverless `/api/synthesize` endpoint.

Production hardening includes:

- CSP, clickjacking, MIME-sniffing, referrer and permissions headers;
- no-store behavior for synthesis responses;
- bounded synthesis payloads and provider timeout handling;
- deterministic fallback if no AI provider is configured or the provider fails;
- keyboard focus, skip navigation and reduced-motion support;
- Open Graph/Twitter metadata, favicon and crawler policy;
- automated Vercel deployment-contract tests;
- a reusable production smoke test in `.github/workflows/production-smoke.yml`.

No paid API is required for the core demo.

## Repository map

```text
.
├── index.html                    # Executive decision room
├── styles.css                   # Responsive consulting-style UI
├── src/
│   ├── app.mjs                  # UI state, gates, sensitivity controls, export
│   ├── case-data.mjs            # Synthetic company + regional case data
│   └── engine.mjs               # Agentic decision engine
├── api/synthesize.js            # Optional provider-backed synthesis + fallback
├── assets/favicon.svg            # Product favicon
├── robots.txt                    # Crawler policy
├── data/                         # Synthetic CSV evidence
├── scenarios/                    # Scenario reference files
├── architecture/
│   ├── decisionforge-architecture.svg # Stable README architecture diagram
│   └── agent-workflow.md
├── tests/
│   ├── engine.test.mjs
│   ├── api.test.mjs
│   ├── artifacts.test.mjs
│   ├── ui-flow.test.mjs
│   └── deployment.test.mjs
├── scripts/validate-static.mjs
├── CASE_STUDY.md
├── METHODOLOGY.md
├── EVALUATION.md
└── EXECUTIVE_BRIEF.md
```

## Responsible use

DecisionForge is a portfolio demonstration of decision-support architecture. It does **not** represent a real company, client engagement or proprietary dataset, and it should not be used for real financial decisions without verified source data and human review.

## License

MIT
