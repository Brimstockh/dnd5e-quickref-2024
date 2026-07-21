import { fetchJson } from "./fetch-json.js";
import { escapeHtml } from "./html-utils.js";
import { configurePictureImage } from "./picture-source.js";

const $ = (id) => document.getElementById(id);

async function loadIndex() {
  return await fetchJson("../data/characters/index.json");
}

function render(list) {
  const root = $("list");
  root.innerHTML = "";

  for (const character of list) {
    const key = String(character.key ?? "");
    const name = escapeHtml(character.name);
    const species = escapeHtml(character.species ?? "—");
    const characterClass = escapeHtml(character.class ?? "—");
    const level = escapeHtml(character.level ?? "—");
    const encodedKey = encodeURIComponent(key);
    const wrap = document.createElement("div");
    wrap.className = "card char-card";
    wrap.dataset.search = `${character.name ?? ""} ${character.class ?? ""} ${character.species ?? ""} ${character.level ?? ""}`.toLowerCase();

    const pngPath = `../img/characters/${encodedKey}.png`;
    const webpPath = `../img/characters/${encodedKey}.webp`;

    wrap.innerHTML = `
      <div class="char-card__left">
        <strong>${name}</strong>
        <div class="meta">${species} • ${characterClass} niv. ${level}</div>

        <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
          <a class="btn" href="character-profile.html?c=${encodedKey}">Présentation</a>
          <a class="btn" href="character.html?c=${encodedKey}">Fiche (DnD)</a>
        </div>
      </div>

      <picture style="display: contents;">
        <source type="image/webp" />
        <img
          class="char-card__img"
          width="74"
          height="74"
          loading="lazy"
          decoding="async"
          alt="Portrait de ${name}"
        />
      </picture>
    `;

    const img = wrap.querySelector("img");
    configurePictureImage({
      image: img,
      source: wrap.querySelector("source"),
      webpPath,
      fallbackPath: pngPath,
    });

    root.appendChild(wrap);
  }
}

function setupSearch() {
  const input = $("q");
  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    for (const element of $("list").children) {
      const haystack = element.dataset.search ?? "";
      element.style.display = haystack.includes(query) ? "" : "none";
    }
  });
}

async function main() {
  try {
    const data = await loadIndex();
    const characters = data.characters ?? [];

    render(characters);
    setupSearch();

    $("status").textContent = `${characters.length} perso(s)`;
  } catch (error) {
    console.error(error);
    $("status").textContent = "Erreur";
    $("list").innerHTML = `
      <div class="card">
        <strong>Impossible de charger la liste</strong>
        <div class="meta">${escapeHtml(error.message ?? error)}</div>
      </div>
    `;
  }
}

main();
