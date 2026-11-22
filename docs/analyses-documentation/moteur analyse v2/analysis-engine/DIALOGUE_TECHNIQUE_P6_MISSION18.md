# DIALOGUE TECHNIQUE P6 — Mission 18

Perspective **code** (Cursor) face à la vision **ASPECT / exports** (ChatGPT).  
Faits / hypothèses / contraintes / recommandations distingués. Aucun commit. NO-GO P7.

---

## 1. Architecture générale — chemin réel

### Chemin principal (fait)

Donnée sport (`reps` / `checkedExercises` / logs)  
→ `buildPeriodDiscoveryBundle` (`recapPeriodDiscoveries.js`)  
→ `detectDiscoveries` (+ packs P3.x, structure, adhérence)  
→ filtre de portée fenêtre  
→ F3 preuves composées + F4 narration  
→ sélection éditoriale → gate → validation  
→ **`applyP6`** : `claimFromDiscovery` → `exploreDiscovery` → `draftFromClaim` → consolidation → **`reviewCollectively`** → **`selectCollectively`**  
→ export / audit.

### Chemins concurrents / legacy (fait)

- Nombreux détecteurs spécialisés dans `detectDiscoveries` (volume, sommeil, pics, consolidations…).
- Packs isolés P3.2b / P3.5 / P3.6 parfois exclus du pool.
- Shadow consolidations (`runExerciseFormatConsolidationShadow`) puis injection dans `out`.
- `reviewCollectively` peut **réexplorer** sans jamais injecter une nouvelle carte collective (filet faible).

### Ce qui est réellement « souverain »

`applyP6` + identité de publication + dispositions. Mais une grande partie de l’intelligence reste **avant** P6, dans des détecteurs qui produisent déjà titre/corps.

### Modules qui modifient après raisonnement initial (fait)

F4 narration, polish, `draftFromClaim` dans wrap P6, revue collective (corps depuis `exploration.conclusion`), sélection.

### Producteurs de texte sans thèse (fait)

Oui : beaucoup de `discovery({ title, body })` directs dans `detectDiscoveries`. La thèse structurée arrive souvent *après*, ou jamais.

### Composition sans régénération de texte (fait)

Oui — c’était la cause des thèses fantômes `variant_mix_shift` (métadonnée OK, F4 écrase le prose).

### Qualité d’architecture (avis)

**Accumulation de détecteurs + passes correctives**, pas un moteur de raisonnement transversal unique. Les missions P6 ont empilé des garde-fous utiles mais ont augmenté la surface de divergence texte/thèse/sélection.

---

## 2. Intelligence et exploration

| Question | Réalité code |
|---|---|
| Recherche de découverte | Détecteurs spécialisés + shadow consolidations |
| Hypothèse | `analyticalExploration` (hypothèses statusées) — **peu** de kinds y passent vraiment |
| Rapprochement de faits | Surtout post-hoc (revue, équivalence sémantique, co-occurrence) |
| Décision d’explorer plus | `reviewCollectively` (max reexplore limité) |
| Individuel vs collectif | Collectif dérivé des **cartes** déjà produites, pas d’un graphe de séances |

**Avis** : ce n’est **pas** un vrai raisonnement transversal opérationnel ; c’est une **batterie de détecteurs** avec quelques modules d’exploration. Théoriquement `exploreCollectiveReturn` / compositions existent ; en pratique elles étaient court-circuitées (dilution, F4, review incomplet).

**Proposition architecturale ciblée (recommandation)** :  
introduire un **registre d’événements de séance** (date, exercices, famille, gap) **avant** les cartes, puis dériver individuels + collectifs depuis ce registre. Moins de correctifs locaux, plus de cohérence. Preuve nécessaire : rejeu 7j/30j avec le même backup.

---

## 3. Collectif — pourquoi les missions précédentes ont échoué

| Mission | Hypothèse | Code | Ce qui a marché | Ce qui a manqué | Tests verts pourquoi |
|---|---|---|---|---|---|
| 16 | Exposer gapDays | metrics consolidations | Export montre gap | Collectif dilué / non poussé | Tests sur 2–3 events isolés |
| 17 | Co-occurrence + reprise≠confirmation | `shared_return_cooccurrence`, readingMode | Trace offline sur 9 cards → conclu | Pool live = tous les retours → under_explored ; review sans gap | Fixtures sans dilution multi-mois |
| 18 | Cluster + preuve fenêtre + review | cluster + claimDatesFor + review | **30j rejeu : collectif Nov 11 sélectionné** | 7j sans 18 nov. ; 4 ids insufficient | — |

**Avis méthode** : partir des **cartes individuelles** est fragile (filtre `publish`, fenêtre, F4). Mieux : **épisodes temporels / séances**, puis cartes. Risque de régression : double publication si on garde aussi l’ancien chemin — il faudrait un seul producteur.

---

## 4. Programme

