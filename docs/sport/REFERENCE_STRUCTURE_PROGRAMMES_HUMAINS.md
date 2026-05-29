# Référence structurelle — programmes humains (non templates fixes)

> **Usage :** guider les archétypes, le recovery engine et l’arbitrage quiz.  
> **Pas d’usage :** copier mot pour mot exercices / reps / séries.  
> Sources : programmes fournis par l’utilisateur (débutant/inter → avancé street / muscu / hybride).

---

## 1. Principes transversaux (tous niveaux)

| Principe | Observation |
|----------|-------------|
| **Identité de journée** | Chaque jour a un type clair : Street Pull, Maison Push, Cardio EF, Fractionné, Mobilité/récup. |
| **Un modalité dominante / jour** | *Street seul OU maison/home gym OU salle commerciale* le même jour — **jamais** parc + maison ni parc + salle sur une même séance force. |
| **Cardio + force même jour** | Uniquement si quiz `sameDayCardioAddon` ≠ `never` : bloc cardio **en fin** de séance, **même lieu** que possible (course au parc, corde à la maison). |
| **Lieux cohérents** | Parc = tractions / dips / core suspendu ; Maison = pompes / curls / haltères ; Extérieur = course / fractionné. |
| **Blocs dans l’ordre** | Mobilité/activation → travail principal (force/volume) → finisher (core circuit ou tempo pompes) → cardio optionnel *ou* jour cardio séparé. |
| **Core en finisher** | Circuit abdos 3 tours, repos 45 s entre tours — après le travail de force, pas en ouverture. |
| **Repos lourds** | Composés difficiles (tractions, dips, développés) : ~90 s–2 min ; accessoires : 45–75 s. |
| **Cardio EF** | Zone 2, souvent 20–45 min ; **au plus 1× course fondamentale longue / semaine** sur jour dédié (ou en fin de séance street dans certains modèles débutant — à arbitrer par archétype). |
| **Fractionné** | 10–12× (1 min rapide / 1 min lent), 1 jour / semaine, jamais empilé avec gros volume street + plio le même jour si recovery faible. |
| **Dimanche / repos actif** | Mobilité 30–45 min, marche, respiration — pas de séance nerveusement lourde. |
| **Répétition pédagogique** | Mêmes familles reviennent (tractions, dips, pompes) avec variantes — pas 7 jours tous exos différents. |

---

## 2. Patterns de découpage (squelettes)

### A — Hybride 7 jours « débutant/inter » (street + maison + cardio)

| Jour | Modalité | Focus | Lieu |
|------|----------|-------|------|
| Lun | Street | Pull / core / contrôle | Parc |
| Mar | Maison | Biceps / pecs | Maison |
| Mer | Maison ou parc | Push / épaules / triceps | Maison |
| Jeu | Cardio + mobilité | Fractionné OU mobilité thoracique | Extérieur |
| Ven | Street | Pull variante | Parc |
| Sam | Maison | Push / pecs variante | Maison |
| Dim | Maison/salle | Push | Maison |

**Structure séance street (~1h) :**  
mobilité 3 créneaux → 6–8 exos force (tractions, rows, dips, pompes, relevés genoux) → course EF 20 min *ou* circuit abdos 3 tours.

**Structure séance maison (45–55 min) :**  
mobilité → pompes + curls (volume modéré) → gainage.

**Charge :** élevée si tout est activé 7j ; archétype doit **plafonner** si stress/sommeil/débutant.

---

### B — Hybride « règle stricte » (street / muscu / cardio séparés)

| Jour | Type |
|------|------|
| Lun | Street Pull |
| Mar | Muscu maison Push (haltères) |
| Mer | Cardio EF + mobilité |
| Jeu | Street Push |
| Ven | Muscu maison Pull |
| Sam | Fractionné VMA |
| Dim | Récup / mobilité |

**Invariant moteur :** `modalityPerDay = single` — le planner ne doit pas injecter haltères sur un jour `street` ni dips parc sur jour `gym_dumbbells`.

---

### C — Street only (4–5 j / sem)

- Alternance **Pull** / **Push** / **Cardio mobilité** / **Pull grip** / **Push volume** / **Fractionné** / **Repos actif**.
- Peu ou pas d’haltères ; tout passe par barre, parallèles, sol.
- Cardio : 1 jour EF 30–45 min ; fractionné 1 jour.

---

### D — Salle muscu (5 j / sem)

- Split classique : **Push** → **Pull** → **Jambes** → repos actif → **Haut mix** → **Jambes + core** → **Cardio léger**.
- Machines / barres / poulies ; jambes 2×/sem.
- Peu de mobilité planifiée (utilisateur l’a noté) — archétype `gym_hypertrophy` : étirements optionnels légers.

