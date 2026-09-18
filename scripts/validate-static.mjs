import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const read = file => fs.readFileSync(path.join(root, file), "utf8");

const required = [
  "index.html",
  "styles.css",
  "src/app.mjs",
  "src/engine.mjs",
  "src/case-data.mjs",
  "api/synthesize.js",
  "README.md",
  "CASE_STUDY.md",
  "METHODOLOGY.md",
  "EVALUATION.md",
  "architecture/agent-workflow.md",
  "architecture/decisionforge-architecture.svg",
  "tests/engine.test.mjs",
  "tests/api.test.mjs",
  "vercel.json"
];

for (const file of required) {
  assert.ok(fs.existsSync(path.join(root, file)), `Missing required file: ${file}`);
}

const html = read("index.html");
const app = read("src/app.mjs");
const readme = read("README.md");
const architecture = read("architecture/agent-workflow.md");

const htmlIds = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
const uniqueHtmlIds = new Set(htmlIds);
assert.equal(uniqueHtmlIds.size, htmlIds.length, "Duplicate HTML ids detected");

const appIds = [...app.matchAll(/\$\("([^"]+)"\)/g)].map(match => match[1]);
for (const id of new Set(appIds)) {
  assert.ok(uniqueHtmlIds.has(id), `App references missing HTML id: ${id}`);
}

for (const id of [
  "runButton",
  "approveFraming",
  "scenarioGrid",
  "approveRecommendation",
  "downloadBrief",
  "synthesisButton",
  "synthesisPanel",
  "evidenceList"
]) {
  assert.ok(uniqueHtmlIds.has(id), `Missing core UI control: ${id}`);
}

const navTargets = [...html.matchAll(/class="nav-link[^"]*"[^>]*href="#([^"]+)"/g)].map(match => match[1]);
for (const target of navTargets) {
  assert.ok(uniqueHtmlIds.has(target), `Navigation target does not exist: #${target}`);
}

assert.match(html, /<link[^>]+href="\.\/styles\.css"/, "Stylesheet link is missing or incorrect");
assert.match(html, /<script[^>]+type="module"[^>]+src="\.\/src\/app\.mjs"/, "Module entrypoint is missing or incorrect");

for (const binding of [
  'addEventListener("click", runFraming)',
  'addEventListener("click", approveFraming)',
  'addEventListener("click", approveRecommendation)',
  'addEventListener("click", downloadBrief)',
  'addEventListener("click", requestSynthesis)',
  'addEventListener("input", refreshScenarios)'
]) {
  assert.ok(app.includes(binding), `Missing interaction binding: ${binding}`);
}

assert.ok(app.includes("resetDecisionRoom"), "Re-run reset flow is missing");
assert.ok(app.includes('fetch("/api/synthesize"'), "Synthesis endpoint is not wired into the UI");
assert.ok(app.includes("client-fallback"), "Client-side synthesis fallback is missing");
assert.ok(app.includes("URL.createObjectURL"), "Executive brief download path is missing");

assert.ok(readme.includes("architecture/decisionforge-architecture.svg"), "README does not reference the stable architecture asset");
assert.ok(architecture.includes("decisionforge-architecture.svg"), "Architecture documentation does not reference the stable diagram");

const forbidden = [/\bDHL\b/i, /Deutsche\s+Post/i, /Samantha\s+Dunkel/i];
const independentFiles = [
  "README.md",
  "index.html",
  "src/app.mjs",
  "src/engine.mjs",
  "src/case-data.mjs",
  "architecture/agent-workflow.md"
];
for (const file of independentFiles) {
  const text = read(file);
  for (const pattern of forbidden) {
    assert.ok(!pattern.test(text), `Company-specific reference found in ${file}: ${pattern}`);
  }
}

console.log(
  `Static validation passed: ${required.length} required files, ${uniqueHtmlIds.size} unique UI ids, ${new Set(appIds).size} app id references, navigation targets, synthesis wiring, rerun safety, architecture asset, and independence checks are valid.`
);
