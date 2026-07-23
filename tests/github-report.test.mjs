import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

async function loadApi() {
  const source = await readFile(resolve(root, "js/github-report.js"), "utf8");
  const window = {
    location: new URL("https://brimstockh.github.io/dnd5e-quickref-2024/spells.html?spell=fireball"),
  };
  const document = {
    currentScript: {
      src: "https://brimstockh.github.io/dnd5e-quickref-2024/js/github-report.js",
    },
    readyState: "loading",
    addEventListener: () => {},
  };
  const context = vm.createContext({
    URL,
    decodeURIComponent,
    document,
    navigator: { userAgent: "Test Browser" },
    window,
  });
  vm.runInContext(source, context);
  return { api: window.DndGithubReport, source };
}

test("GitHub report helpers support GitHub Pages paths and selected content", async () => {
  const { api } = await loadApi();
  const rootUrl = "https://brimstockh.github.io/dnd5e-quickref-2024/";

  assert.equal(
    api.sourcePath(`${rootUrl}classes/class-paladin.html#spellcasting`, rootUrl),
    "classes/class-paladin.html",
  );
  assert.equal(api.sourcePath(rootUrl, rootUrl), "index.html");
  assert.equal(
    api.selectedContent(`${rootUrl}spells.html?spell=fireball`, "spells.html"),
    "spell:fireball",
  );
  assert.equal(
    api.selectedContent(`${rootUrl}classes/class-paladin.html#spellcasting`, "classes/class-paladin.html"),
    "section:spellcasting",
  );
  assert.equal(
    api.githubSourceUrl("classes/class-paladin.html"),
    "https://github.com/Brimstockh/dnd5e-quickref-2024/blob/main/classes/class-paladin.html",
  );
});

test("GitHub issue URL contains the complete correction context", async () => {
  const { api, source } = await loadApi();
  const issue = new URL(api.buildIssueUrl({
    title: "Boule de feu",
    url: "https://brimstockh.github.io/dnd5e-quickref-2024/spells.html?spell=fireball",
    contentId: "spell:fireball",
    category: "Sort",
    sourcePath: "spells.html",
    userAgent: "Test Browser",
  }));
  const body = issue.searchParams.get("body");

  assert.equal(issue.origin + issue.pathname, "https://github.com/Brimstockh/dnd5e-quickref-2024/issues/new");
  assert.equal(issue.searchParams.get("title"), "[Signalement] Boule de feu");
  for (const value of [
    "Faute ou typographie",
    "Erreur de règle",
    "Lien cassé",
    "Traduction discutable",
    "Incohérence de données",
    "spell:fireball",
    "spells.html",
    "Test Browser",
  ]) {
    assert.ok(body.includes(value), value);
  }
  assert.match(source, /target = "_blank"/);
  assert.match(source, /rel = "noopener noreferrer"/);
  assert.match(source, /dataset\.reportIssue/);
});
