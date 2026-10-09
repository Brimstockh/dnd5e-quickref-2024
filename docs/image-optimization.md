# Politique d’optimisation des images

Cette politique conserve les URL publiques, les formats de secours et les dimensions utiles au zoom. Toute optimisation doit être reproductible, produire un fichier strictement plus petit et être suivie d’une vérification des dimensions, des chemins et des tests navigateur.

## Portraits de monstres

Les 485 WebP de `img/enemies/` sont produits avec `npm run optimize:monsters`, qui utilise FFmpeg WebP qualité 80, sans filtre de redimensionnement. Un résultat plus lourd est ignoré ; les noms, dossiers et dimensions restent donc inchangés. La passe de la phase 2 a réduit le poids de 112 254 494 à 93 824 848 octets, soit 18 429 646 octets économisés.

Les 19 portraits absents signalés par `npm run check:monster-images` correspondent à des entrées de données sans illustration source connue. Ils ne sont pas inventés ni remplacés par une image arbitraire.

## Faerûn et familles illustrées

`img/map/faerun-map.jpg` reste le téléchargement HD et `img/map/faerun-map.webp` reste le format affiché ; les deux chemins sont utilisés par `faerun.html`. Les cartes régionales conservent leurs paires WebP attendues. Les PNG de secours et les formats cartographiques ne sont pas supprimés sans comparaison visuelle.

`assets/images/classes-heroes.webp` et `assets/images/table-adventurers.webp` sont identiques bit à bit, mais servent deux emplacements publics différents. Le faible gain théorique ne justifie pas de modifier ces URL.

Les scripts `convert-images.mjs` et `convert-vip-images.mjs` restent conservés pour les conversions administratives manuelles et les contrôles de provenance.
