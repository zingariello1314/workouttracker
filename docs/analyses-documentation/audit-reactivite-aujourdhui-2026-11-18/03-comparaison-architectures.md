# Document 3 — Comparaison des architectures

Contrainte commune : aucune option n’a le droit de retirer une garantie **démontrée** sans la remplacer par une garantie au moins égale, au même niveau de persistance (mémoire, IndexedDB, cloud).

Les gains de vitesse sont des **attentes structurelles**, pas des mesures.

---

## Architecture A — Optimisation conservatrice

On garde `persistFullDraft`, `strict`, la tranche du jour, la relecture, les timeouts, le garde endurance, le `stale`. On corrige les branchements React et les calculs dérivés.

### Ce qui changerait

- La coche écrit le brouillon dans le clic, sans frame d’annulation, et ne retire l’affichage que si le brouillon a la valeur demandée.
- Le score de séance et les indicateurs de volume dépendent du brouillon sale, pas de `data`.
- L’XP affichée peut se recalculer sur `getCurrentData()` **avec le moteur actuel** (`calculateSportXP`), pas avec une formule raccourcie. On déplace seulement le moment du calcul (après peinture, sur le snapshot brouillon + données confirmées).
- La signature ne parcourt plus chaque caractère si un compteur de révision du brouillon suffit à dire « le snapshot a changé ».
- GTG et pompes passent par une écriture qui ne re-assainit pas tout l’historique, **seulement** si le garde anti-wipe et la ligne agrégat restent cohérents (voir risques).

### Garanties

| Invariant | Effet |
| --- | --- |
| I1–I4, I6 | Inchangés sur le chemin séance strict |
| I2 | Mieux sur la case (plus de coche fantôme). Le toast reste « local confirmé », pas cloud. |
| I5 | Inchangé tant que GTG n’est pas modifié. Si on « optimise » GTG sans revue, risque de régression. |
| I7 | Le brouillon meurt encore à la fermeture. A ne corrige pas ça toute seule. |
| Exactitude XP | Tenue si on appelle le même moteur. Le coût CPU du moteur complet sur l’historique long **reste**. A peut rendre le pourcentage instantané et laisser l’XP lente. |

### Performance attendue

- Case et pourcentage : oui, sans attendre IndexedDB.
- XP : mieux seulement si le moteur complet n’est plus sur le rendu de `setData`. Sur un historique L, le calcul peut rester de l’ordre des secondes. **Non mesuré**.
- Enregistrer : peu de gain si put + relecture dominent.

### Complexité

La plus basse. Peu de nouveaux concepts. Réversible par retour des dépendances React.

### Risque principal

Croire que A suffit pour l’XP et pour GTG. Ce n’est pas démontré.

---

## Architecture B — État affiché, état en vol, état confirmé

Trois snapshots explicites, plus un état d’échec.

- **Local** : ce que l’écran montre (case, %, XP de projection).
- **En vol** : snapshot envoyé au disque, identifié par un numéro de révision.
- **Confirmé** : dernière révision dont la relecture a réussi.
- **Échec** : la révision en vol a échoué ; le local est conservé ; l’UI ne dit pas « enregistré ».

L’écran lit **local**. Le toast « enregistré » lit **confirmé**. Le cloud est un quatrième niveau, jamais confondu avec IndexedDB.

La file d’écriture est unique pour tous les domaines, avec un numéro monotone. Une écriture emporte la révision qu’elle a lue. Si le local a avancé, on n’écrase pas le local au retour ; on enchaîne une écriture de la révision nouvelle. C’est le `stale` actuel, généralisé et visible.

Fermeture de page : le flush écrit le **local** s’il est plus récent que le confirmé, pas seulement `dataRef`. Limite assumée : `pagehide` peut être tué avant la fin du put. Dans ce cas l’état reste « non confirmé », et on ne peut pas le garantir. Il faut le dire, pas le simuler avec un toast.

### Garanties

