function $(id) { return document.getElementById(id); }

function fmtMod(n){
  const v = Number(n ?? 0);
  return (v >= 0 ? `+${v}` : `${v}`);
}

function getParam(name, fallback=null){
  const url = new URL(window.location.href);
  return url.searchParams.get(name) ?? fallback;
}

async function loadCharacter(){
    const key = getParam("c", "cleira");
    const path = `../data/characters/${key}.json`;
  
    const res = await fetch(path, { cache: "no-store" });
    if(!res.ok) throw new Error(`Impossible de charger ${path} (${res.status})`);
    return { key, character: await res.json() };
  }

async function loadStory(key){
    const path = `../data/characters/${key}.story.json`;
    const res = await fetch(path, { cache: "no-store" });
    if(!res.ok) return null; // story optionnelle
    return await res.json();
}

function renderHeader(c){
  $("c-name").textContent = c.name ?? "—";
  $("c-line").textContent = `${c.species ?? "—"} • ${c.class ?? "—"} ${c.level ?? ""}`.trim();

  $("c-ac").textContent = c.ac ?? "—";
  $("c-init").textContent = fmtMod(c.initiative ?? 0);
  $("c-speed").textContent = `${c.speed ?? "—"} m`;
  $("c-pb").textContent = fmtMod(c.proficiencyBonus ?? 0);

  $("c-hp-cur").textContent = c.hp?.current ?? "—";
  $("c-hp-max").textContent = c.hp?.max ?? "—";
  $("c-hp-temp").textContent = c.hp?.temp ?? 0;
}

function renderAbilities(c){
  const order = ["str","dex","con","int","wis","cha"];
  const names = { str:"FOR", dex:"DEX", con:"CON", int:"INT", wis:"SAG", cha:"CHA" };

  const root = $("abilities");
  root.innerHTML = "";

  for(const k of order){
    const a = c.abilities?.[k];
    const mod = a?.mod ?? 0;
    const score = a?.score ?? "—";

    const el = document.createElement("div");
    el.className = "ability";
    el.innerHTML = `
      <div class="ability__name">${names[k]}</div>
      <div class="ability__mod">${fmtMod(mod)}</div>
      <div class="ability__score">${score}</div>
    `;
    root.appendChild(el);
  }
}

function renderSaves(c){
  const root = $("saves");
  root.innerHTML = "";

  const map = { str:"Force", dex:"Dextérité", con:"Constitution", int:"Intelligence", wis:"Sagesse", cha:"Charisme" };
  const items = c.savingThrows ?? [];

  for(const s of items){
    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div class="item__left">
        <span class="dot ${s.proficient ? "is-prof":""}"></span>
        <span class="item__name">${map[s.ability] ?? s.ability}</span>
      </div>
      <div class="item__value">${fmtMod(s.bonus ?? 0)}</div>
    `;
    root.appendChild(el);
  }

  if(items.length === 0){
    root.innerHTML = `<div class="muted small">Aucun jet de sauvegarde renseigné.</div>`;
  }
}

function renderPassives(c){
  const root = $("passives");
  root.innerHTML = "";

  const p = c.passives ?? {};
  const rows = [
    ["Perception passive", p.perception],
    ["Investigation passive", p.investigation],
    ["Intuition passive", p.insight]
  ];

  for(const [name,val] of rows){
    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div class="item__name">${name}</div>
      <div class="item__value">${val ?? "—"}</div>
    `;
    root.appendChild(el);
  }

  const dv = c.senses?.darkvision;
  $("senses").textContent = dv ? `Vision dans le noir ${dv} m` : "";
}

