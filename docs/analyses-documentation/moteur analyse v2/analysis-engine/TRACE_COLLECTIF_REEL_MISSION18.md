# TRACE_COLLECTIF_REEL — Mission 18

Édition : `p6-sovereign-v17`. Aucun commit. NO-GO P7.

## Environnement de rejeu

| Élément | Valeur |
|---|---|
| Commande | `npx vite-node scripts/m18-replay-collective.mjs --end=2026-11-19` |
| Snapshot | `momentum-sport-backup-2026-11-19.json` → payload = `backup.data` |
| Chemins | Downloads + attachments Cursor (les deux existent) |
| Artefact | `artifacts/analysis-eval/mission18-replay-7d-30d.json` |
| Trace hors moteur | `npx vite-node scripts/m18-trace-collective.mjs` + audit v16 |

**Attention** : un export `ANALYTICAL_AUDIT` n’est pas un snapshot source. Les séances du **18 novembre** sont absentes du backup du 19 nov. (dernier jour de force documenté : **17 nov.**). Pour le mode *confirmation* 7j, il faut un backup sport ≥ 21 nov. depuis l’app.

## Cas des neuf mouvements (export v16)

| ID | Présent backup 19 | Consolidation shadow 30j | Dans pack rejeu 30j |
|---|---|---|---|
| 302 Pompes pseudo-planche | oui (11 nov.) | `resumed_former_level`, gap 28 | oui |
| 304 Élévations latérales | oui | idem | oui |
| 306 Face pull | oui | idem | oui |
| 307 Extension triceps | oui | `interrupted_progression` / partial | oui |
| 308 Kickbacks | oui | `partial_resume` | oui |
| 1599606959 Arnold | oui | `insufficient` (<4 séances) | non |
| 1735485569 Bent-Arm | oui | `insufficient` | non |
| 369862756 Lying ext. | oui | `insufficient` | non |
| 1250363242 Side-Lying | oui | `insufficient` | non |

## Étages de rupture (v16 → cause)

1. **Detect / consolidations** : les neuf cartes existent dans l’export live (preuve Nov 18 dans la fenêtre).
2. **`returnEvents`** : construits avec `returnDate=2026-11-11`, `gapDays=28`, `mechanism` — OK.
3. **`exploreCollectiveReturn` (avant M18)** : **premier étage de rupture produit**. Tous les retours à gap≥7 (mai→nov) étaient passés ensemble → `sameWindow=false` / co-occurrence diluée → `coverage=under_explored` → **aucun** `disc_collective_return` poussé (0 candidat dans l’audit v16).
4. **Filet `reviewCollectively`** : réexploration `individual_returns_without_collective` **sans** `gapDays` / `mechanism` → `significantGap` filtre tout → under_explored (confirmé par `mission18-collective-trace.json`).
5. **Cause secondaire (backup sans Nov 18)** : `claimDatesFor` 30j ne gardait que la 2ᵉ moitié des séances ; une seule séance (11 nov.) → `observed=[]` → `no_evidence_in_window` → consolidations non publiées → cluster Nov 11 absent du pool.

## Correction appliquée

- Cluster par **jour de reprise** + score fenêtre (`analyticalExploration.js`).
- `claimDatesFor` inclut `gap.after` s’il est dans la fenêtre.
- `reviewCollectively` propage gap / mechanism / returnDate.
- Préférence d’épisode **dans la fenêtre** (évite de publier mai à la place de nov.).

## Résultat rejeu moteur (30j, end=2026-11-19)

- `collectiveInAll=1`, `collectiveInSelected=1`
- Titre : « Une composante de ton entraînement se réinstalle »
- `readingMode=return`, `episodeClusterDate=2026-11-11`
- Nommés : Pompes pseudo-planche, Élévations latérales, Face pull, Extensions triceps unilatérales, Kickbacks triceps
- Limite : 4 mouvements `insufficient` ; confirmation 18 nov. absente du backup

## 7j

Sans séances du 18 nov. dans le snapshot, le mode confirmation du cluster Nov 11 n’est **pas** démontrable. Un autre collectif (relevés de genoux) peut encore gagner via confirmation dans la fenêtre 7j — à rejouer après backup ≥ 21 nov.

## Niveaux de preuve (A/B/C/D)

| Niveau | Statut rejeu 30j |
|---|---|
| A Même jour de reprise | **démontré** (11 nov.) |
| B Même séance / organisation | **allégué** par composition (« même organisation de séance ») — familles musculaires multiples |
| C Composante identifiable | **partiel** (lecture collective publiée) |
| D Composante du programme prévu | **non démontré** (pas de prescription historique croisée ici) |
