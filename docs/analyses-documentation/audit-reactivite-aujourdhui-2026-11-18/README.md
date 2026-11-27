# Audit réactivité — onglet Aujourd’hui

18 novembre 2026. E2.1 est dans le source : le garde-fou d’endurance refuse un GTG vide non explicite. E2.2 est dans le source : `calculateSportXP` appelle le bonus de complétion indexé. E3 ajoute un contrat opt-in SUCCESS / FAILURE / UNKNOWN sur les seuls parcours GTG et pompes. Sans l’option, `saveToDB` et `updateData` gardent leur comportement précédent.

L’audit de fluidité du 27 novembre 2026 est dans [../audit-reactivite-aujourdhui-2026-11-27/RAPPORT.md](../audit-reactivite-aujourdhui-2026-11-27/RAPPORT.md).

Point de départ : `docs/analyses-documentation/LATENCE-COCHE-ENREGISTREMENT-XP-2026-11-18.md`.
Les hypothèses de ce premier relevé ne sont pas reprises ici comme des causes mesurées.

| Document | Rôle |
| --- | --- |
| [01-architecture-actuelle-et-garanties.md](01-architecture-actuelle-et-garanties.md) | Mécanismes, pourquoi ils existent, garanties démontrées ou non |
| [02-diagnostic-instrumente.md](02-diagnostic-instrumente.md) | Causes confirmées par lecture, hypothèses ouvertes, protocole de mesure |
| [03-comparaison-architectures.md](03-comparaison-architectures.md) | Architectures A, B, C, D |
| [04-architecture-cible.md](04-architecture-cible.md) | Cible recommandée |
| [05-plan-implementation.md](05-plan-implementation.md) | Phases, tests, rollback |
| [DPLUS-01-critique-architecture-D.md](DPLUS-01-critique-architecture-D.md) | Ce que D laisse ouvert |
| [DPLUS-02-persistance-brouillons.md](DPLUS-02-persistance-brouillons.md) | Brouillon durable distinct de la séance validée |
| [DPLUS-03-coordination-transactionnelle.md](DPLUS-03-coordination-transactionnelle.md) | Transactions, versions, deux onglets |
| [DPLUS-04-architecture-D-plus.md](DPLUS-04-architecture-D-plus.md) | Cible D+ |
| [DPLUS-05-benchmarks-restauration.md](DPLUS-05-benchmarks-restauration.md) | Mesures, pannes, restauration |
| [DPLUS-06-decision-et-plan.md](DPLUS-06-decision-et-plan.md) | D contre D+, décision, phases |
| [DPLUS-HARDENING.md](DPLUS-HARDENING.md) | Risques A–F, corrections minimales |
| [DPLUS-IMPLEMENTATION-READY.md](DPLUS-IMPLEMENTATION-READY.md) | D+ corrigée, gates, catégories |
| [DPLUS-PHASE0-RESULTS.md](DPLUS-PHASE0-RESULTS.md) | Mesures isolées du 18 novembre 2026 |
| [DPLUS-XP-PROFILING.md](DPLUS-XP-PROFILING.md) | Où part le temps de `calculateSportXP` |
| [DPLUS-FINAL-CONTRACTS.md](DPLUS-FINAL-CONTRACTS.md) | Brouillons, effets, identifiants |
| [DPLUS-INTEGRATION-RESULTS.md](DPLUS-INTEGRATION-RESULTS.md) | Tests exécutés et tests non lancés |
| [DPLUS-EXECUTION-PLAN.md](DPLUS-EXECUTION-PLAN.md) | Ordre C2.1 à C2.6 et jalons B |
| [E1-C21-VALIDATION.md](E1-C21-VALIDATION.md) | Vrai `saveToDB`, contrat d’erreur, NO-GO |
| [E1-XP-EXACT-OPTIMIZATION.md](E1-XP-EXACT-OPTIMIZATION.md) | Bonus indexé, égalité et mesures |
| [E1-GTG-DATA-SAFETY.md](E1-GTG-DATA-SAFETY.md) | Effacement GTG et politique explicite |
| [E2-INTEGRATION-RESULTS.md](E2-INTEGRATION-RESULTS.md) | E2.1 intégré, E2.2 et E2.3 préparés |
| [E2.2-ACTIVATION.md](E2.2-ACTIVATION.md) | Bonus indexé activé, mesures et rollback |
| [E3-PERSISTENCE-INTEGRATION.md](E3-PERSISTENCE-INTEGRATION.md) | Contrat opt-in GTG et pompes, preuves et limites |

La légende « Non mesuré » vaut encore pour le clic jusqu’à la peinture et pour IndexedDB. Les durées de `DPLUS-PHASE0-RESULTS.md` sont des exécutions Node et vitest sur jeux synthétiques.

Statuts utilisés partout :

- **Démontré** — le code fait cette chose, ou ne la fait pas.
- **Supposé** — intention lisible dans un commentaire ou un nom, sans preuve que le cas visé est couvert.
- **Non assuré** — le code ne fournit pas cette garantie.
- **Non mesuré** — aucun chiffre de durée, CPU ou rendu n’a été produit dans cette mission.
