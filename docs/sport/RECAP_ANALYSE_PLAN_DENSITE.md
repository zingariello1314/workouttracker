# Plan — densité d’analyse Recap (toutes plages × sport × sommeil × jalons)

> **Statut.** Nouveau plan. Remplace la lecture « totality 100 % » du § 16 de `RECAP_ANALYSE_MOTEUR_INTERPRETATION.md` pour le **résultat utilisateur**. Le moteur *détecte* beaucoup ; l’UI *montre* trop peu, et pas au bon grain.  
> **Date.** 1er septembre 2026.  
> **Cible.** Le niveau des exemples fournis (sport 7 j. / aujourd’hui + sommeil aujourd’hui / 7 j. / 30 j. / 3 mois) **sur toutes les plages**, avec jalons visibles selon les règles déjà posées.  
> **Pas un quota.** La longueur suit le nombre de **signaux publiables**. Aujourd’hui le problème inverse : trop de signaux meurent avant l’affichage.

Lectures liées : `RECAP_ANALYSE_COURT_MOYEN_LONG.md` (comment ça tourne), `RECAP_ANALYSE_MOTEUR_INTERPRETATION.md` § 14–17 (exemples cibles mot pour mot).

---

## 0. Ce que le site doit faire (contrat)

Trois colonnes = trois **questions**, pas trois résumés de plus en plus longs.

| Colonne | Question | Ce que les exemples font |
|---------|----------|--------------------------|
| Maintenant | Que s’est-il passé **dans cette plage** ? | Mesure → normalisation → comparaison → écart → interprétation. Plusieurs paragraphes **distincts**. |
| Trajectoire | Comment ça s’insère / ce qui se construit ? | Ratios, socle vs séance, dose-réponse sommeil, composition ≠ volume. |
| Parcours | Qu’est-ce que ça **ancre** dans l’historique ? | Poids historique, répertoire, zones 90 j., continuité — **pas** une copie du court terme. |

Règles non négociables (issues des 25 principes + exemples) :

1. Une phrase = au moins **fait + comparaison + quantification + lecture**.
2. Un chiffre seul n’est pas une analyse. Ratio / % / poids historique avant le dump.
3. Exposition ≠ performance.
4. Sommeil : **association**, pas « le sommeil explique ». Silence si non publiable — jamais « pas assez de données ».
5. Jalons = **supplément** (slot extra), jamais à la place de `volume_shape`.
6. **Même densité** sur 30 j. / 3 mois / 6 mois / 1 an / 2 ans que sur Aujourd’hui et 7 j. — pas un résumé plus maigre.
7. Court / moyen / long **ne répètent pas** le même argument.

---

## 1. Écart réel : le code vs ce que tu vois

Les exemples 7 j. et Aujourd’hui **sport** sont déjà *proches* de ce que `detectDiscoveries` **écrit**. Le trou n’est pas « on ne sait pas rédiger une semaine ». Le trou est :

1. **ces textes n’arrivent pas tous à l’écran** (caps, rivaux, groupe sémantique) ;
2. **le sommeil n’arrive presque jamais** (tuyau Garmin + caps + voix) ;
3. **les jalons n’arrivent presque jamais** (extra trop tardif / trop étroit + même caps) ;
4. **30 j. / 3 mois / année** n’ont pas le même *nombre* de lectures distinctes — une carte `volume_shape` à la place de 4 paragraphes.

La jauge § 16 à 100 % mesurait « le kind existe dans le fichier ». Elle ne mesurait pas « l’utilisateur le lit sur le Recap ».

---

## 2. Audit code — ce qui nous éloigne (par gravité)

### P0 — Le sommeil est calculé à côté du tuyau que l’UI utilise

`useRecapCrossCoachGarmin` charge `dailyMetrics` **sur la fenêtre Recap** via `loadDataByRange` et les met dans `garminPartial.dailyMetrics` (souvent `status: 'ready'`).

Le moteur sommeil lit **uniquement** `garminData.dailyMetrics` :

- `extractSleepNight(garminData, ymd)` (`recapSleepNight.js`)
- `buildSessionCatalog` → `row.night = extractSleepNight(garminData, …)` (`recapPersonalBaselines.js`)
- `publishSleepCandidates(catalog)` exige **≥ 8 paires** séance×nuit

