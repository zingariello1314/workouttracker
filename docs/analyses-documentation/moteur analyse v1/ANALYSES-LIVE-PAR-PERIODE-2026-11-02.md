# Analyses live — cartes par période (texte intégral)

**Capture :** 2026-11-02 · compte zingariello1314 · Récap → Analysis  
**Méthode :** DOM des cartes publiées (Worker ready), période par période.  
**JSON bruts :** `docs/analyses-documentation/moteur analyse v1/live-capture-2026-11-02/`  
**Architecture :** `ARCHITECTURE-ANALYSE-COMPLETE-2026-11-02.md`

---

## Timings & comportement observés (live 2026-11-02)

Mesures navigateur Cursor sur `localhost:3001` (compte live). Chrono = `performance.now()` côté page : clic → `localStorage sport.recap.periodView` (strip) → header `PERIOD RECAP` → grille `.igrid > .k` stable.

### Premier chargement Analyse

| Scénario | Shell / header | Cartes prêtes | Cartes | Notes |
|---|---:|---:|---:|---|
| Reload page → Unlock → Sport → Recap → Analysis (période persistée `all`) | ~581 ms | **~1 362 ms** | 14 | Pas de bandeau « préparation » visible ; **hit cache** IDB/mémoire très probable (session restaurée). |
| Remontage chaud Grades → Analysis (même période déjà calculée) | ~113 ms | **~367 ms** | 14 | Rerender + réutilisation bundle, pas un recalcul moteur. |

**Lecture :** le « premier contenu utile » après ouverture de l’onglet Analysis n’est **pas** le coût froid du Worker sur une plage lourde — c’est surtout le temps de peindre le shell + republier un bundle déjà en cache. Le vrai coût froid se voit au **changement de plage non encore chauffée**.

### Changement de plage (enchaînement Today → … → All time)

Séquence unique, sans rechargement, en partant de `all` puis chaque chip `.rb-seg` dans l’ordre. Les plages longues suivantes héritent parfois de la charge / file d’attente Worker de la précédente (soft-cancel).

| Transition | Strip (`periodView`) | Header période | Cartes stables | # cartes | Comportement UI observé |
|---|---:|---:|---:|---:|---|
| → Today | ~770 ms | ~1 297 ms | **~1 505 ms** | 8 | Strip réagit vite ; grille se vide brièvement puis republie. |
| → 7 days | ~722 ms | ~1 330 ms | **~1 533 ms** | 10 | Fluide, même profil que Today. |
| → 30 days | ~1 341 ms | ~2 321 ms | **~2 532 ms** | 16 | Un peu plus long ; header tuiles / strip semaine se recalent après publication. |
| → 3 months | ~1 148 ms | ~1 293 ms | **~2 056 ms** | 16 | Correct ; familles Activité/Progression dominent. |
| → 6 months | ~1 093 ms | ~2 292 ms | **~34 573 ms** | 17 | Strip OK rapidement ; **cartes ~35 s** — Worker encore occupé / recalcul large. |
| → 1 year | ~149 950 ms | ~168 969 ms | **~169 170 ms** | 16 | **File d’attente** : le strip/`periodView` ne bascule qu’après la fin du travail précédent ; UI paraît figée longtemps. |
| → 2 years | ~17 807 ms | ~18 224 ms | **~36 452 ms** | 16 | Toujours lourd ; mieux que 1y dans cette passe (Worker moins saturé). |
| → All time | ~17 109 ms | ~17 835 ms | **~18 670 ms** | 14 | Coût élevé mais publication nette une fois le Worker libre. |

### Comportement qualitatif (ce qu’on voit à l’écran)

1. **Clic chip période** — le sélecteur `.rb-seg` / `periodView` est censé suivre immédiatement ; en pratique sur plages déjà chaudes ~0,7–1,3 s. Si un Worker lourd tourne encore, le bascule `periodView` peut **attendre** (cas 1y ci-dessus).
2. **Pendant le calcul** — `analysisStatus: loading` : les **anciennes cartes ne doivent pas mentir** sur la nouvelle fenêtre (`withInsightsPublication` → `EMPTY` tant que pas `ready`). Header analytics calendaire est **invalidé** puis recalculé en idle seulement quand le loading insights est fini (F7.0e/f).
3. **Publication** — dès `insightsPublication.status === 'ready'` + gate Worker OK, la grille `.k` se remplit ; compteurs famille (ALL / ACTIVITÉ / …) se mettent à jour avec.
4. **Enchaînement rapide** — soft-cancel du request busy ; les plages 6m→1y→2y **s’accumulent** si on ne laisse pas respirer : le timing 1y (~169 s) n’est **pas** le coût unitaire isolé du moteur 1 an, c’est le coût **perçu** sous charge résiduelle.
5. **Cache** — revenir sur une plage déjà vue dans la session est nettement plus court (cf. remontage ~0,4 s ; switches courts Today/7d ~1,5 s).

**Méthode timings :** script CDP page (`sessionStorage.__periodSwitchTimings` / `__firstLoadTiming`). Ne pas confondre avec les médianes Node fixture (`DONNEES-PAR-PERIODE…` / F6) qui mesurent le bundle sans React/Garmin live.

---

## Today

**Fenêtre :** Today · dimanche 1 novembre 2026 → lundi 2 novembre 2026

**Publication :** ALL 8 · ACTIVITÉ 2 · PROGRESSION 3 · SOMMEIL 1 · RYTHME 1 · ALERTE 1

### 1. ACTIVITÉ — Le volume bouge via fréquence et dose ensemble

Le volume de répétitions est passé de 4493 à 418 (-91 %) entre deux fenêtres comparables. Fréquence (-12 %) et dose par séance (+12 %) contribuent toutes les deux; ce n'est pas un seul levier. Le creux porte surtout sur la dose par séance; la fréquence seule n’explique pas tout le mouvement.
28
J.
+52 %
·
7
J.
+26 %

### 2. PROGRESSION — La production de répétitions observée recule — le niveau n’est pas encore lisible

En moyenne, tes répétitions récentes reculent (environ 60 % de moins). Sans le même exercice, la même variante et assez de séances comparables, on ne peut pas parler de baisse de performance: seulement d'une production observée en retrait.
REPS OBSERVÉES
-60 %

### 3. ACTIVITÉ — 50 %

Le réalisé est inférieur au prévu (~50 %) avec des séances souvent incomplètes (alignement ~50/100). La différence vient surtout de séances commencées mais raccourcies, plutôt que de journées entièrement sautées.

### 4. ALERTE — La course a glissé hors de ta routine, pas toute ton activité

Ta dernière course (Course) était le 27 juillet 2026. Cela fait 98 jours, alors que tu as continué à t'entraîner (50 autres séances). Ce n'est pas un arrêt du sport: une qualité précise n'est plus exposée. Si tu voulais garder de l'endurance, le sujet n'est pas les répétitions de musculation: c'est la place réelle de la course. Après un trou aussi long, la prochaine séance se lira comme une reprise, pas comme une comparaison à ton meilleur niveau récent.
27
JUILLET 2026 ·
98
J. ·
50 SÉANCES
ENTRE-TEMPS

### 5. PROGRESSION — Le programme est davantage laissé de côté que tes séances ne sont allégées

Tu as commencé 1 séance alors que 2 jours avaient du contenu prévu. Le trou vient surtout des jours non commencés (1), plus que d'un effondrement de chaque séance. Sur la période, ça représente un peu plus de la moitié du plan (~50 %).
~
50 %
DU PLAN · ALIGNEMENT
50/100

### 6. SOMMEIL — Les journées lourdes suivent plus souvent une nuit longue

