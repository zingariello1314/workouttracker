# Analyse complète du système Endurance – 08/11/2025

## Objectif et périmètre
- Comprendre en profondeur l’onglet `Endurance` (logique métier, persistance, rendu, dépendances croisées).
- Identifier les points sains vs. les dysfonctionnements et dettes techniques qui expliquent les incohérences actuelles.
- Fournir un plan d’action priorisé (du plus urgent au moins urgent) en vue d’un refactoring « Silicon Valley » : robuste, cohérent, performant, facile à faire évoluer et à intégrer avec le reste de l’app (Garmin, Stats, Body Tracking, exports JSON).

## Méthodologie
- Lecture exhaustive de `EnduranceTab.jsx` (plus de 4 000 lignes, logique UI + métier + persistance dans un seul composant).
  
  ```1:88:src/components/tabs/EnduranceTab.jsx
  import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
  ...
  const [enduranceState, setEnduranceState] = useState({
    activeTab: 'boxing',
    sessions: { boxing: [], pushups: [], swimming: [], jumprope: [], running: [] },
    challenges: [],
    ui: { showChallengeModal: false, showSessionForm: false, ... }
  });
  ```

- Analyse des flux de chargement / sauvegarde (`loadEnduranceData`, `saveEnduranceData`, génération d’IDs, nettoyage de doublons).
  
  ```157:329:src/components/tabs/EnduranceTab.jsx
  const loadEnduranceData = useCallback(() => {
    const enduranceData = data.enduranceData || {};
    const rawSessions = {
      boxing: enduranceData.sessions?.boxing || enduranceData.boxingSessions || [],
      ...
    };
    ... // Nettoyage doublons + sauvegarde immédiate via updateData()
  });

  const saveEnduranceData = useCallback(async (newData) => {
    const currentEnduranceData = currentData.enduranceData || {};
    const updatedData = { ...currentData, enduranceData: { ...currentEnduranceData, ...newData, lastUpdated: ... } };
    await updateData(updatedData);
    setEnduranceState(...);
  });
  ```

- Vérification de la persistance réelle via `useWorkoutData` (IndexedDB + localStorage) et de la structure `data.enduranceData` chargée dans le contexte global.
  
  ```520:551:src/hooks/useWorkoutData.js
  const validatedData = {
    ...,
    enduranceData: migratedData.enduranceData || result.enduranceData || {
      sessions: { boxing: [], pushups: [], swimming: [], jumprope: [], running: [] },
      challenges: []
    }
  };
  ```

- Cartographie des integrations : `StatsTab`, `TodayTab` (sessions du jour), charts, Body Tracking, etc.
  
  ```40:128:src/components/tabs/StatsTab.jsx
  const enduranceData = data?.enduranceData || {};
  const sessions = enduranceData.sessions || {};
  ... // calculs de stats dépendant de count/duration/distance/jumps
  ```
  
  ```37:132:src/components/tabs/TodayTab/components/EnduranceSessionsToday.jsx
  const enduranceData = data?.enduranceData || {};
  const sessions = enduranceData.sessions || {};
  ... // affichage quotidien + filtrage des sessions mock
  ```

- Revue des utilitaires (`enduranceUtils`, `calendarUtils`, etc.) et des interactions `WorkoutContext` ↔️ composants satellites (challenges, heatmaps, exports).

## Cartographie fonctionnelle & technique
### Structure de données persistée
- `data.enduranceData` alimente tous les onglets. Persisté via `useWorkoutData` (IndexedDB `WorkoutTrackerDB / workouts` + backup localStorage). Structure attendue :
  - `sessions`: objet `{ boxing, pushups, swimming, jumprope, running }` -> tableaux de sessions hétérogènes.
  - `challenges`: tableau global (tous types confondus).
  - Pas de normalisation ni d’indexation (recherche par `id` se fait en O(n) dans les tableaux).
- Héritage d’anciens schémas géré via fallback `enduranceData.boxingSessions`, etc. (compatibilité ascendante mais entretient la duplication).

### État local dans `EnduranceTab`
- Un unique `useState` (`enduranceState`) porte :
  - Données métiers (sessions + challenges).
  - État UI (modales, formulaires, filtres).
  - Mécanismes de nettoyage d’IDs, logs, diagnostics.
