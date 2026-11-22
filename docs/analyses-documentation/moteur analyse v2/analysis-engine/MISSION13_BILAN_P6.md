# Mission 13 — Bilan P6

**Verdict : causes racines partiellement corrigées (v12) — preuves live 8 horizons insuffisantes — P6 non candidate — NO-GO P7.**

Édition : `editorial=p6-sovereign-v12` · `classification=modality-authority-v1` · `matching=session-slot-v1` · `composition=phenomenon-compose-v2` · `coherence=inter-horizon-v2`

Gel v11 : `artifacts/analysis-eval/baselines/p6-sovereign-v11-before-mission13.meta.json`

**Aucun commit. Aucun démarrage de P7.**

---

## Qu’est-ce que le moteur comprend désormais ?

| Compréhension | Preuve |
|---|---|
| Un développé n’est pas du cardio parce que `programCategory` dit cardio | Tests M13 + `exerciseWorkModality` |
| Wall sit / chaise = isométrie | Tests M13 |
| Contenu moyen de renforcement ≠ jours calendaires d’activité | `strengthDays` dans décomp volume + prose « journées de renforcement » |
| Les faits structurels « 30 j » doivent venir de d30, pas du volume d’un horizon long | Producteur structurel corrigé |
| Une phase de charges lit `fromValue`/`toValue` | Mapping composition |
| Une concentration relative mouvements vs volume global peut être construite | Mécanisme branché |
| Un créneau s’apparie par composition de mouvements, pas par jour de semaine | `sessionSlotMatching` |
| Trois cartes « 18 novembre » = même thèse sémantique | `semanticPhenomenonKey` peak |

**Textes prioritaires live v12 publiés : NON_VÉRIFIÉ** (rejeu Récap → Analyse requis).

---

## Matrice d’exigences

| Exigence | Statut |
|---|---|
| Classification Arnold / couché incliné ≠ cardio | **TESTÉ UNITAIREMENT** · **ACTIVÉ** · PUBLIÉ live **NON_VÉRIFIÉ** |
| Wall sit isométrique | **TESTÉ UNITAIREMENT** · **ACTIVÉ** |
| Cascade familles / volumes prescrits | **IMPLÉMENTÉ** · live **NON_VÉRIFIÉ** |
| Décomp volume = strengthDays | **ACTIVÉ** · **TESTÉ UNITAIREMENT** |
| Faits structurels population d30 | **ACTIVÉ** |
| Registre faits atomiques | **IMPLÉMENTÉ** · **TESTÉ UNITAIREMENT** · adoption producteurs **PARTIELLE** |
| Appariement créneau↔séance | **IMPLÉMENTÉ** · **TESTÉ UNITAIREMENT** · trajectoires **PARTIEL** |
| Collectif reprises | **ACTIVÉ** enrichissement · PRODUIT/PUBLIÉ live **NON_VÉRIFIÉ** |
| Phase charges collective | **ACTIVÉ** mapping · live **NON_VÉRIFIÉ** |
| Concentration relative | **ACTIVÉ** · live **NON_VÉRIFIÉ** |
| Réconciliation finale post-polish | **ACTIVÉ** code · live **NON_VÉRIFIÉ** |
| Hiérarchie deepenings > 0 | **IMPLÉMENTÉ** (return + load) · live **NON_VÉRIFIÉ** |
| Dédup sémantique pics journée | **ACTIVÉ** · **TESTÉ UNITAIREMENT** |
| Sommeil contextualisé | **PARTIEL** (faux positif B corrigé) |
| Différenciation horizons longs | **PARTIEL** |
| data-coverage 4 statuts | **ACTIVÉ** |
| Rapport audit Mission 13 | **ACTIVÉ** |
| A/B/C × 8 + DOM + mémoire | **NON_VÉRIFIÉ** |
| Vitest globale | **NON_VÉRIFIÉ** (lots ciblés OK : 47 PASS) |
| Aveugle humain | Non effectué |

---

## Livrables

| Fichier | Rôle |
|---|---|
| `MISSION13_BILAN_P6.md` | Ce bilan |
| `DIAGNOSTIC_CAUSES_RACINES_MISSION13.md` | Défaut → cause → correction |
| `RAPPORT_CLASSIFICATION_EXERCICES_MISSION13.md` | Autorité multi-axes |
| `RAPPORT_COMPARATIF_V11_V12_MISSION13.md` | Avant/après |
| `RAPPORT_COHERENCE_INTER_HORIZONS_MISSION13.md` | Populations / faits |
| Baseline meta v11 | Gel logique |

---

## Procédure de vérification utilisateur

1. Recharger l’app (édition v12).  
2. Sport → Récap → Analyse.  
3. Exporter rapport d’audit IA + données analytiques + dossier complet.  
4. Contrôler `program-structure` : cardioKeys = course uniquement ; iso > 0.  
5. 30j : décomp ≈357/356 sur journées de renforcement.  
6. Chercher `disc_collective_return`, `disc_composed_load_phase`, `disc_composed_relative_concentration`.  
7. Vérifier AUDIT_IA.md = Mission 13 ; data-coverage v3 (4 statuts).  
8. Bouton DOM : édition, fingerprint, titres + corps, hiérarchie.

---

## Limites restantes (bloquantes P6)

- Rejeu live 8 packs + A/B/C  
- DOM authentifié × périodes  
- Mémoire chronologique démontrée  
- Adoption complète du registre de faits par tous les producteurs  
- Sommeil : populations appariées + contextualisation familles  
- Généralisation bout-en-bout (PPL, full body, hybride…)  

**P6 non candidate. NO-GO P7.**
