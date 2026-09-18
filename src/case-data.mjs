export const caseData = {
  company: "Northstar Services Group",
  disclaimer: "Northstar Services Group is fictional. All data in this demo is synthetic and created solely for portfolio demonstration.",
  period: "FY2026",
  question: "How should management restore margin while protecting growth and customer experience?",
  situation: "Northstar is a multi-site European B2B services company operating across 12 regional units. Revenue has grown strongly, but operating performance has deteriorated.",
  complication: "Revenue grew 11.0%, yet EBIT margin fell from 14.0% to 8.0%. Customer satisfaction declined, cycle time increased and regional performance diverged.",
  baseline: {
    revenue2025: 228.7,
    revenue2026: 253.9,
    ebit2025: 32.0,
    ebit2026: 20.3,
    headcount2025: 2950,
    headcount2026: 3275,
    csat2025: 84,
    csat2026: 76,
    cycleTime2025: 4.8,
    cycleTime2026: 6.1,
    automationRate: 22,
    duplicatedTools: 17,
    regions: 12
  },
  drivers: [
    { id: "E-LABOR", label: "Labor cost expansion", impact: -18.6, evidence: "Headcount +11.0% and contractor spend +24.3% outpaced productivity gains." },
    { id: "E-FRAG", label: "Fragmented regional operating model", impact: -7.2, evidence: "12 regional units run materially different workflows and approval paths." },
    { id: "E-REWORK", label: "Rework and quality leakage", impact: -4.1, evidence: "First-time-right rate declined from 91% to 83%; rework hours rose 29%." },
    { id: "E-TOOLS", label: "Tool and vendor duplication", impact: -3.4, evidence: "17 overlapping workflow/reporting tools and 9 regional vendor contracts create avoidable cost." },
    { id: "E-OH", label: "Overhead growth", impact: -3.0, evidence: "Management and coordination overhead grew faster than revenue in lower-performing regions." }
  ],
  regions: [
    { region: "Nordics", revenue: 24.8, margin: 13.4, productivity: 108, csat: 84, cycleTime: 4.6, automation: 38 },
    { region: "Benelux", revenue: 25.7, margin: 12.1, productivity: 105, csat: 82, cycleTime: 4.9, automation: 34 },
    { region: "DACH North", revenue: 29.4, margin: 10.8, productivity: 101, csat: 80, cycleTime: 5.1, automation: 31 },
    { region: "DACH South", revenue: 27.9, margin: 9.7, productivity: 99, csat: 79, cycleTime: 5.4, automation: 28 },
    { region: "France", revenue: 23.1, margin: 8.2, productivity: 94, csat: 76, cycleTime: 6.0, automation: 22 },
    { region: "Iberia", revenue: 18.5, margin: 7.5, productivity: 92, csat: 75, cycleTime: 6.3, automation: 20 },
    { region: "Italy", revenue: 17.9, margin: 6.8, productivity: 89, csat: 73, cycleTime: 6.7, automation: 18 },
    { region: "UK & Ireland", revenue: 26.3, margin: 8.9, productivity: 96, csat: 77, cycleTime: 5.8, automation: 26 },
    { region: "Central Europe", revenue: 18.8, margin: 5.9, productivity: 86, csat: 71, cycleTime: 7.1, automation: 15 },
    { region: "Balkans", revenue: 8.7, margin: 4.8, productivity: 83, csat: 69, cycleTime: 7.5, automation: 13 },
    { region: "Baltics", revenue: 7.6, margin: 7.2, productivity: 91, csat: 74, cycleTime: 6.4, automation: 19 },
    { region: "CEE East", revenue: 25.2, margin: 5.4, productivity: 85, csat: 70, cycleTime: 7.2, automation: 14 }
  ],
  hypotheses: [
    { id: "H1", title: "Scale without standardization is the primary margin driver", metric: "process variance", threshold: 20 },
    { id: "H2", title: "Low automation is amplifying cost and cycle-time pressure", metric: "automation", threshold: 30 },
    { id: "H3", title: "Workforce mix is misaligned with demand growth", metric: "productivity", threshold: 95 },
    { id: "H4", title: "Customer deterioration is concentrated in low-margin regions", metric: "csat-margin", threshold: 0.55 }
  ]
};

export const scenarioDefinitions = [
  {
    id: "centralize",
    name: "Centralize Shared Operations",
    description: "Consolidate repeatable support work into two shared-service hubs and standardize governance.",
    grossSavings: 8.2,
    recurringCost: 0.8,
    investment: 5.8,
    disruptionRisk: 1.2,
    marginUplift: 2.6,
    executionRisk: "Medium",
    confidence: 0.78,
    enablers: ["process standardization", "service catalog", "capacity migration"]
  },
  {
    id: "automate",
    name: "Automation-Led Transformation",
    description: "Automate high-volume workflows, approvals and reporting while reducing tool duplication.",
    grossSavings: 9.6,
    recurringCost: 1.1,
    investment: 8.9,
    disruptionRisk: 0.6,
    marginUplift: 3.1,
    executionRisk: "High",
    confidence: 0.71,
    enablers: ["workflow automation", "data quality", "change adoption"]
  },
  {
    id: "workforce",
    name: "Workforce & Span Redesign",
    description: "Rebalance capacity, management layers and contractor mix around demand and productivity.",
    grossSavings: 6.5,
    recurringCost: 0.5,
    investment: 3.1,
    disruptionRisk: 0.8,
    marginUplift: 2.0,
    executionRisk: "Medium",
    confidence: 0.74,
    enablers: ["capacity model", "role redesign", "manager enablement"]
  },
  {
    id: "hybrid",
    name: "Hybrid Operating-Model Transformation",
    description: "Combine targeted centralization, selective automation and workforce redesign in sequenced waves.",
    grossSavings: 15.1,
    recurringCost: 1.5,
    investment: 10.7,
    disruptionRisk: 1.0,
    marginUplift: 4.5,
    executionRisk: "Medium",
    confidence: 0.84,
    enablers: ["transformation office", "shared data model", "wave governance", "frontline adoption"]
  }
];
