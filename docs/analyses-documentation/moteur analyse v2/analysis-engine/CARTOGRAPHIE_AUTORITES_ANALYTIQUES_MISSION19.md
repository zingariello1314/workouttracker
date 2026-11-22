# CARTOGRAPHIE DES AUTORITÉS ANALYTIQUES — Mission 19

Édition : `p6-sovereign-v18`. Références code au moment du diagnostic.

## Synthèse

| Module | Autorité théorique | Autorité réelle | Proposition |
|---|---|---|---|
| `buildPeriodDiscoveryBundle` | Orchestrateur | Assemble et décide l’ordre F3/F4/P6 | **Conserver** — clarifier contrat d’entrée |
| `detectDiscoveries` | Détection brute | Rédige déjà titres/corps + pousse collectifs | **Adapter** — émettre faits/événements avant prose |
| Packs P3.x / shadow consolidations | Enrichissement | Produisent des cartes autonomes | **Conserver** avec admission P6 |
| `filterDiscoveriesByPeriodScope` | Portée fenêtre | Filtre activités / exercices vides | **Conserver** |
| F3 `enrichDiscoveriesWithComposedEvidence` | Preuves structurées | Peut déclencher F4 qui **réécrit** le sens | **Déplacer** narration hors sens |
| F4 `applyComposedNarrationToDiscovery` | Formulation | Historiquement dernier mot sur le corps | **Adapter** — soumis à `narrativeAuthority` |
| `analyticalExploration` | Hypothèses / couverture | Peu de kinds ; collectif OK | **Conserver / étendre** |
| `phenomenonComposition` | Lecture d’épisode | Produit la bonne confirmation | **Conserver** comme autorité lecture |
| `sessionEpisodeLedger` (M19) | Événements / épisodes | Source des collectifs | **Conserver** — socle partagé |
| `monthlyProgramComposition` (M19) | Structure mensuelle | Familles × volume | **Conserver** — améliorer attribution |
| `programVariantContext` | Thèse variantes | Appariement volume (circularité) | **Adapter** — créneau d’abord |
| `claimFromDiscovery` | Claim | Suit le titre courant | **Conserver** |
| `draftFromClaim` | Rédaction depuis claim | Préférait exploration brute → **perte** | **Corrigé** (autorité composition) |
| `applyP6` / wrap | Souveraineté P6 | Ré-explore et peut écraser | **Adapter** — ne plus écraser composition |
| `reviewCollectively` | Passe 4 | Filet ; n’injecte pas toujours de carte | **Adapter** |
| `selectCollectively` | Priorité | Scores mesurables | **Conserver** sans bonus kind |
| Faits / mémoire / export | Registres | Sous-consommés | **Prioriser** prochaine mission |

## Pipeline cible (prompt 2) vs réel

```
Cible : Faits → profils → détection → approfondissement → thèse → preuves → admissibilité → cohérence → classement → présentation → publication

Réel  : Détecteurs (texte inclus) → filtre → F3/F4 (réécriture) → sélection → P6 (claim + draft + revue) → export
```

**Pourquoi la convergence n’a pas eu lieu** : les producteurs hérités ont gardé le droit de rédiger en premier ; P6 a été branché *après* comme couche de validation, pas comme unique autorité de thèse ; chaque mission a ajouté des garde-fous locaux (`shouldPreserveX`) au lieu de déplacer le point d’autorité.

## Point de rupture narratif collectif (v17) — tracé

**Défaut** : titre « confirmation cette semaine », corps « 9 mouvements reviennent autour du 11 nov. »

1. `composeCollectiveReturnReading` produit la bonne conclusion (`phenomenonComposition.js`).
2. `detectDiscoveries` pose `body = composed.conclusion` + `metrics.composition`.
3. `applyP6` → `wrap` → `exploreDiscovery` régénère une conclusion **plate** via `exploreCollectiveReturn`.
4. **`draftFromClaim` / `bodyFromParts`** préfère `exploration.conclusion` → **premier appelant qui perd la lecture**.

Correction M19 : `narrativeAuthority: 'composition'` + `authoritativeBody` + `exploreDiscovery` court-circuite si composition présente.

## Questions franches

- **Pourquoi rédiger avant la thèse ?** Habitude des détecteurs legacy ; coût perçu de tout migrer.
- **Plusieurs autorités narratives ?** detect, F4, draftFromClaim, review — oui.
- **P6 reçoit des candidats déjà filtrés/rédigés ?** Oui.
- **Infos perdues après filtre ?** Cartes hors fenêtre ; consolidations `no_evidence` ; noms si getter absent.
- **Registre de faits peu utilisé ?** Extraction post-cartes ; pas alimenté en amont.
- **Fonctions P6 sous-appelées ?** Hypothèses multi-passes, mémoire, hiérarchie.
- **Simplifier sans tout reconstruire ?** Oui : socle événements + autorité narrative unique + détecteurs comme *proposers* — commencé M19.

## Avis sur l’architecture cible

Le pipeline du prompt 2 est **correct**. Trop coûteux de tout migrer d’un coup. Alternative retenue : **socle séances/épisodes** + **autorité composition** sur 2–3 parcours (collectif, variantes, familles), sans second moteur parallèle.
