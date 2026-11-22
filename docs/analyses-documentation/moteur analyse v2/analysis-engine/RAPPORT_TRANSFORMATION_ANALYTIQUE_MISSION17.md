# Mission 17 — Rapport de transformation analytique

Édition : `p6-sovereign-v16`. Baseline : `p6-sovereign-v15`. Aucun commit.

---

## 1. Collectif — composition temporelle d’épisode

### Problème
v15 : `gapDays=28`, `date=2026-11-11`, preuve `dates=[2026-11-18]` sur Face pull / Élévations / Arnold / Kickbacks / Extensions / Pseudo-planche. **0** `disc_collective_return`.

### Cause racine
Pas le gap. Le lien structurel : 3 familles musculaires + `sessionFamilyId` hétérogènes → `exploreCollectiveReturn` refusait le collectif faute de lien retenu (simultanéité seule insuffisante). De plus, la confirmation (18) pouvait être confondue avec la reprise (11).

### Correction
- Hypothèse `shared_return_cooccurrence` (≥50 % des reprises le même jour).
- Identité d’épisode : `returnDate` / `lastBefore` / `confirmationDates`.
- `readingMode` : `return` vs `confirmation` selon la fenêtre.
- Gaps de consolidation (`mechanism` resume + ≥21 j) non invalidés par cadence estimée.

### Textes

**Avant (v15, individuel)**  
> Face pull: un ancien niveau est retrouvé  
> Sur ces 7 jours, face pull retrouve un ancien niveau autour de 60 répétitions…

**Après (pack synthétique, mode confirmation)**  
> La reprise de cette composante de tes séances, commencée le 2026-11-11 après environ 4 semaines d’interruption, se confirme le 2026-11-18 : Face pull, Élévations latérales, Développé Arnold…  
> N retrouvent un volume proche… M restent en retrait…

### Contre-exemple
Trois reprises sur trois dates / trois familles sans co-occurrence majoritaire → non conclu.

---

## 2. Variantes — direction et greffe

### Problème
> « La baisse de moyenne… passe d’environ 30 à 34 (+14 %). »  
> Titre : « Pompes pseudo-planche s’efface de ton tronc : le mélange de variantes explique la moyenne »

### Corrections
- Direction déterminée par le signe de `globalDeltaPct` avant rédaction.
- `isVariantMixCompatibleDiscovery` : refuse parts musculaires et reprises de format.
- Titre reconstruit depuis le nom d’exercice + direction (hausse/baisse/redistribution).
- Occurrences non appariées verbalisées.

### Textes

**Avant**  
> La baisse de moyenne ne traduit pas un recul… 30 → 34 (+14 %).

**Après**  
> La hausse de moyenne ne traduit pas une progression de capacité sur chaque variante. 30 → 34 (+14 %). …

---

## 3. Faits atomiques

### Problème
`day:2026-11-18|totalReps|…|2026-11-15|2026-11-21` = 1340 (semaine entière).

### Correction
Sujet `period_volume:start:end` dès que la fenêtre > 1 jour. `day:` réservé aux totaux journaliers.

### Population
`assertionClaimKey` sérialise `population.label|id|key` — plus de `pop:[object Object]`.

---

## 4. Exports / mission

`analysisMissionLabel()` dérive Mission N depuis `p6-sovereign-v(N-1)`. Plus de hardcode Mission 15/16 dans RecapTab / audit / dossier.

---

## 5. Non clos

Décomposition mensuelle par familles, adhérence packs versionnés pipeline, mémoire, sommeil, fingerprint multi-sources, rejeu 8 horizons live, évaluation qualitative indépendante.
