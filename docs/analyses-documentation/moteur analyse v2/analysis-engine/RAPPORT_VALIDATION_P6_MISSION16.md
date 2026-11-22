# Mission 16 — Rapport de validation P6

**Résultat : FAIL candidature P6** (capacités d’intelligence branchées et prouvées hors navigateur sur packs synthétiques ; preuve produit 8 horizons live absente).

Édition cible : `editorial=p6-sovereign-v15`.  
Baseline : v14 gelée (`artifacts/analysis-eval/baselines/p6-sovereign-v14-before-mission16.json`).

**Aucun commit. NO-GO P7.**

---

## Jeu A — Exactitude

| Contrôle | Résultat |
|----------|----------|
| Mix variantes : calcul parts / moyennes | PASS (mission16Intelligence) |
| Contre-exemple baisse intra-variante | PASS |
| Contre-exemple variante inconnue | PASS |
| Faits atomiques : pas de clé `||||` | PASS |
| Fait sans fenêtre refusé | PASS |
| Cohérence carte–claim multi-horizons | Conservé (M15) ; non rejoué live |
| Populations Hyperextension / push-pull | Non revalidé cette mission |

## Jeu B — Découverte

| Capacité | Résultat |
|----------|----------|
| Variation par mélange de variantes | PASS synthétique ; live NON_VÉRIFIÉ |
| Reprise collective liée | PASS synthétique (événements mi-nov) ; live NON_VÉRIFIÉ |
| Omission ciblée récurrente | Module existant ; packs Mission 16 non étendus |
| Redistribution / substitution / charge à volume constant | NON_VÉRIFIÉ M16 |
| Association sommeil à abstention | NON_VÉRIFIÉ M16 |
| Trajectoire multi-phases | NON_VÉRIFIÉ M16 |

## Jeu C — Conservation / hiérarchie

| Contrôle | Résultat |
|----------|----------|
| Équivalence concentration ↔ pic même jour | PASS mécanisme |
| Approfondissements (M14) | Conservés ; live NON_VÉRIFIÉ |
| Accessibilité 711 / 714 / 724 | Non re-mesuré live |
| Fusion injustifiée | Contre-exemple collectif sans lien = abstention |

## Packs de généralisation

| Pack | Statut M16 |
|------|------------|
| Variantes push A/B | PASS |
| Collectif upper mid-nov | PASS synthétique |
| Faible fréquence / PPL / split / hybride / sommeil / défis | NON_EXÉCUTÉS cette session |

## Validation technique

| Item | Commande / origine | Résultat |
|------|--------------------|----------|
| Tests M13–M16 | `npx vitest run …mission13…mission16…` | 32 PASS |
| Rejeu historique 19 nov | Non exécuté | — |
| Rejeu 8 horizons user | Non exécuté (exports v14 lus en lecture seule) | — |
| Mémoire chronologique | Non exécuté | — |
| DOM authentifié | Non disponible / non requis pour pipeline | `not_observed` conservé si absent |
| Évaluations A/B/C live | Absentes de l’export si non exécutées | À préciser dans JSON |

## Diagnostic chaîne collective (cas réel)

```
format_consolidation.gap {days≥21}  ✓ calculé
        ↓
metrics.gapDays dans discovery     ✗ manquant (v14) → ✓ corrigé (v15)
        ↓
returnEvents filtre gapDays≥7      ✗ vide (v14) → ✓ alimenté si gap présent
        ↓
exploreCollectiveReturn            n’était jamais appelé avec assez d’événements
        ↓
disc_collective_return publié      0 en v14 → attendu >0 après rejeu
```

## Évaluation qualitative indépendante

**Non réalisée à l’aveugle.** Aucun paquet A/B anonymisé n’a été soumis à un évaluateur humain externe dans cette session. Ne pas prétendre le contraire.

Un paquet qualitatif pourra être produit après rejeu v15 vs baseline v14 (textes complets 8 horizons, preuves retirées).

## Condition ASPECT P6

Les critères P6 de l’ASPECT **ne sont pas modifiés**.  
La mission **ne déclare pas** P6 candidate.

Blocages résiduels exacts pour une prochaine mission ciblée :

1. Rejeu snapshot utilisateur → preuve textes publiés collectifs + mix variantes.  
2. Décomposition variations mensuelles par familles.  
3. Fingerprint multi-sources.  
4. Mémoire + Markdown autonome 8 périodes.  
5. Sommeil : associations non redondantes contextualisées.