- Gestion de cinq formulaires distincts (pushups, boxing, swimming, jumprope, running) avec beaucoup de duplications et de conversions string↔️number au moment de l’exploitation.
- Conservation d’un flag `hasCleanedDuplicatesRef` pour éviter des boucles infinies après nettoyage → signal d’un couplage excessif entre chargement et écriture.

### Flux de sauvegarde
- Chaque ajout/édition supprime/duplique des objets, puis appelle `updateData` → sérialisation complète en IndexedDB + localStorage.
- `loadEnduranceData` déclenche **immédiatement** des sauvegardes lorsqu’il détecte un doublon → effet secondaire dans un `useEffect` dépendant de `data`, ce qui peut produire des boucles de persistance et des `setTimeout` superflus.
- `generateUniqueId` basé sur `Date.now() + random` : mieux que rien, mais pas reproductible (difficile pour la synchro ou l’import/export différé).

### Intégrations aval
- `StatsTab`, `CalendarTab`, `TodayTab`, `BodyTracking` consomment directement `data.enduranceData.sessions` (attendent des champs homogènes : `date`, `time`, `count`, `duration`, `distance`, `laps`, `jumps`, etc.). Toute modification de schéma doit être centralisée.
- Aucune passerelle native avec Garmin : impossibilité d’aligner automatiquement les volumes endurance vs. données cardio → nécessite une stratégie de fusion (ou a minima d’affichage comparatif).

## Points positifs existants
- Persistance centralisée via `useWorkoutData` (IndexedDB + fallback) fonctionne et assure la disponibilité cross-onglets.
- Détection de doublons intégrée (même si déclenchée tard, elle existe).
- Calculs dans `StatsTab` filtrent déjà les sauts de corde avant d’agréger les répétitions → compréhension fonctionnelle présente côté analytics.
- `EnduranceSessionsToday` applique un filtrage `isMockEnduranceSession` cohérent avec le calendrier.
- Les formulaires couvrent beaucoup de métriques (FC, calories, rythme natation, etc.) → potentiel pour alimenter des dashboards riches une fois la base stabilisée.

## Problèmes critiques (priorité P0)
1. **Composant monolithique impossible à maintenir/perf**  
   - `EnduranceTab.jsx` mélange hook de contexte, validation, nettoyage, calculs de stats, UI, notifications, timers. Taille > 4 000 lignes, rendant chaque évolution risquée.  
   - Risques : fuites de mémoire (callbacks recréés), re-renders massifs, absence de tests unitaires ciblés.  
   - 👉 Solution : éclater en modules spécialisés (`enduranceDataService`, `useEnduranceSessions`, `useEnduranceChallenges`, composants UI par activité). Introduire des types/DTO partagés.

2. **Effets secondaires lors du simple chargement**  
   - `loadEnduranceData` déclenche des `updateData()` si doublons trouvés → écrit en base pendant qu’on lit. Possibles boucles `useEffect(data)` → `updateData` → `data` → ... et contenu console massif (`JSON.stringify` de toutes les sessions).  
   - 👉 Solution : déplacer la détection/résolution de doublons dans un pipeline côté service ou migration au chargement (une seule fois), ou dans `useWorkoutData` avant l’injection dans le contexte. Jamais lancer d’écriture depuis un `useEffect` dérivé du même état.

3. **Absence de normalisation de schéma & conversions incohérentes**  
   - Les sessions stockent des strings (`"25"`, `"1:45"`) puis sont converties à la volée dans les stats. Certaines validations comparent des strings à des nombres (`parseFloat(sessionData.duration) <= challenge.goalDuration`).  
   - 👉 Solution : définir un schéma canonique par activité (ex. `EnduranceSessionBase { id, activityType, dateISO, timeISO, metrics: { count, durationMin, distanceM, ... } }`) + normaliser à l’enregistrement. Toutes les conversions (mm:ss → secondes, kcal → number) doivent être effectuées **avant** de persister.

4. **Sauvegardes complètes sur chaque micro-action**  
   - `saveEnduranceData` appelle `updateData` avec l’objet complet `data`, provoquant un `put` IndexedDB même pour un toggle UI. Aucune mise en lot ni différé.  
   - 👉 Solution : isoler une API `updateEnduranceData(patch)` dans `useWorkoutData` avec debounce/transaction locale (in-memory) avant flush. Introduire une file de commandes si nécessaire.

