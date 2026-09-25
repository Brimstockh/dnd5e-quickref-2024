# Architecture de navigation

## Source canonique

`js/site-navigation.js` contient les cinq espaces publics et leurs liens. Chaque espace définit un identifiant, un libellé, une description, une URL de hub, une icône, ses éventuels sous-groupes et ses liens.

Cette configuration est consommée par :

- la navigation desktop et mobile de `js/site-shell.js` ;
- l’explorateur de `index.html` ;
- les cinq pages hub ;
- la génération de `data/search-index.json` et `data/search-index-deep.json` ;
- `data/content-inventory.json` et `scripts/validate-navigation-architecture.mjs`.

Une page publique ne doit pas redéfinir indépendamment la liste des espaces ou des ressources.

## Ajouter une page

1. Créer la page HTML à son emplacement public, sans déplacer ni renommer une URL existante.
2. Ajouter un lien dans l’espace concerné de `js/site-navigation.js`.
3. Ajouter un `data-library-section` explicite si la page possède une représentation locale particulière ; les pages canoniques peuvent aussi être classées automatiquement par leur URL.
4. Si la page contient un contenu indexable qui n’est pas déjà couvert par les familles de données, l’ajouter à `scripts/build-search-index.mjs`.
5. Régénérer puis vérifier les index :

```text
npm run build:search
npm run build:inventory
npm run check:site-navigation
npm run check:search
npm run check:inventory
```

6. Ajouter la page à la liste de précache de `service-worker.js` si elle doit être disponible hors connexion comme les autres pages principales, puis incrémenter `CACHE_VERSION`.

## Accueil et hubs

L’accueil garde le hero, la recherche et les raccourcis d’usage dans `index.html`. Le bloc « Explorer le site » est rendu depuis la source canonique. Les hubs utilisent le même mécanisme pour présenter chaque lien sans recopier les listes dans cinq pages HTML.
