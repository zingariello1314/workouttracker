# Matrice — valeur informative F5  
**2026-11-01**

La valeur informative n’est **pas** : longueur du texte, nombre de champs metrics, `composedFactCount` brut, statut `composedOk` seul, profondeur F4 `deep`, % brut, record, priorité historique de kind.

| Dimension | Signaux utilisés | Effet typique |
| --- | --- | --- |
| **A. Solidité** | `trajectoryOk`+`composedOk`, séries trusted, narration cohérente F4.1, nom résolu | +8…+17 / −12…−22 |
| **B. Pertinence temporelle** | `voiceKey` × kind (quarter_* sur week/today, anchor faible, long×épisode) | −28 quarter/week ; +4 épisode/long |
| **C. Pouvoir explicatif** | attribution volume, mécanisme séries, témoins, continuité nette | +4…+7 chacun |
| **D. Remarquable** | \|deltaPct\| ≥ 20 avec direction nette | +3 |
| **E. Utilité** | (implicite) garder observations simples à IV élevée ; pas de conseils inventés | via score de base + absence de malus |
| **F. Originalité pack** | rivalité phénomène, contradiction volume/récit, cap épisode, abstention descriptifs | rejet / displace |

Base E0 (inchangée) : rawScore + bonus trajectoire / malus descriptive / methodology_limit.

Ajustements F5 : `editorialValueAdjustments` → `applyEditorialInformativeValue` dans `discoveryInformativeValue(d, voiceKey)`.
