# Bilan de consolidation `refacto`

> État vérifié le 29 septembre 2026 sur la branche `refacto`.

## Conclusion

La consolidation technique est prête à être clôturée comme un lot cohérent. Les phases de publication, PWA, extraction du shell, pilote CSS, audit des assets, provenance, performance, observabilité et documentation ont produit des contrôles reproductibles sans modifier les URLs publiques ni les contrats de stockage.

Le bestiaire reste volontairement sur sa surface legacy : ses statblocks, images, options et exports constituent une interface spécialisée. Une migration mécanique ne fournirait pas de gain net mesuré. Les 24 assets sans référence détectée restent également conservés jusqu’à vérification de leurs URLs publiques ou historiques.

## État mesuré

| Domaine | Résultat actuel |
| --- | ---: |
| Pages HTML contrôlées | 63 |
| Entrées indexées | 2 483 |
| Liens cassés | 0 / 63 pages |
| Sources enregistrées | 6 |
| Entrées avec provenance effective | 1 472 / 2 483 |
| Assets | 2 038 fichiers, 171 668 005 octets |
| Assets sans référence détectée | 24 |
| Index de recherche principal | 509 701 octets |
| Index de recherche profond | 598 462 octets |
| Précache PWA | 44 ressources, 1 459 987 octets / 1 600 000 |
| Erreurs critiques du rapport qualité | 0 |

Les détails Lighthouse sont conservés dans [`reports/lighthouse/baseline.json`](../reports/lighthouse/baseline.json) et synthétisés dans [`reports/quality.json`](../reports/quality.json). Le baseline utilise Lighthouse `12.8.2` sur six pages en preset desktop ; il reste informatif tant qu’une série de mesures comparables n’a pas permis de fixer des seuils CI.

## Changements consolidés

- Le workflow Pages est la chaîne unique : recette, audit, Chromium/Playwright, puis build et déploiement conditionnels à la réussite de la qualité.
- Le shell global a été réduit par l’extraction de huit modules `js/shell/`, dont le dialogue de recherche et son chargement différé.
- Le précache est limité à l’App Shell et respecte son budget ; les catalogues lourds restent en cache runtime.
- `dons.html` utilise le catalogue partagé, ses filtres modernes et ses contrôles responsive. `monstres.html` conserve le catalogue legacy spécialisé.
- L’audit d’assets est déterministe et ne supprime aucun fichier sans preuve de rupture d’URL inexistante.
- La provenance est compacte dans les index via `sourceRefsByType`, avec résolution compatible des références spécifiques et par type.
- Les budgets de données, PWA et qualité sont intégrés aux audits et au rapport déterministe.
- Le protocole et la grille de test utilisateur sont prêts dans [`usability-test-plan.md`](usability-test-plan.md) et [`usability-test-results-template.md`](usability-test-results-template.md). Aucun résultat UX n’est inventé avant les sessions réelles.

## Validation exécutée

- `npm run recette` : OK.
- `npm run audit` : OK, rapport généré sans erreur critique.
- Suite navigateur Chromium complète : 93 tests réussis, 3 tests volontairement ignorés sur mobile pour les scénarios PWA limités au desktop.
- Scénario catalogue Dons : OK sur desktop et mobile.
- Audit axe Dons : OK sur desktop et mobile.
- `git diff --check` : OK.

Le rapport `reports/quality.json` conserve le nombre de déclarations de tests (`238` Node et `20` navigateur) ; ce compteur est distinct du résultat d’exécution Playwright indiqué ci-dessus.

## Dette explicitement conservée

- Les familles d’entrées encore sans provenance effective sont principalement les sorts, monstres, backgrounds, actions rapides, conditions, mouvements et pages génériques. Leur attribution nécessite une source éditoriale vérifiable, pas une valeur par défaut.
- Les anomalies éditoriales de monstres, traductions non résolues et anomalies d’objets magiques restent des audits informatifs.
- Les seuils Lighthouse ne sont pas bloquants ; les scores sont comparables uniquement dans un environnement de mesure identique.
- Le bestiaire legacy fera l’objet d’une migration séparée uniquement si un gain mesuré, un besoin UX ou une réduction de maintenance justifie le risque sur ses statblocks, images et exports.

## Statut de livraison

La branche courante est `refacto`. Le HEAD reste inchangé (`4e7873d5ff05da1900d37421ce4ad04594bf1176`) : les modifications sont présentes dans le working tree et aucun commit, merge ou pull request n’a été créé. Une validation humaine des parcours et une décision explicite sur le commit restent les dernières actions de livraison.
