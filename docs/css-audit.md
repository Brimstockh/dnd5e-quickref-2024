# Audit CSS — phase 3

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

## Résultat de la phase 3

Les 25 feuilles CSS restent utilisées par au moins une page HTML ; aucune feuille n’a donc été supprimée. L’audit ciblé a retiré cinq variables personnalisées déclarées sans consommation (`--bg`, `--paper-edge`, `--accent-soft`, `--text-base` et `--heading-lg`, avec `--bg` défini dans plusieurs feuilles). Les classes injectées par JavaScript, les états interactifs, les pseudo-classes et les media queries ont été conservés ; aucun sélecteur n’a été supprimé sur le seul fondement d’une absence dans le HTML statique.

La consolidation porte sur les réécritures finales des trois familles de catalogue :

- `css/catalog.css` : valeurs finales remontées dans les règles de base pour les contrôles, les cartes, les métadonnées et les surfaces compactes ;
- `css/content-catalog.css` : même traitement pour la grille d’outils, les filtres et les entrées ; suppression de deux règles media identiques et de deux déclarations redondantes ;
- `css/legacy-catalog.css` : valeurs finales remontées pour préserver le bestiaire historique sans supprimer son contrat visuel ou mobile.

Cette consolidation réduit le CSS de 9 036 à 8 954 lignes et de 352 344 à 349 710 octets après normalisation LF, sans modifier les valeurs calculées finales sur les surfaces comparées. Le contraste des contrôles de `dons.html` est validé par Axe sur les profils desktop et mobile.

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

La phase 3 confirme que cette migration n’est pas encore sûre : le détail des références et des assets historiques conservés est documenté dans `docs/debt-inventory.md`.
