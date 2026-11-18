# Document 4 — Architecture cible recommandée

Cible : hybride D du document 3.
Statut : proposition. Pas une autorisation de migration.

Principe : l’écran, la file d’écriture et les calculs dérivés sont trois contrats. Une coche peut satisfaire le premier sans prétendre avoir satisfait le second. Le troisième doit donner le même nombre que le moteur historique.

---

## 1. Sources de vérité

| Nom | Contenu | Durée de vie |
| --- | --- | --- |
| `confirmed` | Dernier snapshot dont la persistance locale a été confirmée (put + relecture d’existence), par domaine | Jusqu’au prochain confirmé |
| `local` | `confirmed` + modifications de cet onglet non encore confirmées | Mémoire, et tentative d’écriture à la fermeture |
| `inflight` | Révision gelée actuellement dans IndexedDB | Le temps de la transaction |
| `failed` | Dernière révision refusée, copie du local conservée | Jusqu’à retry ou abandon explicite |
| `cloud` | Dernière ligne pour laquelle le push a renvoyé succès | Best-effort, autre contrat |

`data` React ne doit plus jouer les cinq rôles. Le temps de la migration, `data` peut rester un miroir de `confirmed` pour les écrans non migrés. L’onglet Aujourd’hui lit `local` pour l’affichage de séance, GTG, pompes et étirements.

Numéro de révision : entier monotone **par onglet**, incrémenté à chaque modification locale acceptée. Chaque écriture disque porte `{revision, domain, date, payload}`. Au retour, si `local.revision !== inflight.revision`, on ne recopie pas `inflight` sur `local`. On confirme seulement la partie qui correspond, puis on enfile `local`.

Ce numéro n’est pas encore un verrou inter-onglets. Deux onglets ont deux compteurs. La règle de chargement actuelle (tranche au `lastSaved` le plus récent) reste la vérité au redémarrage. **Limite assumée**, document 1 §3.16.

---

## 2. États et transitions

```text
idle
  │ modification utilisateur
  ▼
local_ahead          (état 1 — visible, pas confirmé)
  │ demande de persistance
  ▼
inflight             (état 2 — en cours)
  │ relecture d’existence OK et révision toujours la dernière
  ▼
confirmed            (état 3)
  │ relecture absente, throw, timeout, quota
  ▼
failed               (état 4 — local conservé, pas de toast de succès)
  │ retry utilisateur ou retry après retour du stockage
  ▼
inflight
```

Règles :

- Passer à `confirmed` uniquement dans le callback de succès de la relecture, pas dans le `finally`, pas quand la promesse de préparation des données se résout.
- Un timeout du bouton (25 s aujourd’hui) ne cancel pas le disque. L’UI passe en « toujours en cours », pas en « échoué », tant que la promesse IndexedDB n’est pas settled. Si elle échoue ensuite : `failed`. Si elle réussit : `confirmed` seulement si la révision est encore celle qui a été écrite ou si une écriture plus récente a déjà été confirmée par-dessus.
- Le cloud n’entre pas dans ce schéma. Un indicateur séparé `cloud_pending` / `cloud_ok` / `cloud_failed` vit après `confirmed`.
- La coche optimiste disparaît comme état parallèle. La case lit `local`. Il n’y a plus de `Map` qui peut diverger.

### Quitter la page en `local_ahead`

`pagehide` tente le même put que la file, avec le snapshot `local`, sans toast (il n’y a plus d’écran). Si le navigateur tue la page avant le commit, les modifications restent non confirmées. **Aucune promesse de récupération.** C’est la limite IndexedDB + cycle de vie du document, pas un oubli.

Ne pas introduire un autosave périodique en mémoire pour « régler » ce cas. Un autosave n’aide que s’il a le temps de committer. La cible le déclenche sur les transitions vers `inflight` (geste Enregistrer, et flush de fermeture), pas sur un timer caché de 2 s. Un timer pourra être rediscuté après mesures, avec les mêmes états : il ne devra jamais sauter l’étape `confirmed`.

