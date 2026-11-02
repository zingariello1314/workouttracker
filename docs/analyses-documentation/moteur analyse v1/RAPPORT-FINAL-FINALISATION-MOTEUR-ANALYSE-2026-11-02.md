# Rapport consolidé — reprise de finalisation du moteur d’Analyse

**Date :** 2026-11-02  
**Contrat cache / Worker :** `span8-f70l2` · `f70l2-shell-adaptive-v1`  
**Commit :** aucun (arrêt pour validation humaine)  
**Aucune micro-phase F7.0m+ / aucune ouverture F7.1–F7.5**

---

## G. Verdict

| Critère | État |
|---|---|
| Fiabilité chiffres arcs (Approche A + `calendar_training`) | **Corrigé et testé** |
| Perf producteurs P35 / P36 | **Fortement réduit** (fixture ~1 an) |
| Perf P32b / adhérence / calendrier | **Partiellement réduit** ; P32b reste le goulot n°1 |
| Éditorial (noms vides, carte course générique, libellés séances) | **Corrigé dans le code** ; preuve navigateur partielle |
| Cache IDB multi-périodes | **Code corrigé** ; **preuve reload navigateur non obtenue** cette passe |
| Recette navigateur A–G complète | **Non aboutie** — obstacle auth documenté |
| Tests identité / coop / non-régression | **OK** (commandes ci-dessous) |

**Ce n’est pas une clôture « finalisé / validé ».**  
Le moteur est **réellement plus rapide et plus cohérent** qu’avant cette reprise, avec des cartes plus propres sur fixture et une session live partielle, mais **sans preuve navigateur complète post-correctifs** (auth cassée dans l’environnement agent).

---

## A. Performance avant / après

### Producteurs (fixture `workout-main-jul-oct-2026`, fenêtre ~1 an)

Référence rapportée avant optimisation algorithmique (passe précédente, même fixture lourde) :

| Producteur | Avant (ordre de grandeur) | Après (`f70l2`, mesuré) | Cause dominante | Correction |
|---|---:|---:|---|---|
| P36 | ~47 s | **~236 ms** | rebuilds table jour + agrégats répétés | `dayTableCache` partagé P35→P36 + index reps/date |
| P35 | ~21–27 s | **~240–270 ms** | idem | même cache + `indexRepsEntriesByDate` |
| `computeCalendarMonthSportStats` (×N) | ~31 s cumulés | **~425 ms / 7 appels** | chemins Date + streaks | cache sport + `skipStreak` + ymd string |
| programAdherence | ~21–27 s | **~450 ms** | matrice plan/réalisé | inchangé fonctionnellement ; mutualisé |
| P32b | ~21–27 s | **~1 245 ms** | 3 ledgers W/C/H + matrice | reverseIndex partagé + **matrice partagée** avec adhérence |
| Bundle complet `buildPeriodDiscoveryBundle` | non mesuré proprement | **~3,3 s** | somme ci-dessus | — |

Commande : `npx vite-node scripts/f70l-perf-benchmark.mjs`  
Artefact : `docs/analyses-documentation/moteur analyse v1/f70l2-perf-bench.txt`

**Identité sync vs worker (fixture)** — `npx vite-node scripts/f7-worker-identity.mjs` :

| Période | equal | sync | workerPath |
|---|---|---:|---:|
| today | true | 1,1 s | 0,7 s |
| 7d | true | 1,2 s | 1,2 s |
| 30d | true | 2,5 s | 2,2 s |
| 3m | true | 2,7 s | 2,6 s |
| 6m | true | 2,7 s | 2,7 s |
| 1y | true | 3,2 s | 3,0 s |
| 2y | true | 4,7 s | 4,2 s |
| all | true | 11,6 s | 8,5 s |

### Mesures navigateur froides (références F7.0k vs cette passe)

| Période | Froid F7.0k | Cette passe (navigateur) |
|---|---:|---|
| 7 jours | 8,3 s | **Non re-mesuré à froid après f70l2** (session auth perdue) |
| 30 jours | 8,6 s | **~6,7 s** observés une fois (session live antérieure, Worker déjà chaud possible) |
| 3 / 6 / 1 an / 2 ans | 13–22,5 s | **Timeouts / mesures invalides** dans le script auto (attente « Preparing » + flash empty) |
| All time (session live) | — | Cartes publiées ; LT max observée **~1,5–10 s** sur thread principal (sérialisation / nameMap / analytics) |

