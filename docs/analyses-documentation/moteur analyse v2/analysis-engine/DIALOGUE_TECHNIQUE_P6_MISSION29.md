# DIALOGUE TECHNIQUE P6 — Mission 29

1. **Hyperextension persistant : contrats insuffisants ou autorités concurrentes ?**  
   **Les deux, surtout concurrentes.** Discovery dit « aspects distincts » ; claims/`relateClaims` disaient « reformulation » ; sélection supprimait. Un seul contrat de suppression forte manquait.

2. **Éliminer une responsabilité dupliquée plutôt qu’ajouter une protection ?**  
   **Oui.** On a retiré à `REFORMULATION` le pouvoir de supprimer, et on exige l’équivalence forte. La publication ne « répare » plus seule : le graphe est corrigé à la sélection (`applyP6`).

3. **Validité sémantique ≠ champs obligatoires**  
   Des champs remplis (`collapsedInto`) ont fait disparaître `unjustifiedFusions` sans prouver l’équivalence. Le diagnostic doit exiger **raison d’équivalence forte** + conservation d’information, pas la seule présence de clés.

4. **Publication : réparer ou vérifier ?**  
   **Vérifier un graphe déjà cohérent.** Réparation limitée (redirect si destination connue) comme filet, pas comme stratégie. Source de vérité : sélection / pipeline.

5. **Généralisation métrique minimale**  
   `buildMetricFact` + `metricsAreComparable` + champs plats `recentReps`/`prevReps` distincts des moyennes, produits dès `trajectoryToMetrics` et `structural_memory`. Composition consomme le contrat M28/M29.

6. **Confiance excessive M27/M28**  
   Tests sans `assertions[]` → `relateClaims` court-circuitait à INDEPENDENT. Reconcile testé sur une seule liste contenant déjà le parent. Disposition `collapsedInto` masquait les fusions contestables.

7. **Empêcher les diagnostics de faire disparaître les anomalies**  
   Ne plus traiter `collapsedInto` seul comme justification. Séparer compteurs structurels et sémantiques. Interdire d’assouplir une assertion sans motiver l’erreur de l’assertion.

8. **Prochaine intervention meilleur rendement**  
   Jeux A + abondance sur pipeline réel (critères G du plan) ; puis taxonomie d’exploration honnête (une relation applicable).

9. **Classement B/O**  
   **À corriger** : B1–B8 = intégrité technique nécessaire mais non suffisante. Clôture P6 exige aussi G (généralisation) + V (validation indépendante) + P (produit). Voir plan actualisé.

10. **Plus court parcours candidature P6**  
    Rejeu v28 (orphan=0, métriques) → jeux A/abondance → taxonomie exploration + 1 relation → DOM/procédure → candidature seulement si B∪G∪V∪P minimum verts. Pas de P7 avant.
