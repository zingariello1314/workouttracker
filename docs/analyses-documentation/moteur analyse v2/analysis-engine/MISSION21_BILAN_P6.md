# MISSION 21 — Bilan P6

Édition : `p6-sovereign-v19` → **`p6-sovereign-v20`**. P6 **non clôturée**. **NO-GO P7**. Aucun commit.

## Verdict

Étape A (prérequis factuels/identitaires) et étape B (mémoire verticale collective) sont livrées sur le parcours collectif + familles. Les populations classiques excluent désormais le GTG à la source ; l’attribution n’affiche plus 100 % pour le volume reconnu ; les faits partagés alimentent les cartes migrées ; l’identité d’épisode est indépendante de la prose ; la mémoire chronologique évolue sans fuite du futur.

## Étape A — prérequis

### A1 — Populations / GTG

- Cause : `collectLifetimeRepHistory` conservait les clés GTG syncées dans le catalogue lifetime.
- Correction à la source via `classicExclusiveRepsForDay` (exclusiveReps par storageId).
- Preuve fenêtre 23 sep–22 oct : **CLASSIC = 3881**, GTG déduit = 85, inclusif = 4281 (brut 4166 + complémentaire 200 − GTG 85 + unsync).
- Invariants : jour GTG-only ≠ renforcement classique ; GTG sur jour classique n’augmente pas le volume classique.

### A2 — Attribution & contributions

- `attributionShare` / 100 % = **partitionCoverage** (toute séance classée, y compris résidu).
- Export distinct : `recognizedVolumeShare`, `recognizedSessionShare`, `unattributedVolumeShare`, parts structurelle / probable / historique.
- Rejeu 30j : recognizedVolume ≈ **51 %**, partition **100 %**, gap contributions **0**.
- `coverageComparability` limite la portée si la couverture s’améliore trop vite.
- Environnement rejeu figé : empreinte banque `exerciseDatabase` (1374 clés), résolveur journal+programme+banque.

### A3 — Facts-first

- Module `analyticalFacts.js` : identité `sujet|métrique|population|fenêtre|méthode|version`.
- Consommé par collectif et composition mensuelle (`sharedFacts` / `factRegistry`).
- Preuve rejeu : collectif 21 faits partagés ; mensuel 8.

### A4 — Identité phénomène

- `stableReturnEpisodeId` → `return_episode|date|p:<digest>|n:<count>` (sans prose, sans IDs bruts).
- Discriminant multi-reprises le même jour ; IDs bruts restent dans `namedMoves` / preuves.

## Étape B — mémoire verticale

- Réutilise `analyticalMemory` (phenomena / publications / exposures / feedback) — pas de registre concurrent.
- Simulation chrono : absent → return_observed (11) → confirmed_once (18), `noFutureLeak=true`.
- Cartes : `memory.state`, `transition`, `publicationDecision`, `exposureCounted=false`.
- Publication ≠ exposition (génération catalogue ne marque pas consulté).

## Limites assumées

- Collectif parfois bruyant côté noms non résolus → libellés « mouvement » plutôt qu’IDs bruts.
- `previousState` null sur un run unique (pas de mémoire prior injectée) ; évolution prouvée par simulation chrono.
- Catalogue all/selected/accessible : écarts structurels documentés (selected≪all) ; unification `reconciledStrict` côté export.
- Jeux A/B/C non rejoués exhaustivement dans ce JSON (ouverts).
- Vitest globale non rejouée in extenso (suites M19–M21 OK).
- DOM **NON_OBSERVÉ**.

## Critères

| Critère | Statut |
|---|---|
| GTG hors classique (3881) | **Oui** |
| Contributions réconciliées | **Oui** |
| Attribution honnête | **Oui** |
| Faits partagés consommés | **Oui** |
| Identité hors prose | **Oui** |
| Mémoire chrono sans futur | **Oui** |
| Effet éditorial (priorité + mémoire) | **Oui** (rejeu) |
| Non-régression M19/M20 | **Oui** (tests) |
| Clôture P6 / P7 | **Non** |
