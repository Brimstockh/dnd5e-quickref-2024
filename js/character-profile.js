import { validateCharacterKey } from "./character-key.js";
import { fetchJson } from "./fetch-json.js";
import { escapeHtml as esc } from "./html-utils.js";
import { configurePictureImage } from "./picture-source.js";

const $ = (id) => document.getElementById(id);

function getParam(name, fallback = null) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name) ?? fallback;
}

function renderList(items) {
  if (!items || items.length === 0) return `<div class="muted">—</div>`;
  return `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
}

async function main() {
  try {
    const key = validateCharacterKey(getParam("c", "cleira"));
    const img = $("profileImage");
    if (img) {
      configurePictureImage({
        image: img,
        source: $("profileImageSource"),
        webpPath: `../img/characters/${key}-full.webp`,
        fallbackPath: `../img/characters/${key}-full.png`,
      });
    }
    $("sheetLink").href = `character.html?c=${encodeURIComponent(key)}`;

    const character = await fetchJson(`../data/characters/${key}.json`);
    const story = await fetchJson(`../data/characters/${key}.story.json`, { optional: true });

    $("name").textContent = character.name ?? "Présentation";
    $("line").textContent = `${character.species ?? "—"} • ${character.class ?? "—"} niv. ${character.level ?? "—"}`;

    if (!story) {
      $("status").textContent = "OK (sans histoire)";
      $("description").textContent = "Aucune histoire renseignée pour ce personnage.";
      $("background").innerHTML = `<div class="muted">—</div>`;
      $("feature").textContent = "—";
      $("appearance").textContent = "—";
      $("chars").innerHTML = `<div class="k">Info</div><div class="v">Ajoute ${key}.story.json</div>`;
      return;
    }

    $("status").textContent = "OK";
    $("description").textContent = story.description ?? "—";

    const background = story.background ?? {};
    const feature = background.feature ?? {};
    $("background").innerHTML = `
      <div><strong>${esc(background.name ?? "—")}</strong></div>
      ${feature.name ? `<div class="muted" style="margin-top:6px;"><strong>${esc(feature.name)}</strong></div>` : ""}
    `;
    $("feature").textContent = feature.text ?? "—";

    $("traits").innerHTML = renderList(story.personalityTraits);
    $("ideals").innerHTML = renderList(story.ideals);
    $("bonds").innerHTML = renderList(story.bonds);
    $("flaws").innerHTML = renderList(story.flaws);
    $("appearance").textContent = story.appearance ?? "—";

    const entries = Object.entries(story.characteristics ?? {});
    $("chars").innerHTML = entries.length
      ? entries.map(([keyName, value]) => `
          <div class="kv-item">
            <div class="k">${esc(keyName.charAt(0).toUpperCase() + keyName.slice(1))}</div>
            <div class="v">${esc(value ?? "—")}</div>
          </div>
        `).join("")
      : `<div class="muted">—</div>`;

    document.title = `Présentation - ${character.name ?? key}`;
  } catch (error) {
    console.error(error);
    $("status").textContent = "Erreur";
    $("description").textContent = String(error.message ?? error);
  }
}

main();
