# Procédure Chrome — Mission 33 / correctif DOM

Édition : `p6-sovereign-v32`. Aucun nouveau bouton.

## Ordre

1. Ouvrir **Récap → Analyse** (admin / `DEV`). Attendre cartes visibles (pas seulement le loader).
2. **« Vérifier les 8 périodes (DOM) »**  
   - Télécharge `momentum-DOM-EIGHT-PERIODS-….json` (schema **v2**).  
   - Mémorise `__momentumLastDomVerify`.  
   - Ne modifie pas la mémoire éditoriale.
3. **« Exporter le dossier d’audit complet »** pour inclure le DOM dans le ZIP.

## Lecture du rapport v2

| Champ | Attendu |
|---|---|
| `schema` | `momentum.domEightPeriodVerify.v2` |
| `status` global | `observed` seulement si ≥1 période a des cartes montées ; sinon `observation_incomplete` |
| `periods[].statusLabel` | `CONFORME` / `DIVERGENT` / `VIRTUALISE_ACCESSIBLE` / `NON_PRET` / `NON_RENDU` / `NON_OBSERVABLE` |
| `periods[].domCardCount` | ≥ 1 si le panneau affiche des cartes |
| `periods[].observedIdentities` | ids registre (`data-card-id`) |
| `periods[].uiCounters.scopedToAnalyseRoot` | `true` |
| `editorialMemoryModified` | `false` |

### 7d (contrôle minimal)

- Pack ~11 priorités + réserve.
- Au moins une identité observée correspondant au pack.
- Ne pas exiger `domCardCount === packAccessibleCount` (réserve / virtualisation).

## Interdits

- Ne pas confondre `NON_RENDU` avec disparition des analyses.
- Ne pas présenter un ancien `computed_not_rendered_or_unobservable` comme preuve DOM.
- `computed_not_rendered` dans un export 8 périodes ≠ observation navigateur.
