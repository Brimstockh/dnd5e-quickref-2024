data_movement = [
    {
        title: "Se déplacer",
        icon: "run",
        subtitle: "Coût : 1 m par 1 m",
        description: "Coût de déplacement : 1 m par 1 m parcourus",
        reference: "PHB, pg. 24-25, 374.",
        bullets: [
            "Si vous avez plus d'une vitesse, comme votre vitesse de marche et une vitesse de vol, vous pouvez alterner entre ces vitesses pendant votre déplacement. À chaque changement, soustrayez la distance déjà parcourue de la nouvelle vitesse.",
            "Vous pouvez traverser l'espace d'un allié, d'une créature qui a l'état <i>Incapacité</i>, d'une créature de taille Minuscule ou d'une créature de deux tailles plus grande ou plus petite que vous.",
            "L'espace d'une autre créature est un terrain difficile pour vous, sauf si cette créature est Minuscule ou votre alliée.",
            "Vous ne pouvez pas terminer volontairement votre déplacement dans un espace occupé par une autre créature. Si vous terminez un tour dans un espace avec une autre créature, vous avez l'état <i>À terre</i>, sauf si vous êtes Minuscule ou d'une taille supérieure à l'autre créature."
        ]
    },
    {
        title: "Grimper",
        icon: "crags",
        subtitle: "Coût : +1 m par 1 m",
        description: "Coût de déplacement : chaque pied de déplacement coûte 1 pied supplémentaire",
        reference: "PHB, pg. 363.",
        bullets: [
            "Chaque pied de déplacement coûte 1 pied supplémentaire pendant l'escalade. Si vous avez une vitesse d'escalade, vous ignorez ce coût supplémentaire.",
            "Peut nécessiter un test de Force (Athlétisme) si l'escalade est difficile."
        ]
    },
    {
        title: "Nager",
        icon: "at-sea",
        subtitle: "Coût : +1 m par 1 m",
        description: "Coût de déplacement : chaque pied de déplacement coûte 1 pied supplémentaire",
        reference: "PHB, pg. 376.",
        bullets: [
            "Chaque pied de déplacement coûte 1 pied supplémentaire en nageant. Si vous avez une vitesse de nage, vous ignorez ce coût supplémentaire.",
            "Peut nécessiter un test de Force (Athlétisme) si vous nagez dans des eaux agitées."
        ]
    },
    {
        title: "Voler",
        icon: "angel-wings",
        subtitle: "Coût : 1 m par 1 m",
        description: "Coût de déplacement : 1 m par 1 m en vol",
        reference: "PHB, pg. 367.",
        bullets: [
            "Tant que vous avez une vitesse de vol, vous pouvez rester en l'air jusqu'à ce que vous atterrissiez, tombiez ou mouriez.",
            "En volant, vous tombez si vous avez l'état <i>Incapacité</i> ou <i>À terre</i> ou si votre vitesse de vol est réduite à 0.",
            "Vous pouvez rester en l'air dans ces circonstances si vous pouvez planer."
        ]
    },
    {
        title: "Se mettre à terre",
        icon: "falling",
        subtitle: "Coût : 0 m",
        description: "Coût de déplacement : 0 m (gratuit)",
        reference: "PHB, pgs. 25, 372.",
        bullets: [
            "Vous pouvez vous mettre à terre sans utiliser votre déplacement.",
            "Pour vous déplacer en étant à terre, vous devez ramper ou utiliser de la magie comme la téléportation",
            "Se mettre à terre confère l'état <i>À terre</i>."
        ]
    },
    {
        title: "Ramper",
        icon: "crawl",
        subtitle: "Coût : +1 m par 1 m",
        description: "Coût de déplacement : chaque pied de déplacement coûte 1 pied supplémentaire",
        reference: "PHB, pg. 364.",
        bullets: [
            "Chaque pied de déplacement coûte 1 pied supplémentaire en rampant."
        ]
    },
    {
        title: "Se relever",
        icon: "strong",
        subtitle: "Coût : la moitié de la vitesse",
        description: "Coût de déplacement : la moitié de votre vitesse, arrondie à l'inférieur.",
        reference: "PHB, pg. 372.",
        bullets: [
            "Vous ne pouvez pas vous relever si vous n'avez pas assez de déplacement restant ou si votre vitesse est de 0"
        ]
    },
    {
        title: "Saut en hauteur",
        icon: "wingfoot",
        subtitle: "Coût : 1 m",
        description: "Coût de déplacement : 1 m par 1 m sautés",
        reference: "PHB, pg. 368.",
        bullets: [
            "Vous sautez en l'air d'un nombre de pieds égal à <b>3 + votre modificateur de Force</b> si vous vous déplacez d'au moins 10 m à pied juste avant le saut.",
            "Lors d'un saut en hauteur sans élan, vous ne sautez que la moitié de cette distance.",
            "Vous pouvez tendre vos bras d'une demi-taille au-dessus de vous pendant le saut. Vous pouvez donc atteindre une distance égale à la hauteur du saut plus 1,5 fois votre taille.",
            "Dans certaines circonstances, votre MJ peut vous autoriser à faire un test de Force (Athlétisme) pour sauter plus haut que la normale."
        ]
    },
    {
        title: "Saut en longueur",
        icon: "wingfoot",
        subtitle: "Coût : 1 m par 1 m",
        description: "Coût de déplacement : 1 m par 1 m sautés",
        reference: "PHB, pg. 370.",
        bullets: [
            "Vous parcourez un nombre de pieds jusqu'à votre <b>score de Force</b> si vous vous déplacez d'au moins 10 m à pied juste avant le saut.",
            "Lors d'un saut en longueur sans élan, vous ne sautez que la moitié de cette distance",
            "Si vous atterrissez en terrain difficile, vous devez réussir un test de Dextérité (Acrobaties) DD 10 ou subir l'état <i>À terre</i>.",
            "Peut nécessiter un test de Force (Athlétisme) DD 10 pour franchir un obstacle bas (pas plus haut qu'un quart de la distance du saut). Vous heurtez l'obstacle en cas d'échec."
        ]
    },
    {
        title: "Improviser",
        icon: "juggler",
        subtitle: "Toute acrobatie\nqui n'est pas sur cette liste",
        description: "Effectuer n'importe quel déplacement ou acrobatie que vous pouvez imaginer",
        bullets: [
            "Lorsque vous décrivez un type de déplacement qui n'est pas détaillé ailleurs dans les règles, le MJ vous dit si c'est possible et quel type de jet vous devez faire, le cas échéant, pour déterminer la réussite ou l'échec."
        ]
    },
    {
        title: "Terrain difficile",
        icon: "stone-pile",
        subtitle: "Modificateur de coût : +1 m par 1 m",
        reference: "PHB, pg. 25, 366.",
        description: "Se déplacer en terrain difficile coûte 1 m supplémentaires par 1 m de déplacement",
        bullets: [
            "Chaque pied de déplacement coûte 1 pied supplémentaire.",
            "Le terrain difficile ne se cumule pas ; un espace est soit en terrain difficile soit non."
        ]
    },
    {
        title: "Déplacement en prise",
        icon: "grab",
        subtitle: "Coût : +1 m par 1 m",
        description: "Traîner ou porter la créature agrippée",
        reference: "PHB, pg. 367.",
        bullets: [
            "Si vous vous déplacez en agrippant une autre créature, chaque pied de déplacement coûte 1 pied supplémentaire, sauf si la créature agrippée est Minuscule ou si vous êtes deux tailles ou plus au-dessus d'elle."
        ]
    },
    {
        title: "Allure de voyage",
        icon: "run",
        subtitle: "Voyage en dehors des combats",
        description: "Allure de voyage Rapide, Normale et Lente en dehors des combats.",
        reference: "PHB, pg. 20",
        bullets: [
            "Déterminez un ordre de marche pendant le voyage.",
            "Les voyageurs en chariots, carrosses ou autres véhicules terrestres choisissent une allure normalement. Les personnages dans un navire sont limités par la vitesse du navire et ne choisissent pas d'allure."
        ]
    }
]
