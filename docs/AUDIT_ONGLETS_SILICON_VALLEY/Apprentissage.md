# Audit — Apprentissage

Périmètre demandé : fichiers **non-.md**, **fonctionnels**, **liés à Apprentissage**.  
Tests exclus.

## Portée exacte (fichiers analysés)
- Onglet & sous‑onglets :
  - `src/components/tabs/ApprentissageTab.jsx`
  - `src/components/apprentissage/MatièresView.jsx`
  - `src/components/apprentissage/SessionsView.jsx`
  - `src/components/apprentissage/TrophéesView.jsx`
- Composants UI locaux :
  - `src/components/apprentissage/TimerComponent.jsx`
  - `src/components/apprentissage/SubjectSelector.jsx`
  - `src/components/apprentissage/WeeklyPlanner.jsx`
  - `src/components/apprentissage/SessionsHistory.jsx`
  - `src/components/apprentissage/SessionItem.jsx`
  - `src/components/apprentissage/ManualEntryForm.jsx`
  - `src/components/apprentissage/BreakPopup.jsx`
  - `src/components/apprentissage/EndSessionPopup.jsx`
- Moteur & infra :
  - `src/hooks/useApprentissageEngine.js`
  - `src/hooks/useApprentissageWorker.js`
  - `src/utils/apprentissageConstants.js`
  - `src/utils/apprentissageCache.js`
  - `src/utils/apprentissageValidation.js`
  - `src/utils/apprentissageSanitization.js`
  - `src/utils/apprentissageErrorHandler.js`
  - `src/utils/apprentissageIndexedDB.js`
  - `src/utils/apprentissageCalculations.js`
  - `src/utils/apprentissageAudio.js`

## Note globale
**86/100**

Barème cible “Silicon Valley” :
- Performance & optimisation : 35
- Architecture & qualité du code : 25
- Frontend/UX/Accessibilité : 20
- Robustesse & données : 10
- Scalabilité & tests : 10

---

## 1) Onglet Apprentissage (navigation + orchestration)
### Fichier analysé
- `src/components/tabs/ApprentissageTab.jsx`

### Points forts
- Lazy loading des sous‑vues (split initial).
- ErrorBoundary par sous‑onglet.
- Persistance du sous‑onglet actif.

### Points perdus et solutions
- **(−4) Navigation non ARIA**
  - **Pourquoi** : pas de `role="tablist"` / `role="tab"` / `aria-selected`.
  - **Solution** : tablist + roving tabindex + `aria-controls`.

- **(−3) `window.dispatchEvent('tab-change')`**
  - **Pourquoi** : couplage global DOM.
  - **Solution** : contexte d’UI ou event bus interne.

- **(−2) `useTranslation` inutilisé**
  - **Solution** : enlever l’import ou traduire les labels.

---

## 2) Sous‑onglet “Matières”
### Fichier analysé
- `src/components/apprentissage/MatièresView.jsx`

### Points forts
- Zod + sanitation + cache LRU déjà en place.
- Undo/redo intégré pour actions destructives.

### Points perdus et solutions
- **(−6) Double `useEffect` pour les raccourcis**
  - **Pourquoi** : le listener `keydown` est enregistré deux fois.
  - **Solution** : un seul effet + `useKeyboardShortcuts`.

- **(−4) Ajout de fichiers “TODO”**
  - **Pourquoi** : `handleAdditionalFiles` ne fait qu’un `console.log`.
  - **Solution** : implémenter upload + validation + persist.

- **(−3) Recherche/filtre coûteux**
  - **Pourquoi** : `getSubjectProgression` est appelé N×.
  - **Solution** : pré‑indexer progression par matière.

- **(−2) Modal suppression sans focus trap**
  - **Solution** : focus trap + ESC + retour focus.

---

