import { readFile, readdir, stat, writeFile, mkdir } from "node:fs/promises";
import { extname, resolve } from "node:path";

import { buildAssetReport } from "./audit-assets.mjs";
import { PRECACHE_BUDGET_BYTES } from "./pwa-budget.mjs";
import { validateContentLinks } from "./validate-content-links.mjs";

const root = resolve(import.meta.dirname, "..");
const reportPath = resolve(root, "reports/quality.json");
const precacheBudget = PRECACHE_BUDGET_BYTES;

async function readJson(path) {
  return JSON.parse(await readFile(resolve(root, path), "utf8"));
}

async function readOptionalJson(path) {
  try {
    return await readJson(path);
  } catch {
    return null;
  }
}

async function filesIn(directory, predicate) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if ([".git", "node_modules", "_site", "playwright-report", "test-results"].includes(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(path, predicate));
    else if (entry.isFile() && predicate(path)) files.push(path);
  }
  return files.sort();
}

async function countTestDeclarations(files) {
  const sources = await Promise.all(files.map((path) => readFile(path, "utf8")));
  return sources.reduce((total, source) => total + (source.match(/\btest\s*\(/g) || []).length, 0);
}

async function precacheMetrics(worker) {
  const start = worker.indexOf("const CORE_ASSETS");
  const end = worker.indexOf("]);", start);
  const block = worker.slice(start, end);
  const paths = [...block.matchAll(/\"([^\"]+)\"/g)].map((match) => match[1]);
  const missing = [];
  let bytes = 0;
  for (const path of paths) {
    try {
      bytes += (await stat(resolve(root, path))).size;
    } catch {
      missing.push(path);
    }
  }
  return { entries: paths.length, bytes, budget: precacheBudget, missing };
}

function performanceSummary(baseline) {
  const pages = (baseline?.pages || []).filter((page) => Number.isFinite(page.performance));
  if (!pages.length) return null;
  const lowestPerformance = pages.reduce((lowest, page) => page.performance < lowest.performance ? page : lowest);
  const pagesWithCls = pages.filter((page) => Number.isFinite(page.metrics?.cls));
  const highestCls = pagesWithCls.length
    ? pagesWithCls.reduce((highest, page) => page.metrics.cls > highest.metrics.cls ? page : highest)
    : null;
  return {
    lowestPerformancePage: lowestPerformance.page,
    lowestPerformanceScore: lowestPerformance.performance,
    highestClsPage: highestCls?.page || null,
    highestCls: highestCls?.metrics.cls ?? null,
  };
}

function sourceCoverage(entries, sourceRefsByType) {
  const coverage = new Map();
  for (const entry of entries) {
    const type = String(entry.type || "unknown");
    const sourceRef = entry.sourceRef || sourceRefsByType[type];
    const current = coverage.get(type) || { total: 0, withSourceRef: 0, withoutSourceRef: 0 };
    current.total += 1;
    current[sourceRef ? "withSourceRef" : "withoutSourceRef"] += 1;
    coverage.set(type, current);
  }
  return Object.fromEntries([...coverage.entries()]
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([type, current]) => [type, {
      ...current,
      coveragePercent: Number((current.withSourceRef / current.total * 100).toFixed(2)),
    }]));
}

function markdownSummary(report) {
  return [
    "## Synthèse qualité",
    "",
    `- Pages HTML : ${report.pages.html}`,
    `- Contenus indexés : ${report.content.indexed}`,
    `- Liens ou ancres cassés : ${report.links.broken}`,
    `- Sources enregistrées : ${report.sources.registered}`,
    `- Assets : ${report.assets.files} fichiers / ${report.assets.bytes} octets / ${report.assets.unreferenced} non référencés`,
    `- Précache PWA : ${report.pwa.precache.entries} ressources / ${report.pwa.precache.bytes} octets`,
    `- Tests déclarés : ${report.tests.node} Node / ${report.tests.browser} navigateur`,
    `- Erreurs critiques : ${report.criticalErrors.length}`,
  ].join("\n");
}

const [inventory, primaryIndex, deepIndex, sources, assets, worker, nodeTestFiles, browserTestFiles, lighthouseBaseline] = await Promise.all([
  readJson("data/content-inventory.json"),
  readJson("data/search-index.json"),
  readJson("data/search-index-deep.json"),
  readJson("data/content-sources.json"),
  buildAssetReport(root),
  readFile(resolve(root, "service-worker.js"), "utf8"),
  filesIn(resolve(root, "tests"), (path) => extname(path) === ".mjs" && path.endsWith(".test.mjs")),
  filesIn(resolve(root, "tests/browser"), (path) => extname(path) === ".mjs" && path.endsWith(".spec.mjs")),
  readOptionalJson("reports/lighthouse/baseline.json"),
]);
const linkAudit = await validateContentLinks(root);
const precache = await precacheMetrics(worker);
const indexedEntries = [...(primaryIndex.entries || []), ...(deepIndex.entries || [])];
const sourceRefsByType = {
  ...(primaryIndex.sourceRefsByType || {}),
  ...(deepIndex.sourceRefsByType || {}),
};
const sourceRefs = indexedEntries.filter((entry) => entry.sourceRef || sourceRefsByType[entry.type]).length;
const report = {
  schemaVersion: 1,
  pages: { html: (await filesIn(root, (path) => extname(path) === ".html")).length },
  content: {
    indexed: inventory.count,
    byType: inventory.byType,
    bySection: inventory.bySection,
  },
  links: {
    checkedPages: linkAudit.files.length,
    broken: linkAudit.errors.length,
  },
  performance: performanceSummary(lighthouseBaseline),
  sources: {
    registered: (sources.sources || []).length,
    indexedWithSourceRef: sourceRefs,
    indexedWithoutSourceRef: indexedEntries.length - sourceRefs,
    coveragePercent: Number((sourceRefs / indexedEntries.length * 100).toFixed(2)),
    indexedByType: sourceCoverage(indexedEntries, sourceRefsByType),
  },
  assets: {
    files: assets.summary.files,
    bytes: assets.summary.bytes,
    referenced: assets.summary.referenced,
    unreferenced: assets.summary.unreferenced,
    largeAssets: assets.summary.largeAssets,
  },
  data: {
    primarySearchIndexBytes: (await stat(resolve(root, "data/search-index.json"))).size,
    deepSearchIndexBytes: (await stat(resolve(root, "data/search-index-deep.json"))).size,
    relationsBytes: (await stat(resolve(root, "data/content-relations.json"))).size,
  },
  pwa: { precache, budgetUsage: Number((precache.bytes / precache.budget).toFixed(4)) },
  tests: {
    node: await countTestDeclarations(nodeTestFiles),
    browser: await countTestDeclarations(browserTestFiles),
  },
  lighthouse: lighthouseBaseline ? {
    tool: lighthouseBaseline.tool,
    commit: lighthouseBaseline.commit,
    preset: lighthouseBaseline.environment?.preset || null,
    pages: (lighthouseBaseline.pages || []).map(({ page, performance, accessibility, bestPractices, seo, metrics }) => ({
      page,
      performance,
      accessibility,
      bestPractices,
      seo,
      metrics,
    })),
  } : null,
  criticalErrors: [
    ...(linkAudit.errors.length ? [`${linkAudit.errors.length} lien(s) ou ancre(s) cassé(s)`] : []),
    ...(precache.missing.length ? [`${precache.missing.length} ressource(s) du précache absente(s)`] : []),
    ...(precache.bytes > precache.budget ? [`Précache PWA au-dessus du budget (${precache.bytes} > ${precache.budget})`] : []),
    ...(inventory.count !== indexedEntries.length ? ["L’inventaire ne correspond pas aux index de recherche"] : []),
    ...(assets.summary.largePngWithoutModernVariant ? ["PNG volumineux sans variante WebP/AVIF"] : []),
  ],
};

await mkdir(resolve(root, "reports"), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
const summary = markdownSummary(report);
if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`, { flag: "a" });
console.log(summary);
console.log(`Rapport écrit dans reports/quality.json.`);
if (report.criticalErrors.length) {
  for (const error of report.criticalErrors) console.error(`- ${error}`);
  process.exitCode = 1;
}

export { markdownSummary };
