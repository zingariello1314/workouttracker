# Moteur d’analyses — **v1**

Dossier de travail pour la **version 1** du moteur d’analyses Recap (Momentum Sport).

La **v0** (P0 → E0 → P3.0…P3.6) est **archivée et figée** dans  
[`../moteur analyse v0/`](../moteur%20analyse%20v0/README.md).

---

## Document lead

| Document | Rôle |
| --- | --- |
| **[Fichier numero 1.md](./Fichier%20numero%201.md)** | **Lead v1.** Brief F1–F7. **Prime** en cas de conflit. |

> **État au 1er nov. 2026 :** **F1–F3** acceptés (réserves). **F4** livré — en attente validation. F5+ bloqués.

---

## Lots

| Lot | Contenu | État |
| --- | --- | --- |
| **F1** | Audit transversal | **Accepté** (réserves documentées) |
| **F2** | Contrats données / temps / preuves | **Accepté** (réserves) |
| **F3** | Raisonnement composé multi-faits | **Accepté** (réserves : profondeur surtout structurée) |
| **F4** | Narration / présentation | **Livré — validation** |
| F5 | Sélection E0 | Bloqué |
| F6 | Performance / fraîcheur | Bloqué |
| F7 | Recette finale | Bloqué |

---

## Livrables F4

| | Document |
| --- | --- |
| Rapport | [RAPPORT-F4-NARRATION-2026-11-01.md](./RAPPORT-F4-NARRATION-2026-11-01.md) |
| Registre | [REGISTRE-MODIFICATIONS-F4-2026-11-01.md](./REGISTRE-MODIFICATIONS-F4-2026-11-01.md) |
| Matrice narrations | [MATRICE-NARRATIONS-F4-2026-11-01.md](./MATRICE-NARRATIONS-F4-2026-11-01.md) |
| Audit avant/après | [AUDIT-CARTES-AVANT-APRES-F4-2026-11-01.md](./AUDIT-CARTES-AVANT-APRES-F4-2026-11-01.md) |
| Validation éditoriale | [VALIDATION-EDITORIALE-F4-2026-11-01.md](./VALIDATION-EDITORIALE-F4-2026-11-01.md) |
| Tests / replays | [TESTS-REPLAYS-F4-2026-11-01.md](./TESTS-REPLAYS-F4-2026-11-01.md) |
| Transfert F5 | [TRANSFERT-F4-VERS-F5-2026-11-01.md](./TRANSFERT-F4-VERS-F5-2026-11-01.md) |
| Replay JSON | [fixtures/f4-replay-brief.json](./fixtures/f4-replay-brief.json) |

**Verdict F4 :** `composedEvidence` désormais **écrit** dans les cartes concernées ; score visible compositionAvailable = compositionUsedInText ; E0 non retuné.

---

## Livrables F3

| | Document |
| --- | --- |
| Rapport | [RAPPORT-F3-COMPOSITION-2026-11-01.md](./RAPPORT-F3-COMPOSITION-2026-11-01.md) |
| Matrice compositions | [MATRICE-COMPOSITIONS-F3-2026-11-01.md](./MATRICE-COMPOSITIONS-F3-2026-11-01.md) |
| Registre mods | [REGISTRE-MODIFICATIONS-F3-2026-11-01.md](./REGISTRE-MODIFICATIONS-F3-2026-11-01.md) |
| Tests / fixtures | [TESTS-FIXTURES-F3-2026-11-01.md](./TESTS-FIXTURES-F3-2026-11-01.md) |
| Replays | [REPLAYS-F3-2026-11-01.md](./REPLAYS-F3-2026-11-01.md) |
| Transfert F4/F5 | [TRANSFERT-F3-VERS-F4-F5-2026-11-01.md](./TRANSFERT-F3-VERS-F4-F5-2026-11-01.md) |
| Replay JSON | [fixtures/f3-replay-brief.json](./fixtures/f3-replay-brief.json) |

**Verdict F3 :** composition structurée (`composedEvidence`) sur trajectoires existantes ; profondeurs A/B démontrées synthétique + fixture ; E0 non retuné ; aucun nouveau kind.

---

## Livrables F2

| | Document |
| --- | --- |
| Rapport | [RAPPORT-F2-CONTRATS-2026-11-01.md](./RAPPORT-F2-CONTRATS-2026-11-01.md) |
| Glossaire | [GLOSSAIRE-CANONIQUE-F2-2026-11-01.md](./GLOSSAIRE-CANONIQUE-F2-2026-11-01.md) |
| Matrice temporelle | [MATRICE-TEMPORELLE-F2-2026-11-01.md](./MATRICE-TEMPORELLE-F2-2026-11-01.md) |
| Registre mods | [REGISTRE-MODIFICATIONS-F2-2026-11-01.md](./REGISTRE-MODIFICATIONS-F2-2026-11-01.md) |
| Transfert F3–F5 (depuis F2) | [TRANSFERT-F3-F4-F5-DEPUIS-F2-2026-11-01.md](./TRANSFERT-F3-F4-F5-DEPUIS-F2-2026-11-01.md) |
| Replay | [fixtures/f2-replay-periods.json](./fixtures/f2-replay-periods.json) |

**Verdict F2 :** `strengthDays` ≠ `trainingDays` (GTG sync partiel) — distinction conservée ; faux reject retiré ; sommeil daté + fixture synthétique ; packs E0 inchangés.

---

## Livrables F1 (référence)

| | Document |
| --- | --- |
| A | [RAPPORT-F1-AUDIT-TRANSVERSAL-2026-11-01.md](./RAPPORT-F1-AUDIT-TRANSVERSAL-2026-11-01.md) |
| B–F | Registre kinds, matrice raisonnement, catalogue défauts, cartes, feuille de route |

---

## Lien v0

Voir README v0 et rapport architecture 2026-11-01-0042. Un seul pipeline E0.

**Validation live :** `localhost:3001` — Sport → Recap → Analysis.
