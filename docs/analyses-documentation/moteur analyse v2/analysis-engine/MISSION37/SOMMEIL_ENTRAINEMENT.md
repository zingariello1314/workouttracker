# Croisements sommeil / entraînement (v35 → v36)

## Carte famille (disc_sleep_family)

| Élément | Valeur v35 |
|---|---|
| Poussée rétention | 62,6 % |
| Tirage rétention | 97,3 % |
| Effectifs | 9 (nuit courte) / 33 (réf.) |
| Densité liée | carte séparée 347 vs 322 reps/h (32 / 8) |

### Vérifications

1. **Effectifs** : asymétriques — interdire toute lecture de « sensibilité » robuste.
2. **Couverture** : association sur séances classées poussée/tirage, pas sur tout le calendrier.
3. **Classification** : familles de séances (pas physiologie musculaire pure).
4. **Stabilité** : non rejouée sur bootstrap ; une seule fenêtre exportée.
5. **Concurrents** : contenu de séance, jour de semaine, planification — non isolés.
6. **Moyennes** : rétention = volume après nuit courte / volume habituel de la famille.

### Conclusion M37

Les données montrent une **association descriptive** d’écart de rétention.  
Elles **ne démontrent pas** qu’une qualité soit physiologiquement « plus sensible » au sommeil.  
Prose corrigée à la source ; footer association conservé.

## Densité (disc_sleep_intensity)

Moyennes reps/h — utile comme lecture de **densité de travail**, pas d’intensité d’échec.  
Formulation renforcée (associationOnly).
