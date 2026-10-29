# Architecture cible — moteur d’analyse Momentum Sport

**Date :** 29 octobre 2026  
**Statut :** conception — **aucune implémentation** tant que ce document n’est pas validé  
**Prérequis :** [AUDIT-STRATEGIQUE-MOTEUR-ANALYSE.md](./AUDIT-STRATEGIQUE-MOTEUR-ANALYSE.md)  
**Périmètre :** toutes les plages (`periodVoice` : today → all). Les 14 cartes « 30 jours » restent un **cas d’étude**, pas la limite de solution.

---

## Objectif de réussite

Conserver le moteur **déterministe** (hors-ligne, historique, indicateurs vérifiables) comme fondation.

À **données identiques**, les nouvelles analyses doivent :

1. révéler **davantage d’informations pertinentes** ;
2. **mieux expliquer** les changements observés ;
3. **éviter** les conclusions que les données ne justifient pas.

Le problème est **analytique** (parcours données → preuves → conclusions → sélection), pas rédactionnel. Les analyses doivent **partager leurs informations**. La fenêtre définit le **périmètre**, pas l’ancienneté de chaque événement.

### Corrections par rapport à la proposition F de l’audit

| Point | Proposition initiale (audit §F) | Position retenue |
| --- | --- | --- |
| **A. Temporalité** | « Tu viens de » ⇔ `eventYmd === today` comme règle générale | Garde-fou utile, **trop rigide** comme politique. Voice Planner multi-facteurs (date, délai, nature, persistance, horizon, qualité d’historique). |
| **B. Chiffres** | « Aucun chiffre hors atoms » | Intention bonne, interprétation dangereuse. **Traçabilité** : source **ou** calcul déterministe vérifiable — pas interdiction de calculer. |
| **C. Fusion** | Fusionner systématiquement les cartes « même sujet » (ex. 4+7, 1+10, 5+12) | Piste utile, **pas règle auto**. Arbitrer sur l’**information nouvelle**, pas la proximité thématique. |

---

## 1. Qu’est-ce qu’une bonne analyse ?

On n’optimise ni la longueur, ni la richesse rhétorique, ni le nombre de chiffres. Une analyse courte qui révèle un changement important doit battre une longue paraphrase.

### 1.1 Grille de qualité (10 dimensions)

Chaque analyse (carte candidate ou pack) est notée **0–3** par dimension.

| # | Dimension | Question concrète | 0 | 3 | Signal négatif typique |
| --- | --- | --- | --- | --- | --- |
| 1 | **Exactitude factuelle et mathématique** | Faits et chiffres rejouables ; pas de contradiction interne | Faux / inventé | Rejouable bout-en-bout | % faux, date erronée, causalité affirmée |
| 2 | **Pertinence de la découverte** | Phénomène non trivial pour *ce* profil sur *cette* période | Banal | Rare / important pour l’athlète | « Tu t’es entraîné X fois » sans contraste |
| 3 | **Profondeur de l’interprétation** | Explique *comment / pourquoi plausible* au-delà du constat | Paraphrase | Décomposition ou trajectoire | Liste de chiffres sans lien |
| 4 | **Exploitation de l’historique** | Dates réelles, gaps, baselines hors fenêtre si besoin | Amnésique | Ancré + contextualisé | Gap 77 j. sans suite des séances |
| 5 | **Pertinence des croisements** | Relie ≥2 familles de signaux quand c’est informatif | Isolé inutilement | Articulation bornée | GTG et pompes en monologues |
| 6 | **Personnalisation** | Ancrée sur exercices, objectifs, habitudes réels | Générique | Non interchangeable | Texte valable pour n’importe qui |
| 7 | **Qualité de la conclusion** | Niveau épistémique clair ; refuse l’injustifié | Sur-affirmation | Conclusion exacte au support | « Le sommeil a causé… » sans n |
| 8 | **Utilité pratique** | Aide à décider, observer ou comprendre un levier | Décoratif | Actionnable ou éclairant | Stat curiosité sans implication |
| 9 | **Clarté titre / texte** | Titre = découverte ; corps scannable | Flou / trompeur | Scannable | Badge « Sommeil » sur une carte GTG |
| 10 | **Originalité vs pack** | Info *marginale* par rapport aux autres cartes affichées | Doublon | Complémentaire | Deux cartes 25 000 reps |

### 1.2 Agrégation et vetos

**Score brut** (proposition) :

```
S = (2·Exactitude + 1.5·Originalité + 1.5·Conclusion
   + Pertinence + Profondeur + Historique + Croisements
   + Personnalisation + Utilité + Clarté) / 12
```

**Vetos durs** (rejet immédiat, score ignoré) :

