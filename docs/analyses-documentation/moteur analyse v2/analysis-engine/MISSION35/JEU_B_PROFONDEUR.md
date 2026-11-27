# Porte E — Profondeur Jeu B (cas réels v33)

Scores live bruts (7d) : profondeur 4 · pouvoir explicatif 1 · réfutation 5.  
Ce ne sont **pas** des pourcentages ; la mission n’améliore pas artificiellement ces compteurs.

## Cas obligatoire — semaine 21–27 nov. 2026

Une séance (24/11) · 296 reps.

| Carte | Phénomène | Preuves | Mécanismes testés | Apport réel | Limite |
|---|---|---|---|---|---|
| `disc_th_concentration_now` « Le 24 nov. porte une grande part » | Concentration journalière 100 % | 296/296 | Aucun (tautologie 1 jour) | **Nul** face à volume_shape | Présentait une « découverte » mécanique |
| `disc_volume_shape` « Une seule séance porte tout le volume » | Sparcité vs habitude 3,7 s/sem | 1 séance, 296 reps | Fréquence vs contenu | **Utile** | Densité temporelle inconnue (pas de durée) |
| `disc_composed_relative_concentration` | Parts des mouvements dans leur mois | 33 % sur 30 j pour 2 moves | Concentration relative ≠ part globale | **Complémentaire** si 1 séance | Ne doit pas concurrencer la sparcité |

### Correction démontrée (1ʳᵉ cause)

**Détecteur** `recapAnalysisDepth` : si `peak.share ≥ 99,5 %`, abstention — la concentration 100 % est la même observation que « une seule séance ».  
Pas une retouche de titre seule.

### Avant → après (même données)

- **Avant :** priorité « 100 % le 24 » + « une seule séance » (redondance).
- **Après :** seule la forme de volume (sparcité / vs habitude) reste candidate ; la carte 100 % n’est plus produite.

## Cas — reprise collective « cette semaine »

| Champ | Valeur export |
|---|---|
| Titre | « La reprise collective se confirme cette semaine » |
| Corps | Confirmation citée au **2026-10-20** |
| `confirmationDates` | 10-20, 10-27, 11-10, 11-17, **11-24** |
| Fenêtre 7d | 2026-11-21 → 11-27 |
| Mémoire | `transition: new`, `newPriorityCard: true` |

### Analyse

1. Phénomène : réinstallation d’une famille (retour 13/10, confirmations multiples).  
2. Preuve in-window : séance du **24/11** (5ᵉ confirmation).  
3. Mécanisme réellement testé : co-occurrence / ledger.  
4. Défaut : prose et titre présentent une **première confirmation** alors que l’épisode est ancien.  
5. Cause : `composeCollectiveReturnReading` citait `confDates[0]` ; priorité mémoire « new » sans prior hors fenêtre.

### Correction

- Prose ancrée sur confirmation **dans la fenêtre** + rappel des confirmations antérieures.  
- Titre « se poursuit » si confirmations pré-fenêtre.  
- `newPriorityCard: false` pour confirmation déjà documentée hors fenêtre.

### Avant → après

- **Avant :** « se confirme le 2026-10-20 » comme news de la semaine du 21–27.  
- **Après :** « avait déjà été confirmée (10-20, 11-17) ; elle se poursuit le 2026-11-24 ».

## Autres familles (échantillon)

| Famille | Observation | Défaut typique |
|---|---|---|
| Volume freq vs contenu | Souvent bien composé | OK descriptif |
| Progression séries/reps/charges | Preuves locales | Rarement rivalité de mécanismes |
| Homonymes trajectoires | 103/503, 106/505 | Identité métrique (Porte A) |
| Sommeil | Association | Prudence déjà forte (score réfutation) |
| Périodes pauvres | 7d 1 séance | Sur-priorisation de constats tautologiques |

## Pourquoi le moteur « reconnaît sans expliquer »

Les détecteurs publient un **constat + implication rédactionnelle** ; peu de cartes portent un mécanisme concurrent **testé puis rejeté**. Le score `pouvoirExplicatif` lexical (`parce que|mécanisme|…`) reste bas tant que la composition n’explicite pas le test. Mission 35 corrige d’abord les faux « nouveaux phénomènes » et les tautologies — prérequis à une profondeur réelle.
