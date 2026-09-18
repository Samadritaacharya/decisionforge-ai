import { caseData, scenarioDefinitions } from "./case-data.mjs";

const round = (n, d = 1) => Number(n.toFixed(d));
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const boundedNumber = (value, fallback, min, max) => {
  if (value === null || value === undefined || value === "") return clamp(fallback, min, max);
  const parsed = Number(value);
  return clamp(Number.isFinite(parsed) ? parsed : fallback, min, max);
};

export function calculateKPIs(data = caseData) {
  const b = data.baseline;
  const growth = ((b.revenue2026 - b.revenue2025) / b.revenue2025) * 100;
  const margin2025 = (b.ebit2025 / b.revenue2025) * 100;
  const margin2026 = (b.ebit2026 / b.revenue2026) * 100;
  const headcountGrowth = ((b.headcount2026 - b.headcount2025) / b.headcount2025) * 100;
  const ebitChange = ((b.ebit2026 - b.ebit2025) / b.ebit2025) * 100;
  return {
    revenueGrowth: round(growth),
    margin2025: round(margin2025),
    margin2026: round(margin2026),
    marginDelta: round(margin2026 - margin2025),
    headcountGrowth: round(headcountGrowth),
    ebitChange: round(ebitChange),
    csatDelta: b.csat2026 - b.csat2025,
    cycleTimeDelta: round(b.cycleTime2026 - b.cycleTime2025)
  };
}

export function problemStructuringAgent(data = caseData) {
  return {
    agent: "Problem Structuring Agent",
    objective: data.question,
    scq: {
      situation: data.situation,
      complication: data.complication,
      question: data.question
    },
    issueTree: [
      {
        branch: "Economics",
        question: "Where is margin leaking?",
        children: ["labor and contractor cost", "overhead growth", "vendor/tool duplication"]
      },
      {
        branch: "Operations",
        question: "What is driving productivity and service deterioration?",
        children: ["process variance", "rework", "cycle time", "automation"]
      },
      {
        branch: "Organization",
        question: "Is the operating model fit for scale?",
        children: ["regional fragmentation", "management spans", "capacity allocation"]
      },
      {
        branch: "Transformation",
        question: "Which intervention creates durable value?",
        children: ["centralize", "automate", "workforce redesign", "hybrid"]
      }
    ],
    hypotheses: data.hypotheses.map(h => ({ ...h, status: "untested" })),
    evidence: ["E-LABOR", "E-FRAG", "E-REWORK", "E-TOOLS", "E-OH"]
  };
}

function correlation(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const denominator = Math.sqrt(dx * dy);
  return denominator === 0 ? 0 : num / denominator;
}

export function diagnosticAnalystAgent(data = caseData) {
  const kpis = calculateKPIs(data);
  const sortedMargins = [...data.regions].sort((a, b) => a.margin - b.margin);
  const lowMargin = sortedMargins.slice(0, 4);
  const highMargin = sortedMargins.slice(-4).reverse();
  const avgAutomationLow = lowMargin.reduce((s, r) => s + r.automation, 0) / lowMargin.length;
  const avgAutomationHigh = highMargin.reduce((s, r) => s + r.automation, 0) / highMargin.length;
  const corr = correlation(data.regions.map(r => r.margin), data.regions.map(r => r.csat));
  const cycleCorr = correlation(data.regions.map(r => r.automation), data.regions.map(r => r.cycleTime));

  return {
    agent: "Diagnostic Analyst Agent",
    kpis,
    findings: [
      {
        id: "F1",
        statement: `Revenue grew ${kpis.revenueGrowth}% while EBIT fell ${Math.abs(kpis.ebitChange)}%, creating a ${Math.abs(kpis.marginDelta)} pp margin compression.`,
        evidence: ["E-LABOR", "E-OH"]
      },
      {
        id: "F2",
        statement: `The four lowest-margin regions average ${round(avgAutomationLow)}% automation versus ${round(avgAutomationHigh)}% in the four highest-margin regions.`,
        evidence: ["E-FRAG", "E-TOOLS"]
      },
      {
        id: "F3",
        statement: `Regional EBIT margin and customer satisfaction move together strongly (r=${round(corr, 2)}), indicating the service problem is not isolated from the economics.`,
        evidence: ["E-REWORK"]
      },
      {
        id: "F4",
        statement: `Automation and cycle time are inversely related across regions (r=${round(cycleCorr, 2)}), supporting targeted workflow redesign rather than across-the-board cost cutting.`,
        evidence: ["E-FRAG", "E-TOOLS"]
      }
    ],
    lowMarginRegions: lowMargin,
    highMarginRegions: highMargin,
    correlations: { marginCsat: round(corr, 2), automationCycleTime: round(cycleCorr, 2) }
  };
}

