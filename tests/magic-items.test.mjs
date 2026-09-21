import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const load = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));
const catalog = await load("data/magic-items.json");
const magicItemSchema = await load("schemas/magic-items.schema.json");

test("magic item catalog is sourced from the DMG 2024 PDF and keeps stable IDs", () => {
  assert.equal(catalog.schemaVersion, 2);
  assert.equal(catalog.sourceRef, "dmg-2024-magic-pdf");
  assert.deepEqual(catalog.localization, {
    interfaceLanguage: "fr",
    contentLanguage: "en",
    translatedDescriptionField: null,
    originalDescriptionField: "description",
  });
  assert.deepEqual(magicItemSchema.properties.items.items.properties.verificationStatus.enum, ["raw-transcription", "cleaned", "verified", "needs-verification"]);
  assert.equal(catalog.items.length, 347);
  assert.equal(new Set(catalog.items.map((item) => item.id)).size, catalog.items.length);
  assert.ok(catalog.items.some((item) => item.id === "magic-item-potion-de-guerison"));
  assert.ok(catalog.items.some((item) => item.officialName === "DECK OF MANY THINGS"));
  assert.equal(catalog.items.some((item) => item.id === "magic-item-cask-of-force"), false);
  assert.equal(catalog.items.some((item) => item.id === "magic-item-cusk-of-force"), false);
  for (const id of [
    "magic-item-dull-light-calling-to-mind-a-heartbeat",
    "magic-item-harmless-cloud-of-bird-feathers-and-is-lost-forever",
    "magic-item-layer-of-the-abyss",
    "magic-item-losing-all-its-hit-points-it-regains-all-of-them",
    "magic-item-mediately-after-you-make-a-ranged-attack-with-the",
    "magic-item-objects-slowly-spin-or-turn-in-place",
    "magic-item-reverts-to-its-inanimate-form",
    "magic-item-sumes-and-destroys-the-staff-then-disperses",
  ]) {
    assert.equal(catalog.items.some((item) => item.id === id), false, id);
  }
});

test("complex magic item fields remain structured", () => {
  const find = (name) => catalog.items.find((item) => item.officialName === name);
  assert.ok(find("AMMUNITION OF SLAYING")?.tables.length);
  assert.deepEqual(find("POTION OF HEALING")?.variants.map(({ rarity }) => rarity), ["common", "uncommon", "rare", "very-rare"]);
  assert.equal(find("RING OF EVASION")?.attunement.required, true);
  assert.ok(catalog.items.some((item) => item.charges?.max > 0));
});

test("magic item quality statuses stay explicit and conservative", () => {
  const statuses = new Set(["raw-transcription", "cleaned", "verified", "needs-verification"]);
  for (const item of catalog.items) {
    assert.equal(statuses.has(item.verificationStatus), true, item.id);
    if (item.verificationStatus === "verified") {
      assert.doesNotMatch(item.description, /(?:\\\\|¥|�|\b(?:de|am)-\s+\w+)/i, item.id);
    }
  }
  assert.equal(catalog.items.filter((item) => item.verificationStatus === "verified").length, 347);
});

