# Architecture

## Vue d’ensemble

Le projet est un site statique/PWA : les pages HTML, les feuilles CSS, les modules JavaScript et les fichiers JSON sont publiés directement par GitHub Pages. Il n’y a ni serveur applicatif ni base de données distante. Les préférences, favoris, notes et personnages restent dans le stockage local du navigateur.

Le navigateur assemble trois niveaux :

1. le HTML d’une page et ses données locales ;
2. le shell partagé (`js/site-shell.js`, `js/user-library.js`, `js/pwa-client.js`) ;
3. les modules propres à la page, chargés par script classique ou import ES module.

Le shell fournit la navigation, le thème, la recherche, les outils personnels, le partage et le mode session. Les responsabilités extraites du shell vivent dans `js/shell/`.

## Navigation canonique

`js/site-navigation.js` est la source de vérité des cinq espaces publics :

- Règles ;
- Compendium ;
- Création ;
- Univers ;
- Ma table.

Chaque entrée possède une URL publique, un identifiant, un type et des correspondances éventuelles pour les pages historiques ou imbriquées. Les URLs existantes sont des contrats : une nouvelle page complète la navigation, elle ne remplace pas silencieusement une ancienne URL.

Après une modification de navigation :

```bash
npm run check:site-navigation
npm run check:navigation
npm run check:search
npm run check:inventory
```

## Flux des données générées

Les sources éditoriales HTML et JSON sont transformées par les scripts Node :

```text
sources HTML/JSON
      │
      ├─ build-search-index.mjs ─────── data/search-index*.json
      ├─ build-relations-index.mjs ──── data/content-relations.json
      ├─ build-glossary.mjs ─────────── data/glossary.json
      └─ build-content-inventory.mjs ── data/content-inventory.json
```

Les fichiers générés sont versionnés pour être servis sans build frontend. Ils doivent être régénérés puis vérifiés avant une PR.

## Répertoires principaux

| Chemin | Responsabilité |
| --- | --- |
| `*.html`, `html/`, `classes/`, `races/` | Pages publiques et pages historiques |
| `js/` | Shell, rendu des catalogues, logique de stockage et données de page |
| `js/shell/` | Modules fonctionnels du shell global |
| `css/` | Tokens, layout, composants et styles de pages |
| `data/` | Sources et index JSON servis au navigateur |
| `schemas/` | Contrats JSON versionnés |
| `scripts/` | Génération, validation, audits et serveur local de test |
| `tests/` | Tests Node ; `tests/browser/` contient les tests Playwright et axe |
| `img/`, `assets/` | Illustrations, icônes et ressources PWA |
| `.github/workflows/` | Recette, artefact Pages et déploiement |

## Ajouter une page

1. Créer le HTML et respecter le shell partagé, le skip-link, les métadonnées et les chemins relatifs GitHub Pages.
2. Ajouter l’entrée dans `SITE_SECTIONS` si la page est un point d’entrée public.
3. Ajouter les données ou le générateur d’index si la page expose du contenu recherchable.
4. Déclarer la provenance quand la page présente une règle ou un contenu structuré.
5. Ajouter les tests Node de contrat et un test Playwright si le parcours est interactif.
6. Vérifier les liens, l’accessibilité, les viewports 390 px et desktop, puis exécuter la recette.

Une page secondaire ne doit pas être ajoutée au précache PWA par défaut. Voir `docs/pwa.md`.
