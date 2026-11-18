# DPLUS-05 — Benchmarks, tests d'intégrité et restauration

Aucun de ces scénarios n'a été exécuté pour cette mission. Tout chiffre futur devra dire s'il vient d'un mock, d'un IndexedDB de test, ou d'un navigateur. Un mock qui résout une promesse ne prouve pas une coupure d'alimentation.

Le protocole de marques du document 2 (phase 0) reste obligatoire et préalable. Ce document ajoute la fiabilité. Pas de télémétrie distante. Logs locaux : durées, comptes, codes. Pas de reps, pas de noms, pas d'identifiants utilisateur.

---

## 1. Niveaux de protection, état actuel

| Niveau | Définition | Atteint aujourd'hui ? |
| --- | --- | --- |
| 1 | Visible en mémoire | Oui, brouillon + coche optimiste. **Démontré.** |
| 2 | Persisté dans le stockage du navigateur | Oui **après** le bouton séance (IndexedDB `workoutSessions`) ou après un `updateData` complet. Non pour une coche non enregistrée. **Démontré.** |
| 3 | Copie indépendante du store actif | Endurance : `localStorage` une génération, écrite sur le chemin complet, relue si wipe (`restoreEnduranceIfWiped`). Séance : fonctions de backup **présentes et non appelées**. Ce n'est pas une copie active. **Démontré.** |
| 4 | Récupérable après perte du profil navigateur | Seulement si le push cloud est activé, authentifié, et a réussi sur un snapshot complet. Best-effort, pas de générations locales. **Non assuré** comme protection systématique. |

Une sauvegarde qui écrase toujours la même clé (`workoutData_backup`, backup endurance) ne permet pas de revenir à hier si la dernière écriture est mauvaise. L'endurance a ce problème. **Démontré** par une seule clé.

---

## 2. Jeux synthétiques

Identiques au document 2 : S (30 jours), M (400), L (2000). Générés localement. Aucun export personnel.

Ajouter un jeu **conflit** : deux snapshots du même jour, patches disjoints, puis patches sur la même clé.

Ajouter un jeu **schéma ancien** : ligne `workoutSessions` sans champ `revision`, comme aujourd'hui. Le lecteur doit la traiter comme révision 0, pas la rejeter.

---

## 3. Scénarios

Pour chacun : simulé (fake timers, IDB de test) ou réel (navigateur). La colonne « maintenant » est le statut de cette mission.

| Id | Scénario | Type attendu | Maintenant |
| --- | --- | --- | --- |
| S1 | Une coche | Réel plus tard | Non fait |
| S2 | Clics rapides, deux exercices, puis la même case | Réel | Non fait |
| S3 | Frappe pendant sauvegarde | IDB de test + UI | Non fait |
| S4 | GTG une mini-série, compter les clés `reps` parcourues | Test | Non fait |
| S5 | Pompes, idem, garde wipe : liste vide n'efface pas | Test existant à étendre | Garde déjà testée, chemin UI non fait |
| S6 | Étirement puis bouton, quête seulement au bouton | Test | Non fait |
| S7 | XP fixture = moteur | Test | Non fait |
| S8 | Bouton, relecture OK | IDB de test | Non fait |
| S9 | Brouillon `localStorage` sans bouton, rechargement logique | Test | Non fait |
| S10 | Deux contextes IDB, tractions puis dips | IDB de test, deux connexions | Non fait. Pas une preuve multi-processus. |
| S11 | Même clé, 10 vs 12 reps | IDB de test | Non fait |
| S12 | Transaction qui rejette | Mock ou IDB fermée | Non fait. Pas une coupure électrique. |
| S13 | `QuotaExceededError` sur `setItem` | Mock | Non fait |
| S14 | `pagehide` après coche | Simulé : appeler le flush | Non fait. Ne prouve pas que le navigateur laisse finir l'appel. |
| S15 | Rechargement après validation | IDB de test + `mergeSessionDaysIntoAggregate` | Non fait |
| S16 | Restauration depuis une copie génération N-1 | Fixture | Non fait. Pas de système de générations aujourd'hui. |

