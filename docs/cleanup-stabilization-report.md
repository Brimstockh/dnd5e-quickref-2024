# Rapport de stabilisation finale

Date de contrôle : 2026-10-10  
Branche : `chore/cleanup-optimization-phase2`  
Référence Git : `dbbb6de7625c63f991215b5d89d59859c7075d11` (`repo clean up v3`)  
État : modifications de stabilisation vérifiées localement ; aucun commit ni push créé pour cette passe.

## PWA

- Version de cache : `dnd-companion-v33` → `dnd-companion-v34`.
- L’activation purge les caches des versions précédentes, y compris v33 ; les autres origines et les stockages applicatifs ne sont pas touchés.
- Les stratégies restent network-first pour les navigations, stale-while-revalidate pour JSON/CSS/JavaScript et cache-first pour les images, avec les mêmes bornes.
- L’installation tolère toujours l’absence d’une ressource secondaire.
- La notice de mise à jour reste accessible, envoie `SKIP_WAITING` après confirmation, puis recharge après `controllerchange`.

## Artefact Pages

| Mesure | Avant stabilisation | Après stabilisation |
| --- | ---: | ---: |
| Fichiers | 985 | 979 |
| Taille | 137 454 790 o | 137 019 721 o |
| Pages HTML | 63 | 63 |
| JSON | 63 / 4 209 682 o | 57 / 3 772 916 o |
| Fichiers internes exclus | 119 | 125 |

Les six JSON exclus sont des sorties ou sources de build/audit uniquement :
`assets-report.json`, `monster-translations-summary.json`,
`content-id-aliases.json`, `content-relations.source.json`,
`glossary-aliases.source.json` et `search-aliases.source.json`. Les JSON
runtime, les pages attendues, le manifest, les deux service workers et les
ressources du précache restent présents. Le vérificateur contrôle aussi les
références locales HTML/CSS/JavaScript, les chemins dynamiques, le manifest et
le précache.

Ces mesures correspondent au build local avant versionnement de ce rapport ;
le fichier de rapport sera lui-même publié au prochain build après commit.

La CI sert désormais `_site` pendant les tests Playwright afin de tester le
contenu réellement publiable.

## Images

Les 485 WebP de `img/enemies/` ont été comparés aux versions de `f7512eb` sans
relancer l’optimiseur : 0 erreur de décodage, 0 changement de dimensions ou de
ratio, 18 429 646 octets économisés (16,42 %). L’échantillon visuel de 12
images multi-catégories ne montre aucun artefact bloquant ; les SSIM `All`
mesurés vont de 0,970409 à 0,987186. Les 19 portraits manquants restent
inchangés et documentés comme données sans source d’image connue.

## Documentation et état Git

Les contrats PWA, de publication `_site`, de test navigateur, de performance,
de release, d’images, de dette et les rapports des passes précédentes ont été
actualisés. Les seuls changements attendus de cette passe sont les fichiers
suivants : `.github/workflows/pages.yml`, `service-worker.js`,
`scripts/build-pages-artifact.mjs`, `scripts/serve-static.mjs`,
`scripts/verify-pages-artifact.mjs`, `tests/pages-artifact.test.mjs`,
`tests/pwa.test.mjs`, les huit documents de maintenance concernés et ce
rapport. Aucun fichier applicatif ou asset étranger à la mission n’est généré
après suppression du dossier QA temporaire.

## Validations

- `npm run recette` : réussi ; 235 tests Node, 0 échec.
- `npm run audit` : réussi ; 63 pages, 740 assets, 0 asset non référencé, 41 ressources PWA, 0 erreur critique.
- `npm run test:browser` avec `STATIC_ROOT=_site` : 97 réussis, 3 scénarios PWA mobiles ignorés par la matrice prévue, 0 échec.
- `npm run check:pages` : réussi ; 979 fichiers, 63 pages HTML, 0 référence locale brisée.
- `npm run check:icons`, `npm run check:code`, `npm run check:assets` : réussis via la recette.
- `git diff --check` : avertissements de conversion CRLF/LF uniquement, sans erreur d’espacement.

## Décision

Prêt sous réserve de l’autorisation explicite de créer le commit final de
stabilisation. Aucun push ni merge n’a été effectué.
