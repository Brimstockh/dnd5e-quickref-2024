import assert from "node:assert/strict";
import test from "node:test";
import { bindKeyboardShortcuts, isEditable } from "../js/shell/keyboard-shortcuts.js";
import { createMobileNavigationController } from "../js/shell/mobile-navigation.js";
import { createPersonalTools } from "../js/shell/personal-tools.js";
import { createSharingController } from "../js/shell/sharing.js";
import { createSessionController } from "../js/shell/session-controls.js";
import { bindSearchTriggers } from "../js/shell/search-trigger.js";
import { createThemeController } from "../js/shell/theme.js";

test("theme controller applies preference, persistence and icon state", () => {
  const values = new Map();
  const storage = {
    get: (key, fallback) => values.has(key) ? values.get(key) : fallback,
    set: (key, value) => values.set(key, value),
  };
  const document = { documentElement: { dataset: {} } };
  const controller = createThemeController({
    document,
    storage,
    view: { matchMedia: () => ({ matches: true }) },
  });

  assert.equal(controller.applyInitial(), "light");
  assert.equal(document.documentElement.dataset.theme, "light");

  const button = { listeners: {}, addEventListener: (type, listener) => { button.listeners[type] = listener; } };
  const icons = [];
  controller.bind(button, (_button, icon) => icons.push(icon));
  button.listeners.click();
  assert.equal(document.documentElement.dataset.theme, "dark");
  assert.equal(values.get("dnd2024_theme"), "dark");
  assert.deepEqual(icons, ["theme-moon", "theme-sun"]);
});