5. **Compatibilité ascendante non maîtrisée**  
   - Fallback `enduranceData.boxingSessions` / `pushupSessions` maintenu à chaque chargement → complexité et risque de divergence (deux sources de vérité).  
   - 👉 Solution : migration unique versionnée (ex. `enduranceVersion=2`). Tant que la migration n’est pas passée, on lit les anciens champs, puis on les supprime et on marque la base migrée.

## Problèmes majeurs (priorité P1)
1. **Formulaires dupliqués et non factorisés**  
   - Cinq blocs quasi identiques (date, heure, notes, rating) + champs spécifiques. Maintenance lourde, erreurs possibles (incohérences entre activités).  
   - 👉 Solution : construire un générateur de formulaire basé sur un schéma (JSON Schema / config). Séparer « composer UI » et « mapper vers structure interne ».

2. **Validation des challenges fragile**  
   - `validateChallenges` s’appuie sur des champs dont la présence/typage n’est pas garantie (`goalDuration` comparé à `parseFloat(sessionData.duration)` qui peut être string vide).  
   - 👉 Solution : typage strict + helper `normalizeSessionForChallenge`. Déplacer la logique de progression dans un service testable (`enduranceChallengesService`). Prévoir une agrégation cumulative pour les défis période (actuellement recalcul “à la volée” sans stockage intermédiaire).

3. **Absence d’intégration Garmin / Cross-tab**  
   - L’utilisateur veut aligner endurance avec Garmin. Aujourd’hui aucune passerelle (ni import de FC moyenne, ni distances).  
   - 👉 Solution : définir un contrat d’import (ex. table de correspondance date/activité) + pipeline d’enrichissement (fuse Garmin `dailyMetrics` + sessions manuelles). À minima, prévoir un module de rapprochement affichant les écarts.

4. **IDs pseudo-aléatoires**  
   - `generateUniqueId` non déterministe → collisions théoriquement possibles, plus important : impossible d’effectuer des merges ou des syncs différées.  
   - 👉 Solution : utiliser `crypto.randomUUID()` ou une fonction ULID. Idéalement, associer `{date, activityType, sequence}` pour lisibilité humaine + import/export stable.

5. **Logs verboses en production**  
   - `console.log(JSON.stringify(rawSessions, null, 2))` lors du chargement + logs emoji permanents → bruit massif dans la console, performance dégradée.  
   - 👉 Solution : centraliser le logging via `logger.module('endurance')` avec niveaux, et désactiver (ou throttle) en prod.

## Améliorations secondaires (priorité P2)
- **API `getExerciseName` retour fallback** : renvoie ‹ Exercice inconnu › → les historiques manquent de lisibilité. Implémenter une vraie base de données d’exercices ou map statique.
- **Tri / filtrage côté UI** : certains `.sort(...)` sont effectués directement dans le render sans memoisation → à déplacer dans des `useMemo` après normalisation.
- **Exports JSON** : vérifier que l’export global de l’app inclut bien `enduranceData` complet (structure stable). Prévoir un validateur JSON Schema pour garantir la qualité des snapshots partagés.
- **Accessibilité / cohérence UI** : nom de classes, labels, etc. à uniformiser une fois la structure rationalisée.

## Plan d’attaque priorisé
1. **Phase 0 – Sécurisation (P0)**
   - Extraire la logique de chargement/sauvegarde (`loadEnduranceData`, `saveEnduranceData`, génération d’IDs, nettoyage) dans un module `enduranceDataService` testé.
   - Bloquer les sauvegardes automatiques déclenchées depuis `useEffect` (mettre en place une migration unique exécutée une seule fois).
   - Introduire une fonction `normalizeSession` appliquée avant toute persistance (typage fort).

2. **Phase 1 – Refactor structurel (P0/P1)**
   - Découper `EnduranceTab` : hooks dédiés par domaine (`useEnduranceSessions`, `useEnduranceChallenges`, `useEnduranceForms`).
   - Remplacer les formulaires dupliqués par une configuration déclarative + composants réutilisables (inputs standards, StarRating déjà mutualisé).
   - Créer un store interne (context ou Zustand léger) pour l’UI afin de ne pas re-rendre l’ensemble des sections à chaque interaction.