`garminData` = `garminBundle` = `loadAllData()` dans `RecapTab.jsx`.  
`garminDailyMetrics` (le partial) est passé à `buildAdaptiveRecapInsights` **puis ignoré** par `buildPeriodDiscoveryBundle` / `buildComposedInterpretationPipeline` (ils ne prennent que `opts.garminData`).

Conséquences :

- premier calcul souvent **sans** bundle (`garminBundle === null`) → catalogue sans nuits → `publishSleepCandidates` = `[]` → **zéro** `disc_sleep_*` ;
- même après chargement, si `loadAllData` et `loadDataByRange` ne portent pas les mêmes champs sleep, le partial a les nuits et le bundle non ;
- pour corréler 14 / 90 séances il **faut** l’historique, pas seulement 7 jours de partial — il faut **fusionner** les deux sources, pas en choisir une.

Tant que ce merge n’existe pas, **aucune plage** n’affichera de sommeil, quels que soient les kinds écrits.

### P0 — Les plafonds 2 / 3 / 2 tuent le sommeil et les jalons

`PERIOD_BASE_CAPS` = now 2 / trajectory 3 / journey 2.  
`NATURE_COLUMN_CAPS` UI = 2 / 3 / 2 (3 / 4 / 3 seulement si un `disc_ms_*` est **déjà** dans le pool pondéré).

Exemples Aujourd’hui **Maintenant** sport : 4–5 blocs (densité, épaules, tirage, poids des mouvements, composition).  
Exemples Aujourd’hui **Maintenant** sommeil : 4 blocs (nuit, zone 7h30, durée de séance, FC/BB).

Le code **détecte** les deux familles. `selectPeriodDiscoveries` n’en garde que **2** en `now`.

Priorité today `now` :

`pending` → `density` → **`sleep_night`** → `volume_shape` → …

Si la séance a des minutes : slot 1 = densité, slot 2 = nuit **ou** volume_shape selon l’ordre. L’autre meurt. Les exemples veulent **les deux familles dans la même colonne**.

Priorité week `now` :

`sleep_week` → `volume_shape` → `sleep_night` → `sleep_deep` → `peak_day` → …

Cap 2 : au mieux **une** carte sommeil + volume, ou volume + pic. Les exemples 7 j. court sommeil ont **trois** paragraphes sommeil **plus** le portrait sport.

**Décision de plan :** plafonds = maximums, mais le maximum actuel est trop bas pour le contrat. Il faut des **slots réservés par famille de signal** (sport / sommeil / jalon), pas un unique cap qui fait s’entre-tuer les familles.

Proposition de caps **max** (jamais un plancher) :

| Voix | Sport now/traj/journey | + sommeil si publiable | + jalon extra |
|------|------------------------|------------------------|---------------|
| today | 3 / 3 / 2 | +2 / +2 / +1 | +1 / +1 / +1 |
| week | 3 / 3 / 2 | +2 / +2 / +1 | +1 / +1 / +1 |
| month | 3 / 4 / 2 | +2 / +2 / +2 | +1 / +1 / +1 |
| long/year | 3 / 3 / 3 | +1 / +2 / +2 | +1 / +1 / +1 |

Toujours : si le signal n’existe pas, le slot reste vide. Pas de remplissage.

### P0 — Un seul groupe sémantique pour **tout** le sommeil

`SEMANTIC_INSIGHT_GROUPS.reading_period_sleep` liste **tous** les `disc_sleep_*`.  
`selectBalancedCandidates` : −16 si le groupe est déjà pris.

Donc même si `selectPeriodDiscoveries` sort `sleep_night` + `sleep_volume` + `sleep_deep`, la 2ᵉ et 3ᵉ cartes sommeil sont **pénalisées à l’UI**. Les exemples en veulent 3–4 **dans la même colonne**.

À faire : éclater en groupes qui correspondent aux **questions** (nuit du jour ≠ dose-réponse ≠ architecture ≠ zones 90 j.), pas un sac « sleep ».

Même logique rivaux : `DISCOVERY_RIVALS` fusionne

`sleep_volume` ↔ `sleep_assoc` ↔ `sleep_combo` ↔ `sleep_month` ↔ `sleep_perf`

→ **une seule** carte « volume×sommeil » alors que les exemples empilent seuil 7h30 **et** séparation ≥300 **et** minutes de séance.

Rivaux légitimes : ne pas dire deux fois le **même** seuil. Rivaux illégitimes : interdire architecture + volume + J-2.

### P0 — La voix de plage interdit le Parcours sommeil sur Aujourd’hui / 7 j.

