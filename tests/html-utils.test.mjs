import assert from "node:assert/strict";
import test from "node:test";

import { escapeHtml } from "../js/html-utils.js";

test("escapeHtml neutralizes HTML-significant characters", () => {
  assert.equal(
    escapeHtml(`<img src=x onerror="alert('xss')"> & text`),
    "&lt;img src=x onerror=&quot;alert(&#039;xss&#039;)&quot;&gt; &amp; text",
  );
});

test("escapeHtml handles nullish and non-string values", () => {
  assert.equal(escapeHtml(null), "");
  assert.equal(escapeHtml(42), "42");
});
