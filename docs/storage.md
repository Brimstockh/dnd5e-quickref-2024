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
| `dnd_character_sheet_standalone_v2` | `CharacterSheet` | 2 | feuille de personnage |
| `dnd2024_favorites_v1` | `DndLibrary` | 1 | favoris globaux |
| `dnd2024_recent_v1` | `DndLibrary` | 1 | pages récentes |

Le thème (`dnd2024_theme`) et le mode session (`dnd2024_session_mode`) sont des préférences simples gérées par les modules du shell.

## Ajouter ou modifier des données

Ne pas changer une clé publiée et ne pas supprimer silencieusement un champ utilisateur. Pour modifier un objet JSON :

1. augmenter `schemaVersion` ou `currentVersion` ;
2. écrire une migration de chaque version précédente dans le propriétaire ;
3. conserver la sauvegarde automatique réalisée par `migrateJson` ;
4. valider la forme migrée avant de l’enregistrer ;
5. tester migration réussie, données inconnues et migration défaillante.

Une migration doit être tolérante et idempotente autant que possible. Une nouvelle fonctionnalité doit réutiliser un modèle existant avant d’introduire une nouvelle clé.

Les imports/exports de personnages sont des contrats utilisateur : préserver les champs inconnus lors d’une normalisation et ne jamais effacer un profil ou une note pour réparer un format invalide.
