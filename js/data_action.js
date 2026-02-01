data_action = [
    {
        title: "Attaquer",
        icon: "crossed-swords",
        subtitle: "Attaque au corps à corps ou à distance",
        description: "Effectuez un jet d'attaque avec une arme ou une attaque à mains nues.",
        reference: "PHB, pgs. 12, 361.",
        bullets: [
            "Vous pouvez dégainer ou rengainer une arme lorsque vous faites une attaque dans le cadre de cette action. Faites-le avant ou après l'attaque.",
            "Certaines capacités, comme le trait <i>Attaque supplémentaire</i> du guerrier, vous permettent d'effectuer plus d'une attaque avec cette action. Chaque attaque est un jet séparé et peut viser des créatures différentes. Vous pouvez vous déplacer entre ces attaques.",
            "Lorsque vous attaquez avec une arme de corps à corps légère, vous pouvez utiliser une action bonus pour attaquer avec une autre arme légère dans votre autre main (voir l'action bonus <i>Attaque de l'autre main</i>).",
            "Vous pouvez utiliser une attaque à mains nues pour <i>Agripper</i>, <i>Pousser</i> ou infliger des dégâts à un adversaire. Pour infliger des dégâts, faites un jet d'attaque contre la cible avec un bonus égal à votre modificateur de Force plus votre bonus de maîtrise, et infligez (1 + modificateur de FOR) dégâts contondants.",
            "Certaines conditions donnent l'avantage sur l'attaque : attaques contre des cibles aveuglées, paralysées, pétrifiées, entravées, étourdies ou inconscientes ; attaques au corps à corps contre des cibles à terre ; attaques par des assaillants invisibles ou cachés.",
            "Certaines conditions donnent le désavantage sur l'attaque : attaques contre des cibles invisibles ou cachées ; attaques à distance contre des cibles à terre ; attaques par des assaillants aveuglés, effrayés, empoisonnés ou entravés."
        ]
    },
    {
        title: "Agripper",
        icon: "grab",
        subtitle: "Attaque à mains nues spéciale",
        description: "Tenter d'agripper une créature ou de lutter avec elle",
        reference: "PHB, pg. 377.",
        bullets: [
            "Vous pouvez utiliser l'action <i>Attaquer</i> pour effectuer une attaque à mains nues spéciale : une prise. Si vous pouvez effectuer plusieurs attaques avec l'action Attaquer, cette attaque remplace l'une d'elles.",
            "La cible de votre prise ne doit pas être de plus d'une taille supérieure à la vôtre, et vous devez avoir une main libre pour l'agripper.",
            "La cible doit réussir un jet de sauvegarde de Force ou de Dextérité (elle choisit lequel), sinon elle subit l'état <i>Agrippé</i>. Le DD de ce jet et de toute tentative d'évasion est de 8 + modificateur de FOR + bonus de maîtrise de l'attaquant."
        ]
    },
    {
        title: "Pousser",
        icon: "hand",
        subtitle: "Attaque à mains nues spéciale",
        description: "Pousser une créature, pour la mettre à terre ou l'éloigner de vous",
        reference: "PHB, pg. 377.",
        bullets: [
            "Vous pouvez utiliser l'action <i>Attaquer</i> pour effectuer une attaque à mains nues spéciale : une bousculade. Si vous pouvez effectuer plusieurs attaques avec l'action Attaquer, cette attaque remplace l'une d'elles.",
            "La cible de votre bousculade ne doit pas être de plus d'une taille supérieure à la vôtre.",
            "La cible doit réussir un jet de sauvegarde de Force ou de Dextérité (elle choisit lequel), sinon elle est soit repoussée de 1,5 m, soit mise à terre (l'attaquant choisit). Le DD du jet de sauvegarde est de 8 + modificateur de FOR + bonus de maîtrise de l'attaquant."
        ]
    },
    {
        title: "Lancer un sort",
        icon: "magic-swirl",
        subtitle: "Temps d'incantation : 1 action",
        description: "Lancer un sort dont le temps d'incantation est de 1 action",
        reference: "PHB, pg. 235-238, 363.",
        bullets: [
            "Lors d'un tour, vous ne pouvez dépenser qu'un seul emplacement de sort pour lancer un sort. Vous ne pouvez pas, par exemple, lancer un sort avec un emplacement comme action et un autre en utilisant votre action bonus au même tour.",
            "La cible d'un sort doit être à portée du sort. Pour cibler quelque chose, vous devez avoir un chemin dégagé, donc la cible ne peut pas être derrière un couvert total.",
            "Les sorts avec des composantes matérielles ne consomment pas le matériel sauf indication explicite. Sauf si le coût est précisé, vous pouvez considérer que le coût est négligeable et que le matériel est simplement disponible dans une bourse à composantes.",
            "Certains sorts exigent que vous mainteniez votre concentration pour conserver leur magie. Si vous perdez la concentration, le sort se termine. Vous perdez la concentration si vous lancez un autre sort qui l'exige ou si vous êtes neutralisé. Chaque fois que vous subissez des dégâts, vous devez faire un jet de sauvegarde de Constitution pour maintenir votre concentration. Le DD est égal à 10 ou à la moitié des dégâts subis (le plus élevé des deux), jusqu'à un maximum de 30."
        ]
    },
    {
        title: "Foncer",
        icon: "sprint",
        subtitle: "Vitesse de déplacement doublée",
        description: "Gagner du déplacement supplémentaire pour ce tour",
        reference: "PHB, pg. 365.",
        bullets: [
            "L'augmentation est égale à votre vitesse, après application des modificateurs."
        ]
    },
    {
        title: "Se désengager",
        icon: "journey",
        subtitle: "Empêcher les attaques d'opportunité",
        description: "Votre déplacement ne provoque pas d'attaques d'opportunité pour le reste du tour",
        reference: "PHB, pg. 366.",
        bullets: [
        ]
    },
    {
        title: "Esquiver",
        icon: "aura",
        subtitle: "Augmenter les défenses",
        description: "Se concentrer entièrement sur l'évitement des attaques",
        reference: "PHB, pg. 366.",
        bullets: [
            "Jusqu'au début de votre prochain tour, tout jet d'attaque contre vous a un désavantage si vous pouvez voir l'attaquant, et vous effectuez vos jets de sauvegarde de Dextérité avec avantage.",
            "Vous perdez ce bénéfice si vous êtes <i>Incapacité</i> ou si votre vitesse est de 0."
        ]
    },
    {
        title: "S'échapper",
        icon: "manacles",
        subtitle: "Échapper à une prise",
        description: "Échapper à une prise",
        reference: "PHB, pg. 367.",
        bullets: [
            "Pour échapper à une prise, vous devez réussir un test de Force (Athlétisme) ou de Dextérité (Acrobaties) contre le DD d'évasion de la prise.",
            "Échapper à d'autres états qui vous entravent (comme des menottes) peut nécessiter un test de Dextérité ou de Force, selon l'état."
        ]
    },
    {
        title: "Aider",
        icon: "telepathy",
        subtitle: "Donner l'avantage à un allié",
        description: "Donner l'avantage à un allié sur un test de caractéristique ou une attaque",
        reference: "PHB, pg. 368.",
        bullets: [
            "Vous pouvez choisir une de vos maîtrises de compétence ou d'outil et un allié suffisamment proche pour que vous puissiez l'aider verbalement ou physiquement lorsqu'il effectue un test de caractéristique. Cet allié a l'avantage sur le prochain test de caractéristique avec la compétence ou l'outil choisi.",
            "Sinon, vous pouvez choisir de distraire un ennemi à 1,5 m de vous, donnant l'avantage au prochain jet d'attaque contre cet ennemi.",
            "L'avantage expire s'il n'est pas utilisé avant le début de votre prochain tour."
        ]
    },
    {
        title: "Utiliser",
        icon: "snatch",
        subtitle: "Interagir, utiliser des capacités spéciales",
        description: "Interagir avec un objet ou utiliser des capacités d'objet spéciales",
        reference: "PHB, pg. 377.",
        bullets: [
            "Vous interagissez normalement avec un objet tout en faisant autre chose, par exemple lorsque vous dégainez une épée dans le cadre de l'action Attaquer.",
            "Quand un objet requiert une action pour son utilisation, vous effectuez l'action <i>Utiliser</i>."
        ]
    },
    {
        title: "Utiliser un bouclier",
        icon: "round-shield",
        subtitle: "Équiper ou déséquiper un bouclier",
        description: "Équiper ou déséquiper un bouclier",
        reference: "PHB, pgs. .",
        bullets: [
            "Les boucliers nécessitent l'action <i>Utiliser</i> pour être équipés ou retirés.",
            "Les armures prennent plusieurs minutes à enfiler ou retirer.",
            "Vous ne gagnez le bonus de Classe d'Armure d'un bouclier que si vous êtes formé à son utilisation."
        ]
    },
    {
        title: "Se cacher",
        icon: "hood",
        subtitle: "Essayer de se dissimuler",
        description: "Essayer de se dissimuler",
        reference: "PHB, pg. 368.",
        bullets: [
            "Vous devez réussir un test de Dextérité (Discrétion) DD 15 lorsque vous êtes Fortement obscurci ou derrière au moins un couvert des trois quarts, et vous devez être hors de la ligne de vue de tout ennemi.",
            "Si vous pouvez voir une créature, vous pouvez discerner si elle peut vous voir.",
            "En cas de réussite, vous avez l'état <i>Invisible</i>. Notez le total de votre test : c'est le DD d'un test de Sagesse (Perception) pour qu'une créature vous trouve.",
            "L'état se termine immédiatement après que vous émettez un son plus fort qu'un chuchotement, qu'un ennemi vous trouve, que vous effectuez un jet d'attaque ou que vous lancez un sort avec une composante verbale."
        ]
    },
    {
        title: "Influencer",
        icon: "magnifying-glass",
        subtitle: "Pousser un monstre à faire quelque chose.",
        description: "Pousser un monstre à faire quelque chose.",
        reference: "PHB, pg. 369.",
        bullets: [
            "Décrivez ou jouez la manière dont vous communiquez avec la créature. Tenter de tromper, intimider, amuser ou persuader ?",
            "Votre MJ détermine si un test de caractéristique est nécessaire."
        ]
    },
    {
        title: "Rechercher",
        icon: "magnifying-glass",
        subtitle: "Déceler quelque chose qui n'est pas évident.",
        description: "Déceler quelque chose qui n'est pas évident.",
        reference: "PHB, pg. 373.",
        bullets: [
            "Vous faites un test de Sagesse pour discerner quelque chose qui n'est pas évident.",
            "Ex. État d'esprit d'une créature = Perspicacité, Maladie ou cause de la mort d'une créature = Médecine, Créature ou objet dissimulé = Perception, Traces ou nourriture = Survie",
            "Votre MJ peut demander des tests avec d'autres caractéristiques comme l'Intelligence."
        ]
    },
    {
        title: "Étudier",
        icon: "magnifying-glass",
        subtitle: "Étudier votre mémoire, un livre ou un indice.",
        description: "Étudier votre mémoire, un livre ou un indice.",
        reference: "PHB, pg. 375.",
        bullets: [
            "Vous faites un test d'Intelligence pour étudier une source de connaissances et vous rappeler une information importante à son sujet."
        ]
    },
    {
        title: "Se préparer",
        icon: "stopwatch",
        subtitle: "Attendre une circonstance particulière.",
        description: "Choisir un déclencheur et une réaction",
        reference: "PHB, pg. 372.",
        bullets: [
            "Vous utilisez l'action <i>Se préparer</i> pendant votre tour, ce qui vous permet d'agir en dépensant une Réaction avant le début de votre prochain tour.",
            "Décidez quelle circonstance perceptible déclenchera votre Réaction.",
            "Choisissez l'action que vous effectuerez en réponse à ce déclencheur, ou choisissez de vous déplacer jusqu'à votre vitesse en réponse à celui-ci.",
            "Lorsque le déclencheur se produit, vous pouvez soit utiliser votre Réaction juste après la fin du déclencheur, soit ignorer le déclencheur.",
            "Lorsque vous préparez un sort, vous le lancez normalement mais vous retenez son énergie, que vous libérez avec votre réaction lorsque le déclencheur se produit. Pour être préparé, un sort doit avoir un temps d'incantation de 1 action, et maintenir la magie du sort exige une concentration."
        ]
    },
    {
        title: "Utiliser un trait de classe",
        icon: "embrassed-energy",
        subtitle: "Certaines capacités utilisent des actions",
        description: "Utiliser un trait racial ou de classe qui utilise une action",
        reference: "Voir la page de la classe pour plus d'informations.",
        bullets: [
        ]
    },
    {
        title: "Stabiliser une créature",
        icon: "first-aid",
        subtitle: "Stabiliser une créature mourante.",
        description: "Empêcher une créature mourante d'avoir à faire des jets de sauvegarde contre la mort",
        reference: "PHB, pg. 29.",
        bullets: [
            "Faites un test de Sagesse (Médecine) DD 10.",
            "En cas de réussite, la créature est stable et n'a plus besoin de faire de jets de sauvegarde contre la mort même si elle a 0 points de vie.",
            "Si elle subit des dégâts, elle cesse d'être stable et doit à nouveau faire des jets de sauvegarde contre la mort.",
            "Une créature stable regagne 1 point de vie après 1d4 heures si elle n'est pas soignée."
        ]
    },
    {
        title: "Improviser",
        icon: "juggler",
        subtitle: "Toute action\nqui n'est pas sur cette liste",
        description: "Effectuer toute action que vous pouvez imaginer",
        reference: "PHB, pg. 15.",
        bullets: [
            "Lorsque vous décrivez une action qui n'est pas détaillée ailleurs dans les règles, le MJ vous dit si cette action est possible et quel type de jet vous devez faire, le cas échéant, pour déterminer la réussite ou l'échec."
        ]
    }
]
