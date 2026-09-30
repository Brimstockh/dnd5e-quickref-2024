# Roadmap technique — état de référence

> Phase 0 du chantier de consolidation — relevé effectué le 28 septembre 2026.

## Périmètre et état général

Le projet est un site statique francophone D&D 2024 publié sur GitHub Pages. Il ne possède ni backend ni framework frontend : les pages HTML, les feuilles CSS et les modules JavaScript sont servis directement, avec des données JSON générées ou consommées côté navigateur.

Le dépôt est actuellement propre côté fonctionnalité et dispose déjà d’une base de contrats, d’index et d’audits importante. La consolidation doit donc rester incrémentale : les URLs publiques, les formats JSON et les clés de stockage local sont des contrats à préserver.

## Validation de référence

| Commande | Résultat | Observation |
| --- | --- | --- |
| `npm ci` | OK | 5 paquets installés, 0 vulnérabilité signalée. |
| `npm run recette` | Échec connu | Tous les contrôles structurels passent ; `npm test` compte 212 succès et 1 échec sur le budget de `data/magic-items.json` (628 421 octets pour 620 000 autorisés). |
| `npm run test:browser` | Scénarios validés | 82 tests lancés sur Chromium desktop et mobile : 80 OK, 2 ignorés sur mobile car les scénarios PWA sont limités au desktop. Le runner ne libère pas proprement son processus de terminaison dans cet environnement après les tests ; les erreurs initiales de navigateur provenaient uniquement de Chromium absent, ensuite installé par `npx playwright install chromium`. |

Le premier passage de `check:inventory` a aussi révélé une différence de fins de ligne : le fichier généré était versionné en CRLF tandis que le générateur compare du LF. La normalisation de `data/content-inventory.json` est mécanique et ne change pas les données ; ce point doit être stabilisé dans la CI pour éviter une dépendance à la plateforme.

## Architecture actuelle

### Organisation des sources

Les principaux répertoires sont :

- `*.html`, `classes/`, `races/`, `html/` : pages publiques et feuilles/personnages ;
- `js/` : 53 fichiers JavaScript, environ 570 ko ;
- `css/` : 25 feuilles, environ 360 ko ;
- `data/` : 62 JSON, environ 4,1 Mo ;
- `scripts/` : 22 scripts Node de génération, validation et serveur statique ;
- `schemas/` : contrats JSON ;
- `tests/` : 49 fichiers Node Test Runner et 6 fichiers Playwright ;
- `assets/` et `img/` : éléments visuels et illustrations ;
- `.github/workflows/` : workflows de recette/publication et de tests.

Le dépôt contient 69 fichiers HTML. Le contrôle de contenu couvre 63 pages HTML et l’inventaire de recherche couvre 57 URLs de pages.

### Navigation

`js/site-navigation.js` est la source canonique de l’architecture publique. Elle déclare exactement cinq espaces : `Règles`, `Compendium`, `Création`, `Univers` et `Ma table`, avec leurs hubs, groupes, URL, catégories et matchers de pages enfants.

Cette source est consommée par le shell, les hubs, la génération de recherche, l’inventaire et `validate-navigation-architecture.mjs`. Les validations actuelles couvrent 35 URL publiques canoniques et 4 608 cibles de navigation sur 57 pages.

### Shell et modules fonctionnels

`js/site-shell.js` est le plus gros module JavaScript : environ 70,8 ko et 1 441 lignes. Il orchestre actuellement :

- chargement dynamique de clients annexes ;
- navigation desktop/mobile et liens profonds ;
- skip link et enrichissement d’accessibilité des formulaires ;
- thème et mode session ;
- partage ;
- recherche globale et gestion du focus ;
- panneau de session ;
- intégration favoris, récents, profils et notes ;
- événements globaux (`dndnavigationready`, `dndlibrarychange`, `dndpersonalchange`).

Les autres zones volumineuses sont `js/character-sheet.js` (environ 60,6 ko), `js/session-tools.js`, `js/content-catalog.js`, `js/monsters-page.js` et `js/creation-wizard.js`. Le shell et `user-library.js` sont référencés par environ 62 pages, avec des chemins différents pour les pages imbriquées.

### Recherche

`js/search-engine.js` fournit la normalisation accent-insensible, le découpage en tokens, les commandes de catégorie, le scoring, une tolérance limitée aux fautes et la mise en évidence des résultats. Les commandes françaises et anglaises sont explicites (`@sort`, `@règle`, `@classe`, etc.).

