# Rapport de classification des exercices — Mission 13

Autorité : `classifyExerciseAxes` / `exerciseWorkModality` (`sessionStructureGraph.js`)  
Édition : `classification=modality-authority-v1`

## Règles

| Priorité | Source | Peut forcer cardio ? |
|---|---|---|
| 1 | Nom / banque isométrique | Non (→ isometric) |
| 2 | Nom / banque force (`STRENGTH_NAME_NOT_CARDIO`) | **Non** |
| 3 | Nom / banque cardio explicite | Oui |
| 4 | `type`/`modality` = cardio **et** nom cardio | Oui |
| 5 | `programCategory` = cardio **seule** | **Non** |
| défaut | — | strength_reps |

Une durée (`20 min`, `45s`) ne suffit pas. Le mot « endurance » dans un intitulé libre non plus.

## Cas programme réel (6 créneaux)

| Jour | Avant (v11) | Après (v12) |
|---|---|---|
| Lundi | course → cardio | course → cardio |
| Mardi | développé couché incliné → **cardio (bug)** | **strength_reps** ; wall sit → **isometric** |
| Mercredi | développé Arnold → **cardio (bug)** | **strength_reps** ; gainage → **isometric** |
| Vendredi | course → cardio | course → cardio |
| Samedi | développé couché incliné → **cardio** | **strength_reps** |
| Dimanche | développé Arnold → **cardio** | **strength_reps** |

## Registre (extrait)

| ID / nom | Initiale | Finale | Justification | Incertitude |
|---|---|---|---|---|
| Développé Arnold | cardio (programCategory) | strength_reps | STRENGTH_NAME_NOT_CARDIO | faible |
| Développé couché incliné aux haltères | cardio | strength_reps | idem | faible |
| Course endurance fondamentale | cardio | cardio | CARDIO_NAME_EXPLICIT | faible |
| Wall sit | strength/indet. | isometric | ISOMETRIC_NAME | faible |
| Gainage | isometric éventuel | isometric | ISOMETRIC_NAME | faible |
| Exercice personnalisé sans banque | — | strength_reps (défaut) | pas d’invention | **élevée** si métadonnées absentes |

## Producteurs / consommateurs

- `extractSessionTemplates` → cardioKeys, modalities, strengthExerciseCount  
- `relateSessionTemplates` / `clusterSessionFamilies` / `describeFamilyMuscleProfile`  
- Appariement créneau (`sessionSlotMatching`) via composition force  
- Volumes prescrits / adhérence (cascade)

## Audit banque

Tests unitaires Mission 13 couvrent le programme réel et des noms critiques.  
Audit exhaustif de toute la banque : **à rejouer live** (export classification dans le dossier d’audit).  
Abstention : si aucune métadonnée ne permet de conclure → ne pas inventer (défaut strength_reps + statut incertitude).
