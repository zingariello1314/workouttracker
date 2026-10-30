# Validation P0 post-corrections — diagnostic live 30j

**Date validation :** 30 octobre 2026 · **Run après corrections :** `generatedAt` `2026-10-30T03:53:20.710Z`  
**Fenêtre :** `2026-10-01` → `2026-10-30` (même période que l’export initial)  
**Baseline avant :** export `_raw-console-export-FULL-30d-2026-10-30.json` (`generatedAt` `2026-10-30T03:25:26.228Z`)  
**Objectif :** confirmer que P0 est fiable dans le moteur complet avant P3. Aucun commit.

---

## 1. Nouveau diagnostic (résumé)

| Compteur | Avant | Après | Lecture |
| --- | --- | --- | --- |
| Affichées (`shown_now`) | 15 | 15 | Stable |
| Total registre | 71 | 71 | Stable |
| Produits / rejetés overview | 25 / ~44 | 25 / 42 | Variations mineures de sélection |
| `totalMs` | ~7947 | 6942 | Pas une régression analytique |
| Signature fenêtre | 30d\|2026-10-01\|2026-10-30… | même fenêtre | **Mêmes données / même période** |

### Cartes affichées après (titres)

| Famille | Kind | Titre |
| --- | --- | --- |
| Composition | `disc_emergence` | Pompes inclinées : **format repris, pas encore installé** |
| Composition | `disc_emergence` | Curl assis dos calé : **format repris, pas encore installé** |
| Composition | `disc_emergence` | Mollets debout entre dans ton historique |
| GTG | `disc_gtg_unplanned_*` | (inchangé dans l’esprit) |
| Exercices | `disc_ms_*` / `journey_progress` | dont « Tes niveaux de référence ont progressé… » |
| … | volume, sommeil, assiduité, mobilité… | présents |

---

## 2. Différences avant / après — point par point

### 2.1 `disc_exercise_progress` (Pompes déclinées #104)

| Aspect | Avant | Après | Cause |
| --- | --- | --- | --- |
| Contenu analytique | Contradictoire (25,3 vs reprise ; témoin homonyme ; séries certainnes) | Cohérent | **Correction volontaire** |
| Texte principal | « revenu vers ≈25,3 … proche du départ ≈27,3 » | « dernière séance revenue à ≈**36** … moyenne late ≈25,3 **n’est pas le niveau final** » + lead « 2 avant la fenêtre, 6 dedans » | **Volontaire** (`referenceLevels` + `interpretingWithHistory`) |
| Séries | before/after chevauchants ; certitude implicite | before = 7+14 sept. ; after = **26 oct. seul** ; `granularity: partial` ; « 5 séances du creux n’ont qu’un total… » ; stance `watch` | **Volontaire** |
| Peers | `localized_rise` + témoin « Pompes déclinées » id 202 | `localized_recovery` ; homonymes **202/301/504 exclus** ; témoin stable = développé incliné **[id 466084426]** | **Volontaire** |
| `vsInitialPct` / moyennes | 36 / 19,2 / 14 / −46,7 % présents sans explication | **Mêmes chiffres** + `meanDefinitions` / aliases lifetime | **Volontaire** (pas de falsification des moyennes) |
| **Visibilité pack final** | `shown_now` | Status `discovery_not_selected` → **pas dans les 15 cartes** ; remplacé en long par `journey_progress` | **Effet collatéral de sélection** (voir §6) — **pas une régression de calcul** |

**Vérifications demandées (pompes) — résultat :**

- Références temporelles cohérentes et **nommées** : OK  
- Dernière perf 36 distinguée des moyennes : OK (texte + `referenceLevels.lastPerformance`)  
- Creux 10 (2026-10-01) + reprise : OK  
- Plus de contradiction textuelle lateMean vs reprise : OK (`vsInitialPct` reste un indicateur lifetime **documenté**, non utilisé comme preuve de non-reprise)  
- Stabilité des séries limitée à la granularité dispo : OK (`partial`, caveat creux, stance `watch`)

### 2.2 `disc_emergence`

| Cas | Avant | Après | Cause |
| --- | --- | --- | --- |
| Pompes inclinées / Curl assis (2 séances / 7 j) | « commence à s’installer » | « **format repris, pas encore installé** » + corps « répétition du format, pas encore une installation durable » | **Volontaire** (`repeated`) |
| Mollets debout (1 séance) | entrée historique | inchangé (`first_session`) | OK |
| Kinds installation observés | installing dominant | `repeated` \| `first_session` \| `returning` | **Volontaire** |

Les nouveaux champs **influencent bien le texte affiché** (titres + corps), pas seulement les metrics console.

### 2.3 Témoins (audit élargi)

