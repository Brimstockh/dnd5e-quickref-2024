# Lot 2 — Contrats de consultation intelligente

## Identifiants canoniques

Chaque contenu relié utilise un identifiant stable composé d’un type et d’un slug :

```text
spell-boule-de-feu
class-paladin
rule-concentration
glossary-avantage
```

Les identifiants ne doivent pas dépendre d’un index de tableau, d’un titre traduit non normalisé ou d’un chemin de fichier complet.

Le module `js/content-ids.js` centralise la création, la validation et la résolution de ces identifiants. Les anciens identifiants sont conservés dans `data/content-id-aliases.json`. Ce registre de migration n’est pas chargé avec les résultats de recherche et ne pénalise donc pas leur transfert.

## Contrats versionnés

Les contrats JSON du lot 2 sont décrits dans :

- `schemas/search-index.schema.json` ;
- `schemas/content-id-aliases.schema.json` ;
- `schemas/content-relations.schema.json` ;
- `schemas/glossary.schema.json` ;
- `schemas/search-aliases.schema.json`.

Chaque racine de données contient `schemaVersion`. Le champ `version` de l’index de recherche décrit séparément sa version fonctionnelle.

## Règles de compatibilité

- Une URL existante ne doit pas être modifiée uniquement pour adopter un identifiant canonique.
- Les paramètres de sélection continuent d’utiliser les slugs lisibles déjà publiés.
- Un ancien identifiant est accepté comme alias, mais toute nouvelle relation est enregistrée avec l’identifiant canonique.
- Les identifiants et alias doivent être uniques.
- Une relation future doit référencer deux identifiants présents dans le registre de contenus.

## Validation

`npm run check:contracts` vérifie l’index généré :

- version du contrat ;
- identifiants canoniques uniques ;
- cohérence entre identifiant et type ;
- champs obligatoires ;
- URLs sûres ;
- absence de collision entre les alias historiques.

Cette validation fait partie de `npm run recette` et s’exécute donc avant les tests et la publication GitHub Pages.

`npm run check:search` reconstruit les sorties en mémoire et les compare aux fichiers présents. La vérification reste fiable en CI sans dépendre de l’état de l’index Git local.

## Index de relations

Les relations éditoriales sont déclarées avec des identifiants canoniques dans `data/content-relations.source.json`. Le script `scripts/build-relations-index.mjs` complète ces relations avec celles qui peuvent être déduites sans ambiguïté :

- sorts disponibles pour chaque classe ;
- catalogue de sorts filtré pour chaque classe ;
- armes reliées aux maîtrises ;
- historiques reliés à leur don d’origine ;
- dons reliés à leurs prérequis structurés ;
- espèces reliées à la création de personnage ;
- états reliés au glossaire.

La sortie `data/content-relations.json` est normalisée en sources et cibles pour éviter de répéter les titres et URLs. Elle est chargée par `js/related-content.js`, qui affiche les groupes « Prérequis », « Disponible pour », « Règles associées » et « Voir aussi ».

`npm run check:relations` vérifie que cette sortie est à jour. `npm run check:contracts` rejette les identifiants inexistants, relations orphelines, doublons, types inconnus et URLs externes.

## Glossaire interactif

`scripts/build-glossary.mjs` transforme les définitions éditoriales de `glossaire.html` et les alias de `data/glossary-aliases.source.json` en un index versionné. La sortie `data/glossary.json` alimente la recherche, les filtres et les liens profonds de la page.

Le client partagé `js/glossary-client.js` ne parcourt que les zones portant `data-glossary-richtext`. Il transforme au maximum seize termes distincts par zone en boutons accessibles et ouvre leur résumé dans un panneau commun. Les liens, titres, contrôles et blocs de code sont toujours exclus du balisage.

L’URL `glossaire.html?term=<slug>` cible la définition complète. Les paramètres `q`, `category` et `letter` conservent l’état de l’explorateur sans créer d’entrée dans l’historique à chaque frappe.

`npm run check:glossary` garantit que l’index généré est à jour. La validation de contrats contrôle aussi l’unicité des termes et ancres, les catégories, les relations et les URLs internes.

## Recherche globale enrichie

La version 4 de `data/search-index.json` intègre les 71 entrées du glossaire et un tableau `aliases` pour chaque contenu. Les équivalents anglais et synonymes éditoriaux sont maintenus séparément dans `data/search-aliases.source.json`, puis validés contre les identifiants canoniques lors de la génération.

`js/search-engine.js` centralise la normalisation, la tolérance limitée aux fautes, le classement et l’explication des correspondances. Il comprend les commandes `@sort`, `@règle`, `@glossaire`, `@classe`, `@espèce`, `@don`, `@équipement`, `@état`, `@action`, `@monstre` et `@historique`.

Le dialogue partagé surligne les mots trouvés, indique si la correspondance vient du titre, d’un alias, d’un mot-clé ou de l’extrait, et affiche les consultations récentes avant les raccourcis génériques lorsque la recherche est vide. Le moteur accepte également des identifiants suggérés par un futur profil actif sans dépendre de l’existence d’un profil.

## Partage et navigation profonde

`js/context-share.js` ajoute une action « Copier le lien » aux fiches de sorts, dons, monstres, équipements, historiques, entrées de référence rapide et cartes du glossaire. Le lien est reconstruit à partir de l’URL courante : les filtres restent actifs, une seule sélection de contenu est conservée et la cible utilise toujours son slug publié.

Le partage général du shell reprend le titre du contenu actuellement ouvert. Les ancres de section continuent de fonctionner sans JavaScript métier et la restauration d’une ancre ouvre désormais tous ses blocs `<details>` parents avant de déplacer le focus.

Le module observe uniquement les nouveaux nœuds ajoutés afin de couvrir les catalogues rendus dynamiquement sans réexécuter leur logique.

## Validation automatisée

`npm run check:navigation` parcourt toutes les URL exposées par l’index de recherche, les relations et le glossaire. Pour chaque famille partageable, il génère aussi le permalink contextuel attendu.

Le contrôle rejette les destinations externes, chemins absolus ou traversées de répertoire, paramètres inconnus, sélections incompatibles ou multiples, identifiants absents, fichiers manquants et fragments sans ancre correspondante. Les règles de sélection sont importées directement depuis `js/context-share.js` afin que le client et la CI utilisent le même contrat.

La commande fait partie de `npm run recette`. Les workflows de test et de publication l’exécutent donc automatiquement avant toute mise en ligne.
