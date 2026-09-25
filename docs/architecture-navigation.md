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
6. Régénérer puis vérifier les index :

```text
npm run build:search
npm run build:inventory
npm run check:site-navigation
npm run check:search
npm run check:inventory
```

7. Ajouter la page à la liste de précache de `service-worker.js` si elle doit être disponible hors connexion comme les autres pages principales, puis incrémenter `CACHE_VERSION`.

## Identité visuelle des espaces

Les cinq espaces canoniques déclarent aussi leur identité visuelle dans `js/site-navigation.js` :

- `artwork.src` et `artwork.position` définissent l’illustration et son cadrage ;
- `accent` définit la couleur de section ;
- `actionLabel` définit le CTA de l’accueil.

Les couleurs officielles sont `#6f91aa` pour Règles, `#809b65` pour Compendium, `#b38a45` pour Création, `#98778f` pour Univers et `#a14b42` pour Ma table. L’accueil et les cinq hubs projettent ces propriétés via les variables CSS `--section-accent`, `--section-artwork` et `--section-artwork-position`.

Les surfaces illustrées utilisent une palette locale claire (`--visual-text`, `--visual-text-muted`, `--visual-text-subtle`) indépendante du thème global. `section-visual` sert aux cartes de sections et aux hubs ; `page-feature` conserve son layout éditorial propre, mais partage ces tokens, les positions d’artwork et trois intentions d’overlay (`hero`, `card`, `compact`). La hiérarchie visuelle préparée pour la Passe D est : espace immersif, catalogue/famille avec hero compact, puis entrée individuelle avec illustration spécifique si disponible.

Les trois pages pilotes de la Passe D sont `classes/index.html`, `spells.html` et `monstres.html`. Classes réutilisera `classes-heroes.webp` comme hero spécialisé de Création ; Sorts et Monstres conserveront leurs interfaces denses et pourront recevoir un hero compact basé sur le thème Compendium, sans étendre l’artwork du hub à chaque ligne de catalogue.

## Métadonnées de recherche

Les trois métadonnées ont des responsabilités distinctes :

- `section` désigne l’espace fonctionnel principal : `Règles`, `Compendium`, `Création`, `Univers` ou `Ma table` ;
- `category` désigne la famille éditoriale précise, par exemple `Sort`, `Monstre`, `Classe`, `Glossaire` ou `Règle de campagne` ;
- `type` désigne la nature structurelle de l’entrée indexée, par exemple `page`, `spell`, `monster`, `class`, `class-feature`, `glossary` ou `campaign-rule`.

Les entrées de `SITE_SECTIONS` décrivent uniquement des pages de navigation et utilisent donc toujours `type: "page"`. Le contenu profond conserve son type spécialisé : `Sorts` est `section: Compendium`, `category: Sort`, `type: page`, tandis que `Boule de feu` est `section: Compendium`, `category: Sort`, `type: spell`.

## Accueil et hubs

L’accueil garde le hero, la recherche et les raccourcis d’usage dans `index.html`. Le bloc « Explorer le site » est rendu depuis la source canonique. Les hubs utilisent le même mécanisme pour présenter chaque lien sans recopier les listes dans cinq pages HTML.
