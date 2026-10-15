(function () {
    "use strict";

    var storage = window.DndStorage;
    var sheetsKey = "dnd_character_sheets_v1";
    var personalKey = "dnd2024_personal_v1";
    var favoritesKey = "dnd2024_favorites_v1";
    var recentKey = "dnd2024_recent_v1";
    var legacyKeys = ["dnd_character_sheet_standalone_v2", "dnd_character_sheet_standalone_v1"];

    function record(value) { return value && typeof value === "object" && !Array.isArray(value); }
    function clone(value) {
        try { return JSON.parse(JSON.stringify(value)); } catch (error) { return null; }
    }
    function validPayload(value) {
        return record(value) && (!value.version || ["standalone_v1", "standalone_v2"].includes(String(value.version))) && record(value.data);
    }
    function emptyState() {
        return { schemaVersion: 1, sheetsByProfileId: {}, standalone: null, unassigned: null, updatedAt: null };
    }
    function normalizeState(value) {
        var state = emptyState();
        if (!record(value) || Number(value.schemaVersion) !== 1) return state;
        Object.assign(state, value, {
            schemaVersion: 1,
            sheetsByProfileId: {},
            standalone: validPayload(value.standalone) ? clone(value.standalone) : null,
            unassigned: record(value.unassigned) && validPayload(value.unassigned.payload)
                ? Object.assign({}, clone(value.unassigned), { payload: clone(value.unassigned.payload) }) : null,
            updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
        });
        if (record(value.sheetsByProfileId)) Object.keys(value.sheetsByProfileId).forEach(function (id) {
            if (id && validPayload(value.sheetsByProfileId[id])) state.sheetsByProfileId[id] = clone(value.sheetsByProfileId[id]);
        });
        return state;
    }
    function legacyBackup(key, payload) {
        var version = String(payload.version || "standalone_v2").endsWith("_v1") ? "1" : "2";
        if (storage.get(key + "_backup_v" + version, null) === null) storage.setJson(key + "_backup_v" + version, payload);
    }
    function readState() {
        if (storage.get(sheetsKey, null) !== null) return normalizeState(storage.getJson(sheetsKey, null));
        var legacy = null;
        var sourceKey = null;
        legacyKeys.forEach(function (key) {
            var payload = storage.getJson(key, null);
            if (!validPayload(payload)) return;
            legacyBackup(key, payload);
            if (!legacy) { legacy = clone(payload); sourceKey = key; }
        });
        var state = emptyState();
        if (!legacy) return state;
        var profiles = window.DndPersonal.getState().profiles;
        state.standalone = clone(legacy);
        if (profiles.length === 1) state.sheetsByProfileId[profiles[0].id] = clone(legacy);
        if (profiles.length > 1) state.unassigned = {
            payload: clone(legacy), sourceKey: sourceKey, reason: "Plusieurs profils existaient pendant la migration.",
        };
        state.updatedAt = new Date().toISOString();
        storage.setJson(sheetsKey, state);
        return state;
    }
    function getForProfile(id) {
        var state = readState();
        return state.sheetsByProfileId[String(id || "")] ? clone(state.sheetsByProfileId[String(id)]) : null;
    }
    function getStandalone() {
        var state = readState();
        return state.standalone ? clone(state.standalone) : null;
    }
    function getUnassigned() {
        var state = readState();
        return state.unassigned ? clone(state.unassigned) : null;
    }
    function save(id, payload, options) {
        if (!validPayload(payload)) return { ok: false, persistent: storage.isPersistent(), reason: "invalid" };
        var state = readState();
        var key = String(id || "");
        var current = key ? state.sheetsByProfileId[key] : state.standalone;
        var config = options && typeof options === "object" ? options : {};
        var currentAt = current && (current.updated_at || current.updatedAt) || null;
        if (Object.prototype.hasOwnProperty.call(config, "expectedUpdatedAt") && current && currentAt !== config.expectedUpdatedAt) {
            return { ok: false, persistent: storage.isPersistent(), reason: "conflict" };
        }
        if (key) state.sheetsByProfileId[key] = clone(payload); else state.standalone = clone(payload);
        state.updatedAt = new Date().toISOString();
        var persisted = storage.setJson(sheetsKey, state);
        return { ok: true, persistent: Boolean(persisted && storage.isPersistent()) };
    }
    function remove(id) {
        var state = readState();
        var key = String(id || "");
        if (key) delete state.sheetsByProfileId[key]; else state.standalone = null;
        state.updatedAt = new Date().toISOString();
        var persisted = storage.setJson(sheetsKey, state);
        return { ok: true, persistent: Boolean(persisted && storage.isPersistent()) };
    }
    function claim(id) {
        var state = readState();
        var key = String(id || "");
        if (!key || !state.unassigned || !validPayload(state.unassigned.payload)) return { ok: false, reason: "missing" };
        if (state.sheetsByProfileId[key]) return { ok: false, reason: "occupied" };
        state.sheetsByProfileId[key] = clone(state.unassigned.payload);
        state.unassigned = null;
        state.updatedAt = new Date().toISOString();
        var persisted = storage.setJson(sheetsKey, state);
        return { ok: true, persistent: Boolean(persisted && storage.isPersistent()) };
    }
    function profileState(value) {
        if (!record(value) || ![1, 2].includes(Number(value.schemaVersion))) return false;
        var ids = Object.create(null);
        if (value.profiles !== undefined && (!Array.isArray(value.profiles) || value.profiles.some(function (item) {
            if (!record(item) || typeof item.id !== "string" || typeof item.name !== "string" || ids[item.id]) return true;
            ids[item.id] = true;
            return false;
        }))) return false;
        if (value.activeProfileId !== undefined && value.activeProfileId !== null
            && (typeof value.activeProfileId !== "string" || !ids[value.activeProfileId])) return false;
        if (value.lists !== undefined && (!Array.isArray(value.lists) || value.lists.some(function (item) {
            return !record(item) || typeof item.id !== "string" || typeof item.name !== "string" || !Array.isArray(item.items);
        }))) return false;
        return value.notes === undefined || record(value.notes);
    }
    function sheetsState(value, personal) {
        if (!record(value) || Number(value.schemaVersion) !== 1 || !record(value.sheetsByProfileId)) return false;
        var ids = Object.create(null);
        personal.profiles.forEach(function (profile) { ids[profile.id] = true; });
        return Object.keys(value.sheetsByProfileId).every(function (id) { return ids[id] && validPayload(value.sheetsByProfileId[id]); })
            && (value.standalone === null || validPayload(value.standalone))
            && (value.unassigned === null || (record(value.unassigned) && validPayload(value.unassigned.payload)));
    }
    function prepareBackup(value) {
        if (!record(value) || value.format !== "dnd-companion-backup") return { ok: false, error: "Format de sauvegarde non reconnu." };
        var version = Number(value.version);
        if (![1, 2, 3].includes(version)) return { ok: false, error: "Version de sauvegarde non prise en charge." };
        if (!profileState(value.personal) || !Array.isArray(value.favorites)) return { ok: false, error: "Structure de sauvegarde invalide." };
        var personal = normalizePersonal(value.personal);
        var hasSheets = version >= 3 && Object.prototype.hasOwnProperty.call(value, "characterSheets");
        var sheets = hasSheets ? normalizeState(value.characterSheets) : null;
        if (hasSheets && !sheetsState(sheets, personal)) return { ok: false, error: "Associations entre profils et fiches invalides." };
        if (!hasSheets && value.characterSheet !== undefined && value.characterSheet !== null && !validPayload(value.characterSheet)) {
            return { ok: false, error: "Fiche autonome invalide." };
        }
        var included = record(value.included) ? value.included : {};
        var includeCharacters = version >= 3 ? included.characterData !== false
            : Object.prototype.hasOwnProperty.call(value, "characterSheet") || Object.prototype.hasOwnProperty.call(value, "characterSession") || Object.prototype.hasOwnProperty.call(value, "creatorDraft");
        if (value.creatorDraft !== undefined && value.creatorDraft !== null && !record(value.creatorDraft)) return { ok: false, error: "Brouillon de création invalide." };
        if (value.characterSession !== undefined && value.characterSession !== null && !record(value.characterSession)) return { ok: false, error: "État de session invalide." };
        return { ok: true, data: {
            favorites: clone(value.favorites), recent: Array.isArray(value.recent) ? clone(value.recent) : [], personal: personal,
            sheets: hasSheets ? sheets : value.characterSheet ? Object.assign(emptyState(), { standalone: clone(value.characterSheet) }) : null,
            creatorDraft: includeCharacters && Object.prototype.hasOwnProperty.call(value, "creatorDraft") ? clone(value.creatorDraft) : undefined,
            characterSession: includeCharacters && Object.prototype.hasOwnProperty.call(value, "characterSession") ? clone(value.characterSession) : undefined,
            settings: record(value.settings) ? clone(value.settings) : {},
            characterDataIncluded: includeCharacters && (hasSheets || Object.prototype.hasOwnProperty.call(value, "characterSheet") || Object.prototype.hasOwnProperty.call(value, "creatorDraft") || Object.prototype.hasOwnProperty.call(value, "characterSession")),
        } };
    }
    function normalizePersonal(value) {
        var copy = clone(value) || {};
        if (Number(copy.schemaVersion) === 1) copy.schemaVersion = 2;
        return copy;
    }
    function createBackup(includeCharacters) {
        var include = includeCharacters !== false;
        var payload = {
            format: "dnd-companion-backup", version: 3, schemaVersion: 3, exportedAt: new Date().toISOString(),
            included: { favorites: true, recent: true, personal: true, settings: true, characterData: include },
            favorites: window.DndLibrary.getFavorites(), recent: window.DndLibrary.getRecent(), personal: window.DndPersonal.getState(),
            settings: { theme: storage.get("dnd2024_theme", null), sessionMode: storage.get("dnd2024_session_mode", null) },
        };
        if (include) {
            payload.characterSheets = clone(readState());
            payload.creatorDraft = storage.getJson("dnd_character_creator_draft_v1", null);
            payload.characterSession = storage.getJson("dnd_character_session_v1", null);
            payload.included.characterSheets = true; payload.included.creatorDraft = true; payload.included.characterSession = true;
        }
        return payload;
    }
    function replaceEntries(entries) {
        var previous = entries.map(function (entry) { return { key: entry.key, value: storage.get(entry.key, null) }; });
        var persistent = true;
        try {
            entries.forEach(function (entry) {
                var success = entry.remove ? storage.remove(entry.key) : storage.set(entry.key, entry.value);
                if (!success) persistent = false;
                if (storage.get(entry.key, null) !== (entry.remove ? null : String(entry.value))) throw new Error("Écriture locale vérifiable impossible");
            });
            return { ok: true, persistent: persistent && storage.isPersistent() };
        } catch (error) {
            previous.forEach(function (entry) {
                if (entry.value === null) storage.remove(entry.key); else storage.set(entry.key, entry.value);
            });
            return { ok: false, persistent: false, error: error };
        }
    }
    function applyBackup(value) {
        var prepared = prepareBackup(value);
        if (!prepared.ok) return prepared;
        var data = prepared.data;
        var entries = [
            { key: favoritesKey, value: JSON.stringify(data.favorites) },
            { key: recentKey, value: JSON.stringify(data.recent) },
            { key: personalKey, value: JSON.stringify(data.personal) },
        ];
        ["theme", "sessionMode"].forEach(function (name) {
            if (data.settings && Object.prototype.hasOwnProperty.call(data.settings, name)) entries.push(data.settings[name] === null
                ? { key: name === "theme" ? "dnd2024_theme" : "dnd2024_session_mode", remove: true }
                : { key: name === "theme" ? "dnd2024_theme" : "dnd2024_session_mode", value: String(data.settings[name]) });
        });
        if (data.characterDataIncluded) {
            if (data.sheets) entries.push({ key: sheetsKey, value: JSON.stringify(data.sheets) });
            ["creatorDraft", "characterSession"].forEach(function (name) {
                if (data[name] !== undefined) entries.push(data[name] === null
                    ? { key: name === "creatorDraft" ? "dnd_character_creator_draft_v1" : "dnd_character_session_v1", remove: true }
                    : { key: name === "creatorDraft" ? "dnd_character_creator_draft_v1" : "dnd_character_session_v1", value: JSON.stringify(data[name]) });
            });
        }
        var result = replaceEntries(entries);
        if (result.ok) {
            window.dispatchEvent(new CustomEvent("dndpersonalchange", { detail: data.personal }));
            window.dispatchEvent(new CustomEvent("dndlibrarychange"));
        }
        return Object.assign({}, result, { data: data });
    }

    window.DndSheets = Object.freeze({
        schemaVersion: 1, storageKey: sheetsKey, getState: function () { return clone(readState()); },
        get: getForProfile, getForProfile: getForProfile, getStandalone: getStandalone, getUnassigned: getUnassigned,
        set: save, setForProfile: save, setStandalone: function (payload, options) { return save(null, payload, options); },
        remove: remove, removeForProfile: remove, removeStandalone: function () { return remove(null); },
        claimUnassigned: claim, isValidPayload: validPayload,
    });
    window.DndBackup = Object.freeze({ version: 3, create: createBackup, validate: prepareBackup, apply: applyBackup });
})();
