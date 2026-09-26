# QA navigateur

Le socle QA navigateur utilise Playwright avec Chromium et un serveur statique Node local. Il ne dépend pas de GitHub Pages.

## Commandes

```text
npm run check:content
npm run test:browser
npm run test:browser -- --project=chromium-desktop
npm run test:browser -- --project=chromium-mobile
npm run test:browser:headed
```

Les projets couvrent un viewport desktop `1440 × 900` et un viewport mobile `390 × 844`. Les tests sont dans `tests/browser/` et vérifient les familles représentatives, la navigation canonique, la recherche, les catalogues principaux, le calculateur de combat, les statistiques de dés et les violations axe critiques/sérieuses.

En CI, les traces, captures et rapports HTML Playwright sont conservés comme artefacts lorsque le job navigateur échoue.

## Limites actuelles

- Les tests de performance Lighthouse ne sont pas encore bloquants.
- Les tests utilisateurs réels restent à exécuter avec des personnes.
- L’audit axe porte sur les pages représentatives et les impacts critiques/sérieux.