test("provided source excerpts populate the verified magic item entries", () => {
  const find = (name) => catalog.items.find((item) => item.officialName === name);
  for (const name of [
    "ADAMANTINE ARMOR",
    "ADAMANTINE WEAPON",
    "ALCHEMY JUG",
    "AMMUNITION, +1, +2, OR +3",
    "ARMOR, +1, +2, OR +3",
    "ANIMATED SHIELD",
    "ARROW-CATCHING SHIELD",
    "BABA YAGA'S DANCING BROOM",
    "BELT OF GIANT STRENGTH",
    "BERSERKER AXE",
    "BOWL OF COMMANDING WATER ELEMENTALS",
    "CHIME OF OPENING",
    "CUBE OF FORCE",
    "DEMON ARMOR",
    "FIGURINE OF WONDROUS POWER",
    "HAG EYE",
    "HEWARD'S HANDY HAVERSACK",
    "POTION OF ANIMAL FRIENDSHIP",
    "POTION OF GASEOUS FORM",
    "POTION OF GIANT STRENGTH",
    "POTION OF HEALING",
    "RIVAL COIN",
    "SHIELD, +1, +2, OR +3",
    "TALKING DOLL",
    "WEAPON, +1, +2, OR +3",
  ]) {
    assert.equal(find(name)?.verificationStatus, "verified", name);
    assert.doesNotMatch(find(name)?.description || "", /Cette entrée est recensée/);
  }
  const cube = find("CUBE OF FORCE");
  assert.deepEqual(cube?.tables[0]?.columns, ["Spell", "Charge Cost"]);
  assert.equal(cube?.tables[0]?.rows.length, 6);
  assert.deepEqual(find("ALCHEMY JUG")?.tables[0]?.columns, ["Liquid", "Max. Amount"]);
  assert.equal(find("ALCHEMY JUG")?.tables[0]?.rows.length, 10);
  assert.deepEqual(find("AMMUNITION OF SLAYING")?.tables[0]?.columns, ["1d100", "Creature Type"]);
  assert.equal(find("AMMUNITION OF SLAYING")?.tables[0]?.rows.length, 14);
  assert.deepEqual(find("APPARATUS OF KWALISH")?.tables[0]?.columns, ["Lever", "Up", "Down"]);
  assert.equal(find("APPARATUS OF KWALISH")?.tables[0]?.rows.length, 10);
  assert.deepEqual(find("BAG OF BEANS")?.tables[0]?.columns, ["1d100", "Effect"]);
  assert.equal(find("BAG OF BEANS")?.tables[0]?.rows.length, 12);
  assert.equal(find("BAG OF TRICKS")?.tables.length, 3);
  assert.deepEqual(find("BELT OF GIANT STRENGTH")?.tables[0]?.columns, ["Belt", "Str.", "Rarity"]);
  assert.equal(find("BELT OF GIANT STRENGTH")?.tables[0]?.rows.length, 5);
  assert.deepEqual(find("CANDLE OF INVOCATION")?.tables[0]?.columns, ["1d100", "Outer Plane"]);
  assert.equal(find("CANDLE OF INVOCATION")?.tables[0]?.rows.length, 16);
  assert.deepEqual(find("CARPET OF FLYING")?.tables[0]?.columns, ["1d100", "Size", "Capacity", "Fly Speed"]);
  assert.equal(find("CARPET OF FLYING")?.tables[0]?.rows.length, 4);
  assert.doesNotMatch(find("CRYSTAL BALL OF TRUE SEEING")?.description || "", /Cusk of Force/i);
  assert.equal(find("HEWARD'S HANDY HAVERSACK")?.verificationStatus, "verified");
  assert.equal(find("HEWARD'S HANDY HAVERSACK")?.rarity, "rare");
  assert.ok(find("HEWARD'S HANDY HAVERSACK")?.aliases.includes("Heward's Handy Spice Pouch"));
  assert.equal(find("INSTRUMENT OF THE BARDS")?.verificationStatus, "verified");
  assert.deepEqual(find("POTION OF GIANT STRENGTH")?.tables[0]?.columns, ["Potion", "Str.", "Rarity"]);
  assert.deepEqual(find("POTION OF HEALING")?.tables[0]?.columns, ["Potion", "HP Regained", "Rarity"]);
  assert.equal(find("POTION OF HEALING")?.tables[0]?.rows.length, 4);
});

