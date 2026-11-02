# F4.1 — Correctifs de cohérence (avant validation F4)  
**2026-11-01** — Aucun commit. E0 / F5 non touchés. Live : **non inspecté**.

## Verdict

Les contradictions titre↔corps du replay F4 initial sont corrigées à la source (`resolveVolumeDirection` unique pour titre et observation). Les mécanismes d’attribution affichent désormais leurs preuves (ex. 1→3 séances). Les formats stables ne sont plus présentés comme « 3×20 comme 3×20 ». Les constats F3 riches (creux daté, dernière séance) sont préservés quand pertinents.

**Indicateur retenu :** pas seulement `compositionUsedInText`, mais `narrationCoherentVerified` (absence d’incohérence dure titre/valeurs/attribution/témoins).

| Période | Composée | Narrée | Cohérente (hard OK) |
| --- | --- | --- | --- |
| 7d | 3 | 3 | **3** |
| 30d | 7 | 7 | **7** |
| 3m | 5 | 5 | **5** |
| 6m | 5 | 5 | **5** |

Kinds selected : inchangés vs F4/F3.

---

## Anomalies du replay F4 initial → cause → correctif → après

### A1 — Dips 6m : titre « recul » + corps +20 %

- **Cause :** titre piloté par `primaryStory: net_decline` alors que l’observation utilisait first→last d’arc (40→48), divergents des moyennes early/late shape.
- **Correctif :** `resolveVolumeDirection` (earlyMean/lateMean) impose la direction du titre ; si story decline mais dir=up → titre de hausse.
- **Après :** « Dips : recul confirmé… » avec **42,3 → 34 (−19,7 %)** — aligné. (L’autre carte Dips reste « volume stable » à 48.)

### A2 — « total monte parce que plus souvent » sans fréquences

- **Cause :** titre depuis `volumeAttribution.kind` sans exiger `metrics` ni les écrire dans le corps.
- **Correctif :** titre seulement si `prevSessionCount`/`windowSessionCount` ; mécanisme « Tu es passé de N à M séances… ».
- **Après (30d Relevés) :** titre fréquence + corps « de 1 à 3 séances… volume par séance reste proche ».

### A3 — 34→45 avec format « 3×15 comme 3×15 »

- **Cause :** juxtaposition moyenne / schéma sans distinction.
- **Correctif :** si format stable et moyenne qui bouge → phrase explicite ; si format identique sans valeur ajoutée → omettre ou « format resté identique (N×M) ».
- **Après :** plus de « comme 3×15 » tautologique.

### A4 — Perte de chronologie creux/reprise F3

- **Cause :** F4 régénérait une observation first→last plate, écrasant le constat principal.
- **Correctif :** si `decline_then_recovery` / texte main avec creux → conserver le constat F3 structuré.
- **Après :** creux ≈10 (1 octobre 2026), dernière séance ≈36, moyenne d’arc nuancée.

### A5 — Français / jargon

- **Cause :** « revient » sur pluriels ; décimales `.` ; phrase « fenêtre sélectionnée / ne remplace pas la période ».
- **Correctif :** accords `reviennent` ; `formatFrNumber` + polish `53,3` ; historique → « séances antérieures pour situer » ; polish « période affichée ».
- **Après :** titres pluriels corrigés ; décimales FR sur volumes.

### A6 — « un mouvement »

- **Cause :** identité non résolue en amont (map / id).
- **Correctif partiel :** résolution renforcée via `resolveExerciseNameForRecap` ; signal soft `unresolved_exercise_name` (n’invalide pas hard).
- **Restant :** plusieurs cartes 30d/3m restent « un mouvement » — à traiter côté producteurs / map (hors retune E0).

---

## Tests F4.1

Fichier : `recapComposedNarration.f41.test.js` (+ non-régression F4).

| Contrôle | Statut |
| --- | --- |
| Titre baisse vs chiffres hausse (Dips) | OK |
| Titre hausse vs chiffres baisse | OK |
| Fréquence avec comptes dans le corps | OK |
| Fréquence sans métriques → pas de titre | OK |
| Moyenne vs format stable clarifié | OK |
| Décimales FR / pluriels / pas de jargon hard | OK |
| Préservation creux daté | OK |

**20/20** verts (9 F4.1 + 11 F4).

---

## Exemples textes complets (post-F4.1)

### 6m — Dips (ex-contradiction)

**Titre :** Dips : recul confirmé sur plusieurs séances  

**Corps :** Sur 19 séances, le volume moyen de répétitions enregistré pour Dips passe d’environ 42,3 à 34 répétitions par séance, soit une baisse d’environ 19,7 %. Sur les séances où les séries sont détaillées, le format reste identique (4 × 12) : l’évolution du volume moyen par séance ne vient donc pas d’un changement de schéma séries × reps sur ces séances documentées. Plusieurs mouvements comparables évoluent dans le même sens : le signal dépasse cet exercice seul, sans prouver une cause unique.

### 30d — Attribution fréquence

**Titre :** Relevés de genoux à la barre : le total monte surtout parce que tu t’entraînes plus souvent  

**Corps :** Relevés de genoux à la barre : Réapparition après 35 jours. Tu es passé de 1 à 3 séances sur la période comparable, alors que le volume par séance reste proche. Le volume par séance reste récemment stable.

### 30d — Pompes déclinées (mécanisme)

**Titre :** Pompes déclinées : moins de répétitions par séance  

**Corps :** Sur 6 séances, le volume moyen … 53,3 à 40 … (−25 %). Le nombre de séries reste proche de 4 ; la diminution vient surtout des répétitions par série (environ 15 → 10). …

---

## Contradictions / limites restantes

1. **« un mouvement »** encore affiché (soft) — résolution d’identité incomplete sur certains ids fixture.
2. Formulations F3 héritées peuvent encore mentionner « période affichée » / arc technique — polish partiel.
3. Deux cartes Dips sur 6m (recul vs stable) : phénomènes sur sous-ensembles différents — pas une contradiction interne à une carte ; rivalité → **F5**.
4. Profil live : non inspecté.
5. E0 non modifié : cartes superficielles toujours sélectionnées.

---

## Fichiers touchés

- `recapComposedNarration.js` (réécriture F4.1)
- `recapEditorialPolish.js` (décimales, pluriels, jargon fenêtre)
- `recapComposedNarration.f41.test.js` (nouveau)
- `scripts/f4-replay-periods.mjs` (compteurs cohérence)
- fixtures `f4-replay-*.json` régénérés

**Arrêt pour validation humaine. Pas de F5. Pas de commit.**