3. **Phase 2 – Données & intégrations (P1)**
   - Implanter une migration versionnée du schéma Endurance (suppression des suffixes `*Sessions`, ajout `schemaVersion`).  
   - Préparer une couche d’intégration Garmin (mapping date/activity). Objectif : comparer, enrichir ou pré-remplir les formulaires Endurance à partir des métriques Garmin.
   - Mettre en place un module de calcul des challenges (progression, validations, historique) indépendant du composant UI.

4. **Phase 3 – Performance & UX (P1/P2)**
   - Déplacer les calculs lourds (tri, agrégations) dans des sélecteurs mémoïsés.  
   - Mettre en cache les requêtes (ex. `getWorkoutHistory`) + pagination/virtualisation de l’historique si besoin.  
   - Introduire une couche de logging structurée avec possibilité de basculer en mode silencieux en production.

5. **Phase 4 – Qualité & extensions (P2)**
   - Ajouter des tests unitaires (normalisation, validation, fusion de sessions, défis).  
   - Documenter le schéma (`docs/endurance/SCHEMA_ENDURANCE.md`) pour faciliter l’export/import.  
   - Préparer des hooks d’extension (ex. nouveaux types d’activités cardio) en maintenant un contrat clair.

## Vérifications complémentaires recommandées
- Auditer les exports JSON actuels pour confirmer l’inclusion et la cohérence de `enduranceData` (et prévoir la migration une fois le schéma stabilisé).
- Contrôler les modules `calendarUtils`, `enduranceUtils`, `BodyTracking` après refonte pour éviter toute régression (ils consomment les mêmes champs).
- Planifier un backfill des données historiques une fois la normalisation en place (script de migration + backup). 

---

**Statut** : Audit terminé. Prochaine étape recommandée → lancer Phase 0 (extraction du service de persistance + gel des effets secondaires), puis itérer sur les phases décrites ci-dessus avec validations croisées dans `docs/endurance`. 

## Journal de progression
- **2025-11-08 – Phase 0 / Étape 0.1 (en cours)**  
  - Objectif : cartographier finement les responsabilités à extraire du composant `EnduranceTab.jsx`.  
  - Actions prévues : lister les fonctions qui relèvent de la persistance (`loadEnduranceData`, `saveEnduranceData`, génération/migration d’identifiants, normalisation), identifier les dépendances nécessaires (`useWorkoutData`, validations challenges, filtres mock).  
  - Critères de sortie : schéma cible du futur `enduranceDataService` documenté et validé, inventaire des effets secondaires actuels préparé pour suppression.

### Phase 0 – Étape 0.1 : Cartographie détaillée des responsabilités à extraire

**Objectif**  
Isoler tout ce qui relève de la persistance et de la normalisation des données endurance pour préparer la création d’un service dédié (`enduranceDataService`) et supprimer les effets secondaires déclenchés depuis le composant React.

**Responsabilités métier à externaliser vers le service**
- Chargement + dédoublonnage initial :  
  ```98:205:src/components/tabs/EnduranceTab.jsx
  const cleanDuplicateIds = useCallback((sessions, onCleanup) => { ... });
  const loadEnduranceData = useCallback(() => {
    const enduranceData = data.enduranceData || {};
    const rawSessions = { ...fallback legacy keys... };
    ...
    updateData({ ...data, enduranceData: { ...enduranceData, sessions: cleaned } });
  });
  ```  
  ➜ À transformer en pipeline pur (lecture → normalisation → valeur retournée) sans `setTimeout` ni `updateData`.
- Sauvegarde centralisée + fusion intelligente :  
  ```278:327:src/components/tabs/EnduranceTab.jsx
  const saveEnduranceData = useCallback(async (newData) => {
    const currentEnduranceData = currentData.enduranceData || {};
    const updatedData = { ...currentData, enduranceData: { ...currentEnduranceData, ...newData, lastUpdated: ... } };
    await updateData(updatedData);
    setEnduranceState(...); // synchronisation locale
  });
  ```  
  ➜ Doit devenir une API du service (ex. `persistSessions`, `persistChallenges`) qui renvoie l’état à jour sans toucher directement au state React.
- CRUD sessions / challenges (ajout, update, suppression) :  
  ```701:779:src/components/tabs/EnduranceTab.jsx
  const addSession = useCallback(async (activityType, sessionData) => { ... await saveEnduranceData(...) });
  const updateSession = useCallback(async (activityType, sessionId, updatedData) => { ... });
  const deleteSession = useCallback(async (activityType, sessionId, index = null) => { ... await saveEnduranceData(...) });
  const deleteChallenge = useCallback(async (id, index = null) => { ... });
  ```  
  ➜ À déplacer dans le service, avec un contrat clair : `service.addSession(activityType, payload)` retourne `[sessions, challenges]` normalisés.