test("DMG pages 237 to 246 populate the verified magic item entries", () => {
  const find = (name) => catalog.items.find((item) => item.officialName === name);
  for (const name of [
    "BLACKRAZOR",
    "BOOK OF EXALTED DEEDS",
    "BOOK OF VILE DARKNESS",
    "BOOTS OF ELVENKIND",
    "BOOTS OF FALSE TRACKS",
    "BOOTS OF LEVITATION",
    "BOOTS OF SPEED",
    "BOOTS OF STRIDING AND SPRINGING",
    "BOOTS OF THE WINTERLANDS",
    "BRACERS OF ARCHERY",
    "BRACERS OF DEFENSE",
    "BRAZIER OF COMMANDING FIRE ELEMENTALS",
    "BROOCH OF SHIELDING",
    "BROOM OF FLYING",
    "CANDLE OF INVOCATION",
    "CANDLE OF THE DEEP",
    "CAP OF WATER BREATHING",
    "CAPE OF THE MOUNTEBANK",
    "CARPET OF FLYING",
    "CAST-OFF ARMOR",
    "CAULDRON OF REBIRTH",
    "CENSER OF CONTROLLING AIR ELEMENTALS",
    "CIRCLET OF BLASTING",
    "CLOAK OF ARACHNIDA",
    "CLOAK OF BILLOWING",
    "CLOAK OF DISPLACEMENT",
    "CLOAK OF ELVENKIND",
    "CLOAK OF INVISIBILITY",
    "CLOAK OF MANY FASHIONS",
    "CLOAK OF THE BAT",
    "CLOAK OF PROTECTION",
    "CLOAK OF THE MANTA RAY",
    "CLOTHES OF MENDING",
    "CLOCKWORK AMULET",
    "CRYSTAL BALL",
    "CRYSTAL BALL OF MIND READING",
    "CRYSTAL BALL OF TELEPATHY",
    "CRYSTAL BALL OF TRUE SEEING",
  ]) {
    assert.equal(find(name)?.verificationStatus, "verified", name);
  }
});

test("DMG pages 247 to 256 populate the verified magic item entries", () => {
  const find = (name) => catalog.items.find((item) => item.officialName === name);
  for (const name of [
    "CUBE OF SUMMONING",
    "CUBIC GATE",
    "DAERN'S INSTANT FORTRESS",
    "DAGGER OF VENOM",
    "DANCING SWORD",
    "DARK SHARD AMULET",
    "DECANTER OF ENDLESS WATER",
    "DECK OF ILLUSIONS",
    "DECK OF MANY THINGS",
    "DEFENDER",
    "DEMONOMICON OF IGGWILY",
    "DIMENSIONAL SHACKLES",
    "DRAGON SCALE MAIL",
    "DRAGON SLAYER",
    "DREAD HELM",
    "DRIFTGLOBE",
    "DUST OF DISAPPEARANCE",
    "DUST OF SNEEZING AND CHOKING",
    "DWARVEN PLATE",
    "DWARVEN THROWER",
    "EAR HORN OF HEARING",
    "EFREETI BOTTLE",
  ]) {
    assert.equal(find(name)?.verificationStatus, "verified", name);
  }
  assert.equal(find("DUST OF DRYNESS")?.verificationStatus, "verified");
  assert.deepEqual(find("CUBE OF SUMMONING")?.tables[0]?.columns, ["1d6", "Spell"]);
  assert.equal(find("CUBE OF SUMMONING")?.tables[0]?.rows.length, 6);
  assert.deepEqual(find("DECK OF ILLUSIONS")?.tables[0]?.columns, ["1d100", "Illusion"]);
  assert.equal(find("DECK OF ILLUSIONS")?.tables[0]?.rows.length, 33);
  assert.deepEqual(find("DECK OF MANY THINGS")?.tables[0]?.columns, ["1d100 (13-Card Deck)", "1d100 (22-Card Deck)", "Card"]);
  assert.equal(find("DECK OF MANY THINGS")?.tables[0]?.rows.length, 22);
  assert.deepEqual(find("DEMONOMICON OF IGGWILY")?.tables[0]?.columns, ["Spell", "Charge Cost"]);
  assert.equal(find("DEMONOMICON OF IGGWILY")?.tables[0]?.rows.length, 7);
  assert.deepEqual(find("DRAGON SCALE MAIL")?.tables[0]?.columns, ["Dragon", "Resistance"]);
  assert.equal(find("DRAGON SCALE MAIL")?.tables[0]?.rows.length, 10);
  assert.deepEqual(find("EFREETI BOTTLE")?.tables[0]?.columns, ["1d10", "Effect"]);
  assert.equal(find("EFREETI BOTTLE")?.tables[0]?.rows.length, 3);
  assert.doesNotMatch(find("CUBE OF SUMMONING")?.description || "", /Cusk|Cusic|CUBE OF SUMMONING 1d6/i);
});