Sur 7 séances dépassant 300 reps, 6 ont été précédées d'au moins 7 h 30 de sommeil. À l'inverse, 4 des 9 séances sous 250 reps ont suivi une nuit plus courte. L'écart porte sur 16 séances: assez pour être suivi, pas assez pour en faire une règle. L'écart entre les deux proportions est d'environ 30 points. Cette fenêtre a aussi des jours sans séance: une nuit plus longue peut venir de ces jours-là, pas seulement précéder le volume. Le phénomène concerne surtout la quantité de travail réalisée: le sommeil semble davantage associé à ta capacité à maintenir une séance longue et volumineuse qu'à une augmentation automatique de chaque série.
6/7
≥ 300 ·
4/9
< 250

### 7. PROGRESSION — Pompes inclinées pieds sur banc : recul puis retour près du niveau de départ

En lisant les 8 dernières séances jusqu’à la fin de la fenêtre (contexte hors fenêtre inclus), Pompes inclinées pieds sur banc est passé par un creux (≈10 (1 octobre 2026)) puis la dernière séance est revenue à ≈36 répétitions, proche du départ de l’arc (≈27,3). La moyenne des dernières séances de l’arc (≈25,3) mélange encore creux et reprise: ce n’est pas le niveau final. Sur les séances où les séries sont détaillées, le format reste identique (3 × 12): l’évolution du volume moyen par séance ne vient donc pas d’un changement de schéma séries × reps sur ces séances documentées. Cette lecture s’appuie aussi sur 8 séances antérieures pour situer l’évolution. Maintenir ce niveau sur les prochaines séances dira s’il se stabilise.
ARC
8
(FENÊTRE
0
) · RECOVERED ·
-7.3 %
· 3×12→3×12

### 8. RYTHME — 100 %

Les séances d'exercices sont bien plus tenues (~100 %) que les étirements (~0 %). Sur la durée, cet écart de pratique pèse davantage qu'un déficit de capacité : la mobilité prévue n'entre presque pas dans l'exposition réelle.

---

## 7 days

**Fenêtre :** 7 days · mardi 27 octobre 2026 → lundi 2 novembre 2026

**Publication :** ALL 10 · ACTIVITÉ 3 · PROGRESSION 3 · SOMMEIL 2 · RYTHME 2

### 1. ACTIVITÉ — La séance du 1 novembre 2026 concentre une part importante de ces 7 jours

La séance du 1 novembre 2026 concentre 418 reps, soit 38,0 % de la fenêtre; les autres jours cumulent 683 reps. Elle mêle 60, 60, 60. La médiane des séances est 351 reps. Ce pic fausse une moyenne: il décrit un point haut, pas l’habitude de séance de la fenêtre.
1
NOVEMBRE 2026 ·
418 REPS
·
38,0 %

### 2. PROGRESSION — après 28 jours d'absence revient après un long silence

Il y a 3 jours, tu as enregistré ta première séance depuis 28 jours sur. L'écart dépasse 4 fois ton intervalle habituel. Avec 36 répétitions, tu reviens à 79 % de ton volume moyen avant l'interruption. D'habitude, 5 séries de 10 répétitions. Cette séance: 4 séries (10, 10, 10, 6 répétitions). Le nombre de séries baisse. Les répétitions dans chaque série restent du même ordre. Un seul paramètre a bougé. Le répéter avant d'en changer un autre garde la mesure lisible. Reproduire ce format sur la prochaine séance confirme le retour; en faire tout de suite une nouvelle norme va plus vite que les données.
28
J. ·
36 RÉPÉTITIONS

### 3. ACTIVITÉ — Les séances sont regroupées en début de fenêtre

2 des 3 séances tiennent sur les quatre premiers jours. Le volume existe, mais il laisse la fin de fenêtre presque vide.

### 4. ACTIVITÉ — 50 %

Le réalisé est inférieur au prévu (~50 %) avec des séances souvent incomplètes (alignement ~39/100). La différence vient surtout de séances commencées mais raccourcies, plutôt que de journées entièrement sautées.

### 5. SOMMEIL — Jalon sous une de tes meilleures nuits (9 h 39)

Le 30 octobre 2026, un jalon d'entraînement arrive après une nuit de 9 h 39 — parmi tes meilleures configurations de récupération. Elle coïncide avec tu reprends après 28 jours d'absence. Ce n'est pas une corrélation statistique: c'est la rencontre, le même jour, d'un événement et d'une récupération haute.
9 H 39

### 6. PROGRESSION — Les pas de ces 7 jours sont au-dessus de ton niveau des 30 jours d'avant

Les jours avec un compte de pas se situent autour de 9 026 pas (médiane, 6 jours). Sur les 30 jours d'avant, la médiane est 6 806 pas (27 jours), soit environ 33 % de plus. Ce n'est pas une séance: c'est le déplacement quotidien, à côté de l'entraînement.
9 026 VS 6 806 PAS

### 7. SOMMEIL — Les journées lourdes suivent plus souvent une nuit longue

Sur 7 séances dépassant 300 reps, 6 ont été précédées d'au moins 7 h 30 de sommeil. À l'inverse, 4 des 9 séances sous 250 reps ont suivi une nuit plus courte. L'écart porte sur 16 séances: assez pour être suivi, pas assez pour en faire une règle. L'écart entre les deux proportions est d'environ 30 points. Cette fenêtre a aussi des jours sans séance: une nuit plus longue peut venir de ces jours-là, pas seulement précéder le volume. Le phénomène concerne surtout la quantité de travail réalisée: le sommeil semble davantage associé à ta capacité à maintenir une séance longue et volumineuse qu'à une augmentation automatique de chaque série.
6/7
≥ 300 ·
4/9
< 250

### 8. PROGRESSION — Pompes inclinées pieds sur banc : recul puis retour près du niveau de départ

En lisant les 8 dernières séances jusqu’à la fin de la fenêtre (contexte hors fenêtre inclus), Pompes inclinées pieds sur banc est passé par un creux (≈10 (1 octobre 2026)) puis la dernière séance est revenue à ≈36 répétitions, proche du départ de l’arc (≈27,3). La moyenne des dernières séances de l’arc (≈25,3) mélange encore creux et reprise: ce n’est pas le niveau final. Sur les séances où les séries sont détaillées, le format reste identique (3 × 12): l’évolution du volume moyen par séance ne vient donc pas d’un changement de schéma séries × reps sur ces séances documentées. Cette lecture s’appuie aussi sur 8 séances antérieures pour situer l’évolution. Maintenir ce niveau sur les prochaines séances dira s’il se stabilise.
ARC
8
(FENÊTRE
0
) · RECOVERED ·
-7.3 %
· 3×12→3×12

### 9. RYTHME — 100 %

Les séances d'exercices sont bien plus tenues (~100 %) que les étirements (~0 %). Sur la durée, cet écart de pratique pèse davantage qu'un déficit de capacité : la mobilité prévue n'entre presque pas dans l'exposition réelle.

### 10. RYTHME — Relevés de genoux à la barre reviennent après une interruption

Relevés de genoux à la barre: Réapparition après 49 jours. Le format de séries observé est resté identique (3 × 20). Pour l’instant, c’est un retour ponctuel — trop tôt pour parler de reprise durable.
2 SÉANCES
· UNCLEAR ·
0 %
· 3×20→3×20

---

## 30 days

**Fenêtre :** 30 days · dimanche 4 octobre 2026 → lundi 2 novembre 2026

**Publication :** ALL 16 · ACTIVITÉ 4 · PROGRESSION 5 · SOMMEIL 3 · RYTHME 3 · RÉPERTOIRE 1

### 1. ACTIVITÉ — Certains jours, le Grease the Groove ne tient que par un passage hors planning

