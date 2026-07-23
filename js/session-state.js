(function () {
    "use strict";

    function clamp(value, minimum, maximum) {
        return Math.max(minimum, Math.min(maximum, Number(value) || 0));
    }

    function createSlots() {
        return Array.from({ length: 9 }, function (_, index) {
            return { level: index + 1, current: 0, max: 0 };
        });
    }

    function createScope() {
        return {
            resources: [],
            slots: createSlots(),
            knownSpells: [],
            preparedSpells: [],
            shortcuts: [],
            notes: "",
            history: [],
        };
    }

    function normalizeScope(value) {
        var scope = value && typeof value === "object" ? value : {};
        var slots = createSlots();
        if (Array.isArray(scope.slots)) {
            scope.slots.forEach(function (slot) {
                var level = clamp(slot?.level, 1, 9);
                var maximum = clamp(slot?.max, 0, 99);
                slots[level - 1] = { level: level, current: clamp(slot?.current, 0, maximum), max: maximum };
            });
        }
        return {
            resources: Array.isArray(scope.resources) ? scope.resources.filter(function (resource) {
                return resource && typeof resource.id === "string" && typeof resource.label === "string";
            }).map(function (resource) {
                var maximum = clamp(resource.max, 0, 999);
                return {
                    id: resource.id,
                    label: resource.label.slice(0, 80),
                    current: clamp(resource.current, 0, maximum),
                    max: maximum,
                    reset: ["short-rest", "long-rest", "manual"].includes(resource.reset) ? resource.reset : "manual",
                };
            }) : [],
            slots: slots,
            knownSpells: Array.isArray(scope.knownSpells) ? scope.knownSpells.filter(function (spell) {
                return spell && typeof spell.slug === "string" && typeof spell.name === "string";
            }) : [],
            preparedSpells: Array.isArray(scope.preparedSpells) ? scope.preparedSpells.filter(function (spell) {
                return spell && typeof spell.slug === "string" && typeof spell.name === "string";
            }) : [],
            shortcuts: Array.isArray(scope.shortcuts) ? scope.shortcuts.filter(function (shortcut) {
                return shortcut && typeof shortcut.id === "string" && typeof shortcut.label === "string";
            }) : [],
            notes: typeof scope.notes === "string" ? scope.notes.slice(0, 20000) : "",
            history: Array.isArray(scope.history) ? scope.history.filter(function (entry) {
                return entry && typeof entry.label === "string";
            }).slice(0, 50) : [],
        };
    }

    function normalizeState(value) {
        var state = value && typeof value === "object" && value.schemaVersion === 1 ? value : {};
        var scopes = {};
        if (state.scopes && typeof state.scopes === "object") {
            Object.keys(state.scopes).forEach(function (key) { scopes[key] = normalizeScope(state.scopes[key]); });
        }
        if (!scopes.global) scopes.global = createScope();
        return {
            schemaVersion: 1,
            mode: state.mode === "read" ? "read" : "edit",
            scopes: scopes,
        };
    }

    function recordHistory(scope, label, timestamp) {
        var normalized = normalizeScope(scope);
        normalized.history.unshift({ label: String(label), at: timestamp || new Date().toISOString() });
        normalized.history = normalized.history.slice(0, 50);
        return normalized;
    }

    function applyRest(scope, type, timestamp) {
        var normalized = normalizeScope(scope);
        var changes = [];
        normalized.resources.forEach(function (resource) {
            var restores = resource.reset === type || (type === "long-rest" && resource.reset === "short-rest");
            if (restores && resource.current !== resource.max) {
                changes.push(resource.label + " : " + resource.current + " → " + resource.max);
                resource.current = resource.max;
            }
        });
        if (type === "long-rest") {
            normalized.slots.forEach(function (slot) {
                if (slot.current !== slot.max) {
                    changes.push("Emplacements niveau " + slot.level + " : " + slot.current + " → " + slot.max);
                    slot.current = slot.max;
                }
            });
        }
        if (changes.length) normalized = recordHistory(normalized, type === "long-rest" ? "Repos long" : "Repos court", timestamp);
        return { scope: normalized, changes: changes };
    }

    window.DndSessionState = Object.freeze({
        schemaVersion: 1,
        createScope: createScope,
        normalizeScope: normalizeScope,
        normalizeState: normalizeState,
        recordHistory: recordHistory,
        applyRest: applyRest,
        clamp: clamp,
    });
})();
