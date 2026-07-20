import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../js/spell-export.js", import.meta.url), "utf8");
const context = {};
vm.runInNewContext(source, context);
const { buildSpellExportText } = context.DndSpellExport;

test("buildSpellExportText exports only the supplied spells in their current order", () => {
  const output = buildSpellExportText([
    {
      name: "Boule de feu",
      level: 3,
      school: "Évocation",
      classes: ["Ensorceleur", "Magicien"],
      casting_time: "Action",
      range: "45 m",
      components: "V, S, M",
      duration: "Instantanée",
      description: "Une explosion de flammes.",
    },
    { name: "Lumière", level: 0, description: "Produit une lumière vive." },
  ]);

  assert.match(output, /2 sort\(s\) exporté\(s\)/);
  assert.ok(output.indexOf("1. Boule de feu") < output.indexOf("2. Lumière"));
  assert.match(output, /Classes : Ensorceleur, Magicien/);
  assert.match(output, /Une explosion de flammes\./);
});

test("buildSpellExportText handles an empty selection", () => {
  assert.equal(buildSpellExportText([]), "SORTS D&D 2024\n0 sort(s) exporté(s)\n");
});