- Exactitude = 0 ;
- Conclusion qui affirme une causalité non supportée ;
- Originalité = 0 face à une carte déjà retenue du pack (sauf complément explicite validé).

### 1.3 Usage de la grille

| Usage | Comment |
| --- | --- |
| **Sélection runtime** | Le sélecteur d’utilité marginale (§6) s’aligne sur ces dimensions, pas sur la longueur ni le remplissage de quotas. |
| **Tests d’amélioration** | Corpus multi-profils × multi-horizons. Pour chaque cas : rubrique humaine + métriques auto (redondance, couverture de claims, taux de veto). |
| **Critère d’acceptation** | À snapshot figé : ↑ score moyen du pack **et** ↓ rejets Exactitude / Conclusion. Une carte courte à haute pertinence peut gagner seule face à une longue descriptive. |

### 1.4 Ce que la grille refuse explicitement

- Remplir 5 cartes « correctes » qui n’apportent presque rien ensemble.
- Récompenser le volume textuel.
- Traiter deux constats coïncidents comme une découverte croisée.
- Présenter comme certain ce qui n’est qu’une hypothèse plausible.

---

## 2. Modèle de données analytique

Couche mince **au-dessus** des détecteurs existants — pas un second moteur de calcul parallèle.

### 2.1 Vue d’ensemble

```
SourceFact → Indicator → Comparison → Interpretation
                                  ↘ Hypothesis (optionnelle, bornée)
RelationEdge relie plusieurs nœuds
Claim  = unité publiable (support + conclusion autorisée)
CardSpec = composition d’1..n Claims pour l’UI
```

### 2.2 Objets, champs, responsabilités

#### SourceFact — fait observé dans les données sources

| Champ | Type | Rôle |
| --- | --- | --- |
| `id` | string | Identifiant stable |
| `source` | enum | `reps` \| `gtg` \| `sleep` \| `feedback` \| `program` \| `endurance` \| … |
| `ymd` | YYYY-MM-DD | Date calendaire de l’observation |
| `entityId` | string? | Exercice, nuit, séance… |
| `value` | number \| string \| bool | Valeur brute |
| `unit` | string? | `reps`, `min`, `kg`… |
| `rawRef` | string | Pointeur vers la clé / ligne source |

**Responsabilité :** constater. **Ne fait pas :** calculer, interpréter, rédiger.

#### Indicator — indicateur calculé

| Champ | Type | Rôle |
| --- | --- | --- |
| `id` | string | Ex. `volume.reps.window`, `freq.sessions.per_week` |
| `method` | enum | `sum` \| `mean` \| `ratio` \| `pct_change` \| `share` \| `gap_days` \| … |
| `inputs` | id[] | Refs `SourceFact` ou `Indicator` |
| `value` | number | Résultat |
| `window` | `{start,end}`? | Périmètre de calcul |
| `n` | number | Effectif (séances, nuits…) |
| `quality` | enum | `ok` \| `sparse` \| `missing` |

**Responsabilité :** agrégat déterministe unique par run. **Ne fait pas :** raconter.

#### Comparison — comparaison temporelle (ou de groupes)

| Champ | Type | Rôle |
| --- | --- | --- |
| `id` | string | |
| `left` / `right` | Indicator refs | Deux côtés |
| `delta` / `deltaPct` | number? | Écart absolu / relatif |
| `comparable` | bool | Les périodes / entités sont-elles comparables ? |
| `incomparableReason` | string? | Si `comparable=false` |

**Responsabilité :** écart mesuré. **Ne fait pas :** affirmer une cause.

#### Interpretation — lecture fondée sur des faits

| Champ | Type | Rôle |
| --- | --- | --- |
| `id` | string | |
| `premiseIds` | id[] | Claims / Comparisons / Indicators support |
| `statement` | string | Formulation canonique (pas forcément UI) |
| `epistemic` | `fact` \| `interpretation` \| `hypothesis` | Niveau de certitude |
| `confidence` | 0..1 | |
| `forbiddenIf` | rule[] | Conditions qui invalident la lecture |

#### Hypothesis — hypothèse plausible (sous-type d’Interpretation)

Comme Interpretation, plus :

- `counterfactuals[]` — ce qui la fragiliserait ;
- `minN` — effectif minimal avant publication.

#### UnsupportedConclusion — conclusion refusée

| Champ | Rôle |
| --- | --- |
| `pattern` | Motif de conclusion interdite |
| `reason` | Pourquoi les données ne suffisent pas |
| `triggeredBy` | Quels nœuds l’ont fait surgir |

Stockée pour tests / debug ; **jamais affichée**.

#### RelationEdge — relation entre faits / analyses

