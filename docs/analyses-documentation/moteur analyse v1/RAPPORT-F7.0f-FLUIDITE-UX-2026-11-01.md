# F7.0f — Fluidité globale, navigation instantanée, blocages Analyse

**Date :** 1er novembre 2026  
**Profil live :** `zingariello1314` (lecture seule)  
**Aucun commit** — F7.1 non engagé  

---

## Verdict critique (fluidité réelle)

| Critère ressenti | Avant F7.0f (retour user / F7.0e) | Après F7.0f (mesures live) | Verdict |
|---|---|---|---|
| Arrivée analyses 7j | ~7 s (user) ; jusqu’à **20 s** LT mesurée en début de passe | Cache chaud **~108 ms** | **Fort gain** |
| Changement de période | Impression de bug / lourdeur | 30j prêt ~**269–2,2 s** ; LT max **~259 ms** | **Amélioré** |
| Retour 7j après autre période | Lent / recalcul | ~**292 ms** (mesure wait) | **Proche cible 200 ms** |
| 2y → 7j rapide | Gel / retard | prêt **~110 ms** ; pressed ~**814 ms** ; LT max **527 ms** | **OK utilisable** |
| Analyse ↔ Snapshot | Non vérifié avant | retour Analyse **~51 ms**, **0 LT** | **OK** |
| Console ouverture | OK F7.0e | **~309 ms**, 0 LT, structure + CTA | **OK** |
| Diagnostic console | Sync gelant | Worker dédié (à valider au clic « Lancer ») | **Corrigé code** |
| Sensation « site moderne » | Non | Beaucoup mieux à chaud ; froid / premier Worker clone encore à surveiller | **Partiel** |

**F7.0 n’est pas déclaré « terminé sensation site premium » de façon absolue**, mais l’objectif « ne plus reconstruire à chaque clic / ne plus subir 7–20 s sur 7j » est **largement traité** sur session chaude.

---

## 1. Diagnostic expérience (mesuré)

### Chronologie problématique identifiée (code + live)

1. Clic période → `inputKey.full` change (Garmin bit / pending).  
2. Cleanup effect → **`terminateAdaptiveInsightsWorker`** (F7.0e) tuait le calcul en cours.  
3. Relance shell sync + **structured clone** snapshot/Garmin complets → Long Tasks **jusqu’à 20 s** observées en début de F7.0f.  
4. Calendrier analytics sync au changement de période pendant loading.  
5. `propsEpoch` incluant `computing` → rebuild de **toutes** les vues Recap à chaque flip.

Ce n’était pas « seulement assessment/enrichment » : c’était surtout **invalidation + terminate + clone + rendus en cascade**.

---

## 2. Corrections appliquées

### Cache prioritaire
- Hit exact → publish immédiat, aucun Worker.  
- Hit workout → cartes **ready** immédiatement ; refresh Garmin en fond (`refreshing`) sans flash vide.  
- Soft-cancel au cleanup ; **terminate** seulement si changement de période lourde.

### Worker
- Soft-cancel par défaut ; `forceTerminate` ciblé.  
- Payload slim (`stripForCache`, Garmin fenêtré).  
- `queueMicrotask` avant `postMessage` pour laisser passer le paint.

### UI / React
- Calendrier header/full **différé** tant que loading insights.  
- Dates = `periodWindow` (cohérence F7.0e conservée).  
- `propsEpoch` séparé Analyse vs autres vues.

### Console
- Diagnostic via `recapDiagnostic.worker.js` (plus de sync bloquant au clic Lancer).  
- Annulation au unmount.

---

## 3. Mesures navigateur (profil réel, session chaude)

| Scénario | Résultat | LT max |
|---|---:|---:|
| 7j (cache) | **108 ms** | 0 |
| 7j → 30j | prêt ~269 ms (wall ~2,2 s) | **259** |
| 30j → 7j | ~292 ms | 247 |
| 30→2y→7 rapide | prêt **110 ms** ; pressed **814 ms** | **527** |
| Snapshot → Analyse | **51 ms** | 0 |
| Ouvrir console | **309 ms** | 0 |

Référence début de passe F7.0f (avant correctifs) : 7j **readyAt ~20 274 ms**, LT **20 034 ms**.

---

## 4. Tests

```
recapInsightsPublication.f70c     OK
recapPeriodWindowCoherence.f70e   OK
recapCacheFirst.f70f              OK
recapF6PerfFreshness              OK
recapInterpretationPipeline       OK
f7-coop-identity                  allEqual true
f6-perf-vs-identity               OK (selectedEqual)
```

`f7-worker-identity` non rejoué intégralement dans cette passe (coût) — chemin métier inchangé hors shell/cache/client Worker.

---

## 5. Limites restantes

1. **Premier accès froid** (Worker + clone + shell) non re-mesuré aussi bas que 108 ms — le gain cache suppose un passage préalable.  
2. **pressedAt ~800 ms** encore possible en spam de périodes (objectif &lt;100 ms non garanti).  
3. Shell (`assessment` / `enrichment`) encore sur le thread UI pour les misses.  
4. Diagnostic console Worker : non chronométré au clic « Lancer » dans la recette (ouverture seule).  
5. Sensation subjective « zéro saccade » : LT ~250–500 ms peuvent encore se sentir sur machines lentes.

---

## 6. Demande de validation

1. Sur ton parcours manuel : les **7 secondes sur 7j** ont-elles disparu en session normale ?  
2. Les changements de période te semblent-ils enfin naturels (plus « bug ») ?  
3. Autoriser un commit F7.0e+f si OK ?  
4. Suite éventuelle (hors F7.1 métier) : slim shell / prewarm cache à l’entrée Recap ?

**Aucun commit. F7.1 non engagé.**
