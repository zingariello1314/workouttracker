# Feuille de route v6 — version finale

*Mis à jour après livraison **v6.1 cœur** (phases 0–8 + extensions plan de base).*

## Où en est-on ?

| Jalón | Contenu | Statut |
|-------|---------|--------|
| **v6.0 safe** | Phases 0→3→5→6→7→8 + budgets/placement/compat/fill/km | ✅ |
| **v6.1 cœur** | Phase 4 séries, PlanCost, opérateurs locaux, streetSkill, remainingSets, DoD §9 | ✅ |
| **v6.2a** | Boucle budgets live + stagnation regen | ✅ |
| **v6.2b** | Tri, marathon long, sports collectifs, compat 9 familles | ✅ |
| **v6.2c** | Sports collectif/combat/militaire + replan léger | ✅ |
| **v6.3** | Nutrition jour/jour, gate CI 85 %, replan optimisé | ✅ |
| **v6.4+** | Replan UI calendrier, repas auto complets | 🔲 |
| **v6.3+** | Replan calendrier, repas alignés, gate CI banque 85 % | Hors scope doc |

## Phases du plan de migration (§8) — bilan

| Phase | Intitulé | Statut |
|-------|----------|--------|
| **0** | Gel / fixtures / snapshots | ✅ |
| **1** | Mission + budgets | ✅ |
| **2** | Placement blocs | ✅ |
| **3** | Compatibilité blocs | ✅ |
| **4** | Allocation séries (v6.1) | ✅ |
| **5** | Fill exercices | ✅ |
| **6** | Cardio km + présentation | ✅ |
| **7** | Quiz v12 | ✅ |
| **8** | Préférences historique | ✅ |
| **§14.2** | `quizPlanCost` | ✅ |
| **§14.2 bis** | Opérateurs locaux pré-fill | ✅ |
| **§6.7** | `streetSkillGoal` | ✅ |
| **§14.5** | Feedback budgets (génération) | ✅ (statique) |

**Phases « plan de base » : 0 à 8 + extensions §14 → terminées pour la cible v6.1.**

## Combien de phases avant la « version finale » ?

Deux lectures possibles :

### A) Version finale **moteur v6.1** (recommandée produit)

**0 phase bloquante restante** du plan §8 initial.

Il reste des **extensions v6.2** (non numérotées comme phases 9–11 dans la spec, mais listées §6.3 / §11 / §14.5 live) :

| Extension | Effort indicatif | Bloquant ? |
|-----------|------------------|------------|
| Boucle budgets **semaine N+1 live** (adhérence → ±5 % budgets) | 3–5 j | Non |
| Module **triathlon** | — | ✅ v6.2b |
| Missions **combat / collectif / militaire** | — | ✅ v6.2b (profils) |
| Matrice compat **élargie** (>8 paires) | — | ✅ v6.2b |
| **Replan** calendrier (swap jours) | 8–12 j | Hors scope v6 |
| Gate CI **85 %** fitness banque | Continu | Non |

→ **~2 à 3 « vagues » v6.2** si tu vises la spec « complète » §6.3–6.8, pas seulement le moteur hypertrophie/course.

### B) Version finale **produit Momentum** (doc §11)

| Vague | Contenu |
|-------|---------|
| **v6.2** | Tri + marathon 60–120 km + street skills UI complète + matrice compat |
| **v6.3** | Boucle budgets adaptative + stagnation → regen quiz |
| **v6.4+** | Replan calendrier, nutrition jour/jour, triathlon complet |

→ **3 vagues majeures** après v6.1, en plus des 9 phases déjà livrées.

## Synthèse une phrase

Le **plan de migration pas à pas (phases 0–8) est complet** ; la **version finale « moteur »** est atteinte en **v6.1**. Il reste **0 phase du plan initial**, et **2–3 extensions v6.2+** pour la vision produit élargie (tri, sports, live budgets).
