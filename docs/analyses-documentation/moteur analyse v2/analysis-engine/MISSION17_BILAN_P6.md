# Mission 17 — Bilan P6

**Verdict : causes racines du collectif et des variantes corrigées en code + tests — rejeu live utilisateur requis pour candidature — P6 non candidate — NO-GO P7.**

Édition : `editorial=p6-sovereign-v16` · `collectiveReturn=episode-cooccurrence-v2` · `programReasoning=variant-mix-direction-v2`

Baseline v15 : `artifacts/analysis-eval/baselines/p6-sovereign-v15-before-mission17.json`

**Aucun commit. Aucun P7.**

---

## Réponses aux 18 questions

1. **Pourquoi le collectif manquait malgré gapDays ?** Les 6 reprises du 11 nov portent 3 familles musculaires (épaules / triceps / poitrine). Sans `sessionFamilyId` commun, `exploreCollectiveReturn` exigeait un lien famille≤2 ou créneau partagé → `UNDER_EXPLORED`. La co-occurrence du **même jour de reprise** n’était pas un lien retenu.

2. **Reprise 11 nov vs confirmation 18 nov ?** `returnDate` / `gapAfter` = reprise ; `metrics.dates` postérieures = confirmations. Sur 7j : `readingMode=confirmation` ; sur 30j : `return`.

3. **Collectifs publiés ?** Produits en packs synthétiques alignés mi-novembre (tests). Live utilisateur : **à rejouer** après déploiement v16.

4. **Hausses décrites comme baisses ?** Prose figée « La baisse de moyenne… » indépendante du signe de `globalDeltaPct`. Corrigé : direction avant rédaction.

5. **Occurrences non appariées ?** Comptées (`unknownBefore` / `unknownAfter`) et verbalisées dans la prose mix.

6. **Appariement circulaire ?** Volume = indice secondaire documenté ; greffe mix interdite sur reprises de format / parts musculaires ; slot match prioritaire quand disponible. Appariement 100 % compositionnel historique : encore partiel.

7. **Variantes améliorées ?** Direction + compatibilité de thèse + titres reconstruits (plus de greffe sur « s’efface de ton tronc »).

8. **Prioritaires ?** Boost sélection `variant_mix` / `collective_return` sur week/month. Live **NON_VÉRIFIÉ**.

9. **Volume par famille ?** Non bouclé (livraison 3.1 reportée).

10. **Adhérence packs complets ?** Module existant ; packs versionnés pipeline complet non étendus cette mission.

11. **Mémoire ?** Non bouclée (`not_passed_to_export`).

12. **Différences horizons ?** Mécanisme reprise/confirmation distingué ; arcs longs non enrichis.

13. **Doublons consolidés ?** Pic 18 nov : mécanisme M16 conservé ; live encore redondant en v15.

14. **Approfondissements accessibles ?** Non re-mesuré live.

15. **11→3 faits ?** Refus des faits sans fenêtre + sujet déduit d’une date de carte → trop peu, et faux sujets `day:`.

16. **Identités faits ?** `period_volume:start:end` pour totaux de période ; `day:` seulement si fenêtre ≤1 jour.

17. **A/B/C ?** Non exécutés live ; 60 tests M12–M17 PASS.

18. **ASPECT P6 non démontrés ?** Rejeu 8 horizons, mémoire, sommeil contextualisé, décomposition mensuelle par familles, fingerprint multi-sources, DOM, évaluation qualitative indépendante.

---

## Matrice

| Chantier | Statut |
|----------|--------|
| Collectif co-occurrence + épisode | CORRIGÉ (tests) / live à rejouer |
| Direction variantes | CORRIGÉ |
| Greffe incompatible | CORRIGÉ |
| Faits périodiques | CORRIGÉ |
| pop:[object Object] | CORRIGÉ |
| Mission hardcode exports | CORRIGÉ (`analysisMissionLabel`) |
| Décomp. familles mensuelle | OUVERT |
| Adhérence longitudinale packs | OUVERT |
| Mémoire / sommeil / DOM | OUVERT |
