# Lot 3 — Espace personnel

## Périmètre

- Bibliothèque composée des favoris globaux et de listes personnalisées.
- Notes personnelles par identifiant de contenu ou URL.
- Profils facultatifs, avec listes rattachées au profil actif.
- Import et export d’une sauvegarde JSON versionnée.
- Conservation locale exclusive avec `DndStorage`.

## Stockage

La clé `dnd2024_personal_v1` contient `schemaVersion`, `activeProfileId`,
`profiles`, `lists` et `notes`. Les clés historiques des favoris et de la
feuille autonome restent compatibles.

Le fichier `dnd-companion-backup.json` utilise le format
`dnd-companion-backup`, version 1. L’import valide le format avant de demander
confirmation et de remplacer les données locales.

## Limites reportées au Lot 4

- Ressources et repos du personnage.
- Gestion spécialisée des sorts préparés.
- Tableau de raccourcis en session.
- Synchronisation entre plusieurs appareils.