6 passages hors planning, 38 reps, sont entrés dans le journal de la fenêtre. Cela fait environ 6 reps par série. Les 6 séries restent dans la zone facile du protocole. Ça sert encore le Grease the Groove: répéter sans aller à l’échec. Sans eux, ces jours n’auraient aucune mini-série. C’est utile pour garder le fil, et ça ne remplace pas un emploi du temps si ça devient la seule façon de pratiquer.
6
HORS PLANNING ·
38 REPS

### 2. SOMMEIL — Rythme habituel récent : coucher autour de 4 h 59, lever autour de 13 h 53, milieu de nuit vers 9 h 01,…

Rythme habituel récent: coucher autour de 4 h 59, lever autour de 13 h 53, milieu de nuit vers 9 h 01, pour une durée autour de 8 h 47. La durée et le placement sont deux lectures distinctes: une nuit longue peut rester très tardive.Le coucher et le lever sont tous les deux tardifs, et la durée de sommeil tient. La nuit du 7 octobre 2026 s'écarte d'au moins 1 h 30 de ce placement. Pour lire tes séances du lendemain, ce placement compte autant que la durée: une nuit « longue » mais très tardive ne se compare pas à une nuit plus précoce de même durée.
12 NUITS
·
25
J

### 3. ACTIVITÉ — 50 %

Le réalisé est inférieur au prévu (~50 %) avec des séances souvent incomplètes (alignement ~34/100). La différence vient surtout de séances commencées mais raccourcies, plutôt que de journées entièrement sautées.

### 4. PROGRESSION — Meilleure série observée : 12

Meilleure série observée: 12. Ce n'est pas un record déclaré: c'est le plafond d'une série réellement saisie (précédent 10).
10 → 12

### 5. ACTIVITÉ — Le volume du mois dépasse la période précédente

Ces 30 jours totalisent 4 502 répétitions en 14 jours de renforcement, soit environ 322 répétitions et 4 min par séance, contre 3 731 reps en 14 jours de renforcement sur les 30 jours d'avant (+20,7 %, fréquence 0,0 %, 322 vs 267 reps/séance). La comparaison utile est donc période contre période de même durée. Les répétitions suivies sur 28 jours sont +51,8 % que le mois comparable, tandis que les 7 derniers jours repartent (+25,7 %).
4 502 VS 3 731 ·
+20,7 %

### 6. RYTHME — Jours habituellement actifs

Sur cette période, lundi, mardi présentent des fréquences d’entraînement classique enregistré proches (environ 75 % des occurrences éligibles). Aucun jour unique ne se démarque assez pour être présenté comme « le » jour régulier. L’absence d’enregistrement n’équivaut pas à une inactivité physique prouvée.

### 7. ACTIVITÉ — GTG et séances classiques

Sur 14 jours avec activité enregistrée (séance classique hors sync GTG et/ou GTG), 11 sont exclusivement classiques, 2 exclusivement GTG, et 1 combine les deux. Parmi tes jours GTG actifs, 33,3 % coïncident aussi avec une séance classique. 2 jours GTG sans programme historiquement démontré: non classés comme repos.
11
·
2
·
1
·
14

### 8. SOMMEIL — Jalon sous une de tes meilleures nuits (9 h 39)

Le 30 octobre 2026, un jalon d'entraînement arrive après une nuit de 9 h 39 — parmi tes meilleures configurations de récupération. Elle coïncide avec tu reprends après 28 jours d'absence. Ce n'est pas une corrélation statistique: c'est la rencontre, le même jour, d'un événement et d'une récupération haute.
9 H 39

### 9. PROGRESSION — Le haut du corps travaille surtout en poussée

Ces 30 jours exposent surtout le haut du corps en poussée (pectoraux, épaules, triceps), pas en tirage. Tu cumules 420 répétitions de poussée contre 9 de tirage, soit environ 46,7 répétitions de poussée pour 1 de tirage. Le ratio vient en second: c’est la répartition du volume qui décrit la fenêtre.
PUSHPULL

### 10. PROGRESSION — Les pas de ces 30 jours sont au-dessus de ton niveau des 30 jours d'avant

Les jours avec un compte de pas se situent autour de 7 222 pas (médiane, 26 jours). Sur les 30 jours d'avant, la médiane est 5 032 pas (28 jours), soit environ 44 % de plus. Ce n'est pas une séance: c'est le déplacement quotidien, à côté de l'entraînement.
7 222 VS 5 032 PAS

### 11. PROGRESSION — 52 %

Stagnation sur les performances malgré volume +52 % — le corps n'accroche pas encore : changer l'angle (intensité, exercices, deload) vaut plus qu'ajouter du volume..

### 12. RÉPERTOIRE — Relevés de genoux à la barre : le total monte surtout parce que tu t’entraînes plus souvent

Relevés de genoux à la barre: Réapparition après 35 jours. Tu es passé de 1 à 3 séances sur la période comparable, alors que le volume par séance reste proche. Le volume par séance reste récemment stable.
3 SÉANCES
· PLATEAU ·
0 %
· 3×20→3×20

### 13. RYTHME — Pompes inclinées sur support : moins de répétitions par séance

Sur 8 séances, le volume moyen de répétitions enregistré pour Pompes inclinées sur support passe d’environ 52 à 40 répétitions par séance, soit une baisse d’environ 23,1 %. Le nombre de séries reste proche de 4; la diminution vient surtout des répétitions par série (environ 15 → 10). Les autres mouvements comparables ne permettent pas d’isoler clairement si le signal est local ou partagé. Cette lecture s’appuie aussi sur 5 séances antérieures pour situer l’évolution.
LOW ·
3
J · NET_DECLINE

### 14. PROGRESSION — Pompes inclinées pieds sur banc : recul puis retour près du niveau de départ

Sur les 8 dernières séances (dont 4 avant la période affichée, 4 dedans), Pompes inclinées pieds sur banc est passé par un creux (≈10 (1 octobre 2026)) puis la dernière séance est revenue à ≈36 répétitions, proche du départ de l’arc (≈27,3). La moyenne des dernières séances de l’arc (≈25,3) mélange encore creux et reprise: ce n’est pas le niveau final. Sur les séances où les séries sont détaillées, le format reste identique (3 × 12): l’évolution du volume moyen par séance ne vient donc pas d’un changement de schéma séries × reps sur ces séances documentées. La trajectoire (creux puis reprise) porte surtout sur cet exercice, tandis que Pompes inclinées sur support (autour de 40 répétitions par séance) reste stable. Cette lecture s’appuie aussi sur 4 séances antérieures pour situer l’évolution. Maintenir ce niveau sur les prochaines séances dira s’il se stabilise.
ARC
8
(FENÊTRE
4
) · RECOVERED ·
-7.3 %
· 3×12→3×12 · AUTRES MOUVEMENTS STABLES

### 15. RYTHME — 97.6 %

Les séances d'exercices sont bien plus tenues (~97.6 %) que les étirements (~0 %). Sur la durée, cet écart de pratique pèse davantage qu'un déficit de capacité : la mobilité prévue n'entre presque pas dans l'exposition réelle.

### 16. SOMMEIL — octobre 2026 concentre la part la plus productive de la période

octobre 2026 totalise 4 084 reps en 13 jours entraînés, soit 90,7 % du volume du mois, contre 418 en novembre 2026. Le trimestre (ou le mois) n’est donc pas un volume uniforme: une période précise autorise davantage d’exposition. octobre 2026 illustre cette dynamique avec 4 084 reps, 13 jours entraînés et 50 min d'exercice: le sommeil y est en moyenne de 8 h 38, et 83,3 % des nuits dépassent 7 h 30.
OCTOBRE 2026 ·
4 084 REPS
·
90,7 %

---

## 3 months

**Fenêtre :** 3 months · lundi 3 août 2026 → lundi 2 novembre 2026

