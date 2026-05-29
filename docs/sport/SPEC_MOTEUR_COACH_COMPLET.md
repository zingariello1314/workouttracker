# Spec moteur coach — Volume, fatigue, archétypes, génération

Document de référence unique pour l’implémentation **Phase A → C**.  
Complète : `ETAT_DES_LIEUX_MOTEUR_QUIZ.md`, `REFERENCE_STRUCTURE_PROGRAMMES_HUMAINS.md`, `QUIZ_PROFIL_IMPACT_PROGRAMMES.md`.

---

## 1. Verdict produit (inchangé)

**Pipeline actuel :** bon assembleur contraint (`quiz → règles → planners → détails`).

**Cible :** couche de **stratégie** au-dessus :

```
Quiz
  → quizConstraintResolver (hiérarchie + conflits)
  → quizArchetype (squelette invisible + philosophy + why)
  → quizRecoveryEngine (charge hebdo vs capacité)
  → quizAdherenceEngine (réalisme / downgrade)
  → planners existants (détails, un lieu/jour — quizSitePolicy)
  → quizProgression (semaines cycle)
  → quizGenerationMeta sur le programme + Récap
```

**Piège à éviter :** archétypes qui **additionnent** les préférences ; ils doivent **plafonner / couper** les contradictions.

**Nature du moteur (vision produit) :** génération adaptative de **charge sportive multi-modale**, avec 4 couches :

| Couche | Rôle |
|--------|------|
| Physiologique | volume, fatigue nerveuse + tendineuse, caps dynamiques |
| Comportementale | adhérence, fréquence réaliste, stabilité des modes |
| Structurelle | archétypes = **déformateurs**, planners libres |
| UX | sortie simple ; logique complexe **interne uniquement** |

---

## 2. Hiérarchie des contraintes (arbitrage)

| Priorité | Type | Exemples quiz |
|----------|------|----------------|
| 1 | **Faisabilité** | `trainingLocation`, `availableEquipment`, `availableTrainingDays` |
| 2 | **Récupération** | `sleepQuality`, `stressLevel`, `experienceLevel` |
| 3 | **Adhérence** | `preferredSessionDuration`, `weeklyTrainingFrequencyCurrent` vs jours cochés |
| 4 | **Objectif** | `goalPhysique`, `currentPhysique`, `bodyFatPercentEstimate` |
| 5 | **Préférences** | `circuitTrainingStyle`, `cardioTrainingDesire`, `exerciseTypePreferences`, `triedTrainingStyles` |

**Sortie resolver :** `resolvedProfile` avec flags du type `suppressPlyo`, `capCardioDays`, `maxActiveDays`, `generationMode`.

---

## 3. Modes de génération (dominant par semaine)

| Mode | ID | Quand | Effet |
|------|-----|-------|-------|
| Équilibré | `balanced` | Défaut inter, récup OK | Volume médian, progression stable |
| Performance hybride | `performance_hybrid` | Street+maison+cardio, stress bas, motivation/ freq haute, **réf. programme utilisateur** | Volume élevé toléré, variété street/maison/cardio — **fragile si récup baisse** |
| Récupération | `recovery` | Sommeil/stress mauvais, surcharge détectée | −20 à 40 % volume, cardio Z2, pas fractionné lourd |
| Minimal | `minimal_viable` | Adhérence risk critique | 3–4 j, exos classiques, répétabilité |

Le programme exemple 7j débutant/inter calibre un **plafond haut** du mode `performance_hybrid` — pas un calendrier figé.

### 3.1 Stabilité des modes (anti-oscillation)

- Le mode est fixé **à la génération** du programme (cycle entier), pas recalculé chaque jour.
- Changement de mode seulement sur : **nouvelle génération**, **regénération explicite**, ou **signal fort** (Phase C : 2 semaines ratées + stagnation repères).
- Éviter : lundi `performance_hybrid`, mercredi `recovery` sans action utilisateur → sensation de chaos.

---

## 4. Archétypes = déformateurs de génération (PAS des semaines types)

### 4.1 Principe

| ❌ Mauvais (template) | ✅ Bon (déformateur) |
|----------------------|----------------------|
| `street_intermediate` = lundi pull, mardi push… | `street_intermediate` = priorité tirage, tolérance volume modérée, **2 j heavy max / sem**, séparation modalités |
| Liste d’exos figée | **Multiplicateurs / plafonds** passés aux planners |
| Calendrier copié | `planWeekSessionProfiles` + `quizExercisePlanner` **restent libres** (jours quiz, lieu, matériel) |