---

## 3. File d’écriture

Une file par clé de stockage utilisateur (`storageKey`), dans un seul module.

- Les domaines séance, étirements, GTG, pompes y entrent tous. Fini le duo `persistTailRef` / `runSerializedSave` / chemin strict hors file.
- Une entrée : `{revision, domain, date, payload, enqueuedAt}`.
- Exécution une par une. Pas d’option `priority` qui décroche la chaîne.
- Le payload séance est la tranche du jour déjà définie par `extractDaySliceFromAggregate` (même liste de champs, même règle « map vide = jour vidé »).
- Le payload GTG / pompes est le sous-arbre endurance concerné, fusionné avec `mergeEnduranceWithoutSilentWipe` contre le `confirmed` endurance, pas contre un snapshot qui recopierait `checkedExercises`.
- Après put : la relecture d’existence actuelle reste. Elle ne prouve pas l’égalité des champs. La cible ne prétend pas le contraire. Une comparaison de taille ou de nombre de clés peut être ajoutée plus tard ; elle ne remplace pas la relecture.
- `sanitize` s’applique au payload du domaine, pas à toutes les maps historiques, sauf sur les chemins d’import / restauration qui continuent de tout vérifier.

`exerciseMarkedWeighted` et `exerciseDisplayNames` : avant de figer la tranche, décider s’ils entrent dans `SESSION_MAP_FIELDS` ou s’ils restent sur la ligne agrégat avec un test de rechargement. Les laisser dans le trou actuel serait une régression d’intégrité déguisée en perf. Phase dédiée du document 5. Pas de changement silencieux de format : ajouter un champ à la tranche est compatible si le chargement ignore les champs inconnus des vieilles lignes et continue de lire l’agrégat pour ces champs tant qu’ils n’ont pas migré.

---

## 4. Domaines

| Domaine | Écran lit | Écrit | Ne doit pas écrire |
| --- | --- | --- | --- |
| Exercices, reps, poids, séries, étirements du jour | `local` séance | Tranche `workoutSessions` de cette date | Ligne photos, endurance, autres jours |
| GTG | `local` endurance | Sous-arbre `gtg` + garde wipe | Maps `checkedExercises` / reps |
| Pompes | `local` endurance | Séances pushups + défis touchés, garde wipe | Maps de séance, autres types d’endurance non touchés |
| Garmin, nutrition | Leurs stores actuels | Inchangés par cette cible | — |
| Quêtes liées | Moteur quêtes, après le `local` séance | Leur persistance actuelle, hors de la confirmation séance | Ne pas bloquer la case |

Au chargement : inchangé — agrégat, puis `mergeSessionDaysIntoAggregate` qui remplace chaque jour. Les vieilles lignes restent lisibles.

---

## 5. Calculs dérivés

### 5.1 Pourcentage de séance

Fonction actuelle `computeTodaySessionComplexity` (et le ratio de complétion s’il est affiché à côté), appelée sur `local`, dans le même tour que la modification. Pas de disque, pas d’XP.

### 5.2 XP — trois classes

Le moteur `calculateSportXP` reste l’oracle. Aucune constante de récompense ne change.

**Classe 1 — rejeu exact d’une journée, sans plafond global.**
Exemple : XP « une coche de plus » après dédoublonnage (date, exercice), XP d’un item d’étirement dont la note n’a pas changé, XP de reps si la formule de ce terme est une somme. Le delta n’est publié que si le test d’égalité dit que ce terme, recalculé sur la journée, égale la différence entre deux appels du moteur.

**Classe 2 — seuil ou plafond.**
Bonus de programme (0 / 100 / 300 sur le ratio du jour), jours GTG à 50 % et 100 %, volume soulevé sous `SPORT_XP_LIFTED_VOLUME_CAP`, chevauchement fractionné. Il faut rejouer **au moins** la journée et le terme plafonné sur le total, avec les mêmes fonctions. Un `+constante` par coche est interdit.