**Publication :** ALL 16 · ACTIVITÉ 5 · PROGRESSION 5 · SOMMEIL 1 · RYTHME 3 · RÉPERTOIRE 2

### 1. ACTIVITÉ — Certains jours, le Grease the Groove ne tient que par un passage hors planning

12 passages hors planning, 76 reps, sont entrés dans le journal de la fenêtre. Cela fait environ 6 reps par série. Les 12 séries restent dans la zone facile du protocole. Ça sert encore le Grease the Groove: répéter sans aller à l’échec. Sans eux, ces jours n’auraient aucune mini-série. C’est utile pour garder le fil, et ça ne remplace pas un emploi du temps si ça devient la seule façon de pratiquer.
12
HORS PLANNING ·
76 REPS

### 2. PROGRESSION — Meilleure série observée : 12

Meilleure série observée: 12. Ce n'est pas un record déclaré: c'est le plafond d'une série réellement saisie (précédent 10).
10 → 12

### 3. ACTIVITÉ — août 2026 domine, novembre 2026 est le plus bas

août 2026 : 15 jours avec reps, 4 556 reps. septembre 2026 : 13 jours avec reps, 3 728 reps. octobre 2026 : 16 jours avec reps, 4 367 reps. novembre 2026 : 1 jour avec reps, 418 reps. Ensemble : 45 jours avec répétitions enregistrées, 13 069 répétitions, environ 3.4 jours actifs par semaine.

### 4. ACTIVITÉ — 51 %

Le réalisé est inférieur au prévu (~51 %) avec des séances souvent incomplètes (alignement ~24/100). La différence vient surtout de séances commencées mais raccourcies, plutôt que de journées entièrement sautées.

### 5. ACTIVITÉ — GTG et séances classiques

Sur 45 jours avec activité enregistrée (séance classique hors sync GTG et/ou GTG), 39 sont exclusivement classiques, 5 exclusivement GTG, et 1 combine les deux. Parmi tes jours GTG actifs, 16,7 % coïncident aussi avec une séance classique. 5 jours GTG sans programme historiquement démontré: non classés comme repos.
39
·
5
·
1
·
45

### 6. RÉPERTOIRE — Première apparition :

Première apparition de dans ton historique. Ils représentent déjà 23 % de ton volume de séance ce jour-là.
17
OCTOBRE 2026 ·
100 REPS

### 7. PROGRESSION — Pectoraux : davantage de jours d’exposition qu’en période précédente

Sur deux fenêtres comparables de 45+ jours d’activité (3 mai 2026→2 août 2026 puis 3 août 2026→2 novembre 2026), les jours d’exposition primaire aux pectoraux passent de 6 à 13 (Δ +7). Les reps mono associées vont de 0 à 0. Il s’agit de jours enregistrés avec exposition, pas d’une preuve de hausse ou baisse de stimulation musculaire.
CHEST 6→13 J · MONO 0→0 · CMP=SOLID

### 8. RYTHME — Jours habituellement actifs

Sur cette période, lundi, vendredi présentent des fréquences d’entraînement classique enregistré proches (environ 76,9 % des occurrences éligibles). Aucun jour unique ne se démarque assez pour être présenté comme « le » jour régulier. L’absence d’enregistrement n’équivaut pas à une inactivité physique prouvée.

### 9. PROGRESSION — Le haut du corps travaille surtout en poussée

Ces trois mois exposent surtout le haut du corps en poussée (pectoraux, épaules, triceps), pas en tirage. Tu cumules 1 092 répétitions de poussée contre 18 de tirage, soit environ 60,7 répétitions de poussée pour 1 de tirage. Le ratio vient en second: c’est la répartition du volume qui décrit la fenêtre.
PUSHPULL

### 10. RÉPERTOIRE — Relevés de genoux aux parallèles : le total monte surtout parce que tu t’entraînes plus souvent

Relevés de genoux aux parallèles: Réapparition après 49 jours. Tu es passé de 4 à 6 séances sur la période comparable, alors que le volume par séance reste proche. Le volume par séance reste récemment stable.
6 SÉANCES
· PLATEAU ·
0 %
· 2×20→2×20

### 11. PROGRESSION — Élévations latérales : volume par séance en hausse

Sur 8 séances, le volume moyen de répétitions enregistré pour Élévations latérales passe d’environ 40 à 55 répétitions par séance, soit une hausse d’environ 37,5 %. Sur les séances où le détail de séries est connu, le format reste du même ordre. 1 séance du creux n’a qu’un total de répétitions: la structure de séries pendant la baisse n’est pas démontrée. Le retour s’observe sur plusieurs séances de la période. Cette lecture s’appuie aussi sur 4 séances antérieures pour situer l’évolution. Maintenir ce niveau sur les prochaines séances dira s’il se stabilise.
LOW ·
4
J · NET_RISE

### 12. ACTIVITÉ — Il y a 2 semaines, tu as dépassé 25 000 répétitions cumulées

depuis ta première saisie, le 5 janvier 2026, soit 284 jours de parcours. Elles ont été réalisées en 87 séances, soit une moyenne de 287 reps par séance. Ça représente environ 2,1 séances par semaine sur cette durée.
25 065 REPS
·
87 SÉANCES

### 13. SOMMEIL — Sur la période, le coucher et le lever se décale d’environ 113 min dans le même sens. La durée change…

aussi, d’environ 138 min.
113 MIN

### 14. PROGRESSION — Pompes inclinées pieds sur banc : recul puis retour près du niveau de départ

Pompes inclinées pieds sur banc est passé par un creux (≈10 (1 octobre 2026)) puis la dernière séance est revenue à ≈36 répétitions, proche du départ de l’arc (≈27,3). La moyenne des dernières séances de l’arc (≈25,3) mélange encore creux et reprise: ce n’est pas le niveau final. Sur les séances où les séries sont détaillées, le format reste identique (3 × 12): l’évolution du volume moyen par séance ne vient donc pas d’un changement de schéma séries × reps sur ces séances documentées. Plusieurs mouvements comparables évoluent dans le même sens: le signal dépasse cet exercice seul, sans prouver une cause unique. Maintenir ce niveau sur les prochaines séances dira s’il se stabilise.
13 SÉANCES
· RECOVERED ·
-7.3 %
· 3×12→3×12 · SHARED

### 15. RYTHME — 99.2 %

Les séances d'exercices sont bien plus tenues (~99.2 %) que les étirements (~0 %). Sur la durée, cet écart de pratique pèse davantage qu'un déficit de capacité : la mobilité prévue n'entre presque pas dans l'exposition réelle.

### 16. RYTHME — Relevés de genoux à la barre : volume par séance stable

Relevés de genoux à la barre était déjà pratiqué avant cette fenêtre: ce n’est pas une introduction nouvelle, c’est une présence dans la période sélectionnée. Le format de séries observé est resté identique (3 × 20). Le volume par séance reste récemment stable.
8 SÉANCES
· PLATEAU ·
0 %
· 3×20→3×20

---

## 6 months

**Fenêtre :** 6 months · lundi 4 mai 2026 → lundi 2 novembre 2026

**Publication :** ALL 16 · ACTIVITÉ 5 · PROGRESSION 5 · SOMMEIL 1 · RYTHME 3 · RÉPERTOIRE 2

### 1. ACTIVITÉ — Certains jours, le Grease the Groove ne tient que par un passage hors planning

12 passages hors planning, 76 reps, sont entrés dans le journal de la fenêtre. Cela fait environ 6 reps par série. Les 12 séries restent dans la zone facile du protocole. Ça sert encore le Grease the Groove: répéter sans aller à l’échec. Sans eux, ces jours n’auraient aucune mini-série. C’est utile pour garder le fil, et ça ne remplace pas un emploi du temps si ça devient la seule façon de pratiquer.
12
HORS PLANNING ·
76 REPS

