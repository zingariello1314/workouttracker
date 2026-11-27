# Bilan Mission 36 — P6

**Verdict : PARTIEL — dernières contradictions techniques traitées ; validation qualitative / rejeu exact encore limités.**  
**P6 ouverte · NO-GO P7 · aucun commit**  
Édition : `p6-sovereign-v35` · claim `assertion-population-v4`  
Référence : `8ee0e181` · DOM 8/8 CONFORME (non rouvert)

## Classification des garanties

| Garantie | Type |
|---|---|
| DOM 8/8 + homonymes montés | **Démontrée** (navigateur v34) |
| Intégrité carte–claim (Dips) | **Démontrée** (v34) |
| Jeu A load_phase + physiologie B | **Démontrée** (validateur + composition) |
| Jeu A ratio/quarter | **Démontrée sur code** / **Limitée** (re-preuve Chrome v35) |
| Rejeu exact programme | **Limitée** (series absentes du ZIP) |
| Jeu C 8h doublons | **Démontrée** (0 strict) sur registre |
| Qualité B profonde | **Limitée** (correctifs ciblés, pas PASS global) |
| Notation aveugle humaine | **Non testée** |
| Population triple | **Majoritairement not_evaluated/noncomparable** — pas un PASS calcul |

## Portes P6 pouvant se rapprocher de la clôture

- Intégrité / DOM / identité homonymes : **candidats à clôture technique** dès confirmation v35 sans régression.  
- V1 Jeu A / V4 Jeu B : **après re-export Chrome v35**.  
- P1 rejeu : **après capture avec `series`**.  
- Validation extérieure aveugle : **seule dépendance qualitative restante à isoler** — ne pas relancer les audits techniques déjà réussis.

## Tests

`mission36ProofQuality.test.js` — 11/11.  
Non-régression M35 inchangée (édition soft).
