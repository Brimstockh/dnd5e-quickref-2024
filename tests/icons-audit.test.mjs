import assert from "node:assert/strict";
import test from "node:test";
import { buildIconReport } from "../scripts/audit-icons.mjs";

test("the icon set matches the quick reference runtime", async () => {
    const report = await buildIconReport();
    assert.equal(report.runtimeIconCount, 46);
    assert.equal(report.unusedCss.length, 0);
    assert.equal(report.unusedPng.length, 0);
    assert.deepEqual(report.stylesheetPages, ["quickref.html"]);
    assert.deepEqual(report.runtimePages, ["quickref.html"]);
    assert.equal(report.serviceWorkerPrecacheIncludesIcons, false);
    assert.deepEqual(report.missingCss, []);
    assert.deepEqual(report.missingPng, []);
});
