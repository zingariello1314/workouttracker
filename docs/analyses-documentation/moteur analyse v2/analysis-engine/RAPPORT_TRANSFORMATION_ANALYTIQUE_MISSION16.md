# Mission 16 — Rapport de transformation analytique

Édition : `p6-sovereign-v15`. Baseline : `p6-sovereign-v14`. Aucun commit.

---

## LIVRAISON 1 — Le programme comme source d’explication

### 1. Problème de départ
Une carte pouvait décrire des variantes de programme, tandis qu’une autre annonçait un recul des pompes déclinées sans vérifier la variante réalisée. `rewriteTrajectoryWithPrescriptions` ajoutait seulement un paragraphe (« Sans appariement… »). `applySlotMatchToTrajectory` n’avait **aucun appelant**.

### 2. Cause racine
Le contexte programme n’altérait ni la thèse, ni la catégorie, ni la décision de publication. Aucune décomposition mélange vs évolution intra-variante.

### 3. Données disponibles
Programme utilisateur : variantes A (`3×12` = 36) et B (`5×10` = 50) pour pompes déclinées ; séances réalisées avec volumes proches de ces prescriptions.

### 4. Relation nouvellement exploitée
Appariement réalisation → prescription par proximité de volume ; part de chaque variante avant/après une date de coupure ; thèse `variant_mix_shift` si la moyenne globale bouge alors que les moyennes par variante restent stables.

### 5. Raisonnement produit
Si le mélange bascule vers la variante à 36 reps tandis que chaque variante reste conforme à sa prescription, la baisse de moyenne n’est pas un recul de capacité.

### 6. Ancien texte (type v14 / avant correction)
> Pompes déclinées: volume par séance en baisse  
> Le volume moyen passe de 50 à 36 répétitions. Recul apparent de capacité.

### 7. Nouveau texte (pack synthétique Mission 16)
> Pompes déclinées : le mélange de variantes explique la moyenne  
> La baisse de moyenne ne traduit pas un recul de capacité sur chaque variante. La moyenne globale passe d’environ 50 à 36 répétitions (−28 %). Les volumes individuels restent stables ; c’est la répartition entre variantes prescrites qui change. …

### 8. Faits justifiant
- Prescriptions : 36 et 50 reps.  
- Sessions avant : 50, 50, 50. Après : 36, 36, 36.  
- `thesis=variant_mix_shift`, `composition=program_variant_mix_explains`.

### 9. Contre-exemples (PASS)
- Mélange stable + baisse dans les deux variantes → `within_variant_decline`.  
- Volumes hors prescriptions → `unknown_variant` (pas de thèse forcée).

### 10–12. Disposition / accessibilité / limites
Wiring dans `detectDiscoveries` via `annotateTrajectoryWithProgramContext(..., { sessions, realizedSession })`. Limite : appariement par proximité de volume si la composition de séance n’est pas fournie ; rejeu user non observé.

---

## LIVRAISON 2 — Reprise collective

### 1. Problème
JSON v14 : 0 `disc_collective_return`, 0 candidats. Pourtant Face pull, Élévations latérales, Développé Arnold, Kickbacks, Extensions, Pompes pseudo-planche partagent le 18 novembre et des mécanismes `resumed_former_level` / `partial_resume`.

### 2. Cause racine (premier point de rupture)
`runExerciseFormatConsolidationShadow` calcule `reading.gap = { days, before, after }` (≥ 21 j).  
`detectDiscoveries` poussait `disc_format_consolidation` **sans** copier `gapDays` / `returnDate` dans `metrics`.  
`returnEvents` filtrait ensuite `.filter(row => row.date && Number(row.gapDays) >= 7)` → **ensemble vide** → aucun collectif.

Ce n’est pas un problème de seuil d’éligibilité ni de score.

### 3. Données (export v14)
| Mouvement | Mécanisme 7j | Date évidence |
|-----------|--------------|---------------|
| Face pull | resumed_former_level | 2026-11-18 |
| Élévations latérales | resumed_former_level | 2026-11-18 |
| Développé Arnold | resumed_former_level | 2026-11-18 |
| Kickbacks / Extension | partial_resume | 2026-11-18 |
| Pompes pseudo-planche | resumed_former_level | 2026-11-18 |

### 4–5. Relation / raisonnement
Propagation de `gapDays`, `returnDate`, `prevReps`, `currentReps`, `exerciseName` ; composition collective avec formats complets/incomplets et confirmation sur séances ultérieures.

### 6. Ancien texte
Cartes individuelles seulement, ex. :  
> Face pull: un ancien niveau est retrouvé  
> Sur ces 7 jours, face pull retrouve un ancien niveau autour de 60 répétitions…

Aucune carte : « Une composante de ton entraînement se réinstalle… »

### 7. Nouveau texte (pack synthétique aligné mi-novembre)
> Une composante de ton entraînement se réinstalle autour du 2026-11-18 : Face pull, Élévations latérales, Développé Arnold, Kickbacks triceps, Extension triceps… Les interruptions documentées vont de 28 à 28 jours. N mouvements retrouvent un volume proche… M restent en retrait… Les séances ultérieures permettent de distinguer une reprise ponctuelle d’une réinstallation progressive.

### 8–9. Faits / contre-exemples
Simultanéité sans famille musculaire ni famille de séances → `UNDER_EXPLORED` (conservé).

### 10–12. Limites
Live utilisateur à rejouer. `slimCard` conserve désormais gap/épisode pour l’audit. Seuil `gapInside` reste ≥ 21 j (non abaissé artificiellement).

---

## LIVRAISON 3 — Adhérence

Module `multidimensionalAdherence` + `structuralProgramDiscoveries` déjà capables de distinguer 40 % volume ≠ 66 % groupes. Mission 16 n’a pas ajouté de packs synthétiques versionnés complets au-delà de l’existant (missions 7–9). **À compléter** pour exceptionnel / récurrent / substitution / baisse uniforme via pipeline complet.

---

## LIVRAISONS 4–7

Non bouclées verticalement dans cette session. Mécanisme de redondance pic/concentration renforcé (`same_peak_concentration_day`). Sommeil, temporalité longue, mémoire : inchangés côté preuve live.

---

## Corrections techniques (9.x)

| Item | Action |
|------|--------|
| Collision faits `disc_th_*\|totalReps\||||` | Sujet = exercice/jour/période ; fenêtre obligatoire ; refus si bornes absentes |
| slimCard | Conserve exerciseId, gapDays, dates, thesis, composition |
| Édition | v15 + programReasoning + collectiveReturn |
| Mission labels export | Mission 16 |

---

## Synthèse honnête

La Mission 16 **casse la reproduction** du pattern Mission 15 (infra sans récit) sur deux chaînes critiques. Elle ne déclare pas P6 candidate tant que les textes publiés du pack utilisateur n’ont pas été comparés snapshot-identique.
