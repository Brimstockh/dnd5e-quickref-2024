# Modèle d'analyse UX — après les sessions

Ce modèle est destiné à la synthèse anonymisée après les sessions réelles. Il ne doit pas être rempli avec des résultats inventés ou avec les succès Playwright.

## 1. Périmètre de collecte

| Élément | Valeur |
| --- | --- |
| Version / commit |  |
| Participants réalisés |  |
| Profils représentés |  |
| Sessions desktop |  |
| Sessions mobile |  |
| Scénarios non évalués |  |
| Données individuelles conservées hors dépôt | oui / non |

## 2. Synthèse par scénario

Compter uniquement les tâches évaluées. Calculer la médiane des durées observées, sans transformer un dépassement indicatif en échec automatique.

| Scénario | Évalués | Autonomes | Aidés | Échecs | Médiane (s) | Erreurs fréquentes | Chemins observés | Commentaire récurrent |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| UX-01 |  |  |  |  |  |  |  |  |
| UX-02 |  |  |  |  |  |  |  |  |
| UX-03 |  |  |  |  |  |  |  |  |
| UX-04 |  |  |  |  |  |  |  |  |
| UX-05 |  |  |  |  |  |  |  |  |
| UX-06 |  |  |  |  |  |  |  |  |
| UX-07 |  |  |  |  |  |  |  |  |
| UX-08 |  |  |  |  |  |  |  |  |
| UX-09 |  |  |  |  |  |  |  |  |
| UX-10 |  |  |  |  |  |  |  |  |
| UX-11 |  |  |  |  |  |  |  |  |

Lorsque l'effectif le permet, refaire cette synthèse par appareil et par profil d'expérience. Ne pas comparer des groupes trop petits comme s'ils étaient représentatifs.

## 3. Analyse transversale

### Découvrabilité

- Recherche globale :
- Différence navigation / recherche :
- Cinq espaces :
- Espace personnel :
- Mode session :

### Compréhension

- Termes ou libellés incompris :
- Création / Ma table :
- Profil / fiche autonome :
- Favori / note / liste :
- Autosave / export JSON :

### Mobile et contexte de partie

- Contrôles peu visibles :
- Débordements ou manipulations difficiles :
- Information trop éloignée de l'action :
- Temps ou détour gênant pendant une partie :

### Valeur perçue

- Référence rapide versus pages détaillées :
- Comparateur :
- Assistant de création :
- Profils et fiches :
- Favoris, notes et listes :
- Mode session :

Une fonctionnalité non utilisée dans une tâche n'est pas automatiquement inutile. Noter la demande ou l'absence d'intérêt comme observation à confirmer.

## 4. Fiche d'un problème

| Champ | Contenu |
| --- | --- |
| ID observation | OBS-__ |
| Scénario(s) | UX-__ |
| Participants concernés | P__ ; nombre __ |
| Appareil / profil |  |
| Observation vérifiée |  |
| Hypothèse explicative |  |
| Impact sur le parcours |  |
| Fréquence observée | __ / __ |
| Sévérité proposée | S0 / S1 / S2 / S3 |
| Confiance dans le constat | faible / moyenne / élevée |
| Vérification nécessaire |  |

La sévérité combine impact, fréquence observée et criticité du scénario. Une observation unique peut être S0/S1 si elle bloque un parcours critique, mais ne doit pas être présentée comme généralisée sans confirmation.

## 5. Backlog de la phase 3

Une entrée correspond à une amélioration ciblée d'une interaction existante. Ne pas créer automatiquement une nouvelle fonctionnalité à partir d'une demande isolée.

| ID | Problème | Source | Fréquence | Impact | Sévérité | Recommandation ciblée | Effort | Confiance | Statut |
| --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- |
| UX-FIX-001 |  | OBS-__ / test technique | __ / __ |  | S0–S3 |  | Faible / moyen / élevé | Faible / moyenne / élevée | À confirmer / confirmé / résolu |

Prioriser en premier les éléments qui réduisent l'accès à une information, les erreurs de données, les étapes inutiles ou l'ambiguïté des interactions, tout en préservant les URLs, les contrats de stockage et la cohérence visuelle.

## 6. Demandes de fonctionnalités à part

| Demande | Participant(s) | Scénario | Besoin exprimé | Preuve disponible | Décision à prendre |
| --- | --- | --- | --- | --- | --- |
|  | P__ | UX-__ |  |  | À étudier / hors périmètre / non retenue |

Une demande de fonctionnalité reste séparée du backlog de correction tant qu'un problème d'usage existant n'est pas suffisamment étayé.

## 7. Décision de sortie vers la phase 3

- [ ] Les observations humaines sont séparées des résultats automatisés.
- [ ] Les tâches non évaluées ne sont pas comptées comme des échecs.
- [ ] Les résultats individuels restent anonymes et privés.
- [ ] Chaque problème retenu possède une source et une sévérité justifiée.
- [ ] Les hypothèses à vérifier sont explicitement listées.
- [ ] Les demandes de fonctionnalités sont séparées.
- [ ] Le backlog ne lance pas de refonte générale.
