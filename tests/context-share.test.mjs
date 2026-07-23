import assert from "node:assert/strict";
import test from "node:test";

import {
  buildContextUrl,
  pageSelectionParameter,
  ROUTE_SELECTION_TYPES,
} from "../js/context-share.js";
import {
  contextualUrlForEntry,
  inspectNavigationUrl,
} from "../scripts/validate-navigation.mjs";

test("context links preserve filters and replace competing selections", () => {
  const url = buildContextUrl(
    "https://dnd.local/spells.html?q=feu&level=3&monster=dragon#ancienne-cible",
    { parameter: "spell", value: "boule-de-feu" },
  );

  assert.equal(url, "https://dnd.local/spells.html?q=feu&level=3&spell=boule-de-feu");
});

test("section links preserve filters but discard detailed selections", () => {
  const url = buildContextUrl(
    "https://dnd.local/rules-2024.html?q=combat&condition=agrippe",
    { hash: "actions-en-combat" },
  );

  assert.equal(url, "https://dnd.local/rules-2024.html?q=combat#actions-en-combat");
});

test("catalog pages map to their published selection parameters", () => {
  assert.equal(pageSelectionParameter("/spells.html"), "spell");
  assert.equal(pageSelectionParameter("/guide/dons.html"), "feat");
  assert.equal(pageSelectionParameter("/monstres.html"), "monster");
  assert.equal(pageSelectionParameter("/armes-armures.html"), "equipment");
  assert.equal(pageSelectionParameter("/historique.html"), "background");
  assert.equal(pageSelectionParameter("/quickref.html"), "");
});

test("all contextual content families expose a canonical route contract", () => {
  assert.deepEqual(ROUTE_SELECTION_TYPES["quickref.html"], {
    action: "action",
    bonus: "bonus-action",
    condition: "condition",
    environment: "environment",
    movement: "movement",
    reaction: "reaction",
  });
  assert.equal(ROUTE_SELECTION_TYPES["glossaire.html"].term, "glossary");
});

test("navigation validation rejects unsafe or incoherent deep links", () => {
  const ids = new Set(["spell-boule-de-feu"]);
  assert.deepEqual(
    inspectNavigationUrl("spells.html?level=3&spell=boule-de-feu", ids),
    [],
  );
  assert.deepEqual(inspectNavigationUrl("historique.html?feat=Robuste", ids), []);
  assert.match(
    inspectNavigationUrl("spells.html?monster=dragon", ids).join(" "),
    /interdit/,
  );
  assert.match(
    inspectNavigationUrl("quickref.html?action=attaquer&condition=agrippe", ids).join(" "),
    /plusieurs sélections/,
  );
  assert.match(inspectNavigationUrl("../secret.html", ids).join(" "), /traversée/);
  assert.match(inspectNavigationUrl("https://example.com/", ids).join(" "), /externe/);
});

test("contextual URLs are generated from canonical search entries", () => {
  assert.equal(
    contextualUrlForEntry({
      id: "action-attaquer",
      type: "action",
      url: "quickref.html?q=Attaquer",
    }),
    "quickref.html?q=Attaquer&action=attaquer",
  );
});
