# Rapport — correctif qualité post-clôture P6

**Nature :** maintenance ciblée (pas Mission 38, pas P7).  
**Observation Chrome non réécrite :** v36 · `c3e80330`.  
**Édition code du correctif :** `p6-sovereign-v37`.  
**Commit Git :** aucun.  
**Erratum :** [ERRATUM_POST_CLOTURE_RAISONNEMENT.md](./ERRATUM_POST_CLOTURE_RAISONNEMENT.md).

---

## A. Défauts étudiés

| Carte | Problème | Vérification source | Cause | Correction | Test | Statut |
|---|---|---|---|---|---|---|
| V36-008 / 036 | « Recul confirmé » sur 7×48+24 | LIVE_INPUTS : 7×48 puis 1×24 | `monotoneDown` permissif + seuil atypique + titre sur `net_decline` | Shape `terminal_outlier` · continuity `isolated_outlier` · prose ponctuelle | `postP6…` 7×48+24 | **Corrigé (v37)** |
| V36-026 | Absence course → charge totale | Texte « entièrement renforcement » | Inférence hors canaux | Canaux suivis ; inconnu ≠ zéro | prose `disc_no_running` | **Corrigé** |
| V36-009 | « d’avant » vs mois interne | Comparateur = mois précédent dans la fenêtre | Titre générique | Titre/corps nomment le comparateur | `recapAnalysisDepth` | **Corrigé** |
| V36-003 | « Nuit précédente » individualisée | Cohortes historiques appariées | Titre trompeur | Titre historique ; « pas diagnostic nuit d’hier » | vol75 today/week | **Corrigé** |
| V36-018 | Écart 40 pts vs 19/22 & 8/15 | Complément 7/15 requis | Modalités croisées | Écart sur part ≥7h30 seule | sep body | **Corrigé** |
| V36-021 | Bins ≥7h30 / <7h | Intervalle 7–7h29 exclu | Partition non signalée | Phrase « partition non exhaustive » | densSleep body | **Corrigé** |
| V36-023 | « autres » vs « résidu 51 » | Δ réconcilié −1225 | Ambiguïté stock vs Δ | Δ hors top ≠ stock non attribué | `monthlyProgramComposition` | **Corrigé** |
| GTG / 3×20 longs | Répétitions multi-horizons | Textes identiques 6m–all | Chevauchement légitime | Pas de suppression ; limite éditoriale ouverte | — | **Documenté** |
| V36-030–032 | Couverture ≠ découverte | Abstentions programme | Poids éditorial | Pas de refonte ; limite ouverte | — | **Documenté** |

---

## B. Correction fondamentale des trajectoires

Sorties **réelles** du moteur (`demo-hyperextension-fix.mjs`, édition v37) :

| Série | Shape / continuity | Titre |
|---|---|---|
| `48×7, 24` | `outlier_driven` / `isolated_outlier` | *Hyperextension : une séance atypique, pas encore une tendance* |
| `48,48,48,40,36,32` | `net_decline` / `confirmed_decline` | *Hyperextension : recul confirmé sur plusieurs séances* |
| `48,36,48,40,48,44` | `plateau` / `stable_plateau` | *Hyperextension : volume par séance stable* |
| `48×6` | `plateau` / `stable_plateau` | *Hyperextension : volume par séance stable* |
| `48,48,24,48,48` | `recovered` / `decline_then_recovery` | *Hyperextension : recul puis retour près du niveau de départ* |

Corps (cas 7×48+24) : « Après 7 séances autour de 48 répétitions, la dernière descend à 24. Cette baisse ponctuelle réduit la moyenne récente (≈40), sans permettre de conclure à un recul installé. »

---

## C. Comparaison avant / après

### V36-008 (et V36-036, même thèse)

**Avant (v36, pack aveugle) :**  
Titre : `Hyperextension: recul confirmé sur plusieurs séances`  
Corps : moyenne 48→40 (−16,7 %) + « Le recul se confirme sur plusieurs séances, pas sur un seul point isolé. »

**Après (v37, même série) :**  
Titre : `Hyperextension : une séance atypique, pas encore une tendance`  
Corps : baisse ponctuelle après plateau à 48 ; moyenne récente baissée **sans** recul installé.

### Autres cartes touchées (prose / portée)

| Carte | Après (extrait) |
|---|---|
| V36-026 | « Dans les canaux suivis… » + renforcement documenté ≠ charge totale |
| V36-009 | Rythme « sous « le mois précédent dans la fenêtre » » |
| V36-003 | Titre historique ; corps « pas un diagnostic de la seule nuit d’hier » |
| V36-018 | Écart sur part de nuits ≥7h30 (même modalité) |
| V36-021 | « Les nuits entre 7 h et 7 h 29… partition non exhaustive » |
| V36-023 | Contribution nette au Δ vs stock non rattaché |

Les textes v36 du blind-pack **ne sont pas réécrits**.

---

## D. Régressions

| Suite | Résultat |
|---|---|
| `postP6TrajectoryDeclineSemantics.test.js` | PASS (9) |
| `exerciseTrajectoryAnalysis` + `recapComposedEvidence` + `recapComposedNarration` | PASS (73 au total avec postP6) |
| `mission37AnalyticalIntelligence.test.js` | PASS (8) |

**Non exécutés (volontairement) :** rejeu 8 horizons complet, DOM, Dips, jeux A/B/C live, export Chrome v37, notation aveugle humaine.

---

## E. Impact éditorial

- **Priorités / réserve :** aucun changement de moteur de sélection pour forcer la diversité sur 1y/2y/all.  
- **Valeur marginale GTG / 3×20 :** limite ouverte — une carte déjà connue peut rester accessible ; on n’impose pas d’histoires artificiellement distinctes.  
- **Couverture programme (030–032) :** abstentions préservées ; pas transformées en insights sportifs.  
- **Découvertes complémentaires valides :** non supprimées.

---

## F. Conclusion

| Classe | Contenu |
|---|---|
| Défauts réellement corrigés | Faux « recul confirmé » ponctuel ; portée no-run ; comparateur temporel ; titre nuit historique ; proportions sommeil ; bins non exhaustifs ; Δ vs stock familles |
| Améliorations de prose | Titres/continuité outlier ; formulations de portée |
| Limites ouvertes | Répétitions longs horizons ; cartes couverture vs découverte ; pas d’obs. Chrome v37 |
| Non reproduits / hors scope | Optimisation score 12,08/20 ; Mission 38 ; P7 |
| Garanties inchangées | Homonymes distincts ; GTG hors volume classique ; inconnu ≠ zéro ; décomps V36-007/019/023/024 préservées |

**P6 reste administrativement clôturée.** Le correctif empêche de confondre un résultat ponctuel avec une transformation durable — sans rouvrir les audits déjà clos.
