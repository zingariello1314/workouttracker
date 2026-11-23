# Dialogue technique — Observabilité moteur (complément P6)

Avis indépendant. Pas de clôture P7.

## 1. Déjà disponibles pour l’audit

- Cartes publiées + réserve, dispositions P6, relations, compteurs.
- `serializeConclusion` dans les dossiers 8 périodes (claim, preuves, hypothèses, mémoire, admissibilité…).
- Inspecteur carte-par-carte, AUDIT_IA.md, ANALYTICAL_AUDIT, ZIP dossier complet, vérif DOM.
- Matrice de sous-exploration v2 (jamais testé ≠ non concluant).
- Modèle pipeline `normalizePipelineStages` (unité de comptes, statut d’étape).

## 2. Calculées mais non exportées (avant)

- Payload inspecteur parallèle à `serializeConclusion` (duplication UI).
- Étapes pipeline / timings souvent présents dans le debug mais absents d’un export dédié raisonnement.
- Transformations de thèse/texte (drafting) non consolidées en diffs exportables.
- Observation du dernier pack produit non exposée comme mode console distinct.

## 3. Jamais calculées (et toujours pas inventées)

- Trace rétrospective d’un module non instrumenté pendant le run.
- Preuve qu’une relation « applicable » a été exécutée sans `methodExecuted`.
- Intentions internes du producteur au-delà des champs drafting/lineage présents.

## 4. Registres réutilisés

- `serializeConclusion` / dossiers `buildPeriodAuditDossier`
- `buildUnderexplorationReport` (+ lanes v3)
- `normalizePipelineStages`
- `buildAnalyticalAudit` (rapprochement runId / fingerprint)
- Cache publié + `__momentumLastProductObservation`

## 5. Redondances évitées

- Pas de second moteur ni seconde console.
- Trace ≠ copie de ANALYTICAL_AUDIT (rôles séparés).
- Diffs de transformation, pas copies intégrales intermédiaires.
- Index bulk d’inspection par références, pas N exports carte-par-carte manuels.

## 6. Limites sans accès au code

- Comprendre *pourquoi* un producteur n’a pas été branché sur un chemin.
- Lire la sémantique exacte d’un statut pipeline `untraceable`.
- Corriger un bug de producteur : la trace localise le premier point de rupture, Cursor reste nécessaire pour le patch.

## 7. Compromis richesse / performance

- Mode observation produit gratuit (lecture).
- Trace détaillée **à la demande** (bouton Récap → Analyse).
- Registres normalisés + refs ; instrumentation pipeline optionnelle.
- Mesure : taille trace proportionnelle aux conclusions sérialisées déjà présentes dans les dossiers 8 périodes (réutilisation, pas double calcul métier).

## 8. Fichiers à transmettre à ChatGPT après chaque mission

1. `ANALYTICAL_REASONING_TRACE.json` (8 horizons) — raisonnement + modules + absences d’exploration.
2. `ANALYTICAL_AUDIT.json` — registre normalisé + faits/mémoire.
3. `AUDIT_IA.md` (concis ou détaillé) — lecture humaine.
4. Le dialogue / bilan de mission du dossier `analysis-engine/` concerné.
5. Si litige DOM : rapport `momentumVerifyEightPeriodsDom` / entrée DOM du ZIP.

Optionnel : ZIP dossier complet si l’évaluateur veut tout le manifeste.

## Séparation console / produit — avis

Conserver les deux modes clairement étiquetés. Garantir la comparabilité par fingerprint + runId + provenance, jamais en forçant la console à devenir le pack UI.