Les index générés contiennent 2 483 entrées : 1 242 dans l’index principal, 1 241 dans l’index profond, ainsi que 1 166 alias historiques. Le shell charge les index à la demande lors de l’ouverture/recherche, mais le service worker les précache aujourd’hui.

### Stockage local

`js/user-library.js` centralise `DndStorage`, puis expose `DndLibrary`, `DndPersonal` et `DndProfiles`. Les contrats sont documentés dans `data/local-storage-contracts.json` et couvrent six clés versionnées : bibliothèque personnelle, session, brouillon de création, feuille autonome, favoris et récents.

Les migrations sont sauvegardées avant mutation et testées. L’état personnel possède déjà une migration v1 → v2 qui conserve les champs inconnus. Une migration destructive ou un remplacement global de `localStorage` serait donc une régression de contrat.

### Contenu et provenance

Les index et contrats structurés sont déjà présents :

- `data/search-index*.json` pour l’accès global ;
- `data/content-inventory.json` pour le décompte et les pages ;
- `data/content-relations.json` et `data/content-id-aliases.json` pour les relations et compatibilités ;
- `data/content-sources.json` pour les références structurées ;
- `data/source-metadata.json` et `js/source-meta.js` pour les métadonnées affichées au niveau des pages prioritaires ;
- `schemas/` et `validate-content-contracts.mjs` pour les contrats.

La provenance n’est toutefois pas encore homogène : les catalogues structurés exposent des `sourceRef`/`sourcePage` selon les familles, alors que l’interface `source-meta.js` travaille principalement au niveau de la page. Le premier audit transversal couvre désormais les sources enregistrées, les références d’index, les objets magiques, les règles de campagne, le bonus de maîtrise, le Lore et les dates de vérification ; les catalogues historiques sans métadonnée d’entrée dédiée restent à enrichir progressivement.

## Publication et CI

### État au diagnostic (avant la phase 1)

Deux workflows se recouvraient :

- `.github/workflows/tests.yml` installe Node et les dépendances, exécute `npm run recette`, puis les tests Playwright avec Chromium et conserve `playwright-report/` et `test-results/` ; le job navigateur dépend du job structurel ;
- `.github/workflows/pages.yml` exécute `npm run recette` dans un job `build`, prépare l’artefact Pages sur les événements non-PR, puis déploie via `actions/deploy-pages`.

Le workflow Pages ne fait pas `npm ci` et n’exécute pas `npm run test:browser`. Surtout, il ne peut pas dépendre d’un job d’un autre workflow : un run vert de `tests.yml` n’est donc pas une condition du déploiement Pages. C’est le risque P0 principal.

Le workflow Pages est toutefois limité à la branche principale pour le déploiement effectif, conserve un workflow manuel, et supprime les PNG de `img/enemies/` dans l’artefact publié. Cette suppression doit rester explicitement testée avec la validation des chemins et formats.

### Résultat de la phase 1

`.github/workflows/pages.yml` est désormais le workflow unique de qualité et de publication. Son job `quality` exécute `npm ci`, `npm run recette`, l’installation de Chromium et `npm run test:browser` dans cet ordre. Le build Pages dépend de `quality`, et le déploiement dépend du build. Les pull requests et les pushes hors `main` exécutent la qualité sans publier ; un push ou un lancement manuel sur `main` peut publier uniquement après la réussite de cette chaîne. Les rapports `playwright-report/` et `test-results/` sont téléversés comme artefact lorsque le job n’est pas annulé.

## PWA et service worker

`manifest.webmanifest` définit une application standalone, un scope `./`, un démarrage sur `index.html`, la langue française et deux icônes PNG 192/512.

`sw.js` est un point d’entrée de compatibilité qui importe `service-worker.js`. Le worker utilise les caches `core`, `pages`, `data`, `assets` et `images`.

### État au diagnostic (avant la phase 2)

Stratégies actuelles :

- navigation : network-first, puis page mise en cache, accueil ou `offline.html` ;
- JSON : stale-while-revalidate ;
- CSS/JS/fonts : stale-while-revalidate ;
- images : cache-first avec limite runtime de 60 entrées ;
- installation : `cache.addAll()` sur l’ensemble de `CORE_ASSETS`.

Le précache contient 200 ressources et environ 5,96 MiB : 63 HTML, 55 JavaScript, 25 CSS, 20 JSON, 36 images et le manifest. Cette couverture est largement supérieure à un App Shell et rend l’installation atomique dépendante de nombreuses ressources secondaires. Les tests vérifient l’existence des 200 chemins et un fallback offline, mais ne mesurent pas encore explicitement une limite de poids ni la purge/mise à jour sur navigateur réel.

