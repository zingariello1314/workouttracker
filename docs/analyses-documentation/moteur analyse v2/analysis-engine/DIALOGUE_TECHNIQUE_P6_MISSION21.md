# Dialogue technique P6 — Mission 21

Pour chaque point : **hypothèse** → **cause démontrée** → **décision** → **preuve**. Avis indépendant en fin de section quand utile.

---

### 1. Pourquoi les GTG étaient-ils encore inclus dans le catalogue classique ?

- **Hypothèse** : filtre de population trop tardif (libellé seulement).
- **Cause démontrée** : `collectLifetimeRepHistory` agrégeait toutes les clés cochées hors `complementary_*` ; les sync GTG restaient dans `reps` sous storageIds classiques. `measureRecapWindow` / exclusive jour déduisait le GTG, mais le catalogue lifetime (familles) ne le faisait pas.
- **Décision** : déduction `classicExclusiveRepsForDay` **à la source** du lifetime history.
- **Preuve** : 3966 → **3881** (−85) sur 23 sep–22 oct.
- **Avis** : correct. Ne pas « corriger » seulement le libellé exporté.

### 2. Les définitions de populations sont-elles une autorité opérationnelle ?

- **Cause** : M20 avait un contrat de réconciliation ; le catalogue lifetime restait une voie parallèle.
- **Décision** : `canonicalAnalyticalPopulations` + exclusive lifetime = **autorité opérationnelle** pour CLASSIC ; INCLUSIVE reste légitime pour le volume général.
- **Preuve** : familles / ledger / faits volume classique alignés sur 3881 / 5803 selon fenêtre.
- **Avis** : encore deux populations volontaires — c’est sain. L’erreur était de les confondre, pas de les unifier.

### 3. Pourquoi l’attribution affichait-elle 100 % ?

- **Cause démontrée** : la métrique exportée mesurait la **couverture de partition** (chaque séance reçoit une case, y compris « non attribué »), pas la part de volume reliée à une vraie famille.
- **Décision** : renommer / exporter `partitionCoverageShare` vs `recognizedVolumeShare` (+ parts séances, structurelle, probable, historique, non attribuée).
- **Preuve** : 30j → partition 100 %, recognized ≈ 51 %.

### 4. Comment distinguer évolution sportive et évolution de couverture ?

- **Décision** : `coverageComparability` (Δ couverture, résidu) ; si caution → `conclusionScope = recognized_sessions_only`.
- **Avis** : pas de seuil universel inventé ; le caution à +20 pts avec baisse du résidu est un garde-fou local, à recalibrer sur d’autres athlètes avant de le durcir.

### 5. Pourquoi les identifiants de phénomène incorporaient-ils la prose ?

- **Cause** : clés dérivées de titres / `conclusionKey` narratifs pour dédoublonner l’éditorial.
- **Décision** : `return_episode|date|p:digest|n:N` ; digest des participants, pas du texte.
- **Preuve** : même `phenomenonId` sur 7d→all ; tests d’absence de mots narratifs.

### 6. Quels registres de mémoire existaient réellement avant cette mission ?

- **Inventaire** : `analyticalMemory` (phenomena, publications, exposures, feedback) existait déjà ; `PhenomenonRegistry` / ledgers de publication côté audit étaient partiels ou non branchés sur le collectif.
- **Décision** : **réutiliser** `analyticalMemory`, pas créer de registre concurrent.
- **Avis** : la dette n’était pas l’absence totale de mémoire, c’était l’absence de producteur vertical qui l’écrit et la lit.

### 7. Comment la mémoire distingue-t-elle faits nouveaux, nouvelle interprétation et reformulation ?

- **Décision** : états (`absent_or_interrupted` → `return_observed` → `confirmed_once` → `reinstalling`) + `transition` (`new` / `confirmed` / `refined` / `revised` / `unchanged`) ; `decideInformativePriority` refuse la priorité si `unchanged` sans nouveaux faits.
- Reformulation seule (même état, mêmes preuves) → pas de nouvelle priorité.

### 8. Comment les corrections historiques invalident-elles une conclusion mémorisée ?

- **Mécanisme** : `knowledgeCutoff` / `knownAt` filtrant confirmations et retours ; simulation d’un cutoff antérieur au 18 nov → pas de `confirmed_once`.
- Une révision (`revised`) quand l’état redevient absent après confirmation.
- **Preuve** : `mission21-chrono-memory.json` (`noFutureLeak: true`).

### 9. Quels effets de la mémoire sont démontrés dans le catalogue publié ?

- Cartes collectif en **priorité** 7d/30d avec `memory.state`, `publicationDecision.newPriorityCard`, `exposureCounted: false`, `sharedFacts` ≥ 21.
- Titres différenciés confirmation (7d) vs réinstallation (30d+) sans changer l’identité de phénomène.

### 10. Quelle simplification architecturale pour terminer P6 ?

- **Avis indépendant** :
  1. Une seule voie d’écriture des faits partagés pour tout détecteur encore « prose-first ».
  2. Persister `analyticalMemory` entre runs UI (profile local déjà prévu) pour que `previousState` vive hors simulation.
  3. Réconciliation catalogue : tester automatiquement `all ⊇ selected` et égalité des `reconciledStrict` dérivés — pas supprimer un indicateur.
  4. Reporter sommeil contextualisé / planificateur découvertes / P7.
  5. Observation DOM authentifiée sur les `phenomenonId` déjà stables.

---

## Orientation proposée — avis

Les deux étapes A→B étaient le bon ordre : une mémoire sur des faits GTG-contaminés ou des IDs textuels aurait cimenté la dette. La livraison verticale collective est suffisante comme première preuve ; généraliser trop tôt diluerait la clôture ASPECT.
