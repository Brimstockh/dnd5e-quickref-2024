# Audit technique des parcours UX

## Périmètre et méthode

Cet audit vérifie que les parcours peuvent être exécutés par un navigateur automatisé. Il ne mesure ni la découverte spontanée, ni la compréhension humaine, ni la satisfaction.

Version évaluée :

```text
Branche : chore/cleanup-optimization-phase2
Commit : 12149db5143718dbc6cab649011fc8eb363e62a3
Configuration : Playwright Chromium desktop 1440 × 900 et mobile tactile 390 × 844
```

Le contrôle reproductible est [`tests/browser/usability-audit.spec.mjs`](../tests/browser/usability-audit.spec.mjs). Chaque scénario est exécuté sur les deux projets. Les tests vérifient les pages, les données chargées, les contrôles principaux, les liens profonds, les états ouverts ou vides, les erreurs JavaScript collectées au chargement et, lorsque pertinent, l'absence de débordement horizontal.

## Résultats vérifiés

Dernière exécution de l'audit dédié :

```text
22 tests passés, 0 échec
11 scénarios × 2 configurations
```

| Scénario | Preuve technique exécutée | Desktop | Mobile |
| --- | --- | --- | --- |
| UX-01 | Recherche globale « boule de feu », ouverture de `spells.html` et présence du sort | Passé | Passé |
| UX-02 | Recherche Monstres, ouverture d'un `details.monster` et présence du statblock | Passé | Passé |
| UX-03 | Recherche « attaquer », ouverture puis fermeture du détail de Référence rapide | Passé | Passé |
| UX-04 | Sélection de deux options et rendu du tableau comparatif | Passé | Passé |
| UX-05 | Chargement des tables d'équipement et présence de la colonne Propriétés | Passé | Passé |
| UX-06 | Recherche du don Athlète et ouverture de son détail | Passé | Passé |
| UX-07 | Chargement du Lore, recherche Faerûn et présence d'une entrée | Passé | Passé |
| UX-08 | Présence des profils, listes, notes et export dans Ma table | Passé | Passé |
| UX-09 | Chargement de l'assistant, 11 étapes déclarées et progression visible | Passé | Passé |
| UX-10 | Création de deux profils et liens de fiche distincts par identifiant | Passé | Passé |
| UX-11 | Export puis import d'une sauvegarde JSON dans un contexte isolé | Passé | Passé |

Les suites existantes ajoutent les vérifications de parcours complets, d'accessibilité axe, de navigation canonique et de PWA. Elles ne sont pas transformées en résultats humains.

## Observations techniques reproductibles

### O-TECH-01 — Recherche Monstres mobile derrière le contrôle de filtres

- **Page / configuration :** `monstres.html`, viewport mobile 390 × 844.
- **Reproduction :** ouvrir la page puis chercher le champ `#searchInput` avant d'ouvrir le panneau de filtres.
- **Résultat observé :** le champ existe mais n'est pas visible ; il devient utilisable après activation de `.legacy-filter-toggle`.
- **Résultat attendu :** le contrôle de recherche doit rester découvrable, ou son état replié doit être compris.
- **Sévérité technique :** aucune panne ; point à observer en session humaine, potentiellement S2 si la découverte est difficile.
- **Preuve :** le test UX-02 ouvre explicitement le filtre sur mobile avant la saisie.

### O-TECH-02 — Le comparateur expose plus de catégories que le périmètre historique

- **Page :** `comparateur.html`.
- **Résultat observé :** le contrôle `#compareType` contient Classes, Espèces, Historiques, mais aussi Dons, Sorts et Armes et armures.
- **Résultat attendu :** le libellé et le périmètre présentés aux participants doivent correspondre à la version testée.
- **Sévérité technique :** aucune panne ; point de cohérence documentaire, à valider avec les participants avant toute décision.
- **Preuve :** options HTML et test UX-04 ; aucune capacité supplémentaire n'est attribuée dans la carte participant.

Ces observations sont des faits techniques. Elles ne prouvent pas qu'une personne échouera ou sera gênée.

## États et erreurs couverts

- chargement des pages représentatives sans exception JavaScript capturée ;
- recherche globale avec résultat et état vide via la suite fonctionnelle existante ;
- ouverture et fermeture de détails et de dialogues pertinents ;
- navigation desktop/mobile et absence de débordement horizontal sur les surfaces auditées ;
- export/import JSON dans un contexte Playwright isolé ;
- création de deux profils sans collision d'URL de fiche ;
- audits axe sur les pages représentatives ;
- service worker, page offline et mise à jour via la suite PWA existante.

Aucune capture n'est versionnée : l'audit n'a pas révélé d'anomalie d'affichage nécessitant une preuve visuelle durable. Les artefacts Playwright temporaires peuvent être consultés localement après un échec.

## Limites

- Chromium ne représente pas tous les navigateurs mobiles réels.
- Une assertion Playwright réussie ne mesure pas la facilité de découverte.
- L'audit ne mesure pas les durées humaines, les hésitations ou la confiance.
- Le mode hors connexion est couvert par les tests PWA existants, mais pas comme tâche utilisateur dans les onze scénarios.
- Les résultats d'accessibilité axe ne remplacent pas l'observation d'utilisateurs utilisant un clavier, un lecteur d'écran ou un zoom réel.