Les exemples **Aujourd’hui — Long terme (sommeil)** parlent des **trois derniers mois** (zones 8h / 7h30 / 6h30, mois de juin).  
Les exemples **7 j. — Long terme (sommeil)** parlent du profil historique 7h30 → 340 vs 240 reps, et des semaines à ≥ 4 nuits longues.

Le code :

- `disc_sleep_zones` / `_quarter` / `_delayed` : `isMonth || isLongVoice` / `isLongVoice` seulement ;
- voix `today` et `week` → **aucun** de ces kinds.

L’architecture produit dit : colonne Parcours = angle, **données 90 j. autorisées** même si le picker est Aujourd’hui.  
Le code confond **voix de lexique** et **droit d’ouvrir un kind journey**.

À faire : `isToday` / `isWeek` gardent le **lexique** (« cette séance », « cette semaine ») mais **n’interdisent plus** les kinds `journey` sommeil / ancre 90 j. dès que `d90` / paires ≥ seuil.

Sinon le long terme aujourd’hui restera « ancre 7,9 % du mois » (sport) **sans** zones de sommeil, alors que c’est exactement l’exemple cible.

---

### P1 — Jalons : moteur présent, fenêtre d’apparition trop étroite

`detectRecapMilestones` tourne. `take()` **refuse** les jalons (voulu). Passe extra : **+1** par angle, score ≥ 52, `limit = base + 1`.

Pourquoi tu n’en vois pas :

1. Extra **après** remplissage sport. Si now a déjà 2 cartes, il reste 1 slot. Si aucun jalon `eligible` dans la fenêtre → rien.
2. `eligible` today = **date === aujourd’hui**. Un PR d’hier n’existe pas sur Aujourd’hui (correct). Un premier exo de la semaine n’existe pas sur Aujourd’hui (correct). Sur **7 j.** toute la fenêtre est OK — donc si rien n’apparaît en 7 j., ce n’est pas l’éligibilité today, c’est la **détection** ou la **sélection UI**.
3. `isMeaningfulAbsence` : 40 j. vs habitude 45 j. = silence (voulu). Beaucoup de « retours » perçus meurent ici.
4. Premières fois month ≤ 10 j., long ≤ 21 j. Un palier de cumul **dans** la fenêtre doit passer (`inWindow` seul). Si le palier 5 000 est tombé hors des 7 j., silence en week (correct).
5. `columnCapsForCandidates` n’ouvre 3/4/3 que si un `disc_ms_*` est dans les **candidats essays**. S’ils n’ont pas survécu à `selectPeriodDiscoveries`, l’UI reste à 2/3/2 et n’a **pas** de place même pour un extra.
6. Groupe sémantique : les jalons sont mieux découpés que le sommeil (`reading_milestone_*`). Moins grave. Le cap reste le tueur.

À faire :

- garder « jalon = extra, n’évince pas volume_shape » ;
- **réserver** le slot extra **avant** de remplir le cap sport (aujourd’hui l’extra teste `length >= limit` **après** que sport a pris base+extra si observationCaps a élargi — vérifier l’ordre : extra limite = `baseCaps + 1`, sport peut déjà avoir 2, il reste 1. OK en théorie) ;
- afficher le jalon **même si** sport a 2 cartes : ça exige cap UI ≥ 3 en now dès qu’un jalon est **détecté** (`all`), pas seulement `selected` ;
- panneau DEV : compteur `milestonesDetected` vs `milestonesSelected` (comme sleep).

Règles d’éligibilité **à conserver** (ne pas les relâcher pour « remplir ») :

- today = jour J seulement ;
- absence = rupture d’habitude, pas un calendrier brut ;
- premières fois long ≤ 21 j.

---

### P1 — 30 j. / 3 mois / année : une carte là où les exemples en veulent quatre

Semaine : `volume_shape` + `muscle_now` + `peak_day` + `no_running` + `exercise_base` + `push_pull` + `emergence` + `kcal` + `anchor`. Densité proche des exemples sport 7 j.

Mois : **un** `volume_shape` (mois vs prev30) + éventuellement share shift / fade / `sleep_month`.  
Trimestre : **un** `volume_shape` (totaux + rythme 28 j.) + `quarter_arc`.

Kinds **coupés** hors today/week alors que les exemples 30 j. / 3 mois les réutilisent sous un autre lexique :