L’archétype exporte des **coefficients et limites**, pas un `schedule` prêt à coller.

### 4.2 Définitions (6–8 profils)

| ID | Déformations (résumé) — **pas** de jours imposés |
|----|--------------------------------------------------|
| `hybrid_street_home_strict` | `singleModalityPerDay: true`, rotation familles lieux, cardio dédié ou addon selon quiz |
| `hybrid_street_home_dense` | Plafond jours actifs haut **si** recovery OK ; +finisher core ; cap tendon street |
| `street_intermediate` | Boost pull/push alternance ; `maxPullPatternsPerSession: 3` ; 2 heavy days/week |
| `gym_hypertrophy_5d` | Boost composés salle ; caps isolés ; **désactivé** si profil street+cardio dominant |
| `busy_minimum` | `exerciseCountMul: 0.75`, `maxActiveDays: 4`, pas fractionné |
| `recovery_sensitive` | `volumeMul: 0.7`, `suppressPlyo: true`, `maxNervousDays: 1` |
| `endurance_hybrid` | `minCardioDays: 2`, force maintenance 2–3j |
| `advanced_street_volume` | Plafonds hauts + **tendon budget** strict ; downgrade auto si quiz débutant |

### 4.3 Objet archétype (implémentation)

```ts
{
  id,
  generationMode,           // interne
  philosophy: string[],     // pour why (langage humain)
  deformers: {
    volumeMul: number,              // 0.7 – 1.15
    maxActiveDaysCap: number | null,
    maxDedicatedCardioDays: number | null,
    maxHeavyBlocksPerSession: number,
    maxExercisesPerSession: number,
    maxNervousStressDaysPerWeek: number,
    maxPullingPatternsPerSession: number,
    allowPlyo: boolean,
    allowFractionné: boolean,
    allowSameDayCardioAddon: boolean | 'from_quiz',
    singleModalityPerDay: boolean,
    siteFamilyRotation: 'strict' | 'relaxed',
    preferredGroupWeights: { upper, lower, core, cardio }, // bias planners
  },
  avoidPatterns: string[],  // §5
  whyThisTemplate: string[] // 2–4 phrases, pas de jargon
}
```

**Les planners lisent `deformers`** ; ils décident quels jours sont pull/push selon `availableTrainingDays` + rotation muscles existante.

---

## 5. Archétypes / patterns à **éviter** (forcer = casse résultats)

| À éviter | Pour qui surtout | Action moteur |
|----------|------------------|---------------|
| Bodybuilder rigide 5–6j salle, 18–25 séries/muscle | Profil street+cardio+maison | Ne pas sélectionner `gym_hypertrophy_5d` ; cap séries isolées |
| Performance pur sans jours faciles | Si stress/sommeil mauvais | Downgrade vers `balanced` ou `recovery` |
| Sous-stimulé 2–3 exos | Freq déclarée 5–6j, objectif musclé | Ne pas `minimal_viable` sauf adherence risk max |
| Tout mélangé sans fatigue | Toujours | Recovery engine obligatoire |

**Performance hybride** : autorisé **si** `recoveryCapacity` suffisant (stress faible, sommeil OK, exp inter+). Sinon → `balanced` + warnings.

---

## 6. Physiologie & limites — à coder dans `quizRecoveryEngine` + planners

### 6.1 Caps de volume **dynamiques** (pas des constantes fixes)

**Formule type (dos / tirage) :**

```
base = 14  // inter, groupe large
cap = base
  * recoveryMultiplier     // 0.72 (low) … 1.15 (high) depuis quiz + futur historique
  * frequencyMultiplier    // < 3 j/sem → 0.9 ; 5–6 j → 1.05 max
  * overlapPenalty         // si pecs + triceps + dips lourds même semaine → -10 à -20 % sur pull cap
cap = clamp(cap, floor, ceiling)  // ex. floor 8, ceiling 20 inter
```

| Groupe | Base inter | Floor | Ceiling inter | Notes |
|--------|------------|-------|---------------|-------|
| Dos / tirage | 14 | 8 | 18 | tendons souvent limitants avant muscles |
| Poussée | 14 | 8 | 20 | overlap dips + pompes + développé |
| Jambes | 14 | 10 | 18 | récup lente |
| Core | 8 | 4 | 12 | |

Les tableaux « 10–16 séries » du doc initial = **valeurs de calibration**, pas des constantes hardcodées.

