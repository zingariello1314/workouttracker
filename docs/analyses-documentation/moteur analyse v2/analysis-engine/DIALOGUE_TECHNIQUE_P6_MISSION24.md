# Dialogue technique — Mission 24

Avis indépendant.

## 1. Défauts M23 qui subsistaient réellement

- Démotion mémoire 7j **oui** ; persistance profil / freeze multi-horizons **non**.
- Filtrage sujets hiérarchie **oui** ; **transport export** hierarchyLink **non** (`serializeConclusion`).
- Fingerprint v5 **existait** ; callsites d’export **ne l’alimentaient pas**.
- Instrumentation P6 partielle ; modules absents ≠ non-exécution (déjà clarifié M23, encore mal lu).

## 2. Pourquoi hierarchyLink absent malgré M23 ?

La validation (`justifyParentChildLink` + `markDeepenings`) produisait le lien.  
`publishableP6Card` le conservait.  
**Premier point de divergence** : `serializeConclusion` (dossiers 8 périodes / TRACE) n’exportait ni `hierarchyLink` ni `parentId`/`childIds`.  
`slimCard` reconstruisait `parentId` depuis `collapsedInto` → anomalies `unverified_hierarchy_parentId`.  
Ce n’était pas un second mécanisme de validation manquant : c’était une **perte de preuve à la sérialisation**.

## 3. Priorités quasi identiques

`substantiveEquivalence` refuse volontairement de fusionner `same_title_distinct_subjects` (ids de stockage distincts). Correct pour l’identité ; insuffisant pour la **sélection**.  
Deux trajectoires Hyperextension restaient chacune marginalement « nouvelles ».  
Correction : composition structurelle parallèle + deepenings individuels, sans fusionner les ids.

## 4. Part généralisable

Généralisable dès maintenant : faits, populations, sélection (mémoire, parallèle), hiérarchie justifiée, enveloppe de run.  
Encore faible : couverture relationnelle exhaustive (session×cycle, prescrit×réalisé) — souvent absente faute de **déclencheur/instrumentation**, pas faute de fixture nommée « A–F ».

## 5. Tests : qualité vs exactitude

Les suites M7/M8/M16 évaluent surtout **exactitude / non-régression structurelle** (adhérence, variantes, non-circularité).  
Peu évaluent la **qualité de découverte** (meilleure lecture collective, abstention éditoriale, différenciation d’horizon). Les jeux A/B/C existent mais restent peu branchés sur exports live 8 horizons.

## 6. Exigences P6 encore ouvertes

DOM · QUAL aveugle · sommeil pleinement contextualisé · différenciation horizons longs · exploration honnête de toutes les relations · parité attribution live 100 % (enveloppe corrigée, rejeu utilisateur requis) · C/D collectifs.

## 7. Mission suivante = évaluation seule ?

**Oui, souhaitable** — à condition que l’utilisateur recalcule v23, exporte AUDIT+TRACE+enveloppe, lance DOM, et remplisse le paquet aveugle. Sans ces preuves produit, une « mission évaluation » ne clôture pas P6.

## Généralisation A–F — inventaire

Pas de dossier `packs/A-F`. Capacité couverte dans :

- M7 structural (familles, adhérence, omission)
- M8 reasoning (filiation, redistribution)
- M16 intelligence (variant mix, non-circularité)
- M9 omissions récurrentes/exceptionnelles

Ils sont **intégrés comme UT**, pas comme runner d’export. Branchement pipeline : `applyP6` + detectDiscoveries (inchangé comme architecture).
