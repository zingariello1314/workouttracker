# F6 — Matrice de fraîcheur

Légende résultats : **OK** = prouvé sous test automatisé ; **STRUCT** = garanti par clé/invalidation documentée ; **NV** = non vérifié (profil live / UI navigateur).

| Mutation | Dépendances | Invalidation attendue | Résultat |
|---|---|---|---|
| A. Cocher / décocher série | checked + fingerprint | nouvelle clé cache + nouvelle revision scope | OK (unit mutation reps) / STRUCT |
| A. Modifier reps / charge | reps / weights dans revision | idem | OK |
| A. Ajouter / supprimer série ou exercice | fingerprint | idem | STRUCT |
| A. Séance ancienne | fingerprint historique | idem | STRUCT |
| B. Programme futur | activeProgram id dans clé | recalcul | STRUCT |
| B. Snapshots historiques | non réécrits par F6 | — | STRUCT (pas de migration) |
| C. GTG add/mod/del | gtg days dans revision | recalcul | STRUCT |
| C. Sync GTG → classique | P3.5 inchangé | recalcul | STRUCT (contrats non modifiés) |
| D. Endurance / Garmin | bit Garmin clé `full` | recalcul full | STRUCT |
| E. Sommeil / poids | sleep / progress dans snapshot | revision / fingerprint | STRUCT |
| F. Déconnexion / autre compte | accountScope + clear | **aucune** carte A sur B | STRUCT (code) / **NV** navigateur |
| F. Import historique | fingerprint | recalcul | STRUCT |
| G. Minuit / horizon | fenêtre dans clé | recalcul | STRUCT |
| G. Retour période déjà vue | cache hit si données inchangées | réutilisation | STRUCT |
| Async course période | genRef | rejet stale | STRUCT (existant) |

## Tests automatisés F6

Fichier : `src/utils/sport/__tests__/recapF6PerfFreshness.test.js`

1. Réutilisation trajectoire même scope  
2. Révisions snapshot distinctes après mutation reps  
3. Fingerprint sélection identique avec/sans scope  
4. Mutation reps → sortie différente (prise en compte)

Script fixture : `scripts/f6-nonregression.mjs` → `allEqual: true` sur 7d / 30d / 3m.