| Invariant | Effet |
| --- | --- |
| I1 | Meilleur : on ne confirme que la révision relue |
| I2 | Meilleur : les quatre états sont distincts |
| I3 | Meilleur dans un onglet, si une seule file porte toutes les révisions |
| I4 | Inchangé si la charge utile reste une tranche de jour |
| I5 | Meilleur si chaque écriture nomme son domaine et ne remplace pas les autres |
| I6 | Meilleur pour ce qui a été confirmé ; le local non flushé reste perdu si `pagehide` est coupé |
| I7 deux onglets | **Toujours non assuré** sans numéro de version comparé au rechargement |
| XP | Selon qu’on branche B sur le moteur complet (sûr, peut rester lent) ou sur un delta (voir C / document 4) |

### Performance attendue

L’écran n’attend plus le disque. Le disque travaille la révision gelée. C’est le découplage demandé. Le gain XP dépend du calcul, pas de B seule.

### Complexité

Moyenne. Il faut cesser d’utiliser `data` comme « à la fois écran et snapshot disque ». Beaucoup d’appels `updateData` supposent aujourd’hui l’inverse. Migration par domaine, pas un big bang.

### Risque principal

Deux sources mal tenues : l’écran montre local, un composant oublié lit encore `data` et « revient en arrière » après `setData`. Les tests de non-régression du document 5 sont là pour ça.

---

## Architecture C — Persistance incrémentale transactionnelle

Journal de mutations (coche, reps, mini-série GTG, séance pompes) avec version, appliqué dans une transaction IndexedDB, compaction périodique vers la tranche de jour déjà existante.

### Ce que ça apporterait

- Petite écriture au lieu de l’agrégat pour GTG.
- Rejeu après crash si le journal est dans la même transaction que l’état compacté.
- Base naturelle pour un delta XP **seulement** là où les règles sont additives ou rejouables sur une journée.

### Ce que ça ne doit pas être

Un journal en mémoire. Ça ne change rien à I7.
Un journal à côté de l’état, compacté « plus tard » sans transaction : fenêtre de perte ou de double application.
Un remplacement du store `workoutSessions` déjà capable de remplacer un jour. Le journal n’est utile que si la mutation est plus petite que la tranche **et** que la compaction est atomique.

### Garanties

Théoriquement les meilleures sur I3 et I7 **dans un onglet**, si une transaction couvre journal + état. IndexedDB le permet. Le cloud resterait best-effort.

Coût : nouveau format. I10 exige une lecture des anciennes lignes sans migration destructive, et un retour arrière vers « une tranche de jour » si le journal est abandonné. C’est le plus gros risque du dossier.

### Performance attendue

Meilleure sur GTG/pompes et sur les coches si on persiste souvent. Inutile pour l’affichage si B n’est pas là : un journal rapide ne peint pas le pourcentage.

### Complexité

La plus haute. À n’adopter que si les mesures montrent que la tranche de jour elle-même est trop grosse, ou que les conflits intra-jour ne peuvent pas s’exprimer avec une révision de tranche. Aujourd’hui la tranche est déjà l’unité de remplacement. **Supposé** : elle suffit. **Non mesuré** : sa taille en octets sur un jour réel synthétique L.

### Risque principal

Deuxième source de vérité permanente, bugs de compaction, et une migration que personne ne peut rejouer dans dix ans sans le code du journal.

---

## Architecture D — Hybride retenu comme base de comparaison

D = B pour les états, A pour le moteur XP tant que le calcul n’est pas classé, et la tranche de jour actuelle comme persistance (pas le journal de C), avec une file unique et des écritures par domaine.

Précisions :