### Résultat de la phase 2

Le précache de la phase 2 (`dnd-companion-v27`) était limité à 38 ressources et environ 1,40 MiB. Les catalogues lourds, l’index profond et les pages spécialisées ne sont pas installés automatiquement ; ils restent disponibles en ligne puis sont conservés dans les caches runtime lorsqu’ils sont consultés.

L’installation précache chaque ressource indépendamment afin qu’une ressource secondaire indisponible ne fasse pas échouer toute la PWA. Les navigations restent network-first avec fallback vers une page déjà consultée, l’accueil puis `offline.html`. Les JSON et assets utilisent stale-while-revalidate avec des limites respectives de 30 et 80 entrées ; les pages runtime sont limitées à 40 entrées et les images à 60. L’activation supprime les caches des versions précédentes.

### Premier lot de la phase 3

Le thème et les raccourcis clavier sont isolés dans `js/shell/theme.js` et `js/shell/keyboard-shortcuts.js`. Le partage et la navigation mobile sont maintenant isolés dans `js/shell/sharing.js` et `js/shell/mobile-navigation.js`. Ces quatre modules critiques rejoignent l’App Shell ; le contrat courant est donc `dnd-companion-v29`, avec 40 ressources et environ 1,40 MiB. `context-share.js` et `related-content.js` restent chargés à la demande.

### Second lot de la phase 3

Le mode session et le panneau de consultation sont isolés dans `js/shell/session-controls.js`. Les profils actifs et les notes personnelles de page sont isolés dans `js/shell/personal-tools.js`. Le shell conserve l’assemblage DOM, le bootstrap et les événements de coordination, mais ne porte plus les détails de ces deux fonctionnalités. Les six modules shell sont chargés explicitement et les quatre nouveaux contrôleurs déjà extraits disposent de tests unitaires ciblés.

Le contrat de précache devient `dnd-companion-v30`, avec 42 ressources pour 1 455 093 octets (environ 1,39 MiB). La hausse reste limitée et les catalogues lourds ne sont toujours pas précachés.

### Troisième lot de la phase 3

Le branchement des déclencheurs de recherche est isolé dans `js/shell/search-trigger.js`, puis le dialogue, le chargement différé des index et le ranking dans `js/shell/search-dialog.js`. Le précache passe à `dnd-companion-v32`, avec 44 ressources ; les catalogues et le deep index restent hors précache.

Le budget de `data/magic-items.json` est également repassé sous sa limite sans perte de données : le JSON a été compacté mécaniquement de 628 421 à 471 460 octets. Une comparaison de parsing avec la version précédente confirme l’identité du contenu.

## CSS et dette legacy

Les plus grosses feuilles sont :

| Fichier | Taille approximative | Constat |
| --- | ---: | --- |
| `css/icons.css` | 89 ko | Très gros fichier d’icônes partagé. |
| `css/components.css` | 49 ko | Composants transverses et recherche. |
| `css/content-page.css` | 33 ko | Pages éditoriales et primitives de contenu. |
| `css/character-sheet.css` | 28 ko | Feuille autonome. |
| `css/legacy-catalog.css` | 18,1 ko | Surface historique du bestiaire. |
| `css/catalog.css` | 15,9 ko | Catalogues consolidés. |
| `css/content-catalog.css` | 12,5 ko | Contenu catalogué. |

`css/theme.css` centralise déjà couleurs, espacements, rayons, ombres, typographie, largeur de contenu, z-index implicites et préférences de mouvement. La dette restante concerne surtout la répartition des responsabilités et les variantes historiques, pas l’absence totale de tokens.

Les usages `legacy-*` restent actifs dans `monstres.html`, `js/legacy-catalog-ui.js`, les tests associés et le précache du service worker. `dons.html` utilise désormais le shell catalogue partagé ; `legacy-catalog.css` (18,1 ko) et `legacy-catalog-ui.js` (8,2 ko) restent nécessaires au bestiaire et ne sont donc pas supprimables à ce stade.

## Assets et poids

L’inventaire courant est dominé par `img/` : 2 024 fichiers pour environ 163,2 MiB. `assets/` ajoute 14 fichiers pour environ 0,56 MiB. Répartition raster/vectorielle :

| Format | Fichiers | Taille |
| --- | ---: | ---: |
| WebP | 612 | 124,35 MiB |
| PNG | 1 369 | 26,45 MiB |
| JPEG | 39 | 12,87 MiB |
| SVG | 18 | 0,05 MiB |

