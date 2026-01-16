# Audit — Sidebar

Périmètre demandé : fichiers **non-.md**, **fonctionnels**, **liés à la Sidebar**.  
Tests exclus.

## Portée exacte (fichiers analysés)
- Container/UI :
  - `src/components/sidebar/SidebarPremium.jsx`
  - `src/components/sidebar/ModuleRenderer.jsx`
  - `src/components/sidebar/SidebarSectionErrorBoundary.jsx`
  - `src/components/sidebar/ErrorNotificationSystem.jsx`
  - `src/components/sidebar/SyncStatusIndicator.jsx`
  - `src/components/sidebar/SyncConflictResolver.jsx`
- Sections principales :
  - `src/components/sidebar/AujourdhuiSection.jsx`
  - `src/components/sidebar/QuestesJourSection.jsx`
  - `src/components/sidebar/ActivitePhysiqueSection.jsx`
  - `src/components/sidebar/ActionsRapidesSection.jsx`
  - `src/components/sidebar/ProgressionGlobaleSection.jsx`
  - `src/components/sidebar/LectureSection.jsx`
  - `src/components/sidebar/FinancesSection.jsx`
  - `src/components/sidebar/NutritionSection.jsx`
  - `src/components/sidebar/ProfileCard3D.jsx`
  - `src/components/sidebar/ProfileCardSettings.jsx`
  - `src/components/sidebar/ProfileCardRotationSettings.jsx`
- Hooks & services :
  - `src/hooks/useSidebar.js`
  - `src/hooks/useSidebarData.js`
  - `src/hooks/useModuleAlternation.js`
  - `src/services/sidebar/sidebarStorage.js`
  - `src/services/sidebar/moduleAlternationService.js`
  - `src/services/sidebar/*` (orchestration/perf/sync)

## Note globale
**83/100**

Barème cible “Silicon Valley” :
- Performance & optimisation : 35
- Architecture & qualité du code : 25
- Frontend/UX/Accessibilité : 20
- Robustesse & données : 10
- Scalabilité & tests : 10

---

## 1) `SidebarPremium.jsx` (container principal)
### Points forts
- Structuration claire : entête (clock + profil) + zone modules.
- Lazy loading des sections via `ModuleRenderer`.
- Mesure de performance (`measureSync`) et usage de `requestAnimationFrame`.

### Points perdus et solutions
- **(−6) Dépendance directe au DOM pour layout**
  - **Pourquoi** : `querySelector('header'/'nav')` + MutationObserver global.
  - **Solution** : remonter la hauteur via context/layout provider ou CSS `position: sticky` + `top` variables.

- **(−4) MutationObserver sur `document.body`**
  - **Pourquoi** : peut déclencher trop souvent, coûteux sur pages riches.
  - **Solution** : observer uniquement les nodes nécessaires (header/nav) ou exposer une API `layoutOffsets`.

- **(−3) Styles inline pour `top/height`**
  - **Pourquoi** : reflow fréquent.
  - **Solution** : variables CSS (`--sidebar-top`) mises à jour via style root.

- **(−3) `sidebarRef` + `observerRef` non utilisés**
  - **Pourquoi** : `observerRef` est déclaré mais jamais utilisé.
  - **Solution** : retirer ou utiliser pour éviter confusion.

- **(−3) Gestion mobile sans “focus trap”**
  - **Pourquoi** : overlay ferme la sidebar, mais le focus clavier n’est pas confiné.
  - **Solution** : focus trap pour accessibilité mobile.

---

## 2) `useSidebar.js` (state/clock/sections)
### Points forts
- Persistance des sections via IndexedDB.
- API complète (toggle/open/close).

### Points perdus et solutions
- **(−6) Décalage entre defaults en mémoire et defaults stockés**
  - **Pourquoi** : les clés initiales (`expandedSections`) ne correspondent pas à `DEFAULT_PREFERENCES`.
  - **Impact** : certaines sections peuvent revenir fermées après chargement.
  - **Solution** : harmoniser `DEFAULT_PREFERENCES` avec le state initial (mêmes clés + mêmes valeurs).

- **(−4) Horloge avec interval 1s sans pause**
  - **Pourquoi** : toujours actif, même onglets cachés.
  - **Solution** : pause via Page Visibility API.

- **(−3) Double formatteur de date**
  - **Pourquoi** : `getFormattedDate` et `getFormattedDateOld` redondants.
  - **Solution** : supprimer le legacy.