| Kind | Garde actuelle | Exemple qui en a besoin |
|------|----------------|-------------------------|
| `disc_peak_day` | fit 0,8 hors week | pic du mois / du trimestre |
| `disc_exercise_base` | `isWeek` only | socle du mois vs séance dense |
| `disc_composition_not_volume` | `isToday` only | mois : fréquence vs reps/séance |
| `disc_kcal_profile` | week **ou** month, pas long | 3 mois : kcal × minutes |
| `disc_sleep_week` / concentration fenêtre | week only | 30 j. a `sleep_month` (OK) mais 3 mois doit garder la concentration (`highShare`) |
| percentiles, ratio 2,7×, top 15 % | **n’existent pas** | principe 5, 16 |
| « poids historique » nommé | seulement `ofMonthVol` ancre | principe 7 |

`comparableWeeklyRates` (28 vs 28 hors mois-like) est **juste** — ne pas y toucher. Le manque n’est pas le rythme inventé, c’est le **reste** de la lecture (composition, pic, kcal, sommeil, jalons).

---

### P1 — Chaîne d’information trop courte dans beaucoup de bodies

Les **meilleurs** texts (densité today, volume_shape week, sleep_night) suivent déjà :

observation → référence → écart → importance → interprétation.

Les plus faibles (surtout long voix `volume_shape`, `disc_anchor`, gabarits `continuity`) :

- redisent le total ;
- n’ouvrent pas un 2ᵉ ratio ;
- n’osent pas le « donc ».

Règle d’implémentation : un `discovery.body` qui n’a qu’**une** information liée est un draft, pas une carte. Soit on ajoute la comparaison, soit on ne publie pas.

Ne pas allonger en listant 6 muscles. Allonger en **reliant** 2–3 dimensions (principe 22).

---

### P2 — Phénomènes absents du runtime (exemples / 25 principes)

Pas encore dans `detectDiscoveries` / corrélation, donc impossibles à « débloquer » par les caps :

| Signal demandé | État |
|----------------|------|
| Percentile de séance (top 15 % / 90 j.) | absent |
| Ratio poussée/tirage **en facteur** (2,7×) | parts % oui, facteur non |
| Densité reps/min (5,54) en plus de reps/h | reps/h seulement |
| Volume / jour calendaire **vs** / jour entraîné | reps/séance oui, /7 j. calendaire rare |
| Exposition vs performance (même exo, même variante) | `disc_exercise_progress` existe ; pas le couple explicite |
| Confiance signal (fort / modéré / exploratoire) sur sommeil | `confidence` interne, pas dans la carte |
| Limite de corrélation en une ligne dédiée | parfois « ce n’est pas une cause », pas systématique |
| Anomalie adaptative (hors IQR / +55 %) | vs médiane exo only (`disc_vs_habit`) |
| Record / quasi-record comme **événement** dans la colonne | jalon PR, souvent filtré |
| Histoire unique (« Aujourd’hui tu as… ») qui **lie** sport+sommeil+jalon | combos `disc_ms_sleep_combo` existent, rarement sélectionnés |

---

### P2 — Confusion période Recap vs horizon de **référence**

Les exemples Aujourd’hui citent en permanence 7 j., 30 j., 90 j. **comme références**, pas comme d’autres plages.

Le code a `d7` / `d30` / `d90` / `prev30` / `first30` **toujours calculés**. Beaucoup de kinds n’ont **pas le droit** de les citer (voix).

Règle à graver :

- **Mesure affichée** = fenêtre Recap (`period`).
- **Références** = 7 / 28 / 30 / 90 toujours citables si le kind est de la bonne **colonne**.
- Parcours aujourd’hui **doit** pouvoir dire « sur le trimestre… » (c’est l’exemple).

Sans ça, Aujourd’hui Parcours restera un mini-Maintenant.

---

## 3. Plan de travail (ordre obligatoire)

Ne pas écrire de nouveaux gabarits tant que P0 n’est pas vert : on a déjà les textes, ils ne s’affichent pas.

### Phase A — Tuyau et vérité (1 lot)

1. Fusionner `garminData.dailyMetrics` ← `garminPartial.dailyMetrics` + bundle (clés date, sleep intact).
2. Recalcul Analyse quand le partial passe à `ready` (déjà dans les deps `garminPartialForRecap` — vérifier que le merge est lu **après** ready).
3. Panneau DEV : `sleepPairs`, `sleepCandidates.length`, `sleepSelected[]`, `milestonesDetected[]`, `milestonesSelected[]`, `droppedBy: cap|rival|family|semantic|voice`.
4. Test : snapshot + 12 paires nuit → `publishSleepCandidates.length > 0` **et** au moins un `disc_sleep_*` dans `insights.shortTerm` ou `mediumTerm` sur today **et** 7d.

