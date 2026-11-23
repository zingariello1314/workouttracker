# Préparation Jeux B & C (Mission 30) — paquet aveugle

**Non exécuté comme clôture** dans M30. Corpus prêt pour comparaison indépendante.

## Structure

| Fichier | Contenu |
|---|---|
| `design-cases.json` | Exemples ayant servi à concevoir les règles |
| `generalization-cases.json` | Exemples hors conception |
| `blind-labels.json` | Labels A/B sans révéler la version moteur |
| `scoring-rubric.md` | Exactitude, pertinence, profondeur, valeur explicative, originalité, calibration, qualité collective, stabilité chronologique |

## Règles

- Ne pas utiliser les scores internes du moteur comme résultat d’évaluation.
- Simulations chronologiques : respecter `knownAt` / `knowledgeCutoff`.
- Séparer conception et généralisation avant tout scoring.
