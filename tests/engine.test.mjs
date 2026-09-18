import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateKPIs,
  problemStructuringAgent,
  diagnosticAnalystAgent,
  hypothesisAgent,
  scenarioAgent,
  financialImpactEngine,
  stakeholderAgent,
  riskAgent,
  redTeamAgent,
  recommendationAgent,
  roadmapAgent,
  executiveCommunicationAgent,
  runDecisionForge
} from "../src/engine.mjs";
import { caseData, scenarioDefinitions } from "../src/case-data.mjs";

const knownEvidence = new Set(caseData.drivers.map(d => d.id));

test("baseline metrics reproduce the case economics", () => {
  const k = calculateKPIs();
  assert.equal(k.revenueGrowth, 11);
  assert.equal(k.margin2025, 14);
  assert.equal(k.margin2026, 8);
  assert.equal(k.marginDelta, -6);
  assert.equal(k.csatDelta, -8);
  assert.equal(k.cycleTimeDelta, 1.3);
});

test("synthetic dataset is internally consistent", () => {
  assert.equal(caseData.regions.length, caseData.baseline.regions);
  assert.equal(caseData.regions.reduce((sum, r) => sum + r.revenue, 0).toFixed(1), caseData.baseline.revenue2026.toFixed(1));
  assert.equal(new Set(caseData.regions.map(r => r.region)).size, caseData.regions.length);
  assert.equal(new Set(caseData.drivers.map(d => d.id)).size, caseData.drivers.length);
  assert.equal(new Set(scenarioDefinitions.map(s => s.id)).size, scenarioDefinitions.length);
});

test("problem framing is MECE-style and traceable", () => {
  const result = problemStructuringAgent();
  assert.equal(result.issueTree.length, 4);
  assert.equal(result.hypotheses.length, 4);
  assert.equal(new Set(result.issueTree.map(x => x.branch)).size, 4);
  assert.ok(result.evidence.includes("E-FRAG"));
  for (const id of result.evidence) assert.ok(knownEvidence.has(id), `Unknown evidence id ${id}`);
});

test("diagnostic agent produces finite correlations and valid evidence references", () => {
  const result = diagnosticAnalystAgent();
  assert.ok(Number.isFinite(result.correlations.marginCsat));
  assert.ok(Number.isFinite(result.correlations.automationCycleTime));
  assert.ok(result.correlations.marginCsat > 0.7);
  assert.ok(result.correlations.automationCycleTime < -0.7);
  assert.equal(result.findings.length, 4);
  for (const finding of result.findings) {
    assert.ok(finding.statement.length > 20);
    for (const id of finding.evidence) assert.ok(knownEvidence.has(id), `Unknown finding evidence id ${id}`);
  }
});

test("hypothesis agent keeps confidence bounded and attaches evidence", () => {
  const diagnosis = diagnosticAnalystAgent();
  const result = hypothesisAgent(caseData, diagnosis);
  assert.equal(result.results.length, 4);
  for (const hypothesis of result.results) {
    assert.ok(["supported", "mixed"].includes(hypothesis.status));
    assert.ok(hypothesis.confidence >= 0 && hypothesis.confidence <= 1);
    assert.ok(hypothesis.evidence.length >= 2);
  }
});

test("base assumptions rank hybrid transformation first", () => {
  const result = scenarioAgent();
  assert.equal(result.scenarios.length, 4);
  assert.equal(result.scenarios[0].id, "hybrid");
  assert.ok(result.scenarios[0].annualNetImpact > 10);
  assert.ok(result.scenarios[0].paybackMonths < 14);
  assert.equal(new Set(result.scenarios.map(s => s.id)).size, 4);
  for (const scenario of result.scenarios) {
    assert.ok(Number.isFinite(scenario.annualNetImpact));
    assert.ok(Number.isFinite(scenario.valueScore));
    assert.ok(scenario.paybackMonths === null || scenario.paybackMonths > 0);
  }
});