**DoD A.** Sur tes données réelles, une plage 7 j. avec nuits Garmin montre **au moins une** carte sommeil. Si zéro, le panneau dit *pourquoi* (0 paires / rivaux / cap).

### Phase B — Faire de la place sans remplir (1 lot)

1. Caps par **famille de signal** (sport / sommeil / jalon), max proposés § 2.
2. Éclater `reading_period_sleep` (nuit | dose | architecture | zones).
3. Rivaux sommeil : uniquement doublons de **même question** (volume vs month vs combo = même seuil 7h30 → 1 seule ; architecture / deep / J-2 / freq restent compatibles).
4. Jalon : cap UI 3/4/3 si `detectRecapMilestones` a renvoyé ≥ 1 kind **éligible**, même avant `selected`.
5. `selectBalancedCandidates` : ne pas −16 entre `disc_sleep_night` et `disc_sleep_volume`.

**DoD B.** Une semaine dense peut montrer : portrait sport + pic **et** concentration sommeil **et** un jalon, sans se remplacer. Semaine pauvre : 1–2 cartes, colonnes vides OK.

### Phase C — Voix ≠ droit journey (1 lot)

1. Autoriser kinds `journey` sommeil (`zones`, `quarter`, `delayed`, `freq`, `j2`) dès que l’échantillon 90 j. est publiable, **y compris** voix today/week. Lexique : « cette séance s’inscrit dans… » / « cette semaine confirme… », pas « ce trimestre » comme si le picker était 3 mois.
2. Autoriser `disc_sleep_volume` (nature trajectory) **en plus** de `disc_sleep_night` (now) aujourd’hui — c’est l’exemple « zone favorable ».
3. 7 j. now : `sleep_week` + `sleep_deep` ne sont plus mutuellement exclusifs du volume_shape (slots famille).

**DoD C.** Aujourd’hui Parcours peut citer les zones 90 j. si n OK. 7 j. Court peut citer concentration **et** profond **et** le portrait sport.

### Phase D — Parité 30 j. / 3 mois / 6 mois / 1 an / 2 ans (2 lots)

Pour **chaque** plage, une fiche « questions de colonne » (déjà § 5 de `RECAP_ANALYSE_COURT_MOYEN_LONG.md`) devient une **checklist de kinds + rédaction** :

**30 j. Maintenant** — mois vs prev30 (déjà) **et** densité vs prev30 **et** dominante musculaire **et** pic si ≥ 28 % **et** no_running si vrai.  
**30 j. Trajectoire** — `sleep_month` (plusieurs dimensions dans 1–2 cartes, pas 1 phrase) + share shift + fade + régime/jalon.  
**30 j. Parcours** — zones 3 paliers + J-2 + best_month si réel.

**3 mois Maintenant** — totaux **et** rythme 28 vs 28 (garder l’avertissement « pas le taux de la fenêtre ») **et** muscles **et** pic.  
**3 mois Trajectoire** — sommeil volume `all` + cardio×sommeil + mix.  
**3 mois Parcours** — `quarter_arc` + `sleep_quarter` + juin-like (`best_month` + `monthSleepExplain`) + delayed.

**6 mois / 1 an / 2 ans** — même densité de *questions* ; lexique année/semestre ; mix 90 ou 180 ; `exercise_progress` en parcours.

Ouvrir les kinds aujourd’hui gated (`exercise_base`, `kcal`, `peak_day` fit, `composition`) avec **rédaction de voix**, pas en copiant le texte semaine.

**DoD D.** Un utilisateur qui passe 7 j. → 30 j. → 3 mois voit **autant de lectures distinctes** (quand les données sont là), pas une carte unique plus vague.

### Phase E — Jalons visibles, règles inchangées (1 lot)

1. DEV : lister les jalons détectés non sélectionnés + motif.
2. Garantir 1 extra par angle si `eligible` + score ≥ 52.
3. Combo sommeil×jalon : nature trajectory, ne pas rivaliser avec `disc_sleep_volume` (questions différentes : rencontre datée vs statistique).
4. Ne **pas** relâcher `isMeaningfulAbsence` ni today = jour J.

