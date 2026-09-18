# Evaluation

## Functional checks

- End-to-end decision chain runs without an external API key.
- Scenario sensitivity controls change modeled economics and can change rankings.
- Human approval gates block downstream actions until accepted.
- Executive brief export is disabled until final approval.
- Every major finding references evidence IDs.
- All company and regional data is synthetic.

## Automated tests

`npm test` validates:

- baseline economics;
- issue-tree and evidence structure;
- base-case scenario ranking;
- downside-sensitivity behavior;
- end-to-end generation of recommendation, red-team output, risks, roadmap and executive brief.

`npm run validate` checks the static application contract and interaction hooks.

## Known limitations

This portfolio implementation is a decision-support simulation, not a substitute for real client discovery, causal analysis or verified financial baselines. Regional correlations demonstrate analytical workflow only. A real engagement would require source-system validation, stakeholder interviews and pilot-based causal confirmation.