---

## 3) `useSidebarData.js` (agrégation data)
### Points forts
- Agrégation complète multi-domaines.
- Gestion d’erreurs robuste (try/catch).
- Debounce sur refresh events.

### Points perdus et solutions
- **(−8) Hook monolithique**
  - **Pourquoi** : trop d’effets, logique multi-sources dans un seul hook.
  - **Solution** : découper en hooks domaine (`useSidebarSport`, `useSidebarFinance`, etc.).

- **(−6) Date `today` figée**
  - **Pourquoi** : `useMemo(() => new Date().toISOString().slice(0, 10), [])` ne se met jamais à jour.
  - **Impact** : si l’app reste ouverte après minuit, la sidebar reste sur la veille.
  - **Solution** : recalculer sur changement de jour (timer quotidien).

- **(−5) Chargements Garmin/Nutrition sans annulation**
  - **Solution** : `AbortController` + ignore si unmount.

- **(−4) Logs console en production**
  - **Solution** : logger conditionnel (dev only).

- **(−3) Fusion Garmin “enhanced” non contrôlée**
  - **Pourquoi** : `garminEnhancedDataService.getEnhancedData()` appelé à chaque refresh.
  - **Solution** : cache + invalidation.

---

## 4) `ModuleRenderer.jsx` (alternance modules)
### Points forts
- Lazy loading + ErrorBoundary par module.
- Support d’alternance “legacy / historical”.

### Points perdus et solutions
- **(−5) Switch props très long**
  - **Pourquoi** : logique props hardcodée par module.
  - **Solution** : mapping config-driven (table de mapping) + type-safe.

- **(−4) `validation` warning uniquement en dev**
  - **Pourquoi** : pas d’action réelle si pattern invalide.
  - **Solution** : fallback automatique ou correction.

- **(−3) `ModuleErrorFallback` renvoie erreur statique**
  - **Solution** : proposer action “recharger module”.

---

## 5) `moduleAlternationService.js`
### Points forts
- Alternance claire, positions définies.
- Validation du pattern intégrée.

### Points perdus et solutions
- **(−6) Positions en dur**
  - **Pourquoi** : impossible de personnaliser l’ordre par utilisateur.
  - **Solution** : persistance du pattern par user.

- **(−4) Alternance rigide “impair/paire”**
  - **Solution** : rendre l’alternance configurable (ex: ratio 2‑1).

---

## 6) `sidebarStorage.js`
### Points forts
- IndexedDB robuste, gestion d’erreurs complète.

### Points perdus et solutions
- **(−6) Defaults obsolètes**
  - **Pourquoi** : `DEFAULT_PREFERENCES` ne contient pas toutes les nouvelles sections.
  - **Solution** : synchroniser toutes les clés.

- **(−3) DB version = null**
  - **Pourquoi** : versioning non explicite, migrations plus difficiles.
  - **Solution** : version explicite + migrations.

---

## 7) Sections UI principales
### `AujourdhuiSection.jsx`
**Points forts** : accessibilité, navigation contextuelle, usage clair des cartes.  

**Points perdus et solutions**
- **(−3) Pas de gestion d’état vide robuste**
  - **Pourquoi** : suppose toujours `data` valide.
  - **Solution** : fallback si `data` manquant (skeleton ou “aucune donnée”).

- **(−2) Navigation “sport” via `navigation.toSport({ tab: 'today' })`**
  - **Pourquoi** : `tab` devrait matcher un id existant (risque incohérence).
  - **Solution** : uniformiser les ids (`today`, `history`, etc.).

---

### `QuestesJourSection.jsx`
**Points forts** : accessibilité soignée, tooltips, badges, navigation claire.  

**Points perdus et solutions**
- **(−3) Listes non virtualisées**
  - **Pourquoi** : si nombreuses quêtes, rendu coûteux.
  - **Solution** : virtual list pour grandes collections.

- **(−2) Gestion de focus sans roving tabindex**
  - **Solution** : utiliser un pattern roving pour navigation clavier.

---

### `ActivitePhysiqueSection.jsx`
**Points forts** : cartes cliquables, accessibilité, callbacks mémoïsés.  

**Points perdus et solutions**
- **(−4) Navigation vers Garmin avec ids non standardisés**
  - **Pourquoi** : `navigation.toGarmin({ tab: 'heartRate' })` alors que l’onglet Garmin utilise `metrics`, `charts`, etc.
  - **Solution** : centraliser les ids d’onglets (constantes).

