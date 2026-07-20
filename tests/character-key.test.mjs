import assert from "node:assert/strict";
import test from "node:test";

import { validateCharacterKey } from "../js/character-key.js";

test("validateCharacterKey accepts repository-style slugs", () => {
  assert.equal(validateCharacterKey("cleira"), "cleira");
  assert.equal(validateCharacterKey("tarin-the-spearbreaker"), "tarin-the-spearbreaker");
});

test("validateCharacterKey rejects path traversal and encoded separators", () => {
  for (const value of ["../cleira", "foo/bar", "foo\\bar", "%2e%2e%2fcleira", "cleira.json"] ) {
    assert.throws(() => validateCharacterKey(value), /Clé de personnage invalide/);
  }
});

test("validateCharacterKey rejects empty, malformed, and oversized values", () => {
  for (const value of ["", "-cleira", "cleira-", "CLEIRA", "a".repeat(81)]) {
    assert.throws(() => validateCharacterKey(value), /Clé de personnage invalide/);
  }
});