| Champ | Type | Rôle |
| --- | --- | --- |
| `from` / `to` | id | Nœuds reliés |
| `kind` | enum | `co_occur` \| `sequence` \| `shared_entity` \| `decomp` \| `oppose` |
| `strength` | 0..1 | |
| `dates` | YYYY-MM-DD[] | Ancrage calendaire du lien |

#### Claim — unité de sélection et de vérité

| Champ | Type | Rôle |
| --- | --- | --- |
| `id` | string | Stable |
| `kind` | string | Ex. `disc_ms_return`, `disc_gtg_unplanned_role` |
| `topic` / `sense` | string | Compat avec `claimFromCandidate` actuel |
| `support` | id[] | Faits / indicateurs / comparaisons |
| `numbers` | TraceableNumber[] | Tous les chiffres publiables |
| `time` | TemporalFrame | Voir §3 |
| `relations` | edge ids | |
| `noveltyKey` | string | Clé anti-doublon factuelle (ex. `cumul_reps:25000`) |
| `epistemic` | enum | Niveau max autorisé pour la prose |
| `utilityHints` | object | Magnitude, alignement profil, etc. |

#### CardSpec — intention de carte UI

| Champ | Rôle |
| --- | --- |
| `claimIds` | 1..n claims composés |
| `composition` | `single` \| `cluster` \| `cross` |
| `titleIntent` | Découverte à porter en titre |
| `voicePlan` | Sortie du Voice Planner |

**Ne recalcule pas** les indicateurs.

#### TraceableNumber

```text
{
  value: number,
  unit?: string,
  origin: 'source' | 'derived',
  method?: 'sum' | 'mean' | 'ratio' | 'pct_change' | 'share' | 'gap_days' | …,
  inputIds: string[],   // SourceFact | Indicator
  formulaNote?: string  // documentation courte pour audit / tests
}
```

### 2.3 Niveaux épistémiques (obligatoires)

| Niveau | Exemple permis | Exemple refusé |
| --- | --- | --- |
| **Fait** | « 25 000 reps cumulées au 29/10 » | « Tu n’as jamais fait X » si seul Momentum manque l’enregistrement |
| **Interprétation** | « La hausse de volume vient surtout de +fréquence, pas de la dose/séance » | « Tu progresses grâce au sommeil » |
| **Hypothèse** | « Les passages GTG hors planning coïncident avec la fenêtre où le max pompes monte — à surveiller » | « Le GTG a *causé* la progression » |
| **Non soutenu** | Stocké, jamais affiché | Toute causalité sans n / sans comparabilité |

Chaque conclusion affichée doit pouvoir être **reliée** à `support[]` + `numbers[]`.

### 2.4 Anti-duplication avec l’existant

| Déjà présent | Rôle dans l’architecture cible |
| --- | --- |
| `buildSessionCatalog`, sleep assoc, GTG discoveries, milestones, features `userTrainingState` | **Producteurs** de SourceFact / Indicator / Comparison — restent la source de vérité calculatoire |
| `claimFromCandidate` (`recapNarrativeClaims.js`) | **Évolution** : topic/sense **plus** support, noveltyKey, epistemic (aujourd’hui trop mince pour l’utilité) |
| `detectTrainingRelations` | Alimente RelationEdge ; aujourd’hui sous-exploité dans la prose |
| Essays / `writeThreadCard` | **Composer** Claim → CardSpec → texte ; ne plus recalculer volume / gaps |
| `selectNarrativeColumns` + kinship | Remplacés **progressivement** par le sélecteur d’utilité (§6) |

**Règle d’or :** un calcul = un Indicator nommé, produit **une fois** par run de pipeline, référencé partout.

---

## 3. Temporalité généralisée (non rigide)

### 3.1 Principe

- La fenêtre (`30d`, `7d`, `all`…) = **périmètre d’analyse**.
- L’ancienneté d’un événement = **dates réelles** (`eventYmd` vs `refYmd`).
- `eventYmd === today` reste un **garde-fou** pour autoriser « Tu viens de », pas la politique globale de formulation.

### 3.2 TemporalFrame — entrées du Voice Planner

| Entrée | Rôle |
| --- | --- |
| `eventYmd` ou `[start,end]` | Date exacte / empan du phénomène |
| `refYmd` | Fin de fenêtre consultée (souvent « aujourd’hui » lecteur) |
| `elapsedDays` | Délai écoulé |
| `aspect` | `point` \| `onset` \| `ongoing` \| `completed_span` |
| `eventClass` | reprise, PR, cumul, tendance volume, assoc sommeil… |
| `persistence` | ponctuel vs durable |
| `horizonKey` | Contexte de période (n’écrase pas la date) |
| `historyQuality` | `fiable` \| `partiel` \| `premier_enregistrement` |

### 3.3 Politique de choix (ordre de priorité)