Le fichier le plus lourd est `img/map/faerun-map.jpg` à environ 9,34 MiB, accompagné de `img/map/faerun-map.webp` à environ 3,61 MiB. Le répertoire `img/map/` représente environ 18,2 MiB. Il existe 47 familles avec plusieurs formats, dont 46 couples PNG/WebP ; ces variantes sont candidates à un audit de référence et de nécessité, mais aucune suppression ne doit être faite sans vérifier les fallbacks et les URLs.

Le working tree hors `.git` et `node_modules` représente environ 170 MiB. Le dépôt Git empaqueté représente environ 1,21 GiB (`git count-objects -vH`). Aucune réécriture d’historique ne doit être lancée automatiquement ; une procédure `git filter-repo` restera documentaire et séparée.

## Qualité et budgets existants

Les contrôles actuels couvrent bien les index, contrats, liens, navigation, images spécialisées, métadonnées prioritaires, accessibilité et plusieurs parcours Playwright. La recette affiche cependant plusieurs audits informatifs non bloquants :

- audit qualité des objets magiques : 347 entrées, 92 anomalies éditoriales ;
- monstres : 19 images manquantes et 15 traductions non résolues, signalées sans faire échouer le script ;
- Lighthouse et mesures de chargement réel : non bloquants et non intégrés au budget CI.

Les budgets automatisés portent surtout sur des JSON, quelques modules/outils et deux images hero. Ils ne couvrent pas encore le JavaScript initial, le CSS initial, le nombre de requêtes, le poids du précache ou le coût mobile. Le budget `data/magic-items.json` est maintenant respecté après sa compaction mécanique ; les budgets frontend dédiés restent à construire en phase 9.

## Dette principale et couplages

### Priorité P0

1. La chaîne Pages est maintenant unique et bloquée par la recette, l’audit qualité et les tests navigateur/axe ; il reste à faire évoluer les contrôles critiques au fil des phases.
2. Le précache est ciblé et tolérant ; les données secondaires restent principalement gérées par le cache runtime et doivent conserver leurs budgets mesurés.
3. Les audits éditoriaux incomplets restent informatifs, tandis que l’audit qualité bloque les erreurs d’intégrité et de budget définies.

### Priorité P1

1. `site-shell.js` concentre trop de responsabilités et plusieurs globals (`DndSiteNavigation`, `DndShare`, événements de bibliothèque/personnel).
2. Le CSS est déjà tokenisé mais reste distribué entre composants, catalogues, contenu et legacy avec des variantes qui se recouvrent.
3. Les images PNG/WebP et la carte de Faerûn concentrent l’essentiel du poids publié ; la publication applique une suppression d’artefacts qui doit être remplacée par une politique d’assets contrôlée.

### Priorité P2/P3

1. Les parcours complets création, session et préparation MJ sont désormais couverts par des scénarios Playwright desktop/mobile ; leur stabilité dépend encore de la terminaison locale de Playwright.
2. La recherche est solide sur les accents, alias, catégories et quelques termes anglais, mais le chargement différé et le précache des index doivent être mesurés ensemble.
3. La provenance existe mais doit être uniformisée entre métadonnées de page et entrées structurées.
4. Les budgets frontend et le rapport de qualité global existent désormais ; leur couverture doit être étendue aux audits de provenance, de navigation et de dette restante.

## Dépendances et contrats à préserver

- Node.js versionnée par `.node-version` ; scripts npm et Node Test Runner ;
- Playwright et `@axe-core/playwright` comme dépendances de développement ;
- HTML statique, CSS et JavaScript navigateur sans bundler ;
- `js/site-navigation.js` comme source canonique des espaces et URL ;
- index JSON générés et contrôlés par les scripts `build:*`/`check:*` ;
- identifiants de contenu, alias historiques et fragments de deep link ;
- contrats de `data/local-storage-contracts.json` et migrations de `DndStorage` ;
- manifest, `sw.js`, `service-worker.js`, scope GitHub Pages et fallback `offline.html` ;
- publication GitHub Pages via l’artefact `_site`.

## Risques de régression

