# F4 — Narration intelligente, cohérence éditoriale et présentation  
**2026-11-01** — Lot unique. Arrêt après F4. Aucun commit Git.

## Verdict

F4 transforme `composedEvidence` (F3) en **textes affichés** : observation → mécanisme → continuité → comparaison → conclusion, proportionnés à la profondeur disponible. Sur la fixture juil–oct, **100 % des cartes sélectionnées qui avaient une composition disponible l’utilisent maintenant dans le texte** (`compositionAvailable === compositionUsedInText`). E0 non retuné ; kinds sélectionnés identiques à F3.

Distinction conservée (réserve utilisateur F3) : capacité de raisonnement ≠ bénéfice utilisateur. F4 adresse le bénéfice textuel ; F5 reste nécessaire pour la sélection.

---

## Cartographie (code réel)

| Étape | Où | Rôle F4 |
| --- | --- | --- |
| Preuves | `recapComposedEvidence` / trajectoire | Source de vérité (inchangée) |
| Texte discoveries | **Nouveau** `recapComposedNarration` branché dans enrich | Remplace title/body depuis faits structurés |
| Polish | **Nouveau** `recapEditorialPolish` | ISO→FR, accords, sommeil daté |
| Pool | `buildPeriodDiscoveryBundle` | enrich + polish **avant** E0 (sans retirer de cartes) |
| Essays | `buildHorizonEssayCandidates` / `renderInterpretations` | Non réécrits en masse ; pas de nouveaux faits inventés ici |
| Marques | `recapProseMarks` | Durées `7 h 42`, schémas, ISO, API sémantique optionnelle |
| Validation | `editorialValidateDiscovery` + `insightRejectReason` F4 | Interdits / ISO restants |

---

## Décisions

1. Narration **uniquement** depuis `composedEvidence` — jamais via regex sur l’ancien body pour déduire un mécanisme.
2. Longueur proportionnelle : `elementary` / `explanatory` / `composed` / `deep` (métrique interne, pas affichée).
3. Pas de filtre pré-E0 (kinds stables) ; rejets F4 via validation existante quand prose encore fautive.
4. Disclaimer « sans suffire à démontrer une progression physiologique » **autorisé** (négation) ; affirmation physiologique **rejetée**.
5. Compositions endurance / sommeil / muscles **non inventées** — polish + dates seulement.

---

## Preuves de profondeur visible

### Fixture 30d — Exemple A (Pompes déclinées)

- **Avant titre :** « Pompes déclinées : recul et exposition faible coïncident »
- **Après titre :** « Pompes déclinées : moins de répétitions par séance »
- **Corps après :** volume ≈53.3 → 40 (−25 %) ; séries ~4 stables ; reps/série ≈15 → 10 ; témoins `mixed` (pas de « force intacte ») ; H explicite comme contexte.

### Fixture 6m — Exemple B (Tractions australiennes)

- **Avant :** « … s'installe dans ton entraînement »
- **Après :** « … : un format plus volumineux se maintient » (`depth: deep`)
- **Corps après :** ≈40 → 48 reps/séance (+20 %) ; séries ~4 ; reps/série 10→12 ; format reproduit ; témoins localisés ; disclaimer anti-physio.

### Score visible (selected)

| Période | Composée dispo | Utilisée dans texte | Mécanisme | Continuité | Témoins |
| --- | --- | --- | --- | --- | --- |
| 7d | 3 | 3 | 3 | 3 | 0 |
| 30d | 7 | 7 | 7 | 7 | 2 |
| 3m | 5 | 5 | 5 | 5 | 2 |
| 6m | 5 | 5 | 5 | 5 | 5 |

Kinds sélectionnés : **inchangés** vs F3 (même listes).

---

## Limites

1. « un mouvement » persiste quand `getExerciseNameById` / map ne résout pas l’id — résolution tentée, pas d’invention de nom.
2. Cartes non trajectoire (density, calendar, quarter_*) : polish léger seulement — profondeur F3 absente.
3. Essays narratifs horizon : non migrés vers `composedEvidence` (transfert partiel F5 / suite).
4. Colorations sémantiques exercices : API prête (`segmentRecapProseSemantic`) ; migration UI complète optionnelle.
5. Revue couverture endurance/sommeil/muscles → avant F7 (demande utilisateur).

---

## Critères de clôture (auto)

1–3 pipeline + preuves exploitées + A/B lisibles : **oui**  
4 longueur proportionnée : **oui** (depth levels)  
5–9 dates FR, sommeil, H qualifié, pas d’id brut testé, accords testés : **oui** (partiel UI sémantique)  
10 coloration cohérente valeurs/durées : **oui** (tests marks)  
11–13 essays / volume≠perf / interdits : **oui** sur discoveries composées  
14–17 tests + replays + avant/après + non-régression P0–P3.6 : **oui** (suites vitest ; pas de retune E0)  
18–20 E0 / pas de 2ᵉ moteur / pas de commit : **oui**

**F4 livré pour validation humaine. F5 non engagé.**