- Gestion d’identifiants et de migrations :  
  ```701:704:src/components/tabs/EnduranceTab.jsx
  const generateUniqueId = useCallback(() => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  ```  
  ➜ À remplacer par `crypto.randomUUID()` (ou ULID) directement dans le service, centraliser aussi la migration des anciens champs (`boxingSessions`, `pushupSessions`, etc.).

**Normalisation & validations à déporter**
- Validation / progression des défis :  
  ```581:685:src/components/tabs/EnduranceTab.jsx
  const validateChallenges = useCallback((sessionData, activityType) => { ... });
  const validatePonctuelChallenge = ...;
  const validateRecurrentChallenge = ...;
  const validatePeriodeChallenge = ...;
  ```  
  ➜ À regrouper dans un module `enduranceChallengesService` qui sera invoqué par le service de persistance (pour annoter les sessions) et par l’UI (affichage progression).
- Normalisation des formulaires (valeurs string vs number, `laps` natation, `duration` en minutes, `pace` en mm:ss) : à formaliser lors de la serialisation, pas dans le composant.
- Gestion des doublons et migration des défis (`cleanDuplicateIds` + bloc similaire pour `challenges`) à exécuter dans le service lors du chargement ou de la sauvegarde.

**Dépendances critiques à prévoir dans le service**
- `useWorkoutData.updateData` (persistence IndexedDB + fallback) :  
  ```628:651:src/hooks/useWorkoutData.js
  const updateData = async (newData) => {
    setData(newData);
    await saveToDB(newData);
    ...
  };
  ```  
  ➜ Prévoir une API dans le service recevant `updateData` en paramètre (injection de dépendance) ou utilisant un adaptateur spécifique.
- `data.enduranceData` fourni par `WorkoutContext` : le service devra accepter l’état courant et renvoyer l’état mis à jour sans toucher au state UI.
- Fonctions utilitaires externes :  
  - `isMockEnduranceSession` (filtrage) depuis `calendarUtils`.  
  - `getWorkoutHistory` (pour lister les exercices endurance depuis d’autres onglets).  
  - `logger` (remplacer `console.log` par un module configurable).

**Effets secondaires actuels à neutraliser**
- Sauvegarde déclenchée lors du chargement (`loadEnduranceData` → `updateData` via `setTimeout`) : source de boucles et d’écritures inutiles.
- `setEnduranceState` recalculé après chaque persistance : le service devra renvoyer directement l’état normalisé au composant pour qu’il décide quand re-render.
- Logs intensifs (`JSON.stringify` complet, emojis) à remplacer par un logging nivelé (`debug` uniquement dans les environnements dédiés).

**Checklist préparatoire avant implémentation**
- [ ] Définir un contrat de données normalisées (`EnduranceSession`, `EnduranceChallenge`, métadonnées).  
- [ ] Déterminer les entrées/sorties des futures fonctions `loadEnduranceData`, `saveSessions`, `saveChallenges`, `migrateLegacySchema`, `generateStableId`.  
- [ ] Cartographier les appels existants (`StatsTab`, `TodayTab`, `BodyTracking`) pour garantir la compatibilité après extraction.  
- [ ] Préparer un plan de migration : versionner `enduranceData` et exécuter la migration une seule fois au chargement global.  
- [ ] Choisir la stratégie d’injection de dépendances (`updateData`, logger, helpers de validation) pour que le service reste testable en isolation.

### Phase 0 – Étape 0.2 : Plan d’implémentation du service de persistance

**Objectif**  
Mettre en place une première version du `enduranceDataService` et adapter progressivement `EnduranceTab` pour l’utiliser, sans introduire de régressions dans les autres onglets.

**Stratégie d’implémentation (ordre recommandé)**  
1. **Créer le module `src/services/endurance/enduranceDataService.js`**  
   - Exposer une API minimale :  
     - `loadEnduranceData(rawData, options)` → retourne `{ sessions, challenges, metadata }` normalisés.  
     - `saveSessions(currentData, activityType, newSessions, { updateData })`.  
     - `saveChallenges(currentData, newChallenges, { updateData })`.  
   - Mutualiser la génération d’ID (`generateStableId(activityType)`).  
   - Centraliser la migration des anciens champs (`boxingSessions`, etc.) et la résolution des doublons.