### 2. PROGRESSION — Meilleure série observée : 12

Meilleure série observée: 12. Ce n'est pas un record déclaré: c'est le plafond d'une série réellement saisie (précédent 10).
10 → 12

### 3. ACTIVITÉ — août 2026 domine, novembre 2026 est le plus bas

août 2026 : 15 jours avec reps, 4 556 reps. septembre 2026 : 13 jours avec reps, 3 728 reps. octobre 2026 : 16 jours avec reps, 4 367 reps. novembre 2026 : 1 jour avec reps, 418 reps. Ensemble : 45 jours avec répétitions enregistrées, 13 069 répétitions, environ 3.4 jours actifs par semaine.

### 4. ACTIVITÉ — 51 %

Le réalisé est inférieur au prévu (~51 %) avec des séances souvent incomplètes (alignement ~24/100). La différence vient surtout de séances commencées mais raccourcies, plutôt que de journées entièrement sautées.

### 5. ACTIVITÉ — GTG et séances classiques

Sur 45 jours avec activité enregistrée (séance classique hors sync GTG et/ou GTG), 39 sont exclusivement classiques, 5 exclusivement GTG, et 1 combine les deux. Parmi tes jours GTG actifs, 16,7 % coïncident aussi avec une séance classique. 5 jours GTG sans programme historiquement démontré: non classés comme repos.
39
·
5
·
1
·
45

### 6. RÉPERTOIRE — Première apparition :

Première apparition de dans ton historique. Ils représentent déjà 23 % de ton volume de séance ce jour-là.
17
OCTOBRE 2026 ·
100 REPS

### 7. PROGRESSION — Pectoraux : davantage de jours d’exposition qu’en période précédente

Sur deux fenêtres comparables de 45+ jours d’activité (3 mai 2026→2 août 2026 puis 3 août 2026→2 novembre 2026), les jours d’exposition primaire aux pectoraux passent de 6 à 13 (Δ +7). Les reps mono associées vont de 0 à 0. Il s’agit de jours enregistrés avec exposition, pas d’une preuve de hausse ou baisse de stimulation musculaire.
CHEST 6→13 J · MONO 0→0 · CMP=SOLID

### 8. RYTHME — Jours habituellement actifs

Sur cette période, lundi, vendredi présentent des fréquences d’entraînement classique enregistré proches (environ 76,9 % des occurrences éligibles). Aucun jour unique ne se démarque assez pour être présenté comme « le » jour régulier. L’absence d’enregistrement n’équivaut pas à une inactivité physique prouvée.

### 9. PROGRESSION — Le haut du corps travaille surtout en poussée

Ces trois mois exposent surtout le haut du corps en poussée (pectoraux, épaules, triceps), pas en tirage. Tu cumules 1 092 répétitions de poussée contre 18 de tirage, soit environ 60,7 répétitions de poussée pour 1 de tirage. Le ratio vient en second: c’est la répartition du volume qui décrit la fenêtre.
PUSHPULL

### 10. RÉPERTOIRE — Relevés de genoux aux parallèles : le total monte surtout parce que tu t’entraînes plus souvent

Relevés de genoux aux parallèles: Réapparition après 49 jours. Tu es passé de 4 à 6 séances sur la période comparable, alors que le volume par séance reste proche. Le volume par séance reste récemment stable.
6 SÉANCES
· PLATEAU ·
0 %
· 2×20→2×20

### 11. PROGRESSION — Élévations latérales : volume par séance en hausse

Sur 8 séances, le volume moyen de répétitions enregistré pour Élévations latérales passe d’environ 40 à 55 répétitions par séance, soit une hausse d’environ 37,5 %. Sur les séances où le détail de séries est connu, le format reste du même ordre. 1 séance du creux n’a qu’un total de répétitions: la structure de séries pendant la baisse n’est pas démontrée. Le retour s’observe sur plusieurs séances de la période. Cette lecture s’appuie aussi sur 4 séances antérieures pour situer l’évolution. Maintenir ce niveau sur les prochaines séances dira s’il se stabilise.
LOW ·
4
J · NET_RISE

### 12. ACTIVITÉ — Il y a 2 semaines, tu as dépassé 25 000 répétitions cumulées

depuis ta première saisie, le 5 janvier 2026, soit 284 jours de parcours. Elles ont été réalisées en 87 séances, soit une moyenne de 287 reps par séance. Ça représente environ 2,1 séances par semaine sur cette durée.
25 065 REPS
·
87 SÉANCES

### 13. SOMMEIL — Sur la période, le coucher et le lever se décale d’environ 113 min dans le même sens. La durée change…

aussi, d’environ 138 min.
113 MIN

### 14. PROGRESSION — Pompes inclinées pieds sur banc : recul puis retour près du niveau de départ

Pompes inclinées pieds sur banc est passé par un creux (≈10 (1 octobre 2026)) puis la dernière séance est revenue à ≈36 répétitions, proche du départ de l’arc (≈27,3). La moyenne des dernières séances de l’arc (≈25,3) mélange encore creux et reprise: ce n’est pas le niveau final. Sur les séances où les séries sont détaillées, le format reste identique (3 × 12): l’évolution du volume moyen par séance ne vient donc pas d’un changement de schéma séries × reps sur ces séances documentées. Plusieurs mouvements comparables évoluent dans le même sens: le signal dépasse cet exercice seul, sans prouver une cause unique. Maintenir ce niveau sur les prochaines séances dira s’il se stabilise.
13 SÉANCES
· RECOVERED ·
-7.3 %
· 3×12→3×12 · SHARED

### 15. RYTHME — 99.2 %

Les séances d'exercices sont bien plus tenues (~99.2 %) que les étirements (~0 %). Sur la durée, cet écart de pratique pèse davantage qu'un déficit de capacité : la mobilité prévue n'entre presque pas dans l'exposition réelle.

### 16. RYTHME — Relevés de genoux à la barre : volume par séance stable

Relevés de genoux à la barre était déjà pratiqué avant cette fenêtre: ce n’est pas une introduction nouvelle, c’est une présence dans la période sélectionnée. Le format de séries observé est resté identique (3 × 20). Le volume par séance reste récemment stable.
8 SÉANCES
· PLATEAU ·
0 %
· 3×20→3×20

---

## 1 year

**Fenêtre :** 1 year · lundi 3 novembre 2025 → lundi 2 novembre 2026

**Publication :** ALL 16 · ACTIVITÉ 6 · PROGRESSION 4 · SOMMEIL 3 · RYTHME 2 · RÉPERTOIRE 1

### 1. ACTIVITÉ — Certains jours, le Grease the Groove ne tient que par un passage hors planning

12 passages hors planning, 76 reps, sont entrés dans le journal de la fenêtre. Cela fait environ 6 reps par série. Les 12 séries restent dans la zone facile du protocole. Ça sert encore le Grease the Groove: répéter sans aller à l’échec. Sans eux, ces jours n’auraient aucune mini-série. C’est utile pour garder le fil, et ça ne remplace pas un emploi du temps si ça devient la seule façon de pratiquer.
12
HORS PLANNING ·
76 REPS

### 2. PROGRESSION — Meilleure série observée : 12

Meilleure série observée: 12. Ce n'est pas un record déclaré: c'est le plafond d'une série réellement saisie (précédent 10).
10 → 12

### 3. ACTIVITÉ — juin 2026 domine, novembre 2026 est le plus bas

