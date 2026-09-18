import test from "node:test";
import assert from "node:assert/strict";

class FakeClassList {
  constructor(initial = []) { this.values = new Set(initial); }
  add(...names) { names.forEach(name => this.values.add(name)); }
  remove(...names) { names.forEach(name => this.values.delete(name)); }
  contains(name) { return this.values.has(name); }
}

class FakeElement {
  constructor(id = "", classes = []) {
    this.id = id;
    this.classList = new FakeClassList(classes);
    this.dataset = {};
    this.listeners = new Map();
    this.children = new Map();
    this.innerHTML = "";
    this.textContent = "";
    this.value = "";
    this.disabled = false;
    this.href = "";
    this.download = "";
    this.removed = false;
  }

  addEventListener(type, handler) {
    const list = this.listeners.get(type) || [];
    list.push(handler);
    this.listeners.set(type, list);
  }

  async dispatch(type) {
    for (const handler of this.listeners.get(type) || []) {
      await handler({ target: this, currentTarget: this });
    }
  }

  click() {
    for (const handler of this.listeners.get("click") || []) {
      void handler({ target: this, currentTarget: this });
    }
  }

  querySelector(selector) {
    return this.children.get(selector) || null;
  }

  scrollIntoView() {}
  remove() { this.removed = true; }
}

function createDom() {
  const ids = [
    "companyName", "executiveQuestion", "situationText", "complicationText", "questionText", "syntheticNotice",
    "evidenceList", "realization", "costMultiplier", "disruptionMultiplier", "adoption",
    "realizationValue", "costValue", "disruptionValue", "adoptionValue",
    "runButton", "approveFraming", "approveRecommendation", "downloadBrief",
    "issueTree", "framingGate", "framingGateTitle", "analysisLocked", "analysisContent", "recommendationGate",
    "diagnosisCards", "findings", "regionalBars", "hypothesisGrid", "scenarioGrid",
    "recommendationTitle", "recommendationText", "recommendationReasons", "impactStrip",
    "redTeam", "riskTable", "stakeholders", "roadmap",
    "synthesisButton", "synthesisPanel", "synthesisMode", "synthesisText",
    "agentProblem", "agentDiagnostic", "agentHypothesis", "agentScenario", "agentFinance",
    "agentStakeholder", "agentRisk", "agentRedTeam", "agentRecommendation", "agentExecutive"
  ];

  const elements = new Map(ids.map(id => [id, new FakeElement(id)]));

  elements.get("analysisContent").classList.add("hidden");
  elements.get("framingGate").classList.add("locked");
  elements.get("recommendationGate").classList.add("locked");
  elements.get("downloadBrief").classList.add("secondary-disabled");
  elements.get("synthesisPanel").classList.add("hidden");
  elements.get("synthesisButton").disabled = true;
  elements.get("downloadBrief").disabled = true;

  elements.get("realization").value = "85";
  elements.get("costMultiplier").value = "100";
  elements.get("disruptionMultiplier").value = "100";
  elements.get("adoption").value = "80";

  const agentIds = [
    "agentProblem", "agentDiagnostic", "agentHypothesis", "agentScenario", "agentFinance",
    "agentStakeholder", "agentRisk", "agentRedTeam", "agentRecommendation", "agentExecutive"
  ];
  for (const id of agentIds) {
    elements.get(id).children.set(".agent-state", new FakeElement(`${id}-state`));
    elements.get(id).children.set(".agent-note", new FakeElement(`${id}-note`));
  }

  const navTargets = ["brief", "framing", "diagnosis", "scenarios", "challenge", "recommendation", "roadmap-section", "evidence"];
  const navLinks = navTargets.map(target => {
    const link = new FakeElement(`nav-${target}`, ["nav-link"]);
    link.href = `#${target}`;
    return link;
  });

  const body = {
    children: [],
    appendChild(element) { this.children.push(element); return element; }
  };

  const document = {
    body,
    lastCreatedAnchor: null,
    getElementById(id) { return elements.get(id) || null; },
    querySelectorAll(selector) { return selector === ".nav-link" ? navLinks : []; },
    querySelector(selector) {
      const match = selector.match(/^\[href="#([^"]+)"\]$/);
      return match ? navLinks.find(link => link.href === `#${match[1]}`) || null : null;
    },
    createElement(tag) {
      const el = new FakeElement(tag);
      if (tag === "a") this.lastCreatedAnchor = el;
      return el;
    }
  };

  return { document, elements, navLinks, agentIds };
}

