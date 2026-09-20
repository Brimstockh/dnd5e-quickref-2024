import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { auditLore, EXPECTED_LORE_ENTRIES } from "../scripts/audit-lore-coverage.mjs";

const lore = JSON.parse(await readFile(new URL("../data/lore.json", import.meta.url), "utf8"));

test("the lore catalog covers every DMG 2024 Appendix A entry", () => {
  const result = auditLore(lore);
  assert.equal(EXPECTED_LORE_ENTRIES.length, 74);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.errors, []);
  assert.equal(result.found, 74);
});

test("lore entries use stable IDs and explicit source metadata", () => {
  for (const entry of lore.entries) {
    assert.match(entry.id, /^lore-[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(entry.name);
    assert.ok(entry.summary || entry.target);
    assert.ok(entry.source?.book);
    assert.ok(entry.source?.section);
  }
});