**Long Tasks :** toujours hors cible (< quelques centaines de ms). Causes candidates inchangées : payload Worker ~1,5–2 Mo, `buildExerciseNameMapAsync`, analytics calendrier header/full, publication React. **Non éliminées** dans cette passe.

**Cibles produit :**
- Réaction < 100 ms : **observée** sur clic période lorsque le strip réagit (session live).
- Cache mémoire < 200 ms : **non prouvé** après reload.
- Gel UI : **non atteint** (LT encore élevées).
- Réduction froids 6m/1y/2y : **probable côté Worker** (bundle ~3 s fixture 1y) mais **non re-prouvé navigateur froid**.

---

## B. Cache

### Code

- `schedulePersistRecapBundles` : conservation **jusqu’à 24 clés** (plus `slice(-3)`).
- Empreinte / contrat : `f70l2`.
- Isolation compte : `accountScope` + clear au changement.

### Preuves

| Vérification | Résultat |
|---|---|
| Hit mémoire entre périodes (session live partielle) | Observé qualitativement (Today renvoyant contenu All time = **bug d’attente de mesure**, pas preuve de hit) |
| IndexedDB après reload multi-périodes | **Non prouvé** — reload a fait perdre la session authentifiée |
| Invalidations mutations | **Non rejouées** sur profil réel (interdit) ; pas de harness isolé exécuté cette passe |
| Annulation navigation rapide | Couverture tests existants ; **pas de recette D navigateur** |

Obstacle : au reload, `WorkoutTrackerAuthDB.users` contient des enregistrements **corrompus** (objet indexé caractère par caractère autour de l’id). `rememberMe` pointe vers `87d06f9f…` / `zingariello1314`, mais la restauration de session échoue. Aucun mot de passe n’a été contourné ni inventé.

---

## C. Cohérence des chiffres

### Convention retenue — Approche A

- **Dénominateur** des arcs mensuels : jours `calendar_training`.
- **Numérateur** : répétitions **uniquement** sur ces jours (exclut les reps des journées GTG sync partielles non créditées).
- Libellé catalogue `phase_months` : « jours avec reps » (ne prétend plus « séances = jours entraînés »).

### Octobre

| Indicateur | Valeur |
|---|---:|
| Jours `positive_reps` | 16 |
| Jours `calendar_training` | **12** |
| Jours GTG partiels (1, 3, 6, 15) | 4 |
| Reps Approche A (sur 12 jours) | **~4 301** (carte arc live) |
| Ratio | ~358 reps / jour entraîné (cohérent A) |
| Chiffre Calendrier « 14 » | **Non reproduit** sur snapshot actuel ; cause exacte inconnue (ancien cache / ancien algo / autre état) |

### Juillet

- Chemins actuels : **5 827** reps.
- **6 017** : historique non reproduit — **non inventé**.

### 1er novembre

- Live : **418** reps (présentes dans les arcs).
- Tonnage 1 792 kg×reps : non re-vérifié tuile Calendrier cette passe (auth).

---

## D. Qualité des analyses

### Correctifs éditoriaux effectués

1. Horizon « exposition vs reps » : plus de phrases cassées (`Pourtant … continuent`, `a encore marqué`) quand les noms sont vides → skip ou noms filtrés.
2. « Exercice inconnu (202…) » : exclus de la liste `leastChecked` affichée ; pénalité éditoriale `Exercice inconnu`.
3. Densité séances : plus de `contre — auparavant`.
4. Carte générique « Course et renforcement se lisent ensemble » : **ne sort plus** sans contraste réel ; kind marqué faible sinon.
5. `disc_running_gap` : narration **mois par mois (km + sorties)** + trou éventuel (mai→juin→juillet→absence).
6. Flash « Not enough data for this period » : masqué tant que `analyticsProp === null` (chargement).

### Session live (avant perte d’auth) — All time / aperçu

Cartes notables vues : arc octobre (Approche A), trajectoire pompes inclinées, tractions australiennes format, interruption course (horizon), sommeil J-2.  
Faiblesses alors présentes (depuis corrigées dans le code, **non re-vérifiées DOM**) : Exercice inconnu, carte course générique, libellés « 16 séances » octobre, grammaire horizon.

### Replay fixture (`scripts/f5-replay-periods.mjs`) — titres sélectionnés

