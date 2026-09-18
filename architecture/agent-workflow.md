# Agent workflow

```mermaid
flowchart LR
  A[Executive Question] --> B[Problem Structuring Agent]
  B --> H1{Human Gate 1}
  H1 --> C[Diagnostic Analyst]
  C --> D[Hypothesis Agent]
  D --> E[Scenario Agent]
  E --> F[Financial Impact Engine]
  F --> G[Stakeholder & Change Agent]
  G --> I[Risk Agent]
  I --> J[Red-Team Agent]
  J --> K[Recommendation Agent]
  K --> H2{Human Gate 2}
  H2 --> L[Executive Communication Agent]
```

The deterministic engine is intentionally inspectable: calculations, thresholds and evidence IDs live in source control. An optional provider-backed synthesis endpoint can be enabled at deployment time, but the portfolio demo never depends on it.
