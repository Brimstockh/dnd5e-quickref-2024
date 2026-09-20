import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const load = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));
const catalog = await load("data/magic-items.json");

test("magic item catalog is sourced from the DMG 2024 PDF and keeps stable IDs", () => {
  assert.equal(catalog.schemaVersion, 2);
  assert.equal(catalog.sourceRef, "dmg-2024-magic-pdf");
  assert.equal(catalog.items.length, 288);
  assert.equal(new Set(catalog.items.map((item) => item.id)).size, catalog.items.length);
  assert.ok(catalog.items.some((item) => item.id === "magic-item-potion-de-guerison"));
  assert.ok(catalog.items.some((item) => item.officialName === "DECK OF MANY THINGS"));
});

test("complex magic item fields remain structured", () => {
  const find = (name) => catalog.items.find((item) => item.officialName === name);
  assert.ok(find("AMMUNITION OF SLAYING")?.tables.length);
  assert.deepEqual(find("POTION OF HEALING")?.variants.map(({ rarity }) => rarity), ["common", "uncommon", "rare", "very-rare"]);
  assert.equal(find("RING OF EVASION")?.attunement.required, true);
  assert.ok(catalog.items.some((item) => item.charges?.max > 0));
});

test("magic item page exposes the official filters and structured renderer", async () => {
  const html = await readFile(new URL("../objets-magiques.html", import.meta.url), "utf8");
  const script = await readFile(new URL("../js/magic-items-page.js", import.meta.url), "utf8");
  assert.match(html, /id="raritySelect"/);
  assert.match(html, /id="typeSelect"/);
  assert.match(html, /id="attunementSelect"/);
  assert.match(html, /id="filterPanel"/);
  assert.match(html, /id="openFiltersBtn"/);
  assert.match(html, /id="filterBackdrop"/);
  assert.match(script, /activationTypes/);
  assert.match(script, /variants/);
  assert.match(script, /tables/);
  assert.match(script, /charges/);
  assert.match(script, /setFiltersOpen/);
});
