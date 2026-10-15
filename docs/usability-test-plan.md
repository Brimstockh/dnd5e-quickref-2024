# Protocole de test utilisateur — Phase 2

Statut : **protocole prêt — sessions utilisateurs réelles non encore réalisées**.

Ce document prépare une étude qualitative modérée de 5 à 8 participants. Les résultats Playwright sont décrits séparément dans [`usability-test-technical-audit.md`](usability-test-technical-audit.md) ; ils constituent des preuves techniques et ne mesurent pas la facilité d'utilisation humaine.

## Objectifs

Évaluer les parcours existants selon six axes :

- découverte des espaces et des fonctionnalités ;
- compréhension des termes, contrôles et retours d'action ;
- rapidité de consultation pendant une partie ;
- cohérence entre Règles, Compendium, Création, Univers et Ma table ;
- confiance dans les profils, fiches et sauvegardes locales ;
- différences entre ordinateur et téléphone.

La mission ne doit pas conduire à inventer des résultats, à ajouter de la télémétrie ou à lancer une refonte. Les demandes de fonctionnalités sont consignées séparément des problèmes observés.

## Participants

Recruter 5 à 8 personnes pour une première étude exploratoire, sans prétention statistique :

| Profil recherché | Couverture minimale souhaitée |
| --- | --- |
| Joueur débutant | au moins 1 personne |
| Joueur expérimenté | au moins 1 personne |
| Maître du jeu | au moins 1 personne |
| Découverte totale du site | au moins 2 personnes si possible |

Une personne peut appartenir à plusieurs catégories. Éviter un groupe composé uniquement de développeurs ou de personnes ayant participé à la conception. Noter uniquement un identifiant anonyme, l'expérience D&D en catégories simples, le navigateur, l'appareil et le viewport.

## Environnement et version évaluée

La version de référence est celle de la branche locale :

```text
Branche : chore/cleanup-optimization-phase2
Commit évalué : 12149db5143718dbc6cab649011fc8eb363e62a3
```

Le site public GitHub Pages ne constitue pas la version de test. Préparer une copie locale depuis la branche évaluée, puis construire l'artefact Pages :

```powershell
npm ci
npm run build:pages
npm run check:pages
npm run test:browser
```

Les sessions utilisent ensuite `npm run serve:test`, ou la commande équivalente définie dans [`playwright.config.mjs`](../playwright.config.mjs), avec une URL locale stable. Ne pas merger, rebaser, publier ou déployer pour préparer les sessions.

Tester au minimum :

- un navigateur Chromium récent sur ordinateur, viewport proche de 1440 × 900 ;
- un navigateur mobile récent ou un viewport tactile proche de 390 × 844 ;
- une fenêtre privée ou un profil navigateur dédié au test, sans toucher au profil personnel du responsable.

## Déroulement d'une session

Prévoir 30 à 45 minutes :

1. Accueil, consentement et explication de la méthode : 3 à 5 minutes.
2. Quatre à six scénarios adaptés au profil : 20 à 30 minutes.
3. Débrief ouvert : 5 à 10 minutes.

Ne pas imposer les onze scénarios à chaque personne. UX-01 à UX-08 sont prioritaires ; UX-09 à UX-11 peuvent être répartis selon l'expérience et la fatigue. Utiliser les deux ordres proposés dans [`usability-test-setup.md`](usability-test-setup.md).

Mesurer le temps du début de la consigne à la première action ou réponse correcte. Une limite indicative sert à décider d'une relance, pas à transformer automatiquement une tâche finalement réussie en échec.

## Scénarios prioritaires

Les intitulés et exemples ci-dessous ont été vérifiés dans le dépôt à la date du commit évalué. Les consignes détaillées à lire sont séparées dans [`usability-test-task-cards.md`](usability-test-task-cards.md).