**DoD E.** Sur 7 j., si un PR ou un palier 300 reps du jour est dans la fenêtre, une carte jalon (bordure bleu) apparaît **en plus** du volume.

### Phase F — Signaux manquants (après A–E verts) (2 lots)

Ordre :

1. Ratio poussée/tirage en facteur (2,7×) dans `disc_push_pull`.
2. Poids historique systématique (séance / mois, exo / 30 j.) — déjà en germes, à généraliser 30 j. / 3 mois.
3. Percentile 90 j. (top x %) si n ≥ 12 séances.
4. Volume / jour calendaire vs / jour entraîné quand `trainingDays` ≠ span (semaine 3 séances / 7 j.).
5. Ligne **limite** sur toute carte sommeil (« association, n=…, pas une cause »).
6. Exposition vs performance sur un exo établi (volume tient, médiane bouge ou non).

Pas de percentiles ni de « histoires » LLM tant que A–E ne sont pas vrais sur tes comptes.

---

## 4. Ce qu’on ne fait pas

- Remplir une colonne pour viser 400 mots.
- Relâcher les silences (nuit < 90 min, n < 8 paires, RPE absent, Δ poids < 0,6 kg).
- Inventer un rythme 92 j. × 7.
- Transformer Court/Moyen/Long en 7 / 30 / 90 jours.
- Marquer la jauge à 100 % tant que le Recap réel n’a pas sommeil + jalon + parité 30 j.

---

## 5. Jauge de ce plan (remplace § 16 pour le livrable visible)

| # | Lot | Poids | 0 % tant que… |
|---|-----|-------|----------------|
| A | Merge Garmin + DEV droppedBy + 1 carte sommeil réelle | 20 | zéro sommeil toutes plages |
| B | Caps familles + rivaux/sémantique + jalon cap | 20 | sport évince sommeil |
| C | Journey sommeil sur today/week | 15 | aujourd’hui long = copie du now |
| D | Parité 30 j. / 3 m / 6 m / 1 an / 2 ans | 25 | une seule carte vague hors 7 j. |
| E | Jalons visibles, règles tenues | 10 | aucun `disc_ms_*` à l’écran |
| F | Ratios / percentiles / limites | 10 | A–E pas verts |

**Totality actuelle de ce plan : ~15 %** (kinds et extracteurs existent ; le chemin jusqu’à la carte est cassé).

---

## 6. Fichiers à toucher (quand on exécutera)

| Fichier | Phase | Quoi |
|---------|-------|------|
| `recapInterpretationPipeline.js` / `recapPeriodDiscoveries.js` `buildPeriodDiscoveryBundle` | A | merge `garminDailyMetrics` |
| `RecapTab.jsx` / `useRecapTabMetrics.js` | A | ne plus calculer Analyse sans partial ready **si** bundle vide |
| `RecapTrainingStateDebugPanel.jsx` | A | droppedBy, paires, jalons |
| `recapPeriodDiscoveries.js` caps, rivaux, voix | B, C, D | |
| `recapInsightNature.js` caps UI | B, E | |
| `insightSemanticThemes.js` | B | éclater sleep |
| `recapAdaptiveInsights.js` `selectBalancedCandidates` | B | |
| `recapMilestoneEngine.js` | E | peu de règles, surtout sélection |
| `recapSleepCorrelation.js` | A, F | concentration trop stricte (`|volShare−nightShare| < 15` tue des semaines « presque toutes longues ») — revoir **après** le merge, pas avant |
| Tests `recapPeriodDiscoveries` / `recapHorizonEssays` / golden 7d+today | toutes | |

---

## 7. Premier test manuel (après phase A)

1. Recap → Analyse → **7 jours**.  
   Attendu : portrait 3 séances / ~1049 reps **et** au moins concentration ou profond **si** nuits là **et** jalon si un événement de la semaine.  
2. **Aujourd’hui** (séance faite).  
   Attendu : densité vs 30 j. **et** nuit vs 4+ nuits **et** (Trajectoire) zone 7h30 sur 14 séances.  
3. **30 jours**.  
   Attendu : mois vs mois d’avant **et** `sleep_month` si 8+ paires.  
4. Panneau DEV : si une colonne est vide, `droppedBy` non vide.

Si l’étape 1 n’a toujours pas de sommeil après merge, le bug est dans `extractSleepNight` (forme Garmin) — alors lire un `dailyMetrics[ymd]` réel et aligner les alias, pas ajouter des kinds.
