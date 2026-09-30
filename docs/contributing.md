# Contribuer

## Principe

Privilégier les changements incrémentaux dans l’architecture HTML/CSS/JavaScript existante. Le projet n’utilise pas de framework frontend : une fonctionnalité doit rester compatible avec HTML statique, modules ES, génération Node et GitHub Pages.

Avant de coder, identifier le contrat concerné : URL, identifiant de contenu, JSON, clé de stockage, événement, style responsive ou comportement clavier. Préserver les URLs publiques et les données locales existantes.

## Développement local

Installer les dépendances et lancer les contrôles utiles :

```bash
npm ci
npm run recette
npm run audit
npm run test:browser
```

Pour consulter le site manuellement, utiliser un serveur HTTP local plutôt que `file://` :

```bash
python -m http.server 8000
```

## Nouvelle fonctionnalité

Utiliser cette checklist dans la description de la PR :

```text
[ ] navigation mise à jour
[ ] recherche/index mis à jour
[ ] sources déclarées
[ ] contrats JSON ou stockage vérifiés
[ ] tests Node ajoutés ou adaptés
[ ] test Playwright ajouté si nécessaire
[ ] responsive vérifié à 390 px et desktop
[ ] accessibilité clavier/focus vérifiée
[ ] offline ou précache évalué si concerné
[ ] recette et audit verts
```

## Contenu et assets

Les nouveaux contenus doivent avoir un identifiant stable, une URL canonique, une catégorie et une provenance exploitable lorsque la source est connue. Après une modification structurée, régénérer les index puis exécuter les checks de contrats, d’inventaire, de liens et de provenance.

Pour une image, vérifier les références, le poids, les dimensions et l’existence d’une variante moderne avant de l’ajouter. Utiliser `npm run audit:assets` et ne pas supprimer un original sans vérifier ses fallbacks et ses URLs.

## CI et publication

`.github/workflows/pages.yml` exécute la recette, l’audit qualité et les tests navigateur/axe dans un job requis par le build Pages. Les pull requests valident sans publier. Seul un push ou un lancement manuel sur `main` peut déclencher le build puis le déploiement.

Une PR doit expliquer le comportement modifié, les contrats préservés, les commandes exécutées et les points restant à surveiller. Ne pas contourner un test cassé en le supprimant ou en affaiblissant arbitrairement ses assertions.
