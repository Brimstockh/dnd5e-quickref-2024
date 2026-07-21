import assert from "node:assert/strict";
import test from "node:test";

import { fetchJson } from "../js/fetch-json.js";

test("fetchJson returns parsed data", async () => {
  const data = { name: "Cleira" };
  const result = await fetchJson("character.json", {
    fetchImpl: async (path) => {
      assert.equal(path, "character.json");
      return { ok: true, json: async () => data };
    },
  });

  assert.deepEqual(result, data);
});

test("fetchJson returns null for a missing optional resource", async () => {
  const result = await fetchJson("story.json", {
    optional: true,
    fetchImpl: async () => ({ ok: false, status: 404 }),
  });

  assert.equal(result, null);
});

test("fetchJson reports HTTP and parsing errors with the resource path", async () => {
  await assert.rejects(
    fetchJson("character.json", {
      fetchImpl: async () => ({ ok: false, status: 500 }),
    }),
    /character\.json \(HTTP 500\)/,
  );

  await assert.rejects(
    fetchJson("invalid.json", {
      fetchImpl: async () => ({
        ok: true,
        json: async () => { throw new SyntaxError("invalid"); },
      }),
    }),
    /JSON invalide pour invalid\.json/,
  );
});

test("fetchJson reports network errors with the resource path", async () => {
  await assert.rejects(
    fetchJson("offline.json", {
      fetchImpl: async () => { throw new TypeError("offline"); },
    }),
    /Impossible de charger offline\.json/,
  );
});