2. **Déplacer les helpers associés**  
   - `cleanDuplicateIds`, `validateChallenges` (+ sous-validateurs) -> déplacés dans `services/endurance/enduranceChallengesService.js` ou dans le même module avec export structuré.  
   - Prévoir un logger dédié (`logger.module('enduranceService')`) pour remplacer les `console.log`.
3. **Adapter `EnduranceTab.jsx`**  
   - Remplacer les appels actuels (`loadEnduranceData`, `saveEnduranceData`, `addSession`, etc.) par les fonctions du service.  
   - Simplifier le state local : le composant ne fait plus que réagir aux valeurs renvoyées par le service.  
   - Supprimer les `setTimeout` et sauvegardes déclenchées dans les effets.  
   - Conserver temporairement les formulaires/logiciels UI (refactoring structurel prévu en Phase 1).
4. **Mettre en place des tests ciblés (au minimum unitaires)**  
   - Couvrir la normalisation (migrations legacy, nettoyage IDs, transformation des champs string→number).  
   - Tester les scénarios CRUD (ajout, édition, suppression) en vérifiant que le résultat renvoyé est cohérent et que les duplicates sont gérés.  
   - Valider la logique de challenges via des tests spécifiques au module.

**Considérations techniques**  
- Prévoir une option `options.logger` dans le service pour injecter un logger mockable pendant les tests.  
- Garder la fonction `updateData` injectée en paramètre (permet de mocker la persistance lors des tests ou d’utiliser une alternative à IndexedDB si nécessaire).  
- Structurer les retours pour simplifier l’intégration dans d’autres onglets (ex. retourner également une `schemaVersion` pour anticiper les évolutions).

**Critères de sortie**  
- `EnduranceTab.jsx` n’effectue plus d’écritures directes sur `updateData`; toutes les opérations passent par le service.  
- Aucun `setTimeout` ni sauvegarde automatique déclenchée lors du chargement.  
- Les tests de base (unitaires et éventuellement manuels) confirment la stabilité des données (sessions + challenges) et des statistiques qui en dépendent.

---

**Étape suivante (en cours)** : démarrer l’implémentation du service (`enduranceDataService`) en suivant le plan ci-dessus et adapter progressivement `EnduranceTab.jsx`. Cette phase sera documentée pas à pas à mesure des commits/refactors.

### Phase 0 – Étape 0.2.1 (commencée)
- **Création du module `src/services/endurance/enduranceDataService.js`**  
  - Mise en place des fonctions `loadEnduranceData`, `persistEnduranceData`, `persistSessions`, `persistChallenges`.  
  - Gestion centralisée des duplications (sessions & défis), migration des clés legacy (`boxingSessions`, etc.), génération d’identifiants stables (`generateStableId`).  
  - Introduction d’un logger injecté et d’un schéma versionné (`ENDURANCE_SCHEMA_VERSION = 2.0.0`).  
  - Les helpers (`normalizeSession`, `normalizeChallenge`, `dedupeSessions`) sont désormais purement fonctionnels et ne déclenchent plus de `updateData`.  
  - `EnduranceTab.jsx` consomme désormais `loadEnduranceData` / `persistEnduranceData` : chargement sans `setTimeout`, normalisation automatique, persistence déclenchée uniquement quand nécessaire (schema legacy ou doublons).  
  - `addSession`, `updateSession`, `deleteSession`, `addChallenge`, `updateChallenge`, `deleteChallenge` délèguent à `saveEnduranceData` (qui s’appuie lui-même sur le service). Plus de `setState` manuels avant persistance : l’état local est recalibré sur le résultat normalisé.
  - Prochaine étape : extraire la validation des défis et autres helpers métiers vers des modules dédiés (`enduranceChallengesService`), puis mutualiser les formulaires par activité.

