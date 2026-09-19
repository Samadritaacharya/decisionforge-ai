import { caseData } from "./case-data.mjs";
import { problemStructuringAgent, diagnosticAnalystAgent, hypothesisAgent, scenarioAgent, recommendationAgent, stakeholderAgent, riskAgent, redTeamAgent, roadmapAgent, executiveCommunicationAgent } from "./engine.mjs";

const $ = (id) => document.getElementById(id);
const fmt = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 1 });
let state = {
  framingApproved: false,
  recommendationApproved: false,
  run: null
};

const agentDefaults = {
  agentProblem: "SCQ · MECE · hypotheses",
  agentDiagnostic: "performance drivers",
  agentHypothesis: "test competing explanations",
  agentScenario: "strategic alternatives",
  agentFinance: "value · payback",
  agentStakeholder: "adoption dependencies",
  agentRisk: "execution exposure",
  agentRedTeam: "challenge assumptions",
  agentRecommendation: "synthesis · trade-offs",
  agentExecutive: "storyline · brief"
};

function setStatus(id, status, note = "") {
  const el = $(id);
  if (!el) return;
  el.dataset.status = status;
  el.querySelector(".agent-state").textContent = status;
  const noteEl = el.querySelector(".agent-note");
  if (noteEl && note) noteEl.textContent = note;
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function renderIssueTree(framing) {
  $("issueTree").innerHTML = framing.issueTree.map((b, i) => `
    <article class="issue-branch reveal" style="--delay:${i * 55}ms">
      <div class="issue-num">0${i + 1}</div>
      <div>
        <h4>${b.branch}</h4>
        <p>${b.question}</p>
        <div class="chips">${b.children.map(c => `<span>${c}</span>`).join("")}</div>
      </div>
    </article>`).join("");
}

function renderDiagnosis(diagnosis) {
  const k = diagnosis.kpis;
  $("diagnosisCards").innerHTML = `
    <article class="metric-card"><span>Revenue growth</span><strong>+${k.revenueGrowth}%</strong><small>FY25 → FY26</small></article>
    <article class="metric-card alert"><span>Margin change</span><strong>${k.marginDelta} pp</strong><small>${k.margin2025}% → ${k.margin2026}%</small></article>
    <article class="metric-card alert"><span>EBIT change</span><strong>${k.ebitChange}%</strong><small>despite growth</small></article>
    <article class="metric-card alert"><span>Customer satisfaction</span><strong>${k.csatDelta} pts</strong><small>84 → 76</small></article>`;

  $("findings").innerHTML = diagnosis.findings.map(f => `
    <article class="finding">
      <div class="finding-id">${f.id}</div>
      <div><p>${f.statement}</p><small>Evidence: ${f.evidence.join(" · ")}</small></div>
    </article>`).join("");

  const sorted = [...caseData.regions].sort((a,b) => b.margin - a.margin);
  $("regionalBars").innerHTML = sorted.map(r => `
    <div class="bar-row">
      <span>${r.region}</span>
      <div class="bar-track"><i style="width:${Math.max(8, (r.margin / 14) * 100)}%"></i></div>
      <strong>${r.margin}%</strong>
      <small>${r.csat} CSAT</small>
    </div>`).join("");
}

function renderHypotheses(hypotheses) {
  $("hypothesisGrid").innerHTML = hypotheses.results.map(h => `
    <article class="hypothesis-card">
      <div class="hypothesis-top"><span>${h.id}</span><b>${h.status}</b></div>
      <h4>${h.title}</h4>
      <p>${h.rationale}</p>
      <div class="confidence"><i style="width:${h.confidence * 100}%"></i></div>
      <small>${Math.round(h.confidence * 100)}% confidence · ${h.evidence.join(" · ")}</small>
    </article>`).join("");
}

function currentAssumptions() {
  return {
    realization: Number($("realization").value),
    costMultiplier: Number($("costMultiplier").value),
    disruptionMultiplier: Number($("disruptionMultiplier").value),
    adoption: Number($("adoption").value)
  };
}

function updateAssumptionLabels() {
  $("realizationValue").textContent = `${$("realization").value}%`;
  $("costValue").textContent = `${$("costMultiplier").value}%`;
  $("disruptionValue").textContent = `${$("disruptionMultiplier").value}%`;
  $("adoptionValue").textContent = `${$("adoption").value}%`;
}

function renderScenarios(scenarioResult) {
  $("scenarioGrid").innerHTML = scenarioResult.scenarios.map((s, i) => `
    <article class="scenario-card ${i === 0 ? "recommended" : ""}">
      ${i === 0 ? '<span class="recommend-badge">Best risk-adjusted value</span>' : ''}
      <div class="scenario-rank">0${i + 1}</div>
      <h4>${s.name}</h4>
      <p>${s.description}</p>
      <dl>
        <div><dt>Annual net</dt><dd>€${fmt(s.annualNetImpact)}m</dd></div>
        <div><dt>Investment</dt><dd>€${fmt(s.investment)}m</dd></div>
        <div><dt>Payback</dt><dd>${s.paybackMonths} mo</dd></div>
        <div><dt>Risk</dt><dd>${s.executionRisk}</dd></div>
      </dl>
      <div class="score-line"><span>Value score</span><strong>${s.valueScore}</strong></div>
    </article>`).join("");
}

function renderRecommendation(rec, redTeam, risks, stakeholder, roadmap) {
  const f = rec.financial;
  $("recommendationTitle").textContent = rec.selected.name;
  $("recommendationText").textContent = rec.recommendation;
  $("recommendationReasons").innerHTML = rec.rationale.map(r => `<li>${r}</li>`).join("");
  $("impactStrip").innerHTML = `
    <div><span>Annual net impact</span><strong>€${fmt(f.annualNetImpact)}m</strong></div>
    <div><span>Target EBIT margin</span><strong>${f.targetMargin}%</strong></div>
    <div><span>Payback</span><strong>${f.paybackMonths} mo</strong></div>
    <div><span>3-year modeled value</span><strong>€${fmt(f.threeYearGrossValue)}m</strong></div>`;

  $("redTeam").innerHTML = redTeam.challenges.map(c => `
    <article class="challenge">
      <div class="severity">${c.severity}</div>
      <h4>${c.challenge}</h4>
      <p>${c.response}</p>
    </article>`).join("");

  $("riskTable").innerHTML = `<div class="risk-head"><span>Risk</span><span>Probability</span><span>Impact</span><span>Mitigation</span></div>` +
    risks.risks.map(r => `<div class="risk-row"><strong>${r.risk}</strong><span>${r.probability}</span><span>${r.impact}</span><p>${r.mitigation}</p></div>`).join("");

  $("stakeholders").innerHTML = stakeholder.stakeholders.map(s => `
    <article><strong>${s.group}</strong><span>${s.stance}</span><p>${s.need}</p></article>`).join("");

  $("roadmap").innerHTML = roadmap.phases.map((p, i) => `
    <article class="roadmap-phase">
      <div class="phase-marker">${i + 1}</div>
      <small>${p.horizon}</small>
      <h4>${p.title}</h4>
      <ul>${p.actions.map(a => `<li>${a}</li>`).join("")}</ul>
    </article>`).join("");
}

function renderEvidence() {
  $("evidenceList").innerHTML = caseData.drivers.map(d => `
    <article class="evidence-item">
      <div><span>${d.id}</span><strong>${d.label}</strong></div>
      <p>${d.evidence}</p>
      <b>€${fmt(d.impact)}m</b>
    </article>`).join("");
}

function buildRun() {
  const framing = problemStructuringAgent();
  const diagnosis = diagnosticAnalystAgent();
  const hypotheses = hypothesisAgent(caseData, diagnosis);
  const scenarios = scenarioAgent(currentAssumptions());
  const recommendation = recommendationAgent(scenarios);
  const stakeholder = stakeholderAgent(recommendation.selected);
  const risks = riskAgent(recommendation.selected);
  const redTeam = redTeamAgent(recommendation.selected, recommendation.financial);
  const roadmap = roadmapAgent(recommendation);
  const partial = { framing, diagnosis, hypotheses, scenarios, recommendation, stakeholder, risks, redTeam, roadmap };
  const executiveBrief = executiveCommunicationAgent(partial);
  return { ...partial, executiveBrief };
}

function resetDecisionRoom() {
  state = { framingApproved: false, recommendationApproved: false, run: null };

  Object.entries(agentDefaults).forEach(([id, note]) => setStatus(id, "idle", note));

  $("analysisLocked").classList.remove("hidden");
  $("analysisContent").classList.add("hidden");
  $("issueTree").innerHTML = "<p>Run the Decision Room to generate the issue tree.</p>";

  $("framingGate").classList.add("locked");
  $("framingGate").classList.remove("approved");
  $("framingGateTitle").textContent = "Approve the problem framing before analysis";
  $("approveFraming").disabled = false;
  $("approveFraming").textContent = "Approve framing";

  $("recommendationGate").classList.add("locked");
  $("recommendationGate").classList.remove("approved");
  $("approveRecommendation").disabled = false;
  $("approveRecommendation").textContent = "Approve recommendation";

  $("downloadBrief").disabled = true;
  $("downloadBrief").classList.add("secondary-disabled");

  $("synthesisButton").disabled = true;
  $("synthesisButton").textContent = "Generate executive synthesis";
  $("synthesisPanel").classList.add("hidden");
  $("synthesisMode").textContent = "";
  $("synthesisText").textContent = "";
}

async function runFraming() {
  resetDecisionRoom();
  $("runButton").disabled = true;
  $("runButton").textContent = "Structuring problem…";
  setStatus("agentProblem", "running", "Building SCQ and MECE issue tree");
  await sleep(260);
  const framing = problemStructuringAgent();
  renderIssueTree(framing);
  setStatus("agentProblem", "complete", "4 issue branches · 4 hypotheses");
  $("framingGate").classList.remove("locked");
  $("framingGate").scrollIntoView({ behavior: "smooth", block: "center" });
  $("runButton").textContent = "Waiting for approval";
}

async function runAnalysis() {
  state.run = buildRun();
  const r = state.run;
  const steps = [
    ["agentDiagnostic", "Analyzing regional performance", () => renderDiagnosis(r.diagnosis)],
    ["agentHypothesis", "Testing competing explanations", () => renderHypotheses(r.hypotheses)],
    ["agentScenario", "Modeling strategic alternatives", () => renderScenarios(r.scenarios)],
    ["agentFinance", "Calculating value and payback", () => {}],
    ["agentStakeholder", "Mapping change dependencies", () => {}],
    ["agentRisk", "Assessing execution risk", () => {}],
    ["agentRedTeam", "Challenging assumptions", () => {}],
    ["agentRecommendation", "Synthesizing recommendation", () => renderRecommendation(r.recommendation, r.redTeam, r.risks, r.stakeholder, r.roadmap)],
    ["agentExecutive", "Building executive storyline", () => {}]
  ];
  for (const [id, note, render] of steps) {
    setStatus(id, "running", note);
    await sleep(150);
    render();
    setStatus(id, "complete", note.replace(/ing\b/, "ed"));
  }
  $("analysisLocked").classList.add("hidden");
  $("analysisContent").classList.remove("hidden");
  $("recommendationGate").classList.remove("locked");
  $("synthesisButton").disabled = false;
  $("runButton").disabled = false;
  $("runButton").textContent = "Re-run DecisionForge";
  document.querySelector('[href="#diagnosis"]').click();
}

function approveFraming() {
  state.framingApproved = true;
  $("framingGate").classList.add("approved");
  $("framingGateTitle").textContent = "Problem framing approved";
  $("approveFraming").disabled = true;
  $("approveFraming").textContent = "Approved ✓";
  return runAnalysis();
}

function approveRecommendation() {
  state.recommendationApproved = true;
  $("recommendationGate").classList.add("approved");
  $("approveRecommendation").disabled = true;
  $("approveRecommendation").textContent = "Approved ✓";
  $("downloadBrief").disabled = false;
  $("downloadBrief").classList.remove("secondary-disabled");
}

function downloadBrief() {
  if (!state.run || !state.recommendationApproved) return;
  const blob = new Blob([state.run.executiveBrief], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "decisionforge-executive-brief.md";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function requestSynthesis() {
  if (!state.run) return;

  const button = $("synthesisButton");
  const fallback = {
    mode: "client-fallback",
    summary: `${state.run.recommendation.recommendation} ${state.run.recommendation.rationale[0]}`,
    evidenceCount: caseData.drivers.length
  };

  button.disabled = true;
  button.textContent = "Synthesizing…";

  let result = fallback;
  try {
    const response = await fetch("/api/synthesize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        recommendation: state.run.recommendation,
        evidence: caseData.drivers.map(({ id, label, evidence }) => ({ id, label, evidence }))
      })
    });
    if (!response.ok) throw new Error(`Synthesis endpoint returned ${response.status}`);
    const body = await response.json();
    if (body?.summary) result = body;
  } catch {
    result = fallback;
  }

  $("synthesisMode").textContent = result.mode === "provider"
    ? "Provider-backed synthesis"
    : "Deterministic synthesis";
  $("synthesisText").textContent = result.summary;
  $("synthesisPanel").classList.remove("hidden");
  button.disabled = false;
  button.textContent = "Refresh executive synthesis";
}

