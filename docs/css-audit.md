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
| `legacy-catalog.css` | 18,1 ko | Bestiaire historique |

Les trois plus grosses feuilles restent `icons.css`, `components.css` et `content-page.css`. Leur poids ne justifie pas encore une réécriture : elles portent des contrats publics nombreux et sont chargées par plusieurs familles de pages.

## Tokens centralisés

`css/theme.css` centralise désormais aussi les niveaux de superposition récurrents : toolbar, contrôle sticky, header, backdrops de modal et de drawer, filtres, drawer, overlay, panneau, status et popover.

Les valeurs numériques locales restantes sont intentionnelles : couches décoratives, contenus internes de composants et surfaces autonomes. Toute nouvelle couche globale doit utiliser un token `--z-*` existant ou en documenter le besoin.

## Legacy encore utilisé

Les usages legacy actifs sont désormais limités à :

- `monstres.html` ;
- `css/legacy-catalog.css` ;
- `js/legacy-catalog-ui.js` ;
- les tests navigateur et les tests de système visuel associés ;
- l’audit de couverture du glossaire.

`dons.html` est le pilote migré vers `css/catalog.css`, `catalog-ui.js` et les primitives `.catalog-*`. Il conserve ses filtres, ses paramètres d’URL, ses deep links, son rendu des tables de description et ses parcours desktop/mobile. `monstres.html` utilise encore les classes `.legacy-catalog-page`, `.legacy-filter-*` et les structures `.monster-*` ; les fichiers historiques ne sont donc pas supprimables dans ce lot.

## Prochain lot

Comparer les contrats de formulaire, filtres, cartes, statblocks et backdrops de `catalog.css`, `content-catalog.css` et `legacy-catalog.css` pour décider si une migration de `monstres.html` apporte un gain suffisant. Elle devra conserver les URLs, le responsive, le dark mode et les tests mobiles avant toute réduction supplémentaire.

La phase 12 confirme que cette migration n’est pas encore sûre : le détail des références et des assets historiques conservés est documenté dans `docs/debt-inventory.md`.
