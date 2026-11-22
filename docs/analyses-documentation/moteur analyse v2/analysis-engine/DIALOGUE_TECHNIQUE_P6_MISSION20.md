# Dialogue technique P6 — Mission 20

Pour chaque point : **hypothèse** → **cause démontrée** → **décision** → **preuve**.

---

### 1. Pourquoi `monthlyProgramComposition` ne consommait-il pas les mêmes populations que les analyses générales ?

- **Hypothèse** : bug de fenêtre ou double comptage aléatoire.
- **Cause démontrée** : deux populations distinctes. Général = `STRENGTH_INCLUSIVE` (brut − GTG + défis unsync). Familles = catalogue `collectLifetimeRepHistory` excluant `complementary_*`.
- **Décision** : conserver les deux avec identités séparées ; ne pas fusionner silencieusement.
- **Preuve** : table `reconcilePopulationTable` → 6403 vs 5803, écart 600 = 300+300.

### 2. Quelle fonction doit faire autorité sur ces populations ?

- **Décision** : `canonicalAnalyticalPopulations.measurePopulationWindow` / `canonicalVolumeFor(purpose)`.
  - Familles / ledger → `CLASSIC_SESSION`.
  - Volume général / stats force → `STRENGTH_INCLUSIVE`.
  - Bannière UI → calendrier aligné (désormais avec unsync).
- `measureRecapWindow` reste le producteur opérationnel ; le module canonique est le contrat de réconciliation.

### 3. `sessionEpisodeLedger` : vue du socle ou second agrégateur ?

- **Décision** : **vue** du catalogue classique (`LEDGER_POPULATION_ID = classic_session_catalog`). Il ne recalcule pas un volume global concurrent.
- **Recommandation** : toute future mémoire chronologique doit pointer des `occurrenceId` / `episodeId` du ledger, pas ré-agréger les reps.

### 4. Pourquoi certains mouvements restent difficiles à attribuer ?

- **Causes démontrées** :
  - IDs orphelins (`2001195533`…) sans nom journal / banque.
  - Créneaux `dup_*` vs historiques numériques (104 vs 504) : même mouvement canonique, prescriptions distinctes.
  - Snapshots historiques indéterminés : interdit de projeter le programme actuel comme preuve datée.
- **Décision** : matching structurel (composition) + niveaux probable / non attribuable ; jamais jour-de-semaine seul.

### 5. Quelle proportion d’occurrences reliée à une famille ?

- **Preuve backup 30j** : ~**51 %** du volume récent (`probably_related`) ; ~20 % sur la fenêtre précédente (noms plus pauvres).
- Confiance typique : overlap Jaccard ≈ 0,5–0,7 → niveau **probable**, pas « historiquement documenté ».

### 6. Pourquoi les treize analyses de variantes ont-elles disparu ?

- **Cause démontrée** : gate circularité M19 (`independentMatches=0 && volumeOnlyMatches>0` → abstention).
- Sur le backup, les trajectoires greffables n’apportent pas de dayKey/sessionName → pas de mix non circulaire.
- **Preuve** : test M20 circular vs slot-matched ; rejeu `variantMix=0`.
- **Avis** : ne pas réintroduire les 13 cartes ; enrichir les sessions de trajectoire avec le créneau quand l’appariement structurel le permet.

### 7. Les détecteurs hérités peuvent-ils contourner l’autorité commune ?

- **Oui, encore** : de nombreux `disc_*` hors parcours migrés calculent leurs propres totaux.
- **Décision M20** : borner le périmètre (volume, familles, épisode, fingerprint) plutôt que tout réécrire.
- **Recommandation** : tout nouveau détecteur doit déclarer un `populationId` ou s’abstenir.

### 8. Pourquoi les preuves de confirmation n’étaient-elles pas transmises ?

- **Cause démontrée** : `sourceEventsOf` ne lisait que `metrics.dates` (date de reprise), pas `confirmationDates`.
- Slice `observedValues` à 8 coupait le 9ᵉ mouvement.
- **Décision** : propager `return_date` / `confirmation_date` ; plus de slice à 8.

### 9. Comment éviter que mémoire / sommeil reproduisent ces problèmes ?

1. Une population = un id + un libellé + une fenêtre.
2. Faits partagés **avant** rédaction.
3. Autorité narrative = validité du raisonnement, pas flag permanent du premier module.
4. Preuves temporelles (confirmations) voyagent dans le claim, pas seulement dans la prose.
5. Fingerprint sur les **vrais** champs (`exerciseWeights`, etc.).

### 10. Avis indépendant sur la qualité réelle

Les analyses migrées (collectif, familles directionnelles, populations) sont **enfin cohérentes entre elles** sur ce dataset. Ce n’est pas encore un moteur uniformément fiable : beaucoup de cartes restent hors socle, les variantes sont absentes faute de preuves indépendantes (ce qui est correct), et sans DOM on ne valide pas le rendu utilisateur. **P7 serait prématuré.** La prochaine valeur est d’ancrer les faits partagés et l’identité d’épisode avant d’empiler de nouveaux phénomènes.

---

## Alternatives écartées

| Proposition | Risque | Choix |
|---|---|---|
| Forcer familles = volume général | Masque complémentaire/GTG | Rejeté |
| Remettre les 13 mixes v17 | Circularité | Rejeté |
| Nouveau moteur parallèle | Dette double | Rejeté |
| Hardcoder « épaules-triceps » | Sur-ajustement dataset | Rejeté |
