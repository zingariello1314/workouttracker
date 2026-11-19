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

## Convention retenue le 18 novembre 2026

Aujourd’hui est le jour civil Europe/Paris, pas les 24 heures glissantes. La journée en cours est partielle et peut se réécrire quand une séance est enregistrée. Une date sans répétition ni cochage, dans un snapshot déjà chargé, est une journée sans enregistrement. Ce n’est pas une absence de couverture. Les séances déjà datées ne sont pas réattribuées, y compris si elles ont traversé minuit : la clé de stockage reste la date d’origine.

Les autres périodes sont des plages inclusives, même fuseau, dernier jour partiel tant qu’il est le jour courant : 7 jours, 30 jours, 92 jours, 183 jours, 365 jours, 730 jours. Toujours commence à la première preuve datée, sans année inventée.

Garmin, le tableau de bord sport et la console d’analyse lisent `getRecapDateWindow`. Ils suivent donc la même borne.

## Périodes partielles

Un mois / trimestre incomplet ne sert pas de borne « récente » sans marquage (`isIncompleteRecentMonth`).

## Historique hors fenêtre

Autorisé pour contextualiser (reprise, baseline) ; doit être labellisé (`interpretingWithHistory`) et ne pas se faire passer pour un événement de la fenêtre.
