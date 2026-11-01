# Audit avant/après des cartes F4 — 2026-11-01

Source : `fixtures/f4-replay-periods.json` (fixture juil–oct 2026).  
Kinds sélectionnés : **identiques à F3**.

## Score profondeur visible

| Période | Selected | Composée dispo | Utilisée dans texte | Mécanisme | Continuité | Témoins |
| --- | --- | --- | --- | --- | --- | --- |
| 7d | 12 | 3 | 3 | 3 | 3 | 0 |
| 30d | 19 | 7 | 7 | 7 | 7 | 2 |
| 3m | 21 | 5 | 5 | 5 | 5 | 2 |
| 6m | 20 | 5 | 5 | 5 | 5 | 5 |

**Règle F4 :** composition disponible → composition utilisée dans le texte (atteint).

---

## 7 jours — exemple

**Pompes déclinées (progress)**  
- Titre avant : « … retour au niveau de départ »  
- Titre après : « … retour près du niveau de départ »  
- Profondeur : composed / deep selon période

## 30 jours — Exemple A

**`disc_freq_decline_low_exposure` — Pompes déclinées**

Titre avant : « recul et exposition faible coïncident »  
Titre après : « moins de répétitions par séance »

Corps après (extrait exact) :

> Le volume de répétitions enregistré sur Pompes déclinées passe d’environ 53.3 à 40 répétitions par séance, soit une baisse d’environ 25 %. Le nombre de séries reste proche de 4 ; la diminution vient surtout des répétitions par série (environ 15 → 10). Les autres mouvements comparables ne permettent pas d’isoler clairement si le signal est local ou partagé. Le contexte historique (3 séances avant la fenêtre) sert uniquement à situer cette évolution, pas à remplacer la période sélectionnée.

Faits utilisés : decomposition, continuity, volumeAttribution, comparators, historicalContext, f4Narration.

## 30 jours — fréquence

**Relevés de genoux**  
Titre après : « le total monte surtout parce que tu t’entraînes plus souvent »

## 6 mois — Exemple B

**Tractions australiennes — prise large pronation**  
Titre avant : « s'installe dans ton entraînement »  
Titre après : « un format plus volumineux se maintient » (`deep`)

Corps : 40 → 48 reps/séance (+20 %), séries ~4, reps/série 10→12, format reproduit, disclaimer anti-physio, témoins localisés.

## Cartes encore descriptives (non narrées F4)

density, calendar_rhythm, gtg_unplanned, quarter_*, rest_assoc, anchor, repertoire, etc. — polish éventuel seulement. Transfert F5 pour sélection.