## 3) Sous‑onglet “Sessions”
### Fichiers analysés
- `src/components/apprentissage/SessionsView.jsx`
- `src/components/apprentissage/TimerComponent.jsx`
- `src/components/apprentissage/SubjectSelector.jsx`
- `src/components/apprentissage/WeeklyPlanner.jsx`
- `src/components/apprentissage/SessionsHistory.jsx`
- `src/components/apprentissage/SessionItem.jsx`
- `src/components/apprentissage/ManualEntryForm.jsx`
- `src/components/apprentissage/BreakPopup.jsx`
- `src/components/apprentissage/EndSessionPopup.jsx`

### Points forts
- Virtualisation disponible pour l’historique.
- Timer riche + contrôles ARIA de base.
- Planificateur hebdo clair.

### Points perdus et solutions
- **(−6) `SessionsView` trop monolithique**
  - **Solution** : extraire hooks `useTimer`, `usePlanner`, `useHistory`.

- **(−4) Timer `setInterval` sans pause sur onglet caché**
  - **Solution** : Page Visibility API + correction de dérive.

- **(−4) Chargement IndexedDB dupliqué**
  - **Pourquoi** : `SessionsView` recharge ce que le moteur gère déjà.
  - **Solution** : centraliser dans `useApprentissageEngine`.

- **(−3) Popups sans accessibilité**
  - **Solution** : focus trap + `aria-modal` + fermeture ESC.

- **(−2) `ManualEntryForm` dupliqué**
  - **Pourquoi** : composant séparé non utilisé.
  - **Solution** : réutiliser le composant ou supprimer.

- **(−2) `WeeklyPlanner` dépend de `window.innerWidth`**
  - **Solution** : `useMediaQuery` pour reactivité SSR-safe.

---

## 4) Sous‑onglet “Trophées”
### Fichier analysé
- `src/components/apprentissage/TrophéesView.jsx`

### Points forts
- Usage de `useMemo` pour calculs lourds.
- UI riche et motivante.

### Points perdus et solutions
- **(−3) Styles d’animations inline**
  - **Solution** : déplacer dans CSS global ou module CSS.

- **(−3) Calculs de comparaison peu optimisés**
  - **Solution** : pré‑indexer progression par matière.

---

## 5) Moteur Apprentissage
### Fichiers analysés
- `src/hooks/useApprentissageEngine.js`
- `src/hooks/useApprentissageWorker.js`
- `src/utils/apprentissageIndexedDB.js`
- `src/utils/apprentissageCache.js`
- `src/utils/apprentissageValidation.js`
- `src/utils/apprentissageSanitization.js`
- `src/utils/apprentissageCalculations.js`
- `src/utils/apprentissageAudio.js`
- `src/utils/apprentissageErrorHandler.js`

### Points forts
- IndexedDB + fallback localStorage + retry.
- Cache LRU, worker, validation Zod, sanitation DOMPurify.

### Points perdus et solutions
- **(−8) `useApprentissageEngine` monolithique**
  - **Solution** : découper en `useSubjectsStore`, `useProgressionStore`, `useSessionsStore`, `useTimerStore`.

- **(−6) `userId = 'main'`**
  - **Solution** : scoper par `currentUser.id`.

- **(−5) `saveSubjectsToIndexedDB` fait `store.clear()` deux fois**
  - **Solution** : stocker la request dans une variable, un seul clear.

- **(−4) Worker path absolu `/apprentissageWorker.js`**
  - **Solution** : `new Worker(new URL(..., import.meta.url))`.

- **(−3) Logs console en prod**
  - **Solution** : logger conditionnel env.

---

## Actions prioritaires pour 100/100
1. **Refactor `useApprentissageEngine`** en stores modulaires.
2. **Centraliser la persistance** (ne pas dupliquer dans `SessionsView`).
3. **Focus‑trap & accessibilité** sur tous les popups/modals.
4. **Optimiser les listes** (memo + virtualisation cohérente).
5. **Corriger `saveSubjectsToIndexedDB`** (double clear).

---

## Statut
Onglet Apprentissage terminé.  
Indique le prochain périmètre à auditer.
