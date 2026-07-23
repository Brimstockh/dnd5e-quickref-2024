const ENHANCED_ATTRIBUTE = "data-glossary-enhanced";
const RICHTEXT_SELECTOR = "[data-glossary-richtext]";
const SKIPPED_SELECTOR = "a, button, code, pre, h1, h2, h3, h4, h5, h6, input, select, textarea, [data-glossary-term]";
const MAX_TERMS_PER_SCOPE = 16;

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr");
}

export function glossaryTerms(entries) {
  return entries
    .flatMap((entry) => [entry.label, ...(entry.aliases || [])].map((label) => ({ entry, label })))
    .filter(({ label }) => label.trim().length >= 4)
    .sort((first, second) => second.label.length - first.label.length);
}

export function findGlossaryMatch(value, terms, ignoredIds = new Set()) {
  const normalizedValue = normalize(value);
  for (const term of terms) {
    if (ignoredIds.has(term.entry.id)) continue;
    const normalizedLabel = normalize(term.label);
    let index = normalizedValue.indexOf(normalizedLabel);
    while (index !== -1) {
      const before = normalizedValue[index - 1] || "";
      const after = normalizedValue[index + normalizedLabel.length] || "";
      if (!/[\p{L}\p{N}]/u.test(before) && !/[\p{L}\p{N}]/u.test(after)) {
        return { index, length: term.label.length, entry: term.entry };
      }
      index = normalizedValue.indexOf(normalizedLabel, index + 1);
    }
  }
  return null;
}

function createPopover(doc) {
  const panel = doc.createElement("section");
  panel.id = "glossary-definition-panel";
  panel.className = "glossary-popover";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.setAttribute("aria-labelledby", "glossary-popover-title");
  panel.setAttribute("aria-describedby", "glossary-popover-summary");
  panel.tabIndex = -1;
  panel.hidden = true;
  panel.innerHTML = `
    <header class="glossary-popover__header">
      <span class="glossary-popover__eyebrow">Glossaire</span>
      <button class="glossary-popover__close" type="button" aria-label="Fermer la définition">×</button>
    </header>
    <h2 id="glossary-popover-title"></h2>
    <p class="glossary-popover__aliases" hidden></p>
    <p id="glossary-popover-summary"></p>
    <a class="glossary-popover__link" href="glossaire.html">Lire la définition complète</a>
  `;
  doc.body.appendChild(panel);
  return panel;
}

function createTermButton(doc, text, entry) {
  const button = doc.createElement("button");
  button.type = "button";
  button.className = "glossary-term";
  button.dataset.glossaryTerm = entry.id;
  button.setAttribute("aria-haspopup", "dialog");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "glossary-definition-panel");
  button.textContent = text;
  return button;
}

function enhanceScope(scope, terms, doc) {
  if (scope.hasAttribute(ENHANCED_ATTRIBUTE)) return;
  scope.setAttribute(ENHANCED_ATTRIBUTE, "true");
  const walker = doc.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let current = walker.nextNode();
  while (current) {
    if (current.textContent.trim() && !current.parentElement?.closest(SKIPPED_SELECTOR)) {
      textNodes.push(current);
    }
    current = walker.nextNode();
  }

  const usedIds = new Set();
  let remaining = MAX_TERMS_PER_SCOPE;
  for (const textNode of textNodes) {
    if (!remaining) break;
    let tail = textNode;
    while (tail && remaining) {
      const match = findGlossaryMatch(tail.textContent, terms, usedIds);
      if (!match) break;
      const matchedNode = tail.splitText(match.index);
      const after = matchedNode.splitText(match.length);
      matchedNode.replaceWith(createTermButton(doc, matchedNode.textContent, match.entry));
      usedIds.add(match.entry.id);
      remaining -= 1;
      tail = after;
    }
  }
}

function positionPopover(panel, trigger, view) {
  if (view.matchMedia("(max-width: 640px)").matches) {
    panel.style.removeProperty("left");
    panel.style.removeProperty("top");
    return;
  }
  const triggerBox = trigger.getBoundingClientRect();
  const panelBox = panel.getBoundingClientRect();
  const margin = 12;
  const left = Math.min(Math.max(margin, triggerBox.left), view.innerWidth - panelBox.width - margin);
  const below = triggerBox.bottom + 10;
  const top = below + panelBox.height <= view.innerHeight - margin
    ? below
    : Math.max(margin, triggerBox.top - panelBox.height - 10);
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
}

export async function initGlossaryClient(doc = document, view = window) {
  if (doc.documentElement.dataset.glossaryClient === "ready") return;
  doc.documentElement.dataset.glossaryClient = "ready";

  const response = await fetch(new URL("../data/glossary.json", import.meta.url));
  if (!response.ok) return;
  const data = await response.json();
  const terms = glossaryTerms(data.entries);
  const entries = new Map(data.entries.map((entry) => [entry.id, entry]));
  const panel = createPopover(doc);
  const closeButton = panel.querySelector(".glossary-popover__close");
  const title = panel.querySelector("#glossary-popover-title");
  const aliases = panel.querySelector(".glossary-popover__aliases");
  const summary = panel.querySelector("#glossary-popover-summary");
  const link = panel.querySelector(".glossary-popover__link");
  let activeTrigger = null;

  function close({ restoreFocus = true } = {}) {
    if (panel.hidden) return;
    panel.hidden = true;
    activeTrigger?.setAttribute("aria-expanded", "false");
    if (restoreFocus) activeTrigger?.focus();
    activeTrigger = null;
  }

  function open(trigger) {
    const entry = entries.get(trigger.dataset.glossaryTerm);
    if (!entry) return;
    if (activeTrigger && activeTrigger !== trigger) activeTrigger.setAttribute("aria-expanded", "false");
    activeTrigger = trigger;
    trigger.setAttribute("aria-expanded", "true");
    title.textContent = entry.label;
    aliases.textContent = entry.aliases.length ? `Aussi : ${entry.aliases.join(", ")}` : "";
    aliases.hidden = entry.aliases.length === 0;
    summary.textContent = entry.summary;
    link.href = new URL(`../${entry.url}`, import.meta.url).href;
    panel.hidden = false;
    positionPopover(panel, trigger, view);
    closeButton.focus();
  }

  doc.querySelectorAll(RICHTEXT_SELECTOR).forEach((scope) => enhanceScope(scope, terms, doc));
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches(RICHTEXT_SELECTOR)) enhanceScope(node, terms, doc);
        node.querySelectorAll?.(RICHTEXT_SELECTOR).forEach((scope) => enhanceScope(scope, terms, doc));
      }
    }
  });
  observer.observe(doc.body, { childList: true, subtree: true });

  doc.addEventListener("click", (event) => {
    const trigger = event.target.closest?.("[data-glossary-term]");
    if (trigger) {
      open(trigger);
      return;
    }
    if (!panel.hidden && !panel.contains(event.target)) close({ restoreFocus: false });
  });
  closeButton.addEventListener("click", () => close());
  view.addEventListener("resize", () => {
    if (activeTrigger) positionPopover(panel, activeTrigger, view);
  });
  doc.addEventListener("keydown", (event) => {
    if (panel.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(panel.querySelectorAll("button, a[href]"));
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && doc.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && doc.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initGlossaryClient(), { once: true });
  } else {
    initGlossaryClient();
  }
}
