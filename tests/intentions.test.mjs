import assert from "node:assert/strict";
import test from "node:test";

import { loadIntentionContext, validateIntentions } from "../scripts/validate-intentions.mjs";

test("toutes les intentions référencent des fiches canoniques", async () => {
  const context = await loadIntentionContext();
  assert.deepEqual(validateIntentions(context), []);
});

test("les situations sensibles utilisent les mécaniques 2024 attendues", async () => {
  const { intentions } = await loadIntentionContext();
  const byId = new Map(intentions.map((intent) => [intent.id, intent]));
  const references = (id) => {
    const intent = byId.get(id);
    return [intent?.primaryRule, ...(intent?.relatedRules || [])].filter(Boolean).map((ref) => `${ref.parameter}:${ref.slug}`);
  };
  assert.ok(references("agripper-ennemi").includes("condition:agrippe"));
  assert.ok(!references("agripper-ennemi").includes("condition:entrave"));
  assert.ok(references("repousser-ennemi").includes("action:pousser"));
  assert.ok(!references("repousser-ennemi").includes("action:athletisme"));
  assert.ok(references("attaquer").includes("general:coup-critique"));
  assert.ok(references("subir-un-etat").includes("condition:agrippe"));
});
