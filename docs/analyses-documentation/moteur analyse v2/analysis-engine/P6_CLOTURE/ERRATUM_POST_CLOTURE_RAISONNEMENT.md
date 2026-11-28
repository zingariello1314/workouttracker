# Erratum post-clôture P6 — raisonnement trajectoire

**Statut administratif P6 :** reste **clôturée** avec limites documentées.  
**Nature :** correctif qualité ponctuel (pas Mission 38, pas réouverture générale).  
**Édition code du correctif :** `p6-sovereign-v37` (raisonnement) · suite restitution `p6-sovereign-v38`  
**Observation Chrome concernée :** v36 · `c3e80330` (non réécrite rétroactivement).  
**NO-GO P7 · aucun commit Git.**  
**Suite :** [RAPPORT_JALON_RESTITUTION_V38.md](./RAPPORT_JALON_RESTITUTION_V38.md) — preuve/footer outlier, portées, parcours visuels.

## Défaut découvert après clôture

| | |
|---|---|
| Cartes | V36-008, V36-036 |
| Titre v36 | « Hyperextension : recul confirmé sur plusieurs séances » |
| Exercice | `ex:703294235` |
| Série | 7×48 puis 1×24 (23 nov. 2026) |
| Erreur | Une moyenne late (40) et un seul point bas présentés comme recul **confirmé sur plusieurs séances** |

## Cause identifiée

Chaîne : événements → `classifyShape` → `primaryStory=net_decline` + `kind=steady_decline` (via `monotoneDown` trop permissif sur une fenêtre de 3) → `classifyContinuity` → `confirmed_decline` → titre/note « recul confirmé… ».

Points précis :
1. `monotoneDown([48,48,24])` acceptait 1 seul drop.
2. Seuil d’atypique `≤0,4×médiane` manquait le 24/48.
3. Le titre utilisait `story === 'net_decline'` même hors `confirmed_decline`.

## Correction (v37)

| Fichier | Changement |
|---|---|
| `exerciseTrajectoryAnalysis.js` | Plateau + baisse terminale → `outlier_driven` / `terminal_outlier` ; `monotoneDown/Up` exige ≥2 pas sans contre-pas ; compteur `trailingDeclineCount` |
| `recapComposedEvidence.js` | `confirmed_decline` seulement si baisse répétée en suffixe / progressive ; retour avant plateau |
| `recapComposedNarration.js` | Outlier avant « confirmé » ; note de continuité ponctuelle |

## Tests

`src/utils/sport/__tests__/postP6TrajectoryDeclineSemantics.test.js` — 9 tests dont :
- `48×7 + 24` → isolated_outlier, pas confirmed_decline  
- `48,48,48,40,36,32` → confirmed_decline  
- fluctuations / plateau / retour / homonymes  
- plateau reps (pas de recul inventé si seule la charge changerait)  
- sans séries fiables : pas de tendance structurelle fabriquée  

Non-régression : `exerciseTrajectoryAnalysis`, `recapComposedEvidence`, `recapComposedNarration`, `mission37` — **PASS**.  
Rapport : [RAPPORT_CORRECTIF_QUALITE_POST_P6.md](./RAPPORT_CORRECTIF_QUALITE_POST_P6.md).

## Autres correctifs bornés (même passe)

| Carte | Correctif |
|---|---|
| V36-026 | Absence de course ≠ charge totale ; canaux couverts explicites |
| V36-003 | Titre historique, plus « nuit précédente » individualisée |
| V36-009 | Titre/corps : comparateur nommé (`mois précédent dans la fenêtre`) |
| V36-018 | Écart de points sur **même modalité** (part ≥7h30) |
| V36-021 | Partition sommeil non exhaustive signalée (7h–7h29 hors groupes) |
| V36-023 | Distinguer contribution nette au Δ vs stock non attribué |

## Non modifié / non rejoué

- DOM, Dips, homonymes UI, rejeu 8h complet, jeux A/B/C live Chrome.  
- Pas de nouvel export navigateur : **ne pas affirmer** que Chrome v37 a été observé.  
- Pas d’optimisation du score 12,08/20.

## Limites restantes

- Horizons longs : répétitions GTG / stabilité 3×20 — chevauchement légitime ; valeur marginale éditoriale encore ouverte, sans suppression silencieuse.  
- Cartes de couverture programme (V36-030–032) : fiabilité vs « découverte » — clarification partielle hors refonte éditoriale.  
- Notation humaine aveugle : toujours absente.
