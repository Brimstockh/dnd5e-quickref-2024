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

- `.card` est une surface statique ; elle ne reçoit aucun déplacement ou changement de fond global au survol.
- `.card--interactive` est le modificateur explicite pour une surface cliquable qui accepte un retour hover/focus.
- `.catalog-card` : résultat dense et extensible, utilisé par les catalogues Sorts et Objets magiques.
- `.monster-card` : résultat de bestiaire avec statblock ; il reprend les mêmes surfaces, états et métadonnées.
- `.class-grid a` et `.race-link` : cartes de navigation courtes pour Classes et Espèces.
- `.hub-card` : carte de navigation pour les index Règles, Univers, Création et Ma table ; les groupes de ressources sont des panneaux utilitaires compacts, pas des surfaces éditoriales décoratives.
- Une carte ouverte ou focalisée utilise l’accent de section sur la bordure et le séparateur supérieur.

Les tableaux restent la représentation privilégiée lorsque la comparaison simultanée de plusieurs colonnes est plus importante que la lecture individuelle : armes, armures, services, montures et véhicules.

Les pages de référence denses (`rules-content`, `combat-content` et `mastery-content`) réutilisent les tokens de contenu, les encadrés statiques et les styles de tableaux partagés. Les tableaux larges doivent rester dans un conteneur de défilement local ; ils ne doivent pas élargir la page entière.

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

Les filtres sont alimentés par les données existantes ou par le contenu source. Les taxonomies manuelles dans le JavaScript de présentation sont évitées ; un filtre décoratif est retiré lorsqu’aucune source canonique fiable n’est disponible.

Un contrôle de tri n’est affiché que lorsqu’au moins deux modes de tri sont disponibles ; une option unique ne doit pas occuper la toolbar.

## Hubs de section

- Les hubs conservent leur hero illustré, puis organisent les liens par intention : référence et jeu pour Règles, Faerûn et Multivers pour Univers, campagne/personnages/outils pour Ma table.
- Les groupes à carte unique utilisent une largeur plafonnée sur desktop pour éviter les zones vides disproportionnées ; ils repassent en pleine largeur sur mobile.
- Les couleurs de section restent des accents de bordure et de séparateur ; les cartes gardent les surfaces communes du thème.

## Pages Univers

- Les pages Univers utilisent `universe-page` et `css/universe-pages.css` comme recettes de famille : mêmes surfaces et tokens que le reste du site, avec `--section-universe` (`#98778f`) comme accent.
- Les recettes distinguent les cartes régionales, chronologies, catalogues et plans sans créer de taxonomie de contenu parallèle.

## Pages Ma table

- Les outils de session utilisent `table-page` et `css/table-pages.css` avec `--section-table` (`#a14b42`) ; les modules informatifs restent statiques et les actions principales sont accentuées.
- Les personnages conservent une grille dense et des actions explicites ; les statistiques de dés gardent le graphique et les comparaisons sous forme compacte.

## Responsive

- À `820px`, les catalogues passent en une colonne et les filtres deviennent un panneau latéral.
- À `480px` et `390px`, les espacements et grilles se resserrent sans réduire les zones tactiles importantes.
- Les six caractéristiques des statblocks passent à trois colonnes sur mobile.

## Motion

Les transitions d’interaction utilisent `--transition-fast` (`160ms`). La règle globale `prefers-reduced-motion: reduce` neutralise les déplacements, rotations et transitions animées.