function refreshScenarios() {
  updateAssumptionLabels();
  if (!state.framingApproved) return;
  state.run = buildRun();
  const r = state.run;
  renderScenarios(r.scenarios);
  renderRecommendation(r.recommendation, r.redTeam, r.risks, r.stakeholder, r.roadmap);
  state.recommendationApproved = false;
  $("approveRecommendation").disabled = false;
  $("approveRecommendation").textContent = "Approve recommendation";
  $("recommendationGate").classList.remove("approved");
  $("downloadBrief").disabled = true;
  $("downloadBrief").classList.add("secondary-disabled");
  $("synthesisPanel").classList.add("hidden");
  $("synthesisButton").disabled = false;
  $("synthesisButton").textContent = "Generate executive synthesis";
}

function initNavigation() {
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      document.querySelectorAll(".nav-link").forEach(x => x.classList.remove("active"));
      link.classList.add("active");
    });
  });
}

function init() {
  $("companyName").textContent = caseData.company;
  $("executiveQuestion").textContent = caseData.question;
  $("situationText").textContent = caseData.situation;
  $("complicationText").textContent = caseData.complication;
  $("questionText").textContent = caseData.question;
  $("syntheticNotice").textContent = caseData.disclaimer;
  renderEvidence();
  updateAssumptionLabels();
  initNavigation();
  $("runButton").addEventListener("click", runFraming);
  $("approveFraming").addEventListener("click", approveFraming);
  $("approveRecommendation").addEventListener("click", approveRecommendation);
  $("downloadBrief").addEventListener("click", downloadBrief);
  $("synthesisButton").addEventListener("click", requestSynthesis);
  ["realization", "costMultiplier", "disruptionMultiplier", "adoption"].forEach(id => $(id).addEventListener("input", refreshScenarios));
}

init();
