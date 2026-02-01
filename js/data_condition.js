data_condition = [
    {
        title: "Aveuglé",
        icon: "one-eyed",
        subtitle: "Vous ne voyez pas",
        description: "Vous ne voyez pas",
        reference: "PHB, pg. 361.",
        bullets: [
            "Vous échouez automatiquement à tout test de caractéristique nécessitant la vue.",
            "Vous avez le désavantage aux jets d'attaque.",
            "Les jets d'attaque contre vous ont l'avantage."
        ]
    },
    {
        title: "Charmé",
        icon: "smitten",
        subtitle: "Vous êtes charmé",
        description: "Vous êtes charmé par une autre créature",
        reference: "PHB, pg. 363.",
        bullets: [
            "Vous ne pouvez pas attaquer l'enchanteur ni le cibler avec des capacités ou effets magiques nuisibles.",
            "L'enchanteur a l'avantage aux tests de caractéristique pour interagir socialement avec vous."
        ]
    },
    {
        title: "Assourdi",
        icon: "elf-ear",
        subtitle: "Vous n'entendez pas",
        description: "Vous n'entendez pas",
        reference: "PHB, pg. 365.",
        bullets: [
            "Vous échouez automatiquement à tout test de caractéristique nécessitant l'ouïe."
        ]
    },
    {
        title: "Épuisement",
        icon: "crawl",
        subtitle: "Vous êtes épuisé",
        description: "L'épuisement est mesuré en six niveaux",
        reference: "PHB, pg. 366.",
        bullets: [
            "<table><tr><th>Niveau</th><th></th><th></th><th style='text-align:left'>Tests d20</th><th></th><th></th><th>Vitesse</th></tr><tr><td>1</td><td></td><td></td><td>-2</td><td></td><td></td><td>-5 ft.</td></tr><tr><td>2</td><td></td><td></td><td>-4</td><td></td><td></td><td>-10 ft.</td></tr><tr><td>3</td><td></td><td></td><td>-6</td><td></td><td></td><td>-15 ft.</td></tr><tr><td>4</td><td></td><td></td><td>-8</td><td></td><td></td><td>-20 ft.</td></tr><tr><td>5</td><td></td><td></td><td>-10</td><td></td><td></td><td>-25 ft.</td></tr><tr><td>6</td><td></td><td></td><td>Mort</td><td></td><td></td><td>Mort</td></tr></table>",
            "Cette condition est cumulative. Chaque fois que vous la recevez, vous gagnez 1 niveau d'Épuisement. Vous mourez si votre niveau d'Épuisement est de 6.",
            "Terminer un repos long réduit votre niveau d'épuisement de 1. Quand votre niveau d'épuisement atteint 0, la condition se termine."
        ]
    },
    {
        title: "Effrayé",
        icon: "sharp-smile",
        subtitle: "Vous êtes effrayé",
        description: "Vous êtes effrayé",
        reference: "PHB, pg. 367.",
        bullets: [
            "Vous avez le désavantage aux tests de caractéristique et aux jets d'attaque tant que la source de la peur est dans votre ligne de vue.",
            "Vous ne pouvez pas vous rapprocher volontairement de la source de la peur."
        ]
    },
    {
        title: "Agrippé",
        icon: "grab",
        subtitle: "Vous êtes agrippé",
        description: "Vous êtes agrippé",
        reference: "PHB, pg. 367.",
        bullets: [
            "Votre vitesse est de 0 et ne peut pas augmenter.",
            "Vous avez le désavantage aux jets d'attaque contre toute cible autre que l'agrippeur.",
            "L'agrippeur peut vous traîner ou vous porter lorsqu'il se déplace, mais chaque pied de déplacement coûte 1 pied supplémentaire, sauf si vous êtes Minuscule ou au moins deux tailles plus petit."
        ]
    },
    {
        title: "Incapacité",
        icon: "internal-injury",
        subtitle: "Vous ne pouvez pas effectuer d'actions ni de réactions",
        description: "Vous ne pouvez pas effectuer d'actions ni de réactions",
        reference: "PHB, pg. 369.",
        bullets: [
            "Votre concentration est rompue.",
            "Vous ne pouvez pas parler.",
            "Vous avez le désavantage aux jets d'initiative."
        ]
    },
    {
        title: "Invisible",
        icon: "invisible",
        subtitle: "Vous ne pouvez pas être vu",
        description: "Vous ne pouvez pas être vu sans l'aide de la magie ou d'un sens spécial",
        reference: "PHB, pg. 370.",
        bullets: [
            "Vous avez l'avantage aux jets d'initiative et aux jets d'attaque, sauf si votre cible peut d'une manière ou d'une autre vous voir.",
            "Les jets d'attaque contre vous ont le désavantage, sauf si l'attaquant peut d'une manière ou d'une autre vous voir",
            "Vous n'êtes pas affecté par un effet qui exige que sa cible soit vue, sauf si le créateur de l'effet peut d'une manière ou d'une autre vous voir. Tout équipement que vous portez ou transportez est également dissimulé."
        ]
    },
    {
        title: "Paralysé",
        icon: "internal-injury",
        subtitle: "Vous êtes paralysé",
        description: "Vous ne pouvez rien faire",
        reference: "PHB, pg. 371.",
        bullets: [
            "Vous avez l'état Incapacité.",
            "Votre vitesse est de 0 et ne peut pas augmenter.",
            "Les jets d'attaque contre vous ont l'avantage et toute attaque qui vous touche est un coup critique si l'attaquant est à 1,5 m de vous.",
            "Vous échouez automatiquement aux jets de sauvegarde de Force et de Dextérité."
        ]
    },
    {
        title: "Pétrifié",
        icon: "stone-pile",
        subtitle: "Vous êtes transformé en pierre",
        description: "Vous êtes transformé, ainsi que tous les objets non magiques que vous portez ou transportez, en une substance solide et inanimée (souvent de la pierre)",
        reference: "PHB, pg. 372.",
        bullets: [
            "Votre poids est multiplié par dix et vous cessez de vieillir.",
            "Vous avez l'état Incapacité.",
            "Votre vitesse est de 0 et ne peut pas augmenter.",
            "Les jets d'attaque contre vous ont l'avantage.",
            "Vous échouez automatiquement aux jets de sauvegarde de Force et de Dextérité.",
            "Vous avez la résistance à tous les dégâts.",
            "Vous êtes immunisé contre l'état Empoisonné."
        ]
    },
    {
        title: "Empoisonné",
        icon: "deathcab",
        subtitle: "Vous êtes empoisonné",
        description: "Vous êtes empoisonné",
        reference: "PHB, pg. 372.",
        bullets: [
            "Vous avez le désavantage aux jets d'attaque et aux tests de caractéristique."
        ]
    },
    {
        title: "À terre",
        icon: "crawl",
        subtitle: "Vous êtes à terre",
        description: "Vous êtes à terre",
        reference: "PHB, pg. 372.",
        bullets: [
            "Votre seule option de déplacement est de ramper, à moins de vous relever. Si votre vitesse est de 0, vous ne pouvez pas vous relever.",
            "Vous avez le désavantage aux jets d'attaque.",
            "Les jets d'attaque contre vous ont l'avantage si l'attaquant est à 1,5 m de vous, sinon le jet d'attaque a le désavantage."
        ]
    },
    {
        title: "Entravé",
        icon: "imprisoned",
        subtitle: "Vous êtes entravé",
        description: "Vous êtes entravé",
        reference: "PHB, pg. 373.",
        bullets: [
            "Votre vitesse est de 0 et ne peut pas augmenter.",
            "Vous avez le désavantage aux jets d'attaque.",
            "Les jets d'attaque contre vous ont l'avantage.",
            "Vous avez le désavantage aux jets de sauvegarde de Dextérité."
        ]
    },
    {
        title: "Étourdi",
        icon: "internal-injury",
        subtitle: "Vous êtes étourdi",
        description: "Vous êtes étourdi",
        reference: "PHB, pg. 376.",
        bullets: [
            "Vous avez l'état Incapacité.",
            "Les jets d'attaque contre vous ont l'avantage.",
            "Vous échouez automatiquement aux jets de sauvegarde de Force et de Dextérité."
        ]
    },
    {
        title: "Inconscient",
        icon: "coma",
        subtitle: "Vous êtes inconscient",
        description: "Vous êtes inconscient",
        reference: "PHB, pg. 377.",
        bullets: [
            "Vous avez les états Incapacité et À terre et vous lâchez ce que vous tenez.",
            "Votre vitesse est de 0 et ne peut pas augmenter.",
            "Les jets d'attaque contre vous ont l'avantage.",
            "Toute attaque qui vous touche est un coup critique si l'attaquant est à 1,5 m de vous.",
            "Vous échouez automatiquement aux jets de sauvegarde de Force et de Dextérité."
        ]
    },
    {
        title: "Mourant",
        icon: "dead-head",
        subtitle: "Vous êtes mourant",
        description: "Vous êtes tombé à zéro points de vie et vous êtes mourant",
        reference: "PHB, pg. 197.",
        bullets: [
            "Si vous êtes réduit à 0 points de vie par des dégâts qui ne vous tuent pas, vous tombez inconscient et vous êtes mourant.",
            "Si vous recevez des soins, vous reprenez immédiatement conscience et vous n'êtes plus mourant.",
            "Quand vous commencez votre tour avec 0 points de vie, vous devez faire un jet de sauvegarde contre la mort sans modificateurs.",
            "10 ou plus est une réussite, 9 ou moins un échec.",
            "Au troisième succès, vous devenez stable.",
            "Au troisième échec, vous mourez.",
            "Un 1 compte comme deux échecs.",
            "Un 20 vous fait immédiatement regagner 1 point de vie.",
            "Si vous subissez des dégâts en étant mourant, vous subissez un échec. Si c'est un coup critique, vous subissez 2 échecs.",
            "Vous pouvez être stabilisé par un allié qui effectue l'action Aider (Stabiliser) et réussit un test de Sagesse (Médecine) DD 10.",
            "Une fois stable, vous êtes à 0 PV, toujours inconscient, mais plus mourant. Vous regagnez 1 point de vie après 1d4 heures si vous n'êtes pas soigné."
        ]
    }
]