1. **Écran** sur l’état local (B).
2. **Confirmation** seulement après put + relecture d’existence, inchangée, mais cette attente ne bloque plus la case ni le pourcentage (B). La relecture n’est pas supprimée.
3. **Charge utile séance** = tranche de jour actuelle, pas un journal (on ne prend pas C maintenant).
4. **GTG / pompes** : écriture du sous-arbre endurance / GTG, plus le garde anti-wipe, sans recopier les maps de séance du snapshot. La ligne `workouts` continue de porter l’endurance. On ne passe pas par le grand parcours de toutes les reps pour une mini-série.
5. **XP** : affichage immédiat par rejeu **de la journée et des seuils touchés** avec les mêmes fonctions que le moteur, plus un recalcul complet de contrôle dès que le thread est libre. Tant que ce rejeu n’est pas prouvé égal au moteur (tests), l’écran utilise le moteur complet sur un snapshot, hors du chemin de la case, et le pourcentage, lui, est déjà à jour via le brouillon.
6. **Fermeture** : tenter d’écrire le local non confirmé. Ne pas afficher de succès si `pagehide` n’a pas laissé finir. Documenter la limite.
7. **Deux onglets** : hors de la première livraison. Au rechargement, `lastSaved` de la tranche reste la règle actuelle, assumée comme dernière écriture gagne pour ce jour.
8. **Cloud** : reste après la confirmation locale, échec visible comme « non répliqué », pas comme « non enregistré ».

### Garanties comparées

| | A | B | C | D |
| --- | --- | --- | --- | --- |
| Case / % sans disque | Oui | Oui | Non par lui-même | Oui |
| XP exacte sans attendre l’historique entier | Non | Seulement si on ajoute le classement du doc. 4 | Possible plus tard | Oui pour l’affichage seulement après tests d’égalité ; sinon moteur complet hors clic |
| I2 confirmation | Inchangée | Forte | Forte si transaction | Forte |
| I5 GTG vs séance | Faible si on touche GTG sans cadre | Forte si domaines nommés | Forte | Forte, sans nouveau format |
| I7 fermeture brouillon | Non | Mieux, limite navigateur assumée | Mieux si journal déjà sur disque | Mieux, limite assumée |
| I10 compatibilité | Maximale | Maximale si même format disque | Mauvaise au début | Maximale : même `workoutSessions` |
| Complexité | Faible | Moyenne | Haute | Moyenne |
| Réversibilité | Facile | Moyenne | Difficile | Moyenne, par phase |

### Performance attendue de D

- Case et pourcentage : découplés du disque (gain structurel).
- Enregistrer : la confirmation reste un aller-retour IndexedDB. On gagne les frames et le rendu géant *avant* le toast seulement si le toast n’attend plus que la relecture, et si le rendu XP n’est plus dans ce même tour. Le put lui-même ne disparaît pas.
- GTG : gain structurel si on cesse le nettoyage de tout l’historique. **À mesurer** avant/après sur le jeu M.
- XP : soit le moteur complet sort du clic (gain perçu, CPU inchangé mais plus tard), soit le rejeu de journée est plus court. Les deux sont compatibles avec D. Le second est interdit tant que les tests d’égalité ne passent pas.

### Risques de D

- Oublier un lecteur de `data`.
- Écriture endurance « partielle » qui contourne `mergeEnduranceWithoutSilentWipe`.
- Afficher un XP de journée faux pendant que le contrôle complet n’a pas tourné. Parade : ne pas publier le raccourci tant que le test d’égalité n’est pas vert, et garder le moteur complet comme file de vérification.
- `pagehide` présenté à tort comme une garantie décennale. Ce n’en est pas une.

---

## Recommandation

**D**, pas C, pas A seule.

A corrige l’écran et laisse les garanties disque. Elle ne traite pas l’état « enregistré » vs « montré », ni GTG, ni la fermeture. Elle est la phase 1 de D, pas la cible.

B est le bon modèle mental. Seule, elle ne dit pas quoi écrire.

C est une option ultérieure si les mesures montrent que remplacer la tranche entière coûte trop, ou si deux éditeurs du même jour dans un même onglet ne peuvent plus se sérialiser. Pas comme premier format.

D conserve le format `workoutSessions`, la relecture, le `stale`, le garde endurance, et sépare enfin l’affichage, la confirmation et le calcul dérivé.

Condition : la phase 0 (mesures) peut encore montrer qu’un point de D est inutile. Elle ne rouvre pas le droit de supprimer la relecture ou le remplacement de jour pour aller plus vite.