- Graphe / schedule : utile pour variantes et slots ; **hybride** partiellement compris.
- Variantes vs substitutions : proximity volume → biais circulaire reconnu dans les limitations.
- Exercices multi-créneaux : `dayKey` joint (`a+b`) — grossier.
- Séance incomplète : matching probable existe ; peu promu en conclusion.
- Cycles sans prescription : reste descriptif — correct.
- Limites données : journal programme incomplet, Nov 18 absent du backup 19.
- Limites implémentation : composition mensuelle par familles **non branchée**.

**Gain/complexité (recommandation)** : ledger de séances × famille × volume sur 30j, une seule carte « structure du mois », enfants = familles. Réutilise catalog + session family déjà là.

---

## 5. Rédaction et cohérence

Construction actuelle : titre/corps souvent **avant** claim final ; `draftFromClaim` peut réaligner dans P6 ; F4 peut **désaligner** à nouveau.

**Meilleure architecture sans nouveau module** :  
règle unique — *si `metrics.thesis` ou composition programme/collectif est posée, aucune narration ultérieure ne peut modifier title/body sans reconstruire le claim*. C’est ce que commence `shouldPreserveProgramThesis`.

---

## 6. Sélection

Priorité ≈ informativeValue + éditorial + P6 marginal. Favorise des signaux **mesurables** (volume, pics, consolidations) plus que des explications structurelles — d’où 11 cartes souvent « remplies » et mix en réserve.

**Recommandation** : bonus marginal explicite pour `program_variant_mix` / `disc_collective_return` quand thèse alignée ; fusion peak obligatoire.

---

## 7. Validation — pourquoi tests verts / produit rouge

| Couche | Écart |
|---|---|
| Fixtures | Peu d’événements, pas de dilution mai→nov |
| Entrées réelles | Backup incomplet vs app live |
| Fonctions unitaires | Testent le happy path |
| Pipeline | F3/F4/sélection après |
| Export | Slim cards, candidats raw ≠ publication |

**Méthode proposée** : script `m18-replay-collective.mjs` (déjà) + assert « au moins un `disc_collective_return` sur 30j si ≥3 reprises même jour » + golden titres sur audit. Économique, sans navigateur.

---

## 8. Dette technique (faits + reco)

Chevauchements : exploration / composition / F4 / draftFromClaim.  
Correctifs locaux empilés (M13–M17).  
Ne rien supprimer sans blast radius (`graft callers`).

Simplification recommandée : **un registre d’épisodes** + **autorité narrative unique** (ci-dessus).

---

## 9. Avis technique indépendant (10 questions)

1. **Limitation principale** : pas de couche d’événements partagée ; détecteurs isolés + passes qui se contredisent.
2. **ChatGPT se trompe-t-il ?** Parfois sur la *couche* (seuils vs dilution ; « co-occurrence absente » alors qu’elle était présente mais noyée). Le diagnostic produit (0 collectif) était juste.
3. **Complexification inutile ?** Oui : multiplier les flags (`gapProven…`) sans cluster d’épisode. Non : distinguer reprise/confirmation.
4. **Solution plus élégante** : registre d’épisodes → conclusions.
5. **3 changements effort/gain** : (a) cluster épisode — **fait** ; (b) préserver thèse vs F4 — **fait** ; (c) ledger familles mensuel — **à faire**.
6. **Fondations à garder** : consolidations format, claims, identité publication, export audit, compositions.
7. **À modifier** : ordre detect→F4→P6 ; filet review ; origine des collectifs.
8. **Pourquoi tant de missions ?** Validation sur fixtures ≠ produit ; chaque mission corrige un symptôme sans rejeu moteur obligatoire sur backup.
9. **Travail restant** : confirmation 7j (snapshot), L3 familles, mémoire, faits, fingerprint, hiérarchie DOM, aveugle humain — **plusieurs missions** si on reste incrémental ; **1–2** si registre d’épisodes.
10. **Décisions à trancher avec ChatGPT** : origine collectifs (séances vs cartes) ; un vs N collectifs ; obligation backup frais ; priorité L3 vs mémoire.

---

## 10. Problème examiné — Collectif Nov 11 (template §1)

1. **Procède** : consolide → `returnEvents` → `exploreCollectiveReturn` → push carte.  
2. **Pourquoi** : composer une transformation collective à partir des reprises.  
3. **Reçoit** : cartes à gap / mechanism.  
4. **Cherche** : fenêtre courte + lien (co-occurrence / famille / séance).  
5. **Ne cherche pas** (avant M18) : le **meilleur épisode** parmi plusieurs dates.  
6. **Produit** : 0 ou 1 `disc_collective_return`.  
7. **Consommé par** : sélection / P6 / export.  
8. **Transformations** : readingMode, composeCollectiveReturnReading, F4 (préservé désormais).  
9. **Défaut** : dilution + claimDatesFor + review sans gap.  
10. **Solutions** : cluster ; événements séance ; baisser seuils (rejeté sans cause).  
11. **Reco** : cluster + score fenêtre (**implémenté**) ; ensuite registre séances.

🌱 graft saved ~246k tokens this turn (approx. sum of graft_find_* savings reported this turn).