- casser une URL publique en déplaçant une page ou un fichier généré ;
- modifier la forme d’un JSON ou un identifiant sans migration/alias ;
- perdre le focus, la restauration de focus, le clavier ou le focus trap lors de l’extraction du shell ;
- rendre une page imbriquée incorrecte sous `/classes/`, `/races/` ou `/html/` ;
- réduire le précache sans conserver l’accueil, les hubs, l’offline et les ressources de navigation ;
- supprimer un PNG qui sert de fallback, d’icône PWA ou de source volontaire ;
- faire dépendre un test ou un déploiement d’une ligne de commande sensible aux fins de ligne Windows/Linux ;
- augmenter le poids initial en chargeant des index ou modules non nécessaires à l’ouverture de la page.

## Objectifs des phases suivantes

### Phase 1 — Publication atomique

Converger vers une chaîne unique et partageable : validation structurelle → tests navigateur/axe → build Pages → deployment. Le déploiement de la branche principale doit être impossible si Playwright ou axe échoue ; les PR doivent exécuter toute la recette sans publier ; les rapports doivent être conservés en cas d’échec.

### Phase 2 — PWA ciblée (réalisée)

Le précache est réduit à l’App Shell, aux hubs, à l’offline, au manifest, aux icônes et aux ressources minimales. Les stratégies network-first/stale-while-revalidate/runtime sont bornées et les tests couvrent l’installation, la mise à jour, la purge, la ressource déjà visitée et le fallback jamais visité. La stratégie est détaillée dans `docs/pwa.md`.

### Phase 3 — Architecture frontend (lots 1 à 3 réalisés)

Le thème, les raccourcis clavier, le partage, la navigation mobile, le mode session, les outils personnels, les déclencheurs et le dialogue de recherche sont isolés dans les huit modules de `js/shell/`. `site-shell.js` conserve le bootstrap et leur fournit les dépendances explicites. Les responsabilités restantes du shell doivent encore être réduites progressivement.

### Phase 4 — CSS (premier lot réalisé)

Les niveaux de superposition récurrents sont maintenant centralisés dans `css/theme.css` et consommés par les feuilles de shell, catalogues, filtres legacy, quick reference et contenu catalogué. L’inventaire des usages legacy est documenté dans `docs/css-audit.md`. `dons.html` a servi de pilote et ne dépend plus de `legacy-catalog.css` ni de `legacy-catalog-ui.js` ; `monstres.html` reste à évaluer séparément, notamment pour ses statblocks et ses images.

### Phase 5 — Assets (premier lot réalisé)

`npm run audit:assets` génère `data/assets-report.json` avec 2 038 fichiers pour 171 668 005 octets. Le rapport couvre les dimensions détectables, les variantes PNG/WebP/AVIF, les références exactes ou dynamiques connues et les recommandations de conservation. Il identifie 24 assets sans référence détectée, 46 PNG disposant d’une variante moderne et 8 assets dépassant 500 ko, dont les deux variantes de la carte Faerûn. `npm run check:assets` vérifie que le rapport versionné reste déterministe et bloque un PNG d’au moins 500 ko dépourvu de variante WebP/AVIF.

### Phase 6 — Parcours critiques (premier lot réalisé)

`tests/browser/journeys.spec.mjs` couvre les trois parcours prioritaires sur Chromium desktop et mobile : recherche vers un contenu puis retour au mode session, assistant de création vers feuille et profil, et préparation MJ avec favori, note, liste personnelle et session. Le shell mobile expose désormais les accès « Espace personnel » et « Mode session » dans le drawer ; le scénario catalogue ouvre aussi le panneau de filtres avant la recherche sur petit écran.

### Phase 7 — Recherche globale (premier lot réalisé)

Le moteur conserve le chargement de l’index principal à l’ouverture de la recherche et ne charge l’index profond qu’après la saisie d’une requête. Les abréviations courantes `CA`, `PV`, `AO`, `DD` et `JS` sont normalisées vers leurs notions françaises et les tokens de catégories acceptent les pluriels simples. Les budgets couvrent désormais séparément les index principal et profond ; les cas d’abréviation et de pluriel sont testés au niveau moteur.

### Phase 8 — Provenance et traçabilité (premier lot réalisé)

Le registre `data/content-sources.json` expose maintenant `rulesVersion` et `verifiedAt` pour chaque source. `npm run audit:provenance` vérifie les références inconnues, les champs manquants, les dates futures ou incohérentes et la couverture des contenus structurés prioritaires. L’interface affiche la version des règles et la dernière vérification au niveau des pages ; les fiches Lore affichent aussi leur source et leur section sans modifier leurs URLs.

### Phase 9 — Performance frontend (premier lot réalisé)

