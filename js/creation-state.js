(function () {
    "use strict";
    var abilityKeys = ["str", "dex", "con", "int", "wis", "cha"];
    var abilityNames = ["Force", "Dextérité", "Constitution", "Intelligence", "Sagesse", "Charisme"];

    function createDraft() {
        return {
            schemaVersion: 1, step: 0, expert: false, concept: "", name: "", level: 1,
            classId: "", speciesId: "", backgroundId: "", alignment: "", languages: ["Commun"],
            abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
            skills: [], equipment: "", spells: [], notes: "",
        };
    }

    function normalizeDraft(value) {
        var draft = Object.assign(createDraft(), value && value.schemaVersion === 1 ? value : {});
        draft.level = Math.max(1, Math.min(20, Number(draft.level) || 1));
        draft.step = Math.max(0, Math.min(10, Number(draft.step) || 0));
        abilityKeys.forEach(function (key) {
            draft.abilities[key] = Math.max(3, Math.min(20, Number(draft.abilities?.[key]) || 10));
        });
        draft.skills = Array.isArray(draft.skills) ? draft.skills.map(String) : [];
        draft.spells = Array.isArray(draft.spells) ? draft.spells.map(String) : [];
        draft.languages = Array.isArray(draft.languages) ? draft.languages.map(String) : ["Commun"];
        return draft;
    }

    function modifier(score) {
        return Math.floor((Number(score) - 10) / 2);
    }

    function signed(value) {
        return value >= 0 ? "+" + value : String(value);
    }

    function proficiency(level) {
        return 2 + Math.floor((Math.max(1, Number(level)) - 1) / 4);
    }

    function derived(draft, model) {
        var normalized = normalizeDraft(draft);
        var characterClass = model.classes.find(function (entry) { return entry.id === normalized.classId; });
        var conModifier = modifier(normalized.abilities.con);
        return {
            proficiency: proficiency(normalized.level),
            hp: characterClass ? characterClass.hitDie + conModifier + Math.max(0, normalized.level - 1) * (Math.floor(characterClass.hitDie / 2) + 1 + conModifier) : null,
            initiative: modifier(normalized.abilities.dex),
            className: characterClass?.name || "",
        };
    }

    function validateStep(draft, step) {
        var errors = [];
        if (step === 0 && !String(draft.name || draft.concept).trim()) errors.push("Indiquez un nom ou un concept.");
        if (step === 2 && !draft.classId) errors.push("Choisissez une classe.");
        if (step === 3 && !draft.speciesId) errors.push("Choisissez une espèce.");
        if (step === 4 && !draft.backgroundId) errors.push("Choisissez un historique.");
        if (step === 5) {
            var values = abilityKeys.map(function (key) { return Number(draft.abilities[key]); });
            if (values.some(function (value) { return value < 3 || value > 20; })) errors.push("Les caractéristiques doivent être comprises entre 3 et 20.");
        }
        return errors;
    }

    function sheetPayload(draft, model, spells) {
        var normalized = normalizeDraft(draft);
        var characterClass = model.classes.find(function (entry) { return entry.id === normalized.classId; });
        var species = model.species.find(function (entry) { return entry.id === normalized.speciesId; });
        var background = model.backgrounds.find(function (entry) { return entry.id === normalized.backgroundId; });
        var stats = derived(normalized, model);
        var data = {
            name: normalized.name || normalized.concept,
            character_class: characterClass?.name || "",
            class_level: characterClass ? characterClass.name + " " + normalized.level : "",
            Niveau: String(normalized.level),
            character_level: String(normalized.level),
            species: species?.name || "",
            background: background?.name || "",
            alignment: normalized.alignment,
            languages: normalized.languages.join(", "),
            gear: normalized.equipment,
            features: background ? "Don d’origine : " + background.feat : "",
            proficiency_bonus: "+" + stats.proficiency,
            hp_max: stats.hp === null ? "" : String(stats.hp),
            hp_current: stats.hp === null ? "" : String(stats.hp),
            initiative: signed(stats.initiative),
            speed: species?.speed || "",
            notes: normalized.notes,
        };
        abilityKeys.forEach(function (key, index) {
            data[key] = String(normalized.abilities[key]);
            data[key + "_mod"] = signed(modifier(normalized.abilities[key]));
            data[key + "_save_prof"] = Boolean(characterClass?.savingThrows.includes(abilityNames[index]));
        });
        normalized.skills.forEach(function (skill) {
            data["skill_" + skill.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_") + "_prof"] = true;
        });
        normalized.spells.slice(0, 65).forEach(function (slug, index) {
            var spell = spells.find(function (entry) { return entry.slug === slug; });
            if (!spell) return;
            var row = index + 1;
            data["spell_" + row + "_level"] = String(spell.level);
            data["spell_" + row + "_name"] = spell.name;
            data["spell_" + row + "_school"] = spell.school;
            data["spell_" + row + "_cast"] = spell.casting_time;
            data["spell_" + row + "_range"] = spell.range;
            data["spell_" + row + "_duration"] = spell.duration;
            data["spell_" + row + "_verbal"] = spell.components.includes("V");
            data["spell_" + row + "_somatic"] = spell.components.includes("S");
            data["spell_" + row + "_material"] = spell.components.includes("M");
        });
        return { version: "standalone_v2", updated_at: new Date().toISOString(), data: data };
    }

    window.DndCreationState = Object.freeze({
        abilityKeys: abilityKeys, abilityNames: abilityNames, createDraft: createDraft,
        normalizeDraft: normalizeDraft, modifier: modifier, proficiency: proficiency,
        derived: derived, validateStep: validateStep, sheetPayload: sheetPayload,
    });
})();