test("provided excerpts complete the verified magic items from pages 255 to 259", () => {
  const find = (name) => catalog.items.find((item) => item.officialName === name);
  for (const name of ["DUST OF DRYNESS", "ELIXIR OF HEALTH", "ENERGY BOW", "EYE AND HAND OF VECNA"]) {
    assert.equal(find(name)?.verificationStatus, "verified", name);
  }
  assert.equal(find("ENERGY BOW")?.attunement.required, true);
  assert.deepEqual(find("EYE AND HAND OF VECNA")?.tables.map((table) => table.columns), [
    ["Spell", "Charge Cost"],
    ["Spell", "Charge Cost"],
  ]);
  assert.equal(find("EYE AND HAND OF VECNA")?.tables[0]?.rows.length, 5);
  assert.equal(find("EYE AND HAND OF VECNA")?.tables[1]?.rows.length, 4);
});

test("DMG pages 257 to 266 populate the verified magic item entries", () => {
  const find = (name) => catalog.items.find((item) => item.officialName === name);
  for (const name of [
    "EFREETI CHAIN",
    "ELEMENTAL GEM",
    "ELVEN CHAIN",
    "ENDURING SPELLBOOK",
    "ELIXIR OF HEALTH",
    "ENERGY BOW",
    "ENSPELLED ARMOR",
    "ENSPELLED STAFF",
    "ENSPELLED WEAPON",
    "ERSATZ EYE",
    "EVERSMOKING BOTTLE",
    "EXECUTIONER'S AXE",
    "EYE AND HAND OF VECNA",
    "EYES OF CHARMING",
    "EYES OF MINUTE SEEING",
    "EYES OF THE EAGLE",
    "FIGURINE OF WONDROUS POWER",
    "FLAME TONGUE",
    "FOLDING BOAT",
    "FROST BRAND",
    "GAUNTLETS OF OGRE POWER",
    "GEM OF BRIGHTNESS",
    "GEM OF SEEING",
    "GIANT SLAYER",
    "GLAMOURED STUDDED LEATHER",
    "GLOVES OF MISSILE SNARING",
    "GLOVES OF SWIMMING AND CLIMBING",
    "GLOVES OF THIEVERY",
    "GOGGLES OF NIGHT",
    "HAG EYE",
    "HAMMER OF THUNDERBOLTS",
    "HAT OF DISGUISE",
    "HAT OF MANY SPELLS",
  ]) {
    assert.equal(find(name)?.verificationStatus, "verified", name);
  }
  assert.equal(find("SLIVER OF LIGHT RESEMBLING A GIANT'S FINGERNAIL"), undefined);
  assert.deepEqual(find("ELEMENTAL GEM")?.tables[0]?.columns, ["Gem", "Summoned Elemental"]);
  assert.equal(find("ELEMENTAL GEM")?.tables[0]?.rows.length, 4);
  assert.equal(find("ENSPELLED ARMOR")?.tables[0]?.rows.length, 9);
  assert.equal(find("ENSPELLED STAFF")?.tables[0]?.rows.length, 9);
  assert.equal(find("ENSPELLED WEAPON")?.tables[0]?.rows.length, 9);
  assert.equal(find("HAT OF MANY SPELLS")?.tables[0]?.rows.length, 11);
});

