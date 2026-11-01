# Matrice des compositions F3 — 2026-11-01

Légende statut : **I** = implémenté · **C** = conditionnel / partiel · **N** = non implémenté (documenté).

| Raisonnement | Faits nécessaires | Sources | Conditions | Producteurs | Conclusion autorisée | Abstention | Tests |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Recul localisé + décomposition | Totaux ordonnés, sets trusted, témoins stables ≥3 séances | `buildExerciseTrajectory`, `readTrustedSessionSets`, `analyzePeers` | Sets cohérents ; peers `localized` | progress, freq_decline | Recul porté par reps/série ; local vs famille | Sets absents → pas de décomposition ; peers insufficient → pas de « force intacte » | A, A3, A4 |
| Recul partagé | Même + témoins en baisse | peers `shared` | ≥2 témoins declining | progress | Signal au-delà de l’exercice ; pas de cause unique | — | A2 |
| Format consolidé | Schéma before/after + maintained | `classifySetMechanism`, `classifyContinuity` | `maintained===true` + installation repeated/installing/installed | emergence, progress | Hausse de volume via séries/reps **reproduite** | Pic unique → `punctual_format_spike` | B, B2 |
| Attribution fréquence | Sessions W vs C, mean/séance | `classifyVolumeAttribution` | Δ séances ≥2, mean ≈ stable | progress, return, emergence | Total ↑/↓ via fréquence | Mean/séance bouge aussi → autre kind ou null | B3 |
| Attribution contenu séance | Fréquence stable, mean change | idem | \|Δ séances\|≤1, \|pct\|≥15 | progress, freq_* | Contenu de séance change | — | B3 / A |
| Continuité retour | Gap ≥21j + séances W | `classifyInstallation` | 1 séance → ponctuel ; ≥3 → confirmé | emergence, structural_memory | Retour ponctuel vs confirmé | Interdit `reprise_durable` si ponctuel | E |
| Plateau / stabilité | Shape plateau, format stable | `classifyShape`, continuity | Échantillon ≥3–4 | progress, return | Stabilité observée ; pas de record | 2 points égaux ≠ plateau forcé | C |
| Fluctuation / outlier | Shape outlier_driven | classifyShape | — | progress | Pas de tendance linéaire | Interdit `tendance_lineaire` | D |
| Lexique performance vs volume | Sets + peers | `resolveVolumeLexicon` | Structure + peers OK | tous trajectoire | « performances » ou « volume enregistré » | Sinon volume seulement | A5 |
| Fenêtre W + H | temporalScope | F2 temporal | H rôle `historicalContextWindow` | progress 7j | Analyse centrée W | Pas mélanger 7j/30j/trimestre | H |
| Données manquantes | 1 séance / pas d’arc | trajectory | — | emergence | Faits élémentaires OK ; composition faible | Pas de composition trompeuse | I |
| Causalités interdites | Toujours | `forbiddenConclusionsFor` | — | tous | Liste d’interdits attachée | — | J |
| Identité / famille | movementFamily | peers | Famille classée | progress | Pas de témoins arbitraires | Famille `other` → insufficient | K |
| GTG / double comptage | Canaux P3.5 | P3.5 day records | Clé à clé | p35 coexistence | Inchangé F3 | Pas de volume gonflé via composition | (garantie P3.5 ; scénario F doc) |
| Programme prouvé | Plan historique | adherence / P3.4 | Plan fiable | adherence | Distinction plan vs réalisé | Plan reconstruit → abstention fréquence prévue | G (existant, non étendu) |
| Sommeil composé | Nuits datées F2 | sleep facts | Couverture | sleep kinds | Observations datées seulement | Causalité sommeil→perf interdite | J |
| Endurance distance/FC | Sorties comparables | — | — | — | — | **N** F3 | — |
| Muscles ledger composé | Exposition P3.2b | — | — | p32b | — | **C** / **N** composition multi-faits | — |

## Grille d’évaluation profondeur (par carte composée)

| Critère | Question |
| --- | --- |
| Exactitude chiffres | Totaux / % / schémas arithmétiquement cohérents ? |
| Précision temporelle | Dates W vs H explicites ? |
| Décomposition | Séries vs reps démontrée ou abstention ? |
| Continuité | Ponctuel vs maintenu distingué ? |
| Comparabilité | Témoins contrôlés ou absents honnêtement ? |
| Contexte H | Historique comme contexte, pas sujet ? |
| Nuance | Limites / creux sans sets / peers mixed ? |
| Conclusion | Proportionnée (niveaux 1–2–3) ? |
| Non-causalité | Pas de physio / sommeil / médical ? |
| Valeur ajoutée | Nouveau lien de faits, pas paraphrase ? |
