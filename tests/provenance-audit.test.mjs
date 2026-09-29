import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";

const run = promisify(execFile);

test("provenance audit validates registered sources and structured content", async () => {
  const { stdout } = await run(process.execPath, ["scripts/audit-provenance.mjs"], { cwd: process.cwd() });
  assert.match(stdout, /Sources enregistrées : 6/);
  assert.match(stdout, /Entrées Lore contrôlées : 74\/74/);
  assert.match(stdout, /Erreurs critiques : 0/);
  assert.match(stdout, /Audit de provenance réussi/);
});