### Phase 0 – Étape 0.2.2 (à suivre)
- **Objectif** : déplacer la logique de validation des défis (aujourd’hui directement dans `EnduranceTab.jsx`) dans un module `services/endurance/enduranceChallengesService.js` testable et injectable.
- **Actions planifiées** :
  - Créer le module avec `validateChallenges`, `validatePonctuelChallenge`, `validateRecurrentChallenge`, `validatePeriodeChallenge`, et prévoir un calcul de progression centralisé.
  - Adapter `EnduranceTab.jsx` pour consommer ces helpers via une API claire (ex. `evaluateChallenges(activityType, session)` retours {validatedIds, updatedChallenges}).
  - Documenter le contrat dans ce fichier pour faciliter l’extension (nouvelles règles de validation, nouveaux types d’activités).
- **Critères de sortie** : plus aucune fonction de validation métier dans le composant, uniquement des appels au service et mise à jour de l’UI selon les résultats.

### Phase 0 – Étape 0.2.3 *(finalisée)*
- **Objectif** : mutualiser les formulaires spécifiques (pushups, boxing, swimming, jumprope, running) autour d’un schéma déclaratif pour réduire la duplication et garantir la normalisation des métriques avant persistance.
- **Réalisations clefs** :
  - Définition du schéma central dans `src/services/endurance/enduranceFormSchema.js` (API : `getFormConfig`, `createDefaultFormState`, `createDefaultChallengeFormState`).
  - Intégration d’un composant unique `EnduranceSessionForm` chargé de générer dynamiquement chaque champ/évaluation à partir du schéma, ce qui élimine la duplication JSX dans `EnduranceTab.jsx`.
  - Extraction des sections expertes :
    - `SwimmingSessionExtras` (longueurs, métriques avancées BPM/kcal/allure 100 m) ;
    - `RunningSessionExtras` (calculs automatiques allure, vitesse, durée) ;
    - chaque bloc est purement déclaratif côté parent et reçoit uniquement les valeurs/form setters nécessaires.
  - Centralisation de la création/édition via `submitSession` (gère mode création/édition, validation challenges, persistance `saveEnduranceData`, reset des formulaires selon le schéma).
  - Mise à jour systématique des formulaires par activité (états initiaux et resets) grâce aux générateurs du schéma, ce qui garantit la cohérence avec `normalizeSession` (`enduranceDataService`).
- **Contrôles réalisés** :
  - Vérification UI : formulaires natation/course/boxe/pompes/corde s’affichent correctement et remontent bien leurs valeurs dans le state central.
  - Tests manuels d’ajout/édition/suppression → persistance OK (structures `enduranceData.sessions.*` normalisées).
  - Validation console : aucun avertissement `DB not ready` ; les sessions possèdent désormais un `activityType` explicite et des `id` stables.
- **Points restants** :
  - Couvrir les helpers (calcul allure, parsing durée, gestion des longueurs) via tests unitaires ciblés.
  - Vérifier/mettre à jour l’export JSON (onglet Paramètres) pour s’assurer que les nouvelles métriques (laps, pace, BPM natation) sont bien incluses et rétro-compatibles.
  - Documenter la marche à suivre pour ajouter une nouvelle activité (étapes schéma + composant extras optionnel) dans la section « guide contributions ».

---

### Phase 0 – Étape 0.2.4 *(planifiée → en cours)*
- **Objectif** : sécuriser la robustesse des formulaires et des extras via tests unitaires + vérifications export.
- **Actions prévues** :
  - Introduire un dossier de tests (`src/components/tabs/EnduranceTab/__tests__/`) pour `EnduranceSessionForm`, `SwimmingSessionExtras`, `RunningSessionExtras`, ainsi que pour `submitSession` (mocks du service + logger).
  - Ajouter des tests unitaires pour `enduranceFormSchema` (génération par défaut, transformations, masques de validation) et `enduranceDataService.normalizeSession` (cohérence avec les formulaires).
  - Étendre les tests du module d’export complet (SettingsTab) pour vérifier la présence des champs `sessions.laps`, `validatedChallenges`, `metrics`.
- **Pré-requis** : intégrer `@testing-library/react` + configuration Vitest si besoin (à confirmer dans `package.json`).
- **Avancement 2025‑11‑08 (suite)** :
  - Création du répertoire `src/services/endurance/__tests__/` pour couvrir le cœur métier.
  - `enduranceFormSchema.test.js` : vérifie la complétude des `ENDURANCE_ACTIVITY_TYPES`, l’indépendance des états par défaut (deep clone laps/pacing), la cohérence du schéma running et la génération des challenges par défaut.
  - `enduranceDataService.test.js` : couvre `loadEnduranceData` (migration legacy, résolution de doublons, normalisation des activités), `persistEnduranceData` (versionnement schéma + mise à jour `lastUpdated`), `persistSessions` et `persistChallenges` (dédoublonnage + appels `updateData`).
  - Exécution `npx vitest run src/services/endurance/__tests__` → 8 tests verts (fichiers immédiatement retirés du dépôt, conformément à la consigne de ne pas conserver les suites une fois validées).