juin 2026 : 22 jours avec reps, 6 947 reps. juillet 2026 : 20 jours avec reps, 5 827 reps. août 2026 : 17 jours avec reps, 5 438 reps. septembre 2026 : 13 jours avec reps, 3 728 reps. octobre 2026 : 16 jours avec reps, 4 367 reps. novembre 2026 : 1 jour avec reps, 418 reps. Ensemble : 100 jours avec répétitions enregistrées, 29 534 répétitions, environ 1.9 jours actifs par semaine.

### 4. ACTIVITÉ — 28 %

Le réalisé est inférieur au prévu (~28 %) avec des séances souvent incomplètes (alignement ~11/100). La différence vient surtout de séances commencées mais raccourcies, plutôt que de journées entièrement sautées.

### 5. ACTIVITÉ — GTG et séances classiques

Sur 100 jours avec activité enregistrée (séance classique hors sync GTG et/ou GTG), 94 sont exclusivement classiques, 5 exclusivement GTG, et 1 combine les deux. Parmi tes jours GTG actifs, 16,7 % coïncident aussi avec une séance classique. 5 jours GTG sans programme historiquement démontré: non classés comme repos.
94
·
5
·
1
· 100

### 6. PROGRESSION — Course et renforcement divergent sur la période

Cette année combine 83 km de course en 9 h 40 et 29 534 reps de renforcement. La course réapparaît à côté du renforcement.
83 KM
·
29 534 REPS

### 7. SOMMEIL — Record après une nuit haute

Un record arrive le 30 octobre 2026 après une nuit de 9 h 39. L'événement et la récupération se rencontrent le même jour — sans en faire une loi générale.
PR ×
9 H 39

### 8. RYTHME — Jours habituellement actifs

Sur cette période, lundi, vendredi présentent des fréquences d’entraînement classique enregistré proches (environ 40,4 % des occurrences éligibles). Aucun jour unique ne se démarque assez pour être présenté comme « le » jour régulier. L’absence d’enregistrement n’équivaut pas à une inactivité physique prouvée.

### 9. RÉPERTOIRE — Tractions australiennes : un format plus volumineux se maintient

Tractions australiennes: tu es passé d’environ 4 × 10 à environ 4 × 12, soit une hausse de 20 % du volume par séance, reproduite sur les séances suivantes. Le nombre de séries reste proche de 4; les répétitions par série augmentent (environ 10 → 12). Il ne s’agit donc pas seulement d’une séance exceptionnelle: le journal montre une organisation du travail reproduite. La trajectoire (creux puis reprise) porte surtout sur cet exercice, tandis que Tractions pronation (autour de 19 répétitions par séance) et Tractions australiennes pieds surélevés (autour de 48 répétitions par séance) et Tractions supination (autour de 20 répétitions par séance) restent stables. Cela montre une augmentation maintenue du volume réalisé, sans suffire à démontrer à elle seule une progression physiologique.
21 SÉANCES
· OUTLIER_DRIVEN ·
0 %
· 4×10→4×12 · AUTRES MOUVEMENTS STABLES

### 10. PROGRESSION — Élévations latérales : volume par séance en hausse

Sur 8 séances, le volume moyen de répétitions enregistré pour Élévations latérales passe d’environ 40 à 55 répétitions par séance, soit une hausse d’environ 37,5 %. Sur les séances où le détail de séries est connu, le format reste du même ordre. 1 séance du creux n’a qu’un total de répétitions: la structure de séries pendant la baisse n’est pas démontrée.
LOW ·
14
J · NET_RISE

### 11. ACTIVITÉ — octobre 2026 interrompt la baisse depuis juin 2026

juin 2026: 6 947 reps en 22 jours entraînés (≈316 / jour actif) → septembre 2026: 3 704 reps en 12 jours (≈309 / jour actif), soit -47 % de volume, -45 % de jours, -2 % de volume par jour actif. La baisse vient surtout d’une diminution des jours entraînés, plus que d’un effondrement du volume par journée active. octobre 2026 remonte à 4 301 reps en 12 jours (≈358 / jour actif, +16 % vs septembre 2026), sans retrouver le sommet de juin 2026 (6 947 reps).
JUIN 2026 6 947 → SEPTEMBRE 2026 3 704 → OCTOBRE 2026 4 301

### 12. ACTIVITÉ — 50e séance enregistrée

50e séance enregistrée dans Momentum. Le jalon n'est pas un compteur isolé: tu as accumulé 14 259 répétitions pour y parvenir, soit environ 285 reps par séance.
50 SÉANCES
·
14 259 REPS

### 13. SOMMEIL — juin 2026 concentre la part la plus productive de la période

juin 2026 totalise 6 947 reps en 22 jours entraînés, soit 23,5 % du volume de l'année, contre 5 827 en juillet 2026. Le trimestre (ou le mois) n’est donc pas un volume uniforme: une période précise autorise davantage d’exposition. juin 2026 illustre cette dynamique avec 6 947 reps, 22 jours entraînés: le sommeil y est en moyenne de 9 h 53, et 84,6 % des nuits dépassent 7 h 30.
JUIN 2026 ·
6 947 REPS
·
23,5 %

### 14. SOMMEIL — Le décalage de le coucher s’est ensuite résorbé d’environ 72 min. La durée change aussi, d’environ 61 min

Le décalage de le coucher s’est ensuite résorbé d’environ 72 min. La durée change aussi, d’environ 61 min
Le décalage de le coucher s’est ensuite résorbé d’environ 72 min. La durée change aussi, d’environ 61 min.
72 min
72 MIN

### 15. PROGRESSION — Pompes inclinées pieds sur banc : recul puis retour près du niveau de départ

Pompes inclinées pieds sur banc est passé par un creux (≈10 (1 octobre 2026)) puis la dernière séance est revenue à ≈36 répétitions, proche du départ de l’arc (≈27,3). La moyenne des dernières séances de l’arc (≈25,3) mélange encore creux et reprise: ce n’est pas le niveau final. Sur les séances où les séries sont détaillées, le format reste identique (3 × 12): l’évolution du volume moyen par séance ne vient donc pas d’un changement de schéma séries × reps sur ces séances documentées. La trajectoire (creux puis reprise) porte surtout sur cet exercice, tandis que Dips sur barre parallèle avec gilet (autour de 47 répétitions par séance) et Pompes déclinées (pieds sur banc) (autour de 44 répétitions par séance) restent stables. Maintenir ce niveau sur les prochaines séances dira s’il se stabilise.
23 SÉANCES
· RECOVERED ·
-7.3 %
· 3×12→3×12 · AUTRES MOUVEMENTS STABLES

### 16. RYTHME — 97.9 %

Les séances d'exercices sont bien plus tenues (~97.9 %) que les étirements (~0.9 %). Sur la durée, cet écart de pratique pèse davantage qu'un déficit de capacité : la mobilité prévue n'entre presque pas dans l'exposition réelle.

---

## 2 years

**Fenêtre :** 2 years · dimanche 3 novembre 2024 → lundi 2 novembre 2026

**Publication :** ALL 16 · ACTIVITÉ 6 · PROGRESSION 4 · SOMMEIL 3 · RYTHME 2 · RÉPERTOIRE 1

### 1. ACTIVITÉ — Certains jours, le Grease the Groove ne tient que par un passage hors planning

12 passages hors planning, 76 reps, sont entrés dans le journal de la fenêtre. Cela fait environ 6 reps par série. Les 12 séries restent dans la zone facile du protocole. Ça sert encore le Grease the Groove: répéter sans aller à l’échec. Sans eux, ces jours n’auraient aucune mini-série. C’est utile pour garder le fil, et ça ne remplace pas un emploi du temps si ça devient la seule façon de pratiquer.
12
HORS PLANNING ·
76 REPS

### 2. PROGRESSION — Meilleure série observée : 12

Meilleure série observée: 12. Ce n'est pas un record déclaré: c'est le plafond d'une série réellement saisie (précédent 10).
10 → 12

