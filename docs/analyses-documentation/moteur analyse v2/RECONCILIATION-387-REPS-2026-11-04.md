# Réconciliation des 387 répétitions

**Date :** 2026-11-04  
**Exports :**
- A (pack 33/21, hist 0) : `analysis-engine-diag-comparison-30d-vs-7d-1793758784193.json` (Desktop) — généré 02:19:14Z
- B (pack 15/11, hist 180) : `analysis-engine-diag-comparison-30d-vs-7d-1793758946546.json` (Downloads) — calcul 02:11:50Z

## Verdict

Les **387 répétitions** ne sont **pas** un double comptage de stockage.  
Elles correspondent à **une journée d’entraînement entière : 2026-11-02**, présente dans le snapshot du run B et **absente** du snapshot du run A.

| Fenêtre | Reps A | Reps B | Δ |
|---|---:|---:|---:|
| 30d (2026-10-06 → 2026-11-04) | 4502 | 4889 | **+387** |
| 7d (2026-10-29 → 2026-11-04) | 769 | 1156 | **+387** |

Même delta sur les deux fenêtres ⇒ l’écart est **strictement contenu dans le 7d**, donc dans le 30d.

## Tableau de réconciliation

| date | source | recordId | exercice | répétitions | inclus A | inclus B | raison |
|---|---|---|---|---:|---|---|---|
| 2026-11-02 | calendrier force (dayRows) | day:2026-11-02 | *(agrégat jour)* | **387** | non (`reps:0`, `trained:false`) | oui (`reps:387`, `trained:true`) | Journée entière absente du snapshot A |
| 2026-11-02 | séance force | exerciseId `106` | Relevés de genoux à la barre | 60 (3×20) | non | oui | Sous-ensemble du jour B (découvertes) |
| 2026-11-02 | séance force | exerciseId `103` | Dips parallèles | 48 (4×12) | non | oui | Sous-ensemble du jour B |
| 2026-11-02 | séance force | exerciseId `107` | Relevés de genoux aux parallèles | 40 (2×20) | non | oui | Sous-ensemble du jour B |
| 2026-11-02 | séance force | exerciseId `105` | Pompes inclinées mains sur banc | 36 (2×18) | non | oui | Sous-ensemble du jour B |
| 2026-11-02 | séance force | exerciseId `104` | Pompes inclinées pieds sur banc | 36 (3×12) | non | oui | Sous-ensemble du jour B |
| 2026-11-02 | séance force | hash `1433469569` | *(nom non résolu dans export → « un mouvement »)* | 36 | non | oui | Sous-ensemble ; identité hashée |
| 2026-11-02 | endurance / GTG / autres canaux du `createDayRepsLookup` | *(non sérialisés dans l’export comparaison)* | *(reste du total jour)* | **~131** | non | oui (dans le 387) | **Limite technique** : l’export ne contient pas le ledger complet `reps×checkedExercises` du snapshot |

**Somme nommée dans les découvertes B :** 60+48+40+36+36+36 = **256**.  
**Reste jusqu’à 387 :** 131 — présents dans le total calendaire du jour, non attachés à une ligne d’exercice dans le JSON exporté.

## Autres différences de contexte (prouvent la non-équivalence des runs)

| Signal | Run A (02:19) | Run B (02:11) |
|---|---|---|
| `insightHistoryEntryCount` | **0** | **180** |
| Pack shown 30d / 7d | 33 / 21 | 15 / 11 |
| `profile_quiz` | **missing** | **ok** (49 réponses) |
| Garmin daily (jours avec pas) | 87 | 89 |
| Garmin cardio | 165 | 166 |
| Nuits Garmin (debug) | 12 / 3 | 14 / 5 |
| Signature overview 30d | `…\|4502\|34\|1817959519` | `…\|4889\|30\|1854085972` |

## Rôle de `insightHistoryInjected` / `entryCount`

- Les deux runs ont `insightHistoryInjected: true`.
- **entryCount 0 vs 180** change la **nouveauté éditoriale** (`computeCandidateNovelty`) → pénalités sur thèmes / claims déjà vus → pack **33→15** (30d) et **21→11** (7d).
- L’historique **ne crée pas** les 387 reps ; il explique la réduction du pack, pas le delta de volume.

## Population d’enregistrements

**Non** : les deux exports ne portent **pas** la même population.

- Même bornes calendaires déclarées.
- Snapshots / Garmin / questionnaire / historique différents.
- **Ne pas** les présenter comme mesure de régression moteur.

Correctif code : manifeste de run + `assessRunComparability` / `comparableAsRegression: false` lorsque les signatures training ou l’historique diffèrent (`analysisEngineRunManifest.js`, branché dans la comparaison).

## Cause probable du snapshot A incomplet

Le run A (02:19) a été lancé après remount console / navigation Recap, avec `getCurrentData()` au clic. Indices :

- questionnaire profil manquant alors qu’il était chargé à 02:11 ;
- journée 2026-11-02 entièrement absente ;
- Garmin légèrement moins chargé.

⇒ **Course de chargement / hydratation** plutôt qu’effacement utilisateur. La console doit refuser « régression » si `overview.signature` (reps) diverge.