1. Si `historyQuality = premier_enregistrement` → « premier enregistrement / point de départ » — jamais « tu n’as jamais ».
2. Si `aspect = ongoing` et tendance encore vraie à `refYmd` → « depuis le… », « sur les dernières semaines » — pas « tu viens de ».
3. Si `aspect = point` :
   - `elapsed = 0` → « Tu viens de… » **autorisé** ;
   - `elapsed = 1` → « Hier… » (défaut) ; « tu viens de » seulement si `eventClass` très immédiat **et** décision produit explicite ;
   - `2–6` → « Il y a N jours… » / date courte ;
   - `7–27` → « Il y a X semaines… » / « le DATE » ;
   - `≥ 28` → date ancrée ; interdiction du « récemment » abusif.
4. **Reprise** : formuler le **gap** et la **date de retour**, pas l’âge de la fenêtre (« vue 30 jours » ≠ « reprise d’hier »).
5. **Cumul lifetime** : souvent **sans** marqueur d’immédiateté (« Tu as franchi… au DATE »).

Même planner pour tous les horizons (`today` → `all`). Seuls changent `refYmd` et la phrase d’appui de période.

Extension naturelle de `recapEventVoice.js` : remplacer le binaire presentPerfect / simple par `TemporalFrame` + templates.

### 3.4 Exemples — formulations correctes vs incorrectes

| Situation | Correct | Incorrect |
| --- | --- | --- |
| Reprise genoux, retour il y a 12 j., vue 30d | « Le 17 octobre, après 77 jours sans enregistrement… » | « Tu viens de reprendre… » |
| PR pompes **hier** | « Hier, nouveau max à 25… » | « Sur cette période, un max… » (trop vague) |
| PR pompes il y a **3 semaines** | « Le 8 octobre, max à 25… » | « Tu viens d’atteindre 25 » |
| Volume en hausse 4 semaines, toujours vrai | « Depuis fin septembre, le volume monte… » | « Tu viens d’augmenter ton volume » |
| Premier hyperextension dans Momentum | « Premier enregistrement le … — point de départ » | « Tu n’avais jamais fait d’hyperextensions » |
| GTG hors planning = habitude sur 2 fenêtres | « Tu continues à placer ces passages… » | « Tu viens d’ajouter un passage hors planning » |
| Événement d’**hier**, nature « immédiateté faible » (cumul) | « Hier, tu as franchi… » ou date | Forcer « Tu viens de » pour tous les events J−1 |
| Tendance terminée il y a 3 semaines | « Entre le … et le …, le volume a monté » | « Sur les dernières semaines » (implique encore vrai) |

---

## 4. Traçabilité des calculs

### 4.1 Invariant retenu

> Tout chiffre affiché = **TraceableNumber** : donnée source **ou** dérivation déterministe aux entrées et à la méthode identifiables.

Momentum **peut** calculer pourcentages, écarts, moyennes, parts de contribution, ratios — à condition de pouvoir les rejouer.

### 4.2 Pipeline de validation pré-publication

1. Collecter tous les `TraceableNumber` du `CardSpec`.
2. Rejouer `method(inputs)` → tolérance (ex. 0,5 % relatif ou 1 unité selon le type).
3. Vérifier `n` / `quality` : si `sparse` ou `missing`, omettre le chiffre **ou** le qualifier (« sur 4 séances seulement »).
4. Vérifier **comparabilité** : mêmes longueurs de fenêtre, même type d’entité, overlap sensé.
5. Détecter **contradictions** : deux Claims du pack avec Comparison opposées sur le même Indicator → garder le plus supporté, rétrograder l’autre en hypothèse ou drop.
6. Gate éditorial : la prose ne cite que des valeurs présentes dans `numbers[]` (+ arrondis d’affichage documentés).

### 4.3 Cas limites

| Cas | Traitement |
| --- | --- |
| Donnée manquante | Pas de % ; phrase qualitative ou silence |
| Effectif trop faible | Afficher n ; baisser confidence ; interdire hypothèses fortes |
| Périodes incomparables | `comparable=false` → pas de delta% ; comparaison qualitative ou refus |
| Résultats contradictoires | RelationEdge `oppose` ; une seule conclusion forte |
| Décomposition freq × dose | Trois TraceableNumber (total, freq, dose) + parts % (somme ≈ 100) |

Les « atoms » de l’audit deviennent le **journal d’audit** des TraceableNumber, pas une liste blanche exclusive de littéraux bruts.

---

## 5. Logique de croisement entre données

Objectif : passer de détections isolées à une **analyse de niveau supérieur** (dossier = Claims + RelationEdges), sans prétendre démontrer une causalité non établie, et sans se contenter de constater une coïncidence.

### 5.1 Mécanisme général

