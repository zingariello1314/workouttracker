# DIALOGUE TECHNIQUE P6 — Mission 19

Complément à la cartographie. Faits / hypothèses / recommandations séparés.

## 1. Qu’est-ce qui empêchait la convergence ?

**Fait** : les producteurs écrivent titre/corps avant claim ; F4 et `draftFromClaim` peuvent reconstruire le sens ; P6 valide plutôt qu’il n’ordonne.  
**Hypothèse** : la migration progressive n’a jamais eu de critère « un parcours ne rédige plus avant thèse ».  
**Reco** : critère d’admission = `narrativeAuthority` + preuves avant prose publique.

## 2. Qui a le dernier mot sur la thèse ?

Avant M19 : **F4 / draftFromClaim** après detect.  
Après M19 (parcours migrés) : **composition / thèse posée** (`narrativeAuthority=composition`), draft et review ne doivent plus l’écraser.

## 3. Peut-il être contourné ?

Oui si un nouveau producteur omet `narrativeAuthority` et laisse `trajectoryOk=true`. D’où la règle générique (pas une liste de kinds).

## 4. Producteurs encore fondés sur d’autres cartes ?

Collectif : **non** pour l’existence (ledger). Enrichissement niveaux depuis cartes = optionnel.  
Variantes / sommeil / pics : encore largement cartes-centrés.

## 5. Contrats décoratifs

`underexploration` peut annoncer 0 occasion alors qu’aucune méthode « familles mensuelles » n’a tourné — la couverture teste ce qui est *branché*, pas l’espace des méthodes possibles.  
Mémoire / hierarchyLink / evaluations souvent absents de l’export.

## 6. Transformations redondantes

Polish + draftFromClaim + F4 sur le même corps. Review qui ré-explore sans injecter.  
Clustering M18 + ledger M19 : le ledger doit rester la source ; le cluster est la stratégie d’exploration.

## 7. Complexité retirée / centralisée cette mission

- Autorité narrative générique (plus seulement `shouldPreserve` kind-par-kind pour le collectif).  
- Collectifs depuis ledger.  
- Anti-circularité variantes (créneau avant volume).  
Pas de purge large des détecteurs.

## 8. Nouvelle relation sans détecteur ad hoc ?

**Oui en principe** avec ledger (co-occurrence, confirmation, familles). La carte mensuelle est encore un kind dédié — acceptable tant qu’elle lit le même socle.

## 9. Quand un approfondissement peut modifier la thèse ?

Passe 4 peut rouvrir si elle reconstruit composition + claim + draft. Aujourd’hui : partiel (review met à jour exploration ; ne doit plus écraser composition).

## 10. Suffisamment exploré ?

Couverture = statut d’une méthode exécutée. Il manque « méthode applicable non exécutée ». Le rapport v17 à 0 occasion non exploitée est donc **trompeur**.

## 11. Mauvaises hypothèses d’audit passées

- « Seuils trop hauts » alors que la dilution multi-dates était la rupture.  
- « F4 » pour le conflit v17 confirmation — en réalité **draftFromClaim** après `exploreDiscovery`.  
- Confondre export slim (champs absents) et absence moteur.

## 12. Structurel vs données

| Structurel | Données |
|---|---|
| Autorités narratives multiples | Backup 19 sans 18 nov. |
| Appariement volume circulaire | Noms `Exercice #id` dans journal |
| Couverture d’exploration incomplète | Fingerprints différents v16/v17 |

## 13. Prochain chantier type « collectif »

**Composition mensuelle / mémoire** : risque de textes génériques et de double comptage si on n’unifie pas sur le ledger de séances.

## 14. Si je reconcevais les responsabilités problématiques

1. Registre d’occurrences (fait).  
2. Proposers → candidats sans prose finale.  
3. Une passe thèse+composition.  
4. draftFromClaim strictement aval.  
5. Sélection sur informativité, pas sur kind.

## 15. Écart restant vs P6 ASPECT

Mémoire chronologique, sommeil contextualisé, généralisation packs A–F, hiérarchie UI, fingerprint multi-sources, DOM, aveugle humain, réconciliation catalogue 721/710/701, faits atomiques riches.

## Mauvaises orientations possibles de mes propositions (ChatGPT)

- Bonus de score par kind : **rejeté** (validé).  
- Empiler `shouldPreserveX` : **utile court terme, mauvais long terme** — remplacé par autorité générique sur parcours migrés.  
- Collectif unique par horizon : **trop strict** — plusieurs épisodes distincts OK s’ils sont informatifs (today ≠ 7d).

🌱 graft saved ~7.99M tokens this turn (repo map dominant; autres asks ~20k)
