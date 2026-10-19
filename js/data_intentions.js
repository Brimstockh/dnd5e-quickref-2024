data_intentions = [
    {
        id: "mon-tour-commence",
        title: "Mon tour commence",
        category: "combat-defense",
        description: "Repérez les ressources dont vous disposez pendant votre tour.",
        cost: "Déplacement, action et éventuellement action bonus",
        primaryRule: { parameter: "movement", slug: "se-deplacer" },
        relatedRules: [
            { parameter: "action", slug: "attaquer" },
            { parameter: "bonus", slug: "lancer-un-sort" },
            { parameter: "reaction", slug: "attaque-d-opportunite" },
            { parameter: "action", slug: "utiliser" }
        ],
        order: 10
    },
    {
        id: "attaquer",
        title: "Je veux attaquer",
        category: "combat-defense",
        description: "Choisissez une attaque et vérifiez les circonstances qui la modifient.",
        cost: "Action Attaquer ou attaque accordée par une capacité",
        primaryRule: { parameter: "action", slug: "attaquer" },
        relatedRules: [
            { parameter: "general", slug: "coup-critique" },
            { parameter: "general", slug: "avantage-et-desavantage" },
            { parameter: "environment", slug: "demi-couvert" },
            { parameter: "reaction", slug: "attaque-d-opportunite" }
        ],
        order: 20
    },
    {
        id: "se-defendre",
        title: "Je veux me défendre",
        category: "combat-defense",
        description: "Réduisez les risques en vous protégeant ou en exploitant le couvert.",
        cost: "Action Esquiver ou protection fournie par une situation",
        primaryRule: { parameter: "action", slug: "esquiver" },
        relatedRules: [
            { parameter: "general", slug: "avantage-et-desavantage" },
            { parameter: "environment", slug: "demi-couvert" },
            { parameter: "environment", slug: "couvert-des-trois-quarts" },
            { parameter: "environment", slug: "couvert-total" }
        ],
        order: 30
    },
    {
        id: "quitter-corps-a-corps",
        title: "Je veux quitter le corps-à-corps",
        category: "combat-defense",
        description: "Déplacez-vous sans provoquer l'attaque d'opportunité d'un adversaire.",
        cost: "Action Désengager",
        primaryRule: { parameter: "action", slug: "se-desengager" },
        relatedRules: [
            { parameter: "reaction", slug: "attaque-d-opportunite" },
            { parameter: "movement", slug: "se-deplacer" }
        ],
        order: 40
    },
    {
        id: "agripper-ennemi",
        title: "Je veux agripper un ennemi",
        category: "combat-defense",
        description: "Utilisez une attaque à mains nues pour imposer l'état Agrippé.",
        cost: "Une attaque à mains nues dans l'action Attaquer",
        primaryRule: { parameter: "action", slug: "agripper" },
        relatedRules: [
            { parameter: "condition", slug: "agrippe" },
            { parameter: "action", slug: "s-echapper" },
            { parameter: "movement", slug: "deplacement-en-prise" }
        ],
        order: 50
    },
    {
        id: "repousser-ennemi",
        title: "Je veux repousser ou renverser un ennemi",
        category: "combat-defense",
        description: "Une bousculade peut repousser une créature ou lui imposer l'état À terre.",
        cost: "Une attaque à mains nues dans l'action Attaquer",
        primaryRule: { parameter: "action", slug: "pousser" },
        relatedRules: [
            { parameter: "condition", slug: "a-terre" },
            { parameter: "movement", slug: "se-relever" }
        ],
        order: 60
    },
    {
        id: "preparer-action",
        title: "Je veux préparer une action",
        category: "combat-defense",
        description: "Définissez un déclencheur et l'action ou le déplacement que vous utiliserez ensuite.",
        cost: "Action Se préparer, puis une réaction avant le début de votre prochain tour",
        primaryRule: { parameter: "action", slug: "se-preparer" },
        relatedRules: [
            { parameter: "reaction", slug: "action-preparee" },
            { parameter: "general", slug: "concentration" }
        ],
        order: 70
    },
    {
        id: "reagir",
        title: "Je veux réagir à une action ennemie",
        category: "combat-defense",
        description: "Utilisez votre réaction en réponse à un déclencheur précis.",
        cost: "Une réaction, récupérée au début de votre prochain tour",
        primaryRule: { parameter: "reaction", slug: "attaque-d-opportunite" },
        relatedRules: [
            { parameter: "reaction", slug: "action-preparee" },
            { parameter: "reaction", slug: "lancer-un-sort" }
        ],
        order: 80
    },
    {
        id: "se-deplacer",
        title: "Je veux me déplacer",
        category: "movement",
        description: "Déplacez-vous jusqu'à votre vitesse, en répartissant votre mouvement autour de vos actions.",
        cost: "Déplacement jusqu'à votre vitesse",
        primaryRule: { parameter: "movement", slug: "se-deplacer" },
        relatedRules: [
            { parameter: "movement", slug: "ramper" },
            { parameter: "movement", slug: "grimper" },
            { parameter: "movement", slug: "nager" },
            { parameter: "movement", slug: "saut-en-hauteur" },
            { parameter: "movement", slug: "saut-en-longueur" }
        ],
        order: 10
    },
    {
        id: "se-deplacer-plus-vite",
        title: "Je veux me déplacer plus vite",
        category: "movement",
        description: "Gagnez du déplacement supplémentaire pour ce tour.",
        cost: "Action Foncer ou capacité équivalente",
        primaryRule: { parameter: "action", slug: "foncer" },
        relatedRules: [{ parameter: "movement", slug: "se-deplacer" }],
        order: 20
    },
    {
        id: "se-mettre-a-terre-ou-se-relever",
        title: "Je veux me mettre à terre ou me relever",
        category: "movement",
        description: "Tomber à terre est gratuit ; se relever coûte la moitié de votre vitesse.",
        cost: "Aucun coût pour se mettre à terre ; moitié de la vitesse pour se relever",
        primaryRule: { parameter: "movement", slug: "se-mettre-a-terre" },
        relatedRules: [
            { parameter: "condition", slug: "a-terre" },
            { parameter: "movement", slug: "se-relever" }
        ],
        order: 30
    },
    {
        id: "franchir-obstacle",
        title: "Je veux franchir un obstacle",
        category: "movement",
        description: "Adaptez votre déplacement au terrain, aux obstacles et aux différentes façons de vous mouvoir.",
        cost: "Selon le déplacement et le terrain",
        primaryRule: { parameter: "movement", slug: "grimper" },
        relatedRules: [
            { parameter: "movement", slug: "nager" },
            { parameter: "movement", slug: "saut-en-longueur" },
            { parameter: "movement", slug: "saut-en-hauteur" }
        ],
        order: 40
    },
    {
        id: "terrain-difficile",
        title: "Je dois me déplacer sur un terrain difficile",
        category: "movement",
        description: "Chaque mètre de terrain difficile coûte un mètre supplémentaire de déplacement.",
        cost: "Coût de déplacement augmenté",
        primaryRule: { parameter: "movement", slug: "terrain-difficile" },
        relatedRules: [{ parameter: "movement", slug: "se-deplacer" }],
        order: 50
    },
    {
        id: "lancer-sort",
        title: "Je veux lancer un sort",
        category: "magic",
        description: "Identifiez le temps d'incantation, la portée, les composantes et la concentration éventuelle.",
        cost: "Action, action bonus ou réaction selon le sort",
        primaryRule: { parameter: "action", slug: "lancer-un-sort" },
        relatedRules: [
            { parameter: "general", slug: "concentration" },
            { parameter: "reaction", slug: "lancer-un-sort" },
            { parameter: "bonus", slug: "lancer-un-sort" }
        ],
        order: 10
    },
    {
        id: "maintenir-concentration",
        title: "Je veux maintenir ma concentration",
        category: "magic",
        description: "Conservez un sort ou un effet actif aussi longtemps que ses règles le permettent.",
        cost: "Aucune action ; la concentration cesse dans les cas prévus",
        primaryRule: { parameter: "general", slug: "concentration" },
        relatedRules: [{ parameter: "action", slug: "lancer-un-sort" }],
        order: 20
    },
    {
        id: "degats-concentration",
        title: "Je subis des dégâts pendant ma concentration",
        category: "magic",
        description: "Faites immédiatement un jet de sauvegarde de Constitution pour maintenir l'effet.",
        cost: "Jet de sauvegarde de Constitution, DD 10 ou moitié des dégâts",
        primaryRule: { parameter: "general", slug: "concentration" },
        relatedRules: [{ parameter: "general", slug: "avantage-et-desavantage" }],
        order: 30
    },
    {
        id: "sort-action-bonus",
        title: "Je veux lancer un sort avec une action bonus",
        category: "magic",
        description: "Utilisez un sort dont le temps d'incantation est d'une action bonus.",
        cost: "Action bonus accordée par le sort",
        primaryRule: { parameter: "bonus", slug: "lancer-un-sort" },
        relatedRules: [{ parameter: "general", slug: "concentration" }],
        order: 40
    },
    {
        id: "utiliser-objet-magique",
        title: "Je veux utiliser un objet magique",
        category: "magic",
        description: "Consultez la description de l'objet pour connaître son activation et ses limites.",
        cost: "Selon la description de l'objet",
        primaryRule: { parameter: "action", slug: "utiliser" },
        relatedRules: [{ parameter: "action", slug: "improviser" }],
        order: 50
    },
    {
        id: "aider-allie",
        title: "Je veux aider un allié",
        category: "allies-states",
        description: "Aidez un allié sur un test de caractéristique ou donnez-lui un avantage sur une attaque.",
        cost: "Action Aider",
        primaryRule: { parameter: "action", slug: "aider" },
        relatedRules: [{ parameter: "general", slug: "avantage-et-desavantage" }],
        order: 10
    },
    {
        id: "secourir-allie",
        title: "Je veux secourir un allié à 0 PV",
        category: "allies-states",
        description: "Stabilisez une créature mourante avec les premiers soins.",
        cost: "Action Aider et test de Sagesse (Médecine) DD 10",
        primaryRule: { parameter: "action", slug: "stabiliser-une-creature" },
        relatedRules: [{ parameter: "condition", slug: "mourant" }],
        order: 20
    },
    {
        id: "tomber-a-zero-pv",
        title: "Je tombe à 0 PV",
        category: "allies-states",
        description: "Vérifiez l'état Mourant et les jets de sauvegarde contre la mort.",
        cost: "Jets de sauvegarde contre la mort au début de votre tour",
        primaryRule: { parameter: "condition", slug: "mourant" },
        relatedRules: [{ parameter: "condition", slug: "inconscient" }],
        order: 30
    },
    {
        id: "subir-un-etat",
        title: "Je subis un état",
        category: "allies-states",
        description: "Parcourez le catalogue des états, leurs effets et la manière d'y mettre fin.",
        cost: "Selon l'état concerné",
        relatedRules: [
            { parameter: "condition", slug: "aveugle" },
            { parameter: "condition", slug: "agrippe" },
            { parameter: "condition", slug: "a-terre" },
            { parameter: "condition", slug: "invisible" },
            { parameter: "condition", slug: "inconscient" },
            { parameter: "condition", slug: "entrave" },
            { parameter: "condition", slug: "incapacite" },
            { parameter: "condition", slug: "paralyse" },
            { parameter: "condition", slug: "petrifie" },
            { parameter: "condition", slug: "empoisonne" },
            { parameter: "condition", slug: "effraye" },
            { parameter: "condition", slug: "etourdi" },
            { parameter: "condition", slug: "charme" },
            { parameter: "condition", slug: "assourdi" },
            { parameter: "condition", slug: "epuisement" }
        ],
        order: 40
    },
    {
        id: "echapper-prise",
        title: "Je veux échapper à une prise",
        category: "allies-states",
        description: "Tentez de mettre fin à l'état Agrippé.",
        cost: "Action et test de Force (Athlétisme) ou Dextérité (Acrobaties)",
        primaryRule: { parameter: "action", slug: "s-echapper" },
        relatedRules: [{ parameter: "condition", slug: "agrippe" }],
        order: 50
    },
    {
        id: "se-cacher",
        title: "Je veux me cacher",
        category: "exploration",
        description: "Cherchez les conditions nécessaires pour devenir Invisible et rester caché.",
        cost: "Action Se cacher",
        primaryRule: { parameter: "action", slug: "se-cacher" },
        relatedRules: [
            { parameter: "condition", slug: "invisible" },
            { parameter: "environment", slug: "fortement-obscurci" },
            { parameter: "environment", slug: "couvert-des-trois-quarts" }
        ],
        order: 10
    },
    {
        id: "reperer-danger",
        title: "Je veux repérer un danger",
        category: "exploration",
        description: "Cherchez une créature, un objet dissimulé, une trace ou un signe non évident.",
        cost: "Action Rechercher ou décision du MJ selon la situation",
        primaryRule: { parameter: "action", slug: "rechercher" },
        relatedRules: [{ parameter: "environment", slug: "fortement-obscurci" }],
        order: 20
    },
    {
        id: "examiner-indice",
        title: "Je veux examiner un indice",
        category: "exploration",
        description: "Étudiez un objet, un livre, un souvenir ou un indice pour en tirer une information.",
        cost: "Action Étudier",
        primaryRule: { parameter: "action", slug: "etudier" },
        relatedRules: [{ parameter: "action", slug: "rechercher" }],
        order: 30
    },
    {
        id: "influencer-pnj",
        title: "Je veux convaincre, intimider ou tromper un PNJ",
        category: "exploration",
        description: "Jouez la conversation ; le MJ décide si un test est nécessaire pour influencer la créature.",
        cost: "Action Influencer si la situation exige une action",
        primaryRule: { parameter: "action", slug: "influencer" },
        relatedRules: [{ parameter: "action", slug: "improviser" }],
        order: 40
    },
    {
        id: "comprendre-intentions-pnj",
        title: "Je veux comprendre les intentions d'un PNJ",
        category: "exploration",
        description: "Observez son état d'esprit et ses motivations avec la compétence adaptée.",
        cost: "Action Rechercher si nécessaire",
        primaryRule: { parameter: "action", slug: "rechercher" },
        relatedRules: [{ parameter: "action", slug: "influencer" }],
        order: 50
    },
    {
        id: "manipuler-objet",
        title: "Je veux manipuler un objet",
        category: "exploration",
        description: "Une interaction simple peut être gratuite ; un objet exigeant une action utilise Utiliser.",
        cost: "Interaction gratuite ou action Utiliser selon l'objet",
        primaryRule: { parameter: "action", slug: "utiliser" },
        relatedRules: [{ parameter: "action", slug: "improviser" }],
        order: 60
    },
    {
        id: "improviser-action",
        title: "Je veux improviser une action",
        category: "exploration",
        description: "Décrivez votre intention ; le MJ indique si elle est possible et quel test est requis, le cas échéant.",
        cost: "Selon la situation et la décision du MJ",
        primaryRule: { parameter: "action", slug: "improviser" },
        relatedRules: [{ parameter: "movement", slug: "improviser" }],
        order: 70
    }
];