---

### E — Street + maison + cardio + plio (semaine inter)

- Lun street pull, Mar maison push, **Mer cardio + plio** (jamais avec street lourd), Jeu street push, Ven fractionné + plio, Sam full body contrôle maison, Dim cardio long + mobilité.
- **Plio et fractionné** sur jours sans gros pull/push street la veille si possible.

---

### F — Avancé street / hybride

- Séances 1h35–1h45, blocs nommés (Force / Volume / Core avancé / Finisher métabolique).
- Skills (front lever, dragon flags, HSPU progression), grip, beaucoup de séries effectives.
- **Archétype `advanced_street_hybrid`** : recovery capacity haute requise ; sinon downgrade automatique vers pattern C ou B.

---

## 3. Mobilité / étirements (référence)

- **Riche (prog. 1) :** matin + midi + soir, 1–3 min par exercice, liste nommée (respiration, psoas, dead hang, etc.).
- **Léger (prog. muscu) :** échauffement 8–10 min en début de séance seulement.
- **Récup (dimanche) :** deep squat, psoas, legs up the wall, respiration 4-7-8.

**Moteur :** `dailyStretchMinutesBudget` + `stretchDistribution` décident du pattern riche vs léger — pas la copie des listes exactes (`pickQuizStretchesForMoment` reste génératif).

---

## 4. Garde-fous dérivés (recovery / adhérence)

| Signal quiz / profil | Action archétype |
|----------------------|------------------|
| Débutant + stress/sommeil bas | Passer de pattern A (7j) à B ou C (4–5j), supprimer course en fin de street + fractionné même semaine |
| `15_30` min | Pattern « busy » : 4–5 exos, pas circuit 3 tours + EF 20 min |
| Pas de barre traction | Pas de jour « Street Pull » pur → maison push/pull au poids du corps |
| Cardio `minimal` | Pas fractionné ; EF courte 1× ou marche |
| Cardio `priority_hiit` | 1 jour fractionné, pas 2 ; pas plio + fractionné + street lourd |
| `sameDayCardioAddon` ≠ never | Exception *contrôlée* : finisher cardio léger, pas EF 35 min après 8 exos street |

---

## 5. Mapping archétypes ↔ patterns (brouillon implémentation)

| Archétype ID | Pattern de référence | Philosophie |
|--------------|----------------------|-------------|
| `hybrid_street_home_strict` | B, E | Séparation modalité / jour, adhérence réaliste |
| `hybrid_street_home_dense` | A | Volume élevé — seulement si recovery OK |
| `street_intermediate` | C | Force relative, répétition pull/push |
| `gym_hypertrophy_5d` | D | Surcharge, jambes, peu mobilité |
| `busy_minimum` | Sous-ensemble C ou B | 3–4 j, exos classiques, peu cardio |
| `recovery_sensitive` | B sans Sam fractionné + Dim mobilité | Charge basse |
| `advanced_street_volume` | F | Plafonds hauts, sinon refus auto |
| `endurance_hybrid` | Mer/Dim cardio + 2× force | EF prioritaire |

Chaque archétype exporte :

```js
{
  id,
  philosophy: string[],
  weeklyPattern: { dayIndex: { modality, focus, siteHint } }, // schéma, pas exos
  constraints: {
    singleModalityPerDay: boolean,
    maxDedicatedCardioDays: number,
    maxFractionatedDays: number,
    allowEnduranceAfterStreet: boolean,
    maxExercisesPerStrengthSession: number,
    allowPlyoSameDayAsHeavyStreet: boolean,
    coreFinisherRounds: number
  },
  whyThisTemplate: string[]
}
```

---

## 6. Ce qu’on ne fige pas

- Noms d’exercices précis (curl Zottman vs marteau) — scoring banque + équipement.
- Reps exactes (4×4-6 vs 5×5-8) — baselines + tier + objectif.
- Listes mobilité mot pour mot — budget temps + zones prioritaires.
- 7 jours obligatoires — `availableTrainingDays` + adherence engine.

---

## 7. Lien code (à implémenter)

1. `resolveProgramArchetype(answers)` choisit un pattern (section 5).
2. `planWeekSessionProfiles` lit `modality` / `focus` / `singleModalityPerDay` depuis l’archétype.
3. `injectQuizExercisePlan` filtre templates par `modality` du jour (déjà partiel — renforcer interdiction street+muscu).
4. Recovery engine coupe plio / fractionné / addons si charge > capacité.
5. UI : `whyThisTemplate` + éventuellement « Structure inspirée d’un split street/maison/cardio séparé ».

*Dernière mise à jour : références utilisateur intégrées avant implémentation `quizArchetype.js`.*
