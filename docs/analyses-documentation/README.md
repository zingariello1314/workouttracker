# Analyses — documentation de référence

Dossier de travail pour faire avancer le moteur d’analyses Recap (toutes plages horaires).

| Document | Rôle |
| --- | --- |
| [MISSION-AMELIORATION-MOTEUR-ANALYSE.md](./MISSION-AMELIORATION-MOTEUR-ANALYSE.md) | **Fil rouge opérationnel** : mission autonome (audit → référence → correctifs → profondeur → compte rendu). L’agent avance sans validations intermédiaires sauf arbitrage métier / risque irréversible. Validation live possible via session navigateur `localhost:3001`. |
| [AUDIT-STRATEGIQUE-MOTEUR-ANALYSE.md](./AUDIT-STRATEGIQUE-MOTEUR-ANALYSE.md) | Audit code-first (oct. 2026) : architecture actuelle, limites, 14 cartes 30 j. comme cas d’étude, options, questions ouvertes |
| [ARCHITECTURE-CIBLE-MOTEUR-ANALYSE.md](./ARCHITECTURE-CIBLE-MOTEUR-ANALYSE.md) | Architecture cible : grille de qualité, modèle claims/indicateurs, temporalité flexible, traçabilité des calculs, croisements, sélection par utilité, mapping composants, plan par phases |

**Ordre de lecture :** mission (comment travailler) → audit (état des lieux) → architecture cible (cadre de conception) → implémentation par étapes.

Les documents de conception n’ont pas modifié le code applicatif ; l’implémentation suit la mission.
