import { createContentId } from "./content-ids.js";

const SITE_ROOT = new URL("../", import.meta.url);
const GROUPS = Object.freeze([
  ["prerequisite", "Prérequis"],
  ["available-for", "Disponible pour"],
  ["related-rule", "Règles associées"],
  ["see-also", "Voir aussi"],
]);
const QUICKREF_TYPES = Object.freeze({
  action: "action",
  bonus: "bonus-action",
  condition: "condition",
  environment: "environment",
  movement: "movement",
  reaction: "reaction",
});

function localUrl(path) {
  return new URL(path, SITE_ROOT).href;
}

export function relatedEntries(index, contentId) {
  const source = index?.sources?.[contentId];
  if (!source) return [];
  return source.relations.map((relation) => {
    const target = index.targets[relation.target];
    return {
      ...relation,
      title: relation.label || target.title,
      url: relation.url || target.url,
      category: target.category,
    };
  });
}

export function contentIdForElement(element, pathname = globalThis.location?.pathname || "") {
  const slug = element?.dataset?.contentId;
  if (!slug) return "";
  if (element.classList.contains("spell")) return createContentId("spell", slug);
  if (element.classList.contains("monster")) return createContentId("monster", slug);
  if (element.classList.contains("feat")) return createContentId("feat", slug);

  const quickrefMatch = String(element.id || "").match(/^quickref-([a-z]+)-/);
  if (quickrefMatch && QUICKREF_TYPES[quickrefMatch[1]]) {
    return createContentId(QUICKREF_TYPES[quickrefMatch[1]], slug);
  }

  if (/armes-armures\.html$/i.test(pathname)) return createContentId("equipment", slug);
  if (/historique\.html$/i.test(pathname)) return createContentId("background", slug);
  return "";
}

export function pageContentId(index, locationValue = globalThis.location, siteRoot = SITE_ROOT) {
  if (!locationValue) return "";
  const current = new URL(locationValue.href || String(locationValue), siteRoot);
  const candidates = Object.entries(index?.sources || {}).filter(([, source]) => {
    const sourceUrl = new URL(source.url, siteRoot);
    return sourceUrl.pathname === current.pathname;
  });
  const exact = candidates.find(([, source]) => {
    const sourceUrl = new URL(source.url, siteRoot);
    return (sourceUrl.search || sourceUrl.hash)
      && sourceUrl.search === current.search
      && sourceUrl.hash === current.hash;
  });
  if (exact) return exact[0];
  return candidates.find(([, source]) => {
    const sourceUrl = new URL(source.url, siteRoot);
    return !sourceUrl.search && !sourceUrl.hash;
  })?.[0] || "";
}

export function renderRelatedContent(index, contentId, documentValue = document) {
  const entries = relatedEntries(index, contentId);
  if (!entries.length) return null;

  const aside = documentValue.createElement("aside");
  const heading = documentValue.createElement("h2");
  const groups = documentValue.createElement("div");
  const headingId = `related-content-${contentId}`;
  aside.className = "related-content";
  aside.dataset.relatedAuto = "";
  aside.setAttribute("aria-labelledby", headingId);
  heading.id = headingId;
  heading.textContent = "Contenus liés";
  groups.className = "related-content__groups";
  aside.append(heading, groups);

  for (const [type, label] of GROUPS) {
    const matching = entries.filter((entry) => entry.type === type);
    if (!matching.length) continue;
    const group = documentValue.createElement("section");
    const groupHeading = documentValue.createElement("h3");
    const list = documentValue.createElement("ul");
    group.className = "related-content__group";
    groupHeading.textContent = label;
    list.className = "related-content__list";
    for (const entry of matching) {
      const item = documentValue.createElement("li");
      const link = documentValue.createElement("a");
      const meta = documentValue.createElement("span");
      link.href = localUrl(entry.url);
      link.textContent = entry.title;
      meta.textContent = entry.category;
      item.append(link, meta);
      list.appendChild(item);
    }
    group.append(groupHeading, list);
    groups.appendChild(group);
  }
  return aside;
}

export async function initRelatedContent(documentValue = document, windowValue = window) {
  const response = await windowValue.fetch(localUrl("data/content-relations.json"));
  if (!response.ok) return null;
  const index = await response.json();
  const main = documentValue.querySelector("main");
  if (!main) return null;

  let activeId = "";
  let activeHost = null;
  let scheduled = false;

  function selectedElement() {
    const candidates = Array.from(documentValue.querySelectorAll(
      "details[open][data-content-id], .item[aria-expanded='true'][data-content-id]",
    ));
    for (let index = candidates.length - 1; index >= 0; index -= 1) {
      if (contentIdForElement(candidates[index], windowValue.location.pathname)) return candidates[index];
    }
    return null;
  }

  function render() {
    scheduled = false;
    const selected = selectedElement();
    const nextId = selected
      ? contentIdForElement(selected, windowValue.location.pathname)
      : pageContentId(index, windowValue.location);
    const nextHost = selected?.classList.contains("item")
      ? documentValue.getElementById("quickref-detail-panel")
      : selected || main;
    if (nextId === activeId && nextHost === activeHost) return;

    documentValue.querySelectorAll("[data-related-auto]").forEach((element) => element.remove());
    activeId = nextId;
    activeHost = nextHost;
    if (!nextId || !nextHost) return;
    const section = renderRelatedContent(index, nextId, documentValue);
    if (section) nextHost.appendChild(section);
  }

  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    windowValue.requestAnimationFrame(render);
  }

  const observer = new MutationObserver(scheduleRender);
  observer.observe(main, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["open", "aria-expanded"],
  });
  windowValue.addEventListener("popstate", scheduleRender);
  scheduleRender();
  return { index, render: scheduleRender, disconnect: () => observer.disconnect() };
}
