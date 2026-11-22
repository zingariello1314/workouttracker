# Mission 15 — Bilan P6

**Verdict : intégrité des preuves d’export et chemins d’audit corrigés (v14) — profondeur programme/collectif et validation 8 horizons encore insuffisantes — P6 non candidate — NO-GO P7.**

Édition : `editorial=p6-sovereign-v14` · `claim=assertion-window-v1` · `audit=normalized-export-v3`

Baseline v13 : `artifacts/analysis-eval/baselines/p6-sovereign-v13-before-mission15.json` (711 accessibles, +133 vs v12)

**Aucun commit. Aucun P7.**

---

## Réponses aux 20 questions

1. **Claims d’autres horizons ?** `claimRegistry[claim.id]=claim` écrasait ; cartes 7j gardaient metrics locales mais `claimId` pointait vers la dernière preuve assemblée.
2. **Collisions avant ?** ≥37 divergences détectées indépendamment ; structurellement 1 entrée par legacy id (centaines d’assertions potentielles écrasées).
3. **Identités ?** `phenomenonClaimId` vs `assertionClaimKey(period|phen|win|pop)` ; carte → assertion.
4. **Réconciliation 8 horizons exacte ?** Code renforcé (`dispositionsByPeriod`, pas de miroir live) — **live NON_VÉRIFIÉ**.
5. **Programme unavailable ?** Seul `activeProgram` lu ; analyses utilisent le programme autrement. Fallback `programs[]` + note inEngine.
6. **Mission 11 ?** Hardcode dans `momentumExportAuditIa` (RecapTab) — corrigé Mission 15 + fingerprint digest + 8 périodes.
7. **Chemins centralisés ?** Même `buildAnalyticalAudit` / `buildAuditIaMarkdown` ; JSON seul et ZIP partagent le builder.
8. **Fraîcheur ?** Édition + fingerprint + analysisRunId + computedAt/exportedAt (dépendances charges/Garmin : fingerprint encore partiel).
9. **Charge sans reps ?** Fingerprint `weightKeys` souvent 0 — invalidation non garantie tant que digest ignore les charges (**limite connue**).
10. **Nouvelle nuit Garmin ?** Idem si hors fingerprint — **limite**.
11. **JSON = ZIP ?** Même fonction d’assemblage ; métadonnées export peuvent différer — à revalider live.
12. **Bouton JSON vérifié ?** **IMPLÉMENTÉ** UI + wiring ; **OBSERVÉ DOM NON_VÉRIFIÉ**.
13. **Collectifs publiés ?** Seuil 2 si lié (M14) — **PUBLIÉ live NON_VÉRIFIÉ**.
14. **Programme utilisé vs décrit ?** Description améliorée v13 ; décomposition variantes/prescriptions **NON ACQUIS**.
15. **Conclusions plus profondes ?** Intégrité preuves ; profondeur fréquence→familles **NON ACQUIS**.
16. **Redondances ?** Pic 18 nov : mécanisme M14 ; live **NON_VÉRIFIÉ**.
17. **Approfondissements consultables ?** Mécanisme M14 ; live **NON_VÉRIFIÉ**.
18. **Horizons longs ?** Non démontré au-delà des reps.
19. **Mémoire ?** Toujours `absent_not_passed_to_export` typique — **NON_VÉRIFIÉ**.
20. **Pour P6 candidate ?** Rejeu 8 packs + A/B/C + DOM + fingerprint multi-sources + programme dans raisonnements + collectif publié + mémoire.

---

## Matrice

| Résultat | Statut |
|---|---|
| Claims multi-fenêtres sans collision | **TESTÉ** · **ACTIVÉ** |
| Validateur carte↔claim | **TESTÉ** · **ACTIVÉ** |
| Pas de miroir `live` si 8 périodes | **ACTIVÉ** |
| programRegistry fallback | **ACTIVÉ** |
| factRegistry peuplé | **ACTIVÉ** |
| Bouton JSON analytique complet | **IMPLÉMENTÉ** · **ACTIVÉ** code · DOM **NON_VÉRIFIÉ** |
| AUDIT_IA Mission 15 + fingerprint | **ACTIVÉ** |
| Ordre horizons stable | **TESTÉ** |
| Collectif / profondeur programme | **NON ACQUIS** |
| Validation produit 8 horizons | **NON_VÉRIFIÉ** |

---

## Avant / après (intégrité)

**Avant** : carte 7j pompes `mean=36` + claim partagé `mean=45.5` (1y).  
**Après** : deux assertions `7d|…|win:…` et `1y|…|win:…` ; chaque carte référence la sienne.

---

## Procédure utilisateur

1. Recharger app v14.  
2. Récap → Analyse → **Exporter le JSON analytique complet**.  
3. Vérifier nom `momentum-ANALYTICAL_AUDIT-p6-sovereign-v14-…json`.  
4. Contrôler `claimRegistry` : plusieurs clés pour même `legacyClaimId` ; `diagnostics.cardClaimDivergenceCount=0`.  
5. `programRegistry.available` si programme actif.  
6. Exporter aussi AUDIT_IA (doit dire Mission 15, fingerprint ≠ `[object Object]`, 8 horizons).

**P6 non candidate. NO-GO P7.**  
Si la prochaine mission ne laisse que validations/corrections mineures documentées, P6 pourra être déclarée *candidate à vérification finale indépendante* — pas ici.
