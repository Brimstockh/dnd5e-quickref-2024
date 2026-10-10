# Audit JavaScript et CSS — phase 2

L’audit `npm run audit:code` couvre les 61 fichiers JavaScript de `js/` et les 25 feuilles CSS de `css/`. Il mesure les lignes, les chargements HTML et les imports dynamiques sans supprimer automatiquement un fichier : les scripts classiques, les modules PWA et les modules chargés par `site-shell.js` restent protégés.

État de référence de cette branche : 13 009 lignes JavaScript et 7 678 lignes CSS. Aucun fichier JS/CSS vide n’est présent. Les 15 fichiers JS non référencés directement par une balise HTML sont des modules chargés dynamiquement par le shell partagé, le service worker ou les mécanismes de recherche, partage et navigation ; ils ne sont pas des orphelins démontrés.

Les feuilles CSS sont toutes chargées par au moins une page. Le wrapper historique `scripts/convert-vip-images.mjs` est conservé pour les usages manuels, tandis que `assets:vip` pointe directement vers le convertisseur générique pour éviter une indirection dans le chemin courant.

Le contrôle reproductible est `npm run check:code`. Toute suppression future doit ajouter une preuve de chargement, un test de contrat ou une comparaison navigateur avant modification.
