# Diagnostic causes racines — Mission 13

Édition cible : `editorial=p6-sovereign-v12` · `classification=modality-authority-v1` · `matching=session-slot-v1`  
Gel v11 : `artifacts/analysis-eval/baselines/p6-sovereign-v11-before-mission13.meta.json`

---

## Tableau défaut → cause → correction

| Défaut | Carte / artefact | Producteur | Faits dispo | Étape de perte | Cause racine | Correction | Non-régression |
|---|---|---|---|---|---|---|---|
| Développé Arnold / couché incliné en `cardioKeys` | program-structure.json | `exerciseWorkModality` | Noms + programCategory | Classification | Regex `/cardio/` sur **programCategory** | Autorité multi-axes : nom force > catégorie | Tests M13 + 6 créneaux |
| Wall sit iso = 0 | famillesés | `exerciseWorkModality` | series `45s` | Classification | « wall sit » absent des patterns iso | `wall sit` / `chaise au mur` | Test unitaire |
| Familles toutes « aérobie » | cartes structure | `describeFamilyMuscleProfile` | modalités polluées | Aval classification | CardioKeys faux → modalities.cardio | Cascade après fix modality | Graph rebuild |
| Volume decomp 12j vs 15j | `disc_composed_volume_decomp` | compose + detect | strengthDays vs trainingDays | Agrégat | `trainingDays` (calendrier) priorisé | `strengthDays` d’abord + libellé | Test 4281/12 |
| Hyperextension 336 vs 192+144 | horizons 6m vs 30d | structLead detectDiscoveries | d30 vs période longue | Population / libellé | `structSrc = p` sur long + texte figé « 30 j » | Toujours d30↔prev30 ; long = sous-fenêtre explicite | Tests + rejeu |
| Collectif absent | reprises nov. | exploreCollectiveReturn | gaps ≥14 | Lien structurel | `sessionFamilyId` / muscle souvent null | Enrichissement via templates programme | À vérifier live |
| Phase charges absente | curl/oiseaux | composeLoadProgressionPhase | resistance_progression | Mapping champs | Cherchait `loadBefore` alors que `fromValue` | Mapping fromValue/toValue | Test + pipeline |
| Concentration relative plate | disc_exercise_share | ofMonthEx | 60/120 vs 1340/6044 | Raisonnement | Ratio relatif non construit | `composeRelativeConcentrationReading` branché | Code + test unitaire |
| Appariement créneau | trajectoires | programVariantContext | prescriptions | `no_slot_matching` | Annotation seule | `sessionSlotMatching.js` | Tests composition |
| Sleep B FAIL | architecture | gameB | texte « sans preuve que… soit la cause » | Évaluateur | Faux positif « cause » | Regex déni élargie | Test polish/déni |
| 63 vs 62 accessibles | pushPull | publication | disposition published | Post-sélection | Dedup/export vs recon trop tôt | À finaliser live (chantier 7) | — |
| Rapport « Mission 11 » | AUDIT_IA | auditIaReport | — | Export | Default mission figé | Default → Mission 13 | — |

---

## Classification : autorité canonique

Axes indépendants (`classifyExerciseAxes`) :

1. Modalité d’exécution  
2. Unité enregistrée  
3. Muscles (banque)  
4. Catégorie d’activité programme (métadonnée, **pas** modalité)

Règle critique : `programCategory: 'cardio'` **ne suffit pas** à classer un développé.

---

## Populations volume

| Question | Dénominateur |
|---|---|
| Contenu moyen des journées de renforcement | `strengthDays` (reps > 0) |
| Présence calendaire | `trainingDays` |
| Ne jamais mélanger sans libellé | — |

---

## Compositions : pourquoi absentes en v11

| Mécanisme | Blocage | Statut M13 |
|---|---|---|
| volume_decomp | Produit mais mauvaise population | **Corrigé** (strengthDays) |
| collective_return | Lien séance/muscle faible | **Enrichi** ; **PUBLIÉ live NON_VÉRIFIÉ** |
| load_phase | Champs metrics non mappés | **Corrigé** mapping |
| relative_concentration | Non branché | **Branché** sur ofMonthEx |

---

## Ce que le moteur comprend désormais (démontrable en code)

1. Un développé n’est pas du cardio parce que sa catégorie programme dit « cardio ».  
2. Wall sit / chaise = isométrie.  
3. Une décomposition volume sur 12→17 jours de renforcement ≠ 15→18 jours calendaires.  
4. Les progressions de charge `fromValue→toValue` alimentent une phase collective.  
5. Une concentration relative mouvements vs volume global peut être calculée.  
6. Un créneau peut être apparié par composition de mouvements, pas par jour de semaine.

**Preuve produit live des textes prioritaires v12 : NON_VÉRIFIÉ** — rejouer depuis Récap → Analyse.
