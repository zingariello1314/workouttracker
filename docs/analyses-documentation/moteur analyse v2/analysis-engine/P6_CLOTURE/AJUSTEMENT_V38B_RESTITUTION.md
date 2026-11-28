# Ajustement ciblé restitution v38 → v38b

**Édition :** `p6-sovereign-v38b`  
**P6 clôturée · NO-GO P7 · aucun commit · pas de nouvelle campagne d’audit**

---

## A. Pourquoi `week_structural_context_not_priority` ne changeait pas le classement publié

**Verdict :** la règle **était appliquée** (baisse d’IV −14 réelle), mais **deux mécanismes aval** empêchaient tout changement d’ordre visible.

1. **Colonne UI** — Sur 7 j, `disc_session_family_*` était publié en `nature: 'now'` → colonne `shortTerm`. La concentration est en `trajectory` → `mediumTerm`. L’UI aplatit short puis medium : structure/variantes restaient **devant** même avec une IV inférieure.
2. **Sélection collective** — `applyP6` recevait le pool `all` **sans** `informativeValue` éditoriale ; `horizonBoost(+14)` sur `session_family` **annulait** le −14.

Ce n’était **pas** une règle morte : baisse de score sans changement d’ordre (plus reboost + colonne).

**Correctifs (sans forcer une catégorie en #1) :**
- Structure/variantes 7 j → `nature: 'trajectory'` (reste au catalogue).
- Propagation IV E0 → P6.
- Plus de reboost `horizonBoost` pour `programmed_structure` / `session_family` sur week.
- Bonus ancrage fenêtre pour concentration relative (+10).

---

## B. Graphiques

| Parcours | Changement |
|---|---|
| Concentration | Fractions `124/372` et `347/5730` + populations visibles (note + label barre). |
| Hyperextension | Trajectoire inchangée ; prudence non répétée (continuity/limit séries coupés si constat déjà prudent). |

---

## C. Volume 30 j (freq/contenu)

- Signes déjà corrects (+freq / −contenu / net+).
- Bornes exposées depuis le moteur : `labelBefore` / `labelAfter` (`les 30 jours d'avant` ↔ `ces 30 jours`), `prevWindow` / `recentWindow`, `comparisonWindows`.
- Note UI affiche ces libellés + réconciliation signée.

---

## D. `nameMapSize` 119 vs 0

- Export **8 périodes** : assemblage live avec `nameMap` / `exerciseNameMap` passé au fingerprint → **119**.
- **ANALYTICAL_AUDIT** : `snapshotFingerprint(snapshot, { activeProgram })` **sans** nameMap → **0**.
- Contextes d’assemblage différents ; **pas** d’égalité forcée (empreintes volontairement non alignées).

---

## Tests code

| Suite | Résultat |
|---|---|
| `postP6V38RankingFix` | PASS (7) |
| `postP6V38RecipeIntegration` | PASS (6) |
| `postP6EditorialRestitution` | PASS (5) |
| `AnalysisVisualInsight.recipe` | PASS (4) |
| mission7 / mission8 | PASS |

## À confirmer dans Chrome (non exécuté ici)

1. 7 j : ordre — phénomènes ancrés fenêtre avant structure programme (structure encore accessible).
2. Concentration : fractions + populations visibles sans tooltip.
3. Hyperextension : courbe 48…24 ; résumé sans double prudence.
4. 30 j volume : note avec libellés de fenêtres réels + signes.
