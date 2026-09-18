# Evaluation

## Functional checks

DecisionForge is verified across the complete portfolio workflow:

- the Decision Room initializes from the synthetic Northstar case;
- problem framing must be approved before downstream analysis is unlocked;
- all ten visible specialist-agent stages complete in sequence;
- scenario sensitivity controls recalculate economics and recommendation state;
- recommendation approval is reset whenever assumptions change;
- executive-brief export remains disabled until final human approval;
- a full re-run resets gates and downstream state safely;
- the optional executive-synthesis UI calls `/api/synthesize` when available;
- provider-backed synthesis degrades to deterministic fallback on missing configuration or provider failure;
- a plain static local frontend can fall back client-side when the serverless route is unavailable;
- every major finding references traceable evidence IDs;
- scenario reference files and CSV artifacts remain consistent with the in-code synthetic case;
- all company and regional data remains synthetic and independent of any real employer or client.

## Automated verification

`npm test` covers four layers.

### Decision engine

- headline FY2025/FY2026 economics;
- synthetic-dataset integrity and regional revenue reconciliation;
- issue-tree uniqueness and evidence traceability;
- diagnostic correlations and finding evidence;
- hypothesis confidence bounds;
- four-scenario ranking and financial sanity;
- sensitivity directionality;
- input clamping and missing/invalid-value fallback;
- EBIT, margin, payback and three-year-value reconciliation;
- stakeholder, risk and red-team outputs;
- recommendation/roadmap alignment;
- executive brief content and evidence trace;
- complete end-to-end decision-run artifacts.

### Optional synthesis API

- deterministic no-key fallback;
- method rejection;
- configured OpenAI-compatible provider path;
- provider failure fallback.

### Repository artifacts

- regional CSV ↔ in-code case reconciliation;
- financial CSV ↔ headline baseline reconciliation;
- scenario JSON ↔ engine definition reconciliation;
- independence checks for synthetic artifacts.

### Browser decision flow

A dependency-free DOM harness executes the actual `src/app.mjs` entrypoint and verifies:

- initialization;
- framing gate;
- analysis unlock;
- completion of all visible agent cards;
- recommendation rendering;
- recommendation approval;
- executive-brief download;
- executive synthesis;
- sensitivity-triggered approval reset;
- safe full re-run.

`npm run validate` additionally checks the static application contract: required files, unique HTML IDs, every DOM ID referenced by the app, navigation targets, interaction bindings, synthesis wiring, re-run safety, architecture assets and company-independence constraints.

## Architecture rendering

The README uses `architecture/decisionforge-architecture.svg` instead of relying on a very wide Mermaid graph. This avoids the blank/off-canvas rendering behavior that can occur in GitHub's compact Mermaid viewer while keeping the architecture source-controlled and reviewable.

## Known limitations

This portfolio implementation is a decision-support simulation, not a substitute for real client discovery, causal analysis or verified financial baselines. Regional correlations demonstrate analytical workflow only. A real engagement would require source-system validation, stakeholder interviews, legal/privacy review where relevant, and pilot-based causal confirmation.

The browser-flow regression test uses a lightweight dependency-free DOM harness rather than Chromium. Public-deployment visual regression should therefore still be performed after deployment.
