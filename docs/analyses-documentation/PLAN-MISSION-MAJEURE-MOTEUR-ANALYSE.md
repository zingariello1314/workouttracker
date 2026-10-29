# Plan béton — Mission majeure moteur d’analyse

**Source de vérité :** [MISSION-MAJEURE-MOTEUR-ANALYSE-APPROFONDI.md](./MISSION-MAJEURE-MOTEUR-ANALYSE-APPROFONDI.md)  
**Appuis :** [AUDIT-STRATEGIQUE-MOTEUR-ANALYSE.md](./AUDIT-STRATEGIQUE-MOTEUR-ANALYSE.md) · [ARCHITECTURE-CIBLE-MOTEUR-ANALYSE.md](./ARCHITECTURE-CIBLE-MOTEUR-ANALYSE.md)  
**Inventaire corrélations :** [INVENTAIRE-CORRELATIONS-ANALYSES.md](./INVENTAIRE-CORRELATIONS-ANALYSES.md)  
**Fil rouge antérieur :** [MISSION-AMELIORATION-MOTEUR-ANALYSE.md](./MISSION-AMELIORATION-MOTEUR-ANALYSE.md)

**Principe :** profondeur du raisonnement d’abord ; rédaction = restitution de conclusions calculées. Pas de LLM. Pas de commit sans demande.

---

## Exigences renforcées (non négociables)

### R1 — Finding ≠ analyse approfondie

`recapAnalyticalFindings.js` est une **fondation**, pas le livrable.

Pour chaque famille pilote, le moteur doit :

1. Calculer le constat.
2. Exploiter les **relations pertinentes disponibles**.
3. Interpréter (niveau épistémique borné).
4. Aller jusqu’à une **conséquence concrète** quand les données le permettent.

Niveaux de qualité à vérifier en tests (le niveau 3 n’est pas obligatoire partout ; c’est l’**objectif de raisonnement**) :

| Niveau | Exemple volume |
| --- | --- |
| 1 — Insuffisant | « Le volume a augmenté de 18 %. » |
| 2 — Mieux | « +18 % sur 3 séances comparables, performances/série stables. » |
| 3 — Approfondi | Expliquer ce que ça indique (capacité à accumuler du travail / progression de volume confirmée ou non) et relier à l’objectif **si** les données le permettent |

**Critère de sortie par famille pilote :** tests assertent la présence d’un **résultat analytique positif** (comparaison + interprétation), pas seulement l’absence de « il faudra examiner ».

### R2 — Inventaire transversal des corrélations avant de limiter les croisements

Avant de figer 3A sur volume/perf/fréquence/GTG seuls : inventaire des relations entre **toutes** les familles réellement accessibles (entraînement, variantes, programme, assiduité, sommeil, récupération, poids/taille/composition, objectifs).

Pour chaque relation : données nécessaires, disponibilité réelle dans le code, méthode, limites, analyses enrichies/produites.

→ Document : [INVENTAIRE-CORRELATIONS-ANALYSES.md](./INVENTAIRE-CORRELATIONS-ANALYSES.md).  
Implémenter seulement les relations à valeur concrète et testables. Pas de corrélations artificielles.

### R3 — Golden pack = qualité analytique, pas seulement technique

Pour chaque scénario important, le pack doit permettre de répondre :

- Conclusion concrète ?
- Données complémentaires exploitées ?
- Au-delà de la statistique affichée ?
- Implication pour l’utilisateur ?
- Relation pertinente laissée de côté ?
- Distincte des autres cartes ?
- Affirme-t-elle plus que les preuves ?

Comparer avant/après. Documenter les analyses encore superficielles **alors que des données existent** → les corriger. Build vert ≠ validation.

### R4 — Instrumentation de toute la sélection finale

À chaque étape importante, diagnostic **par famille** :

| Métrique | Signification |
| --- | --- |
| `produced` | Candidats générés |
| `insufficient_data` | Écartés faute de données / n |
| `deduped` | Doublons / novelty / rivals |
| `ranked_out` | Éliminés par classement / caps |
| `shown` | Affichés dans le pack final |

Vérifier que les **nouvelles familles** ne sont pas systématiquement éliminées et que les **complémentaires** restent visibles sans supprimer les anciennes utiles.

---

## 0. État de départ (déjà livré — ne pas refaire)

| Déjà fait | Fichiers |
| --- | --- |
| Dédup cumul / `noveltyKey` | kinship, claims, milestones |
| Badges par `kind` | `RecapAnalyseView.jsx` |
| Voix temporelle | `recapEventVoice.js` |
| Taux identité fenêtre ~30 j. | `athleteTrainingIdentity.js`, essays |
| Rivals sommeil obs/habit | `recapPeriodDiscoveries.js` |
| Pénalité textes « année » sur 7/30 j. | `recapAdaptiveInsights.js` |

