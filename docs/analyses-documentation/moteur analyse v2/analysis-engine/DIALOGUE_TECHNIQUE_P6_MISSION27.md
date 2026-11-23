# DIALOGUE TECHNIQUE P6 — Mission 27

## 1. Sujet / phénomène / assertion / carte ?

Dans le code actuel (après v26) :

- **Sujet** : `subjectKey` — entité (`ex:504`, `parallel:ex:A+ex:B`).
- **Phénomène** : `phenomenonKey` / `conclusionKey` aspecté — dimension + épisode, sans titre.
- **Assertion** : `assertionClaimKey` — phénomène + fenêtre d’observation + population + période d’assemblage.
- **Carte** : présentation publiable (titre/corps) liée à une occurrence (`occurrenceId`).

Avant M27, le parallèle confondait sujet et phénomène (key = sujets+|2).

## 2. Autorité unique sans réécriture ?

**Oui, partielle et suffisante** : une fonction d’autorité par couche (`subjectKey`, `conclusionKey`/`phenomenonKey`, `assertionClaimKey`, `stablePublicationId`). Pas besoin d’un monolithe. Les producteurs doivent appeler ces autorités plutôt que fabriquer des ids ad hoc.

## 3. Qu’est-ce qui empêchait la composition de consommer les faits ?

`sessionFingerprint` ne lisait que `totalReps`/`reps`, pas `windowMeanPerSession` ni `observedValues`. Les enfants avaient les faits ; le parent ne les interrogeait pas.

## 4. Pourquoi les enfants connaissent des valeurs ignorées du parent ?

Branchements séparés : la composition construisait un résumé éditorial au lieu de projeter les métriques enfants. Corrigé pour les parallèles ; d’autres compositeurs peuvent encore le faire.

## 5. La mémoire dépend-elle anormalement de l’exporteur ?

**Non comme conception, oui comme symptôme v25.** Le live (`useRecapTabMetrics`) écrit déjà ; il écrivait sur `u:u:{id}` pendant que l’audit lisait `u:{id}`. L’export est un filet de campagne, pas l’autorité nominale — à condition que le live soit correctement clé.

## 6. Parcours qui contournent encore les contrats ?

- Compositeurs hors parallèle (volume/fréquence, load phase) avec ids maison.
- Filtrage sémantique faible hors identity_sets.
- Sommeil : producteurs multiples (Porte D).
- nameMapSize=0 / attribution 51 % : environnement, pas P6 core.

## 7. Branchement ou architecture ?

Surtout **branchement et contrats d’identité sous-spécifiés**. L’architecture à quatre couches était déjà latente (claim/phénomène M15) mais non appliquée aux compositions. Ce n’est pas une limitation fatale.

## 8. Simplifications possibles ?

- Centraliser `resolveAnalyticalMemoryProfile` partout (fait).
- Interdire les `conclusionKey` sans aspect pour toute composition.
- Dériver toute réconciliation des sets d’ids (entamé M26–M27).
- Réduire les modules « expected » non instrumentés à unknown (déjà M23 ; still noisy).

## 9. Quelle part de P6 est démontrée ?

- Publication souveraine + claims (M25) : **oui**.
- Pas de faux parallèle même sujet (M26) : **oui**.
- Identités composition aspectées + mémoire clé unique (M27) : **oui en code/UT**.
- ASPECT qualitatif live, DOM, aveugle, sommeil/horizons D : **non**.

## 10. Étapes minimales restantes pour candidature sérieuse ?

1. Rejeu 8h v26 sur profil réel ; vérifier absence collision Hyperextension + storePhenomena≥1.
2. Porte D sommeil/horizons si encore divergente.
3. DOM + paquet aveugle.
4. Fermer nameMap/attribution pour parité rejeu.
5. Alors seulement candidature P7 — pas avant.

### Contredit éventuel

« Il faut une nouvelle architecture parallèle d’identités » — **non**. Les autorités existent ; il fallait les appliquer aux compositions et corriger la clé mémoire. Preuve : collision fixée par aspect dans `conclusionKey`, pas par un nouveau registre.
