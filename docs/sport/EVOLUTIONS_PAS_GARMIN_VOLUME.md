# Évolutions Momentum — Pas manuels, réaffectation Garmin, volume structuré

Document d’architecture produit + état du code (juin 2026).  
Objectif : reprendre les trois évolutions demandées **sans casser** ce qui existe déjà, en explicitant ce qui est **déjà en place**, ce qui **diffère** de la spec initiale, et un **plan d’implémentation** par zone (Aujourd’hui, Calendrier, Programme, XP, Récap, Endurance, Garmin).

> **Principe directeur** : enrichir et unifier — pas remplacer. Toute évolution doit passer par des **résolveurs centraux** (date logique, pas par source, volume par séance) pour éviter de dupliquer la logique dans 40 fichiers.

> **Règle d’or (maintenabilité)** : aucun composant métier ne doit lire directement `session.date`, `activity.date`, `mergedDailySteps()` ou `reps[key]` pour produire une analyse. Il appelle **`resolveDailySteps()`**, **`resolveSessionCalendarDate()`** ou **`getExerciseVolumeFromLog()`**. Les exceptions (sync Garmin, audit technique) sont listées explicitement dans ce document.

---

## Table des matières

1. [Synthèse exécutive](#1-synthèse-exécutive)
2. [Architecture des résolveurs centraux](#2-architecture-des-résolveurs-centraux)
3. [Couche domain services](#3-couche-domain-services)
4. [Évolution 1 — Pas manuels & fiabilité](#4-évolution-1--pas-manuels--fiabilité)
5. [Évolution 2 — Réaffectation Garmin](#5-évolution-2--réaffectation-garmin)
6. [Évolution 3 — Volume structuré & analyses](#6-évolution-3--volume-structuré--analyses)
7. [Matrice d’impact par zone](#7-matrice-dimpact-par-zone)
8. [Ordre de mise en œuvre recommandé](#8-ordre-de-mise-en-œuvre-recommandé)
9. [Risques & décisions ouvertes](#9-risques--décisions-ouvertes)

---

## 1. Synthèse exécutive

| Évolution | Vision produit | État actuel | Valeur utilisateur | Priorité recommandée |
|-----------|----------------|-------------|-------------------|----------------------|
| **1 — Pas manuels** | Complément après montre, XP sur source déclarative réduit | **~85 %** | **Moyenne** | Phase 1 (après fondations) |
| **2 — Réaffectation Garmin** | `recordedDate` vs `logicalDate` partout | **~80 %** | **Très forte** — la plus rentable à court terme | **Phase 1 en tête** |
| **3 — Volume structuré** | `exerciseSetLogs` puis analyses | **~85 %** | **Très forte à long terme** — scope à phaser | Phase 2+ (A→B→C→D) |

**Pourquoi l’Évo 2 en premier ?** Aujourd’hui le système raisonne sur la **date enregistrée** ; l’utilisateur raisonne sur le **jour du programme**. Ce décalage crée des incohérences en cascade : calendrier, complétion, coach, charge, streaks, XP. Le couple `recordedDate` / `logicalDate` est quasiment **obligatoire** pour un produit de suivi d’entraînement sérieux.

Les trois évolutions se renforcent mutuellement, mais **la décision architecturale la plus importante** reste les **résolveurs centraux** (§2) — sans eux, chaque évolution multiplie la dette technique.

---

## 2. Architecture des résolveurs centraux

**C’est la décision la plus importante de tout le document.**

Le vrai risque de Momentum n’est pas la difficulté technique des features. C’est l’érosion progressive :

```
Aujourd’hui     session.date dans ~47 fichiers
Dans 6 mois     if (logicalDate) éparpillé
Dans 1 an       if (manualSteps) éparpillé
Dans 2 ans      if (structuredVolume) éparpillé
                → base impossible à maintenir
```

**Bonne approche** : `Composant → Résolveur → Données`  
**Mauvaise approche** : `Composant → Données directement`

Les résolveurs sont des **fonctions pures** : entrée données brutes, sortie vérité normalisée. Ils ne connaissent pas React, pas le calendrier, pas Vision Coach. Voir §3 pour la couche qui les orchestre.

### 2.1 Les trois résolveurs obligatoires

| Résolveur | Fichier cible | Entrée | Sortie |
|-----------|---------------|--------|--------|
| `resolveDailySteps(garmin, manualEntry)` | `manualDailyWalkUtils.js` (évolution) | métriques jour + saisie | `{ garmin, declarative, total, reliability }` + détail UI optionnel |
| `resolveSessionCalendarDate(session, overrides)` | `sessionCalendarDate.js` (nouveau) | session + overrides | `YYYY-MM-DD` **logique** |
| `getExerciseVolumeFromLog(workoutData, storageKey)` | `exerciseLoadVolume.js` (évolution) | clé jour+exo | `{ sets[], volumeKgReps, source: 'structured' \| 'legacy' }` |

> **Pas / XP** : le résolveur peut exposer en interne `supplement` vs `manualTotal` pour l’UI (mode complément), mais **XP, trophées et breakdown** ne distinguent que deux catégories : **source fiable** (Garmin) et **source déclarative** (tout apport manuel au total).

### 2.2 Résolveurs d’interprétation (Évo 3 — Phases C et D uniquement)

| Résolveur | Phase | Fichier | Rôle |
|-----------|-------|---------|------|
| `interpretExerciseProgression(prev, curr)` | **C** | `volumeProgressionEngine.js` | `ProgressionInsight` — voir §6.5 |
| `classifyTrainingIntent(signals, context)` | **D** | `trainingIntentClassifier.js` | Intention probable — voir §6.6 ; **feature-flag obligatoire** |

**Ne pas livrer C et D en même temps que le stockage structuré.** Stockage et interprétation sont deux projets distincts (voir §6.2).

### 2.3 Règles d’usage

1. **Tout code métier orienté utilisateur** passe par les résolveurs **ou** les domain services (§3) qui les appellent — jamais les données brutes.
2. **Interdit** : lire `activity.date` ou `session.date` brut sans `resolveSessionCalendarDate`.
3. **Les composants UI ne appellent pas les résolveurs directement** — ils passent par un domain service (`WalkingMetricsService.getDaySteps(date)`, etc.).
4. **Exceptions explicites** (date Garmin brute légitime) :
   - sync / import Garmin ;
   - affichage audit « enregistré le … » ;
   - `dailyMetrics` (jour civil capteur) ;
   - debug / export technique.
5. **CI recommandé** : lint rule interdisant `session.date` hors liste blanche.

### 2.4 Migration progressive

Les résolveurs **délèguent au legacy** tant que les nouvelles données n’existent pas (fallback transparent). Aucune régression pour l’utilisateur actuel.

---

## 3. Couche domain services

À terme, les résolveurs seuls ne suffisent pas — sans couche intermédiaire, ils finissent en monstres de 2 000 lignes mêlant normalisation, cache, règles produit et formatage UI.

### 3.1 Architecture cible

```
Données brutes (IDB, Garmin, agrégat)
        ↓
Résolveurs (fonctions pures, normalisation)
        ↓
Domain Services (orchestration, règles métier, cache)
        ↓
UI / hooks / pipelines Récap
```

| Couche | Responsabilité | Exemple |
|--------|----------------|---------|
| **Résolveur** | Normaliser une entrée → sortie déterministe | `resolveDailySteps(g, entry)` |
| **Domain service** | Agréger, mettre en cache, appliquer règles produit, exposer API stable | `WalkingMetricsService.getPeriodTotals(range)` |
| **UI** | Affichage, interactions | `CalendarDayRecapDetailPanel` |

### 3.2 Services suggérés (création progressive)

| Service | Résolveur(s) sous-jacent(s) | Consommateurs typiques |
|---------|----------------------------|------------------------|
| `TrainingDayTruthService` | `resolveSessionCalendarDate` | Calendrier, Récap, `dayJustificationUtils` |
| `WalkingMetricsService` | `resolveDailySteps` | Sidebar, XP, trophées marche, Snapshot |
| `VolumeAnalyticsService` | `getExerciseVolumeFromLog` | Récap dense, charge hebdo |
| `ProgramCompletionService` | `resolveSessionCalendarDate` + complétion exos | Programme, Aujourd’hui, bonus (D4) |

**Phase 0** : les services peuvent être de simples modules exportant des fonctions — pas besoin d’une classe lourde. L’important est la **frontière** : l’UI n’importe jamais `manualDailyWalkUtils.resolveDailySteps` directement ; elle importe `WalkingMetricsService`.

### 3.3 Règle anti-monstre

Si un résolveur dépasse ~150 lignes ou commence à formater du texte coach → extraire la logique dans un domain service. Les résolveurs restent **testables en isolation** avec des fixtures JSON.

---

## 4. Évolution 1 — Pas manuels & fiabilité

### 4.1 Objectif rappelé

Permettre de compléter les pas quand Garmin est absent, incomplet ou après extinction de la montre, **sans** rendre la triche attractive. Conserver **Garmin / manuel / total** séparément pour analyses futures.

### 4.2 Ce qui existe déjà (à préserver)

| Composant | Fichier | Comportement |
|-----------|---------|--------------|
| Stockage manuel | `src/utils/sport/manualDailyWalkUtils.js` | `enduranceData.manualDailyWalkByDate[YYYY-MM-DD]` → `{ steps, distanceKm?, updatedAt }` |
| Plafonds anti-abus | idem | 55 000 pas/j, 90 km/j |
| Fusion affichage | `mergedDailySteps(garmin, manual)` | **max(garmin, manual)** par jour — évite double comptage si l’utilisateur recopie la montre |
| UI saisie | `EnduranceTab` → `ManualDailyWalkPanel.jsx` | Date + pas + km optionnel, liste, suppression |
| XP | `src/services/xp/xpCalculations.js` §4 | `sumMergedDailyStepsTotal()` × **0,01** (lifetime) |
| Invalidation cache XP | `src/hooks/useSportXP.js` | Checksum manuel dans la signature |
| Calendrier (lecture) | `CalendarHeatmap.jsx`, `calendarDayRecapDetail.js` | Affiche pas fusionnés + mention saisie manuelle |
| Récap tendances | `recapDailyChartData.js`, `RecapDailyTrendChartsBlock.jsx` | Courbes avec fusion |
| Marche / trophées | `walkingFromSteps.js` | Paramètre `manualStepsByDate` déjà supporté |
| Traductions | `translations/fr/endurance.json` | Texte explicite fusion / XP / calendrier |

**Conclusion** : l’Évolution 1 n’est pas un greenfield. C’est une **montée en gamme** du système existant.

### 4.3 Écart spec vs implémentation — pourquoi le mode « Complément »

**Spec initiale** : Garmin 4 000 + complément manuel 3 000 → **7 000** affichés.

**Code actuel** : `mergedDailySteps` retourne **max(4 000, 3 000) = 4 000**.

**Cas piège (addition naïve)** — l’utilisateur a fait ~12 000 pas dans la journée, Garmin n’en a capté que 7 000, il saisit « 12 000 » en pensant au total :

| Mode | Calcul | Résultat |
|------|--------|----------|
| Addition naïve | 7 000 + 12 000 | **19 000** → faux |
| Max actuel | max(7 000, 12 000) | **12 000** → correct si intention = total, mais ambigu |
| **Complément explicite** | 7 000 + 5 000 (complément saisi) | **12 000** → sémantique claire |
| **Total estimé** | max(7 000, 12 000) | **12 000** → équivalent max, UI explicite |

| Approche | Avantages | Inconvénients |
|----------|-----------|---------------|
| **A. Garder max** | Simple, anti-triche, déjà déployé | Ne couvre pas « montre éteinte en fin de journée » |
| **B. Addition totale** | Correspond à la spec | Risque de double comptage si l’utilisateur saisit le total jour |
| **C. Complément explicite (recommandé)** | Sémantique claire, auditable | Légère complexité UI |

**Recommandation C** — modèle enrichi sans casser l’existant :

```typescript
// enduranceData.manualDailyWalkByDate[date]
{
  steps: number,              // interprétation selon entryMode
  entryMode: 'total' | 'supplement',  // NOUVEAU
  distanceKm?: number,
  updatedAt: string,
  source?: 'phone' | 'estimate' | 'other',  // NOUVEAU
  reliability: 'verified' | 'self_reported'   // NOUVEAU — Garmin reste 'verified' côté dailyMetrics
}

// Résolveur unique (remplace mergedDailySteps à terme)
function resolveDailySteps(garminSteps, manualEntry) {
  const g = garminSteps || 0;
  if (!manualEntry?.steps) {
    return { garmin: g, declarative: 0, total: g, reliability: 'verified' };
  }
  let total;
  if (manualEntry.entryMode === 'supplement') {
    total = g + manualEntry.steps;
  } else {
    total = Math.max(g, manualEntry.steps); // mode 'total' — rétrocompat
  }
  const declarative = Math.max(0, total - g); // part manuelle au total
  const reliability = declarative === 0 ? 'verified' : (g > 0 ? 'mixed' : 'self_reported');
  return { garmin: g, declarative, total, reliability };
}
```

- **Migration** : entrées sans `entryMode` → traitées comme `total` (comportement actuel).
- **Plafond** : `total` plafonné à 55 000 ; complément seul plafonné à ex. 25 000/j.
- **UI** : peut toujours afficher `4 200 Garmin + 2 800 complément` — détail de saisie, pas une troisième catégorie XP.

### 4.4 XP — deux sources seulement

**Actuel** : 1 XP pour 100 pas fusionnés, quelle que soit la source.

**Cible (simple)** :

```text
XP_jour = round(garminSteps × 0.01)           // source fiable = 100 %
        + round(declarativeSteps × 0.01 × 0.5)  // source déclarative = 50 %
```

| Concept | Définition | Facteur XP |
|---------|------------|------------|
| **Source fiable** | Pas issus de `dailyMetrics` (montre) | **100 %** |
| **Source déclarative** | Apport manuel au total (`declarative` du résolveur) | **50 %** |

Pas de troisième facteur (complément vs journée 100 % manuelle). Le mode « Complément » vs « Total estimé » reste une **sémantique de saisie** pour éviter le double comptage — pas une taxonomie XP.

**Breakdown UI** : `stepsXpVerified`, `stepsXpDeclarative` — deux lignes, pas trois.

**Fichiers** : `xpCalculations.js`, `useSportXP.js`, `SportXPBar.jsx` — via `WalkingMetricsService`.

### 4.5 Fiabilité & analyses futures

Deux niveaux de fiabilité pour les **analyses** (aligné sur XP) :

| `reliability` | Signification |
|---------------|---------------|
| `verified` | 100 % Garmin |
| `mixed` | Garmin + déclaratif |
| `self_reported` | 100 % déclaratif |

Stockage dérivé du résolveur : `stepsGarmin`, `stepsDeclarative`, `stepsTotal`, `stepsReliability`. Le détail `entryMode` / complément reste dans `manualDailyWalkByDate` pour audit UI.

**Récap / coach** : indicateur optionnel « X % des pas sur la période sont auto-déclarés » — **sans pénaliser** le score global.

### 4.6 Lacunes actuelles à combler (ne pas oublier)

Ces consommateurs lisent **Garmin seul** aujourd’hui :

| Fichier | Correction |
|---------|------------|
| `recapCrossCoachAggregate.js` | `computeGarminDailyStats` → passer par `resolveDailySteps` |
| `recapCrossCoachInsights.js` | Insights « pas en hausse » sur total fusionné |
| `RecapSnapshotView.jsx` | KPI « Pas moy. » → fusionné ou détaillé par source |
| `useSidebarData.js` | `todaySteps` fusionné |
| `GarminWalkingStatsCard.jsx` | Passer `manualStepsByDate` à `buildAllTimeWalkingFromSteps` |
| `sportPeriodInsights.js` | Idem |

### 4.7 UX — entrée depuis le calendrier

**Manquant** : édition uniquement dans Endurance > Marche > Manuel.

**Cible** : depuis `CalendarDayRecapDetailPanel` (ligne `steps`) :
- bouton « Compléter les pas » → modal léger (même logique que `ManualDailyWalkPanel`) ;
- choix **Total estimé** vs **Complément après montre** ;
- affichage détail : `4 200 Garmin + 2 800 complément = 7 000`.

### 4.8 Sync & persistance

- Ajouter `manualDailyWalkByDate: {}` dans `workoutAggregateDefaults.js`.
- Cloud : `mergeEnduranceData` fait un spread superficiel — prévoir merge **par date** pour éviter écrasement multi-appareils.
- Doc : mettre à jour `DONNEES_UTILISATEUR_RECAP.md` § endurance / pas.

---

## 5. Évolution 2 — Réaffectation Garmin

> **Priorité produit** : évolution la plus rentable à court terme. Corrige un décalage fondamental entre le modèle technique (date capteur) et le modèle mental utilisateur (jour du programme).

### 5.1 Objectif rappelé

Associer une séance Garmin (ou importée en endurance) au **jour logique** du programme (ex. course du lundi faite mardi).

**Principe de source de vérité (à graver dans le marbre)** :

> **Toute fonctionnalité orientée utilisateur** (calendrier, Aujourd’hui, Programme, complétion, stats, Récap, XP, coach) doit utiliser la **date logique** comme source de vérité **par défaut**.
>
> La **date Garmin** (`activity.date`, `session.date` enregistré) ne doit être utilisée qu’à des fins d’**audit**, de **synchronisation** et d’**historique technique** (détail séance, re-sync, debug).

Cela évite qu’un futur développeur réintroduise accidentellement la date capteur dans une analyse ou un filtre calendrier. La date Garmin reste **visible en détail** (« Enregistré mardi · Compté lundi ») ; elle ne pilote plus le métier utilisateur.

### 5.2 État actuel — une seule date

```
Garmin sync → activity.date (= jour startTimeLocal)
           → buildEnduranceSessionFromGarminCardio → session.date
           → tous les filtres calendrier / récap / XP utilisent session.date
```

**Il n’existe pas** : `logicalDate`, `recordedDate`, drag-drop session, override de date utilisateur.

**À ne pas confondre** avec :
- `workoutDayOverride` (`WorkoutContext`) — quel jour de **programme muscu** afficher aujourd’hui ;
- `changeSessionCalendarDate` — navigation jour pour **coches/reps** ;
- `dailyVariations` — overrides séries/reps, pas dates d’activité.

### 5.3 Modèle de données proposé

#### Couche 1 — Overrides globaux (recommandé pour Garmin IDB)

```typescript
// Dans l'agrégat workout (enduranceData ou racine)
garminActivityDateOverrides: {
  [garminId: string]: {
    logicalDate: "YYYY-MM-DD",
    updatedAt: string,
    reason?: string  // optionnel UI
  }
}
```

- **Ne jamais muter** `activity.date` dans IndexedDB Garmin (trace sync / re-sync).
- Au re-sync Garmin, **préserver** l’override si `garminId` stable.

#### Couche 2 — Sessions endurance importées

```typescript
// enduranceData.sessions.running[] (et autres)
{
  id, garminId,
  date,              // recordedDate — enregistré capteur (immuable après import)
  logicalDate?: "YYYY-MM-DD",   // jour programme / choix utilisateur
  source: 'garmin' | 'manual',
  ...
}
```

Pour sessions **manuelles** : `date` éditable directement (comportement actuel suffit).

#### Résolveur central (obligatoire)

```javascript
// src/utils/sessionCalendarDate.js (nouveau fichier)

export function resolveSessionCalendarDate(session, overrides = {}) {
  if (session?.logicalDate) return normalizeDateString(session.logicalDate);
  const gid = session?.garminId ?? session?.id;
  const ov = gid != null ? overrides[String(gid)] : null;
  if (ov?.logicalDate) return normalizeDateString(ov.logicalDate);
  return normalizeDateString(session?.date);
}

export function resolveGarminActivityCalendarDate(activity, overrides = {}) {
  const gid = activity?.garminId ?? activity?.id;
  const ov = gid != null ? overrides[String(gid)] : null;
  if (ov?.logicalDate) return normalizeDateString(ov.logicalDate);
  return normalizeDateString(activity?.date || activity?.startTimeLocal);
}
```

**Règle** : tout code qui filtre « activités du jour X » ou « fenêtre Récap » doit passer par ce résolveur — **sauf** `dailyMetrics` (sommeil, pas, stress) qui restent sur le jour civil Garmin.

### 5.4 UX calendrier

Depuis le panneau jour ou la liste des séances Garmin :

1. Clic sur une séance → « Associer à un autre jour »
2. Sélecteur de date (avec indication jour programme prévu si muscu/endurance planifiée)
3. Affichage double : `Enregistré mardi 4 juin · Compté lundi 3 juin`
4. Action « Réinitialiser » → retour date Garmin

**Pas de drag-drop obligatoire en V1** — sélecteur de date suffit et réduit la complexité mobile.

### 5.5 Consommateurs à migrer (par priorité)

#### P0 — Vérité métier

| Zone | Fichiers |
|------|----------|
| Calendrier affichage | `calendarUtils.js`, `calendarPhysicalSessionStripes.js`, `calendarDayMomentumStripes.js`, `calendarGarminDayRecap.js`, `CalendarHeatmap.jsx` |
| Fusion course | `garminEnduranceSessionBridge.js`, `runningVolumeTruth.js`, `runningCardioStatsAnalytics.js` |
| Jour d’activité Récap | `recapTrainingDayTruth.js` |
| Digest endurance | `recapPageDigest.js`, `recapEnrichmentMetrics.js` |
| Justifications jour off | `dayJustificationUtils.js` |

#### P1 — Analyses & coach

| Zone | Fichiers |
|------|----------|
| Vision Coach / temporal | `recapCoachVision.js`, `recapCoachVisionTemporal.js`, `recapCoachVisionDenseProse.js` |
| Charge / programme | `recapProgramCoachAnalysis.js`, `recapAdaptiveInsights.js` |
| Timeline séances | `buildUnifiedSessionTimeline` dans `recapEnrichmentMetrics.js` |
| Training load | `trainingLoadUtils.js`, `recapMuscleLoadEngine.js` |

#### P2 — Gamification

| Zone | Fichiers |
|------|----------|
| XP | `xpCalculations.js` (endurance, pas liés aux séances course) |
| Trophées course | `runningTrophiesService.js` |
| Défis endurance | `enduranceChallengesService.js` |
| Stats Garmin cards | `GarminRunningStatsCard.jsx`, `sportPeriodInsights.js` |

#### Complétion programme — objectif UX (D4)

**Cas utilisateur** : programme prévoit une course le lundi ; course faite mardi ; réaffectée au lundi. L’utilisateur s’attend à voir le **lundi validé** — sinon la réaffectation semble inutile (« pourquoi j’ai déplacé la séance si le programme dit que je ne l’ai pas faite ? »).

| État | Décision |
|------|----------|
| Implémentation actuelle | Complétion exos (`checkedExercises`, `programCompletionBonus`) reste sur la date de saisie brute |
| **Objectif produit** | Une séance réaffectée au jour logique **doit** contribuer à la complétion de ce jour (course planifiée, slot endurance, bonus programme) |
| **Statut** | **À réévaluer avant mise en production** — ne pas figer « Non en V1 » ; traiter comme risque UX majeur si livré sans lien complétion |

**Piste technique** : `resolveSessionCalendarDate` déjà utilisé pour calendrier/Récap ; étendre à `programCompletionBonus.js`, `dayJustificationUtils.js`, et tout filtre « séance du jour X » côté Programme/Aujourd’hui. Les coches muscu manuelles restent sur la date de saisie ; seules les séances **réaffectées** (ou importées avec `logicalDate`) basculent.

#### Hors scope date logique (inchangé)

- **Métriques quotidiennes Garmin** (`dailyMetrics` : sommeil, pas montre, stress) — jour civil capteur, pas de `logicalDate`.

### 5.6 Import / re-sync Garmin

- `useGarminImport.js` : à l’import, `date` = enregistré ; ne pas écraser `logicalDate` ni les overrides.
- `mergeGarminCardioIntoRunningSessions` : appariement par **date logique** résolue pour éviter doublons fantômes.
- `pairMomentumRunsWithGarminForDate` : idem.

### 5.7 Lien avec Programme & Aujourd’hui

Quand l’utilisateur réaffecte une course au **lundi** (jour prévu « Street + course ») :
- le calendrier montre la validation du **bon slot** ;
- les bandes d’intensité du lundi reflètent la course ;
- **la complétion du lundi doit refléter la séance** (voir D4 — objectif avant prod) ;
- Vision Coach peut dire « tu as bien exécuté le lundi prévu, même si Garmin l’a datée mardi ».

**Option V2** : suggérer automatiquement le jour programme le plus proche (±1 jour) quand une séance orpheline est détectée.

---

## 6. Évolution 3 — Volume structuré & analyses

> **Attention au scope** : le stockage structuré et l’interprétation intelligente sont **deux projets distincts**. Livrer `ProgressionInsight` + `trainingIntentClassifier` en même temps que `exerciseSetLogs` est le principal risque de dérapage de cette évolution.

### 6.1 Objectif rappelé

Remplacer les ambiguïtés (`"4x10"`, total reps flou) par des données exploitables : séries, reps, charge, mode de charge. L’interprétation (progression, intention) vient **après** que le volume exact soit fiable.

### 6.2 Phasage obligatoire (A → B → C → D)

| Phase | Contenu | Livrable | Risque |
|-------|---------|----------|--------|
| **A — Stockage** | `exerciseSetLogs`, UI saisie détaillée, sync legacy | Données série-par-série persistées | Faible |
| **B — Volume exact** | `getExerciseVolumeFromLog`, kg×reps, intensité, charge hebdo | Métriques fiables dans Récap | Moyen |
| **C — Progression** | `ProgressionInsight`, `volumeProgressionEngine` | Comparaisons explicables inter-séances | Moyen-élevé |
| **D — Intention** | `trainingIntentClassifier` | Force / hypertrophie / technique / deload / fatigue | **Très élevé** — faux positifs |

**Règle** : ne pas commencer C tant que B n’est pas stable sur données réelles. **D est optionnelle** et doit rester derrière un feature flag longtemps.

**Piège Phase D** : `6×6 @ 18 kg` peut signifier force, hypertrophie, reprise post-deload, fatigue, ou simple test — selon le contexte (historique, séance entière, plan, RPE). Le risque de faux positifs est **énorme** ; le classifieur est probablement la partie la plus difficile de tout le document.

### 6.3 Ce qui existe déjà

#### Snapshot workout (IndexedDB)

| Clé | Forme actuelle | Rôle |
|-----|----------------|------|
| `checkedExercises` | `YYYY-MM-DD_exId → bool` | Exo coché |
| `reps` | `YYYY-MM-DD_exId → number` | **Total reps du jour** (pas par série) |
| `exerciseWeights` | `string` ex. `"12,5"` | Poids unique |
| `exerciseWeightPerArm` | `bool` | Haltère = ×2 si bilatéral |
| `exerciseSetWeights` | `string[]` | Poids par série, **sans reps par série** |
| `dailyVariations.exerciseSeriesOverrides` | `exId → "5×15"` | Texte libre jour |

#### Programme

- `exercise.series` : `"4×10"`, `"3×10 par bras"`, `"30 sec"` — **texte**, pas structuré.
- `ProgramEditor.jsx` : champs sets/reps UI → compilés en string à la sauvegarde.

#### Moteurs d’analyse existants

| Module | Fichier | Limite actuelle |
|--------|---------|-----------------|
| Parse plan | `recapMovementClassification.parseSeriesVolume` | Plan seulement ; ignore `4×4-6` |
| Parse riche | `seriesParser.js` | **Non branché** au snapshot utilisateur |
| Volume kg×reps | `exerciseLoadVolume.js` | `distributeRepsToSets` = répartition **uniforme** |
| Momentum reps | `recapUserAssessment.repsMomentumRatio` | Compare totaux journaliers, pas intensité |
| Charge / sem. | `recapDenseAnalytics.computeWeeklyLoadStats` | Agrège kg×reps approximatifs |
| Alignement séance | `todaySessionScore.js` | Prévu vs réalisé en **total reps** |
| Feedback snapshot | `SessionFeedback` + `workoutLoadSnapshot` | Dénormalisé, pas source de vérité analyses |

**`weightMode` n’existe pas** — seulement `exerciseWeightPerArm: boolean`.

### 6.4 Schéma cible — Phase A uniquement

#### Nouveau — log structuré par exercice/jour

```typescript
// workoutData.exerciseSetLogs[storageKey]  — storageKey = YYYY-MM-DD_exId[_variant]
{
  sets: Array<{
    reps: number,
    weight: number | null,       // null = poids du corps / non applicable
    weightMode: 'total' | 'perHand' | 'perSide' | 'bodyweight' | 'assisted' | 'added',
    // tempo, rpe — Phase A : ne pas implémenter ; réservés phases ultérieures
  }>,
  loggedAt?: string,
  schemaVersion: 1
}
```

#### Règles de rétrocompatibilité

| Si | Alors |
|----|-------|
| Pas de `exerciseSetLogs[key]` | Dériver depuis `reps` + `exerciseWeights` + `series` (comportement actuel) |
| `exerciseSetLogs` présent | `reps[key]` = **sum(set.reps)** (maintenu en sync à l’écriture) |
| UI Aujourd’hui / Calendrier | Mode **simple** (total) + mode **détaillé** (expand séries) |

**Ne pas supprimer** les champs legacy tant que migration < 100 %.

### 6.5 Moteur de progression — Phase C (`ProgressionInsight`)

Fichier suggéré : `src/utils/sport/volumeProgressionEngine.js`

Pour chaque exercice, comparer **sessions comparables** (même exo, fenêtre 2–8 semaines) :

| Signal | Détection | Conclusion coach |
|--------|-----------|------------------|
| Même charge, +reps | `weight` stable, reps ↑ | Surcharge progressive classique |
| +charge, −reps | weight ↑, reps ↓, volume kg×reps ↑ ou stable | Probable travail force — **pas** régression |
| +séries, même charge/reps | sets ↑ | Volume ↑ |
| −reps, tempo plus lent / RPE ↑ | métadonnées V2 | Difficulté ↑ malgré volume brut ↓ |
| Mode charge change | `perHand` → `total` | Normaliser avant comparer (×2) |

**Exemples spec** couverts :

```
S1: 4×10 @ 12 kg/main  →  volume = 4×10×12×2 = 960 kg×reps (perHand)
S2: 6×6 @ 18 kg/main   →  volume = 6×6×18×2 = 1296 → progression force, pas régression
```

#### Sortie structurée obligatoire (`ProgressionInsight`)

Le moteur ne doit pas se contenter d’un libellé interne. Chaque comparaison produit un objet consommable par Vision Coach, Récap dense et futurs modules d’audit :

```typescript
type ProgressionInsight = {
  progressionType:
    | 'strength'           // charge ↑, reps ↓ ou stables
    | 'hypertrophy'        // reps/volume ↑ à charge stable
    | 'volume'             // séries ↑ sans hausse d’intensité
    | 'technical'          // tempo lent, contrôle, RPE élevé à volume ↓
    | 'deload'             // baisse volontaire multi-exos
    | 'fatigue_accumulated'// baisse généralisée post-surcharge
    | 'stall'              // plateau
    | 'regression'         // baisse non expliquée par intention
    | 'neutral';
  confidence: number;      // 0–1
  explanation: string;     // phrase courte pour le coach (« Charge fortement augmentée malgré baisse des répétitions »)
  metrics?: {
    volumeDeltaPct?: number;
    avgWeightDeltaPct?: number;
    avgRepsDeltaPct?: number;
  };
};
```

**Exemple** :

```json
{
  "progressionType": "strength",
  "confidence": 0.91,
  "explanation": "Charge fortement augmentée malgré baisse des répétitions",
  "metrics": { "volumeDeltaPct": 35, "avgWeightDeltaPct": 50, "avgRepsDeltaPct": -40 }
}
```

Sans cette couche, Vision Coach ne pourra pas expliquer *pourquoi* il conclut à une progression dans un an — seulement *que* les chiffres ont bougé.

### 6.6 Classification de l’intention — Phase D (`trainingIntentClassifier`)

**Problème** : volume, charge et intensité décrivent *ce qui* a changé, pas *pourquoi* l’utilisateur l’a probablement changé.

Le moteur d’analyse **ne doit pas** considérer qu’une modification de séries, répétitions ou charge constitue systématiquement une progression ou une régression. Il doit tenter d’identifier l’**intention probable** à partir des signaux disponibles (et, en V2, tempo / RPE / notes).

Fichier suggéré : `src/utils/sport/trainingIntentClassifier.js` (ou sous-module de `volumeProgressionEngine.js`)

| Signaux observés | Intention probable | `progressionType` |
|------------------|-------------------|-------------------|
| Charge ↑, reps ↓ | Orientation force | `strength` |
| Reps ↑ à charge stable | Orientation hypertrophie / endurance musculaire | `hypertrophy` |
| Reps ↓ + tempo lent / note technique | Travail technique, excentrique, contrôle | `technical` |
| Volume ↓ sur plusieurs exos, fenêtre courte | Deload probable | `deload` |
| Performances ↓ généralisées après semaines lourdes | Fatigue accumulée probable | `fatigue_accumulated` |
| Volume ↑, charge stable | Surcharge volume classique | `volume` |

**Contexte d’exécution** (à enrichir progressivement) :

- phase excentrique / tempo (`tempo` dans `exerciseSetLogs`, V2) ;
- contrôle du mouvement (RPE élevé à volume constant ou inférieur) ;
- changement volontaire de stratégie (corrélation multi-exos même séance) ;
- alignement avec le plan (`exercise.series` prévu vs réalisé).

**Objectif** : les analyses futures (Vision Coach, insights adaptatifs) comprennent non seulement *ce qui* a changé mais aussi *pourquoi* cela a probablement changé — et peuvent formuler des conseils différenciés (« deload cohérent » vs « régression à investiguer »).

**Prérequis** : Phase B stable + Phase C en production depuis plusieurs semaines.

**Garde-fous obligatoires** :
- Feature flag `enableTrainingIntentClassifier` (désactivé par défaut) ;
- Ne jamais afficher une intention avec `confidence` < seuil (D7) ;
- Formulations prudentes (« possible orientation force ») plutôt que diagnostics ;
- Ne pas lier XP, complétion ou scores à l’intention inférée.

**Consommateurs** (si flag actif) : `recapCoachVisionDenseProse.js`, `recapAdaptiveInsights.js` — en **enrichissement**, pas en remplacement du narratif Phase B.

### 6.7 Impact analyses Récap — par phase

Fichiers à **enrichir** (pas remplacer) :

| Fichier | Phase | Gain |
|---------|-------|------|
| `exerciseLoadVolume.js` | B | Volume exact depuis `exerciseSetLogs` |
| `recapUserAssessment.js` | B | `intensityMomentum` (charge moyenne par rep) |
| `recapDenseAnalytics.js` | B | Charge/semaine fiable |
| `VolumeAnalyticsService` | B | API stable pour Récap / coach |
| `recapDenseAnalytics.js` | C | Snippets avec `progressionType` + `explanation` |
| `recapCoachVisionDenseProse.js` | C | Phrases basées sur `ProgressionInsight` |
| `recapAdaptiveInsights.js` | C | Stall vs progression force |
| `recapCoachVisionDenseProse.js` | D | Nuance intention (si flag + confidence OK) |
| `recapProgramCoachAnalysis.js` | B | Plan vs réalisé en kg×reps |
| `todaySessionScore.js` | B | Alignement série-par-série si log structuré |

### 6.8 UI — Aujourd’hui & Calendrier (Phase A)

**Actuel** (`TodayTab.jsx`, `CalendarHeatmap.jsx`) :
- 1 champ reps total ;
- poids si charge externe ;
- poids S1…Sn si `inferDefaultSetCount > 1` ;
- **pas** de reps par série.

**Cible progressive** :

1. **Phase UI-A** : garder saisie simple par défaut ; bouton « Détail par série » ouvre N lignes `{reps, weight, mode}`.
2. **Phase UI-B** : pré-remplissage depuis `exercise.series` du plan (sets/reps suggérés, charge dernière fois).
3. **Phase UI-C** : refuser `"abc"` / `"beaucoup"` — validation numérique ; conserver `exerciseSeriesOverrides` texte pour le **plan** seulement, pas le log.

`ExerciseItem.jsx` et `CalendarWorkoutEntryModal.jsx` : aujourd’hui incomplets (pas de poids) — les aligner sur TodayTab.

### 6.9 Programme — structuration optionnelle

**Ne pas forcer** la structuration au niveau programme en V1 (énorme migration `workoutProgram.js`).

**V1** : programme reste en `series` texte ; le **log utilisateur** est structuré.  
**V2** : `ProgramEditor` persiste `{ defaultSets, defaultReps, defaultWeight, weightMode }` en plus du texte `series` pour compat.

### 6.10 Fin des saisies ambiguës — périmètre réaliste

| Zone | Action |
|------|--------|
| Log séance (Aujourd’hui, Calendrier) | Champs numériques stricts en mode détaillé |
| Override jour (`exerciseSeriesOverrides`) | Parser via `seriesParser.js` + validation |
| Import / sync | Inchangé |

Le texte libre reste possible pour **notes**, pas pour le moteur d’analyse.

---

## 7. Matrice d’impact par zone

### 7.1 Onglet Aujourd’hui

| Évolution | Impact |
|-----------|--------|
| 1 Pas | Afficher pas du jour fusionnés (sidebar déjà partiellement Garmin seul) |
| 2 Garmin | Si course importée aujourd’hui — réaffectation depuis détail séance |
| 3 Volume | UI séries détaillées ; sync `exerciseSetLogs` ; `todaySessionScore` enrichi |

**Fichiers** : `TodayTab.jsx`, `ExerciseItem.jsx`, `useSidebarData.js`, `todaySessionScore.js`, `todayRepository.js`.

### 7.2 Calendrier

| Évolution | Impact |
|-----------|--------|
| 1 Pas | Édition complément/total depuis panneau jour |
| 2 Garmin | Réaffectation ; double affichage date ; bandes intensité sur date logique |
| 3 Volume | Modal jour : log structuré (aligné heatmap) |

**Fichiers** : `CalendarHeatmap.jsx`, `CalendarDayRecapDetailPanel.jsx`, `calendarUtils.js`, toute la chaîne `calendar*Stripes*`, `calendarDayChampion.js`.

### 7.3 Programme

| Évolution | Impact |
|-----------|--------|
| 1 | Faible |
| 2 | **Fort** — réaffectation + **complétion jour logique** (D4) |
| 3 | Moyen V2 — defaults structurés ; V1 inchangé |

**Fichiers** : `workoutProgram*.js`, `ProgramEditor.jsx`, `programCompletionBonus.js`, `dailyVariationSeriesOverrides.js`.

### 7.4 XP

| Évolution | Impact |
|-----------|--------|
| 1 | **Fort** — XP deux sources (fiable 100 % / déclaratif 50 %) |
| 2 | Faible à moyen — trophées/défis endurance sur date logique |
| 3 | Faible V1 — volume pourrait alimenter XP force à terme |

**Fichiers** : `xpCalculations.js`, `useSportXP.js`, `SportXPBar.jsx`.

### 7.5 Endurance

| Évolution | Impact |
|-----------|--------|
| 1 | **Fort** — complément pas, sync, trophées marche |
| 2 | **Fort** — `logicalDate` sur sessions ; overrides |
| 3 | Faible |

**Fichiers** : `enduranceDataService.js`, `ManualDailyWalkPanel.jsx`, `EnduranceTab.jsx`, `enduranceChallengesService.js`.

### 7.6 Garmin (onglet + IDB)

| Évolution | Impact |
|-----------|--------|
| 1 | `dailyMetrics.steps` inchangé ; pas manuel séparé |
| 2 | **Fort** — overrides, affichage double date, pas de mutation `activity.date` |
| 3 | Néant |

**Fichiers** : `garminDataSave.js`, `garminDataFusion.js`, `useGarminImport.js`, `GarminTab/*`.

### 7.7 Récap > Analyse (Vision Coach, Structure, dense analytics)

| Évolution | Impact |
|-----------|--------|
| 1 | Coach sommeil/pas ; fiabilité données ; tendances pas complètes |
| 2 | **Fort** — jours d’activité, course km/sorties, mois vs mois, training day truth |
| 3 | **Fort (phasé)** — B : charge fiable ; C : `ProgressionInsight` ; D : intention (flag) |

**Fichiers** : tout le pipeline `useRecapTabMetrics` → `recapCoachVisionDenseProse.js`, `recapDenseAnalytics.js`, `recapTrainingDayTruth.js`, `recapCrossCoachAggregate.js`, `DONNEES_UTILISATEUR_RECAP.md`.

### 7.8 Autres zones touchées

| Zone | Évolutions |
|------|------------|
| Quiz profil / preuves | 1 (pas fusionnés dans `quizTrainingEvidence.js` — déjà partiel) |
| Trophées marche/course | 1, 2 |
| Export / cloud sync | 1, 2, 3 — schémas versionnés |
| Défis endurance | 2 (fenêtres dates) |

---

## 8. Ordre de mise en œuvre recommandé

### Phase 0 — Fondations (1–2 semaines)

- [x] `resolveDailySteps()` + `resolveSessionCalendarDate()` + `getExerciseVolumeFromLog()` (fallback legacy)
- [x] Stubs domain services : `WalkingMetricsService`, `TrainingDayTruthService`, `VolumeAnalyticsService`, `ProgramCompletionService`, `GarminDateOverrideService`
- [x] Tests unitaires résolveurs
- [ ] Lint CI interdisant `session.date` hors liste blanche

### Phase 1 — Valeur immédiate (2–3 semaines) — **Évo 2 en tête**

- [x] `garminActivityDateOverrides` + UI réaffectation calendrier (Évo 2)
- [x] Migrer P0 : calendrier, `recapTrainingDayTruth`, `TrainingDayTruthService`, `dayJustificationUtils`, bandes intensité (Évo 2)
- [x] **D4** partiel : `ProgramCompletionService` — crédit course planifiée sur date logique (Évo 2)
- [x] XP deux sources via `WalkingMetricsService` (Évo 1)
- [x] Entrée pas calendrier + mode complément (`CalendarManualWalkEditor`) (Évo 1)
- [x] Consommateurs pas : sidebar, crossCoach aggregate, calendrier jour, Récap Snapshot KPI, GarminWalkingStatsCard, sportPeriodInsights (Évo 1)
- [x] P2 gamification endurance : défis, trophées corde/gainage/pompes, streaks EnduranceTab, XP (Évo 2)
- [x] Trophées course : `runningTrophiesService` sur date logique (Évo 2)
- [x] Re-sync Garmin : préserve `garminActivityDateOverrides` + `logicalDate` session existante (Évo 2)
- [ ] D4 complet : complétion muscu + bonus programme général sur date logique

### Phase 2 — Volume structuré A+B (3–4 semaines)

- [x] `exerciseSetLogs` + UI détail séries (`TodayTab` / `ExerciseSetDetailPanel`) (Évo 3 **Phase A**)
- [x] `exerciseLoadVolume` + `VolumeAnalyticsService` (Évo 3 **Phase B**)
- [x] `todaySessionScore`, `recapDenseAnalytics` via résolveur volume (Évo 3 B)
- [x] `intensityMomentum` dans `recapUserAssessment` (Évo 3 B)
- [ ] UI volume calendrier : `ExerciseItem` / `CalendarWorkoutEntryModal` alignés sur TodayTab

### Phase 3 — Progression C (2–3 semaines, après B stable)

- [x] `volumeProgressionEngine` + `ProgressionInsight` (Évo 3 **Phase C**)
- [x] Injection Vision Coach dense / adaptive / prose (Évo 3 C)

### Phase 4 — Finition & optionnel (continu)

- [ ] Suggestion auto réaffectation ↔ jour programme (Évo 2 V2)
- [ ] Indicateurs fiabilité pas dans Récap (Évo 1)
- [ ] Programme structuré optionnel ProgramEditor (Évo 3 V2)
- [x] **`trainingIntentClassifier` (Évo 3 Phase D)** — feature flag `enableTrainingIntentClassifier` (désactivé par défaut)
- [ ] Tempo / RPE dans `exerciseSetLogs` (extension Phase A)
- [x] Mise à jour `DONNEES_UTILISATEUR_RECAP.md` (clés pas / overrides / setLogs)

---

## 9. Risques & décisions ouvertes

### 9.1 Décisions à trancher avec toi

| # | Question | Recommandation |
|---|----------|----------------|
| D1 | Fusion pas : max vs addition vs complément explicite ? | **Complément explicite** + max pour mode « total » |
| D2 | XP manuel : trois facteurs ou deux ? | **Deux** : Garmin 100 %, déclaratif 50 % — point final |
| D3 | Réaffectation : endurance manuelle aussi ? | Oui — `logicalDate` sur toute session `source: 'garmin'` |
| D4 | Réaffectation modifie-t-elle la complétion du jour cible ? | **Oui** — objectif produit ; Phase 1 via `ProgramCompletionService` |
| D5 | Log structuré obligatoire ou optionnel ? | **Optionnel** — simple par défaut, détail pour utilisateurs avancés |
| D6 | Migration reps existantes | Dériver sets approximatifs depuis `series` + total `reps` |
| D7 | Seuil `confidence` pour afficher une intention (Phase D) ? | Ex. ≥ 0,75 ; sinon ne pas afficher ; flag désactivé par défaut |
| D8 | Domain services : modules ou classes ? | **Modules** exportant fonctions en Phase 0 ; refactor si besoin |

### 9.2 Risques techniques

| Risque | Mitigation |
|--------|------------|
| `session.date` dans 47+ fichiers | Résolveur + `TrainingDayTruthService` ; migration P0→P2 ; lint CI |
| Résolveurs monstres 2000 lignes | Couche domain services (§3) ; résolveurs < 150 lignes |
| Re-sync Garmin écrase overrides | Overrides dans agrégat workout, pas dans activité IDB |
| Double comptage pas | Mode complément + plafonds |
| Incohérence UX réaffectation sans complétion | D4 en Phase 1 |
| **Scope creep Évo 3** (mini moteur expert) | Phasage A→B→C→D strict ; D feature-flag |
| **Faux positifs classifieur intention** | Phase D optionnelle ; confidence seuil ; formulations prudentes |
| Régression analyses coach | Tests snapshot ; `useStructuredVolume` flag |
| Sync cloud conflits | Merge par date (pas, overrides, setLogs) |

### 9.3 Ce qu’il ne faut pas faire

- Remplacer `mergedDailySteps` par une addition naïve sans mode « complément ».
- Modifier `activity.date` côté Garmin IDB à la réaffectation.
- Forcer la saisie structurée avant d’avoir un fallback legacy solide.
- Dupliquer la logique date/pas/volume dans chaque composant — **toujours** résolveur → domain service → UI.
- Appeler un résolveur directement depuis un composant React — passer par le domain service.
- Livrer `trainingIntentClassifier` en même temps que `exerciseSetLogs`.
- Conclure « régression » en Phase D sans confidence suffisante et sans contexte multi-séance.

---

## Annexes

### A. Fichiers clés par évolution

<details>
<summary>Domain services (transversal)</summary>

- `src/services/sport/WalkingMetricsService.js` (nouveau)
- `src/services/sport/TrainingDayTruthService.js` (nouveau)
- `src/services/sport/VolumeAnalyticsService.js` (nouveau)
- `src/services/sport/ProgramCompletionService.js` (nouveau)
</details>

<details>
<summary>Évolution 1 — Pas</summary>

- `src/utils/sport/manualDailyWalkUtils.js`
- `src/components/tabs/EnduranceTab/components/ManualDailyWalkPanel.jsx`
- `src/services/xp/xpCalculations.js`
- `src/utils/sport/walkingFromSteps.js`
- `src/utils/sport/recapDailyChartData.js`
- `src/utils/sport/recapCrossCoachAggregate.js`
</details>

<details>
<summary>Évolution 2 — Réaffectation</summary>

- `src/utils/garminEnduranceSessionBridge.js`
- `src/utils/sport/runningVolumeTruth.js`
- `src/utils/sessionCalendarDate.js` (nouveau)
- `src/utils/calendarUtils.js`
- `src/utils/sport/recapTrainingDayTruth.js`
- `src/utils/dayJustificationUtils.js`
- `src/utils/sport/programCompletionBonus.js` (D4 — complétion date logique)
- `src/components/CalendarHeatmap.jsx`
</details>

<details>
<summary>Évolution 3 — Volume</summary>

- `src/utils/exerciseLoadVolume.js`
- `src/utils/sport/volumeProgressionEngine.js` (Phase C)
- `src/utils/sport/trainingIntentClassifier.js` (Phase D — feature flag)
- `src/utils/seriesParser.js`
- `src/utils/sport/recapMovementClassification.js`
- `src/utils/sport/recapUserAssessment.js`
- `src/utils/sport/recapDenseAnalytics.js`
- `src/utils/sport/recapCoachVisionDenseProse.js`
- `src/components/tabs/TodayTab.jsx`
- `docs/sport/DONNEES_UTILISATEUR_RECAP.md`
</details>

### B. Lien avec la doc Récap existante

Le document [`DONNEES_UTILISATEUR_RECAP.md`](./DONNEES_UTILISATEUR_RECAP.md) inventorie l’état actuel. Après implémentation de chaque phase, y ajouter :

- § pas : `manualDailyWalkByDate`, `entryMode`, fiabilité ;
- § endurance : `logicalDate`, `garminActivityDateOverrides` ;
- § muscu : `exerciseSetLogs`, `weightMode`, dérivation legacy.

---

## 10. État d'implémentation — contrôle juin 2026

Audit code vs ce document (dernière passe : juin 2026).

### Synthèse globale

| Phase | Avancement | Reste principal |
|-------|------------|-----------------|
| **0 — Fondations** | **~95 %** | Lint CI anti `session.date` |
| **1 — Valeur immédiate** | **~88 %** | D4 complétion muscu complète |
| **2 — Volume A+B** | **~90 %** | UI volume calendrier |
| **3 — Progression C** | **~90 %** | Extension Vision Coach classique |
| **4 — Finition** | **~25 %** | V2 auto-réaffectation, fiabilité pas Récap, tempo/RPE |

### Résolveurs & services (§2–3)

| Composant | Statut | Fichier |
|-----------|--------|---------|
| `resolveDailySteps` | ✅ | `src/utils/sport/manualDailyWalkUtils.js` |
| `resolveSessionCalendarDate` | ✅ | `src/utils/sessionCalendarDate.js` |
| `getExerciseVolumeFromLog` | ✅ | `src/utils/exerciseLoadVolume.js` |
| `WalkingMetricsService` | ✅ | `src/services/sport/WalkingMetricsService.js` |
| `TrainingDayTruthService` | ✅ | `src/services/sport/TrainingDayTruthService.js` |
| `VolumeAnalyticsService` | ✅ | `src/services/sport/VolumeAnalyticsService.js` |
| `ProgramCompletionService` | ⚠️ partiel | `src/services/sport/ProgramCompletionService.js` |
| `GarminDateOverrideService` | ✅ | `src/services/sport/GarminDateOverrideService.js` |
| `volumeProgressionEngine` | ✅ | `src/utils/sport/volumeProgressionEngine.js` |
| `trainingIntentClassifier` | ✅ (flag off) | `src/utils/sport/trainingIntentClassifier.js` |

### Évolution 1 — Pas manuels (§4)

| Item | Statut |
|------|--------|
| Mode `entryMode` total / supplement | ✅ |
| XP 100 % Garmin / 50 % déclaratif | ✅ |
| `CalendarManualWalkEditor` | ✅ |
| `useSidebarData`, `recapCrossCoachAggregate` | ✅ |
| `RecapSnapshotView` KPI pas fusionnés | ✅ |
| `GarminWalkingStatsCard`, `sportPeriodInsights` | ✅ |
| `SportXPBar` breakdown deux sources | ✅ |
| Indicateur fiabilité % en Récap | ❌ V2 |

### Évolution 2 — Réaffectation (§5)

| Item | Statut |
|------|--------|
| `garminActivityDateOverrides` + cloud merge | ✅ |
| `CalendarSessionDateReassign` | ✅ |
| P0 calendrier / bandes / récap training truth | ✅ |
| `recapPageDigest`, défis, trophées, streaks | ✅ |
| `runningTrophiesService` date logique | ✅ |
| `useGarminImport` préserve overrides / logicalDate | ✅ |
| D4 complétion course planifiée | ✅ |
| D4 complétion programme général | ⚠️ partiel |
| Suggestion auto jour programme | ❌ V2 |

### Évolution 3 — Volume (§6)

| Item | Statut |
|------|--------|
| `exerciseSetLogs` + persistance | ✅ |
| UI détail séries `TodayTab` | ✅ |
| Volume exact Récap / `todaySessionScore` | ✅ |
| `intensityMomentum` | ✅ |
| `ProgressionInsight` + coach dense | ✅ |
| Classifieur intention (flag) | ✅ |
| UI calendrier volume structuré | ❌ |
| ProgramEditor structuré | ❌ V2 |

### Exceptions légitimes `session.date` brut

Conformes au §2.3 : sync Garmin (`useGarminImport`), affichage audit tables Endurance (date enregistrée), timeline/Gantt onglet Garmin, résolveurs eux-mêmes.

---

*Document rédigé pour cadrer les évolutions sans restreindre le système actuel — Momentum, juin 2026.*
