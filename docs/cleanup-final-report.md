# Bilan de nettoyage et consolidation

## Périmètre

Audit historique des phases 1 à 4, désormais intégré dans `dbbb6de` sur `chore/cleanup-optimization-phase2`. La stabilisation finale est suivie séparément dans `docs/cleanup-stabilization-report.md`.

## Résultats quantifiés

| Indicateur | État initial | État courant | Évolution |
| --- | ---: | ---: | ---: |
| Assets visuels | 2 038 | 2 014 | −24 fichiers |
| Taille des assets | 171 668 005 o | 167 878 471 o | −3 789 534 o |
| Assets non référencés | 24 | 0 | −24 |
| Modules `js/` | 61 fichiers / 13 017 lignes | 61 fichiers / 13 009 lignes | −8 lignes |
| Feuilles CSS | 25 fichiers / 9 036 lignes | 25 fichiers / 8 954 lignes | −82 lignes |
| CSS normalisé LF | 352 344 o | 349 710 o | −2 634 o |
| Tests Node | — | 232 réussis | 0 échec |
| Tests navigateur | — | 97 réussis / 3 ignorés | 0 échec |

Les octets CSS sont comparés après normalisation LF afin de ne pas mélanger le contenu avec les fins de ligne locales Windows. Les trois scénarios PWA mobiles ignorés sont conditionnés par la configuration du projet ; aucun test n’est en échec.

## Publication Pages

Le workflow conserve les fichiers nécessaires à l’exécution du site : pages HTML, `assets/`, `img/`, `css/`, `js/`, `data/`, `manifest.webmanifest`, `offline.html` et les deux points d’entrée du service worker. Il exclut désormais les fichiers internes suivants : `.github/`, scripts, tests, rapports, schémas, configuration Node/Playwright et métadonnées de dépôt.

Sur l’archive Git mesurée avant les changements locaux non commités : 2 436 fichiers et 180 930 560 octets de tar brut avant filtrage, contre 2 318 fichiers et 180 275 200 octets après filtrage, soit 118 fichiers et 655 360 octets évités. `docs/`, `README.md`, `LICENSE.md` et `SOURCES.md` sont conservés pour préserver leurs URL directes.

La passe de stabilisation ajoute une exclusion ciblée des six JSON build/audit uniquement ; les données runtime restent publiées et sont contrôlées par `npm run check:pages`.

## Éléments conservés volontairement

- `css/legacy-catalog.css` et `js/legacy-catalog-ui.js` restent nécessaires à `monstres.html` ;
- les fallbacks PNG, les deux formats de la carte de Faerûn et les chemins dynamiques du bestiaire restent conservés ;
- `sw.js`, `service-worker.js`, le manifest et les ressources du précache restent publiés ;
- les 19 images de monstres signalées manquantes par le contrôle existant n’ont pas été inventées ni masquées.

## Validations

- `npm run audit` : réussi ;
- `npm run recette` : 235/235 tests Node réussis ;
- `npm run test:browser` : 97 tests réussis, 3 ignorés, 0 échec ;
- comparaisons CSS desktop et mobile : styles calculés et dimensions identiques sur `dons.html`, `classes/index.html` et `monstres.html` ;
- `git diff --check` : réussi, avec seulement les avertissements de conversion CRLF/LF de Git sous Windows.

Le commit de stabilisation finale reste à créer après autorisation explicite.
