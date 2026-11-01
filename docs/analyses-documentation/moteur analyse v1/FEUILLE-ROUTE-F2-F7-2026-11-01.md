# Feuille de route F2–F7 — fondée sur F1 (2026-11-01)

Aucune implémentation autorisée tant que F1 n’est pas validé.

Dépendances : **F2 → F3/F4** ; **F5** après contrats + IV stables ; **F6** mesurable indépendamment ; **F7** dernière.

---

## F2 — Contrats de données et de temps

**État : livré 2026-11-01** — voir `RAPPORT-F2-CONTRATS-2026-11-01.md`.

**Priorité :** haute (débloque confiance).  
**Cible défauts :** D04, D05, D08, D18 (partiel).

| Livrable | Critères d’acceptation |
| --- | --- |
| Glossaire unique | `jour_entraine`, `jour_classique_exclusif`, `jour_gtg`, `jour_actif`, `strengthDays` définis + tests golden |
| Alignement compteurs | Plus de `strengthDays > trainingDays` non expliqué ; même libellé UI |
| Nuits | Toute prose sommeil cite date(s) FR ; hors fenêtre → abstention ; convention rattachement documentée |
| Fenêtres de comparaison | Chaque kind déclare `primaryWindow` / `compareWindow` / `why` ; interdiction silencieuse du trimestre sur 7j sauf `historical_explicit` |
| Fixture sleep | Mini Garmin sleep pour tests contrats |

**Risques :** casser P3.5/P3.6 dénominateurs — migrations avec flags de preuve.

---

## F3 — Raisonnement approfondi

**État : livré 2026-11-01** — voir `RAPPORT-F3-COMPOSITION-2026-11-01.md`.

**Priorité :** haute (valeur produit).  
**Cible :** D09, matrice Exemple A/B.  
**Principe F1 :** composer les briques existantes (`readTrustedSessionSets`, baselines, progress, emergence) — **pas** explosion de kinds.

| Livrable | Acceptation |
| --- | --- |
| Arc exercice « profondeur A » | Si sets trusted + cousins stables → corps multi-faits (sets, % , cousins) ; sinon abstention structure |
| Séparation volume vs performance | Champs `proofLevel` / lexicon distincts ; copy sans physio |
| Continuité vs événement | emergence / return : labels explicites (`classifyContinuity`) |
| Interdits listés | Tests snapshot anti-causal (`forbiddenConclusions`) |

**Risques :** copy longue ≠ profondeur ; garder evidence machine.

---

## F4 — Narration et présentation

**État : livré 2026-11-01** — voir `RAPPORT-F4-NARRATION-2026-11-01.md`.

**Priorité :** haute.  
**Cible :** D01, D02, D10, D11, D12, D17.

| Livrable | Acceptation |
| --- | --- |
| Accords FR / templates | Plus de « devient » / « n’ont » fautifs sur sujets testés |
| Zéro ISO user-facing | Dates `d mois yyyy` (polish + reject restant) |
| Noms d’exos | Jamais `exercice N` en UI ; abstain / fallback si name missing |
| Coloration | Regex étendue (`7 h 42`) + API sémantique optionnelle |
| Essays | Ne pas inventer de faits hors evidence (non migrés en masse) |
| Narration F3→texte | `composedEvidence` exploité ; score visible dispo = utilisé |

---

## F5 — Sélection éditoriale E0

**Priorité :** haute après F2/F3 partiels.  
**Cible :** D03, D06, D07, D13, D19, D20.  
**Contrainte :** pas de retune aveugle des scores — changements traçables + replays.

| Livrable | Acceptation |
| --- | --- |
| Demote descriptive short-window | density/calendar_rhythm/anchor tautologique hors slot principal |
| Rivalité reprises | emergence ↔ ms_return* élargie |
| Scope quarter_* | Interdit ou demote sur voice week |
| rest_assoc budget | Ne pas manger le budget sommeil (reclass sport ou budget séparé) |
| Caps famille emergence | Max 1–2 par pack |

---

## F6 — Performance et fraîcheur

**Priorité :** moyenne.  
**Cible :** D15.

### Carte des coûts (observation F1)

| Étape | Fixture (bundle seul) | Live perçu (ordre de grandeur v0) |
| --- | --- | --- |
| `buildPeriodDiscoveryBundle` | 7d ~0,5 s ; 30d ~1,0 s ; 3m ~1,8 s | Inclus |
| Adaptatif + enrichissements | Non mesuré ici | Dominant (~dizaine s rapportée) |
| E0 select | Inclus dans bundle | Faible vs adaptatif |
| Essays / colonnes | Post-bundle | Secondaire |
| Console diagnostic | — | Surcoût admin |

### Protocole de mesure F6

1. Marqueurs `performance.now` : adaptive → composed pipeline → bundle → E0 → essays → columns → paint.
2. Séparer **profil live** / fixture / guest.
3. Compter recalculs (deps React / invalidations).
4. Cartographier caches **existants** seulement ; proposer invalidation (sans ajouter cache en F1).
5. Critère : p95 perçue documentée + budget cible négocié.

**Risques :** optimiser trop tôt sans contrats = cache de mauvaises analyses.

---

## F7 — Recette finale

**Priorité :** dernière.  
**Cible :** D16 + non-régression.

| Critère | Mesure |
| --- | --- |
| Inventaire kinds = runtime | Script F1 vert ; 0 préfixe mort non documenté |
| Cartes A/B-like | Au moins 1 scénario fixture deep validé |
| Sommeil daté | Checklist live |
| E0 traces | Console / forensics sur 7d 30d 3m |
| Perf | Protocole F6 signé |
| Aucune régression P0–P3.6 | Suites existantes |

---

## Ordre recommandé

1. Valider F1 (ce dossier).  
2. F2 contrats.  
3. F4 quick wins (grammaire, ISO, raw id) en parallèle court.  
4. F3 profondeur.  
5. F5 sélection.  
6. F6 perf.  
7. F7 recette.
