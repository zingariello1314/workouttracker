# Registre des défauts et régressions

## ISS-2026-11-04-VOL-SHAPE

- **Symptôme :** `disc_volume_shape` publié ; `span_volume_vs_frequency` produit mais absent du DOM
- **Gravité :** haute (meilleure interprétation perd)
- **Cause :** chemins catalogue vs découvertes ; IV / poids / kinship ne rivalisaient pas le phénomène volume global
- **Fichiers :** `recapCardKinship.js`, `recapAdaptiveInsights.js`, `recapEditorialSelection.js`, `recapPeriodSelection.js`
- **Correction :** rivalité `global_volume` ; boost span ; pénalité shape
- **Tests :** kinship volume rivalry ; IV span > shape
- **Statut :** corrigé + tests (validation navigateur à refaire)

## ISS-2026-11-04-RETURN-42-77

- **Symptôme :** deux cartes relevés genoux (42 j et 77 j) dans le même récap
- **Cause :** collapse priorisait `id:` ; `sameHistoricalEpisode` exigeait même storage id ; buckets gap med/long distincts
- **Fichiers :** `recapPeriodSelection.js`, `recapEditorialIdentity.js`, `recapPhenomenonContract.js`, `recapCardKinship.js`
- **Correction :** clé primaire nom normalisé ; famille de mouvement pour reprises ; `gap:return` unique ; blob suffit en kinship
- **Statut :** corrigé + tests

## ISS-2026-11-04-DIPS-REFERENTS

- **Symptôme :** même carte F4 : attribution ~30 reps/séance « proche » + early/late 20→48
- **Cause :** `buildObservation` utilisait shape early/late pendant que `buildMechanism` citait les moyennes fenêtre
- **Fichiers :** `recapComposedNarration.js`, `recapComposedEvidence.js`
- **Correction :** si `frequency_driven` + perNear → observation sur fenêtres ; hard issue `per_session_stable_vs_arc_swing`
- **Statut :** corrigé + tests

## ISS-2026-11-04-EMPTY-WINDOW-LESTEES

- **Symptôme :** analyses « Pompes lestées » / gilet sans séance dans la fenêtre
- **Cause :** progress/journey hors activité fenêtre
- **Correction :** `recapDiscoveryPeriodScope` + filtres horizon
- **Statut :** corrigé antérieur (tests periodScope / gate / horizon)

## ISS-2026-11-04-DELTA-387

- **Symptôme :** exports 4502 vs 4889 (Δ387) sur 7j et 30j
- **Cause documentée :** journée 2026-11-02 absente/incomplète selon snapshot — pas un bug d’agrégat à « égaliser »
- **Statut :** documenté ; ne pas corriger artificiellement les totaux

## Ouverts

- Cycle de vie record J1→J6 (persistance artificielle)
- Réserve publiable persistante complète
- Plans temporels multi-stratégies généralisés 6m+
- Console : comparaison A/B fiable quand signatures / DOM vides
