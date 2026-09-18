import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const required = [
  "index.html", "styles.css", "src/app.mjs", "src/engine.mjs", "src/case-data.mjs",
  "README.md", "CASE_STUDY.md", "METHODOLOGY.md", "EVALUATION.md", "vercel.json"
];
for (const file of required) assert.ok(fs.existsSync(path.join(root, file)), `Missing ${file}`);
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
for (const id of ["runButton","approveFraming","scenarioGrid","approveRecommendation","downloadBrief","evidenceList"]) {
  assert.ok(html.includes(`id="${id}"`), `Missing UI control ${id}`);
}
const app = fs.readFileSync(path.join(root, "src/app.mjs"), "utf8");
assert.ok(app.includes("addEventListener"), "App lacks interaction bindings");
assert.ok(app.includes("downloadBrief"), "App lacks executive brief export");
console.log("Static validation passed: required files and core interaction hooks are present.");
