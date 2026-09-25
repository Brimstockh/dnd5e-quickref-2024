# Architecture de navigation

## Source canonique

`js/site-navigation.js` contient les cinq espaces publics et leurs liens. Chaque entrée est un objet qui définit un identifiant, un libellé, une description, une URL, un groupe éventuel, une icône, un `category`, un `type` et ses correspondances d’URL (`matches`).

La section et l’entrée actives sont résolues depuis le chemin URL par `navigationContextForPath()`. Les attributs HTML `data-active` restent uniquement un fallback de compatibilité et ne constituent plus la source d’autorité.

Les matchers déclaratifs couvrent aussi les pages enfants :

- `classes/` → Création / Classes ;
- `races/` → Création / Espèces ;
- `html/character.html` et `html/character-profile.html` → Ma table / Personnages sauvegardés.

Cette configuration est consommée par :

- la navigation desktop et mobile de `js/site-shell.js` ;
- l’explorateur de `index.html` ;
- les cinq pages hub ;
- la génération de `data/search-index.json` et `data/search-index-deep.json`, où `section` décrit l’espace principal et `category`/`type` le contenu précis ;
- `data/content-inventory.json` et `scripts/validate-navigation-architecture.mjs`.

Une page publique ne doit pas redéfinir indépendamment la liste des espaces ou des ressources.

## Ajouter une page

1. Créer la page HTML à son emplacement public, sans déplacer ni renommer une URL existante.
2. Ajouter un lien dans l’espace concerné de `js/site-navigation.js`.
3. Ajouter un matcher `matches` si la page possède des enfants partageant la même entrée de navigation.
4. Ajouter un `data-library-section` explicite seulement si la page possède une représentation locale particulière ; les pages canoniques sont classées automatiquement par leur URL.
5. Si la page contient un contenu indexable qui n’est pas déjà couvert par les familles de données, l’ajouter à `scripts/build-search-index.mjs`.
5. Régénérer puis vérifier les index :

```text
npm run build:search
npm run build:inventory
npm run check:site-navigation
npm run check:search
npm run check:inventory
```

7. Ajouter la page à la liste de précache de `service-worker.js` si elle doit être disponible hors connexion comme les autres pages principales, puis incrémenter `CACHE_VERSION`.

## Accueil et hubs

L’accueil garde le hero, la recherche et les raccourcis d’usage dans `index.html`. Le bloc « Explorer le site » est rendu depuis la source canonique. Les hubs utilisent le même mécanisme pour présenter chaque lien sans recopier les listes dans cinq pages HTML.
