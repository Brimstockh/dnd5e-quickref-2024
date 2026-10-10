# Stratégie de tests

## Niveaux

- Tests Node (`tests/*.test.mjs`) : logique pure, contrats JSON, générateurs, stockage simulé et invariants HTML.
- Tests Playwright (`tests/browser/*.spec.mjs`) : navigation, rendu, parcours complets, mobile et interactions.
- Axe : intégré aux tests d’accessibilité Playwright sur les pages représentatives.
- Audits : commandes `check:*`, `audit:*` et `npm run audit` pour les invariants du dépôt et les budgets.

Les tests Node ne nécessitent pas de serveur. Playwright démarre automatiquement `scripts/serve-static.mjs` sur `http://127.0.0.1:4173`. La CI lui transmet `STATIC_ROOT=_site` afin que les tests navigateur exercent l’artefact Pages, et non seulement la racine du dépôt.

## Commandes

```bash
npm test
npm run recette
npm run audit
npm run test:browser
npm run test:browser -- --project=chromium-desktop
npm run test:browser -- --project=chromium-mobile
$env:STATIC_ROOT="_site"; npm run test:browser
```

`npm run recette` est le contrôle structurel avant publication. `npm run audit` génère `reports/quality.json` et échoue sur les erreurs critiques définies. Le workflow Pages exécute ces contrôles avant le build et le déploiement.

## Écrire un test

Une règle de transformation ou une fonction sans DOM doit avoir un test Node ciblé. Une interaction utilisateur — recherche, filtre, dialogue, clavier, focus, mode offline — doit avoir un test Playwright si son contrat ne peut pas être garanti au niveau Node.

Les parcours prioritaires sont couverts dans `tests/browser/journeys.spec.mjs` :

- recherche et retour au mode session ;
- assistant de création, feuille et profil ;
- préparation MJ avec favoris, notes et liste personnelle.

Pour une nouvelle interaction, vérifier au minimum le clavier, le focus visible, l’état vide, l’erreur de chargement et le viewport mobile de 390 px. Ne pas supprimer un test rouge ni réduire son assertion sans corriger la cause ou documenter explicitement le nouveau contrat.

## Débogage

Pour isoler un test navigateur :

```bash
npx playwright test tests/browser/functional.spec.mjs --project=chromium-desktop --debug
npm run test:browser:headed
```

En CI, les traces, captures et rapports Playwright sont conservés en artifact en cas d’échec ou d’annulation non volontaire.
