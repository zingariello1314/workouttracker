# Politique d’analyse temporelle — huit périodes

## Intentions

| Période | Chercher | Éviter |
|---|---|---|
| Aujourd’hui | Séance du jour, écarts programme, records du jour, retour du jour | Recycler un PR vieux de 6 jours comme nouveauté |
| 7 jours | Nouveautés, rythme, reprises récentes, vs semaine préc. | Recyclage quotidien sans évolution |
| 30 jours | Trajectoires, fréquence vs densité, interruptions | Portraits longs (année) |
| 3 mois | Phases, ruptures, blocs comparables | Saisonnalité inventée |
| 6 mois | Trimestres, tiers, avant/après interruption ou programme | Toutes les découpes mécaniques |
| 1 an / 2 ans / Toujours | Grandes phases, niveau historique, répertoire | Tendance longue sur historique insuffisant |

## Stratégies de comparaison (disponibles / à étendre)

Déjà utilisées en parties : fenêtre vs précédente, early/late d’arc, prev30, prevSameLength, monthly arcs.

Chaque plan retenu doit déclarer : question, découpage, population, couverture, métriques, limites, robustesse.

**Interdit :** choisir le découpage uniquement parce qu’il maximise un %.

## Périodes partielles

Un mois / trimestre incomplet ne sert pas de borne « récente » sans marquage (`isIncompleteRecentMonth`).

## Historique hors fenêtre

Autorisé pour contextualiser (reprise, baseline) ; doit être labellisé (`interpretingWithHistory`) et ne pas se faire passer pour un événement de la fenêtre.
