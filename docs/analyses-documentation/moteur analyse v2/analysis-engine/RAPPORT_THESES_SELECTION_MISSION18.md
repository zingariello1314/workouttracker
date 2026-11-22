# RAPPORT_THESES_SELECTION — Mission 18

Édition `p6-sovereign-v17`. NO-GO P7.

## 1. Défaut observé (export v16)

Cartes prioritaires avec `kind=disc_variant_mix_shift` / `metrics.thesis=variant_mix_shift` mais titres hérités :

- « Pompes déclinées : recul confirmé sur plusieurs séances »
- « Pompes déclinées : une séance atypique, pas encore une tendance »

alors que les vraies rédactions « le mélange de variantes explique… » restaient en réserve.

## 2. Ordre réel du pipeline

1. `detectDiscoveries` (trajectoire / consolidation)
2. Annotation programme (`annotateTrajectoryWithProgramContext` → `rewriteTrajectoryWithPrescriptions`) — peut poser thèse + nouveau titre/corps
3. `filterDiscoveriesByPeriodScope`
4. **F3/F4** `enrichDiscoveriesWithComposedEvidence` → si `trajectoryOk`, **réécrit titre/corps** depuis la trajectoire composée
5. Polish, sélection, `applyP6` (`draftFromClaim`, revue, sélection collective)

**Défaut exact** : l’étape 4 écrasait le texte de l’étape 2 sans retirer la métadonnée de thèse → **thèse fantôme**.

## 3. Correction

- `trajectoryOk: false` lors d’un rewrite `variant_mix_shift`
- `shouldPreserveProgramThesis` dans `applyComposedNarrationToDiscovery` (kinds + thesis + composition)
- Tests : `mission18CollectiveEpisode.test.js` (« F4 n’écrase pas… »)

## 4. Pic du 18 novembre

Deux priorités 7j :

- `disc_th_concentration_now` — « Le 18 novembre 2026 porte une grande part… »
- `disc_peak_day` — « La séance du 18 novembre 2026 concentre… »

`same_peak_concentration_day` échouait car l’une portait `peakDate=ISO` et l’autre une clé FR extraite du titre.

**Correction** : `normalizePeakDayKey` → clé commune `2026-11-18`.

## 5. Textes avant / après (attendu)

| Avant (fantôme) | Après (si rewrite + préservation) |
|---|---|
| Titre : recul confirmé… | Titre : le mélange de variantes explique la baisse/hausse de moyenne |
| Corps : volume / reprise partielle | Corps : proportions, moyennes par variante, incertitude |
| `thesis=variant_mix_shift` | idem, **aligné** au texte |

Rejeu qualitatif multi-horizons des packs utilisateur : **non terminé** cette mission (nécessite backup frais + export).

## 6. Sélection

Le score n’a pas été refondu. La mission impose : ne pas valoriser une capacité absente du claim publié — la préservation F4 est la condition minimale. La promotion systématique des cartes mix vs trajectoire rivales reste à valider sur packs réels.