L’état de référence mesuré est de 8,7 ko pour l’HTML d’accueil, 69,9 ko de CSS initial, 78,5 ko pour `user-library.js` et `site-shell.js`, 509,5 ko pour l’index de recherche principal et 1,46 Mo pour le précache PWA. Ces valeurs sont maintenant protégées par des budgets dans `tests/performance-budget.test.mjs`. Les clients secondaires GitHub et glossaire sont chargés pendant le temps disponible du navigateur ; le shell, le service worker, les métadonnées de provenance et la recherche restent disponibles immédiatement.

Un baseline Lighthouse reproductible complète désormais ces budgets statiques. `npm run audit:lighthouse` mesure six pages en preset desktop (`1440 × 900`) avec Lighthouse `12.8.2` et écrit une synthèse dans `reports/lighthouse/baseline.json`. Les scores restent informatifs tant qu’aucune série de mesures comparable n’a permis de fixer des seuils CI.

### Phase 10 — Observabilité et qualité continue (premier lot réalisé)

`npm run audit` génère le rapport déterministe `reports/quality.json` avec le nombre de pages, les contenus indexés, les liens contrôlés, la provenance, les assets, le poids des données, le précache PWA et les tests déclarés. Les erreurs critiques — liens cassés, ressources précachées absentes, dépassement du budget PWA, incohérence des index ou gros PNG sans variante moderne — provoquent un code de sortie non nul. Le workflow Pages affiche cette synthèse dans le job de qualité et conserve le rapport comme artifact avant les tests navigateur.

### Phase 11 — Documentation développeur (premier lot réalisé)

La documentation est maintenant regroupée dans `docs/architecture.md`, `docs/content-model.md`, `docs/testing.md`, `docs/pwa.md`, `docs/storage.md` et `docs/contributing.md`. Elle décrit les contrats de navigation, les index générés, les identifiants de contenu, le stockage local versionné, la recette, la PWA, la publication et la checklist d’une nouvelle fonctionnalité. `tests/developer-docs.test.mjs` vérifie que les documents essentiels restent présents et alignés sur les contrats actuels.

Le protocole de test utilisateur est défini dans `docs/usability-test-plan.md` et sa grille de collecte dans `docs/usability-test-results-template.md`. Aucun résultat UX n’est présenté avant des sessions avec de vraies personnes.

### Phase 12 — Suppression de la dette finale (audit de sécurité réalisé)

L’audit final est documenté dans `docs/debt-inventory.md`. Les fichiers `legacy-*`, les templates de compatibilité et le point d’entrée `sw.js` restent utilisés ou nécessaires aux URLs historiques. Les 24 assets non référencés représentent 3,79 Mo, mais sont conservés tant qu’une compatibilité d’URL ou une preuve d’absence d’exposition publique n’est pas établie. Les suppressions déjà réalisées restent protégées par `tests/code-cleanup.test.mjs`.

### Suite des phases 4–5 — Architecture CSS et assets

Réduire les recouvrements CSS en conservant les tokens et migrer les surfaces legacy seulement quand leurs usages et tests sont couverts. Ensuite produire un audit d’assets déterministe et traiter en priorité la carte Faerûn, les couples PNG/WebP et les PNG inutiles dans l’artefact publié.

### Phases 6–8 — Parcours, recherche et provenance

Ajouter des scénarios Playwright de bout en bout sur desktop et mobile pour session, création de personnage et préparation MJ. Mesurer le ranking et le chargement différé de la recherche. Étendre la provenance structurée avec des audits bloquants pour les références inconnues, sources manquantes, versions manquantes et dates incohérentes.

### Phases 9–12 — Mesure, qualité et dette finale

Mesurer avant optimisation le HTML/CSS/JS/données/images, puis faire évoluer les budgets réels pour l’initial load, le mobile, la recherche et le précache. Étendre `npm run audit` aux audits de provenance, de navigation et de dette restante, maintenir la documentation au fil des contrats et supprimer le legacy uniquement après preuve d’absence d’usage et recette complète.

## Critère de sortie des phases 0 et 2

La phase 0 est documentée et la phase 2 est implémentée. Le dépôt conserve son architecture statique et ses URLs ; aucune réécriture fonctionnelle ni suppression d’asset n’a été engagée. Les anomalies de référence de la phase 0 ont été traitées :

1. `data/content-inventory.json` est normalisé pour que la vérification soit indépendante des fins de ligne de l’environnement courant ;
2. le dépassement du budget `data/magic-items.json` est résorbé par compaction sans changement de données ;
3. le précache PWA est mesuré à 38 ressources et 1 462 172 octets, avec installation tolérante et caches runtime bornés.