1. Detectors émettent des Claims (souvent mono-signal) — comme aujourd’hui.
2. Le **Cross-composer** cherche des RelationEdges (`shared_entity`, `sequence`, `co_occur`, `decomp`).
3. Si le lien est **informatif** (dates, n, comparabilité) → produire un Claim de niveau supérieur `epistemic ≤ hypothesis` ou `interpretation` selon le support.
4. Le sélecteur décide ensuite : **1 carte croisée**, **2 cartes complémentaires**, ou **1 seule** des deux — selon l’utilité marginale (§6), **jamais** par règle « même famille ⇒ fusion ».

### 5.2 Exemple — Reprise d’exercice + séances suivantes

| | |
| --- | --- |
| **Données** | Dernière séance avant gap, date de retour, `gapDays`, séances post-retour (volume, max set, feedback) |
| **Calculs** | Gap ; ratio 1ʳᵉ séance post / baseline pré-gap ; tendance des 3–5 suivantes |
| **Permis** | Ancrer la reprise ; décrire si le niveau revient / reste bas ; chronologie datée |
| **Refusé** | « Tu as surmonté une blessure » ; cause du gap ; « tu es remis » |

### 5.3 Exemple — Volume global + fréquence + dose / séance

| | |
| --- | --- |
| **Données** | Reps fenêtre, nb séances, durée |
| **Calculs** | Δvolume ; Δfreq ; Δreps/séance ; parts de contribution |
| **Permis** | « Hausse surtout via fréquence » / « surtout via dose » |
| **Refusé** | Fusion automatique avec « volume après bonne nuit » si l’angle sommeil apporte une info distincte solide ; inventer une part non calculée |

### 5.4 Exemple — GTG hors planning + repère pompes

| | |
| --- | --- |
| **Données** | Sets ad hoc datés ; historique max pompes ; chevauchement calendaire |
| **Calculs** | Densité GTG ; dates de variation du max ; corrélation temporelle **bornée** |
| **Permis** | Co-occurrence datée ; « à surveiller » ; si les deux claims sont retenus, **lien explicite** plutôt que deux monologues |
| **Refusé** | « Le GTG a produit +5 reps » ; fusion forcée si l’un des deux signaux est faible |

### 5.5 Exemple — Sommeil + volume + difficulté ressentie

| | |
| --- | --- |
| **Données** | Nuits appariées, volume séance, feedbacks difficulté, n |
| **Calculs** | Assoc sommeil×volume ; sommeil×RPE ; seuils de n |
| **Permis** | Association descriptive avec n ; tension « volume↑ mais ressenti↑ » |
| **Refusé** | Causal « mieux dormir → plus performer » ; carte sommeil si n &lt; seuil |

### 5.6 Exemple — Répartition musculaire + exercices + temps

| | |
| --- | --- |
| **Données** | Profil push/pull/… par fenêtre ; top exercices ; absences |
| **Calculs** | Shifts de mix ; concentration sur N mouvements ; tendances |
| **Permis** | « Le mix a basculé vers X via les exercices Y/Z » |
| **Refusé** | Diagnostic blessure / déséquilibre pathologique |

### 5.7 Principe épistémique des croisements

```text
coïncidence datée  →  fait de co-occurrence (permis)
lien temporel + n   →  hypothèse bornée (permis avec formulation faible)
mécanisme prouvé    →  hors portée du moteur déterministe actuel (refusé)
```

---

## 6. Sélection selon la valeur informative

### 6.1 Principes

- Ne **pas** partir du principe qu’il faut toujours remplir un quota de cartes.
- Ne **pas** fusionner toutes les analyses d’une même famille.
- Maximiser l’**utilité marginale** du pack pour l’utilisateur.

Critères pris en compte :

- importance du phénomène ;
- solidité des preuves ;
- information nouvelle apportée ;
- complémentarité avec les autres cartes ;
- redondance ;
- pertinence profil / objectifs ;
- volume de données réellement disponibles.

### 6.2 Score candidat (avant pack)

```text
U0 = w_importance × magnitude
   + w_evidence   × solidité (n, quality, comparable)
   + w_profile    × alignement objectifs / exercices suivis
   − w_generic    × banalité
```

Importance ≠ score discovery actuel seul : un petit n sur un signal critique (reprise longue) peut battre un gros volume banal.

### 6.3 Construction du pack (glouton)

1. Trier les candidats par `U0`.
2. Ajouter une carte si  
   `U_marginal = U0 − redondance(pack) − opposition_mal_gérée + complémentarité(cross) > seuil`.
