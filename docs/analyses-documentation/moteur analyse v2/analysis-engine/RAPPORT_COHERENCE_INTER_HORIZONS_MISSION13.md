# Cohérence inter-horizons — Mission 13

## Problème v11

| Fait | 30j | 6m | Cause |
|---|---|---|---|
| Hyperextension 336 / 7 séances « 30 j » | cartes 192 + 144 | même libellé depuis horizon long | `structSrc = p` (période longue) + texte figé « 30 derniers jours » |
| Volume decomp | 12/17 strength | parfois trainingDays | populations mélangées |
| Arc mensuel | 12 j sept. | 13 j | calendrier vs renforcement |

## Corrections

1. **Structurel** : toujours `d30` vs `prev30` ; horizons longs = sous-fenêtre explicite.  
2. **Volume** : `strengthDays` pour contenu moyen ; `trainingDays` seulement si libellé calendaire.  
3. **Registre** : `atomicFactRegistry.js` + `checkInterHorizonFactCoherence`.  
4. **Réconciliation export** : `finalCatalogReconciliation` après polish / filtre titres.

## Populations canoniques

| Clé | Signification |
|---|---|
| `strength_days_positive_reps` | Jours avec reps de renforcement > 0 |
| `training_days_calendar_union` | Union calendrier d’entraînement |
| `last_30_calendar_days` | Sous-fenêtre 30 j partagée |
| `period_window` | Fenêtre exacte de l’horizon |

## Statut

Contrôle : **ACTIVÉ**  
Correction producteurs structurels : **ACTIVÉ**  
Réutilisation systématique par tous les producteurs : **PARTIEL**  
Preuve live 8 horizons : **NON_VÉRIFIÉ**
