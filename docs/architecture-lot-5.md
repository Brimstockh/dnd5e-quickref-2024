# Lot 5 — création de personnage

## Périmètre

Le lot ajoute deux outils locaux et utilisables hors connexion :

- `comparateur.html` compare jusqu’à quatre classes, espèces, historiques, dons, sorts ou équipements. Le type et la sélection sont partageables dans l’URL.
- `assistant-creation.html` guide la création en onze étapes, sauvegarde un brouillon local et autorise les retours en arrière ou un mode expert.

## Données et état

- `data/character-creation.json` contient le modèle éditorial versionné des classes, espèces, historiques, langues et caractéristiques.
- `js/creation-state.js` contient les fonctions pures de normalisation, validation, calcul et conversion vers la fiche autonome.
- `js/creation-wizard.js` orchestre l’interface et persiste le brouillon sous `dnd_character_creator_draft_v1`.

Les données restent sur l’appareil. La génération écrit la fiche `standalone_v2`, peut créer un profil dans l’espace personnel et propose un export JSON.

## Calculs

Le récapitulatif affiche la provenance du bonus de maîtrise, de l’initiative, de la vitesse et des points de vie estimés. Les points de vie après le niveau 1 utilisent la moyenne arrondie du dé de vie et restent modifiables dans la fiche générée.

La sélection de sorts constitue une liste de travail filtrée par classe et niveau. L’utilisateur doit vérifier le nombre exact de sorts connus ou préparés dans la page de sa classe.
