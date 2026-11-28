# Jalon post-P6 — intelligence éditoriale & restitution (v38)

**Édition code :** `p6-sovereign-v38`  
**P6 :** reste clôturée · erratum v37 conservé · **NO-GO P7** · pas Mission 38 · aucun commit.  
**Observation Chrome v38 :** non affirmée (pas d’export navigateur dans ce jalon).  
**Recette branchement :** [RECETTE_V38_VISUEL.md](./RECETTE_V38_VISUEL.md) — **prête pour validation visuelle Chrome personnelle**.

---

## A. Corrections analytiques

| Défaut | Cause | Correction | Test | Statut |
|---|---|---|---|---|
| Hyperextension : corps démarre par moyenne 48→40 | `buildObservation` écrasait le constat outlier | Préserver `isolated_outlier` ; preuve `7×≈48 → 1×24` | `postP6EditorialRestitution` | **Corrigé** |
| Footer COMPARABLES / plateau sans 24 | Evidence hors événement central | Evidence outlier dédiée (render + F4) | idem | **Corrigé** |
| Mollets « aujourd’hui » sur 7 j | Libellé figé alors que fade = 30 j vs 30 j | Périodes nommées ; pas de baisse globale jambes | prose fade | **Corrigé** |
| 6 jours vs 7 ; « tu ne t’es pas entraîné » | `openEnd` non expliqué ; implication conseil | Journées clôturées ; absence = enregistrée | calendar shape | **Corrigé** |
| Titre « sous “Les 30 jours d’avant” » | Libellé artificiel | Titre naturel + prudence effectif ≤2 | `rhythmIdea` | **Corrigé** |
| Répertoire 500/500 | Fenêtres quasi identiques | Abstention si circulaire ; expositions | `disc_repertoire` | **Corrigé** |
| Durée absente généralisée | Population non nommée | « séance de renforcement… sur cette fenêtre » | `describeActivityDuration` | **Corrigé** |
| Concentration répétitive | Prose redondante | Conclusion → 2 parts → limite | phenomenonComposition | **Corrigé** |

---

## B. Avant / après (textes)

### Hyperextension
- **Avant (v37 UI observée) :** moyenne 48→40 en tête ; preuve type plateau/témoins.  
- **Après (v38) :** « Après 7 séances autour de 48… baisse ponctuelle… » · preuve `7×≈48 → 1×24 · baisse ponctuelle`.

### Mollets
- **Avant :** « … contre 0 % aujourd’hui … baisse d’exposition de cette famille ».  
- **Après :** « … sur les 30 jours récents » + scope part conventionnelle ≠ travail total des jambes.

### Rythme 7 j
- **Avant :** `rythme de renforcement sous « Les 30 jours d'avant »`.  
- **Après :** `moins de répétitions par journée entraînée que sur …` + prudence si 2 journées.

### Répertoire
- **Avant :** `500 ce mois sur 500 en 30 jours` comme maturité.  
- **Après :** carte non publiée si identité circulaire ; sinon expositions discriminantes.

---

## C. Restitution visuelle (3 parcours)

Module : `src/utils/sport/analysisVisualInsight.js`  
UI : `src/components/sport/recap/AnalysisVisualInsight.jsx` (Recharts existant)

| Cas | Spec `kind` | Source données |
|---|---|---|
| Volume 30 j freq/contenu | `volume_freq_content` | `freqEffect` / `contentEffect` (métriques) |
| Concentration relative 7 j | `relative_concentration` | parts + dénominateurs structurés |
| Trajectoire Hyperextension | `trajectory_sessions` | séances / observations (pas moyennes) |

Jamais reconstruit depuis le texte rédigé.

---

## D. Lecture éditoriale

- Sur **7 j**, structure programme dépriorisée (`week_structural_context_not_priority`).  
- Phénomènes ancrés fenêtre / outlier / concentration favorisés.  
- Catalogue accessible **non réduit**.  
- Cartes longues : résumé + « Lire le raisonnement complet » + « Pourquoi cette analyse ? ».

---

## E. Présentation

Preuves unitaires + code UI. **Pas de capture Chrome v38** dans ce livrable.

---

## F. Non-régression

| Suite | Résultat |
|---|---|
| `postP6EditorialRestitution` | PASS |
| `postP6TrajectoryDeclineSemantics` | PASS |
| `mission37` + narration + trajectoire | PASS (70 tests ciblés) |

**Non exécutés :** rejeu 8h, DOM 8/8, export Chrome, jeux A/B/C live.

---

## G. Bilan

**Amélioré :** exactitude perçue outlier ; portées Mollets/rythme/répertoire/durée ; prose concentration ; 1er parcours visuel ; lecture progressive.  
**À développer :** Visual Insight Engine complet (spec §22) ; notation humaine ; observation navigateur v38.  
**Non livré comme clos :** refonte grille 3 colonnes ; quotas catégories ; P7.