- **(−3) Pas de gestion “no data”**
  - **Solution** : message explicite si `hasGarminData === false`.

---

### `ActionsRapidesSection.jsx`, `ProgressionGlobaleSection.jsx`, `LectureSection.jsx`, `FinancesSection.jsx`, `NutritionSection.jsx`
**Points forts** : structure homogène, navigation contextuelle, design cohérent.  

**Points perdus et solutions**
- **(−4) Logique de rendu répétée**
  - **Pourquoi** : patterns UI similaires non factorisés.
  - **Solution** : composants génériques (Card, MetricRow, ActionButton).

- **(−3) Accessibilité variable**
  - **Solution** : uniformiser `role`, `aria-label` et navigation clavier.

---

## 8) Profil & Paramètres de carte
### `ProfileCard3D.jsx`
**Points forts** : animations riches, transitions doubles‑layers fluides.  

**Points perdus et solutions**
- **(−6) Composant très lourd**
  - **Pourquoi** : beaucoup d’état local + animation logic inline.
  - **Solution** : extraire moteur d’animation dans un hook dédié.

- **(−4) Effets visuels coûteux en continu**
  - **Solution** : désactiver animations quand l’onglet est inactif (visibility API).

---

### `ProfileCardSettings.jsx`
**Points forts** : validations fichiers claires, feedback utilisateur.  

**Points perdus et solutions**
- **(−4) `confirm()` bloquant**
  - **Solution** : modal confirm non bloquante.

- **(−4) Pas de focus trap / ESC**
  - **Solution** : focus trap + `Esc` pour fermer.

- **(−3) Upload et erreurs non typées**
  - **Solution** : schema validation + messages contextualisés.

---

### `ProfileCardRotationSettings.jsx`
**Points forts** : UI claire, settings persistants, contrôles complets.  

**Points perdus et solutions**
- **(−3) Validation des bornes absente**
  - **Solution** : clamp sur intervalle autorisé + feedback.

- **(−2) Pas de debounce sur sliders**
  - **Solution** : `useDebouncedCallback`.

---

## 9) Erreurs & synchronisation
### `SidebarSectionErrorBoundary.jsx`
**Points forts** : error boundary simple et efficace.  

**Points perdus et solutions**
- **(−3) Pas de bouton “retry”**
  - **Solution** : proposer une action de re‑rendu.

---

### `ErrorNotificationSystem.jsx`
**Points forts** : notifications riches, actions, auto‑dismiss.  

**Points perdus et solutions**
- **(−5) Utilisation de `<style jsx>`**
  - **Pourquoi** : pas standard hors Next.js.
  - **Solution** : déplacer le CSS dans un fichier global.

- **(−4) Pas de regroupement/anti‑spam**
  - **Solution** : déduplication par type + cooldown.

---

### `SyncStatusIndicator.jsx`
**Points forts** : état lisible, composant simple.  

**Points perdus et solutions**
- **(−6) `DetailedSyncStatus` référence `useSyncState` non importé**
  - **Impact** : crash si ce composant est rendu.
  - **Solution** : importer `useSyncState` ou corriger en `useSyncStatus`.

---

### `SyncConflictResolver.jsx`
**Points forts** : actions de résolution claires.  

**Points perdus et solutions**
- **(−4) Clickable sans clavier**
  - **Solution** : `role="button"`, `tabIndex`, handlers `Enter/Space`.

---

## 10) Services sidebar (autres)
### Points forts
- Architecture orientée services (`performanceOptimizationManager`, `lazyLoadingManager`, etc.).

### Points perdus et solutions
- **(−4) Services multiples non orchestrés**
  - **Pourquoi** : plusieurs services existent mais pas clairement “branchés” dans les composants.
  - **Solution** : centraliser dans un `SidebarServiceOrchestrator` avec logs.

---

## Actions prioritaires pour 100/100
1. **Harmoniser les defaults** (`useSidebar` + `sidebarStorage`).
2. **Découper `useSidebarData`** en hooks de domaine.
3. **Normaliser la navigation** avec ids constants.
4. **Focus trap + accessibilité** complète (sidebar mobile + conflits).
5. **Stabiliser layout** sans MutationObserver global.

---

## Statut
Sidebar terminée.  
Indique le prochain périmètre à auditer.
