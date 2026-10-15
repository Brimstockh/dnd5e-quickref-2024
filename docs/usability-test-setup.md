# Préparation des sessions utilisateurs

## 1. Préparer une version reproductible

Depuis un clone ou un worktree dédié de la branche évaluée :

```powershell
git switch chore/cleanup-optimization-phase2
git rev-parse HEAD
npm ci
npm run build:pages
npm run check:pages
```

Le SHA affiché doit être conservé dans les notes de session. Lancer ensuite le serveur statique prévu par le projet :

```powershell
npm run serve:test
```

Les participants utilisent l'URL locale affichée par le serveur. Ne pas utiliser le site public comme référence de version et ne pas déployer pour une session.

Avant la première session, vérifier une fois :

```powershell
npm run test:browser
npm run audit
```

Le contrôle automatisé dédié aux parcours est `tests/browser/usability-audit.spec.mjs`. Il s'exécute sur les deux projets Playwright déclarés : Chromium desktop 1440 × 900 et Chromium mobile tactile 390 × 844.

## 2. Isoler le stockage

Ne jamais vider le stockage global du navigateur personnel.

Privilégier l'une des méthodes suivantes :

1. une fenêtre privée dédiée à la session ;
2. un profil navigateur dédié nommé `dnd-ux-phase2` ;
3. un contexte Playwright isolé pour l'audit automatisé.

Entre deux participants, fermer le contexte ou le profil de test et en recréer un. Si un nettoyage manuel est indispensable, le faire uniquement dans ce profil dédié et noter l'opération. Ne pas supprimer de données du profil de développement ou du compte du participant.

## 3. Données fictives

Utiliser uniquement les valeurs suivantes ou des valeurs équivalentes clairement fictives :

| Usage | Données proposées |
| --- | --- |
| Profil 1 | Ariane test, classe fictive ou non renseignée, niveau 3 |
| Profil 2 | Borin test, classe fictive ou non renseignée, niveau 4 |
| Note | Préparer la rencontre de la forêt |
| Liste | Session forêt |
| Objet de liste | Monstres ou Sorts D&D 2024 |
| Brouillon | Un personnage de démonstration sans donnée personnelle |

Pour UX-10, créer deux profils et deux fiches avant la tâche. Les liens doivent rester associés à leurs identifiants de profil. Pour UX-11, utiliser l'export JSON généré dans le profil dédié ; ne pas préparer un export contenant des données réelles dans le dépôt.

## 4. Ordres de passage

Les tâches choisies doivent couvrir les huit scénarios principaux au total, sans imposer les onze à chaque personne.

### Ordre A — découverte d'abord

1. UX-01 — sort
2. UX-03 — règle de combat
3. UX-05 — arme
4. UX-08 — préparation de session
5. UX-09 ou UX-11 selon le profil

### Ordre B — espaces et création d'abord

1. UX-08 — préparation de session
2. UX-04 — comparateur
3. UX-06 — don
4. UX-02 — monstre
5. UX-07 — Univers
6. UX-10 ou UX-11 selon le profil

L'ordre ne doit pas changer l'état nécessaire à une autre tâche. Réinitialiser ou recréer l'état avant une tâche qui demande deux profils, une fiche ou un export. Noter l'ordre dans la grille.

## 5. Checklist du jour de session

- [ ] Version, branche et SHA notés.
- [ ] Serveur local accessible depuis l'appareil testé.
- [ ] Navigateur et profil de test isolés.
- [ ] Viewport, tactile et zoom vérifiés.
- [ ] Données fictives préparées si UX-08, UX-10 ou UX-11 est prévu.
- [ ] Grille de résultats et chronomètre prêts.
- [ ] Accord de capture demandé séparément si nécessaire.
- [ ] Aucun compte, nom réel ou fiche personnelle demandé.
- [ ] Notes individuelles stockées hors dépôt.

## 6. Fin de session

Fermer le profil ou le contexte de test, supprimer les données fictives si le protocole local l'exige, puis conserver uniquement les mesures anonymisées. Ne pas versionner les exports JSON, captures ou enregistrements individuels.
