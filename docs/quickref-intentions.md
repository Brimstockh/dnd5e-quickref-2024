# Intentions de la référence rapide

La section « Que voulez-vous faire ? » est alimentée par `js/data_intentions.js`. Une intention ne contient pas le texte d'une règle : elle référence une fiche canonique par `{ parameter, slug }`.

## Ajouter une intention

Ajoutez un objet avec un `id` stable, un `title`, une `category`, une `description`, un `order` et au moins une référence dans `primaryRule` ou `relatedRules`.

Les cinq catégories disponibles sont `combat-defense`, `movement`, `magic`, `allies-states` et `exploration`. Une fiche peut être réutilisée par plusieurs intentions sans être dupliquée.

Exemple :

```js
{
    id: "exemple-situation",
    title: "Je veux…",
    category: "combat-defense",
    description: "Une courte aide à la décision.",
    cost: "Le coût ou la contrainte, si elle est connue",
    primaryRule: { parameter: "action", slug: "attaquer" },
    relatedRules: [{ parameter: "general", slug: "coup-critique" }],
    order: 90
}
```

Les paramètres correspondent aux catalogues chargés par `quickref.html` : `movement`, `action`, `bonus`, `reaction`, `condition`, `environment` et `general`. Le slug est celui produit par `DndCatalogUI.slugify` à partir du titre de la fiche.

## Ajouter une règle générale

Ajoutez la fiche dans `js/data_general.js`, puis utilisez `parameter: "general"` dans les intentions. Elle apparaîtra dans la section « Règles générales », sera sélectionnable par `quickref.html?general=slug` et sera indexée par la recherche après `npm run build:search`.

## Valider les références et les liens

`npm run check:intentions` vérifie les identifiants, catégories, doublons et références vers les catalogues. Les liens directs d'une fiche utilisent un paramètre de sélection, par exemple `quickref.html?action=attaquer` ou `quickref.html?general=coup-critique`.

Pour vérifier l'ensemble des URLs du site, lancer `npm run check:navigation`. Les tests ciblés sont exécutés avec `npm test` et les parcours navigateur avec `npm run test:browser`.