3. **Redondance** : même `noveltyKey` / même TraceableNumber dominant / couverture textuelle / même topic+sense **et** même conclusion informative.
4. **Complémentarité** : RelationEdge `decomp` ou `sequence` avec info nouvelle → bonus ; deux angles vraiment distincts (volume global vs sommeil×volume) → **deux cartes possibles**.
5. **Arrêt** : plus aucun candidat au-dessus du seuil **ou** plafond souple (ex. 3–5 / horizon). Le plafond coupe le bruit ; il **n’oblige pas** à remplir.

### 6.4 Doublons vs complémentaires

| Situation | Action |
| --- | --- |
| Même cumul 25k, titres différents | **1** carte (`noveltyKey = cumul_reps:25000`) |
| Volume total + décomposition freq/dose | **1** carte préférable (même découverte enrichie) |
| Volume total + volume\|sommeil avec n solide et message distinct | **2** cartes si `U_marginal > 0` pour la 2ᵉ |
| GTG rôle + GTG×pompes | Préférer **1** carte croisée si les deux claims sont retenus ; sinon 1 des deux — pas deux monologues |
| Cartes 4 et 7, 1 et 10, 5 et 12 (audit) | Évaluer au cas par cas via `U_marginal` — **pas** de fusion automatique |

### 6.5 Limite du kinship actuel (rappel code)

`volumeFingerprint` (`recapCardKinship.js`) ne couvre que certains openings « volume / répétition ». Un match exact titre+corps échoue si le titre diverge → risque du doublon 25k. La clé anti-doublon doit vivre au niveau **Claim** (`noveltyKey`), pas seulement le blob prose.

---

## 7. Réexamen des composants existants

Chemin de production confirmé (audit §A) :

```text
useRecapTabMetrics
  → buildAdaptiveRecapInsights
      → buildComposedInterpretationPipeline
          → state / phenomena / periodDiscoveries / events / relations
          → buildHorizonEssayCandidates → renderInterpretations
      → spanStories + weighting
      → keepDistinctProofCards
      → selectNarrativeColumns
  → RecapAnalyseView
```

### 7.1 Matrice de décision

| Composant | Décision | Fichiers principaux | Risque régression | Tests nécessaires |
| --- | --- | --- | --- | --- |
| Snapshot / merge Garmin / catalog | **Inchangé** | `useRecapTabMetrics.js`, merge Garmin, catalog period discoveries | Faible | Fixtures existantes |
| `userTrainingState`, features | **Inchangé** calculs ; **adapter** sortie → Indicator | modules training state | Moyen si prose branchée trop tôt | Features → TraceableNumber |
| `recapMilestoneEngine` | **Adapter** émission Claim ; garder calculs | `recapMilestoneEngine.js` | Moyen | Jalons + golden claims |
| `buildPeriodDiscoveryBundle` / detect* | **Adapter** : Claims + edges | `recapPeriodDiscoveries.js`, sleep/GTG | Moyen | Kinds attendus / interdits |
| `detectTrainingRelations` | **Regrouper** vers RelationEdge | `trainingRelationEngine.js` | Moyen | Edges sur fixtures |
| `recapHorizonEssays` + `writeThreadCard` | **Adapter** : composer depuis Claims | `recapHorizonEssays.js`, `recapAnalysisDepth.js` | **Élevé** | Snapshots prose |
| `claimFromCandidate` | **Étendre** | `recapNarrativeClaims.js` | Faible→moyen | Unit claims |
| `keepDistinctProofCards` / `selectNarrativeColumns` | **Remplacer progressivement** | `recapCardKinship.js`, `recapAdaptiveInsights.js` | **Élevé** | Corpus multi-horizons |
| `recapEventVoice` | **Étendre** Voice Planner | `recapEventVoice.js` + call sites | Moyen | Fixtures multi-dates / multi-classes |
| Badge / `motifClass` UI | **Corriger** : badge depuis `kind` / family Claim | `RecapAnalyseView` (+ helper) | Faible UI | GTG ≠ Sommeil |
| Trace validator | **Nouveau** | module dédié sous `src/utils/sport/` | Isolable (flag) | Rejeu chiffres |
| Utility selector | **Nouveau** | module dédié | Isolable après noveltyKey | Packs attendus |
| Cross-composer | **Nouveau** | module dédié | Isolable | Cas §5 |
| Benchmark / span stories | **Adapter plus tard** | `recapBenchmark*`, span stories | Moyen | Après kinds pilotes |

### 7.2 Regroupements souhaités

| Aujourd’hui fragmenté | Cible |
| --- | --- |
| Discoveries + milestones + essays qui reformulent le même fait | **Un** Claim, plusieurs renderers possibles |
| Relations training + co-occurrences sleep/GTG implicites | **RelationEdge** unique |
| Kinship blob + claim topic/sense + caps nature | **Utility selector** unique (noveltyKey + U_marginal) |

### 7.3 Changements progressifs sans casser l’existant

