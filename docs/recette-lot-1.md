# Recette du Lot 1 — Fondations

Date : 23 juillet 2026

## Commande de validation

```text
npm run recette
```

Cette commande :

1. reconstruit l’index de recherche ;
2. vérifie qu’il est synchronisé avec le dépôt ;
3. exécute toute la suite de tests.

Résultat de référence : **86 tests réussis sur 86**.

## Résultats fonctionnels

| Parcours | Résultat |
| --- | --- |
| Chargement sous le sous-chemin `/dnd/` | Réussi |
| Manifeste et service worker | Enregistrés, statut `ready` |
| Navigation vers une page précachée sans serveur | Réussie |
| Page inconnue hors connexion | Écran de repli affiché |
| URL de sort avec filtres et sélection | État restauré |
| Ancre d’une page de classe | Source et lien GitHub corrects |
| Métadonnées de source | Affichées avant le bloc de contribution |
| Issue GitHub préremplie | URL, contenu, catégorie et fichier présents |
| Thème, favoris et mode session après rechargement | Conservés |
| Feuille autonome après sauvegarde et rechargement | Conservée |

## Matrice d’affichage vérifiée

| Dimensions | Contrôles | Résultat |
| --- | --- | --- |
| 1440 × 900 | Accueil, catalogue, navigation profonde | Réussi |
| 768 × 1024 | Classe, provenance, contribution | Réussi |
| 390 × 844 | Navigation mobile, partage, cibles tactiles, débordement | Réussi |

Les liens tactiles du bloc de contribution mesurent 44 px de haut et aucun
débordement horizontal n’a été détecté aux dimensions testées.

## Publication continue

Les workflows de tests et de publication exécutent tous deux
`npm run recette`. La publication GitHub Pages reste réservée à `main` et
n’est pas déclenchée pour une pull request.

## Vérifications restant à faire après publication

- installation réelle sur Chrome Android ;
- ajout à l’écran d’accueil et mode autonome sur Safari iOS ;
- passage visuel dans Firefox et Edge ;
- contrôle du site public après déploiement sur GitHub Pages ;
- création réelle d’une issue de test, sans la publier inutilement pendant la recette locale.