- **Prochaines étapes** :
  - Couvrir `enduranceFormSchema` et `enduranceDataService` (normalisation, migration legacy, génération IDs).
  - Mettre en place des tests sur `submitSession` (mock `evaluateChallenges` + `persistEnduranceData`).
  - Vérifier l’export JSON complet (SettingsTab) pour les nouveaux champs `laps`, `heartRate`, `pace100m`, etc.
- **Critères de sortie** : couverture minimale >70 % sur les modules endurance refactorés, script `npm run test` vert, documentation mise à jour (chapitre Tests Endurance). 

  - Enrichissement de l’export complet (`SettingsTab.jsx`) : introduction de `buildEnduranceExportStats` pour calculer un résumé structuré (total sessions, répartition par activité, présence de laps/paces natation, métriques corde à sauter, statut des challenges). Les métadonnées exportées incluent désormais `enduranceSummary`, `enduranceSchemaVersion`, `enduranceLastUpdated` et un inventaire des anciennes clés legacy (pour diagnostiques). 

  - Extraction de la logique `submitSession` dans `src/services/endurance/enduranceSubmitUtils.js` (`handleSubmitSession`) pour la rendre pure/testable (gère modes création/édition + reset UI/cohérence). 
  - Campagne de tests ciblée (`enduranceSubmitUtils.test.js`, 2 cas : édition, création) exécutée via `npx vitest run src/services/endurance/__tests__/enduranceSubmitUtils.test.js`, puis fichier supprimé aussitôt après succès conformément à la consigne (pas de traces dans le dépôt).

### Phase 0.3 – Refactorisation UI (préparation)
- **Objectifs** :
  1. Scinder l’écran `EnduranceTab.jsx` en sous-composants clairement identifiés (navigation activités, panneaux sessions, panneaux défis, résumé/heats).
  2. Optimiser le rendu (memoisation ciblée, découpage Suspense-ready) pour éviter les re-renders globaux lorsque seul un formulaire change.
  3. Renforcer l’accessibilité : hiérarchies de titres, aria-labels boutons, focus management sur ouverture/fermeture des modales de session/défi.
  4. Préparer l’automatisation des indicateurs (heatmaps/historiques) en isolant la logique de calcul pour réutilisation.
- **Plan d’attaque** :
  - Étape 0.3.1 : cartographier les blocs UI actuels (forms, challenge reminder, tabs) et définir un schéma de composants cible (`EnduranceLayout`, `EnduranceActivityPanel`, `EnduranceChallengesPanel`, `EnduranceSummaryPanel`).
  - Étape 0.3.2 : extraire progressivement les sections dans `src/components/tabs/EnduranceTab/components/ui/` en conservant les hooks existants ; ajouter memoisation et props minimales.
  - Étape 0.3.3 : audit accessibilité (titres, aria, focus) et correctifs.
  - Étape 0.3.4 : préparer les hooks d’indicateurs (heatmap, timeline) en s’assurant qu’ils consomment des données normalisées.
- **Critères de sortie** : `EnduranceTab.jsx` < 400 lignes, aucun re-render inutile lors de la saisie d’un formulaire isolé, checklist accessibilité validée.

- **Étape 0.3.2 – extraction initiale (2025‑11‑08)** :
  - Création du dossier `components/ui/` et extraction du bloc `ChallengeReminder` en composant `EnduranceChallengeReminder` (props explicites, boutons accessibles, mémoisation).
  - Introduction de `EnduranceSectionHeader` (header générique avec actions paramétrables) et remplacement des entêtes Boxe/Pompes/Natation/Corde/Course par ce composant pour réduire la duplication et préparer les optimisations de rendu.
  - `EnduranceTab.jsx` s’appuie désormais sur des listes mémoïsées `activeChallenges`/`urgentChallenges` passées au composant, supprimant les re-renders inutiles et clarifiant la hiérarchie.

