import assert from "node:assert/strict";
import test from "node:test";
import { buildCodeAudit } from "../scripts/audit-code.mjs";

test("the phase-two code audit keeps legacy scripts and non-empty assets", async () => {
    const report = await buildCodeAudit();
    assert.equal(report.javascriptFiles, 61);
    assert.equal(report.stylesheetFiles, 25);
    assert.deepEqual(report.emptyFiles, []);
    assert.equal(report.vipConversionWrapper, true);
});
