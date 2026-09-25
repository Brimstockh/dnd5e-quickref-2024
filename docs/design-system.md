# Design system visuel — passe catalogue

Cette passe documente les primitives réellement utilisées par les trois pages pilotes :
`spells.html`, `monstres.html` et `classes/index.html`.

## Typography

- `--font-display` (`Cinzel`) est réservé aux titres, noms de cartes et labels courts.
- `--font-body` (`Source Sans 3`) est utilisé pour le contenu, les contrôles et les métadonnées.
- Échelle partagée : `--text-xs`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`.
- Titres de composants : `--heading-sm`, `--heading-md`, `--heading-lg`.

## Surfaces

- `var(--color-surface)` : carte ou panneau principal.
- `var(--color-bg-elevated)` : contrôle, filtre ou surface secondaire.
- `var(--color-surface-hover)` : survol.
- `var(--color-surface-active)` : sélection ou contenu développé.
- `var(--color-border)` et `var(--color-border-light)` : séparation et interaction.
- `var(--shadow-card)` reste réservé aux surfaces réellement élevées ; les catalogues privilégient bordure et contraste de surface.

## Cards

- `.catalog-card` : résultat dense et extensible, utilisé par le catalogue des sorts.
- `.monster-card` : résultat de bestiaire avec statblock ; il reprend les mêmes surfaces, états et métadonnées.
- `.class-grid a` : carte de navigation courte pour la landing Classes.
- Une carte ouverte ou focalisée utilise l’accent de section sur la bordure et le séparateur supérieur.

## Chips

- `.meta-chip` : métadonnée courte non interactive.
- `.meta-chip--accent` : niveau, FP ou autre donnée structurante.
- `.meta-chip--muted` : métadonnée secondaire.
- `.filter-chip` : filtre actif supprimable.

Les chips restent compactes, peu contrastées et utilisent la couleur de section uniquement comme accent.

## Buttons and controls

- `.button-primary` : action principale.
- `.button-secondary` ou `.button` : action secondaire.
- `.button-ghost` : fermeture, réinitialisation et actions discrètes.
- `.icon-button` : action compacte iconographique.

Les champs de recherche et les selects des catalogues partagent une hauteur minimale de `2.75rem`, un rayon `--radius-md` et un focus accentué.

## Filters

Les catalogues utilisent une toolbar compacte avec recherche, filtres actifs, résumé et tri. Sur mobile, le panneau de filtres devient un tiroir ; les contrôles restent des éléments natifs.

## Responsive

- À `820px`, les catalogues passent en une colonne et les filtres deviennent un panneau latéral.
- À `480px` et `390px`, les espacements et grilles se resserrent sans réduire les zones tactiles importantes.
- Les six caractéristiques des statblocks passent à trois colonnes sur mobile.

## Motion

Les transitions d’interaction utilisent `--transition-fast` (`160ms`). La règle globale `prefers-reduced-motion: reduce` neutralise les déplacements, rotations et transitions animées.