test("DMG pages 267 to 276 populate the verified magic item entries", () => {
  const find = (name) => catalog.items.find((item) => item.officialName === name);
  for (const name of [
    "HAT OF VERMIN",
    "HAT OF WIZARDRY",
    "HEADBAND OF INTELLECT",
    "HELM OF BRILLIANCE",
    "HELM OF COMPREHENDING LANGUAGES",
    "HELM OF TELEPATHY",
    "HELM OF TELEPORTATION",
    "HOLY AVENGER",
    "HORN OF BLASTING",
    "HORN OF SILENT ALARM",
    "HORN OF VALHALLA",
    "HORSESHOES OF A ZEPHYR",
    "HORSESHOES OF SPEED",
    "IMMOVABLE ROD",
    "INSTRUMENT OF ILLUSIONS",
    "INSTRUMENT OF SCRIBING",
    "IOUN STONE",
    "IRON BANDS OF BILARRO",
    "IRON FLASK",
    "JAVELIN OF LIGHTNING",
    "KEOGHTOM'S OINTMENT",
    "LANTERN OF REVEALING",
    "LOCK OF TRICKERY",
    "LUCK BLADE",
    "LUTE OF THUNDEROUS THUMPING",
    "MACE OF DISRUPTION",
    "MACE OF SMITING",
    "MACE OF TERROR",
    "MANTLE OF SPELL RESISTANCE",
  ]) {
    assert.equal(find(name)?.verificationStatus, "verified", name);
  }
  assert.equal(find("HAT OF MANY SPELLS")?.verificationStatus, "verified");
  assert.deepEqual(find("HORN OF VALHALLA")?.tables[0]?.columns, ["1d100", "Horn Type", "Spirits", "Requirement"]);
  assert.equal(find("HORN OF VALHALLA")?.tables[0]?.rows.length, 4);
  assert.equal(find("HELM OF BRILLIANCE")?.spells.length, 4);
  assert.deepEqual(find("IOUN STONE")?.tables[0]?.columns, ["Type", "Rarity", "Effect"]);
  assert.equal(find("IOUN STONE")?.tables[0]?.rows.length, 14);
  assert.deepEqual(find("IRON FLASK")?.tables[0]?.columns, ["1d100", "Contents"]);
  assert.equal(find("IRON FLASK")?.tables[0]?.rows.length, 30);
  assert.doesNotMatch(find("LOCK OF TRICKERY")?.description || "", /Luck Blade/i);
  assert.doesNotMatch(find("MACE OF SMITING")?.description || "", /CHAPTER 7|Mace of Terror/i);
});

test("DMG pages 277 to 286 populate the verified magic item entries", () => {
  const find = (name) => catalog.items.find((item) => item.officialName === name);
  for (const name of [
    "MANUAL OF BODILY HEALTH",
    "MANUAL OF GAINFUL EXERCISE",
    "MANUAL OF GOLEMS",
    "MANUAL OF QUICKNESS OF ACTION",
    "MARINER'S ARMOR",
    "MEDALLION OF THOUGHTS",
    "MIRROR OF LIFE TRAPPING",
    "MITHRAL ARMOR",
    "MOON-TOUCHED SWORD",
    "MOONBLADE",
    "MYSTERY KEY",
    "NATURE'S MANTLE",
    "NECKLACE OF ADAPTATION",
    "NECKLACE OF FIREBALLS",
    "NECKLACE OF PRAYER BEADS",
    "NINE LIVES STEALER",
    "NOLZUR'S MARVELOUS PIGMENTS",
    "OATHBOW",
    "OIL OF ETHEREALNESS",
    "OIL OF SHARPNESS",
    "OIL OF SLIPPERINESS",
    "ORB OF DIRECTION",
    "ORB OF DRAGONKIND",
    "ORB OF TIME",
    "PEARL OF POWER",
    "PERFUME OF BEWITCHING",
    "PERIAPT OF HEALTH",
    "PERIAPT OF PROOF AGAINST POISON",
    "PERIAPT OF WOUND CLOSURE",
    "PHILTER OF LOVE",
    "PIPE OF SMOKE MONSTERS",
    "PIPES OF HAUNTING",
    "PIPES OF THE SEWERS",
    "PLATE ARMOR OF ETHEREALNESS",
    "POLE OF ANGLING",
    "POLE OF COLLAPSING",
    "PORTABLE HOLE",
  ]) {
    assert.equal(find(name)?.verificationStatus, "verified", name);
  }
  assert.deepEqual(find("MANUAL OF GOLEMS")?.tables[0]?.columns, ["1d20", "Golem", "Time", "Cost"]);
  assert.equal(find("MANUAL OF GOLEMS")?.tables[0]?.rows.length, 4);
  assert.deepEqual(find("MOONBLADE")?.tables[0]?.columns, ["1d100", "Property"]);
  assert.equal(find("MOONBLADE")?.tables[0]?.rows.length, 7);
  assert.deepEqual(find("NECKLACE OF PRAYER BEADS")?.tables[0]?.columns, ["1d20", "Bead", "Spell"]);
  assert.equal(find("NECKLACE OF PRAYER BEADS")?.tables[0]?.rows.length, 6);
  assert.deepEqual(find("ORB OF DRAGONKIND")?.tables[0]?.columns, ["Spell", "Charge Cost"]);
  assert.equal(find("ORB OF DRAGONKIND")?.tables[0]?.rows.length, 5);
  assert.equal(find("OATHBOW")?.attunement.required, true);
  assert.equal(find("PLATE ARMOR OF ETHEREALNESS")?.attunement.required, true);
  assert.doesNotMatch(find("PIPE OF SMOKE MONSTERS")?.description || "", /Pipes of Haunting|CHAPTER 7/i);
  assert.doesNotMatch(find("POLE OF COLLAPSING")?.description || "", /PORTABLE HOLE/i);
});