| ID | Profil / situation | Consigne neutre et objectif vérifiable | État initial | Réussite / durée | À observer et difficultés possibles |
| --- | --- | --- | --- | --- | --- |
| UX-01 | Joueur, vérification en partie | Retrouver **Boule de feu**, puis donner une information demandée dans son détail. | Accueil, recherche et stockage vierges | Bon sort ouvert et information identifiée / 2 min | Recherche globale, Compendium, résultats, filtres, retour. Confusion entre page catalogue et détail. |
| UX-02 | MJ, préparation d'une rencontre | Retrouver **un dragon** dans le bestiaire, ouvrir sa fiche et identifier sa CA ou ses PV. | Catalogue Monstres, aucune recherche préalable | Statblock ouvert et valeur identifiée / 2 min | Recherche, filtre, lisibilité du statblock, retour aux résultats. Noms français/anglais ou chargement progressif. |
| UX-03 | Joueur, désaccord pendant un combat | Retrouver la règle utile pour **attaquer** ou pour résoudre une situation de tour, puis expliquer son application. | Accueil ou Règles, sans chemin indiqué | Réponse retrouvée et reformulée / 3 min | Choix entre Référence rapide, règles et glossaire, hiérarchie et allers-retours. |
| UX-04 | Joueur, choix de personnage | Comparer deux classes, espèces ou historiques et expliquer une différence utile à son choix. | Comparateur vierge | Deux options comparées et conclusion formulée / 3 min | Découverte, sélection, tableau et différences. Ne pas attribuer au comparateur des capacités non utilisées dans la consigne. |
| UX-05 | Joueur, vérification d'équipement | Retrouver **Épée longue** et donner ses dégâts ou une propriété. | Page Armes et armures, sans filtre | Bonne ligne et propriété identifiée / 2 min | Découverte du catalogue, catégories, tableau, lecture mobile. Ce scénario ne teste pas le comparateur. |
| UX-06 | Joueur, évolution de personnage | Retrouver le don **Athlète** et expliquer son prérequis ou un de ses effets. | Page Création ou accueil, sans résultat préouvert | Bon don ouvert et information identifiée / 2 min | Organisation de Création, recherche, filtres et détail. |
| UX-07 | Utilisateur curieux, découverte des Royaumes Oubliés | Retrouver une entrée existante du Lore liée à **Faerûn**, puis en donner le sujet principal. | Univers ou accueil, sans recherche préalable | Entrée Lore correcte consultée / 2 min | Découverte d'Univers, distinction Lore/Faerûn, recherche globale, liens spécialisés. |
| UX-08 | MJ, préparation de session | Retrouver Ma table et enregistrer une information fictive utile à une prochaine session, puis la retrouver. | Profil de test et stockage isolé | Information enregistrée puis retrouvée / 4 min | Profil vs fiche, favoris, note, liste, session, confirmation et confiance dans la conservation. Ne demander qu'une action personnelle claire. |

## Scénarios complémentaires

| ID | Situation / objectif | État initial et réussite | À observer |
| --- | --- | --- | --- |
| UX-09 | Créer un personnage de bout en bout, de Création à la fiche. | Brouillon vierge ; une fiche lisible est générée avec les choix annoncés. | Progression, guidé/expert, validation, valeurs calculées, moment où le personnage paraît terminé. |
| UX-10 | Avec deux personnages fictifs, retrouver l'un, modifier une information, puis revenir à l'autre. | Deux profils et deux fiches indépendants préparés ; la modification reste sur le bon profil. | Sélecteur, personnage actif, confiance dans l'autosave, changement de contexte et différence avec une fiche autonome. Ce n'est pas un test technique de non-écrasement. |
| UX-11 | Exporter les données fictives avant un changement d'appareil, puis retrouver la procédure d'import. | Données de démonstration locales ; export JSON obtenu et import exécuté dans un contexte isolé. | Découverte, périmètre, distinction autosave/export, confirmations et confiance dans la restauration. |

## Données de démonstration

Utiliser uniquement des données fictives : par exemple Ariane test et Borin test, une note « Préparer la rencontre de la forêt », une liste « Session forêt » et un export généré pendant la session. Les données peuvent être créées par l'interface ou par le protocole d'initialisation décrit dans [`usability-test-setup.md`](usability-test-setup.md). Ne jamais injecter ni versionner les données réelles d'un joueur.

## Mesures par tâche

Reporter dans la grille :

- identifiant anonyme du participant et scénario ;
- appareil, navigateur et viewport ;
- résultat : autonome, avec aide, échec ou non évalué ;
- durée en secondes, séparée du résultat ;
- nombre d'erreurs et de retours en arrière ;
- niveau d'assistance : aucune, légère ou importante ;
- recherche utilisée : oui/non ;
- chemin réellement emprunté ;
- observation factuelle et difficulté perçue de 1 à 7 si recueillie.

Classer chaque observation comme navigation, compréhension, visibilité, cohérence, retour utilisateur, technique ou besoin fonctionnel exprimé. Attribuer S0 à S3 uniquement après analyse de l'impact et de la fréquence observée :

- S0 — bloquant ou risque sérieux de perte de données ;
- S1 — majeur sur un parcours essentiel ;
- S2 — modéré, détour ou hésitation sans échec systématique ;
- S3 — mineur, inconfort ou finition.

Ne pas calculer de score UX global. Les tâches non évaluées ne sont pas des échecs.

## Confidentialité et limites

Demander un accord explicite avant toute capture audio, vidéo ou d'écran. Ne pas collecter de nom, adresse, compte ou fiche personnelle sans nécessité. Stocker les notes individuelles hors du dépôt ; seules des synthèses anonymisées et validées peuvent être ajoutées au projet.

À ce stade : **aucune session utilisateur réelle effectuée. Aucun résultat d'utilisabilité humaine disponible.**
