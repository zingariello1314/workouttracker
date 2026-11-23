# DIALOGUE TECHNIQUE P6 — Mission 28

Avis indépendant, confronté au code et à la baseline v26. Les hypothèses ChatGPT ne sont acceptées que si vérifiées.

---

1. **Pourquoi 27 missions ?**  
Parce que le chantier a traité simultanément fondations, producteurs, sélection, rédaction, exports et régressions, sans geler assez tôt un contrat d’identité/métrique/publication. Chaque mission a réparé une rupture de transmission révélée par la précédente.

2. **Décisions d’architecture qui allongent**  
- Plusieurs autorités concurrentes (subjectKey vs name vs phenomenon texte).  
- Composition post-hoc sur métriques hétérogènes.  
- Sélection qui peut supprimer sans destination.  
- Observabilité qui confond absence de trace et non-exécution.  
- Mémoire : exposition ≠ publication.

3. **Quatre autorités M27 : opérationnelles ou conventionnelles ?**  
**Mixtes.** Phénomène aspecté et presentationWindow sont opérationnels pour la composition. Le sujet était conventionnel tant que `subjectKey()` ignorait `metrics.subjectKey` — corrigé M28. Les assertions héritées titre\|corps restent des alias.

4. **Autorité unique pour les métriques ?**  
**Non.** Plusieurs voies : metricFacts, observedValues, champs plats, prose. M28 impose un contrat pour la composition parallèle ; ce n’est pas encore l’autorité unique globale.

5. **Garantie moyenne ≠ total ?**  
Désormais : extracteurs séparés + `volumeKind` + interdiction de fallback cross-kind dans la composition. **Pas encore** un type MetricValue unique partout.

6. **Claim correct en apparence depuis un raisonnement faux ?**  
**Oui.** Un claim peut être bien formé (scope, proof ids) avec des valeurs qui sont des moyennes étiquetées comme volume — cas v26.

7. **Producteurs bénéficiant de P6 sans l’appliquer ?**  
Jalons, horizon essays, certaines discoveries « claim-wrapped », relations déclarées dans la matrice sans exécution instrumentée.

8. **Proportion mémoire effective ?**  
≈ **1 phénomène** mémorisé pour 716 cartes. Proportion négligeable ; le collectif novembre est le cas nominal.

9. **Relations transversales sous-explorées ?**  
Pipeline d’exploration incomplet + instrumentation qui compte des modules « attendus » sans preuve d’applicabilité. Pas seulement un manque de cartes.

10. **Quatre passes : analytiques ou transformations de cartes ?**  
**Les deux.** Validation/wrap et sélection sont structurantes ; consolidation/revue fusionnent encore trop souvent des cartes. Composition parallèle est une vraie passe analytique quand les métriques sont saines.

11. **Frein à la généralisation programmes ?**  
Matching session-level, nameMap vide, confusion preuve historique vs rapprochement structurel, et sur-ajustement aux cas Hyperextension/pompes/novembre.

12. **Horizons identiques justifiés par les données ?**  
**En partie.** Historique reps depuis janv. 2026 → 6m/1y/2y/all partagent l’essentiel des événements. Le reste est sous-exploration éditoriale (même titres sans nouvelle question).

13. **Reste par phase**  
- P0/P1 : métriques typées partout ; jeux A live.  
- P2 : mémoire généralisée ; horizons.  
- P3 : exploration relations applicables.  
- P4/P5 : déjà partiels ; programme session-level.  
- P6 : intégrité graphe produit + migration garanties + abondance + DOM.  
- P7/P8 : implications, planner, VIE.

14. **Ce que ChatGPT attribue à tort à P6**  
Le déploiement complet du HypothesisPlanner ; l’exigence de « tout producteur réécrit » ; traiter chaque différence d’horizon comme un bug alors que les données sont identiques.

15. **Laisser à P7/P8**  
Planner LLM, projections/implications, VIE riche, incrémental lourd, saturation shadow mode.

16. **Simplifier / réunir**  
- Unifier extracteurs métriques.  
- Fusionner chemins disposition sélection/publication.  
- Réduire les phenomenonId texte.  
- Un seul compteur mémoire publication/exposition clairement séparé.

17. **Trois interventions meilleur effort/gain**  
1. Contrat métrique + remontée `recentReps` structurés (fait M28 partiellement).  
2. Réconciliation orphan / pas de suppression sans destination (fait M28).  
3. Remplacer les 258 « memoryAbsent » par une taxonomie applicable/exécuté/abstention — puis 2–3 relations transversales réellement applicables.

18. **Sur-ajustement utilisateur**  
Règles spéciales Hyperextension, pompes, novembre ; regex de prose ; forcer des différences d’horizons artificielles.

19. **Éviter M16–18 / M23–27**  
Geler contrats (identité, métrique, publication) ; une campagne de preuve unique ; si une famille échoue 2 fois → analyser responsabilités avant nouveau patch.

20. **Critères objectifs de fin P6**  
Voir `PLAN_CLOTURE_FINITE_P6.md` : liste finie, pas de % global. Tant que orphan/métriques/autorité/mémoire minimale/jeux A–C pipeline/DOM ne sont pas démontrés → NO-GO P7.

---

## Méthode sur le cas Hyperextension

| Étape | Contenu |
|---|---|
| Hypothèse ChatGPT | Collision d’identité / moyenne prise pour total |
| Réel | Suppression sélection sans destination + subjectKey→name + extracteurs mean-first |
| Premier point de rupture | `subjectKey()` ignore `parallel:` ; `marginalValue` overlap sans `collapsedInto` |
| Alternatives | Forcer publication parent ; supprimer enfants ; regex spéciale — rejetées |
| Recommandation | Contrats génériques (M28) + rejeu |
| Preuve | UT M28 verts ; rejeu produit encore requis |
