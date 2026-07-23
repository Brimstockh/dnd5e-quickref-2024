# Lot 4 — Usage en session

## Tableau de jeu

La feuille autonome contient une cinquième vue `Session`. Elle rassemble les
valeurs essentielles, les ressources, les emplacements de sorts, les sorts
préparés, les raccourcis, les notes et un historique local.

## Modèle local

La clé `dnd_character_session_v1` contient un état versionné par profil actif.
Sans profil, la portée `global` est utilisée. Les ressources sont génériques :

```json
{
  "label": "Canalisation divine",
  "current": 1,
  "max": 1,
  "reset": "short-rest"
}
```

Le repos court restaure uniquement les ressources `short-rest`. Le repos long
restaure les ressources `short-rest`, `long-rest` et les emplacements. Les
valeurs `manual` ne sont jamais modifiées automatiquement.

## Compatibilité

Le format historique de la feuille reste inchangé. La sauvegarde globale du
Lot 3 inclut désormais l’état de session. Le catalogue local des sorts fournit
les filtres et métadonnées sans règle codée en dur par classe.
