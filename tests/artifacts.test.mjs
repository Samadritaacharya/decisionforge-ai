import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { caseData, scenarioDefinitions } from "../src/case-data.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8").trim();
}

function parseCsv(file) {
  const lines = read(file).split(/\r?\n/);
  const headers = lines[0].split(",");
  return lines.slice(1).map(line => {
    const cells = line.split(",");
    return Object.fromEntries(headers.map((header, i) => [header, cells[i]]));
  });
}

test("regional CSV matches the in-code synthetic case", () => {
  const rows = parseCsv("data/regional_performance.csv");
  assert.equal(rows.length, caseData.regions.length);

  for (const region of caseData.regions) {
    const row = rows.find(r => r.region === region.region);
    assert.ok(row, `Missing regional CSV row: ${region.region}`);
    assert.equal(Number(row.revenue_eur_m), region.revenue);
    assert.equal(Number(row.ebit_margin_pct), region.margin);
    assert.equal(Number(row.productivity_index), region.productivity);
    assert.equal(Number(row.csat), region.csat);
    assert.equal(Number(row.cycle_time_days), region.cycleTime);
    assert.equal(Number(row.automation_pct), region.automation);
  }

  const totalRevenue = rows.reduce((sum, row) => sum + Number(row.revenue_eur_m), 0);
  assert.equal(totalRevenue.toFixed(1), caseData.baseline.revenue2026.toFixed(1));
});

test("financial CSV matches headline baseline metrics", () => {
  const rows = parseCsv("data/financial_performance.csv");
  const byMetric = Object.fromEntries(rows.map(row => [row.metric, row]));

  assert.equal(Number(byMetric.Revenue.FY2025), caseData.baseline.revenue2025);
  assert.equal(Number(byMetric.Revenue.FY2026), caseData.baseline.revenue2026);
  assert.equal(Number(byMetric.EBIT.FY2025), caseData.baseline.ebit2025);
  assert.equal(Number(byMetric.EBIT.FY2026), caseData.baseline.ebit2026);
  assert.equal(Number(byMetric.Headcount.FY2025), caseData.baseline.headcount2025);
  assert.equal(Number(byMetric.Headcount.FY2026), caseData.baseline.headcount2026);
  assert.equal(Number(byMetric.Customer_satisfaction.FY2025), caseData.baseline.csat2025);
  assert.equal(Number(byMetric.Customer_satisfaction.FY2026), caseData.baseline.csat2026);
  assert.equal(Number(byMetric.Cycle_time.FY2025), caseData.baseline.cycleTime2025);
  assert.equal(Number(byMetric.Cycle_time.FY2026), caseData.baseline.cycleTime2026);
  assert.equal(Number(byMetric.Automation_rate.FY2026), caseData.baseline.automationRate);
});

test("scenario reference JSON files match engine scenario definitions", () => {
  const fileById = {
    centralize: "scenarios/centralization.json",
    automate: "scenarios/automation.json",
    workforce: "scenarios/workforce.json",
    hybrid: "scenarios/hybrid_transformation.json"
  };

  for (const scenario of scenarioDefinitions) {
    const doc = JSON.parse(read(fileById[scenario.id]));
    assert.equal(doc.id, scenario.id);
    assert.equal(doc.name, scenario.name);
    assert.equal(doc.grossSavings, scenario.grossSavings);
    assert.equal(doc.investment, scenario.investment);
    assert.equal(doc.executionRisk, scenario.executionRisk);
  }
});

test("baseline and supporting CSV artifacts remain explicitly synthetic/reference-only", () => {
  const baseline = JSON.parse(read("scenarios/baseline.json"));
  assert.equal(baseline.savingsRealization, 0);
  assert.equal(baseline.investment, 0);
  assert.match(baseline.note, /Reference case only/i);

  const combined = [
    read("data/customer_metrics.csv"),
    read("data/workforce.csv"),
    read("data/financial_performance.csv"),
    read("data/regional_performance.csv")
  ].join("\n");

  assert.ok(!/\bDHL\b/i.test(combined));
  assert.ok(!/Deutsche\s+Post/i.test(combined));
});