1. Detectors produisent encore `title`/`body` **et** un Claim enrichi (dual-write).
2. Introduire `noveltyKey` dans la sélection **avant** de retirer kinship.
3. Brancher Voice Planner sur les leads critiques, puis généraliser.
4. Activer Cross-composer et Trace validator derrière des kinds pilotes.
5. Basculer la prose essays → CardSpec quand les pilotes sont verts.
6. Retirer les chemins morts (double reformulation) en dernier.

---

## 8. Questions ouvertes (audit §H) — état des preuves

Ne pas transformer une hypothèse en fait établi.

| # | Question | Statut | Ce que le code permet d’affirmer | Ce qu’il faut encore inspecter |
| --- | --- | --- | --- | --- |
| 1 | Doublon cartes 11/13 (25k reps) | **Partiel** | Un seul `kind: disc_ms_cumul` dans le moteur ; ids essays = `horizon.kind.stamp` ; `keepDistinctProofCards` fingerprint volume limité + dédup exacte sur blob titre+corps — deux titres / ids pour le même fait peuvent passer ; `selectNarrativeColumns` bloque le même `id`, pas le même fait | Dump runtime `assessment.insights` (`id`, `kind`, `title`, body hash) sur le snapshot 30d des 14 cartes |
| 2 | Couverture Garmin réelle | **Non tranché** | Journey sleep ≈ 90 j. ; associations dépendent de n | Compter nuits appariées sur plusieurs profils ; plafond sommeil = f(n) |
| 3 | Combien de cartes max / priorité pédagogie vs alertes | **Produit** | Caps nature×famille existent ; pas d’utilité marginale | Décider plafond souple + seuil `U_marginal` (reco conception : 3–5, ne pas forcer le plein) |
| 4 | Granularité historique programme / « ajout récent » | **Limité** | `inferAddedDateFromExerciseId` = timestamp dans `ex_<ms>_…` si format match ; sinon 1ʳᵉ trace | Proportion d’ids au format ; champs `createdAt` programme ; ne pas affirmer « ajout récent » sans source fiable |
| 5 | Densité feedbacks difficulté | **Fragile par design** | Carte difficulté dépend des notes présentes | Histogramme n / user ; `minN` avant claim |
| 6 | Exposer fait / interprétation / hypothèse dans l’UI | **Produit** | UI actuelle plate (title/body) | Reco conception : **interne d’abord** ; pastille UI optionnelle ensuite |
| 7 | Budget CPU Claim Graph sur `all` | **À mesurer** | Pipeline déjà riche sur historiques longs | Profiler `period=all` avant/après ; Claims = index, éviter re-scan naïf O(n²) |
| 8 | Second passage runtime multi-users | **Toujours ouvert** | Audit + ce doc = chemin code | Corpus fixtures hors les 30 j. d’un seul auteur |

---

## 9. Architecture cible opérationnelle

### 9.1 Structures de données

Voir §2 (SourceFact, Indicator, Comparison, Interpretation, Hypothesis, UnsupportedConclusion, RelationEdge, Claim, CardSpec, TraceableNumber, TemporalFrame).

### 9.2 Flux de traitement

```text
Sources (snapshot, Garmin, programme, quiz)
    → Fact extractors (réutilisent catalog / GTG / sleep / milestones)
    → Indicator registry (calculs uniques, TraceableNumber)
    → Comparison layer (fenêtres, baselines, comparabilité)
    → Detectors (existants) → Claims + RelationEdges
    → Cross-composer (dossiers multi-signaux, niveau epistemic)
    → Trace validator (chiffres, n, contradictions)
    → Utility selector (pack par horizon / periodVoice)
    → Voice planner + prose composer
    → assessment.insights
```

### 9.3 Responsabilités par composant

| Composant | Responsabilité | Ne fait pas |
| --- | --- | --- |
| Extractors / Indicators | Vérité chiffrée | Raconter |
| Detectors | Proposer des Claims | Sélectionner le pack final |
| Cross-composer | Articuler ; borner l’épistémique | Inventer une causalité |
| Trace validator | Autoriser / refuser la publication chiffrée | Réécrire le style |
| Utility selector | Choisir le pack informatif | Remplir des quotas |
| Voice planner | Bon marqueur temporel | Changer les faits |
| Prose composer | Titre + corps à partir du CardSpec | Recalculer les indicateurs |

### 9.4 Temporalité / sélection / validation

- Temporalité → §3  
- Sélection & déduplication → §6  
- Validation factuelle & mathématique → §4  
- Croisements → §5  

### 9.5 Tests et critères d’acceptation

