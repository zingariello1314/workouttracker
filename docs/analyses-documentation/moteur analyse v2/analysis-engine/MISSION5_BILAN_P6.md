# Mission 5 — Bilan P6 (édition `p6-sovereign-v4`)

Verdict : **P6 partiellement démontrée — NO-GO P7.**

Progrès structurels sur la souveraineté de publication, la réconciliation par identifiants, la 4ᵉ passe, les claims enrichis, les jeux A/B/C et le dossier d’audit. Le rejeu complet des huit horizons sur la sauvegarde du 19 nov. **n’a pas pu être finalisé dans la session agent** (timeouts d’environnement sur les runs >30 s) : la baseline v3 est figée ; le rejeu v4 reste à lancer localement. La démonstration produit DOM sur les huit périodes authentifiées **n’a pas été réalisée**. La comparaison humaine à l’aveugle **n’a pas été effectuée**.

Édition active :

`consolidation=narrative-coherence-v2;duration=paired-density-v3;editorial=p6-sovereign-v4;…;review=collective-pass4-v1;stimulus=challenge-unknown-v1`

Référence figée avant modification :

`artifacts/analysis-eval/baselines/p6-replay-p6-sovereign-v3-before-mission5.json`

---

## A. Diagnostic réel des causes

| Problème observé (export 20 nov.) | Cause | Correction Mission 5 |
|---|---|---|
| 699 priorités+réserves P6 vs 504 accessibles | `publishableP6Card` renvoyait `null` (claim/corps manquant) ou collision d’id → **disparition silencieuse** ; `reconciled=true` ne regardait que les totaux internes | Dispositions explicites + `reconcilePublicationIds` ; autorité `p6` / `p6_partial` / `p6_unavailable` |
| Jeu C `admissiblePreserved=true` avec 50→44 | `published <= expected + 1` validait les **pertes** | Préservation = écart entièrement expliqué par dispositions + aucun `lostSilent` |
| Secours legacy silencieux | `p6Insights \|\| legacyInsights` | Secours marqué `publicationAuthority: 'legacy_fallback'` ; jamais présenté comme P6 |
| Doublons / reformulations | Revue collective incomplète | Passe 4 `reviewCollectively` (contradictions, fusion, monopole sommeil, abstention) |
| Claims = enveloppes legacy | `claimFromDiscovery` trop mince | Preuve structurée : population, fenêtres, valeurs, unités, direction, dimension de progression, événements sources, limites |
| Jeu B trop permissif | Hypothèses `more_sessions` sans sens de variation | Direction hausse/baisse (`fewer_sessions` / `more_reps_per_session`) + cas séances proches + retours collectifs |
| Rejeu absent du ZIP | Écriture `%TEMP%` / miroir public PII | Archive stable `artifacts/analysis-eval/replays/` ; pas de PII dans `public/analysis-eval/` |
| Fingerprint trop faible | clés + total reps | Digest FNV des reps/checked/weights/durations (`snapshotFingerprint` v2) |

Les ~195 écarts ne sont **pas** tous des pertes illégitimes : fusionnés, doublons, invalides à la publication et divergences de comptage doivent apparaître dans `publicationDispositions`.

---

## B. Tableau comparatif avant/après (même sauvegarde 19 nov.)

| Horizon | Avant (v3, Mission 4) Produits / Prio / Réserve / ms | Après (v4) |
|---|---|---|
| Aujourd’hui | 6 / 6 / 0 / ~7 s | **Rejeu v4 non terminé dans la session agent** (exécutions longues interrompues ~30 s) |
| 7 j | 51 / 11 / 28 / ~6 s | idem — à régénérer localement |
| 30 j | 72 / 11 / 49 / ~7 s | idem |
| 3 m | 93 / 11 / 70 / ~11 s | idem |
| 6 m | 99 / 11 / 76 / ~11 s | idem |
| 1 an | 91 / 12 / 76 / ~12 s | idem |
| 2 ans | 89 / 12 / 74 / ~14 s | idem |
| Toujours | 87 / 12 / 72 / ~12 s | idem |

Baseline v3 figée : `artifacts/analysis-eval/baselines/p6-replay-p6-sovereign-v3-before-mission5.json`.  
`artifacts/analysis-eval/replays/p6-replay-latest.json` contient encore le snapshot v3 tant que le rejeu v4 n’a pas été relancé :

```bash
P4_REPLAY=1 npx vitest run src/utils/sport/__tests__/p4IdentityReplay.test.js
```

---

## C. Réconciliation détaillée des écarts de publication

Pipeline audité :

Données → faits → découvertes → claims → consolidation → **revue collective (passe 4)** → sélection → rédaction → **publication `insightsFromP6`** → export → DOM.

Pour chaque candidat du registre `priority ∪ reserve` :

- `published` — présent dans le catalogue accessible ;
- `unpublished_invalid` — titre/corps/claim insuffisant ;
- `exact_duplicate_suppressed` — id déjà publié ;
- `source_retained` / `blocked` — hors catalogue utilisateur ;
- `demoted_*` / `abstained_*` — décisions de la passe 4.

`publicationReconciliation.lostSilent` doit rester vide pour une autorité `p6` pleine.  
Une autorité `p6_partial` signale un écart encore non expliqué — **ce n’est pas** un succès silencieux.

---

## D. Exemples de découvertes (méthodes)

