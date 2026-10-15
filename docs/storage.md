# Stockage local

## Principes

Le site ne possède pas de backend utilisateur. Les données personnelles sont conservées dans `localStorage` via l’API commune `window.DndStorage`, initialisée par `js/user-library.js`. Les modules fonctionnels ne doivent pas appeler directement `localStorage` ou `sessionStorage`.

`DndStorage` fournit :

- `get` / `set` pour les valeurs texte ;
- `getJson` / `setJson` pour les valeurs JSON ;
- `remove` ;
- `migrateJson` pour les migrations versionnées ;
- `isPersistent` pour savoir si le navigateur a refusé la persistance.

En cas de quota, mode privé ou stockage indisponible, une mémoire de secours permet à la session courante de continuer sans promettre une sauvegarde durable.

## Registre des clés

Le contrat versionné se trouve dans `data/local-storage-contracts.json` et son schéma dans `schemas/local-storage-contracts.schema.json`.

| Clé | Propriétaire | Version | Données |
| --- | --- | ---: | --- |
| `dnd2024_personal_v1` | `DndPersonal` | 2 | profils, listes, notes |
| `dnd_character_session_v1` | `DndSessionState` | 1 | ressources, sorts préparés, historique |
| `dnd_character_creator_draft_v1` | `DndCreationState` | 1 | brouillon de création |
| `dnd_character_sheet_standalone_v1` | `CharacterSheet` | 1 | ancienne fiche autonome conservée pour migration |
| `dnd_character_sheet_standalone_v2` | `CharacterSheet` | 2 | ancienne fiche autonome conservée pour migration |
| `dnd_character_sheets_v1` | `DndSheets` | 1 | fiches associées aux profils, fiche autonome et fiche historique non attribuée |
| `dnd2024_favorites_v1` | `DndLibrary` | 1 | favoris globaux |
| `dnd2024_recent_v1` | `DndLibrary` | 1 | pages récentes |

Le thème (`dnd2024_theme`) et le mode session (`dnd2024_session_mode`) sont des préférences simples gérées par les modules du shell.

## Association profil / fiche

`dnd_character_sheets_v1` sépare les métadonnées des profils (`dnd2024_personal_v1`) des données complètes de fiche. `sheetsByProfileId` est indexé par l’identifiant stable du profil, jamais par son nom. `standalone` conserve la fiche autonome historique lorsqu’aucun profil n’est demandé et `unassigned` conserve une fiche ancienne lorsqu’elle ne peut pas être attribuée sans ambiguïté à plusieurs profils.

Les liens vers une fiche associée utilisent `character-sheet-standalone.html?profile=<id>`. Un identifiant explicite invalide affiche une erreur et ne retombe pas sur une autre fiche. La fiche sans paramètre reste le mode autonome historique.

La migration des clés `dnd_character_sheet_standalone_v1` et `dnd_character_sheet_standalone_v2` crée une copie de sécurité avant d’écrire le nouveau contrat. Les anciennes clés ne sont jamais supprimées. Une migration relancée relit la clé versionnée et ne crée pas de nouvelle association.

## Sauvegardes globales

Le format `dnd-companion-backup` est en version 3. Il contient la date d’export, les données incluses, les profils, toutes les fiches, la fiche autonome non attribuée, le brouillon de création, l’état de session, les favoris, les récents, les notes, les listes et les préférences. L’option d’exclusion des données de personnage exclut explicitement les fiches, le brouillon et l’état de session.

Les versions 1 et 2 restent importables. L’import valide les structures et les associations avant confirmation, prépare toutes les écritures puis les applique avec sauvegarde et restauration de secours. En cas de stockage indisponible ou de quota, les données peuvent rester disponibles uniquement en mémoire et l’interface le signale ; elles ne sont pas annoncées comme durablement restaurées.

## Ajouter ou modifier des données

Ne pas changer une clé publiée et ne pas supprimer silencieusement un champ utilisateur. Pour modifier un objet JSON :

1. augmenter `schemaVersion` ou `currentVersion` ;
2. écrire une migration de chaque version précédente dans le propriétaire ;
3. conserver la sauvegarde automatique réalisée par `migrateJson` ;
4. valider la forme migrée avant de l’enregistrer ;
5. tester migration réussie, données inconnues et migration défaillante.

Une migration doit être tolérante et idempotente autant que possible. Une nouvelle fonctionnalité doit réutiliser un modèle existant avant d’introduire une nouvelle clé.

Les imports/exports de personnages sont des contrats utilisateur : préserver les champs inconnus lors d’une normalisation et ne jamais effacer un profil ou une note pour réparer un format invalide.