**Classe 3 — rejeu historique.**
Trophées, grades, courbes qui dépendent de séries longues, Garmin, nutrition, tout terme dont le test d’égalité échoue. Recalcul complet en arrière-plan. L’écran garde le dernier total oracle, puis le remplace quand le complet finit. Pas de nombre intermédiaire « à peu près ».

Publication :

1. Tant que les tests classe 1 et 2 ne sont pas verts : l’écran met à jour le pourcentage tout de suite, et l’XP via le moteur complet **après peinture**, sur `local`, sans bloquer le clic. C’est déjà mieux que d’attendre IndexedDB, et c’est exact.
2. Quand un terme a un test d’égalité vert : on peut l’appliquer au total affiché immédiatement, et le complet reste une vérification. Si le complet diverge : le complet gagne, un compteur dev `xp-divergence` augmente, aucune donnée utilisateur dans le log.

`useSportGrade` ne recalcule les grades qu’à partir du total oracle (complet), pas à partir d’un delta partiel, tant que la dépendance grade ← historique n’a pas été classée en 1 ou 2.

La signature XP devient « révision de `local` + révision Garmin + révision nutrition », pas un checksum de chaque caractère. Le checksum actuel peut rester en test pour détecter un oubli de révision.

### 5.3 Ce que l’XP affichée signifie

Avant `confirmed`, l’XP montrée est celle du `local`. Elle est exacte vis-à-vis du moteur sur ce snapshot, pas une preuve que le disque a suivi. Le libellé de sauvegarde est ailleurs (état 1 à 4). On ne grise pas la barre pour autant : la mission demande qu’elle suive la modification. On ne la fait pas passer pour une donnée déjà survivante à un crash.

---

## 6. Récupération

| Incident | Comportement cible |
| --- | --- |
| Throw ou relecture vide | `failed`, local gardé, bouton Réessayer, pas de toast de succès |
| Timeout bouton alors que le put continue | Rester `inflight`, pas `failed` |
| Timeout put | `failed` quand la promesse rejette |
| Quota | `failed`, message stockage, pas de nouvelle écriture en boucle |
| Fermeture en `local_ahead` | Tentative de put ; si elle ne finit pas, perte assumée |
| Crash pendant la transaction | La transaction IndexedDB non commitée ne doit pas exposer un état partiel. **Supposé** comme sémantique du navigateur. À retenir dans les limites, pas comme un test que cet audit a exécuté. |
| Cloud en échec | `confirmed` local reste vrai ; `cloud_failed` ; pas d’effacement du dirty cloud |
| Deux onglets | Non résolu. Dernière tranche `lastSaved` au prochain chargement. À traiter seulement après un protocole (version comparée), dans une phase ultérieure. |
| Store séances manquant | Repli agrégat actuel conservé, mais il doit emporter le `local` complet du domaine séance, pas un snapshot amputé. Compteur du repli dans les mesures. |

Imports et exports existants continuent de lire l’agrégat fusionné avec les séances. Aucun nouveau format d’export dans cette cible.

---

## 7. Confidentialité des mesures

Les marques du document 2 restent locales au navigateur, en développement. Pas de nouveau endpoint. Pas de copie du slice dans `console.log`. Les erreurs disque loguent un code (`WORKOUT_SESSION_VERIFY_FAILED`, `IDB_OPERATION_TIMEOUT`), pas la ligne workout.

---

## 8. Ce qui ne fait pas partie de la cible

- Supprimer la relecture de contrôle.
- Supprimer `mergeEnduranceWithoutSilentWipe`.
- Remplacer IndexedDB par la mémoire ou par `sessionStorage` (le cache XP en `sessionStorage` reste un cache d’affichage, pas une sauvegarde).
- Un journal de mutations comme format principal (architecture C), tant que les mesures ne le justifient pas.
- Changer les formules XP.
- Une synchro temps réel multi-onglets dans la première livraison.
- Un autosave aveugle toutes les 2 s.
