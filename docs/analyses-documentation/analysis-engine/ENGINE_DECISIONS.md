# Journal des décisions structurantes

## D-2026-11-04-01 — Préserver le composé, corriger la sélection

- **Problème :** audit contradictoire : capacités F4/preuves existent mais ne dominent pas le DOM
- **Options :** (A) refonte totale (B) unifier sélection pour faire gagner les meilleures preuves
- **Retenu :** B — pas de recreation sous nouveaux noms
- **Conséquence :** kinship + IV + adaptive weights ; docs permanentes

## D-2026-11-04-02 — Identité de reprise par nom normalisé

- **Problème :** 42 j / 77 j avec storage ids distincts
- **Options :** (A) fusionner tout homonyme (B) fusionner seulement reprises sur même famille de mouvement (C) exiger alias prouvé
- **Retenu :** B pour épisodes de reprise uniquement ; A trop dangereux hors reprise
- **Compromis :** risque résiduel si deux exercices réellement distincts partagent le même libellé et deux retours simultanés (rare)

## D-2026-11-04-03 — Rivalité volume attributive vs descriptive

- **Problème :** portrait `disc_volume_shape` bat `span_volume_vs_frequency`
- **Retenu :** rivalité explicite `global_volume` dans kinship + boost poids span + pénalité shape
- **Écarté :** bonus ad hoc sur un titre précis

## D-2026-11-04-04 — Référentiels explicites en narration F4

- **Problème :** early/late d’arc vs moyennes fenêtre dans la même carte
- **Retenu :** si attribution fréquence + perNear, l’observation suit les fenêtres ; hard consistency sinon
- **Écarté :** supprimer les arcs early/late (utiles quand pas d’attribution fréquence)