Interdit dans le compte-rendu : « résiste à une coupure secteur » si seul S12 ou S14 a été joué.

---

## 4. Indicateurs

### Performance (par jeu S/M/L, 30 essais sinon min/max seulement)

- Clic → case peinte
- Clic → pourcentage peint
- Clic → XP de cette révision publiée
- Mutation → `setItem` brouillon revenu
- Bouton → révision canonique relue
- Attente dans la file
- Durée transaction
- Durée relecture des clés du patch
- Long tasks > 50 ms
- Nombre d'écritures IDB et `localStorage`
- Octets écrits (taille du patch, pas de l'historique)
- Heap avant/après 200 coches (jeu M), pour voir une fuite de copies

### Fiabilité (comptes, pas des moyennes)

- Mutations perdues (clé absente alors que l'état était `validated` ou `draft_stored`)
- Mutations dupliquées (deux séances pompes pour un clic)
- Conflits détectés
- Conflits silencieux (valeur finale ≠ les deux saisies et ≠ la politique)
- Fausses confirmations (toast ou `validated` sans relecture)
- Restauration : comptes, ids, dates, valeurs des fixtures, liens jour ↔ exercice, recalcul XP identique au moteur sur la fixture restaurée

Une optimisation est refusée si un compte de perte, de doublon ou de fausse confirmation passe au-dessus de zéro sur S1–S11 et S15, ou si un total XP de fixture diverge.

---

## 5. Égalité XP

Pour chaque fixture du jeu conflit et du jeu L réduit (une modification) :

`calculateSportXP(avant)` et `calculateSportXP(après)` sont la référence.
Tout raccourci doit égaler la différence, poste par poste du breakdown concerné.
Si le poste est un plafond ou un bonus de seuil, le test inclut un cas juste sous le seuil et un cas juste au-dessus.
Divergence : le raccourci n'est pas branché. Le complet gagne.

Résultat de révision n arrivé après n+1 : le test injecte un résultat tardif et vérifie qu'il ne remplace pas l'affichage n+1.

---

## 6. Restauration

Il n'existe pas, aujourd'hui, de jeu de sauvegardes versionnées branché sur la séance. Le protocole ci-dessous est celui que D+ devra satisfaire **quand** une copie générationnelle existera. Le décrire n'est pas dire qu'elle existe.

Environnement isolé, fixtures seulement :

1. Écrire canonique + une copie génération N et N-1 (fichiers JSON locaux au test, pas un service).
2. Corrompre N (journée manquante).
3. Restaurer N-1 dans une base vide.
4. Comparer nombre de lignes, ids `scope:date`, dates, valeurs des clés fixtures, `enduranceData` non vide si la fixture l'était.
5. Recalculer l'XP et la comparer au snapshot de la fixture.
6. Rejouer avec une ligne sans `revision` (schéma actuel). Le chargement doit accepter.

La copie N ne doit pas être la seule. Écraser toujours le même fichier échoue à l'étape 2 : il n'y a plus de N-1. Le test doit avoir deux fichiers.

Export utilisateur actuel : pas d'entrée `exportWorkout` dans l'index. **Non trouvé** comme fonction nommée ainsi. Ne pas documenter un export séance comme existant tant qu'un chemin UI n'a pas été relu. Les contrats `workoutAggregateSnapshot.v1` existent ; leur branchement UI n'est pas réauditée ici. Statut : **non vérifié** comme geste utilisateur.

---

## 7. Limites techniques à écrire dans le rapport de test

- Commit IndexedDB ≠ témoin d'un fsync vu par l'application.
- `pagehide` simulé ≠ onglet tué par l'OS.
- Deux connexions IDB dans un même processus ≠ deux processus.
- `localStorage` partagé peut se faire écraser entre onglets sans transaction.
- Quota, mode privé, effacement des données du site : niveau 2 et 3 meurent ensemble s'ils sont dans le même profil.
- Le cloud, s'il n'a pas reçu le snapshot, n'est pas un niveau 4.
