# DPLUS-01 — Critique de l'architecture D

Socle : les cinq documents du 18 novembre 2026 dans ce dossier. Aucun problème qu'ils ont nommé n'est corrigé. D reste une cible, pas un état du code.

Les conclusions déjà **démontrées** sont conservées : trois sources qui divergent (optimiste, brouillon, `data`), coche sans écriture disque, pourcentage branché sur `data`, XP sur `data` puis moteur complet, chemin séance incrémental distinct du chemin GTG/pompes, `priority: true` qui lâche la file, timeout non strict qui peut revenir sans erreur, relecture = existence et non égalité, pas de coordination d'onglets, `exerciseMarkedWeighted` et `exerciseDisplayNames` hors `SESSION_MAP_FIELDS`, `scheduleAutoPersist` sans appelant.

Les durées utilisateur restent **non mesurées**.

---

## 1. Ce que D résout vraiment

Si elle était implémentée comme écrite dans le document 4 :

- la case et le pourcentage liraient le brouillon, sans attendre IndexedDB ;
- « enregistré » n'arriverait qu'après la relecture d'existence de cette révision ;
- GTG et pompes ne recopieraient plus les maps de séance depuis un snapshot React ;
- une seule file JavaScript dans un onglet remplacerait `persistTailRef` + `runSerializedSave` + le contournement `strict && sessionDay` ;
- l'XP pourrait suivre le brouillon via le moteur complet après peinture, sans changer les formules ;
- le format `workoutSessions` (`id = scopeKey:dateStr`) resterait le canonique.

Ce sont des corrections de branchement et de contrat d'état. Elles sont nécessaires. Elles ne sont pas suffisantes pour la nouvelle priorité : ne plus perdre un brouillon au crash.

## 2. Ce que D ne résout pas

| Limite | Pourquoi D la laisse |
| --- | --- |
| Brouillon seulement en mémoire jusqu'au bouton | D dit explicitement de ne pas remettre un timer de 2 s, et de ne tenter le disque qu'à Enregistrer et à `pagehide`. Entre les deux, un crash ou un kill perd tout. |
| `pagehide` peut mourir avant le commit IndexedDB | D le dit. Elle ne propose pas un support dont l'écriture synchrone a plus de chances de finir dans cet événement. |
| Dernière tranche gagnante entre onglets | D le assume pour plus tard. Deux coches compatibles (tractions / dips) se perdent si chaque onglet réécrit le jour depuis son snapshot. |
| File JavaScript | Elle sérialise un seul contexte. Un autre onglet ne la voit pas. |
| Relecture d'existence | D refuse de la supprimer, et refuse aussi de prétendre qu'elle prouve le contenu. Elle n'ajoute pas une preuve proportionnée. |
| Champs hors tranche | D les renvoie à une phase ultérieure. Tant que ce n'est pas fait, un enregistrement seulement incrémental peut les oublier. **Hypothèse H8, non testée.** |
| Niveau 4 (perte du navigateur) | Hors sujet dans D. Le cloud reste best-effort, sans générations. |
| Validation métier vs persistance | D sépare « montré » et « confirmé disque », pas « brouillon durable » et « séance validée ». Le bouton Enregistrer fait les deux aujourd'hui. Les coller ou les séparer change les quêtes. |

## 3. Risques si on implémente D telle quelle

1. **Fausse sécurité.** L'écran réactif donne l'impression que la coche est sauvée. Le document 4 le dit ; l'UI peut quand même être lue comme une confirmation. Sans brouillon durable, le crash d'après le clic reste une perte.
2. **`pagehide` comme seul filet.** Sur un kill de processus, cet événement n'existe pas. D améliore un cas et pas l'autre.
3. **Tranche complète depuis un snapshot d'onglet.** Même avec une file intra-onglet, deux onglets réécrivent le jour. D ne fait pas de fusion de clés.
4. **Complexité d'états sans gain de durabilité.** `local` / `inflight` / `confirmed` / `failed` sont justifiés pour I2. Ils n'écrivent rien de plus tôt. On paie la migration d'état et on garde le trou du crash.
5. **XP complète sur chaque coche, sur le thread principal.** Exact, possiblement lent sur un historique L. D le sait. Sans mesure, on ne sait pas si c'est acceptable. Un delta non prouvé serait une régression de règles.

## 4. Hypothèses ouvertes, inchangées

H1 à H8 du document 2 ne sont pas tranchées. D+ ne les traite pas comme des causes prouvées. H8 (champs absents de la tranche) reste un prérequis d'intégrité avant d'élargir l'écriture incrémentale.

Vérification nouvelle, **démontrée** par l'absence d'appelants :

- `backupSessionDayToLocalStorage` n'est appelée nulle part ;
- `scheduleBackupWorkoutToLocalStorage`, `flushPendingWorkoutBackup`, `backupWorkoutToLocalStorage` et `loadWorkoutFromLocalStorage` non plus ;
- `loadSessionDayBackupsFromLocalStorage` non plus.

Le commentaire de `workoutPersistence.js` (« le backup localStorage survit au F5 ») décrit un mécanisme **non branché**. Ce n'est pas une protection active de la séance.

Ce qui est branché : `writeEnduranceLocalBackup` sur le chemin complet de `saveToDB`, et `restoreEnduranceIfWiped` au chargement. Une seule génération, `localStorage`, endurance seulement, pas la séance incrémentale (ce chemin retourne avant). **Démontré.**

## 5. Indispensable, utile, excessif

**Indispensable par rapport à D**, parce que D laisse une perte ou une fausse confirmation :

- ne pas confirmer un timeout non strict ;
- ne pas promouvoir un brouillon au rang de séance validée ;
- fusionner des clés compatibles au lieu d'écraser le jour ;
- dire ce que la confirmation prouve (commit de transaction + relecture), pas ce qu'elle ne prouve pas (fsync disque, cloud, égalité byte à byte tant qu'on ne la calcule pas).

**Utile si le coût reste bas :**

- écriture précoce du brouillon de **journée**, coalescée, hors du store canonique ;
- vérification de révision sur la ligne relue ;
- XP moteur complet après peinture.

**Excessif tant qu'une mesure ou un scénario ne le force pas :**

- event sourcing ;
- journal permanent ;
- nouveau moteur de state ;
- serveur ou base supplémentaire ;
- CRDT ;
- hash de tout l'agrégat à chaque frappe ;
- Worker systématique ;
- une version par exercice.

## 6. Écart D → D+

D+ n'ajoute pas une couche pour le principe. Elle ajoute exactement les trous de la section 2 que D a nommés puis reportés : persistance précoce **sans** validation métier, fusion de clés **dans** une transaction IndexedDB, et un contrat de confirmation plus honnête. Le reste de D (états, tranche, garde endurance, moteur XP oracle) est gardé.
