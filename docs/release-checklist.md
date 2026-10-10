# Checklist de release

## Tests

- [ ] `npm test`
- [ ] `npm run check:content`
- [ ] `npm run test:browser`
- [ ] audit axe sur les pages représentatives
- [ ] installation, navigation offline et mise à jour PWA
- [ ] `npm run build:pages` puis `npm run check:pages`
- [ ] tests navigateur sur `_site` (`STATIC_ROOT=_site`)

## Desktop

- [ ] 1440 px
- [ ] 1024 px

## Mobile

- [ ] 768 px
- [ ] 480 px
- [ ] 390 px

## Thèmes et accessibilité

- [ ] thème clair
- [ ] thème sombre
- [ ] navigation clavier et focus visible
- [ ] `prefers-reduced-motion`

## Fonctionnel

- [ ] recherche globale
- [ ] filtres et tableaux
- [ ] navigation des cinq espaces
- [ ] calculateur de combat
- [ ] statistiques de dés
- [ ] offline
- [ ] mise à jour PWA

## Déploiement

- [ ] GitHub Pages
- [ ] chemins sous `/dnd5e-quickref-2024/`
- [ ] manifest
- [ ] service worker et version de cache
- [ ] aucun JSON build/audit uniquement dans `_site`