export function hypothesisAgent(data = caseData, diagnostic = diagnosticAnalystAgent(data)) {
  const lowAutoRegions = data.regions.filter(r => r.automation < 20).length;
  const lowProductivityRegions = data.regions.filter(r => r.productivity < 95).length;
  const marginCsat = diagnostic.correlations.marginCsat;
  const results = [
    {
      id: "H1",
      title: data.hypotheses[0].title,
      status: "supported",
      confidence: 0.88,
      rationale: "Large regional variance in margin, cycle time and operating practices is consistent with fragmentation as a primary driver.",
      evidence: ["F1", "F2", "E-FRAG"]
    },
    {
      id: "H2",
      title: data.hypotheses[1].title,
      status: lowAutoRegions >= 4 ? "supported" : "mixed",
      confidence: 0.82,
      rationale: `${lowAutoRegions} of ${data.regions.length} regions operate below 20% automation, with slower cycle times concentrated in the same group.`,
      evidence: ["F2", "F4", "E-TOOLS"]
    },
    {
      id: "H3",
      title: data.hypotheses[2].title,
      status: lowProductivityRegions >= 5 ? "supported" : "mixed",
      confidence: 0.79,
      rationale: `${lowProductivityRegions} regions operate below the productivity index threshold of 95 while headcount grew at roughly the same pace as revenue.`,
      evidence: ["F1", "E-LABOR", "E-OH"]
    },
    {
      id: "H4",
      title: data.hypotheses[3].title,
      status: marginCsat > 0.7 ? "supported" : "mixed",
      confidence: clamp(Math.abs(marginCsat), 0.55, 0.95),
      rationale: `Margin and CSAT show a ${Math.abs(marginCsat) > 0.7 ? "strong" : "moderate"} positive relationship across regions (r=${marginCsat}).`,
      evidence: ["F3", "E-REWORK"]
    }
  ];
  return { agent: "Hypothesis Agent", results };
}

export function scenarioAgent(assumptions = {}) {
  const realization = boundedNumber(assumptions.realization, 85, 50, 110) / 100;
  const costMultiplier = boundedNumber(assumptions.costMultiplier, 100, 70, 150) / 100;
  const disruptionMultiplier = boundedNumber(assumptions.disruptionMultiplier, 100, 50, 200) / 100;
  const adoption = boundedNumber(assumptions.adoption, 80, 40, 100) / 100;

  const scenarios = scenarioDefinitions.map(s => {
    const realizedSavings = s.grossSavings * realization * (0.65 + 0.35 * adoption);
    const recurringCost = s.recurringCost * costMultiplier;
    const annualNetImpact = realizedSavings - recurringCost - (s.disruptionRisk * disruptionMultiplier * 0.35);
    const investment = s.investment * costMultiplier;
    const paybackMonths = annualNetImpact > 0 ? (investment / annualNetImpact) * 12 : null;
    const adjustedUplift = s.marginUplift * realization * (0.7 + 0.3 * adoption);
    const riskPenalty = s.executionRisk === "High" ? 2.2 : s.executionRisk === "Medium" ? 1.1 : 0.5;
    const valueScore = annualNetImpact * s.confidence - riskPenalty - (investment * 0.08);
    return {
      ...s,
      realizedSavings: round(realizedSavings),
      annualNetImpact: round(annualNetImpact),
      investment: round(investment),
      paybackMonths: paybackMonths ? round(paybackMonths) : null,
      adjustedMarginUplift: round(adjustedUplift),
      valueScore: round(valueScore, 2)
    };
  }).sort((a, b) => b.valueScore - a.valueScore);

  return {
    agent: "Scenario Agent",
    assumptions: {
      savingsRealization: round(realization * 100, 0),
      implementationCostIndex: round(costMultiplier * 100, 0),
      disruptionIndex: round(disruptionMultiplier * 100, 0),
      adoption: round(adoption * 100, 0)
    },
    scenarios
  };
}