function renderProfs(c){
  const root = $("profs");
  root.innerHTML = "";

  const p = c.proficiencies ?? {};
  const blocks = [
    ["Armures", p.armor],
    ["Armes", p.weapons],
    ["Outils", p.tools],
    ["Langues", p.languages]
  ];

  for(const [k, arr] of blocks){
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="kv__k">${k}</div>
      <div class="kv__v">${(arr && arr.length) ? arr.join(", ") : "<span class='muted'>—</span>"}</div>
    `;
    root.appendChild(wrap);
  }
}

function renderSkills(c){
  const root = $("skills");
  root.innerHTML = "";

  const skills = (c.skills ?? []).slice().sort((a,b) => a.name.localeCompare(b.name));

  for(const sk of skills){
    const el = document.createElement("div");
    el.className = "item";
    el.dataset.skillName = (sk.name ?? "").toLowerCase();

    el.innerHTML = `
      <div class="item__left">
        <span class="dot ${sk.proficient ? "is-prof":""}"></span>
        <div style="min-width:0">
          <div class="item__name">${sk.name}</div>
          <div class="item__meta">${(sk.ability ?? "").toUpperCase()}</div>
        </div>
      </div>
      <div class="item__value">${fmtMod(sk.bonus ?? 0)}</div>
    `;
    root.appendChild(el);
  }

  const input = $("skillFilter");
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    for(const el of root.children){
      const name = el.dataset.skillName ?? "";
      el.style.display = name.includes(q) ? "" : "none";
    }
  });
}

function renderActions(c){
  const root = $("actions");
  root.innerHTML = "";

  const head = document.createElement("div");
  head.className = "trow thead";
  head.innerHTML = `<div>Attaque</div><div>Portée</div><div>Toucher</div><div>Dégâts / Notes</div>`;
  root.appendChild(head);

  const actions = c.actions ?? [];
  for(const a of actions){
    const el = document.createElement("div");
    el.className = "trow";
    el.innerHTML = `
      <div><strong>${a.name}</strong></div>
      <div class="muted">${a.range ?? "—"}</div>
      <div>${fmtMod(a.toHit ?? 0)}</div>
      <div>${a.damage ?? "—"} <span class="muted">${a.notes ? "• " + a.notes : ""}</span></div>
    `;
    root.appendChild(el);
  }

  if(actions.length === 0){
    root.innerHTML = `<div class="muted small">Aucune action renseignée.</div>`;
  }
}

function renderSpells(c){
  const root = $("spells");
  root.innerHTML = "";

  const head = document.createElement("div");
  head.className = "trow thead";
  head.innerHTML = `<div>Sort</div><div>Niveau</div><div>École</div><div>Notes</div>`;
  root.appendChild(head);

  const spells = c.spells ?? [];
  for(const s of spells){
    const el = document.createElement("div");
    el.className = "trow";
    el.innerHTML = `
      <div><strong>${s.name}</strong></div>
      <div class="muted">${s.level ?? "—"}</div>
      <div class="muted">${s.school ?? "—"}</div>
      <div class="muted">${s.notes ?? ""}</div>
    `;
    root.appendChild(el);
  }

  if(spells.length === 0){
    root.innerHTML = `<div class="muted small">Aucun sort renseigné.</div>`;
  }
}

function renderDefensesAndConditions(c){
  const def = $("defenses");
  const con = $("conditions");
  def.innerHTML = "";
  con.innerHTML = "";

  const defs = c.defenses ?? [];
  const conds = c.conditions ?? [];

  for(const d of defs){
    const chip = document.createElement("span");
    chip.className = "chip chip--accent";
    chip.textContent = d;
    def.appendChild(chip);
  }
  for(const d of conds){
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = d;
    con.appendChild(chip);
  }

  if(defs.length === 0) def.innerHTML = `<span class="muted small">Aucune défense.</span>`;
  if(conds.length === 0) con.innerHTML = `<span class="muted small">Aucune condition active.</span>`;
}

function renderNotes(c){
  $("notes").textContent = c.notes ?? "";
}

function setupTabs(){
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const panels = {
    actions: document.querySelector("#tab-actions"),
    spells: document.querySelector("#tab-spells"),
    inventory: document.querySelector("#tab-inventory"),
    story: document.querySelector("#tab-story"),
    notes: document.querySelector("#tab-notes")
  };

  function activate(key){
    for(const t of tabs){
      const on = t.dataset.tab === key;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    }
    for(const [k,p] of Object.entries(panels)){
      p.classList.toggle("is-active", k === key);
    }
  }

  for(const t of tabs){
    t.addEventListener("click", () => activate(t.dataset.tab));
  }
}

function esc(s){
    return String(s ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }
  
  function renderStory(story){
    const root = $("story");
    if(!story){
      root.innerHTML = `<div class="muted small">Aucune histoire renseignée pour ce personnage.</div>`;
      return;
    }
  
    const bg = story.background ?? {};
    const feat = bg.feature ?? {};
    const ch = story.characteristics ?? {};
  
    const list = (arr) => (arr && arr.length)
      ? `<ul>${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`
      : `<div class="muted small">—</div>`;
  
    root.innerHTML = `
      <div class="block">
        <h3>Description</h3>
        <div class="prose">${esc(story.description || "—")}</div>
      </div>
  
      <div class="block">
        <h3>Background</h3>
        <div><strong>${esc(bg.name || "—")}</strong></div>
        ${feat.name ? `<div class="muted small" style="margin-top:6px;"><strong>${esc(feat.name)}</strong></div>` : ""}
        ${feat.text ? `<div class="prose" style="margin-top:6px;">${esc(feat.text)}</div>` : ""}
      </div>
  
      <div class="block">
        <h3>Characteristics</h3>
        <div class="kv2">
          ${Object.entries(ch).map(([k,v]) => `
            <div class="k">${esc(k)}</div>
            <div class="v">${esc(v ?? "—")}</div>
          `).join("")}
        </div>
      </div>
  
      <div class="block">
        <h3>Personality Traits</h3>
        ${list(story.personalityTraits)}
      </div>
  
      <div class="block">
        <h3>Ideals</h3>
        ${list(story.ideals)}
      </div>
  
      <div class="block">
        <h3>Bonds</h3>
        ${list(story.bonds)}
      </div>
  
      <div class="block">
        <h3>Flaws</h3>
        ${list(story.flaws)}
      </div>
  
      <div class="block">
        <h3>Appearance</h3>
        <div class="prose">${esc(story.appearance || "—")}</div>
      </div>
    `;
  }

async function main(){
  setupTabs();

  try{
    const { key, character: c } = await loadCharacter();
    const img = document.getElementById("charImage");
    if (img) {
      const path = `../img/characters/${key}.png`;
      img.src = path;

      img.onerror = () => {
        img.style.display = "none"; // cache si image absente
      };
    }
    const story = await loadStory(key);
    const link = document.getElementById("profileLink");
    if (link) link.href = `character-profile.html?c=${encodeURIComponent(key)}`;

    renderHeader(c);
    renderAbilities(c);
    renderSaves(c);
    renderPassives(c);
    renderProfs(c);
    renderSkills(c);
    renderActions(c);
    renderSpells(c);
    renderDefensesAndConditions(c);
    renderNotes(c);
    renderStory(story);

    $("loading").textContent = "OK";
    $("loading").classList.remove("pill--muted");
    $("sheet").setAttribute("aria-busy","false");
    document.title = `Fiche - ${c.name ?? "Personnage"}`;
  }catch(err){
    console.error(err);
    $("loading").textContent = "Erreur";
    $("sheet").innerHTML = `
      <section class="card">
        <h1 class="h1">Impossible de charger la fiche</h1>
        <p class="muted">${String(err.message ?? err)}</p>
        <p class="muted small">Astuce : utilise <code>?c=cleira</code> et vérifie que <code>data/characters/cleira.json</code> existe.</p>
      </section>
    `;
  }
}

main();