| Axe | Méthode |
| --- | --- |
| Calculs | Fixtures numériques (gaps, %, shares, décompositions) — rejeu TraceableNumber |
| Dates / voix | Fixtures multi-dates × multi-`eventClass` × multi-horizons |
| Non-invention | Tout chiffre du body ∈ `numbers[]` rejouables |
| Croisements | Cas §5 : conclusions permises présentes, refusées absentes |
| Redondance | Même `noveltyKey` → ≤ 1 carte ; complémentaires conservés si `U_marginal > 0` |
| Titres / motifs | Badge = kind/family, pas regex blob |
| Robustesse | Sans Garmin, sans GTG, 1 séance, historique long `all` |
| Régression | Corpus golden (14 cartes 30d + jeux 7d / 3m / all + ≥1 autre profil) |

**Critère produit global :** à données identiques, pack plus informatif, mieux expliqué, sans conclusions injustifiées — mesuré par la grille §1 + métriques de redondance.

### 9.6 Ordre de mise en œuvre (risque minimal)

| Phase | Contenu | Livrable / critère |
| --- | --- | --- |
| **0 — Instrumentation** | Corpus golden multi-horizons ; dump kinds ; logger candidats droppés | Rejouer le corpus ; base de non-régression |
| **1 — Quick wins sûrs** | `noveltyKey` + plafond cumul ; badge by kind ; Voice Planner flexible sur leads critiques | Plus de doublon 25k type 11/13 ; temporalité OK sur fixtures |
| **2 — Claims + trace** | TraceableNumber + validator sur 5 kinds pilotes (return, cumul, volume_decomp, sleep_assoc, gtg_unplanned) ; dual-write Claim | Tests expected / forbidden claims verts |
| **3 — Cross + utilité** | Cross-composer ; sélecteur `U_marginal` (kinship en filet de secours) | Packs plus informatifs sur corpus 7d / 30d / 3m / all ; pas de fusion auto aveugle |
| **4 — Profondeur** | Décomposition freq×dose généralisée ; trajectoires post-reprise ; affichage n / confiance | Grille §1 ↑ sur cas représentatifs |
| **5 — Optionnel** | LLM polish **uniquement** après claims validés ; reject si drift numérique | Cosmétique contrôlée — **non requis** pour le saut principal |

### 9.7 Risques transverses

| Risque | Mitigation |
| --- | --- |
| Caps / seuils trop agressifs → pages vides (users jeunes) | Plafond souple ; seuil `U_marginal` calibré sur profils pauvres |
| Dual-write essays + claims → double comptage pendant transition | `noveltyKey` dès Phase 1 ; tests de pack |
| Changer la temporalité → snapshots prose cassés | Mettre à jour fixtures voix en même temps que le planner |
| Sur-ingénierie du graphe | Claims mince ; pas de second calculateur ; Indicators uniques |

---

## 10. Principe directeur

> Ne pas optimiser « les 14 cartes 30 jours ».  
> Construire le parcours **données → preuves traçables → conclusions bornées → sélection par utilité marginale → voix temporelle juste**, paramétré par `periodVoice`, pour que **chaque horizon** en hérite.

Le moteur doit devenir **plus intelligent analytiquement** — tirer des conclusions plus riches de l’ensemble des données Momentum — sans ajouter une couche de complexité ou de rédaction qui n’améliore pas l’information utile.

---

## Annexes

### A. Lien avec l’audit

| Section audit | Ce document |
| --- | --- |
| A–D (état des lieux, limites, capacités, 14 cartes) | Prérequis — non rejoués ici |
| E (options) | Orienté **E1/E2 déterministe** ; E3 LLM optionnel Phase 5 |
| F (archi cible initiale) | **Remplacée / précisée** ici, avec corrections A–C |
| G (plan) | Affiné en §9.6 |
| H (questions) | Tranchées autant que le code le permet en §8 |

### B. Fichiers pivots (rappel)

- `src/hooks/useRecapTabMetrics.js`
- `src/utils/sport/recapAdaptiveInsights.js`
- `src/utils/sport/recapInterpretationPipeline.js`
- `src/utils/sport/recapPeriodDiscoveries.js`
- `src/utils/sport/recapMilestoneEngine.js`
- `src/utils/sport/recapHorizonEssays.js`
- `src/utils/sport/recapDiscoveryPeriodScope.js`
- `src/utils/sport/recapEditorialGate.js` / `recapAnalysisDepth.js`
- `src/utils/sport/recapCardKinship.js` / `recapInsightNature.js` / `recapNarrativeClaims.js`
- `src/utils/sport/recapEventVoice.js`
- `src/components/sport/recap/views/RecapAnalyseView.jsx`

### C. Prochaine étape recommandée

Validation produit de **ce** document, puis **Phase 0–1 uniquement** (corpus + noveltyKey/voix/badge) avant tout Claim model large.