1. **Volume juin→septembre** — `exploreVolumeChange` distingue désormais baisse portée par la fréquence (`fewer_sessions`) vs contenu (`fewer_reps_per_session`) ; pas de détecteur spécial juin–sept.
2. **14/16/17 nov.** — `exploreNearEqualSessions` : volumes proches ≠ séance exceptionnelle ; différences de défi / largeur / poussée-tirage.
3. **Retours épaules/triceps** — `exploreCollectiveReturn` : transformation collective si fenêtre ≤14 j.
4. **Sommeil** — consolidation multi-seuils (`consolidateSleepCandidates`) + limite `association_not_causation` ; budget aujourd’hui réduit en passe 4.
5. **Claims** — `proof.observedValues`, `sourceEvents`, `progressionDimension`, `direction` exploitables sans le code source.

---

## E. Jeux A/B/C

| Jeu | Synthétique | Live (huit paquets) | Jugement humain |
|---|---|---|---|
| A | Renforcé (preuves, densités, défi≠endurance, aujourd’hui vide, identities) | Calculé à l’export dossier (pas vitest) | **Non** |
| B | Cas hausse/baisse/contenu, séances proches, retours collectifs ; harnais P1 **toujours manquant** | idem | **Non** |
| C | Réconciliation par ids + dispositions ; faux positif 50→44 corrigé | Doit être rejoué sur les 8 exports | **Non** |

Mention explicite : reconstitution des jeux ; baselines B0/B1 non réécrites.

---

## F. Quatrième passe, temporalité, mémoire

| Élément | État |
|---|---|
| Passe 4 `reviewCollectively` | **Active** — contradictions, reformulations, monopole sommeil, abstention today, flag horizon, réexploration bornée (≤3) |
| Temporalité / `horizonBoost` | **Partielle** — scoring sélection par `voiceKey` ; `temporalPlans` producteurs long horizon encore incomplets |
| Mémoire éditoriale | **Partielle** — inchangée par export ; rotation non aléatoire héritée ; pas de preuve live de rotation inter-horizons |

---

## G. Vérifications DOM

| Contrôle | Résultat |
|---|---|
| 8 périodes calculables | Oui (code + exports antérieurs) |
| 8 périodes rendues + conformes | **Non vérifié** ici |
| Inspecteurs priorité/réserve | Code modal présent ; parcours UI authentifié non exécuté |
| Concordance DOM | Toute absence → `not_verifiable` / `computed_not_rendered` — **aucune validation fabriquée** |

---

## H. Non-régressions

Suite ciblée Mission 5 (exécutée) :

- `p6SovereigntyMission5`, `p6Publication`, `evaluationGames`, `p6AnalyticalIntelligence`, `editionAndEditorialGate`, `draftFromClaim`, `analysisPeriodExport`, `recapStimulusCatalog`, `analysisExportDownload`, `completeAuditDossier`

Préservés par contrat : densités appariées, défi `challenge-unknown-v1`, identité programme, réserve accessible, exports ZIP, normalisation sessions.

---

## I. Performances et tailles d’export

| Métrique | Observation |
|---|---|
| ZIP audit 20 nov. (v3) | ~187 Mo compressé (structures dupliquées) |
| Sérialisation | `analyticalJsonStringify` : refs partagées réémises ; cycles → `$circular` |
| Suite | Normalisation par références stables **amorcée** via ids de publication ; réduction massive 118 Mo **non encore** complète (hors scope destructif) |
| Rejeu 8 périodes | Coût comparable Mission 4 (dizaines de secondes à ~2 min selon machine) |

---

## J. Critères P6

| Critère | Statut | Preuve |
|---|---|---|
| Autorité de catalogue identifiable | **Validé** (contrat) | `publicationAuthority` |
| Différences registre↔publication expliquées | **Partiel** | dispositions + tests négatifs ; à confirmer sur 8 exports live |
| Aucun doublon exact accessible | **Validé** tests | jeu C + passe 4 |
| Aucune source fusionnée équivalente | **Validé** tests | `insightsFromP6` |
| Aucune perte admissible silencieuse | **Validé** contrat/tests | `lostSilent` |
| Claims avec preuves exploitables | **Partiel** | contrat enrichi ; producteurs hérités encore variables |
| Quatre passes actives | **Partiel** | passe 4 branchée ; profondeur qualitative limitée |
| Analyses collectives > individuelles | **Partiel** | exploration collective présente |
| Horizons différenciés si données | **Partiel** | `horizonBoost` |
| Sommeil non répétitif | **Partiel** | consolidation + budget |
| Sélection ≠ copie legacy | **Validé** | budget non gonflé par legacy |
| Mémoire fonctionnelle / reproductible | **Partiel** | |
| Jeux A/B/C sur vrais résultats | **Partiel** | synthétique OK ; live 8 périodes à rejouer dans l’UI |
| Jeu C live 8 périodes | **Non acquis** ici | |
| Concordance produit | **Non vérifié** | |
| Dossier complet 1 clic | **Validé** code | bouton Récap→Analyse |

---

## K. Procédure unique — dossier à transmettre à ChatGPT

1. Lancer l’app (Vite, port UI réel, session authentifiée admin/DEV).
2. Sport → **Récap** → **Analyse**.
3. Attendre la publication `ready` de la période courante.
4. Cliquer **Exporter le dossier d’audit complet**.
5. Envoyer le ZIP téléchargé (contient `MANIFEST.json`, huit périodes, comparaisons, jeux live, synthèse ; rejeu si présent en localStorage / sinon raison d’absence documentée).

Génération optionnelle du rejeu hors UI (données personnelles, hors public) :

```bash
P4_REPLAY=1 npx vitest run src/utils/sport/__tests__/p4IdentityReplay.test.js
```

Puis recopier `artifacts/analysis-eval/replays/p6-replay-latest.json` dans l’archive locale ou le recharger via le flux d’évaluation développeur — **ne pas** exposer ce fichier en public.

---

**GO P7 : NON** — autorisation explicite requise.