| Sujet | Homonymes exclus | Témoins retenus | Self-as-peer | Commentaire |
| --- | --- | --- | --- | --- |
| Pompes déclinées 104 | 202, 301, 504 | Dips 103 (instable), Développé 466… (stable) | non | Filtrage sujet OK |
| Pompes inclinées | 105 | Dips, **104 + 202** « Pompes déclinées », Développé | non | Avant patch dédupe-peers : **deux libellés identiques** entre témoins (trompeur). **Corrigé** en validation : dédupe par label peer (`duplicate_peer_display_name`) |
| Hyperextension | 703294235 | aucun → `insufficient` | non | Exclusion correcte ; **effet** : plus de témoin (pertinent ou non) — documenté |
| Mollets / Squat / Développé | homonymes exclus | Hyperextension ou push family | non | OK |

**Risques résiduels du filtre par nom :**

1. **Exclure un témoin pertinent** si deux ids distincts partagent un libellé mais représentent de vraies variantes utiles → aujourd’hui on préfère l’ambiguïté zéro (choix P0).  
2. **Conserver un témoin trompeur** si deux exercices **différents noms** mais mouvement peu comparable passent le filtre famille — hors scope P0 (similarité fine = P3).  
3. ~~Deux peers même label pour un tiers~~ → **corrigé** pendant cette validation.

---

## 3. Textes finaux vs nouveaux champs

| Champ | Influe le texte live ? | Preuve |
| --- | --- | --- |
| `referenceLevels` / `lastPerformance` | **Oui** | Phrase « dernière séance … ≈36 » + avertissement lateMean |
| `interpretingWithHistory` | **Oui** | « dont 2 avant la fenêtre sélectionnée, 6 dedans » |
| `granularity` / caveat creux | **Oui** | « 5 séances du creux n’ont qu’un total… structure … pas démontrée » |
| `localized_recovery` | **Oui** | « trajectoire (creux puis reprise) » + id témoin ; plus « hausse » |
| `repeated` | **Oui** | Titres émergence « format repris… » |

Proportionnalité : stance mécanisme `watch`, pas de certitude séries sur le creux, émergence non sur-affirmée — **conforme**.

---

## 4. Tests exécutés

```text
npx vitest run src/utils/sport/__tests__/exerciseTrajectoryAnalysis.test.js
→ 37 passed (37)
```

Ajouts cas limites (cette validation) :
- 1 séance / &lt;7j / ≥7j / 3 séances courte / 3 séances ≥14j  
- exclusivité `repeated` ∩ `installing` ∩ `installed`  
- totals_only ; séries seulement avant creux ; reprise isolée vs lateMean  
- dédupe peers même libellé  

---

## 5. Fichiers modifiés (validation + hotfix peers)

| Fichier | Rôle |
| --- | --- |
| `src/utils/sport/exerciseTrajectoryAnalysis.js` | Dédupe peers inter-libellés + accord « reste/restent » |
| `src/utils/sport/__tests__/exerciseTrajectoryAnalysis.test.js` | Cas limites + dédupe |
| `docs/analyses-documentation/VALIDATION-P0-POST-CORRECTIONS-2026-10-30.md` | Ce bilan |
| *(P0 initial déjà en place)* `recapPersonalBaselines.js`, `recapPeriodDiscoveries.js`, `AUDIT-CORRECTIONS-P0-…md` | — |

---

## 6. Problèmes encore présents (hors recalcul P0)

1. **`disc_exercise_progress` non sélectionné** dans ce run (`discovery_not_selected`) alors que le contenu corrigé est riche — remplacé à l’affichage long par `journey_progress`.  
   - **Pas une régression des moyennes / peers / séries.**  
   - À traiter en **P4 sélection** (valeur informative d’une trajectoire rebound vs journey générique).  
2. **Implication** « retour confirmé… maintenir » reste un peu affirmative alors que le mécanisme séries est `watch` — acceptable mais affinable.  
3. **Draft legacy** (`draftBody`) des émergences peut encore parler autrement que le titre rendu — le texte **affiché** utilise la trajectoire ; le brouillon legacy reste pour la forensique.  
4. P3 (body×perf, assiduité×prog, sommeil) **non engagé** (consigne).

---

## 7. Verdict

**P0 calculatoire / rédactionnel : validé en conditions réelles** sur la même fenêtre 30j.  
Les champs nouveaux **pilotent bien les conclusions visibles**.  
**Point de vigilance unique bloquant pour “carte progress à l’écran” :** la sélection période n’a pas retenu `disc_exercise_progress` sur ce run — à traiter avant de considérer le *produit affiché* comme entièrement représentatif de la correction, sans pour autant invalider la fiabilité des calculs.

**Ne pas passer à P3** tant que la sélection de cette carte n’est pas tranchée (garder / fusionner / outrank explicite) — recommandation, pas un bug de trajectoire.
