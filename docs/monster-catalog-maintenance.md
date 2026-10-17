# Maintenance du bestiaire D&D 2024

## Audit initial — 17 octobre 2026

La maintenance est réalisée sur la branche `chore/monster-catalog-cleanup`, créée depuis `main` au commit `c17b3a4`.

### État du catalogue

| Indicateur | État initial |
| --- | ---: |
| Entrées du catalogue | 503 |
| Entrées détaillées | 503 |
| Compteur déclaré dans `monsters_2024_details.json` | 499 — incohérent |
| Traductions françaises confirmées | 488 |
| Traductions non résolues | 15 |
| Portraits WebP | 485 |
| Portraits PNG | 4 |
| Portraits WebP correspondant exactement au catalogue | 484 |
| Portraits attendus mais absents en WebP | 19 |

Les 19 portraits absents comprennent les 15 monstres sans traduction confirmée et quatre images PNG récemment ajoutées :

- `Blob Of Annihilation.png`
- `Empyrean Ioata.png` — le catalogue attend `Empyrean Iota.webp` ; le nom de sortie sera corrigé lors de la conversion
- `Gnoll Fang Of Yeenoghu.png`
- `Minotaur Of Baphomet.png`

Un WebP supplémentaire est conservé et signalé sans suppression : `img/enemies/Undead/Vampire Familiar.webp`. Il entre en collision de nom avec le portrait utilisé par `Humanoid/Vampire Familiar.webp`, mais son contenu et son usage éventuel ne sont pas suffisamment établis pour le supprimer.

### Répartition par type

| Type | Nombre |
| --- | ---: |
| Aberration | 36 |
| Beast | 90 |
| Celestial | 19 |
| Construct | 17 |
| Dragon | 55 |
| Elemental | 33 |
| Fey | 26 |
| Fiend | 50 |
| Giant | 14 |
| Humanoid | 45 |
| Monstrosity | 57 |
| Ooze | 6 |
| Plant | 17 |
| Undead | 38 |

### Anomalies confirmées

- 38 modificateurs de caractéristiques ne respectent pas `floor((score - 10) / 2)`, principalement des signes négatifs perdus.
- Les PV moyens sont faux pour `Ancient Bronze Dragon` (`4` au lieu de `444`), `Ancient White Dragon` (`3` au lieu de `333`) et `Arch-hag` (`3` au lieu de `333`).
- `Archmage` porte `8000` PX alors que la valeur CR 12 retenue pour ce catalogue est `8400` PX.
- `Giant Crab` n’a pas de valeur de PX alors que CR 1/8 correspond à 25 PX.
- `Flesh Golem` n’a pas de vitesse ; la valeur officielle est `30 ft.`.
- `Shrieker Fungus` n’a pas de PX ; la valeur SRD 5.2.1 retenue est `0`.
- Le champ de langues de `Archmage` contient `Common plus ve other languages` au lieu de `Common plus five other languages`.
- Le champ `details.count` vaut 499 malgré 503 blocs détaillés.
- Une formule de dégâts est incohérente dans `Dracolich / Terrifying Presence` : `17 (2d10)` doit être `11 (2d10)` selon la moyenne arrondie vers le bas utilisée par les blocs.
- Le texte d’`Empyrean Iota / Otherworldly Strike` contient une ponctuation manifestement tronquée : `+5. reach`.

Deux écarts de bonus de Constitution dans la formule de PV sont conservés pour les créations personnalisées `Adult Fey Dragon` et `Ancient Fey Dragon`, conformément au périmètre demandé.

Les écarts de jets de sauvegarde qui dépendaient de signes erronés ont été corrigés. Les bonus spéciaux ne sont pas normalisés automatiquement.

### Sources de règles consultées

