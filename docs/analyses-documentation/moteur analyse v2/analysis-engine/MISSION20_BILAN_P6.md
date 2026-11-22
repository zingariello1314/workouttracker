# MISSION 20 — Bilan P6

Édition : `p6-sovereign-v18` → **`p6-sovereign-v19`**. P6 **non clôturée**. **NO-GO P7**. Aucun commit.

## Verdict

Les trois livraisons fondatrices sont en place : populations réconciliées numériquement, familles attribuées structurellement (avec résidu), épisode collectif à 9 mouvements + confirmation. La qualité analytique s’améliore franchement sur les parcours migrés ; elle n’est pas encore homogène sur tout le moteur (variantes absentes du backup, faits atomiques encore pauvres, DOM non observé).

## Livraison 1 — Vérité commune des populations

**Cause démontrée** (pas une hypothèse) :

- Analyses générales publiaient `strengthReps` / volume inclusif = brut − GTG + défis unsync → **6403 / 4281**.
- Composition familles consommait le catalogue lifetime (**CLASSIC_SESSION**, hors complémentaire) → **5803 / 3966**.
- Écart 600 = 300 complementary sync + 300 défis unsync.
- Jours 12 vs 16 (période préc.) = 4 jours GTG-only exclus du compteur exclusif.

**Décision** : module `canonicalAnalyticalPopulations` ; familles et ledger → `CLASSIC_SESSION` ; général → `STRENGTH_INCLUSIVE` ; bannière calendrier alignée sur les défis unsync. Libellés distincts, pas d’égalité forcée.

## Livraison 2 — Familles de séances

- Matching via `matchSessionToProgramSlot` (noms **et** ids) + clusters de créneaux.
- Contribution : ΔV ≈ effet fréquence + effet contenu (explicite dans le corps).
- Titre directionnel (7j : **baisse** 1996→1240 ; 30j : **hausse** 3966→5803).
- Attribution ~51 % récente ; résidu non attribué conservé.
- App vs rejeu : l’app a la banque d’exercices complète → meilleurs noms → meilleure attribution ; le rejeu sans noms tombait en « non attribué ».

## Livraison 3 — Épisode collectif

- 9 participants, gap 28 j, confirmation 18 nov dans la prose 7j.
- `sourceEvents` enrichis (`return_date`, `confirmation_date`).
- Muscles dérivés par mouvement (plus « chest » seul).
- Identité `return_episode|2026-11-11` stable sur les 8 horizons.

## Variantes

Le contrôle de circularité M19 reste actif. Pack positif (dayKey) → mix conclu. Backup réel → **0** carte mix (pas de greffe circulaire). Abstention préférée.

## Limites assumées

- Faits atomiques globaux encore ~2 (chantier facts-first partiel : populations + familles + épisode).
- Variantes non réapparues sur ce dataset.
- DOM **NON_OBSERVÉ**.
- Packs généralisation PPL/full-body : couverts en tests unitaires ciblés, pas en batterie A–F complète dans le rejeu.
- Vitest globale non rejouée in extenso (suites M17–M20 OK).

## Critères de réussite

| Critère | Statut |
|---|---|
| Écarts populations expliqués | **Oui** |
| Parcours migrés mêmes faits canoniques | **Oui** (familles/ledger/général étiquetés) |
| Familles par composition | **Oui** (partiel ~51 %) |
| Incertitudes historiques | **Oui** |
| Contributions mensuelles réconciliées | **Oui** |
| Variantes vs circularité | **Oui** (tests) / absentes sur backup |
| Collectif 9 + 3 dates + preuves | **Oui** |
| Conclusions publiées | **Oui** (rejeu) |
| Non-régressions | **Oui** (tests ciblés) |

## Suite recommandée (pas P7)

1. Remonter dayKey/sessionName dans les sessions de trajectoire pour réactiver les mixes non circulaires quand ils existent.
2. Facts-first élargi (fenêtres + comparateurs) avant mémoire chronologique.
3. Observation DOM authentifiée.
4. Puis seulement mémoire d’épisode durable.
