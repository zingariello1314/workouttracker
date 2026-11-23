# PLAN DE CLÔTURE FINIE P6

**NO-GO P7** tant qu’un critère obligatoire reste ouvert.  
Mise à jour Mission 31 · édition code `p6-sovereign-v30` · baseline observée v29.

## Trois strates

| Strate | Contenu | Clôture P6 ? |
|---|---|---|
| 1. Intégrité technique | B1–B8 | Non — nécessaire |
| 2. Candidature ASPECT | B + G min + V1–V2 + P1–P2 | Non |
| 3. Clôture effective | + Jeux B/C exécutés + DOM traité | **Oui seulement ici** |

---

## B — Intégrité technique

| ID | Critère | État M31 | Preuve |
|---|---|---|---|
| B1 | Autorité P6 8/8 | Satisfait (export v29 + rejeu) | AUDIT / replay |
| B2 | Orphan / self_fusion | Satisfait export v29 (hors subset artificiel) | AUDIT |
| B3 | Totaux ≠ moyennes ; effectifs liés ; **pas de faux triple** | **Satisfait code+UT+reval 75** | M30+M31 |
| B4 | Claims ↔ cartes | Satisfait (hors non-comparables) | — |
| B5 | Mémoire | Partiel | 1 phen |
| B6 | Campagne AUDIT/TRACE | Satisfait v29 gelée | baseline M31 |
| B7 | Fusion partial ≠ suppress | Partiel | V2 reformulations |
| B8 | Sémantique ≠ champs seuls | Progressé | notes non-comparables |

## G — Généralisation

| ID | État | Note |
|---|---|---|
| G1–G6 | Ouverts | Inchangés ; E1–E6 au registre éditorial |

## V — Validation indépendante

| ID | État | Note |
|---|---|---|
| V1 Jeu A | Amorcé (M30) + non étendu live | Corpus ≠ oracle user |
| V2 Abondance | Partiel | 31e OK ; reformulations ouvertes |
| V3 Jeu C | **Non exécuté** | Ne pas déclarer PASS |
| V4 Jeu B | **Non exécuté** | Ne pas déclarer PASS |

## P — Produit réel

| ID | État | Note |
|---|---|---|
| P1 Rejeu 8 horizons | **Exécuté** sur backup (fp≠live) | `replay-eight-v30.json` |
| P2 DOM | **NON_OBSERVÉ** | ≠ PASS |
| P3 Fingerprint / parité | Partiel | live `c8aa227e` ≠ backup `6c66326b` |

## Différé spec (X1–X4)

HypothesisPlanner / implications / VIE / incrémental → P7–P8. **Ne pas y reporter V/B/G/P.**

## Ordre restant

1. Export utilisateur **v30** (intégrité sans les 75 faux fails).  
2. DOM réel ou procédure NON_OBSERVÉ formalisée côté produit.  
3. V2 reformulations.  
4. Exécuter Jeux B/C.  
5. Clôture seulement strate 3.
