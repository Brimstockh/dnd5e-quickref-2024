data_environment_obscurance = [
    {
        title: "Légèrement obscurci",
        icon: "bleeding-eye",
        subtitle: "Désavantage à la Perception",
        description: "Lumière faible, brouillard par plaques, feuillage modéré.",
        reference: "PHB, pg. 19.",
        bullets: [
            "Les créatures ont un <b>désavantage aux tests de Sagesse (Perception)</b> qui reposent sur la vue."
        ]
    },
    {
        title: "Fortement obscurci",
        icon: "lightning-tear",
        subtitle: "Effectivement aveuglé",
        description: "Obscurité, brouillard opaque, feuillage dense",
        reference: "PHB, pg. 19.",
        bullets: [
            "Les créatures ont l'état <b>Aveuglé</b> lorsqu'elles essaient de voir quelque chose."
        ]
    }
]

data_environment_light = [
    {
        title: "Lumière vive",
        icon: "star-pupil",
        subtitle: "Vision normale",
        description: "La lumière vive permet à la plupart des créatures de voir normalement",
        reference: "PHB, pg. 19.",
        bullets: [
            "Les jours sombres fournissent tout de même une lumière vive, tout comme les torches, lanternes, feux et autres sources d'éclairage dans un rayon donné."
        ]
    },
    {
        title: "Lumière faible",
        icon: "semi-closed-eye",
        subtitle: "Légèrement obscurci",
        description: "Lumière faible, aussi appelée pénombre",
        reference: "PHB, pg. 19.",
        bullets: [
            "Crée une zone <b>légèrement obscurcie</b>.",
            "Une zone de lumière faible est généralement une frontière entre une source de lumière vive, comme une torche, et l'obscurité environnante.",
            "La lumière douce du crépuscule et de l'aube compte aussi comme lumière faible. Une pleine lune particulièrement brillante peut baigner la terre d'une lumière faible."
        ]
    },
    {
        title: "Obscurité",
        icon: "worried-eyes",
        subtitle: "Fortement obscurci",
        description: "L'obscurité crée une zone fortement obscurcie",
        reference: "PHB, pg. 19.",
        bullets: [
            "Crée une zone <b>fortement obscurcie</b>.",
            "Les personnages font face à l'obscurité à l'extérieur la nuit (même la plupart des nuits éclairées par la lune), dans les confines d'un donjon non éclairé ou d'une crypte souterraine, ou dans une zone d'obscurité magique."
        ]
    }
]

data_environment_vision = [
    {
        title: "Vision aveugle",
        icon: "one-eyed",
        subtitle: "Percevoir sans la vue",
        description: "Vous pouvez voir dans un rayon donné sans dépendre de la vue physique.",
        reference: "PHB, pg. 361.",
        bullets: [
            "Vous pouvez voir tout ce qui n'est pas derrière un Couvert total même si vous avez l'état Aveuglé ou si vous êtes dans l'Obscurité.",
            "Vous pouvez voir quelque chose qui a l'état Invisible.",
            "Les créatures sans yeux, comme les vases, et les créatures avec écholocalisation ou des sens accrus, comme les chauves-souris et les vrais dragons, possèdent ce sens."
        ]
    },
    {
        title: "Vision dans le noir",
        icon: "semi-closed-eye",
        subtitle: "Vision limitée dans l'obscurité",
        description: "Une créature avec la vision dans le noir voit mieux dans l'obscurité ou en faible lumière, dans un certain rayon",
        reference: "PHB, pg. 365",
        bullets: [
            "Dans un rayon donné, une créature avec la vision dans le noir voit en Lumière faible comme si c'était une Lumière vive, et en Obscurité comme si c'était une Lumière faible.",
            "Cependant, la créature ne peut pas distinguer les couleurs dans l'obscurité, seulement des nuances de gris.",
            "De nombreuses créatures dans les mondes de D&D, surtout celles qui vivent sous terre, ont la vision dans le noir."
        ]
    },
    {
        title: "Perception tellurique",
        icon: "semi-closed-eye",
        subtitle: "Sentir les vibrations",
        description: "Repérer l'emplacement de créatures en contact avec les mêmes surfaces que vous",
        reference: "PHB, pg. 377.",
        bullets: [
            "Dans un rayon donné, une créature avec la perception tellurique peut localiser précisément les créatures et les objets en mouvement, à condition que la créature dotée de cette perception et ce qu'elle détecte soient en contact avec la même surface ou le même liquide.",
            "La perception tellurique ne peut pas détecter les créatures dans les airs et ne compte pas comme une forme de vue."
        ]
    },
    {
        title: "Vision véritable",
        icon: "eye-shield",
        subtitle: "Voir dans l'obscurité",
        description: "Votre vision est améliorée dans un rayon donné ; elle perce ce qui suit",
        reference: "PHB, pg. 377.",
        bullets: [
            "Vous pouvez voir dans l'Obscurité normale et magique.",
            "Vous pouvez voir les créatures et les objets qui ont l'état Invisible.",
            "Les illusions visuelles vous apparaissent transparentes, et vous réussissez automatiquement les jets de sauvegarde contre elles.",
            "Vous discernez la véritable forme de toute créature ou objet que vous voyez et qui a été transformé par la magie.",
            "Vous voyez dans le Plan Éthéré."
        ]
    }
]

data_environment_cover = [
    {
        title: "Demi-couvert",
        icon: "broken-shield",
        subtitle: "Muret, mobilier, créatures",
        description: "Une cible a un demi-couvert si un obstacle bloque au moins la moitié de son corps",
        reference: "PHB, pg. 25-26.",
        bullets: [
            "L'obstacle peut être un muret, un gros meuble, un tronc d'arbre étroit ou une créature, qu'elle soit ennemie ou amie.",
            "Une cible avec un demi-couvert a un <b>bonus de +2 à la CA et aux jets de sauvegarde de Dextérité</b>.",
            "Si une cible est derrière plusieurs sources de couvert, seul le degré de couvert le plus protecteur s'applique"
        ]
    },
    {
        title: "Couvert des trois quarts",
        icon: "cracked-shield",
        subtitle: "Herse, meurtrière",
        description: "Une cible a un couvert des trois quarts si environ trois quarts de son corps sont couverts par un obstacle",
        reference: "PHB, pg. 25-26.",
        bullets: [
            "L'obstacle peut être une herse, une meurtrière ou un tronc d'arbre épais.",
            "Une cible avec un couvert des trois quarts a un <b>bonus de +5 à la CA et aux jets de sauvegarde de Dextérité</b>.",
            "Si une cible est derrière plusieurs sources de couvert, seul le degré de couvert le plus protecteur s'applique"
        ]
    },
    {
        title: "Couvert total",
        icon: "shield",
        subtitle: "Totalement dissimulé",
        description: "Une cible a un couvert total si elle est entièrement dissimulée par un obstacle",
        reference: "PHB, pg. 25-26.",
        bullets: [
            "Une cible avec un couvert total <b>ne peut pas être ciblée directement</b> par une attaque ou un sort, même si certains sorts peuvent atteindre une telle cible en l'incluant dans une zone d'effet.",
            "Si une cible est derrière plusieurs sources de couvert, seul le degré de couvert le plus protecteur s'applique"
        ]
    }
]