### 3. ACTIVITÉ — juin 2026 domine, novembre 2026 est le plus bas

juin 2026 : 22 jours avec reps, 6 947 reps. juillet 2026 : 20 jours avec reps, 5 827 reps. août 2026 : 17 jours avec reps, 5 438 reps. septembre 2026 : 13 jours avec reps, 3 728 reps. octobre 2026 : 16 jours avec reps, 4 367 reps. novembre 2026 : 1 jour avec reps, 418 reps. Ensemble : 100 jours avec répétitions enregistrées, 29 534 répétitions, environ 1 jours actifs par semaine.

### 4. ACTIVITÉ — 0 %

Le réalisé est inférieur au prévu (~0 %) avec des séances souvent incomplètes (alignement ~11/100). La différence vient surtout de séances commencées mais raccourcies, plutôt que de journées entièrement sautées.

### 5. ACTIVITÉ — GTG et séances classiques

Sur 100 jours avec activité enregistrée (séance classique hors sync GTG et/ou GTG), 94 sont exclusivement classiques, 5 exclusivement GTG, et 1 combine les deux. Parmi tes jours GTG actifs, 16,7 % coïncident aussi avec une séance classique. 5 jours GTG sans programme historiquement démontré: non classés comme repos.
94
·
5
·
1
· 100

### 6. PROGRESSION — Course et renforcement divergent sur la période

Ces deux années combine 83 km de course en 9 h 40 et 29 534 reps de renforcement. La course réapparaît à côté du renforcement.
83 KM
·
29 534 REPS

### 7. SOMMEIL — Record après une nuit haute

Un record arrive le 30 octobre 2026 après une nuit de 9 h 39. L'événement et la récupération se rencontrent le même jour — sans en faire une loi générale.
PR ×
9 H 39

### 8. RYTHME — Jours habituellement actifs

Sur cette période, lundi, vendredi, mardi présentent des fréquences d’entraînement classique enregistré proches (environ 20,2 % des occurrences éligibles). Aucun jour unique ne se démarque assez pour être présenté comme « le » jour régulier. L’absence d’enregistrement n’équivaut pas à une inactivité physique prouvée.

### 9. RÉPERTOIRE — Tractions australiennes : un format plus volumineux se maintient

Tractions australiennes: tu es passé d’environ 4 × 10 à environ 4 × 12, soit une hausse de 20 % du volume par séance, reproduite sur les séances suivantes. Le nombre de séries reste proche de 4; les répétitions par série augmentent (environ 10 → 12). Il ne s’agit donc pas seulement d’une séance exceptionnelle: le journal montre une organisation du travail reproduite. La trajectoire (creux puis reprise) porte surtout sur cet exercice, tandis que Tractions pronation (autour de 19 répétitions par séance) et Tractions australiennes pieds surélevés (autour de 48 répétitions par séance) et Tractions supination (autour de 20 répétitions par séance) restent stables. Cela montre une augmentation maintenue du volume réalisé, sans suffire à démontrer à elle seule une progression physiologique.
21 SÉANCES
· OUTLIER_DRIVEN ·
0 %
· 4×10→4×12 · AUTRES MOUVEMENTS STABLES

### 10. PROGRESSION — Élévations latérales : volume par séance en hausse

Sur 8 séances, le volume moyen de répétitions enregistré pour Élévations latérales passe d’environ 40 à 55 répétitions par séance, soit une hausse d’environ 37,5 %. Sur les séances où le détail de séries est connu, le format reste du même ordre. 1 séance du creux n’a qu’un total de répétitions: la structure de séries pendant la baisse n’est pas démontrée.
LOW ·
14
J · NET_RISE

### 11. ACTIVITÉ — octobre 2026 interrompt la baisse depuis juin 2026

juin 2026: 6 947 reps en 22 jours entraînés (≈316 / jour actif) → septembre 2026: 3 704 reps en 12 jours (≈309 / jour actif), soit -47 % de volume, -45 % de jours, -2 % de volume par jour actif. La baisse vient surtout d’une diminution des jours entraînés, plus que d’un effondrement du volume par journée active. octobre 2026 remonte à 4 301 reps en 12 jours (≈358 / jour actif, +16 % vs septembre 2026), sans retrouver le sommet de juin 2026 (6 947 reps).
JUIN 2026 6 947 → SEPTEMBRE 2026 3 704 → OCTOBRE 2026 4 301

### 12. ACTIVITÉ — 50e séance enregistrée

50e séance enregistrée dans Momentum. Le jalon n'est pas un compteur isolé: tu as accumulé 14 259 répétitions pour y parvenir, soit environ 285 reps par séance.
50 SÉANCES
·
14 259 REPS

### 13. SOMMEIL — juin 2026 concentre la part la plus productive de la période

juin 2026 totalise 6 947 reps en 22 jours entraînés, soit 23,5 % du volume de ces deux années, contre 5 827 en juillet 2026. Le trimestre (ou le mois) n’est donc pas un volume uniforme: une période précise autorise davantage d’exposition. juin 2026 illustre cette dynamique avec 6 947 reps, 22 jours entraînés: le sommeil y est en moyenne de 9 h 53, et 84,6 % des nuits dépassent 7 h 30.
JUIN 2026 ·
6 947 REPS
·
23,5 %

### 14. SOMMEIL — Le décalage de le coucher s’est ensuite résorbé d’environ 88 min

Le décalage de le coucher s’est ensuite résorbé d’environ 88 min
Le décalage de le coucher s’est ensuite résorbé d’environ 88 min.
88 min
88 MIN

### 15. PROGRESSION — Pompes inclinées pieds sur banc : recul puis retour près du niveau de départ

Pompes inclinées pieds sur banc est passé par un creux (≈10 (1 octobre 2026)) puis la dernière séance est revenue à ≈36 répétitions, proche du départ de l’arc (≈27,3). La moyenne des dernières séances de l’arc (≈25,3) mélange encore creux et reprise: ce n’est pas le niveau final. Sur les séances où les séries sont détaillées, le format reste identique (3 × 12): l’évolution du volume moyen par séance ne vient donc pas d’un changement de schéma séries × reps sur ces séances documentées. La trajectoire (creux puis reprise) porte surtout sur cet exercice, tandis que Dips sur barre parallèle avec gilet (autour de 47 répétitions par séance) et Pompes déclinées (pieds sur banc) (autour de 44 répétitions par séance) restent stables. Maintenir ce niveau sur les prochaines séances dira s’il se stabilise.
23 SÉANCES
· RECOVERED ·
-7.3 %
· 3×12→3×12 · AUTRES MOUVEMENTS STABLES

### 16. RYTHME — 97.9 %

Les séances d'exercices sont bien plus tenues (~97.9 %) que les étirements (~0.9 %). Sur la durée, cet écart de pratique pèse davantage qu'un déficit de capacité : la mobilité prévue n'entre presque pas dans l'exposition réelle.

---

## All time

**Fenêtre :** All time

**Publication :** ALL 14 · ACTIVITÉ 4 · PROGRESSION 4 · SOMMEIL 1 · RYTHME 3 · RÉPERTOIRE 1 · ALERTE 1

### 1. ACTIVITÉ — Mer tient mieux que Jeu

Tes jours les plus suivis (Mer, ~47 % de complétion) et les moins suivis (Jeu, ~37 %) s’écartent de 10 points sur la fenêtre. L’écart n’est pas uniforme: Mer porte mieux le plan que Jeu. À l’inverse, Mer expose davantage épaules, triceps et dos. Parmi ce qui revient rarement coché: Exercice inconnu (202), Exercice inconnu (203) et Exercice inconnu (204). Si tu veux rééquilibrer l’exécution, priorise la complétion du Jeu plutôt que d’ajouter du volume sur tes jours déjà solides (Mer).
MER ~
47 %
· JEU ~
37 %