test("DMG pages 287 to 296 populate the verified magic item entries", () => {
  const find = (name) => catalog.items.find((item) => item.officialName === name);
  for (const name of [
    "POT OF AWAKENING",
    "POTION OF ANIMAL FRIENDSHIP",
    "POTION OF CLAIRVOYANCE",
    "POTION OF CLIMBING",
    "POTION OF COMPREHENSION",
    "POTION OF DIMINUTION",
    "POTION OF FIRE BREATH",
    "POTION OF FLYING",
    "POTION OF GASEOUS FORM",
    "POTION OF GIANT STRENGTH",
    "POTION OF GREATER INVISIBILITY",
    "POTION OF GROWTH",
    "POTION OF HEROISM",
    "POTION OF INVISIBILITY",
    "POTION OF INVULNERABILITY",
    "POTION OF LONGEVITY",
    "POTION OF MIND READING",
    "POTION OF POISON",
    "POTION OF PUGILISM",
    "POTION OF RESISTANCE",
    "POTION OF SPEED",
    "POTION OF VITALITY",
    "POTION OF WATER BREATHING",
    "PROSTHETIC LIMB",
    "QUAAL'S FEATHER TOKEN",
    "QUARTERSTAFF OF THE ACROBAT",
    "QUIVER OF EHLONNA",
    "RING OF ANIMAL INFLUENCE",
    "RING OF DJINNI SUMMONING",
    "RING OF ELEMENTAL COMMAND",
    "RING OF EVASION",
    "RING OF FEATHER FALLING",
    "RING OF FREE ACTION",
    "RING OF INVISIBILITY",
    "RING OF JUMPING",
    "RING OF MIND SHIELDING",
    "RING OF PROTECTION",
    "RING OF REGENERATION",
    "RING OF RESISTANCE",
    "RING OF SHOOTING STARS",
    "RING OF SPELL STORING",
    "RING OF SPELL TURNING",
    "RING OF SWIMMING",
    "RING OF TELEKINESIS",
    "RING OF THE RAM",
    "RING OF THREE WISHES",
    "RING OF WARMTH",
    "RING OF WATER WALKING",
    "RING OF X-RAY VISION",
    "RIVAL COIN",
  ]) {
    assert.equal(find(name)?.verificationStatus, "verified", name);
  }
  assert.deepEqual(find("POTION OF RESISTANCE")?.tables[0]?.columns, ["1d10", "Damage Type"]);
  assert.equal(find("POTION OF RESISTANCE")?.tables[0]?.rows.length, 10);
  assert.deepEqual(find("QUAAL'S FEATHER TOKEN")?.tables[0]?.columns, ["1d100", "Token", "Rarity"]);
  assert.equal(find("QUAAL'S FEATHER TOKEN")?.tables[0]?.rows.length, 6);
  assert.deepEqual(find("RING OF RESISTANCE")?.tables[0]?.columns, ["1d10", "Damage Type", "Gemstone"]);
  assert.equal(find("RING OF RESISTANCE")?.tables[0]?.rows.length, 10);
  assert.deepEqual(find("RING OF ELEMENTAL COMMAND")?.tables[0]?.columns, ["Plane", "Spells (Charges)"]);
  assert.equal(find("RING OF ELEMENTAL COMMAND")?.tables[0]?.rows.length, 4);
  assert.equal(find("PORTABLE HOLE")?.description.includes("close a Portable Hole"), true);
});