### 6.2 Fatigue tendineuse / impact street (variable critique)

Souvent **le vrai plafond** avant le SNC ou le volume musculaire.

**`tendonLoadScore`** (hebdo, 0–100) cumulé par :

| Pattern | Charge tendon | Zones |
|---------|---------------|--------|
| Tractions pronation / chin-ups lourds | +3 / séance effective | coude, épaule |
| Dips lourds | +3 | coude, sternum |
| Pompes déclinées / pseudo-planche volume | +2 | épaule ant. |
| Fractionné | +1 (impact genou/cheville) | jambes |
| Pliométrie jambes | +2 | genou |

**Règles :**

- Si `tendonLoadScore` > `tendonBudget` → couper en priorité : volume dips/tractions **le même jour**, pas ajouter un 4ᵉ pattern tirage.
- Profil street dominant → `tendonBudget` plus bas si `experienceLevel` débutant ou `flexibilityLevel` raide.
- Espacer **2 jours** entre séances à fort score tendon (pull street lourd ↔ push dips lourd).

Module : `quizTendonLoad.js` (ou section `quizRecoveryEngine`).

### 6.3 Volume hebdo — rappel calibration

### 6.4 Limites par séance (street / maison)

| Règle | Valeur |
|-------|--------|
| Exercices principaux | 4–6 max |
| Accessoires | 2 max |
| Finisher (circuit core) | 1 optionnel |
| **Total blocs** | 6–8 max |
| Blocs **heavy** / séance | max **2** |
| Séries totales séance | ~≤ 25 effectives |
| Durée cible | respecter `preferredSessionDuration` (+ addon cardio si quiz) |

**Street :** jamais 5 exercices de tirage même séance.

### 6.5 Stress nerveux (budget hebdo)

| Stimulus | Score fatigue (implémentation) | Plafond typique |
|----------|-------------------------------|-----------------|
| Séance force lourde | +3 | — |
| Fractionné / HIIT | +4 | 1–2 / sem |
| Pliométrie | +3 | 2 / sem |
| Circuit métabolique | +2 | selon archétype |
| Course EF longue | +2 | 2–4 / sem si cardio important |
| Mauvais sommeil | recovery −2 | — |
| Stress élevé | recovery −3 | — |

**Règle d’or :** *1 stress nerveux fort par jour max* (fractionné **ou** street dos lourd **ou** plyo jambes lourdes — pas les trois).

**Combinaisons interdites / à couper auto :**

- Fractionné + jambes lourdes lendemain (espacer)
- Plyo + street pull intense même jour (couper plyo)
- Fractionné + plyo + addons + 5j force si recovery bas

**Cardio EF** peut suivre upper (même jour si `sameDayCardioAddon`) — **même lieu** (`quizSitePolicy`).

### 6.6 Progression (Phase B — `quizProgression`)

- Réussite haut de fourchette → +1 rep puis +1 série (cap baseline).
- 2 séances ratées → −20 % volume semaine suivante (metadata).
- Street : progression reps → amplitude → tempo → variante → lest.
- Semaines cycle : S1–2 @ 80 %, S3–5 @ 100 %, S6 deload (metadata programme).

### 6.7 Ajustements automatiques (signaux futurs + quiz)

| Signal | Action |
|--------|--------|
| Fatigue élevée (quiz stress/sommeil) | −plyo, −20–30 % séries, garder Z2 |
| Stagnation (repères max / historique) | reps/tempo, pas +volume direct |
| Motivation basse (à terme historique) | simplifier, répétabilité |

---

## 7. Questionnaire → programme (mapping enrichi)

Exemple profil type (musclé+défini, débutant→inter, cardio important, street+maison+piste, 5–6j, souplesse faible, stress faible) :

| Interprétation algo | Action |
|---------------------|--------|
| Priorité street + force relative | Archétype `hybrid_*`, rotation pull/push |
| Cardio 2×/sem min | `dedicatedCardioDays` ≥ 2 si désir modéré+ |
| Mobilité quotidienne | `dailyStretchMinutesBudget` + `stretchDistribution` |
| Pas split BB pur | Éviter `gym_hypertrophy_5d` seul |
| Mode performance possible | `performance_hybrid` si recovery capacity OK |

---

## 8. UX : sortie « idiote mais stable » vs logique interne

### 8.1 Ce que l’utilisateur voit

```
Lundi — Street workout
Durée : ~1 h · Dos / core · Parc
→ liste d’exos lisible
```