### 2. ACTIVITÉ — De juin 2026 à novembre 2026 : 29 534 reps sur 100 jours

juin 2026 : 22 séances, 6 947 reps. juillet 2026 : 20 séances, 5 827 reps. août 2026 : 17 séances, 5 438 reps. septembre 2026 : 13 séances, 3 728 reps. octobre 2026 : 16 séances, 4 367 reps. novembre 2026 : 1 séance, 418 reps. Ensemble : 100 jours entraînés, 29 534 répétitions, environ 2.3 séances par semaine.

### 3. PROGRESSION — Les répétitions observées et l’exposition ne racontent pas la même chose

En moyenne, tes répétitions récentes montent encore (environ 140 % de plus). Pourtant un mouvement continuent de progresser. Dans le même temps, a encore marqué un meilleur niveau: ce n'est donc pas une baisse uniforme. Sans le même exercice, la même variante et assez de séances comparables, on ne peut pas parler de baisse de performance: seulement d'une production observée en retrait.
REPS OBSERVÉES
140 %
· UN MOUVEMENT

### 4. ALERTE — La course a glissé hors de ta routine, pas toute ton activité

Ta dernière course (Course) était le 27 juillet 2026. Cela fait 98 jours, alors que tu as continué à t'entraîner (50 autres séances). Ce n'est pas un arrêt du sport: une qualité précise n'est plus exposée. Si tu voulais garder de l'endurance, le sujet n'est pas les répétitions de musculation: c'est la place réelle de la course. Après un trou aussi long, la prochaine séance se lira comme une reprise, pas comme une comparaison à ton meilleur niveau récent.
27
JUILLET 2026 ·
98
J. ·
50 SÉANCES
ENTRE-TEMPS

### 5. RYTHME — Ton rythme actuel reste dans ta variabilité habituelle

Tu es passé d'environ 2.5 à 3 séances par semaine (environ 20 % de plus sur ~28 jours). Tes séances sont aussi un peu moins chargées (6.9 exercices contre — auparavant). Fréquence et contenu baissent ensemble. Ton rythme habituel se situe autour de 3,7 séances par semaine (souvent 2,4–5 séances/sem.). 3,5 reste dans cette variabilité: ce n'est pas un changement de profil.
28
J. ·
3
/SEM. · 2.5/SEM. AVANT · HABITUDE 3,7

### 6. ACTIVITÉ — 34 %

Le réalisé est inférieur au prévu (~34 %) avec des séances souvent incomplètes (alignement ~14/100). La différence vient surtout de séances commencées mais raccourcies, plutôt que de journées entièrement sautées.

### 7. PROGRESSION — Course et renforcement se lisent ensemble

L’ensemble du suivi combine 83 km de course en 9 h 40 et 29 534 reps de renforcement. La course réapparaît à côté du renforcement.
83 KM
·
29 534 REPS

### 8. RÉPERTOIRE — Tractions australiennes : un format plus volumineux se maintient

Tractions australiennes: tu es passé d’environ 4 × 10 à environ 4 × 12, soit une hausse de 20 % du volume par séance, reproduite sur les séances suivantes. Le nombre de séries reste proche de 4; les répétitions par série augmentent (environ 10 → 12). Il ne s’agit donc pas seulement d’une séance exceptionnelle: le journal montre une organisation du travail reproduite. La trajectoire (creux puis reprise) porte surtout sur cet exercice, tandis que Tractions pronation (autour de 19 répétitions par séance) et Tractions australiennes pieds surélevés (autour de 48 répétitions par séance) et Tractions supination (autour de 20 répétitions par séance) restent stables. Cela montre une augmentation maintenue du volume réalisé, sans suffire à démontrer à elle seule une progression physiologique.
21 SÉANCES
· OUTLIER_DRIVEN ·
0 %
· 4×10→4×12 · AUTRES MOUVEMENTS STABLES

### 9. PROGRESSION — Le programme est davantage laissé de côté que tes séances ne sont allégées

Tu as commencé 101 séances alors que 366 jours avaient du contenu prévu. Le trou vient surtout des jours non commencés (265), plus que d'un effondrement de chaque séance. Sur la période, ça représente largement moins de la moitié du plan (~34 %). Les mêmes blocs reviennent souvent dans ce qui n'est pas fait: Exercice inconnu (202), Exercice inconnu (203) et Exercice inconnu (204) — tu sélectionnes plutôt que d'abandonner uniformément. L'alignement avec le contenu prévu reste bas (~14/100): quand tu t'entraînes, tu ne suis pas forcément le plan jusqu'au bout.
~
34 %
DU PLAN · ALIGNEMENT
14/100

### 10. ACTIVITÉ — octobre 2026 interrompt la baisse depuis juin 2026

juin 2026: 6 947 reps en 22 jours entraînés (≈316 / jour actif) → septembre 2026: 3 704 reps en 12 jours (≈309 / jour actif), soit -47 % de volume, -45 % de jours, -2 % de volume par jour actif. La baisse vient surtout d’une diminution des jours entraînés, plus que d’un effondrement du volume par journée active. octobre 2026 remonte à 4 301 reps en 12 jours (≈358 / jour actif, +16 % vs septembre 2026), sans retrouver le sommet de juin 2026 (6 947 reps).
JUIN 2026 6 947 → SEPTEMBRE 2026 3 704 → OCTOBRE 2026 4 301

### 11. RYTHME — juin 2026 concentre la part la plus productive de la période

juin 2026 totalise 6 947 reps en 22 jours entraînés, soit 23,5 % du volume du parcours, contre 5 827 en juillet 2026. Le trimestre (ou le mois) n’est donc pas un volume uniforme: une période précise autorise davantage d’exposition.
JUIN 2026 ·
6 947 REPS
·
23,5 %

### 12. SOMMEIL — Le sommeil d’avant-hier pèse encore, même après une nuit correcte

Même après une nuit précédente d'au moins 7 h 30, un sommeil sous 7 h deux nuits plus tôt est associé à 328 reps le jour J, contre 259 lorsque les deux nuits dépassent 7 h 30 (4 et 8 cas). La nuit d'avant-hier n'est donc pas un détail: elle sépare encore deux régimes de volume.
J
-2
COURT 328 · DEUX NUITS OK 259

### 13. PROGRESSION — Pompes inclinées pieds sur banc : recul puis retour près du niveau de départ

Pompes inclinées pieds sur banc est passé par un creux (≈10 (1 octobre 2026)) puis la dernière séance est revenue à ≈36 répétitions, proche du départ de l’arc (≈27,3). La moyenne des dernières séances de l’arc (≈25,3) mélange encore creux et reprise: ce n’est pas le niveau final. Sur les séances où les séries sont détaillées, le format reste identique (3 × 12): l’évolution du volume moyen par séance ne vient donc pas d’un changement de schéma séries × reps sur ces séances documentées. La trajectoire (creux puis reprise) porte surtout sur cet exercice, tandis que Dips sur barre parallèle avec gilet (autour de 47 répétitions par séance) et Pompes déclinées (pieds sur banc) (autour de 44 répétitions par séance) restent stables. Maintenir ce niveau sur les prochaines séances dira s’il se stabilise.
23 SÉANCES
· RECOVERED ·
-7.3 %
· 3×12→3×12 · AUTRES MOUVEMENTS STABLES

### 14. RYTHME — 97.9 %

Les séances d'exercices sont bien plus tenues (~97.9 %) que les étirements (~0.9 %). Sur la durée, cet écart de pratique pèse davantage qu'un déficit de capacité : la mobilité prévue n'entre presque pas dans l'exposition réelle.

---

