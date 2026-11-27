# Procédure Chrome — preuves reproductibles (Mission 32)

Édition attendue : `p6-sovereign-v31`.  
L’agent **ne capture pas** votre navigateur. Exécutez vous-même :

## Ordre obligatoire

1. Ouvrir **Récap → Analyse** (compte admin ou `DEV`).
2. Attendre `ready` sur la période courante.
3. Cliquer **« Vérifier les 8 périodes (DOM) »**.
   - Télécharge `momentum-DOM-EIGHT-PERIODS-….json`.
   - Mémorise le rapport dans la session (`__momentumLastDomVerify`).
   - Ne modifie **pas** la mémoire éditoriale.
4. Immédiatement après, **« Exporter le dossier d’audit complet »**.
   - ZIP contenant notamment :
     - `ANALYTICAL_AUDIT.json` (dont `diagnostics.populationMetricChecks`)
     - `replay/LIVE_INPUTS.json` ← **empreinte live** (`c8aa227e` attendu si mêmes données)
     - `evaluation/dom-eight-periods.json` ← si l’étape 3 a réussi
     - traces / 8 périodes / MANIFEST

## Contrôles à lire

| Fichier | Chercher |
|---|---|
| `replay/LIVE_INPUTS.json` | `fingerprints.digest` == digest live ; `sources.reps` présent |
| `evaluation/dom-eight-periods.json` | `status: observed` ; pas `not_observed` |
| `ANALYTICAL_AUDIT.json` → `diagnostics.populationMetricChecks` | counts `fail` / `noncomparable` / `pass` |
| `MANIFEST.json` | fichiers `included` vs `missing` |

## Interdits

- Ne pas confondre un export de conclusions avec `LIVE_INPUTS`.
- Un DOM virtualisé (`partial_mount_virtualized_accessible`) **n’est pas** un FAIL catalogue.
- Sans étape 3 : le ZIP doit garder **`DOM NON_OBSERVÉ`** — ne jamais inventer un PASS.