test("browser decision flow enforces gates, supports synthesis, export, sensitivity reset and safe rerun", async () => {
  const previousDocument = globalThis.document;
  const previousFetch = globalThis.fetch;
  const previousCreateObjectURL = URL.createObjectURL;
  const previousRevokeObjectURL = URL.revokeObjectURL;

  const { document, elements, agentIds } = createDom();
  globalThis.document = document;

  let synthesisCalls = 0;
  globalThis.fetch = async (url, options) => {
    synthesisCalls += 1;
    assert.equal(url, "/api/synthesize");
    assert.equal(options.method, "POST");
    const payload = JSON.parse(options.body);
    assert.equal(payload.evidence.length, 5);
    assert.match(payload.recommendation.recommendation, /hybrid/i);
    return {
      ok: true,
      async json() {
        return {
          mode: "deterministic-fallback",
          summary: "Evidence-backed executive synthesis.",
          evidenceCount: payload.evidence.length
        };
      }
    };
  };

  let revokedUrl = null;
  URL.createObjectURL = () => "blob:decisionforge-test";
  URL.revokeObjectURL = url => { revokedUrl = url; };

  try {
    await import(`../src/app.mjs?ui-flow-test=${Date.now()}`);

    assert.equal(elements.get("companyName").textContent, "Northstar Services Group");
    assert.match(elements.get("executiveQuestion").textContent, /restore margin/i);
    assert.match(elements.get("evidenceList").innerHTML, /E-FRAG/);
    assert.equal(elements.get("realizationValue").textContent, "85%");

    await elements.get("runButton").dispatch("click");
    assert.equal(elements.get("runButton").textContent, "Waiting for approval");
    assert.ok(!elements.get("framingGate").classList.contains("locked"));
    assert.equal(elements.get("agentProblem").dataset.status, "complete");
    assert.ok(elements.get("analysisContent").classList.contains("hidden"));

    await elements.get("approveFraming").dispatch("click");
    assert.ok(elements.get("framingGate").classList.contains("approved"));
    assert.ok(!elements.get("analysisContent").classList.contains("hidden"));
    assert.ok(elements.get("analysisLocked").classList.contains("hidden"));
    assert.ok(!elements.get("recommendationGate").classList.contains("locked"));
    assert.match(elements.get("scenarioGrid").innerHTML, /Hybrid Operating-Model Transformation/);
    assert.match(elements.get("recommendationTitle").textContent, /Hybrid Operating-Model Transformation/);
    assert.equal(elements.get("synthesisButton").disabled, false);
    for (const id of agentIds) assert.equal(elements.get(id).dataset.status, "complete", `${id} did not complete`);

    await elements.get("approveRecommendation").dispatch("click");
    assert.equal(elements.get("downloadBrief").disabled, false);
    assert.ok(elements.get("recommendationGate").classList.contains("approved"));

    await elements.get("downloadBrief").dispatch("click");
    assert.equal(document.lastCreatedAnchor.download, "decisionforge-executive-brief.md");
    assert.equal(document.lastCreatedAnchor.href, "blob:decisionforge-test");
    assert.equal(revokedUrl, "blob:decisionforge-test");

    await elements.get("synthesisButton").dispatch("click");
    assert.equal(synthesisCalls, 1);
    assert.ok(!elements.get("synthesisPanel").classList.contains("hidden"));
    assert.equal(elements.get("synthesisMode").textContent, "Deterministic synthesis");
    assert.equal(elements.get("synthesisText").textContent, "Evidence-backed executive synthesis.");

    elements.get("realization").value = "60";
    await elements.get("realization").dispatch("input");
    assert.equal(elements.get("realizationValue").textContent, "60%");
    assert.equal(elements.get("downloadBrief").disabled, true);
    assert.ok(!elements.get("recommendationGate").classList.contains("approved"));
    assert.ok(elements.get("synthesisPanel").classList.contains("hidden"));
    assert.match(elements.get("scenarioGrid").innerHTML, /Value score/);

    await elements.get("runButton").dispatch("click");
    assert.equal(elements.get("runButton").textContent, "Waiting for approval");
    assert.equal(elements.get("approveFraming").disabled, false);
    assert.equal(elements.get("approveFraming").textContent, "Approve framing");
    assert.ok(elements.get("analysisContent").classList.contains("hidden"));
    assert.equal(elements.get("downloadBrief").disabled, true);
    assert.equal(elements.get("synthesisButton").disabled, true);
    assert.ok(!elements.get("framingGate").classList.contains("locked"));
  } finally {
    globalThis.document = previousDocument;
    globalThis.fetch = previousFetch;
    URL.createObjectURL = previousCreateObjectURL;
    URL.revokeObjectURL = previousRevokeObjectURL;
  }
});
