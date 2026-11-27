# Contrat DOM — observation Analyse (M33-DOM)

Réservé à la vérification. N’influence pas le calcul analytique.

## Racine panneau

| Attribut | Valeurs | Rôle |
|---|---|---|
| `data-analyse-period` | `today` \| `7d` \| … | Période rendue |
| `data-analyse-window-start` / `-end` | YYYY-MM-DD | Fenêtre |
| `data-analyse-waiting` | `true` \| `false` | Loader / pas encore de cartes |
| `data-analyse-publication-ready` | `true` \| `false` | Publication alignée → cartes autorisées |
| `data-analyse-filter` | `all` \| famille | Filtre actif |
| `data-analyse-counter="toutes"` + `data-analyse-counter-value` | entier | Compteur filtre (scopé) |

## Carte

| Attribut | Valeurs | Rôle |
|---|---|---|
| `data-analyse-card` | `true` (priorité) \| `accessible` (complément) | Présence montée |
| `data-role` | `priority` \| `reserve` | Rôle éditorial |
| `data-card-id` | id registre (`card.id`) | Identité stable — **pas** le titre |
| `data-title` | texte | Miroir titre (optionnel) |
| `data-phenomenon-id` / `data-publication-id` | ids | Liens secondaires |

## Statuts rapport (`statusLabel`)

| Label | `status` | Signification |
|---|---|---|
| CONFORME | `rendered_and_conform` | Identités montées ≡ pack |
| DIVERGENT | `rendered_and_divergent` | Cartes montées mais écart ids/titres |
| VIRTUALISE_ACCESSIBLE | `partial_mount_virtualized_accessible` | Montage partiel, priorités OK |
| NON_PRET | `not_ready` | Calcul non ready |
| NON_RENDU | `not_rendered` | Pack prêt, cartes non montées |
| NON_OBSERVABLE | `not_observable` | Panneau Analyse absent |

Un `status: observed` global **ne valide pas** les 8 horizons si les lignes sont `NON_RENDU` / `NON_OBSERVABLE`.

**Interdit :** présenter `computed_not_rendered` comme observation DOM positive.
