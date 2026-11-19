# E1 — GTG, effacement

18 novembre 2026. `mergeEnduranceWithoutSilentWipe` n’a pas été modifié. La politique testée est `scripts/dplus/gtgPreservePolicy.mjs`. Elle appelle le garde-fou actuel, puis rétablit le GTG si l’effacement n’est pas explicite.

---

## Cause

Deux trous, pas un.

1. `ENDURANCE_ACTIVITY_TYPES` ne contient pas `gtg`. Après la boucle protégée, toute clé de `sessions` inconnue est copiée telle quelle (`enduranceWipeGuard.js`, lignes 64-68). `sessions.gtg = []` remplace donc la liste précédente. Une liste `pushups` vide, elle, est conservée.

2. Le champ réel des passages est `enduranceData.gtg`, pas `sessions.gtg`. `addGtgAdHocPassage` écrit dans `gtg.days[date].adHoc`. Le garde-fou fait `gtg: next.gtg !== undefined ? next.gtg : prev.gtg` (ligne 88). Un objet `{ days: {} }` n’est pas `undefined`. Il efface les jours.

`persistEnduranceData` appelle le garde-fou puis `updateData` **sans** `strict`. `sessionTypesTouched` protège les types listés (pompes, course, …). Il ne protège pas le champ `gtg`, parce que la ligne 88 ne le consulte pas.

Un tableau vide n’est pas une intention. L’inconnu non plus.

---

## Chemins qui peuvent effacer

| Chemin | Condition de perte |
| --- | --- |
| `saveToDB` | l’objet entrant a `enduranceData.gtg` défini et vide, ou `sessions.gtg` vide. La fusion ne reçoit pas `sessionTypesTouched`. |
| `persistEnduranceData` | le patch contient `gtg` vide. Le drapeau de type touché ne change pas la ligne 88. |
| Tout `updateData` non strict qui envoie l’endurance entière depuis une mémoire où `gtg.days` a été vidé | même fusion |

Une modification de pompes qui ne touche pas `gtg` le conserve : `next.gtg` est alors `undefined`. Le test de production « pushups vide » le confirme. Le danger est un payload qui **porte** un GTG vide, pas chaque sauvegarde de pompes.

---

## Politique minimale

Vide ou absent, sans drapeau : garder le précédent.

Effacement total : `sessionTypesTouched` contient `'gtg'`, ou `allowWipe`. Le test C4 ne vide les jours que dans ce cas.

Suppression d’un passage : envoyer l’objet `gtg` **non vide**, sans le passage retiré (`removeGtgPassage`). Les autres restent. Pas besoin du drapeau d’effacement total.

Import vide : sans drapeau, l’historique reste. Un import qui veut vraiment remplacer devra passer le drapeau, consciemment.

Les ajouts concurrents et le réessai sans doublon sont des fonctions pures sur des listes d’`id` (`mergePassageLists`). Sans id, le statut est `refused` et la liste distante n’est pas remplacée. Ce n’est pas branché sur `newAdHocId`. C9 à C11 ne sont pas un succès du service GTG de production.

---

## Tests

Commande : `node node_modules/vitest/vitest.mjs run scripts/dplus/e1-gtg-policy.test.js src/services/endurance/__tests__/enduranceWipeGuard.test.js`

| Test | Niveau | Résultat |
| --- | --- | --- |
| `sessions.gtg = []` sur le garde-fou actuel | 1, code de production | la liste devient vide |
| `gtg: { days: {} }` sur le garde-fou actuel | 1, code de production | les jours deviennent `{}` |
| `pushups: []` sur le garde-fou actuel | 1 | la séance `pu_1` reste |
| C1 C2 absence et vides | 1, politique expérimentale | GTG conservé |
| C3 un passage retiré | 1 | `ah_2` reste, `ah_1` part |
| C4 tout effacer | 1 | bloqué sans drapeau ; vide avec `sessionTypesTouched: ['gtg']` |
| C5 C6 C7 | 1 | pompes et GTG ne s’effacent pas entre eux |
| C8 import vide | 1 | séances, GTG et défi `c1` restent |
| C9 C10 ids distincts et réessai | 1 | deux passages, pas de doublon |
| C11 sans id | 1 | refus, liste distante inchangée |
| 7 tests historiques du garde-fou | 1, fichier existant | verts |

C9 à C11 ne traversent pas `gtgService.js`. Les identifiants aléatoires de production ne sont pas migrés.

A6, dans `e1-save-to-db.test.js`, traverse le vrai `saveToDB` pour les pompes seulement. Il ne couvre pas le champ `gtg`.

---

## Régressions possibles le jour du branchement

Un écran qui vide `gtg.days` pour « tout supprimer » sans ajouter `sessionTypesTouched: ['gtg']` ne supprimerait plus rien. C’est le but. Il faudra ce drapeau sur le bouton de suppression totale, pas sur les sauvegardes ordinaires.

Les sauvegardes qui envoient le GTG complet, jours inclus, continuent de remplacer le contenu : l’objet n’est pas vide.

## GO / NO-GO

**NO-GO pour modifier le garde-fou maintenant.** Le défaut est reproduit sur la fonction de production. Le correctif expérimental distingue l’accident de l’ordre explicite et laisse les tests historiques verts, parce qu’il ne les remplace pas. L’autorisation devra viser un patch qui :

- ne copie plus `sessions.gtg` vide sans drapeau ;
- ne remplace plus `gtg` par un objet sans jours sans drapeau ;
- laisse `sessionTypesTouched: ['gtg']` effectuer l’effacement total.

Pas de migration d’identifiants dans ce patch.
