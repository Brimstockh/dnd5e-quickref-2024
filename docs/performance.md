# Baseline de performance navigateur

Le dépôt conserve un baseline Lighthouse non bloquant dans
`reports/lighthouse/baseline.json`. Il mesure les six pages représentatives
suivantes : accueil, règles, sorts, combat, Faerûn et personnages.

## Reproduire la mesure

Depuis la racine du dépôt :

```bash
npm ci
npm run audit:lighthouse
```

Le script démarre le serveur statique local, utilise Lighthouse `12.8.2` avec
Chromium, le preset desktop, une fenêtre de `1440 × 900` et écrit uniquement
les scores et métriques utiles dans le rapport JSON. Les rapports HTML complets
ne sont pas conservés par défaut.

Le poids indiqué est le poids total des ressources observées par Lighthouse,
et non la taille de l’ensemble du dépôt ou des assets non chargés.

La mesure est informative : elle ne fixe pas encore de seuil CI et ne doit pas
être comparée à une autre machine ou configuration sans conserver le même
environnement. Toute nouvelle mesure remplace volontairement le baseline ;
elle doit donc être examinée comme un changement de données générées.

`npm run audit` recopie ensuite dans `reports/quality.json` une synthèse stable
du baseline, sans son horodatage, afin de permettre la comparaison machine-à-
machine des pages auditées.

Les mesures Lighthouse sont un baseline informatif, dépendant de la version du navigateur, de Lighthouse, du réseau, du serveur local et de la configuration d’émulation. Toute comparaison doit réutiliser la même configuration (`npm run audit:lighthouse`, preset desktop, viewport `1440 × 900`) et porter sur plusieurs exécutions. Ce baseline n’est pas encore un seuil CI strict.