| Période | # | Points forts |
|---|---:|---|
| 7d | 10 | PR série 12, pompes déclinées vs habitus, push/pull |
| 30d | 14 | GTG hors planning, volume vs période préc., coexistence GTG, régularité weekday |
| 3m | 17 | **arc mensuel**, best month, progressions face pull / élévations |
| 6m | 14 | **arc mensuel**, dips/pompes recul, australiennes format, freq≠volume weekday |

Candidats rejetés : traçables dans `f5-replay-periods.json` (`editorialDecisions` / `blockedBy` autour de `disc_monthly_volume_arc`).

### Avant / après texte (extrait)

**Avant (live All time) — carte faible :**  
« L’ensemble du suivi combine 83 km de course… La course réapparaît à côté du renforcement. »  
Titre : *Course et renforcement se lisent ensemble*

**Après (code) :** cette carte **n’est plus émise** sans contraste km↔reps ; la trajectoire course privilégie `disc_running_gap` chiffrée.

**Avant — arc :** ratio potentiellement 4367/12 (numérateur élargi).  
**Après — Approche A :** 4301 reps / 12 jours entraînés, mécanisme fréquence vs densité explicite.

---

## E. Tests

| Suite | Commande | Résultat |
|---|---|---|
| Arcs mensuels + course | `npx vitest run src/utils/sport/__tests__/monthlyVolumeArc.test.js` | **5/5 OK** |
| Identité Worker | `npx vite-node scripts/f7-worker-identity.mjs` | **8/8 equal** |
| Identité coop | `npx vite-node scripts/f7-coop-identity.mjs` | **allEqual true** (7d, 30d, 2y) |
| F6 non-régression | `npx vite-node scripts/f6-nonregression.mjs` | **allEqual true** |
| Replay éditorial F5 | `npx vite-node scripts/f5-replay-periods.mjs` | OK (écrit fixtures) |
| Bench perf | `npx vite-node scripts/f70l-perf-benchmark.mjs` | OK (~3,3 s bundle 1y) |

Échecs : **aucun** sur ces suites.  
Non exécutés exhaustivement ici : toute la batterie fraîcheur / tonnage / cancel / account-split (hors scripts ci-dessus) — à relancer au besoin.

---

## F. Limites restantes

| Item | Classification |
|---|---|
| Approche A arcs + tests octobre 16→12 | Corrigé et prouvé (tests + live partiel) |
| P35/P36 perf | Corrigé et prouvé (fixture) |
| Partage matrice adhérence↔P32b | Corrigé ; gain ~0,15–0,2 s ; P32b encore ~1,2 s |
| Textes éditoriaux listés §D | Corrigés dans le code ; **DOM post-fix non revu** (auth) |
| Persistance IDB après reload | Corrigé en code ; **non vérifié navigateur** |
| Recette A–G | **Impossible cette passe** : session non restaurable (IDB auth corrompue) |
| Long Tasks 0,8–10 s | **Ouvert** |
| P32b ledgers W/C/H | **Ouvert** (optimisation structurelle restante) |
| Tuile Calendrier 14 vs 12 visuelle | **Non revérifiée** après reload ; 14 non reproduit |
| Invalidations mutations | **Non rejouées** (profil réel protégé) |

---

## Preuves navigateur — tentatives

1. Session live `zingariello1314` ouverte plus tôt : Sport → Récap → Analysis → All time / 30d capturés.  
2. Reload pour preuve cache → écran « Unlock » / home **sans session**.  
3. `momentum:rememberedUserId` présent ; enregistrement utilisateur IDB **illisible** (structure dégradée).  
4. Pas de contournement auth. Pas de mutation profil.

---

## Fichiers touchés (principaux, sans commit)

- `monthlyVolumeArcDiscoveries.js` — Approche A + running gap chiffré  
- `recapP35DayModel.js` / P35 / P36 — cache table jour  
- `calendarMonthSportStats.js` — skipStreak / perf  
- `recapPeriodDiscoveries.js` — partage matrice, cardio contrast-only  
- `recapHorizonEssays.js` — noms / grammaire / leastChecked  
- `recapAnalysisCatalog.js` — libellés jours avec reps  
- `recapEditorialSelection.js` — weak cardio + Exercice inconnu  
- `recapMuscleP32bMetrics.js` / Discoveries — reverseIndex + planMatrix  
- `recapProgramAdherenceDiscoveries.js` — `returnMatrix`  
- `RecapPeriodHighlightsPanel.jsx` — empty flash  
- `useRecapTabMetrics.js` — persistance IDB ≤24 / fingerprint f70l2  

---

*Fin du rapport consolidé — prêt pour validation humaine. Aucun commit effectué.*