**Jamais en vue principale :** `performance_hybrid`, `fatigueScore 0.72`, `tendonLoad 81`, `suppression plyo`.

### 8.2 Où vit la complexité

| Surface | Contenu |
|---------|---------|
| **Jour / séance** (Programme, Aujourd’hui) | Titre, focus, lieu, exos — **seul livrable opérationnel** |
| **Génération programme** (1×) | Encart court : 2–3 phrases `whyThisTemplate` + éventuel « structure adaptée à ta récupération » |
| **Récap** (optionnel) | Même why + 1 suggestion si downgrade (ex. « 6 j demandés → 4 j retenus pour tenir 8 semaines ») |
| **`quizGenerationMeta`** (JSON programme) | archetypeId, scores, warnings — **debug / futur coach**, pas UI principale |

### 8.3 Séparation moteur / affichage

- **`quizProgramPresentation.js`** : traduit `weekProfiles` + exercices → texte humain.
- **Moteur** : ne formate pas l’UI ; exporte des structs.
- **`whyThisTemplate`** : phrases en français naturel, zéro identifiant technique.

### 8.4 Règles d’affichage compact

| Bloc | Contenu |
|------|---------|
| 1 | Durée, focus, lieu |
| 2 | Mobilité matin/midi/soir (résumé si > 6 items) |
| 3 | Exos une ligne : séries · repos · intensité |
| 4 | Cardio en fin |
| 5 | Circuit |

> 8 exos → regrouper push / pull / core.

---

## 9. Calibration : programme référence 7j (utilisateur)

Sert à valider **`performance_hybrid`** / **`hybrid_street_home_dense`** :

- Lun/Ven street pull+core + circuit abdos (+ EF 20 min si addon autorisé)
- Mar/Sam/Dim maison push/biceps
- Mer push épaules/triceps (+ EF si addon)
- Jeu fractionné + mobilité (jour nerveux seul)
- Mobilité 3×/jour quand budget étirements élevé
- **Jamais** street + muscu maison même jour (familles `quizSitePolicy`)

**Écarts autorisés moteur :** exos précis (banque), reps via baselines, nb jours si adherence/recovery coupe.

---

## 10. Implémentation — fichiers & responsabilités

| Module | Contenu de CE document |
|--------|-------------------------|
| `quizConstraintResolver.js` | §2, §5, §7 |
| `quizArchetype.js` | §4, §5, §6 modes, §9 calibration |
| `quizRecoveryEngine.js` | §6.5 SNC + §6.1 caps dynamiques |
| `quizTendonLoad.js` | §6.2 fatigue tendineuse street |
| `quizAdherenceEngine.js` | §3 minimal, freq vs jours |
| `quizProgression.js` | §6.6 |
| `quizSessionPlanner.js` | lit `deformers` archétype |
| `quizExercisePlanner.js` | §6.4 caps exos, caps dynamiques groupe |
| `quizCircuitPlanner.js` / plyo / drills | §6.3 plafonds |
| `quizProgramPresentation.js` | §8 |
| `recapDeepInsights.js` | why + mode + warnings |

---

## 11. Critères d’acceptation (profil type + contradictoire)

**Profil performance (comme spec utilisateur) :**

- [ ] 5–6 j actifs, alternance street / maison, fractionné 1×, EF possible
- [ ] Séances street ≤ 8 blocs, ≤ 2 heavy, pas 5 tirages
- [ ] `why` mentionne street + cardio + adhérence à la fréquence

**Profil toxique (bulk + HIIT max + débutant + stress + 6j) :**

- [ ] ≤ 4 j, pas plio+fractionné+addons, mode `recovery` ou `balanced`
- [ ] Warnings explicites dans meta

---

## 12. Synthèse des affinements (revue produit)

| Feedback | Intégration spec |
|----------|------------------|
| Archétypes ≠ templates semaine | §4 déformateurs + planners libres |
| Fatigue tendineuse | §6.2 `tendonLoadScore` / budget |
| Caps dynamiques | §6.1 multipliers recovery / freq / overlap |
| Stabilité modes | §3.1 fixés par cycle |
| UX simple | §8 sortie idiote, meta interne |
| Risque sur-complexité perçue | why court ; pas de scores en UI principale |

---

*État d’implémentation : voir [`ETAT_DES_LIEUX_MOTEUR_QUIZ.md`](ETAT_DES_LIEUX_MOTEUR_QUIZ.md). **v5** : `globalLoadFactor` + canaux orthogonaux + `quizShadowValidation` (contradictions, bande live dynamique).*
