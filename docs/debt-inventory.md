# Inventaire de dette finale

## Décision du lot

Ce lot supprime uniquement les assets dont l’absence d’usage local est démontrée. Les éléments conservés et le risque d’anciennes URL publiques restent documentés pour rendre chaque décision traçable et réversible.

## Éléments conservés

| Élément | Preuve | Décision |
| --- | --- | --- |
| `css/legacy-catalog.css` | chargé par `monstres.html`, couvert par les tests visuels et navigateur | Conserver |
| `js/legacy-catalog-ui.js` | chargé par `monstres.html`, nécessaire à ses filtres mobiles | Conserver |
| `character-template.html` | redirection/canonicalisation vers la feuille autonome | Conserver pour l’URL historique |
| `character-template-v2.html` | redirection/canonicalisation vers la feuille autonome | Conserver pour l’URL historique |
| `sw.js` | enregistré par `js/pwa-client.js`, importe `service-worker.js` | Conserver comme point d’entrée de compatibilité |
| `js/data_*.js` | consommés par `scripts/build-search-index.mjs` | Conserver comme sources de référence rapide |

Le pilote `dons.html` utilise désormais le shell catalogue partagé. La migration restante de `monstres.html` est une tâche distincte : elle doit remplacer les structures `.legacy-*`, conserver les filtres, les deep links, l’export, le responsive et l’accessibilité avant toute suppression.

La frontière legacy du bestiaire est intentionnelle et couvre encore les contrats suivants : statblocks détaillés, portraits et modal d’image, filtres, recherche, export JSON, responsive mobile, deep links et restauration de l’état ouvert. Ces comportements sont couverts par les tests Node et Playwright ; aucune migration globale n’est engagée sans gain mesuré.

## Assets non référencés supprimés

L’audit des références directes, des chemins dynamiques du bestiaire, des catalogues JSON, des scripts, des tests et de la PWA a confirmé l’absence d’usage local des 24 fichiers ci-dessous. Ils ont été supprimés : `data/assets-report.json` ne contient désormais aucun asset non référencé.

Cette décision ne garantit pas l’absence d’anciennes URL publiques partagées avant la refonte. Les chemins supprimés peuvent donc encore produire une 404 sur des signets historiques ; aucune redirection n’a été ajoutée, car aucun alias équivalent n’existe dans l’architecture statique actuelle.

### Illustrations de sous-classes historiques

```text
img/classes/barbarian-berserker.jpg
img/classes/barbarian-wildheart.jpg
img/classes/barbarian-world-tree.jpg
img/classes/bard-dance.jpg
img/classes/bard-lore.jpg
img/classes/bard-valor.jpg
img/classes/cleric-life.jpg
img/classes/cleric-war.jpg
```

### Variantes de monstres non reliées à l’index actuel

```text
img/enemies/Celestial/Empyrean Celestial.webp
img/enemies/Celestial/Empyrean Fiend.webp
img/enemies/Fiend/Gnoll Fang Ooff Yeenoghu.webp
img/enemies/Humanoid/Commoner Artist.webp
img/enemies/Humanoid/Commoner Baker.webp
img/enemies/Humanoid/Commoner Blacksmith.webp
img/enemies/Humanoid/Commoner Female.webp
img/enemies/Humanoid/Commoner Fisher.webp
img/enemies/Humanoid/Commoner Male.webp
img/enemies/Monstrosity/Minotaur Ooff Baphomet.webp
img/enemies/Ooze/Blob Ooff Annihilation.webp
img/enemies/Undead/Skeleton Archer.webp
img/enemies/Undead/Skeleton Mage.webp
```

Les noms `Ooff` étaient des variantes historiques non reliées au catalogue courant. Les fichiers `Empyrean.webp` et `Commoner.webp` sont conservés : ils correspondent aux noms utilisés par le chemin dynamique `img/enemies/<type>/<name>.webp`.

### Anciennes illustrations d’espèces

```text
img/race/aarakocra.jpg
img/race/genasi.jpg
img/race/half-elf.png
```

Ces fichiers correspondent à des espèces absentes du catalogue 2024 actuel. Le risque résiduel est limité aux anciennes URL directes, documenté ci-dessus.

### Assets volontairement conservés

- Les PNG qui ont un équivalent WebP restent présents pour le fallback de `js/picture-source.js`.
- `img/map/faerun-map.jpg` et `img/map/faerun-map.webp` restent présents : les deux chemins sont référencés.
- Les portraits du bestiaire attendus par `js/monsters-page.js` et les données dynamiques sont conservés.
- `assets/images/classes-heroes.webp` et `assets/images/table-adventurers.webp` sont tous deux actifs, respectivement dans le hero Classes et la navigation de l’espace Ma table.

## JavaScript nettoyé

Deux exports ont été supprimés après cartographie des scripts HTML, des imports ES modules, des chargements dynamiques, des générateurs Node et des tests :

- `js/search-engine.js` : `scoreSearchEntry` n’avait aucun consommateur ; le moteur de recherche utilise directement son évaluation interne via `searchEntries`.
- `js/site-navigation.js` : `navigationEntryForPath` n’avait aucun consommateur ; le shell et les validations utilisent `navigationContextForPath` ou `navigationSectionForPath`.

Aucun fichier JavaScript n’a été supprimé. `js/legacy-catalog-ui.js`, `js/data_*.js`, `js/content-ids.js`, `js/picture-source.js`, `js/pwa-client.js`, `sw.js` et `service-worker.js` restent conservés avec leurs usages vérifiés.

## Déjà supprimé et protégé par tests

Les éléments suivants sont déjà absents et leur absence est vérifiée par `tests/code-cleanup.test.mjs` : anciens quicklinks de la page d’accueil, `html/quickref-item.html` et `js/data_hazards.js`. Toute réintroduction doit être justifiée par un nouveau contrat, pas par une restauration automatique d’un ancien template.

## Conditions d’une prochaine suppression

Avant de supprimer un élément classé « conserver » ou « à revoir » :

1. rechercher ses références exactes et dynamiques dans tout le dépôt ;
2. vérifier les index, le service worker et les URLs publiques historiques ;
3. ajouter une redirection ou un alias si l’URL doit rester compatible ;
4. exécuter `npm run audit`, `npm run recette` et les tests Playwright ;
5. mesurer la réduction obtenue et documenter le chemin supprimé.
