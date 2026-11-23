# DIALOGUE TECHNIQUE P6 — Mission 30

Réponses ancrées code / données. Contredit les hypothèses si nécessaire.

1. **Pourquoi M29 a corrigé les totaux sans les effectifs ?**  
   Les extracteurs `extractWindowTotalReps` / refus mean↔total ont sécurisé la **grandeur**. L’effectif venait encore de `dates.length` (arc). Deux contrats distincts ; un seul était fermé.

2. **Autorité opérationnelle sur les ensembles d’événements ?**  
   Partielle. `buildMetricFact.sampleSize` + `eventIds` existent ; `resolvePrimaryWindowSessionPopulation` (M30) est l’autorité pour l’effectif fenêtre. Pas encore tous les producteurs y passent.

3. **Validations : structure ou vérité ?**  
   Surtout structure (claims présents, orphan, card↔claim valeurs dupliquées). M30 ajoute une vérité algébrique minimale `total≈mean×n` et prose vs population.

4. **Renforcer sans second agrégateur ?**  
   Oui : annoter / vérifier des faits déjà produits (`validateSumMeanSampleConsistency`), jamais recalculer un volume parallèle « de confiance ».

5. **Producteurs hors contrats communs ?**  
   Beaucoup de plats historiques (`dates`, `meanReps`) coexistent avec `metricFacts`. Composition parallèle consomme désormais la population résolue ; essays / monthly arc / detectDiscoveries restent hétérogènes.

6. **Jeu A indépendant révèle-t-il des défauts passés ?**  
   Oui : l’oracle 336/7 vs prose 8 était accepté par l’intégrité v28. Les tests structurels M28/M29 ne couvraient pas ce triple.

7. **Compositions = raisonnements ou objets bien formés ?**  
   Essentiellement objets bien formés + totaux étiquetés. La cohérence sum/mean/n n’était pas une contrainte de raisonnement jusqu’à M30.

8. **Abondance jusqu’au catalogue ?**  
   Oui pour phénomènes distincts (48, 31e). Non pleinement pour reformulations partielles (suppression exact duplicate).

9. **Pourquoi l’évaluation fondatrice n’est pas pleinement opérationnelle ?**  
   Exports sans entrées figées, DOM NON_OBSERVÉ, Jeux B/C non exécutés en aveugle, Jeu A longtemps = présence de claims. Obstacle méthodologique (Porte C), pas seulement « bugs restants ».

10. **Contrats qui réduisent les futures missions ?**  
    Population d’effectif ↔ total ; fusion partial≠suppress ; totaux≠moyennes ; graphe avant publish ; oracle indépendant obligatoire pour V.

11. **Généralisable vs spécifique user ?**  
    Généralisable : mélange arc/fenêtre, validation sum/mean/n. Spécifique : ids Hyperextension, calendrier nov. 2026, fingerprint `c8aa227e`.

12. **Retirer / centraliser plutôt qu’ajouter ?**  
    **Centraliser** la résolution de population ; **retirer** l’usage de `dates.length` comme effectif de total. Pas de détecteur Hyperextension.

13. **Paquet de rejeu vs parité M18 ?**  
    Sépare explicitement inputs (backup) / observed (AUDIT v28) / oracle (corpus). Évite de comparer deux dossiers d’environnement sans reps.

14. **B/G/V/P ?**  
    Voir `PLAN_CLOTURE_FINITE_P6.md` actualisé. B3 progressé (effectifs). V1 amorcé. V2 partiel. P1/P2 ouverts. **P6 non clôturée. NO-GO P7.**