export function financialImpactEngine(scenario) {
  const b = caseData.baseline;
  const targetEbit = b.ebit2026 + scenario.annualNetImpact;
  const targetMargin = (targetEbit / b.revenue2026) * 100;
  return {
    agent: "Financial Impact Engine",
    currentEBIT: b.ebit2026,
    targetEBIT: round(targetEbit),
    currentMargin: round((b.ebit2026 / b.revenue2026) * 100),
    targetMargin: round(targetMargin),
    annualNetImpact: scenario.annualNetImpact,
    investment: scenario.investment,
    paybackMonths: scenario.paybackMonths,
    threeYearGrossValue: round(scenario.annualNetImpact * 3 - scenario.investment)
  };
}

export function stakeholderAgent(scenario) {
  return {
    agent: "Stakeholder & Change Agent",
    stakeholders: [
      { group: "Executive team", stance: "Sponsor", need: "value case, risk boundaries, decision cadence" },
      { group: "Regional leaders", stance: "Critical", need: "local accountability, wave sequencing, performance transparency" },
      { group: "Frontline operations", stance: "Impacted", need: "role clarity, workflow usability, adoption support" },
      { group: "Finance", stance: "Control", need: "benefit validation and realization tracking" },
      { group: "Technology & Data", stance: "Enabler", need: "integration priorities, data ownership, reliability" }
    ],
    changePrinciples: [
      "Protect customer-facing capacity during each migration wave.",
      "Tie benefits to named owners and monthly realization metrics.",
      `Sequence ${scenario.enablers.join(", ")} before scaling globally.`,
      "Use regional pilots to validate assumptions before irreversible changes."
    ]
  };
}

export function riskAgent(scenario) {
  const risks = [
    {
      risk: "Benefit shortfall",
      probability: "Medium",
      impact: "High",
      mitigation: "Stage-gate savings realization with Finance-owned baselines and monthly benefit reviews."
    },
    {
      risk: "Customer disruption",
      probability: scenario.executionRisk === "High" ? "Medium" : "Low-Medium",
      impact: "High",
      mitigation: "Migrate non-customer-facing work first; maintain regional fallback capacity during each wave."
    },
    {
      risk: "Change resistance",
      probability: "Medium",
      impact: "Medium",
      mitigation: "Co-design target workflows with frontline teams and publish role-level transition plans."
    },
    {
      risk: "Data / automation readiness",
      probability: scenario.id === "automate" || scenario.id === "hybrid" ? "Medium" : "Low",
      impact: "Medium-High",
      mitigation: "Run data-quality and integration readiness checks before automation commitments."
    }
  ];
  return { agent: "Risk Agent", risks };
}

export function redTeamAgent(scenario, financial) {
  return {
    agent: "Red-Team Agent",
    challenges: [
      {
        challenge: "Are savings double-counted across centralization and automation?",
        response: "The model requires mutually exclusive benefit owners. Hybrid savings are deliberately below the sum of standalone scenarios.",
        severity: "High"
      },
      {
        challenge: "Could margin improve simply through revenue growth without transformation?",
        response: "The current year shows the opposite: 11% revenue growth coincided with EBIT decline, so scale alone is not correcting the cost base.",
        severity: "High"
      },
      {
        challenge: "Does the recommendation over-index on correlation?",
        response: "Regional correlations are used as directional evidence only; pilots and process-level causal validation are explicit prerequisites.",
        severity: "Medium"
      },
      {
        challenge: `What if realized savings are 20% below the base assumption?`,
        response: `The recommendation remains value-positive if annual net impact stays above €${round(financial.investment / 2.5)}m, but payback would extend; the scenario controls expose this sensitivity.`,
        severity: "Medium"
      }
    ]
  };
}