---

## Phases

### Phase 1 — Audit + corpus + inventaire corrélations

| Action | Fichiers | Pourquoi |
| --- | --- | --- |
| Inventaire corrélations (R2) | `INVENTAIRE-CORRELATIONS-ANALYSES.md` | Choisir quoi implémenter sur preuves de dispo |
| Golden pack profondeur (R3) | `recapAnalysisDepthAssert.js`, `__tests__/recapAnalysisGoldenPack.test.js` | Assert conclusions, pas seulement anti-phrases |
| Diagnostic sélection (R4) | `recapSelectionDiagnostics.js` branché dans adaptive insights / period select | Distinguer génération vs sélection |
| Dump live documenté | procédure dans plan / compte rendu | Avant/après réel |

**Sortie P1 :** inventaire daté ; golden pack avec asserts profondeur sur ≥2 scénarios ; diagnostics sélection exposables en test.  
**Statut :** ✅ inventaire + golden (≥4 scénarios) + diagnostics (+ boost/rescue).

### Phase 2 — Fondation Finding + prose pilotée par conclusions

| Action | Fichiers | Pourquoi |
| --- | --- | --- |
| Registre Finding | `recapAnalyticalFindings.js` | Partage constats (validé produit) |
| Champs conclusion | Finding : `interpretation`, `consequence?`, `relations[]`, `epistemic` | R1 — au-delà du raw metric |
| Consommer dans essays/threads | `recapHorizonEssays.js`, `recapAnalysisDepth.js` | Texte = résultat du rapprochement |
| Gate anti-dérobade | `recapEditorialGate.js` | Nécessaire mais **insuffisant seul** (R3) |

**Sortie P2 :** 5 kinds pilotes émettent Finding **avec** interpretation/consequence quand données ok ; tests profondeur verts sur ≥1 famille ; gate « tâche moteur » vert.  
**Statut :** ✅ `volume_traj`, `adherence_dow`, `body_weight_parallel`, `gtg_repere_coevo` (+ volume C2 via momentum) ; gate vert.

### Phase 3 — Capacités (après inventaire)

Ordre : relations **implémentables** cochées dans l’inventaire, pas une liste fixe.

| Chantier | Priorité typique | Pourquoi |
| --- | --- | --- |
| **3A** Volume↔perf↔fréquence ; variantes comparables ; GTG↔repère | Haute | Données riches, défaut « s’arrête trop tôt » fréquent |
| **3B** Assiduité → groupes / volume prévu vs fait | Haute | Validé produit ; briques completion/DOW existent |
| **3C** Poids/IMC (+ composition si stockée) | Moyenne | S’ajoute, ne remplace pas ; silence si n trop faible |
| **3D** Autres relations inventaire (sommeil×perf déjà partiel, objectifs×mix…) | Selon dispo | Élargir sans forcer |

Chaque relation livrée : Finding + carte/enrichissement + test profondeur R1/R3 + ligne diagnostic R4.

### Phase 4 — Sélection complémentaire + diversité

| Action | Pourquoi |
| --- | --- |
| Utiliser diagnostics R4 pour calibrer caps / rivals / novelty | Nouvelles familles visibles |
| Règles simples de complémentarité (pas score opaque) | Mission §14 |
| Prose depuis Finding structuré | R1 |

**Sortie P4 :** pour chaque famille pilote, `shown ≥ 1` sur fixture riche quand `produced ≥ 1` et qualité ok ; anciennes cartes utiles conservées.

### Phase 5 — Validation + compte rendu

Golden + live ; exemples avant/après **profondeur** ; compte rendu §16 ; pas de commit sans demande.

---

## Critères de sortie globaux (renforcés)

Livrable seulement si, à données identiques :

1. Moins d’analyses « tâche à faire » **et** plus de conclusions niveau ≥2 sur les familles pilotes.
2. Inventaire corrélations documenté ; relations implémentées ⊆ inventaire « ready ».
3. Assiduité et (si données) corporel apparaissent sans écraser le sport (R4).
4. ≥1 croisement multi-signaux avec épistémique correct.
5. Golden pack vérifie profondeur (R3), pas seulement lint/phrases.
6. Diagnostics sélection par famille disponibles et utilisés pour corriger les éliminations systématiques.
7. Compte rendu avec avant/après concrets.

---

## Refus explicites

Pas de générateurs remplacés en masse ; pas de fusion auto ; pas de causalité inventée ; pas de LLM ; pas de UI hors nécessité ; pas de scores complexes non prouvés ; pas de commit sans demande.
