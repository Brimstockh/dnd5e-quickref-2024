# Modèle de contenu

## Sources et sorties

Le contenu est conservé dans des fichiers locaux. Les pages HTML restent la source de certaines règles et tables historiques ; les catalogues structurés utilisent notamment `data/spells_2024.json`, `data/monsters_2024.json`, `data/magic-items.json`, `data/feats_2024.json` et `data/lore.json`.

Les sorties transversales sont :

- `data/search-index.json` : index principal chargé par la recherche ;
- `data/search-index-deep.json` : capacités, règles et entrées secondaires chargées à la demande ;
- `data/content-relations.json` : relations contextuelles ;
- `data/glossary.json` : glossaire normalisé ;
- `data/content-inventory.json` : inventaire, décompte, navigation et contrôles de qualité.

Les scripts de génération sont la source de la forme de ces sorties. Ne pas modifier manuellement un index généré pour corriger une entrée.

`data/magic-items.json` reste un catalogue éditorial canonique consommé directement
par le runtime. Sa forme compacte est volontaire pour respecter le budget de
transfert ; il n’existe pas de source lisible distincte à régénérer. À l’inverse,
`data/assets-report.json` est une sortie générée par `npm run audit:assets` et
doit rester synchronisée avec le dépôt.

## Identifiants

Les identifiants canoniques sont créés par `js/content-ids.js` :

```text
<type>-<slug>
```

Le slug est stable, accentué-normalisé et lisible, par exemple `spell-boule-de-feu`. Un identifiant déjà publié ne doit pas changer pour une simple correction de titre. Si une compatibilité est nécessaire, ajouter un `legacyIds` ou une entrée dans `data/content-id-aliases.json`.

Types actuellement reconnus : sorts, monstres, objets magiques, équipements, classes, capacités, espèces, règles, dons, historiques, lore, glossaire et pages, entre autres. La liste complète est dans `CONTENT_TYPES`.

## Entrée d’index

Une entrée recherchable expose au minimum :

```json
{
  "id": "spell-boule-de-feu",
  "type": "spell",
  "title": "Boule de feu",
  "section": "Compendium",
  "category": "Sort",
  "url": "spells.html?q=Boule%20de%20feu",
  "keywords": ["sort", "feu"],
  "aliases": [],
  "excerpt": "..."
}
```

Les champs de provenance (`sourceRef`, `sourcePage`) sont ajoutés lorsque la famille de contenu les supporte. Le registre `data/content-sources.json` définit les sources connues ; `rulesVersion` et `verifiedAt` doivent rester cohérents avec le contenu. `npm run audit:provenance` et `reports/quality.json` exposent la couverture `sourceRef` par type pour guider l’enrichissement des familles historiques encore non attribuées.

Les mappings actuellement établis dans l’index sont regroupés dans `sourceRefsByType` pour éviter de répéter une même référence sur chaque entrée : `phb-2024-fr` pour les classes, espèces, dons, équipements et sorts ; `srd-5.2.1-fr` pour les règles et le glossaire ; `dmg-2024-lore-pdf` pour le Lore. Les 503 monstres, historiques et actions rapides restent sans attribution automatique tant qu’une source structurée explicite et complète n’est pas disponible.

## Générer et vérifier

Après une modification de contenu :

```bash
npm run build:search
npm run build:relations
npm run build:glossary
npm run build:inventory
npm run check:contracts
npm run audit:provenance
```

La recette utilise les variantes `--check` lorsque la sortie est générée. Les audits de qualité éditoriale peuvent signaler des anomalies informatives sans bloquer la recette ; une référence inconnue, un lien cassé ou un contrat invalide doit être corrigé.

## Ajouter un nouveau type de contenu

1. Choisir un type et un identifiant canoniques dans `js/content-ids.js`.
2. Définir ou adapter le JSON source et son schéma dans `schemas/`.
3. Ajouter le générateur ou le renderer sans dupliquer un format voisin.
4. Ajouter les alias, relations, provenance et entrées de recherche nécessaires.
5. Mettre à jour l’inventaire et les tests de contrat.
6. Vérifier la fiche, le deep link, la recherche, le responsive et l’accessibilité.
