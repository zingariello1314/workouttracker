# Audit réactivité — onglet Aujourd’hui

18 novembre 2026. Diagnostic seulement : aucun changement du pipeline de sauvegarde en production.

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

Statuts utilisés partout :

- **Démontré** — le code fait cette chose, ou ne la fait pas.
- **Supposé** — intention lisible dans un commentaire ou un nom, sans preuve que le cas visé est couvert.
- **Non assuré** — le code ne fournit pas cette garantie.
- **Non mesuré** — aucun chiffre de durée, CPU ou rendu n’a été produit dans cette mission.
