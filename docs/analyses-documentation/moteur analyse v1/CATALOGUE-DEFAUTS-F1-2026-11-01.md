# Catalogue des défauts — F1 (2026-11-01)

Gravité : **P0** bloque confiance ; **P1** qualité éditoriale majeure ; **P2** cohérence / polish ; **P3** perf / dette.

Aucun correctif appliqué dans F1.

| ID | Gravité | Reproduction | Cause probable | Code | Impact user | Lot |
| --- | --- | --- | --- | --- | --- | --- |
| F1-D01 | P1 | Fixture/live 7j : `disc_ms_pr` « Meilleure série : 12 exercice 146651247 » | Name resolve fail → raw id ; validation `raw_exercise_id` droppe parfois trop tard / cap après sélection partielle | `recapMilestoneEngine` + insight_validation | Carte ridicule / technique | F4 (+ garde F5) |
| F1-D02 | P1 | 7j : « Ces 7 jours **devient** un nouveau point d'ancrage » | Accord grammatical template `disc_anchor` | `recapPeriodDiscoveries` copy anchor | Texte cassé, crédibilité ↓ | F4 |
| F1-D03 | P1 | 7j/30j : `disc_quarter_profile` « devient identifiable par son profil » | Kind journey / trimestre promu sur fenêtre courte ; copy générique | `disc_quarter_profile` + E0 IV | Analyse longue sans intérêt | F5 + F4 |
| F1-D04 | P1 | Cartes comparant 7j à 30j / trimestre sans justification | Producteurs à fenêtres fixes (habit 30j, journey 91j, quarter) | baselines, journeyStart −91j, quarter_* | Confusion période | F2 + F5 |
| F1-D05 | P0 | Live : « la nuit associée » sans date | Copy sleep assoc sans `formatFrDate(ymd)` | `recapSleepCorrelation` / sleep candidates | Ambiguïté temporelle | F2 + F4 |
| F1-D06 | P1 | Retours d’exercice (`ms_return` / emergence) à faible valeur éditoriale | IV / score élevés vs profondeur faible ; rivalité incomplete | E0 + milestone/emergence | Pack saturé de reprises | F5 |
| F1-D07 | P1 | `disc_density` / `calendar_rhythm` promu en « découverte » | contentClass descriptive mais passe score | editorial gate partiel | Stats banales | F5 |
| F1-D08 | P2 | `strengthDays` > `trainingDays` (reject log 30d/3m) | Dénominateurs divergents (classic exclusive vs calendar training day) | `recapTrainingDayTruth` vs P36/strength counts | Incohérence cross-cartes | F2 |
| F1-D09 | P1 | Exemple A non atteint malgré données sets | Pas de producteur « isolement vs cousins » ; progress = arc creux/retour | `exercise_progress` | Superficialité | F3 |
| F1-D10 | P2 | Dates ISO dans corps (`≈10 (2026-10-01)`) | Formatage inline sans `formatFrDate` | `disc_exercise_progress` body | Objectif « 01 novembre » manqué | F4 |
| F1-D11 | P2 | Coloration : minutes d’une durée `7 h 42` / nom d’exo non colorés ensemble | Regex `segmentRecapProseValues` : unités listées, pas noms d’exos ; `h` colorable mais fragmentaire | `recapProseMarks.js` | Lisibilité | F4 |
| F1-D12 | P2 | Titre ≠ corps (emergence « un mouvement » anonymisé) | Name missing → fallback « un mouvement » | emergence + name map | Carte générique | F4 |
| F1-D13 | P1 | Deux cartes racontent la même reprise (emergence + ms_return_durable) | Rivalité partielle ; kinds distincts | DISCOVERY_RIVALS | Redondance | F5 |
| F1-D14 | P2 | Méthodologie parfois visible avant demote | Gate E0 OK (`methodology_demoted`) mais UI console peut exposer | E0 + console | Confusion découverte vs limite | F5 / console |
| F1-D15 | P3 | ~13 s perçus live ; fixture bundle seul 0,5–1,8 s | Coût dominant = adaptatif + enrichissements console, pas E0 seul | `buildAdaptiveRecapInsights` + UI | Attente | F6 |
| F1-D16 | P2 | Prefix kinds `disc_ms_`, `disc_gtg_` dans scan | Regex audit / strings incomplets | scan / provenance | Bruit inventaire | F7 doc |
| F1-D17 | P1 | Conseils non fondés possibles dans essays | Horizon essays réécrivent sans nouveaux facts | `recapHorizonEssays` | Sur-interprétation | F4 + F5 |
| F1-D18 | P2 | Sleep kinds absents fixture (pas Garmin) → inventaire live ≠ fixture | Fixture workout-only | fixtures | Blind spot audit | F7 (+ fixture sleep) |
| F1-D19 | P1 | `disc_rest_assoc` classé famille sleep, budget sommeil | `signalFamilyOfKind` mappe rest_assoc → sleep | `recapInsightNature` | Évince vraie carte sommeil | F5 |
| F1-D20 | P2 | Comparaisons tautologiques volume période = 100 % d’elle-même (`disc_anchor` 30j) | Formule % du volume mensuel quand fenêtre = mois | anchor metrics | Nonsense éditorial | F4 + F5 |

---

## Synthèse causes racines (pas de nouveaux kinds requis a priori)

1. **Sélection** favorise densité / ancrage / profil / PR faibles (F5).
2. **Raisonnement multi-faits** (cousins, sets stables, contraste) existe en briques mais n’est pas composé (F3).
3. **Contrats temporels & dénominateurs** flous (F2).
4. **Copy / format** (accords, ISO, nuit sans date, coloration) (F4).
5. **Perf perçue** hors bundle discoveries (F6).
