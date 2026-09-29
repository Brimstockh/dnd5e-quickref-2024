# Audit CSS — phase 4, premier lot

## Périmètre

L’audit porte sur les feuilles partagées et les surfaces catalogues. Les feuilles autonomes de feuille de personnage (`character-sheet.css`, `character-sheet-app.css`) et les anciennes pages de personnage conservent leurs tokens locaux tant qu’une migration de périmètre n’est pas définie.

## Poids observé

| Feuille | Taille | Rôle |
| --- | ---: | --- |
| `icons.css` | 89,1 ko | Icônes partagées |
| `components.css` | 49,0 ko | Shell et composants transverses |
| `content-page.css` | 33,0 ko | Pages éditoriales |
| `catalog.css` | 15,9 ko | Catalogues consolidés |
| `content-catalog.css` | 12,5 ko | Catalogues de contenu |
| `legacy-catalog.css` | 19,5 ko | Monstres et dons historiques |

Les trois plus grosses feuilles restent `icons.css`, `components.css` et `content-page.css`. Leur poids ne justifie pas encore une réécriture : elles portent des contrats publics nombreux et sont chargées par plusieurs familles de pages.

## Tokens centralisés

`css/theme.css` centralise désormais aussi les niveaux de superposition récurrents : toolbar, contrôle sticky, header, backdrops de modal et de drawer, filtres, drawer, overlay, panneau, status et popover.

Les valeurs numériques locales restantes sont intentionnelles : couches décoratives, contenus internes de composants et surfaces autonomes. Toute nouvelle couche globale doit utiliser un token `--z-*` existant ou en documenter le besoin.

## Legacy encore utilisé

Les usages actifs sont limités à :

- `dons.html` et `monstres.html` ;
- `css/legacy-catalog.css` ;
- `js/legacy-catalog-ui.js` ;
- les tests navigateur et les tests de système visuel associés ;
- l’audit de couverture du glossaire.

Ces deux pages utilisent encore les classes `.legacy-catalog-page`, `.legacy-filter-*` et les structures `.monster-*`/`.feat-*`. Les fichiers historiques ne sont donc pas supprimables dans ce lot.

## Prochain lot

Comparer les contrats de formulaire, filtres, cartes et backdrops de `catalog.css`, `content-catalog.css` et `legacy-catalog.css`. Toute migration devra conserver les URLs, le responsive, le dark mode et les tests mobiles avant de réduire la surface legacy.

La phase 12 confirme que cette migration n’est pas encore sûre : le détail des références et des assets historiques conservés est documenté dans `docs/debt-inventory.md`.