- [D&D Beyond — How to Use a Monster](https://www.dndbeyond.com/sources/dnd/br-2024/how-to-use-a-monster)
- [D&D Beyond — Creature Stat Blocks](https://www.dndbeyond.com/sources/dnd/br-2024/creature-stat-blocks)
- [SRD 5.2.1](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf)

### Plan de maintenance

1. Convertir et valider les quatre PNG, puis durcir la validation des portraits.
2. Retirer les 15 entrées sans traduction confirmée et régénérer leurs métadonnées.
3. Corriger uniquement les anomalies de données démontrables et conserver les exceptions homebrew.
4. Ajouter l’audit automatisé, les tests de non-régression et les commandes npm associées.
5. Régénérer les index, exécuter la recette complète et compléter ce rapport avec les résultats finaux.

## Résultats finaux — 17 octobre 2026

### Catalogue et traductions

- 488 entrées conservées ; les identifiants historiques restent inchangés (`1..503` moins les 15 entrées retirées).
- `monsters_2024_details.json` contient 488 entrées et `count: 488`.
- 488 traductions françaises confirmées ; aucune entrée non résolue.
- Les 15 entrées retirées sont : `Aberrant Spirit`, `Animated Object`, `Beast Of the Land`, `Beast Of the Sea`, `Beast Of the Sky`, `Bestial Spirit`, `Celestial Spirit`, `Construct Spirit`, `Draconic Spirit`, `Elemental Spirit`, `Fey Spirit`, `Fiendish Spirit`, `Giant Insect`, `Otherworldly Steed` et `Undead Spirit`.

Répartition finale : Aberration 35, Beast 85, Celestial 17, Construct 15, Dragon 54, Elemental 32, Fey 25, Fiend 49, Giant 14, Humanoid 45, Monstrosity 57, Ooze 6, Plant 17, Undead 37.

### Portraits

- Les quatre PNG ont été convertis en WebP, avec correction de `Empyrean Ioata` vers `Empyrean Iota`.
- 489 WebP sont présents : 488 utilisés par le catalogue et un fichier supplémentaire conservé pour la collision `Vampire Familiar`.
- Les 488 portraits attendus sont présents et valides via `ffprobe`; aucun PNG résiduel, aucune image manquante ou invalide.
- Conversion des quatre PNG : `10 798 394` → `981 682` octets, soit `9 816 712` octets économisés.
- Optimisation des WebP existants : `1 668 726` octets économisés, dimensions conservées.

### Corrections de données

| Domaine | Correction |
| --- | --- |
| Modificateurs | 38 valeurs recalculées avec `floor((score - 10) / 2)` ; les signes négatifs perdus sont rétablis. |
| Jets de sauvegarde | 32 signes corrigés lorsque la valeur source démontrait un modificateur négatif. |
| PV moyens | `Ancient Bronze Dragon` 4 → 444, `Ancient White Dragon` 3 → 333, `Arch-hag` 3 → 333. |
| PX | `Archmage` 8000 → 8400, `Giant Crab` vide → 25, `Shrieker Fungus` vide → 0 selon le SRD 5.2.1. |
| Vitesse | `Flesh Golem` vide → `30 ft.` |
| Langues | `Common plus ve other languages` → `Common plus five other languages`. |
| Dégâts et texte | `Dracolich / Terrifying Presence` 17 → 11 ; ponctuation d’`Empyrean Iota / Otherworldly Strike` corrigée. |

Les valeurs CR, bonus de maîtrise, moyennes de dégâts, PV et correspondances catalogue/détails sont désormais auditées automatiquement. Les sources de référence sont les tables officielles [D&D Beyond — How to Use a Monster](https://www.dndbeyond.com/sources/dnd/br-2024/how-to-use-a-monster), [Creature Stat Blocks](https://www.dndbeyond.com/sources/dnd/br-2024/creature-stat-blocks) et le [SRD 5.2.1](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf).

### Avertissements conservés

`npm run check:monsters` ne signale aucune erreur certaine et conserve huit avertissements explicites : cinq DD de dégâts (`Adult Bronze Dragon`, `Ancient White Dragon`, `Faerie Dragon Adult`, `Gas Spore Fungus`, `Nothic`), une attaque `Gas Spore Fungus / Tendril` à `+0`, et les deux exceptions de bonus de Constitution des créations homebrew `Adult Fey Dragon` et `Ancient Fey Dragon`.

### Vérifications exécutées

- `npm run recette` : succès ; 239 tests unitaires/intégration passés.
- `npm run test:browser` : 97 scénarios passés, 3 ignorés conditionnellement, 0 échec.
- Validation des images, traductions, catalogue, index de recherche, relations et inventaire : succès.
- Les index et rapports dérivés ont été régénérés après le retrait des entrées.

Les commandes d’audit à utiliser lors des prochaines modifications sont `npm run check:monsters`, `npm run check:monster-images`, `npm run check:monster-translations`, puis `npm run recette`.