test("scenario inputs are clamped and invalid values fall back safely", () => {
  const extreme = scenarioAgent({ realization: 999, costMultiplier: -20, disruptionMultiplier: 999, adoption: -5 });
  assert.deepEqual(extreme.assumptions, {
    savingsRealization: 110,
    implementationCostIndex: 70,
    disruptionIndex: 200,
    adoption: 40
  });

  const invalid = scenarioAgent({ realization: "not-a-number", costMultiplier: null, disruptionMultiplier: undefined, adoption: NaN });
  assert.deepEqual(invalid.assumptions, {
    savingsRealization: 85,
    implementationCostIndex: 70,
    disruptionIndex: 100,
    adoption: 80
  });
});

test("sensitivity controls change modeled economics in the expected direction", () => {
  const base = scenarioAgent().scenarios.find(s => s.id === "hybrid");
  const downside = scenarioAgent({ realization: 60, costMultiplier: 125, adoption: 55, disruptionMultiplier: 150 }).scenarios.find(s => s.id === "hybrid");
  assert.ok(downside.annualNetImpact < base.annualNetImpact);
  assert.ok(downside.paybackMonths > base.paybackMonths);
  assert.ok(downside.valueScore < base.valueScore);
});

test("financial engine reconciles EBIT, margin, payback and three-year value", () => {
  const best = scenarioAgent().scenarios[0];
  const financial = financialImpactEngine(best);
  assert.equal(financial.targetEBIT, Number((caseData.baseline.ebit2026 + best.annualNetImpact).toFixed(1)));
  assert.equal(financial.currentMargin, 8);
  assert.ok(financial.targetMargin > financial.currentMargin);
  assert.equal(financial.annualNetImpact, best.annualNetImpact);
  assert.equal(financial.investment, best.investment);
  assert.equal(financial.paybackMonths, best.paybackMonths);
  assert.equal(financial.threeYearGrossValue, Number((best.annualNetImpact * 3 - best.investment).toFixed(1)));
});

test("change, risk and red-team components are populated for the selected option", () => {
  const selected = recommendationAgent().selected;
  const financial = financialImpactEngine(selected);
  const stakeholder = stakeholderAgent(selected);
  const risks = riskAgent(selected);
  const redTeam = redTeamAgent(selected, financial);

  assert.ok(stakeholder.stakeholders.length >= 5);
  assert.ok(stakeholder.changePrinciples.length >= 4);
  assert.ok(risks.risks.length >= 4);
  assert.ok(redTeam.challenges.length >= 4);
  assert.ok(redTeam.challenges.some(c => /double-count/i.test(c.challenge)));
  assert.ok(redTeam.challenges.some(c => /correlation/i.test(c.challenge)));
});

test("recommendation and roadmap remain aligned to the top-ranked scenario", () => {
  const scenarios = scenarioAgent();
  const recommendation = recommendationAgent(scenarios);
  const roadmap = roadmapAgent(recommendation);

  assert.equal(recommendation.selected.id, scenarios.scenarios[0].id);
  assert.ok(recommendation.rationale.length >= 4);
  assert.ok(recommendation.guardrails.length >= 4);
  assert.equal(roadmap.phases.length, 3);
  assert.deepEqual(roadmap.phases.map(p => p.horizon), ["0–90 days", "90–180 days", "180–365 days"]);
});

test("executive communication includes economics, guardrails, roadmap and evidence trace", () => {
  const run = runDecisionForge();
  const brief = executiveCommunicationAgent(run);
  assert.match(brief, /Executive Decision Brief/);
  assert.match(brief, /Hybrid Operating-Model Transformation/);
  assert.match(brief, /3-year modeled value after investment/);
  assert.match(brief, /Implementation roadmap/);
  assert.match(brief, /Evidence trace/);
  for (const id of knownEvidence) assert.match(brief, new RegExp(id));
  assert.match(brief, /fictional/i);
});

test("end-to-end run produces every decision-stage artifact", () => {
  const run = runDecisionForge();
  for (const key of ["framing", "diagnosis", "hypotheses", "scenarios", "recommendation", "stakeholder", "risks", "redTeam", "roadmap", "executiveBrief"]) {
    assert.ok(run[key], `Missing end-to-end artifact: ${key}`);
  }
  assert.equal(run.meta.evidenceMode, "traceable-synthetic");
  assert.equal(run.meta.case, caseData.company);
  assert.match(run.executiveBrief, /Executive Decision Brief/);
  assert.ok(run.redTeam.challenges.length >= 4);
  assert.ok(run.risks.risks.length >= 4);
});
