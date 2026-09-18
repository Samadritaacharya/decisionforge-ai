import test from "node:test";
import assert from "node:assert/strict";
import { calculateKPIs, scenarioAgent, runDecisionForge, problemStructuringAgent } from "../src/engine.mjs";

test("baseline metrics reproduce the case economics", () => {
  const k = calculateKPIs();
  assert.equal(k.revenueGrowth, 11);
  assert.equal(k.margin2025, 14);
  assert.equal(k.margin2026, 8);
  assert.equal(k.marginDelta, -6);
});

test("problem framing is MECE-style and traceable", () => {
  const result = problemStructuringAgent();
  assert.equal(result.issueTree.length, 4);
  assert.equal(result.hypotheses.length, 4);
  assert.ok(result.evidence.includes("E-FRAG"));
});

test("base assumptions rank hybrid transformation first", () => {
  const result = scenarioAgent();
  assert.equal(result.scenarios[0].id, "hybrid");
  assert.ok(result.scenarios[0].annualNetImpact > 10);
  assert.ok(result.scenarios[0].paybackMonths < 14);
});

test("sensitivity controls change modeled economics", () => {
  const base = scenarioAgent().scenarios.find(s => s.id === "hybrid");
  const downside = scenarioAgent({ realization: 60, costMultiplier: 125, adoption: 55, disruptionMultiplier: 150 }).scenarios.find(s => s.id === "hybrid");
  assert.ok(downside.annualNetImpact < base.annualNetImpact);
  assert.ok(downside.paybackMonths > base.paybackMonths);
});

test("end-to-end run creates executive brief and red-team challenges", () => {
  const run = runDecisionForge();
  assert.match(run.executiveBrief, /Executive Decision Brief/);
  assert.match(run.executiveBrief, /Hybrid Operating-Model Transformation/);
  assert.ok(run.redTeam.challenges.length >= 4);
  assert.ok(run.risks.risks.length >= 4);
  assert.equal(run.roadmap.phases.length, 3);
});
