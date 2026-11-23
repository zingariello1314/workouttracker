# BILAN DE CONVERGENCE P0→P6 — Mission 28

Références : spec analytique (§2.12, 4, 8, 9, 13, 18, 19), prompts fondateurs 1–3, contrat ASPECT, registre, bilans M19–M27, baseline v26.

## Légende

- **Bloquant P6** : empêche une candidature de clôture honnête.
- **P6 ouvert** : exigence P6 non encore démontrée produit.
- **Ultérieur** : P7/P8 légitime (spec 13.4 planner, implications, VIE avancée).

## Tableau de convergence (exigences structurantes)

| Exigence | Phase | Attendu | Réel code/produit | Producteur→conso | Branché | Hérité | Preuve | Limite | Bloquant P6 ? | Correction min. |
|---|---|---|---|---|---|---|---|---|---|---|
| Reproductibilité / fingerprint | P0 | Empreinte discriminante | multi-source-v5 | snapshot→cache | Oui | — | UT | nameMap=0 à vérifier | Non | Comparer inputs réels |
| Claims sur cartes publiées | P1/P6 | 1:1 | 716/716 v26 | wrap→audit | Oui | legacy_fallback évité M25 | AUDIT v26 | — | Non | — |
| Autorité publication P6 | P6 | 8/8 | 8/8 v26 | insightsFromP6 | Oui | — | AUDIT | — | Non | — |
| Identité sujet≠phénomène≠assertion | P6 | 4 autorités | Partiel ; subjectKey fix M28 | discoveryIdentity | Oui | alias texte | UT M27/28 | alias hérités | Non (réduit) | Consommer autorités |
| Composition parallèle informative | P4/P6 | Distinct + métriques justes | Orphan 3m + mean≠total v26 | parallelComposition | Oui | — | AUDIT+code | Corrigé code v27 | **Oui jusqu’au rejeu** | Rejeu 8h |
| Hiérarchie parent/enfant | P6 | Pas d’orphan | 2 orphan_parent v26 | hierarchy+publish | Oui | — | AUDIT | Réconciliation M28 | **Oui jusqu’au rejeu** | Rejeu |
| Contrat métrique | P1/P6 | unité/pop/fenêtre | Cross-kind v26 | extract*Reps | Oui | hétérogène | code | Fix M28 | **Oui jusqu’au rejeu** | Rejeu |
| Mémoire persistante | P2/P6 | état+publication | 1 phen ; pub=0 | analyticalMemory | Partiel | — | TRACE | appendPublication | Partiel | Généraliser hors collectif |
| Abondance sans plafond | P6 | 31e accessible | Caps famille soft | selectCollectively | Oui | caps legacy | UT | jeux fondateurs | Partiel | Jeux A/C live |
| Exploration relations | P3/P6 | applicable exécutée | 80 modules « non run » | exploration | Partiel | matrice | TRACE | instrumentation | Non | Qualifier honnêtement |
| Horizons différenciés | P2/P6 | stratégie par voix | recouvrement 6m–all | temporal policy | Partiel | mêmes events | TRACE | données dès 2026-01 | Partiel | Politique avant éditorial |
| Sommeil×entraînement | P6 | appariement contrôlé | 398 nuits ≠ paires | sleep pipeline | Partiel | — | fingerprint | Porte B | Partiel | Pipeline appariement |
| Programme / familles | P5/P6 | matching session | progrès volume ; nameMap=0 | programReasoning | Partiel | — | AUDIT | inputs | Partiel | Session-level |
| Rédaction FR 3 niveaux | P6 | thèse claire | formulations faibles | polish/prose | Partiel | concat titres | TRACE | Porte B | Non | Producteurs thèse |
| AnalyticalHypothesisPlanner | P8 | planificateur | non déployé | — | Non | — | spec 13.4 | — | Non | **Reporter P8** |
| Implications / projections | P7 | — | prep fields only | p7Prep | Non | — | code | — | Non | **Reporter P7** |
| DOM / parité exports | P6 | une campagne | exports OK ; DOM NC | audit dossier | Partiel | — | baseline | DOM non observé | Partiel | Procédure utilisateur |
| Jeux A/B/C pipeline | P1/P6 | live | UT locaux | evaluation | Partiel | — | UT | live manquant | Partiel | Campagne unique |

## Dettes par strate

### Encore P0/P1 qui compromettent P6

- Contrat métrique (dénominateurs) — **corrigé en code**, preuve produit manquante.
- Évaluation A/B/C sur pipeline réel (pas seulement Vitest).

### P2–P5 existants non généralisés

- Mémoire hors collectif novembre.
- Différenciation horizons au-delà du warning temporalMismatch.
- Programme matching (nameMap, couverture historique).
- Sommeil contextualisé.

### Vraies exigences P6 restantes

- Intégrité graphe après rejeu 8 horizons (orphan=0, fusion justifiée).
- Métriques composition cohérentes dans le produit.
- Migration réelle des producteurs (pas seulement claim wrapping).
- Abondance + sous-exploration honnête.
- Parité export/DOM.

### Légitimement P7/P8

- HypothesisPlanner complet (13.4).
- Implications sportives / projections.
- Visual Insight Engine avancé.
- Calcul incrémental / shadow mode saturant.

## Verdict de convergence

P6 n’est **pas** un chantier illimité. Les structures P6 sont en place (autorité 8/8, claims, composition, mémoire minimale). Les blocages restants sont des **ruptures de contrat** (identité/métrique/hiérarchie) et des **preuves produit**, pas l’absence totale de capacités.
