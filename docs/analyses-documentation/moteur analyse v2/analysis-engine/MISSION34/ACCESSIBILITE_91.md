# Verdict d’accessibilité — 91 occurrences (DOM 26/11/2026)

Source : `artifacts/analysis-eval/mission34-baseline/momentum-DOM-EIGHT-PERIODS-2026-11-26T23-33-48-840Z.json`

## Effectifs

| Horizon | Pack | Montées | Non montées |
|---|---:|---:|---:|
| 30d | 84 | 65 | 19 |
| 3m–all | … | … | 13–17 |
| **Σ** | **654** | **563** | **91** |

Kinds manquants (occurrences inter-horizons) : `disc_format_consolidation` 42 · `disc_emergence` 28 · `resistance_progression` 20 · `disc_freq_progress_low` 1.

## Cause

| Hypothèse | Verdict |
|---|---|
| Scroll / virtualisation React | **Écartée** — `igrid` monte tous les articles filtrés ; pas de windowing |
| Filtre famille | **Écartée** — capture sur « Toutes » |
| Filtre disposition UI | **Retenue** — deepenings exclus |
| Dédup phénomène trop agressive sur deepenings | **Retenue** (secondaire) |

`VIRTUALISE_ACCESSIBLE` du rapport = **étiquette trompeuse** pour un écart pack↔rendu.

## Classification post-correctif

| Classe | Action |
|---|---|
| `deepening_of_collective` / `deepening_accessible` / `reserve` / `demoted_*` | **Consultables** — montés |
| `source_retained` / `rejected_factual` / `presentation_gap` | **Non consultables** — hors UI (justifié) |
| Priorités | Déjà 82/82 OK |

## Compteur « Toutes »

Avant : pouvait diverger du pack accessible.  
Après : = priorités + réserves **consultables montées** ; attributs `data-analyse-consultable-count` / `data-analyse-pack-reserve-count` pour audit.

## Critère de sortie A

**Satisfait en code** (parcours défini). **Re-preuve navigateur v33** encore nécessaire pour PASS empirique.
