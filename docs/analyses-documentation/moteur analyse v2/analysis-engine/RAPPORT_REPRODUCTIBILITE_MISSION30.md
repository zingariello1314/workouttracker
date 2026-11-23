# RAPPORT REPRODUCTIBILITÉ — Mission 30

## Inventaire disponible

| Source | Contenu | Suffisant pour rejeu live ? |
|---|---|---|
| `mission30-baseline/` AUDIT+TRACE+AUDIT_IA v28 | Résultats observés, graphe, claims | Résultats oui ; entrées non |
| `snapshots/momentum-sport-backup-2026-11-21.json` | reps, checkedExercises, weights, setLogs, programme, Garmin | Entrées sportives **approximatives** |
| Console / dossier environnement | Compteurs, parfois historique éditorial | Parité M18 : dossiers sans reps |

## Écarts backup ↔ live

- Fingerprint v28 : `nameMapSize=0` — résolveur d’affichage incomplet à l’export.
- Backup daté 21/11 : **ne pas** assumer identité bit-à-bit avec le run v28 utilisateur.
- Mémoire pack : 1 phénomène / 40 pubs / 66 expositions dans l’audit — à figer séparément si rejeu mémoire.

## Paquet unique proposé

`artifacts/analysis-eval/mission30-replay/PACK_MANIFEST.json`

Fige :

1. Date d’ancrage + fuseau  
2. Chemin backup sportif  
3. Résultats observés v28 (séparés des inputs)  
4. Corpus oracle Jeu A  
5. Commandes (`vitest`, `vite-node`)  
6. Édition / fingerprint  

**Pas** de second moteur, pas de nouvelle console, pas de credentials.

## Porte C

Inventaire + manifeste livrés. Rejeu 8 horizons édition `v29` sur backup = **prochaine exécution obligatoire** (P1), non revendiqué comme fait dans ce rapport faute de campagne produit complète post-fix.