export function recommendationAgent(scenarioResult = scenarioAgent()) {
  const best = scenarioResult.scenarios[0];
  const financial = financialImpactEngine(best);
  return {
    agent: "Recommendation Agent",
    selected: best,
    financial,
    recommendation: `Pursue a sequenced ${best.name.toLowerCase()} using two pilot regions before broader rollout.`,
    rationale: [
      `Highest risk-adjusted value score (${best.valueScore}) across modeled options.`,
      `Estimated annual net impact of €${best.annualNetImpact}m with ${best.paybackMonths}-month payback under current assumptions.`,
      `Addresses fragmentation, low automation and workforce productivity together rather than treating one symptom in isolation.`,
      "Allows management to stage investment through pilots and preserve reversibility before scaling."
    ],
    guardrails: [
      "No region scales to the next wave until service-level and CSAT guardrails are met.",
      "Finance validates benefit baselines before implementation spend is released.",
      "Automation is deployed only after process simplification and data-readiness checks.",
      "Executive steering reviews value, risk and adoption monthly."
    ]
  };
}

export function roadmapAgent(recommendation) {
  const name = recommendation.selected.name;
  return {
    agent: "Implementation Roadmap Agent",
    phases: [
      {
        horizon: "0–90 days",
        title: "Validate & mobilize",
        actions: ["Confirm baselines and benefit owners", "Select two pilot regions", "Standardize priority workflows", "Establish transformation office and risk cadence"]
      },
      {
        horizon: "90–180 days",
        title: "Pilot & prove",
        actions: [`Pilot ${name}`, "Track CSAT, cycle time and margin guardrails", "Validate savings with Finance", "Adjust target operating model from frontline feedback"]
      },
      {
        horizon: "180–365 days",
        title: "Scale & institutionalize",
        actions: ["Roll out proven waves by readiness", "Retire duplicated tools and vendors", "Embed benefit tracking into operating reviews", "Transfer ownership from transformation office to business leaders"]
      }
    ]
  };
}

export function executiveCommunicationAgent(run) {
  const rec = run.recommendation;
  const f = rec.financial;
  const evidenceLines = caseData.drivers.map(d => `- **${d.id} — ${d.label}:** ${d.evidence}`).join("\n");
  const roadmap = run.roadmap.phases.map(p => `### ${p.horizon} — ${p.title}\n${p.actions.map(a => `- ${a}`).join("\n")}`).join("\n\n");
  return `# DecisionForge AI — Executive Decision Brief\n\n## Executive question\n${caseData.question}\n\n## Recommendation\n${rec.recommendation}\n\n## Why\n${rec.rationale.map(x => `- ${x}`).join("\n")}\n\n## Modeled economics\n- Current EBIT margin: **${f.currentMargin}%**\n- Target EBIT margin: **${f.targetMargin}%**\n- Annual net impact: **€${f.annualNetImpact}m**\n- One-time investment: **€${f.investment}m**\n- Payback: **${f.paybackMonths} months**\n- 3-year modeled value after investment: **€${f.threeYearGrossValue}m**\n\n## Guardrails\n${rec.guardrails.map(x => `- ${x}`).join("\n")}\n\n## Implementation roadmap\n${roadmap}\n\n## Evidence trace\n${evidenceLines}\n\n---\n${caseData.disclaimer}\n`;
}

export function runDecisionForge(assumptions = {}) {
  const framing = problemStructuringAgent();
  const diagnosis = diagnosticAnalystAgent();
  const hypotheses = hypothesisAgent(caseData, diagnosis);
  const scenarios = scenarioAgent(assumptions);
  const recommendation = recommendationAgent(scenarios);
  const stakeholder = stakeholderAgent(recommendation.selected);
  const risks = riskAgent(recommendation.selected);
  const redTeam = redTeamAgent(recommendation.selected, recommendation.financial);
  const roadmap = roadmapAgent(recommendation);
  const run = {
    meta: {
      generatedAt: new Date().toISOString(),
      case: caseData.company,
      assumptions: scenarios.assumptions,
      evidenceMode: "traceable-synthetic"
    },
    framing,
    diagnosis,
    hypotheses,
    scenarios,
    recommendation,
    stakeholder,
    risks,
    redTeam,
    roadmap
  };
  return { ...run, executiveBrief: executiveCommunicationAgent(run) };
}