test("keyboard shortcut binding preserves search, editable fields and focus traps", () => {
  const listeners = {};
  const pageSearch = {
    focused: false,
    selected: false,
    focus() { this.focused = true; },
    select() { this.selected = true; },
  };
  const document = {
    activeElement: { tagName: "BODY" },
    addEventListener: (type, listener) => { listeners[type] = listener; },
    querySelector: () => pageSearch,
  };
  const search = { opened: 0, open() { this.opened += 1; } };
  const sessionPanel = { panel: { classList: { contains: () => false } } };
  const drawer = { classList: { contains: () => false } };
  const closed = [];

  bindKeyboardShortcuts({
    document,
    search,
    sessionPanel,
    drawer,
    setSessionPanel: (open) => closed.push(["session", open]),
    setDrawer: (open) => closed.push(["drawer", open]),
  });

  assert.equal(isEditable({ tagName: "INPUT" }), true);
  assert.equal(isEditable({ tagName: "BODY" }), false);

  let prevented = false;
  listeners.keydown({ key: "k", ctrlKey: true, metaKey: false, preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(search.opened, 1);

  listeners.keydown({ key: "/", ctrlKey: false, metaKey: false, preventDefault: () => {} });
  assert.equal(pageSearch.focused, true);
  assert.equal(pageSearch.selected, true);

  document.activeElement = { tagName: "INPUT" };
  listeners.keydown({ key: "/", ctrlKey: false, metaKey: false, preventDefault: () => {} });
  assert.equal(search.opened, 1);
});

test("sharing controller preserves the public link contract", async () => {
  let copiedUrl = "";
  const status = {
    classList: { toggle() {}, add() {}, remove() {} },
    textContent: "",
  };
  const document = {
    body: { dataset: { libraryTitle: "Règles" } },
    title: "D&D 2024",
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  const view = {
    location: { href: "https://example.test/dnd/rules-2024.html", search: "" },
    navigator: { clipboard: { writeText: async (url) => { copiedUrl = url; } } },
    clearTimeout: () => {},
    setTimeout: () => 1,
  };
  const sharing = createSharingController({ document, view, status });

  assert.equal(sharing.currentShareTitle(), "Règles");
  assert.equal(await sharing.shareCurrentPage(), true);
  assert.equal(copiedUrl, view.location.href);
});

test("mobile navigation keeps its focus and session contracts", () => {
  function element() {
    return {
      attributes: new Map(),
      classList: { values: new Set(), toggle(name, enabled) { enabled ? this.values.add(name) : this.values.delete(name); }, contains(name) { return this.values.has(name); } },
      listeners: {},
      addEventListener(type, listener) { this.listeners[type] = listener; },
      setAttribute(name, value) { this.attributes.set(name, value); },
      removeAttribute(name) { this.attributes.delete(name); },
      focus() { this.focused = true; },
    };
  }
  const drawer = element();
  drawer.addEventListener = (type, listener) => { drawer.listeners[type] = listener; };
  const backdrop = element();
  const menuButton = element();
  const closeButton = element();
  const document = { body: element() };
  const sessionCalls = [];
  const navigation = createMobileNavigationController({
    document,
    drawer,
    backdrop,
    menuButton,
    closeButton,
    setSessionPanel: (open) => sessionCalls.push(open),
  });

  menuButton.listeners.click();
  assert.equal(drawer.classList.contains("is-open"), true);
  assert.equal(closeButton.focused, true);
  assert.deepEqual(sessionCalls, [false]);
  navigation.setOpen(false);
  assert.equal(menuButton.focused, true);
  assert.equal(drawer.classList.contains("is-open"), false);
});

test("session controller preserves the local mode contract", () => {
  const values = new Map([["dnd2024_session_mode", "true"]]);
  const document = { documentElement: { dataset: {} } };
  const controller = createSessionController({
    document,
    storage: {
      get: (key, fallback) => values.has(key) ? values.get(key) : fallback,
      set: (key, value) => values.set(key, value),
    },
    view: { addEventListener() {} },
    pageUrl: (path) => path,
    createIcon: () => ({}),
  });

  assert.equal(controller.applyInitial(), true);
  assert.equal(document.documentElement.dataset.session, "true");
  controller.setMode(false, true);
  assert.equal(values.get("dnd2024_session_mode"), "false");
  assert.equal(document.documentElement.dataset.session, "false");
});

test("personal tools keep profile and note state connected to their public APIs", () => {
  function element() {
    return {
      listeners: {},
      classList: { toggle() {} },
      addEventListener(type, listener) { this.listeners[type] = listener; },
      setAttribute() {},
      append() {},
      appendChild() {},
      replaceChildren() {},
      focus() {},
    };
  }
  const created = [];
  const document = {
    createElement() { const value = element(); created.push(value); return value; },
  };
  const view = {
    DndProfiles: {
      getAll: () => [{ id: "p1", name: "Lysandre" }],
      getActive: () => ({ id: "p1" }),
      setActive: () => {},
    },
    DndPersonal: { getNote: () => "À retenir", setNote: () => {} },
    addEventListener() {},
  };
  const profileSelect = element();
  const noteButton = element();
  const noteDialog = element();
  noteDialog.showModal = () => {};
  noteDialog.close = () => {};
  const noteTitle = element();
  const noteLabel = element();
  const noteField = element();
  const noteHelp = element();
  const noteClose = element();

  createPersonalTools({
    document,
    view,
    profileSelect,
    noteButton,
    noteDialog,
    noteTitle,
    noteLabel,
    noteField,
    noteHelp,
    noteClose,
    noteId: "rules.html",
  });

  assert.equal(profileSelect.hidden, false);
  assert.equal(created.length, 2);
  assert.equal(noteTitle.textContent, "Note personnelle");
  assert.equal(noteField.id, "personal-page-note");
});

test("search triggers close the session panel before opening search", () => {
  const listeners = {};
  const document = {
    querySelectorAll: () => [{ addEventListener: (type, listener) => { listeners.link = listener; } }],
  };
  const searchButton = { addEventListener: (type, listener) => { listeners.button = listener; } };
  const calls = [];
  const search = { open: () => calls.push("open") };

  const controller = bindSearchTriggers({
    document,
    search,
    searchButton,
    setSessionPanel: (open) => calls.push(["session", open]),
  });

  listeners.button();
  listeners.link();
  assert.deepEqual(calls, [["session", false], "open", "open"]);
  assert.equal(controller.open, search.open);
});
