# Porte B — Parité DOM

## B1 — Faux DIVERGENT (30d / 3m / 6m)

| Étape | Contenu |
|---|---|
| **Cause** | Titre sommeil tronqué à 110 caractères (`draftFromClaim.titleFromClaim`) laissant `… ou ` ; `packCards` faisait `.trim()` → `ou`, le DOM gardait l’espace final → faux extra/missing titre. Identités pack↔DOM déjà alignées (0 missingIds). |
| **Preuve** | `dom-eight-periods.json` : paires `extraInDom` / `missingFromDom` différant uniquement par un espace final. |
| **Correction** | `normalizeTitleForCompare` (trim + collapse whitespace) dans la comparaison DOM ; truncation titre au bord de mot + `…` ; architecture DOM **non rouverte**. |
| **Test** | UT normalisation espace final vs différence de mot. |
| **Résultat** | Les trois faux DIVERGENT deviennent CONFORME dès rejeu Chrome (comparaison). |

## B2 — `ex:505` absent sur 1y / 2y / all

| Étape | Contenu |
|---|---|
| **Cause** | `RecapAnalyseView` filtrait la réserve par **titre exact** : `ex:106` prioritaire (« Relevés… volume stable ») masquait `ex:505` (même titre, 16 séances ≠ 21). Disposition registre : `demoted_priority` / `family_cap_reserve`, **published**, sans `collapsedInto`. Une seule cause pour trois horizons. |
| **Preuve** | DOM miss unique `disc_emergence\|ex:505|…` ×3 ; corps distincts 21 vs 16 séances. |
| **Correction** | Dédup titre réservée aux collisions **même exerciseId** (ou sans id) ; homonymes d’id distincts restent montés. |
| **Test** | Jeu C UT : titres identiques + corps/ids distincts accessibles. |
| **Résultat** | Carte 505 consultable si présente au pack — sans fusion avec 106. |