test("DMG pages 297 to 306 populate the verified magic item entries", () => {
  const find = (name) => catalog.items.find((item) => item.officialName === name);
  for (const name of [
    "ROBE OF EYES",
    "ROBE OF SCINTILLATING COLORS",
    "ROBE OF STARS",
    "ROBE OF THE ARCHMAGI",
    "ROBE OF USEFUL ITEMS",
    "ROD OF ABSORPTION",
    "ROD OF ALERTNESS",
    "ROD OF LORDLY MIGHT",
    "ROD OF RESURRECTION",
    "ROD OF RULERSHIP",
    "ROD OF SECURITY",
    "ROD OF THE PACT KEEPER",
    "ROPE OF CLIMBING",
    "ROPE OF ENTANGLEMENT",
    "ROPE OF MENDING",
    "RUBY OF THE WAR MAGE",
    "SADDLE OF THE CAVALIER",
    "SCARAB OF PROTECTION",
    "SCIMITAR OF SPEED",
    "SCROLL OF PROTECTION",
    "SCROLL OF TITAN SUMMONING",
    "SENDING STONES",
    "SENTINEL SHIELD",
    "SHIELD OF EXPRESSION",
    "SHIELD OF MISSILE ATTRACTION",
    "SHIELD OF THE CAVALIER",
    "SHIELD, +1, +2, OR +3",
    "SILVERED WEAPON",
    "SLIPPERS OF SPIDER CLIMBING",
    "SMOLDERING ARMOR",
    "SOVEREIGN GLUE",
    "SPELLGUARD SHIELD",
    "SPELL SCROLL",
    "SPHERE OF ANNIHILATION",
    "SPIRIT BOARD",
  ]) {
    assert.equal(find(name)?.verificationStatus, "verified", name);
  }
  assert.deepEqual(find("ROBE OF USEFUL ITEMS")?.tables[0]?.columns, ["1d100", "Patch"]);
  assert.equal(find("ROBE OF USEFUL ITEMS")?.tables[0]?.rows.length, 13);
  assert.deepEqual(find("SCROLL OF PROTECTION")?.tables[0]?.columns, ["1d100", "Creature Type"]);
  assert.equal(find("SCROLL OF PROTECTION")?.tables[0]?.rows.length, 14);
  assert.deepEqual(find("SPELL SCROLL")?.tables[0]?.columns, ["Spell Level", "Rarity", "Save DC", "Attack Bonus"]);
  assert.equal(find("SPELL SCROLL")?.tables[0]?.rows.length, 10);
  assert.deepEqual(find("SPHERE OF ANNIHILATION")?.tables[0]?.columns, ["1d100", "Result"]);
  assert.equal(find("SPIRIT BOARD")?.tables[0]?.rows.length, 2);
});

