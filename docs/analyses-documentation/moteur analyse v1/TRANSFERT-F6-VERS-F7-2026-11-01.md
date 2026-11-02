# Transfert F6 → F7 (recette finale)

**Ne pas engager F7 ici.** Points à valider en recette humaine.

## Performance restante

- **F7.0 / F7.0c :** Long Tasks + publication atomique. Voir `RAPPORT-F7.0-VALIDATION-RESIDUELLE-2026-11-01.md` et `RAPPORT-F7.0c-PUBLICATION-ATOMIQUE-2026-11-01.md`. Cartes provisoires (pistes legacy) éliminées côté code ; D (chunks sync) et E (console) en attente validation. Remesure navigateur bloquée (Unlock the app).
- **Profil live (~10 mois force) :** 7j/30j/6m OK (~1–2 s) ; **2y / All time** toujours coûteux en CPU (chunk discoveries) — dette.
- Énumérations calendaires sur grandes fenêtres (`enumerateDatesInclusive` dans calendarLoad / adhérence / UI) — corriger seulement avec preuve d’identité.
- Croissance superlinéaire synthétique 1–2 ans — hors charge propriétaire actuelle ; garder en dette.
- Guest navigateur encore NV ; mutations fraîcheur à rejouer sur compte de test.

## Éditorial / identité (reportés)

- Lisibilité homonymes (F5.1 partiel).
- Identités historiques indéterminées.
- Familles sans composition profonde.
- Défauts éditoriaux résiduels hors perf.

## Fraîcheur UI

- Valider manuellement bascule compte A→B (aucune flash d’analyses A).
- Valider retour onglet Analyse sans recalcul inutile si données inchangées.
- Valider course async période longue → courte (genRef).

## Fixtures manquantes

- Profil live multi-années.
- Mutations UI complètes A–G dans navigateur.
- Garmin sync bout-en-bout.

## Non régression à rejouer

`npx vite-node scripts/f6-perf-vs-identity.mjs` ← **critère bloquant** (exit ≠ 0 si régression silencieuse)  
`npx vite-node scripts/f6-nonregression.mjs`  
`npx vitest run src/utils/sport/__tests__/recapF6PerfFreshness.test.js`

Rapport : `RAPPORT-F6-PERF-VS-IDENTITE-2026-11-01.md`
