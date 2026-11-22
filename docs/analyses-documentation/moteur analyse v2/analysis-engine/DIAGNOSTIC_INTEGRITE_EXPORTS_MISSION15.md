# Diagnostic intégrité exports — Mission 15

Édition cible : `editorial=p6-sovereign-v14` · `claim=assertion-window-v1` · `audit=normalized-export-v3`  
Baseline : `artifacts/analysis-eval/baselines/p6-sovereign-v13-before-mission15.json`

---

## Collision claimRegistry

### Cause démontrée

```js
// buildAnalyticalAudit (v13)
claimRegistry[claim.id] = claim; // dernier horizon gagne
cardRegistry[`${period}|${card.id}`] = slim; // cartes OK
```

Cartes hebdo pointent vers `claimId` legacy ; le registre ne conserve qu’une preuve (souvent long horizon).

Exemple : pompes déclinées — carte 7j `windowMean=36`, claim écrasé `45.5` (fenêtre 1 an).

### Correction

| Identité | Rôle |
|---|---|
| `phenomenonClaimId` | Phénomène partageable |
| `assertionClaimKey` = `period\|phen\|win:start:end\|pop:` | Assertion contextualisée |
| `card.claimId` | Pointe vers l’assertion, pas le legacy seul |

Validateur : `validateCardClaimConsistency` + `validateAnalyticalAudit` refuse divergences.

Ordre court→long / long→court : mêmes clés (testé).

---

## Autres défauts export

| Défaut | Cause | Correction |
|---|---|---|
| 777 = 714 + 63 live | Miroir live + 8 périodes | Pas de miroir live si 8 périodes présentes |
| programRegistry no_program | Seul `snapshot.activeProgram` | Fallback `programs[]` + dossiers |
| AUDIT_IA Mission 11 | Hardcode RecapTab | Mission 15 + fingerprint digest + 8p optionnel |
| Fingerprint `[object Object]` | Interpolation objet | Affiche `digest` |
| factRegistry note seule | Non peuplé | Faits depuis cartes |
| dispositions 1 période | Seulement insights live | `dispositionsByPeriod` |

---

## Bouton JSON autonome

Label UI : **Exporter le JSON analytique complet**  
Fichier : `momentum-ANALYTICAL_AUDIT-{edition}-{stamp}.json`  
Inclut les 8 horizons ; même `buildAnalyticalAudit` que le ZIP.
