# Inventaire de dette finale

## Décision du lot

Ce lot ne supprime pas de fichier dont l’absence de référence locale ne suffit pas à exclure une ancienne URL publique. Les éléments sont classés pour qu’une suppression future soit traçable et réversible.

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

## Assets non référencés à revoir

`data/assets-report.json` identifie 24 assets non référencés, pour 3 789 501 octets. Leur absence de référence dans le dépôt ne constitue pas encore une preuve suffisante d’absence d’URL publique.

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

Les noms `Ooff` sont probablement des variantes historiques ou des erreurs de nommage. Les renommer directement pourrait casser une URL existante ; une éventuelle correction devra conserver l’ancien chemin ou fournir une compatibilité explicite.

### Anciennes illustrations d’espèces

```text
img/race/aarakocra.jpg
img/race/genasi.jpg
img/race/half-elf.png
```

Ces fichiers correspondent à des espèces absentes du catalogue 2024 actuel, mais leurs chemins peuvent avoir été partagés avant la migration.

## Déjà supprimé et protégé par tests

Les éléments suivants sont déjà absents et leur absence est vérifiée par `tests/code-cleanup.test.mjs` : anciens quicklinks de la page d’accueil, `html/quickref-item.html` et `js/data_hazards.js`. Toute réintroduction doit être justifiée par un nouveau contrat, pas par une restauration automatique d’un ancien template.

## Conditions d’une prochaine suppression

Avant de supprimer un élément classé « conserver » ou « à revoir » :

1. rechercher ses références exactes et dynamiques dans tout le dépôt ;
2. vérifier les index, le service worker et les URLs publiques historiques ;
3. ajouter une redirection ou un alias si l’URL doit rester compatible ;
4. exécuter `npm run audit`, `npm run recette` et les tests Playwright ;
5. mesurer la réduction obtenue et documenter le chemin supprimé.
