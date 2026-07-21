import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeRichHtml } from "../js/rich-html.js";

test("sanitizeRichHtml preserves the spell-description allowlist", () => {
  const value = "<p>Texte <strong>important</strong></p><ul><li>Effet</li></ul>";
  assert.equal(sanitizeRichHtml(value), value);
});

test("sanitizeRichHtml escapes tags and attributes outside the allowlist", () => {
  const value = '<p onclick="alert(1)">Texte</p><img src=x onerror="alert(2)"><script>alert(3)</script>';
  assert.equal(
    sanitizeRichHtml(value),
    "&lt;p onclick=&quot;alert(1)&quot;&gt;Texte</p>&lt;img src=x onerror=&quot;alert(2)&quot;&gt;&lt;script&gt;alert(3)&lt;/script&gt;",
  );
});

test("sanitizeRichHtml does not decode pre-encoded markup", () => {
  assert.equal(sanitizeRichHtml("&lt;script&gt;alert(1)&lt;/script&gt;"), "&amp;lt;script&amp;gt;alert(1)&amp;lt;/script&amp;gt;");
});
