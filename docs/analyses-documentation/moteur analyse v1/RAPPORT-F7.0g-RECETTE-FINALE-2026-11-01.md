# F7.0g — Recette finale de fluidité

**Date :** 1er novembre 2026  
**Profil :** `zingariello1314` (lecture seule)  
**Aucun commit** — F7.1 non engagé  

---

## Verdict

| Question | Réponse |
|---|---|
| Les ~7 s sur 7j (cache chaud / IDB) sont-elles corrigées ? | **Oui** — mesuré **122–234 ms**, LT 0 |
| 2y → 7j pendant calcul reste-t-il fluide ? | **Oui utilisable** — prêt **~329 ms**, pressed **~493 ms** (vs ~814 ms F7.0f) |
| Console diagnostic hors gel ? | **Oui fonctionnel** — résultat OK ~4,5 s ; LT max **~1,0 s** (clone) ; navigation sections pendant calcul **OK** |
| Identité analytique ? | **Préservée** — `f7-worker-identity` 8/8 ; coop ; F6 ; Vitest 22/22 |
| Clôturer F7.0 comme « site premium parfait » ? | **Non absolu** — pressed ~0,5–0,9 s encore possible ; shell sync résiduel ; diagnostic LT ~1 s |
| Clôturer F7.0 comme « fluidité quotidienne acceptable » ? | **Oui, sous réserve de ta validation manuelle** |

---

## 1. Corrections F7.0g appliquées

| Correctif | Détail |
|---|---|
| i18n | `recap.analyse.loadingInsights` (+ emptyWindow, cardioBlock, bestRuns, unnamedExercise) FR/EN |
| Annulation | **Terminate immédiat à chaque changement de période** (soft-cancel insuffisant pendant sync Worker) ; soft-cancel conservé pour flips Garmin |
| Shell | Moins de `publishShell` intermédiaires ; yields avant sync pour laisser peindre la période |
| Tests | `recapWorkerCancel.f70g.test.js` |

**Hors scope Momentum (console navigateur jointe) :**  
`contentscript.js` MaxListeners / ObjectMultiplex = extension navigateur (ex. wallet).  
WebGL incomplete framebuffer = fond 3D / overlay taille 0, pas le moteur Analyse.

---

## 2. Tableau recette (profil réel)

| Scénario | Réaction | Résultat final | LT max | Cache | Cause lenteur résiduelle | Verdict |
|---|---:|---:|---:|---|---|---|
| Reload + Analyse 7j (IDB) | pressed **26–39 ms** | **122–234 ms** | **0** | hit IDB/mémoire | — | **OK** |
| Structure Analyse | **~150–344 ms** | — | ≤326 | — | montage Suspense | **OK** |
| 30j → 2y → 7j (mid) | pressed7 **493 ms** | **329 ms** | **600** | hit 7j | shell sync concurrent | **OK** |
| Snapshot → Analyse | — | **37 ms**, 20 cartes | 0 | hit | — | **OK** |
| Console ouverture | — | visible immédiat | 0 | — | — | **OK** |
| Console « Lancer diagnostic » | sections cliquables pendant run | **~4,5 s** | **1032** | miss | structured clone payload | **OK** (plus de gel 15 s) |
| Relance diagnostic | — | **~3,7 s** | — | — | idem | **OK** |

### Pourquoi ~7 s avant ?

**Prouvé (F7.0f/g code + live) :**  
1. Terminate Worker à chaque flip Garmin → recalcul jetable.  
2. Clone snapshot/Garmin massif sur le thread principal.  
3. Shell assessment/enrichment sync + calendrier pendant loading.  
4. Cascades React (`propsEpoch` / multi-publishShell).

**Corrigé pour le parcours quotidien cache/IDB.**  
Un **vrai miss froid mémoire sans IDB** (fixture / autre compte) n’a pas été forcé ici (données utilisateur non effacées).

---

## 3. Annulation Worker

| Mode | Quand | Effet |
|---|---|---|
| Soft-cancel | Cleanup / Garmin-only | Message CANCEL + ignore publication |
| Terminate | **Tout changement de période** | CPU coupé — 2y ne retarde plus 7j |

Soft-cancel seul **ne peut pas** interrompre une fonction sync dans le Worker : d’où le terminate ciblé période (sans revenir aux terminates Garmin).

---

## 4. Identité & fraîcheur

```
f7-worker-identity     allEqual true (8 périodes)
f7-coop-identity       allEqual true
f6-perf-vs-identity    selectedEqual true
f6-nonregression       OK
vitest (publication, fenêtre, cache, cancel, fraîcheur, pipeline) 22/22
```

---

## 5. Limites restantes

1. `aria-pressed` parfois **0,5–0,9 s** si le shell sync d’une période précédente occupe encore le main thread.  
2. Diagnostic console : LT **~1 s** au lancement (clone) — acceptable vs sync total, pas encore &lt;100 ms.  
3. Premier miss froid « sans aucun cache » non mesuré volontairement (pas d’effacement données).  
4. Shell (`assessment` / `enrichment`) toujours partiellement sur le thread UI.

---

## 6. Demande de validation

1. Sur ton usage : les **7 secondes sur 7j** ont-elles disparu ?  
2. Les changements de période te semblent-ils naturels ?  
3. Console : le diagnostic te convient-il (réactif pendant le calcul) ?  
4. Autoriser **clôture F7.0** + éventuel commit sur demande explicite ?

**Aucun commit. F7.1 non engagé.**
