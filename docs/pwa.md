# Stratégie PWA

## App Shell

`service-worker.js` précache uniquement les ressources nécessaires à l’ouverture et à l’exploration initiale :

- accueil, cinq hubs et `offline.html` ;
- manifest, icônes et service worker ;
- CSS et modules JavaScript du shell ;
- index de recherche principal et métadonnées nécessaires ;
- illustrations des hubs prioritaires ; les visuels secondaires restent en cache runtime.

Les catalogues, pages spécialisées et index profonds sont chargés à la demande. Une nouvelle page ne doit rejoindre l’App Shell que si elle est réellement critique pour le démarrage ou la navigation hors connexion.

## Stratégies runtime

- navigation HTML : network-first, puis page consultée, accueil et `offline.html` ;
- JSON : stale-while-revalidate, maximum 30 entrées ;
- CSS/JavaScript/fonts : stale-while-revalidate, maximum 80 entrées ;
- pages HTML consultées : maximum 40 entrées ;
- images : cache-first, maximum 60 entrées.

L’installation précache les ressources indépendamment. Une ressource secondaire indisponible est ignorée et ne bloque pas l’installation complète.

## Mise à jour

Le contrat de cache est versionné par `CACHE_VERSION` dans `service-worker.js`. Incrémenter cette version lorsque la liste App Shell ou la structure des caches change. L’activation purge les caches `dnd-companion-*` des versions précédentes. Le client affiche la mise à jour disponible et envoie `SKIP_WAITING` après confirmation de l’utilisateur.

## Validation

Les tests Node vérifient la liste et le poids du précache, l’installation tolérante et la purge des anciennes versions. Les tests Playwright couvrent l’installation, la navigation en ligne, une page consultée puis disponible hors connexion, le fallback d’une page jamais visitée et la mise à jour du worker.

## Modifier la stratégie

Avant d’ajouter une ressource à `CORE_ASSETS`, mesurer son utilité pour l’ouverture, la navigation et le premier parcours hors connexion. Les catalogues et données volumineuses restent chargés à la demande.

Après toute modification de `service-worker.js` :

```bash
npm run audit
npm test -- tests/pwa.test.mjs
npm run test:browser -- --project=chromium-desktop
```

Le budget partagé du précache est de 1 500 000 octets (`scripts/pwa-budget.mjs`), soit 1,5 Mo décimal. Une évolution qui change la liste ou les noms de caches doit faire évoluer `CACHE_VERSION`; la purge des versions précédentes est vérifiée par les tests. Les visuels secondaires des pages spécialisées restent chargés à la demande et rejoignent ensuite le cache runtime borné.
