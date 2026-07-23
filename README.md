# dnd5e-quickref-2024

French D&D 2024 quick-reference and character tools as a static website.

This repository is a customized fork of the original `dnd5e-quickref` project, expanded with:

- a French home page and navigation
- D&D 2024 quick-reference pages
- beginner-friendly class and species pages
- a searchable spell browser
- JSON-driven character pages
- a standalone character sheet with local save and JSON import/export

## What is in the repo

Main entry points:

- `index.html`: homepage
- `quickref.html`: quick combat reference
- `rules-2024.html`: rules summary
- `combat-2024.html`: combat and damage reference
- `mastery-2024.html`: weapon mastery and action reference
- `spells.html`: spell browser with filters
- `races/index.html`: species overview
- `classes/index.html`: class guides
- `html/characters.html`: character directory
- `character-sheet-standalone.html`: editable standalone character sheet
- `espace-personnel.html`: local library, notes, lists, and character profiles
- `assistant-creation.html`: guided character creator
- `comparateur.html`: shareable character-option comparator

Content and assets:

- `data/characters/`: character JSON files and story JSON files
- `data/spells_2024.json`: spell dataset
- `data/content-inventory.json`: generated content and quality inventory
- `data/local-storage-contracts.json`: versioned local-storage registry
- `js/`: rendering logic for quick reference and character pages
- `css/`: shared styling
- `img/`: icons, race art, class icons, and character portraits

## Run locally

Because several pages use `fetch()` to load JSON files, the site should be served through a local web server instead of opening files directly with `file://`.

Example with Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

Run the complete validation recipe with:

```bash
npm run recette
```

Generated indexes must stay synchronized. Use `npm run build:inventory` after changing indexed content.

## Publication

Le workflow `Recette et publication` reconstruit l’index de recherche et exécute tous les tests avant chaque déploiement. Les pull requests lancent uniquement la recette ; une mise à jour de `main` publie ensuite le site avec GitHub Pages.

Dans les paramètres GitHub Pages du dépôt, la source doit être configurée sur **GitHub Actions**.

## Character data

Character pages are driven by files in `data/characters/`:

- `<name>.json`: sheet data used by `html/character.html`
- `<name>.story.json`: narrative data used by `html/character-profile.html`
- `index.json`: character list used by `html/characters.html`

Example:

- `html/character.html?c=corvum`
- `html/character-profile.html?c=corvum`

If a portrait exists at `img/characters/<name>.png`, it is displayed automatically.

## Standalone character sheet

`character-sheet-standalone.html` is a self-contained editable sheet intended for local use.

Features:

- automatic browser save with `localStorage`
- manual save and reset
- JSON export
- JSON import
- no backend required

## Editing content

Typical places to update content:

- quick reference items: `js/data_*.js`
- spells: `data/spells_2024.json`
- character sheets: `data/characters/*.json`
- character stories: `data/characters/*.story.json`
- page structure: root `.html` files and `html/*.html`
- styles: `css/*.css`

## Credits

- Original quick-reference project: https://github.com/crobi/dnd5e-quickref
- Icons: https://game-icons.net/

## License

See `LICENSE.md`.