test("DMG pages 307 to 316 populate the verified magic item entries", () => {
  const find = (name) => catalog.items.find((item) => item.officialName === name);
  for (const name of [
    "STAFF OF ADORNMENT",
    "STAFF OF BIRDCALLS",
    "STAFF OF CHARMING",
    "STAFF OF FIRE",
    "STAFF OF FLOWERS",
    "STAFF OF FROST",
    "STAFF OF HEALING",
    "STAFF OF POWER",
    "STAFF OF STRIKING",
    "STAFF OF SWARMING INSECTS",
    "STAFF OF THE ADDER",
    "STAFF OF THE MAGI",
    "STAFF OF THE PYTHON",
    "STAFF OF THE WOODLANDS",
    "STAFF OF THUNDER AND LIGHTNING",
    "STAFF OF WITHERING",
    "STONE OF CONTROLLING EARTH ELEMENTALS",
    "STONE OF GOOD LUCK (LUCKSTONE)",
    "SUN BLADE",
    "SWORD OF ANSWERING",
    "SWORD OF KAS",
    "SWORD OF LIFE STEALING",
    "SWORD OF SHARPNESS",
    "SWORD OF VENGEANCE",
    "SWORD OF WOUNDING",
    "TALISMAN OF PURE GOOD",
    "TALISMAN OF THE SPHERE",
    "TALISMAN OF ULTIMATE EVIL",
    "TALKING DOLL",
    "TANKARD OF SOBRIETY",
    "TENTACLE ROD",
    "THUNDEROUS GREATCLUB",
  ]) {
    assert.equal(find(name)?.verificationStatus, "verified", name);
  }
  assert.equal(find("STAFF OF THE MAGI")?.tables[0]?.rows.length, 19);
  assert.equal(find("STAFF OF THE WOODLANDS")?.tables[0]?.rows.length, 8);
  assert.equal(find("STAFF OF FIRE")?.tables[0]?.rows.length, 3);
  assert.equal(find("STAFF OF ADORNMENT")?.description.includes("up to three such objects"), true);
});

test("DMG pages 317 to 325 populate the verified magic item entries", () => {
  const find = (name) => catalog.items.find((item) => item.officialName === name);
  for (const name of [
    "TOME OF CLEAR THOUGHT",
    "TOME OF LEADERSHIP AND INFLUENCE",
    "TOME OF THE STILLED TONGUE",
    "TOME OF UNDERSTANDING",
    "TRIDENT OF FISH COMMAND",
    "UNIVERSAL SOLVENT",
    "VETERAN'S CANE",
    "VICIOUS WEAPON",
    "VORPAL SWORD",
    "WALLOPING AMMUNITION",
    "WAND OF BINDING",
    "WAND OF CONDUCTING",
    "WAND OF ENEMY DETECTION",
    "WAND OF FEAR",
    "WAND OF FIREBALLS",
    "WAND OF LIGHTNING BOLTS",
    "WAND OF MAGIC DETECTION",
    "WAND OF MAGIC MISSILES",
    "WAND OF ORCUS",
    "WAND OF PARALYSIS",
    "WAND OF POLYMORPH",
    "WAND OF PYROTECHNICS",
    "WAND OF SECRETS",
    "WAND OF THE WAR MAGE, +1, +2, OR +3",
    "WAND OF WEB",
    "WAND OF WONDER",
    "WAVE",
    "WEAPON OF WARNING",
    "WEAPON, +1, +2, OR +3",
    "WELL OF MANY WORLDS",
    "WHELM",
    "WIND FAN",
    "WINGED BOOTS",
    "WINGS OF FLYING",
    "WRAPS OF UNARMED POWER",
  ]) {
    assert.equal(find(name)?.verificationStatus, "verified", name);
  }
  assert.equal(find("PULSES AND POINTS AT THE ONE NEAREST TO YOU"), undefined);
  assert.equal(find("WAND OF BINDING")?.tables[0]?.rows.length, 2);
  assert.equal(find("WAND OF ORCUS")?.tables[0]?.rows.length, 6);
  assert.deepEqual(find("WAND OF WONDER")?.tables[0]?.columns, ["1d100", "Effect"]);
  assert.equal(find("WAND OF WONDER")?.tables[0]?.rows.length, 18);
  assert.equal(find("WINGED BOOTS")?.charges?.max, 4);
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
  assert.match(script, /raw-transcription/);
  assert.match(script, /DndProgressiveList/);
  assert.match(script, /<table/);
  assert.match(script, /setFiltersOpen/);
});
