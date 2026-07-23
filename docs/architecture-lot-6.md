# Lot 6 — consolidation

## Résultat

Le Lot 6 consolide les formats et les contrôles introduits par les lots précédents sans ajouter de dépendance ni de backend.

### Données structurées et validation

- `data/content-inventory.json` inventorie les contenus de recherche par type et par page.
- `data/local-storage-contracts.json` documente les propriétaires, versions et contenus des stockages locaux.
- `schemas/character-creation.schema.json`, `schemas/content-inventory.schema.json` et `schemas/local-storage-contracts.schema.json` formalisent les nouveaux contrats.
- `scripts/build-content-inventory.mjs` génère un résultat reproductible et signale les doublons, URLs invalides et entrées incomplètes.
- `scripts/validate-content-contracts.mjs` vérifie aussi les 38 choix de création, leurs identifiants canoniques, leurs sources et les contrats de stockage.

Commandes :

```text
npm run build:inventory
npm run check:inventory
npm run check:contracts
npm run recette
```

### Migrations locales

`DndStorage.migrateJson(key, options)` :

1. lit la version stockée ;
2. refuse de rétrograder une version plus récente ;
3. crée une copie `<clé>_backup_v<version>` avant mutation ;
4. applique chaque migration dans l’ordre ;
5. valide le résultat ;
6. remplace la valeur uniquement si toute la chaîne réussit.

L’état personnel migre de la version 1 vers la version 2. La migration ajoute `updatedAt` et conserve les propriétés inconnues. Les sauvegardes compagnon v1 restent importables ; les nouveaux exports utilisent le format v2.

Pour une prochaine évolution, ajouter une fonction sous la version de départ :

```js
storage.migrateJson(key, {
    currentVersion: 3,
    migrations: {
        1: migrateV1ToV2,
        2: migrateV2ToV3,
    },
});
```

Une migration doit rester pure, préserver les champs qu’elle ne connaît pas et ne jamais supprimer sa copie de secours.

### Performance et accessibilité

- budgets de taille ajoutés pour les données et outils personnels ;
- préchargement des données nécessaires à l’assistant et au comparateur ;
- limite de rendu conservée à 80 sorts dans l’assistant ;
- focus déplacé vers le titre lors d’un changement d’étape ;
- tableau comparatif nommé, légendé et accessible au clavier ;
- statut des sélections relié à la liste des options.

## Limites assumées

- les pages éditoriales historiques restent majoritairement en HTML ; l’inventaire de recherche constitue la couche structurée commune ;
- les catalogues volumineux restent dans leurs fichiers JSON spécialisés ;
- les tests Safari iOS, Chrome Android et lecteurs d’écran réels demeurent manuels ;
- IndexedDB n’est pas nécessaire au volume actuel.
