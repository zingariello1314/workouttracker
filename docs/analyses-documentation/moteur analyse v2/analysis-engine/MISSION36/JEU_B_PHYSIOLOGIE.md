# Porte B — `unsupported_physiology`

## Diagnostic exact

Le contrôle cherchait `/force maximale|hypertrophie démontrée|…/` **sans** reconnaître la négation :

> « Ce n’est **pas une affirmation de force maximale** ni d’hypertrophie — seulement une phase documentée d’augmentation de **charge externe**. »

| Type | Exemple | Attendu | Avant | Après |
|---|---|---|---|---|
| Affirmation non prouvée | « hypertrophie démontrée » | rejet | rejet | rejet |
| Négation explicite | « pas une affirmation de force maximale ni d’hypertrophie » | admissible | **faux rejet** | admissible |
| Charge externe | « la charge externe enregistrée augmente » | admissible | admissible | admissible |

## Cause

Faux positif du validateur (mot « force maximale » dans une clause négative), **pas** une sur-conclusion de l’analyse.

## Correction

Élargir `physioDenied` : `pas une affirmation de force`, `ni d'hypertrophie`, `charge externe`, `seulement une phase documentée`.

## Tests contradictoires

Positifs / négatifs dans `mission36ProofQuality.test.js`.  
Sur carte live v34 rebuild : `B_physio = 0`.
