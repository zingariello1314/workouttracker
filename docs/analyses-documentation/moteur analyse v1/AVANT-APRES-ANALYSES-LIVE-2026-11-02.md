# AVANT / APRÈS — Analyses live (cartes + timings)

**Date :** 2 novembre 2026  
**Profil :** `zingariello1314` (lecture seule, aucune mutation des données)  
**Navigation :** Accueil → **Sport** (pas de scroll Dashboard) → Recap → Analysis  
**Mesures :** `window.__f70iPub` + Long Tasks + textes DOM  
**Fichiers bruts :** `_capture-before-raw.json`, `_capture-after-raw.json`

Le détail code / réconciliation / tests est dans  
`RAPPORT-FINAL-FINALISATION-MOTEUR-ANALYSE-2026-11-02.md`.

---

## 1. AVANT (baseline)

Contrat : `span7-f70j` / `f70j-shell-adaptive-v1`

### 1.1. Timings (froid sauf retour Toujours)

| Période | Apparition | Cartes | Source | Worker ms | nameMap | LT max |
|---|---:|---:|---|---:|---|---:|
| 7 jours | **6 024 ms** | 10 | worker | 3 664 | hit | 1 092 |
| 30 jours | **14 790 ms** | 15 | worker | 11 345 | hit | 1 189 |
| 3 mois | **111 199 ms timeout** | **0** | aucun `publish_final` | — | — | 1 196 |
| 6 mois | **10 460 ms** | 18 | worker | 9 197 | hit | 805 |
| 1 an | **13 406 ms** | 17 | worker | 11 082 | hit | 773 |
| 2 ans | **15 430 ms** | 17 | worker | 13 385 | hit | 802 |
| Toujours (1er de session) | ~17–19 s | 10 | worker | 16 727 | **miss 1 760 ms** | — |
| Toujours (retour) | **1 204 ms** | 10 | **exact** | — | — | 747 |

### 1.2. Titres AVANT (extraits exacts `__f70iPub`)

**7 j :** « La séance du 1 novembre 2026 concentre… », « Exercice 504 revient… », jalon sommeil, pas, « un mouvement : recul puis retour… »

**30 j :** GTG hors planning, **rythme sommeil coucher 4 h 59**, « Le volume du mois dépasse… », « Jours habituellement actifs », GTG/classiques…

**6 m / 1 an / 2 ans :** titres dominants « … a un volume et un rythme, **pas seulement un total** », GTG, « Course et renforcement se lisent ensemble », sommeil, **pas d’arc juin→octobre mécanique**.

**Toujours :** « Le trimestre a un volume et un rythme, pas seulement un total », « Les trois derniers mois ont une trajectoire interne », « juin 2026 concentre… »

### 1.3. Faiblesses AVANT
- Pas d’explication fréquence vs volume/jour sur le recul multi-mois.  
- Sommeil générique prend des slots.  
- Titre brut « Exercice 504 ».  
- **3 mois : échec total de publication** sur la mesure.

---

## 2. APRÈS (même profil, après correctifs)

Contrat : `span8-f70k` / `f70k-shell-adaptive-v1`

### 2.1. Timings froid puis cache

| Période | Après froid | Après cache (re-clic) | Cartes froid | Source froid | LT max froid | Worker froid | Worker relancé sur hit ? |
|---|---:|---:|---:|---|---:|---:|---|
| 7 jours | **8 344 ms** | **988 ms** | 10 | worker | 1 234 | 3 904 | **Non** (exact) |
| 30 jours | **8 607 ms** | **1 740 ms** | 15 | worker | 1 104 | 5 843 | **Non** (exact) |
| 3 mois | **13 004 ms** | — | **14** | worker | 1 139 | 10 268 | — |
| 6 mois | **15 386 ms** | — | 16 | worker | 1 176 | 12 571 | — |
| 1 an | **18 634 ms** | — | 15 | worker | 1 167 | 15 819 | — |
| 2 ans | **22 468 ms** | — | 15 | worker | 1 164 | 19 581 | — |
| Toujours | ~premier ready session puis **exact** | **718–1 261 ms** | **13** | exact / worker selon gen | ≤1 240 | — | **Non** sur hit exact |

**Écarts notables :**
- **3 mois réparé** : 0 carte / timeout → **14 cartes en 13 s**.  
- **30 j plus rapide** : 14,8 s → **8,6 s**.  
- 7 j un peu plus lent à froid sur cette mesure (nameMap miss 1,7 s en tête de séquence après reload).  
- Hits exact **< 2 s**, worker **non relancé**.  
- LT max toujours ~1,1–1,2 s (pas multi-secondes shell, mais résiduelles).

### 2.2. Carte phare APRÈS (texte exact — 6 m / 1 an / 2 ans / Toujours)

**Titre :** `octobre 2026 interrompt la baisse depuis juin 2026`

**Corps :**  
`juin 2026: 6 947 reps en 22 jours entraînés (≈316 / jour actif) → septembre 2026: 3 728 reps en 13 jours (≈287 / jour actif), soit -46 % de volume, -41 % de jours, -9 % de volume par jour actif. La baisse vient surtout de la fréquence (environ 82 % du mouvement mesurable), pas d’un effondrement du volume par journée active. octobre 2026 remonte à 4 367 reps en 16 jours (≈273 / jour actif, +17 % vs septembre 2026), sans retrouver le sommet de juin 2026 (6 947 reps).`

→ C’est exactement le type de mécanisme demandé (fréquence dominante, reprise partielle sans faux sommet).

### 2.3. Autres titres APRÈS observés (Toujours, 1ʳᵉ publication session)

- Mer tient mieux que Jeu  
- La course a glissé hors de ta routine, pas toute ton activité  
- octobre 2026 interrompt la baisse depuis juin 2026  
- juin 2026 concentre la part la plus productive de la période  
- Tractions australiennes : un format plus volumineux se maintient  

### 2.4. Titres APRÈS encore faibles (limites honnêtes)

- « Exercice 504 revient après un long silence » (7 j) — résolution de nom manquante.  
- « [OBJECT OBJECT] » encore visible dans des corps P36 (Jours habituellement actifs / GTG).  
- « La période n’est pas un seul total » peut encore coexister selon nature/slots (rivalité cross-nature renforcée après la 1ʳᵉ capture).  
- Carte sommeil rythme encore présente sur 30 j (budget week=2).  

---

## 3. Tableau synthétique

| Critère | Avant | Après |
|---|---|---|
| Arc juin→sept→oct | Absent | **Présent + chiffré + mécanisme fréquence** |
| 3 mois | Timeout / 0 carte | **14 cartes / 13 s** |
| Cache exact re-clic | Oui (Toujours) | Oui (7 j, 30 j, Toujours) **< 2 s** |
| nameMap 1er appel | ~1,8 s | ~1,7 s si miss ; **0 ms** si hit |
| Sommeil month/long | budget 2 | budget **1** |
| Intelligence multi-mois | Portraits vagues | Producteur `disc_monthly_volume_arc` |
