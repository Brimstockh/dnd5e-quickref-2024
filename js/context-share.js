export const SELECTION_PARAMETERS = Object.freeze([
  "spell",
  "feat",
  "monster",
  "equipment",
  "background",
  "movement",
  "action",
  "bonus",
  "reaction",
  "condition",
  "environment",
  "term",
]);

export const ROUTE_SELECTION_TYPES = Object.freeze({
  "armes-armures.html": Object.freeze({ equipment: "equipment" }),
  "dons.html": Object.freeze({ feat: "feat" }),
  "glossaire.html": Object.freeze({ term: "glossary" }),
  "historique.html": Object.freeze({ background: "background" }),
  "monstres.html": Object.freeze({ monster: "monster" }),
  "quickref.html": Object.freeze({
    action: "action",
    bonus: "bonus-action",
    condition: "condition",
    environment: "environment",
    movement: "movement",
    reaction: "reaction",
  }),
  "spells.html": Object.freeze({ spell: "spell" }),
});

export function buildContextUrl(locationValue, context = {}) {
  const base = typeof locationValue === "string" ? locationValue : locationValue.href;
  const url = new URL(base, "https://dnd.local/");

  if (context.parameter && context.value) {
    for (const parameter of SELECTION_PARAMETERS) {
      if (parameter !== context.parameter) url.searchParams.delete(parameter);
    }
    url.searchParams.set(context.parameter, context.value);
    url.hash = "";
  }

  if (context.hash) {
    for (const parameter of SELECTION_PARAMETERS) url.searchParams.delete(parameter);
    url.hash = context.hash.startsWith("#") ? context.hash : `#${context.hash}`;
  }

  return url.href;
}

export function pageSelectionParameter(pathname) {
  const page = String(pathname || "").split("/").pop() || "";
  const parameters = Object.keys(ROUTE_SELECTION_TYPES[page] || {});
  return parameters.length === 1 && !["glossaire.html"].includes(page) ? parameters[0] : "";
}

function contextTitle(host) {
  return host.dataset.contextShareTitle
    || host.querySelector(".catalog-card__title, .feat-title, .monster-title, summary h3, h2, h3")?.textContent?.trim()
    || "ce contenu";
}

function addAction(host) {
  if (!host || host.dataset.contextShareEnhanced === "true") return;
  host.dataset.contextShareEnhanced = "true";
  host.setAttribute("data-context-share-root", "");

  const actions = document.createElement("div");
  const button = document.createElement("button");
  const title = contextTitle(host);
  actions.className = "context-actions";
  button.type = "button";
  button.className = "context-copy-link";
  button.textContent = "Copier le lien";
  button.setAttribute("aria-label", `Copier le lien vers « ${title} »`);
  actions.appendChild(button);

  if (host.matches("details")) {
    host.querySelector(":scope > summary")?.insertAdjacentElement("afterend", actions);
  } else if (host.id === "quickref-detail-panel") {
    host.querySelector(".quickref-detail__body")?.prepend(actions);
  } else {
    host.querySelector("footer")?.appendChild(button);
  }
}

function enhance(root = document) {
  const parameter = pageSelectionParameter(location.pathname);
  if (parameter) {
    const details = root.matches?.("details[data-content-id]")
      ? [root]
      : root.querySelectorAll?.("details[data-content-id]") || [];
    for (const entry of details) {
      entry.dataset.contextShareParameter = parameter;
      entry.dataset.contextShareValue = entry.dataset.contentId;
      addAction(entry);
    }
  }

  const glossaryCards = root.matches?.("[data-context-share-parameter][data-context-share-value]")
    ? [root]
    : root.querySelectorAll?.("[data-context-share-parameter][data-context-share-value]") || [];
  for (const card of glossaryCards) addAction(card);

  const quickrefPanel = root.id === "quickref-detail-panel"
    ? root
    : root.querySelector?.("#quickref-detail-panel");
  if (quickrefPanel) addAction(quickrefPanel);
}

function contextForHost(host) {
  return {
    parameter: host.dataset.contextShareParameter || "",
    value: host.dataset.contextShareValue || "",
  };
}

export function initContextSharing(doc = document, view = window) {
  enhance(doc);

  doc.addEventListener("click", (event) => {
    const button = event.target.closest?.(".context-copy-link");
    if (!button) return;
    const host = button.closest("[data-context-share-root]");
    if (!host) return;
    const url = buildContextUrl(view.location.href, contextForHost(host));
    const title = contextTitle(host);
    view.DndShare?.copyLink(url, `Lien vers « ${title} » copié.`);
  });

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) enhance(node);
      }
    }
  });
  observer.observe(doc.body, { childList: true, subtree: true });
  return observer;
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initContextSharing(), { once: true });
  } else {
    initContextSharing();
  }
}
