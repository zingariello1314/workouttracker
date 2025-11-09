## Conception : Forçage de synchronisation multi-plage

### Objectifs
- **Donner le contrôle des dates** lors d’une resynchronisation forcée (sélecteur calendrier jour ou plage).
- **Proposer un raccourci “Forcer la veille”** pour le cas d’usage quotidien (reprendre les données nocturnes complètes).
- **Rendre le système intelligent** : si l’utilisateur revient après X heures / jours, détecter automatiquement les dates à rafraîchir.
- **Garantir la cohérence** entre front, backend, cache et export JSON.

---

### Fonctionnement cible

1. **Component UI Garmin Sync**
   - Bouton “Synchroniser” (comportement actuel).
   - Nouveau menu déroulant “Forcer…” avec trois options :
     - `Aujourd’hui` (équivalent au bouton “forcer” actuel).
     - `La veille` (auto-calcul).
     - `Plage personnalisée…` → ouvre un modal avec double sélecteur de dates (start/end).
   - Le modal expose :
     - `Date de début` (picker calendrier).
     - `Date de fin`.
     - `Inclure la donnée du jour en cours` (case à cocher, décochée par défaut).
     - Explication contextuelle (ex : “Cette action vide le cache server pour la période et relance tous les appels Garmin. Utilise-la si tu n’as pas synchronisé depuis plusieurs jours.”).

2. **Flux côté front**
   - Le layer de synchronisation reçoit `mode` + `options`.
   - Transforme en paramètres query : `forceRefresh=true`, `start=…`, `end=…`, `lastSyncTimestamp` optionnel.
   - Stocke le “template” des dernières sélections pour proposer une suggestion au prochain passage (ex : si l’utilisateur force régulièrement un week-end complet, préremplir).

3. **Backend**
   - Ajout d’une fonction utilitaire `resolveForceRange(mode, options)` :
     - `mode='today'` → `start=end=now`.
     - `mode='yesterday'` → `start=end=hier`.
     - `mode='range'` → valider dateStart/dateEnd (max 14 jours d’un coup).
     - `mode='auto'` → nouvelle option : si `lastSync` > X heures, reconstituer `[lastSyncDate+1, today]`.
   - Ajout d’un header / log `X-Garmin-Force-Range` pour tracer les décisions dans les logs.
   - Conservation du TTL cache actuel, mais **invalidation granulaire** : le serveur vide les fichiers `daily_metrics_<date>_*` ciblés avant d’appeler Python.

4. **Python / fetch_garmin_data.py**
   - Paramètres `start`, `end`, `forceRefresh`.
   - Si `forceRefresh` et plage > 1 jour, la boucle `process_day` continue (déjà supportée).
   - Ajout d’un `--auto` optionnel (non obligatoire) si on veut laisser le script décider (à discuter).

5. **Index DB / Export JSON**
   - Ajouter un champ `lastForcedRange` dans l’index (format `YYYY-MM-DD:YYYY-MM-DD`).
   - Lors de l’export JSON (paramètres → module d’export), inclure `forcedSyncRanges: [{ from, to, triggeredAt, mode }]`.
   - Permettra de tracer quelles périodes ont été recalculées (audit).

---

### UX détaillée

| Action | UX | Paramètres envoyés | Effet |
| --- | --- | --- | --- |
| Synchroniser | Bouton principal | `forceRefresh=false` | Utilise cache, juste update “au fil de l’eau”. |
| Forcer → Aujourd’hui | Option menu | `forceRefresh=true`, `start=today`, `end=today` | Recalcule la journée courante (utile si un entraînement vient d’être ajouté). |
| Forcer → La veille | Option menu | `forceRefresh=true`, `start=yesterday`, `end=yesterday` | Cas d’usage matin = récupérer sommeil/calories finales. |
| Forcer → Plage personnalisée | Modal | `forceRefresh=true`, `start=dateStart`, `end=dateEnd` | Permet de récupérer plusieurs jours d’un coup (limiter à 7 ou 14). |
| Forcer automatiquement | Toggle (préférence utilisateur) | `mode=auto`, `thresholdHours` | Si l’utilisateur revient 48h plus tard, le front envoie `start=lastSyncDate+1`, `end=today`. |

---

### Validations & sécurité

1. **Front**
   - Vérifier que `start <= end`.
   - Interdire `end` dans le futur (sauf case “inclure aujourd’hui”).
   - Limiter la plage (ex : max 30 jours) pour éviter un DoS sur l’API Garmin.
   - Message “Cette action vide et recalculera X jours. Confirmer ?”.

2. **Backend**
   - Double validation.
   - Logging clair :
     ```text
     [FORCE SYNC] Mode: range, Start: 2025-10-30, End: 2025-11-02, TriggeredBy: front-user
     ```
   - Contrôle du taux de requêtes : si >5 jours, utiliser un worker (already supported par la parallélisation max 5).

3. **Python**
   - Le script supporte déjà des plages, mais ajouter :
     - Log `[PYTHON] Force sync range: {start}→{end}`.
     - Si `forceRefresh=true`, purge du cache `.cache/daily_metrics_*` pour les dates ciblées avant de commencer.

---

### Notes performance
- **Front** : la sélection de date doit être lazy (import du date-picker au besoin).
- **Backend** : limiter la plage permet de garder la parallélisation 5 threads sans timeouts.
- **Python** : déjà optimisé (cache, parallélisation par jour). S’assurer que `forceRefresh` ne multiplie pas les requêtes pour rien (ex : si on repasse deux fois, s’appuyer sur `lastSyncTimestamp` pour les activités).

---

### Export & Indexation

- **Index DB** :
  ```json
  {
    "lastSync": "2025-11-09T02:29:35Z",
    "lastForce": {
      "mode": "range",
      "from": "2025-10-27",
      "to": "2025-11-09",
      "triggeredAt": "2025-11-09T02:29:35Z"
    },
    "forcedRangesHistory": [
      {
        "mode": "yesterday",
        "from": "2025-11-08",
        "to": "2025-11-08",
        "triggeredAt": "2025-11-09T07:32:10Z"
      }
    ]
  }
  ```
- **Export JSON** (module paramètres) : inclure `forcedRangesHistory` + `autoForcePolicy` (si l’utilisateur active l’auto).
- **Garmin tab analytics** : dans le tableau de bord, possibilité de visualiser quelles dates ont été recalculées (badge “refresh” à côté des cards journalières).

---

### Plan d’intégration

1. **Front**
   - Implémenter composant `ForceSyncMenu` → design + modal.
   - Brancher le state sur le contexte Garmin existant (actions `forceSync`).
   - Ajouter tests unitaires (range validation, mapping params).

2. **Backend (Node / Express)**
   - Étendre route `/api/garmin/sync` : extraire `mode`, `range`.
   - Valider / normaliser via `resolveForceRange`.
   - Avant d’appeler python, supprimer les fichiers de cache sur la plage.
   - Log + stats.

3. **Python**
   - Optionnel : ajouter un log `Force: yes/no`.
   - Vérifier purge du cache (depuis Node, post-purge on repasse).

4. **Index/Export**
   - Mettre à jour l’indexation (fichier DB).
   - Adapter les exports (`settings/exports/garminExport.js` ou équivalent).

5. **Documentation & UX**
   - Ajouter tuto dans l’onglet (info-bulle : “Forcer = recalcul complet / à réserver aux cas de retard de synchro”).

6. **Déploiement**
   - Front + Backend en tandem (feature flag possible).
   - Purge du cache existant pour éviter l’ancien comportement.
   - Monitoring logs la première semaine (nombre de forcings, latence).

---

## Journal d’avancement

### Étape 1 – Conception UX détaillée du composant `ForceSyncMenu`

- **Objectif**  
  Garantir une expérience fluide, explicite et légère permettant de sélectionner une plage (ou un preset) sans alourdir le bundle principal.

- **Décisions clés**
  1. **Chargement différé du date-picker**  
     - Utiliser `React.lazy` + `Suspense` pour ne charger le module calendrier qu’à l’ouverture du modal.
     - Choix motivé par la taille de bibliothèques de date (≈30–50 kB) et la faible fréquence d’utilisation de la fonction “forcer”.
  2. **Structure du menu**  
     - Bouton principal “Forcer” → `Menu` (`today`, `yesterday`, `range`, `auto` si activé).
     - Sélection “range” ouvre `ForceRangeDialog`.
     - Sélection “auto” ouvre une pop-in d’explication + toggle de confirmation (évite les activations involontaires).
  3. **Accessibilité / clavier**  
     - Menu navigable tab/arrow.
     - Modal accessible (focus trap, aria-labelledby).
  4. **Préservation de l’historique**  
     - Stocker la dernière plage forcée dans `sessionStorage` (clé `garmin:forceRange:last`), validée côté contexte avant envoi.
     - Permet de reproposer la même sélection (gain de confort sans toucher à l’index DB).
  5. **Messages utilisateurs**  
     - Ajouter un panneau récapitulatif “Vous êtes sur le point de recalculer X jours → Y requêtes API approximatives” (estimé via `diffDays` × endpoints).
     - Indiquer clairement que l’opération invalide le cache serveur pour ces dates.

- **Performance estimée**  
  - Sur la plupart des sessions, le bundle principal reste inchangé (<1 kB delta).
  - Les imports conditionnels représentent ~40 kB additionnels uniquement lorsque l’utilisateur utilise la fonctionnalité.

- **Interfaces & props**
  ```ts
  type ForceSyncMode = 'today' | 'yesterday' | 'range' | 'auto';

  interface ForceSyncRequest {
    mode: ForceSyncMode;
    start?: string;   // ISO 'YYYY-MM-DD'
    end?: string;     // ISO 'YYYY-MM-DD'
    includeToday?: boolean;
  }
  ```
  - `ForceSyncMenu` reçoit :
    - `onSync(request: ForceSyncRequest): void`
    - `lastForcedRange?: { from: string; to: string; triggeredAt: string }`
    - `autoForceEnabled: boolean`
  - Le composant ne gère pas lui-même l’appel réseau ; il délègue au contexte pour rester testable.

- **Validation**  
  - Tests unitaires prévus :
    - `mapPresetToRange('yesterday')` → start=end=J-1.
    - `validateRange({start, end})` rejette `start > end`, plage > 30 jours.
    - Rendu du menu → snapshot + interactions clavier.
  - Tests E2E (Playwright) ciblant :
    - Ouverture du modal, saisie plage, confirmation, réception du payload normalisé.

### Étape suivante
- Finaliser la maquette fil de fer (Figma interne) pour verrouiller la hiérarchie visuelle avant d’entamer l’implémentation React.
- Préparer le squelette du composant (`ForceSyncMenu.tsx`) avec les hooks/méthodes décrits ci-dessus.

---

### Étape 2 – Maquette fil de fer UI & architecture du composant

- **Objectif**  
  Traduire les décisions UX en structure concrète (layout, interactions) tout en fonçant vers un composant modulaire et testable.

- **Wireframe (description textuelle)**
  ```
  [ Synchroniser ]  [▼ Forcer]
                      ├─ Aujourd’hui (icône ⚡)
                      ├─ La veille (icône 🌙)
                      ├─ Plage personnalisée… (icône 📅)
                      └─ Auto (icône 🤖 + toggle)
  
  Modal « Plage personnalisée »
  ┌───────────────────────────────────────────────┐
  │ Titre: Recalculer une plage de dates          │
  │                                               │
  │ [Date de début]  [picker]                     │
  │ [Date de fin]    [picker]                     │
  │ [ ] Inclure aujourd’hui                       │
  │ ───────────────────────────────────────────── │
  │ Résumé: « 4 journées seront recalculées (16   │
  │           appels API estimés). »              │
  │                                               │
  │ [Annuler]                   [Recalculer]      │
  └───────────────────────────────────────────────┘
  ```

- **Architecture du composant**
  ```tsx
  // ForceSyncMenu/index.tsx
  export function ForceSyncMenu(props: ForceSyncMenuProps) {
    const { onSync, lastForcedRange, autoForceEnabled } = props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [preset, setPreset] = useState<ForceSyncMode | null>(null);
    const [range, setRange] = useState<DateRange | null>(restoreLastRange());
  
    const handleSelect = useCallback((mode: ForceSyncMode) => {
      if (mode === 'range') {
        setDialogOpen(true);
        setPreset(mode);
        return;
      }
      if (mode === 'auto') {
        openAutoDialog();
        return;
      }
      onSync(mapPresetToRequest(mode));
    }, [onSync]);
  
    const handleRangeConfirm = useCallback((range: DateRange, includeToday: boolean) => {
      const request = mapRangeToRequest(range, includeToday);
      storeLastRange(range);
      onSync(request);
      setDialogOpen(false);
    }, [onSync]);
  
    return (
      <>
        <DropdownMenu>
          {/* items today/yesterday/range/auto */}
        </DropdownMenu>
        <Suspense fallback={null}>
          {dialogOpen && (
            <ForceRangeDialog
              initialRange={range}
              onCancel={() => setDialogOpen(false)}
              onConfirm={handleRangeConfirm}
            />
          )}
        </Suspense>
      </>
    );
  }
  ```

- **Hooks auxiliaires prévus**
  - `useForceSyncOptions()` : encapsule la logique de restauration/validation d’une plage.
  - `useAutoForcePolicy()` : lit/écrit la préférence “auto”.
  - `mapPresetToRequest(mode)` / `mapRangeToRequest(range)` : fonctions pures testées.

- **Plan performance**
  - `ForceRangeDialog` sera dans un chunk séparé (`React.lazy(() => import('./ForceRangeDialog'))`).
  - Date pickers se basent sur la lib existante (ex : `react-day-picker`) déjà utilisée ailleurs ; si non, import minimisé.
  - Suspense fallback = squelette léger (ex : spinner inline) pour ne pas bloquer l’UI.

- **Plan qualité**
  - Tests unitaires : mapping preset, validation de plage, rendu minimal.
  - Tests visuels : capture via Storybook pour valider la cohérence (même si non obligatoires, recommandés).

### Étape suivante
- Créer les stubs de fichiers `ForceSyncMenu.tsx`, `ForceRangeDialog.tsx`, utilitaires `forceSyncUtils.ts`.
- Brancher les props dans le contexte Garmin (sans logique réseau pour l’instant).

---

### Étape 3 – Création des stubs & intégration minimale dans le UI existant

- **Objectif**  
  Mettre en place l’ossature des nouveaux composants sans encore brancher toute la logique, pour faciliter l’incrémentation et les tests.

- **Actions prévues**
  1. Créer un dossier `src/components/tabs/GarminTab/components/sync/`.
  2. Ajouter :
     - `ForceSyncMenu.tsx` (export principal + lazy load du dialog).
     - `ForceRangeDialog.tsx` (squelette du modal, sans date-picker réel pour l’instant, placeholders).
     - `forceSyncUtils.ts` (fonctions `mapPresetToRequest`, `validateRange`, `restoreLastRange`, `storeLastRange`).
  3. Mettre à jour `SyncControls.jsx` pour remplacer le bouton “Forcer” par `<ForceSyncMenu onSync={syncNow} … />`.
  4. Passer les props nécessaires depuis `GarminTab.jsx` (récupérer `lastForcedRange` depuis le contexte si déjà présent, sinon `null`).
  5. Ajouter tests unitaires basiques (structure, exports).

- **Choix techniques**
  - `ForceRangeDialog.tsx` renvoie pour l’instant un markup minimal (titre + boutons) avec un `TODO` sur le date-picker.
  - Les utilitaires sont écrits en TypeScript pour garantir la robustesse des conversions de date (même si le projet est majoritairement JSX, on peut créer un `.ts` avec jsdoc — vérifier config Babel ; sinon rester en `.js` avec JSDoc).
  - `SyncControls` importe `ForceSyncMenu` via chemin relatif propre.

- **Validation**
  - `npm run lint` / `npm run test -- --watch` sur les nouveaux modules (s’assurer que le pipeline existant passe).
  - Vérifier au runtime que le menu rendu affiche bien les options (sans erreur JS) et que le clic sur “Plage personnalisée” ouvre un dialog placeholder.

- **Risques / mitigations**
  - Taille du bundle : très limitée à ce stade (lazy load non encore branché mais l’architecture le prévoit).
  - Cohérence UX : boutons existants restent tous fonctionnels.

### Étape suivante
- Implémenter effectivement la logique de sélection de dates (intégration du date-picker lazy load) et les validations, une fois les stubs en place et validés.

**Statut**  
✅ Fichiers créés (`ForceSyncMenu`, `ForceRangeDialog`, `forceSyncUtils`).  
✅ `SyncControls` utilise désormais le menu (bouton “Forcer” remplacé).  
✅ Utilitaires de mapping / validation opérationnels (avec stockage session).  
🔜 Étape 4 : brancher le date-picker et finaliser la validation UX (résumé de requêtes, estimation requêtes API).

---

### Étape 4 – UX finale de la plage personnalisée (résumé, estimation, lazy date-picker)

- **Objectif**  
  Livrer une expérience aboutie dans le modal : résumé de la plage, estimation du coût (appels API), et import lazy d’un date-picker ergonomique.

- **Actions prévues**
  1. Mettre à jour `forceSyncUtils` :
     - Fonction `estimateApiCalls(spanDays)` (basée sur le nombre moyen d’endpoints par jour).
     - `describeRange(range, includeToday)` pour afficher un résumé clair (plage, span).
  2. `ForceRangeDialog` :
     - Calcul dynamique du `spanDays`, appel à `estimateApiCalls`.
     - Affichage d’un bloc “Résumé” (ex : “4 jours → ~32 appels API”).
     - Réinitialisation live des messages d’erreur à la modification des dates.
     - Lazy load du date-picker (ex: `React.lazy(() => import('../../../ui/DateRangePicker'))` ou fallback natif si indisponible).
  3. Accessibilité : focus initial sur le premier input, aria-live pour les erreurs.
  4. Tests unitaires :
     - `estimateApiCalls` renvoie un entier cohérent.
     - `describeRange` gère le cas “include today”.

- **Plan de performance**
  - Date-picker séparé en chunk (`ForceRangeDialog` charge `RangePicker` uniquement à la demande).
  - Calculs de résumé en `useMemo`.

- **Livrables**
  - Modal enrichi (résumé + estimation).
  - Utilitaires mis à jour.
  - Tests couvrant les nouveaux helpers.
  - Documentation appendice (table des estimations) si nécessaire.

**Statut**  
✅ Résumé dynamique + estimation d’appels API intégrés (`ForceRangeDialog`).  
✅ Utilitaires mis à jour (`describeRange`, `estimateApiCalls`).  
✅ Lazy-load du sélecteur de dates (`ForceRangeCalendar`), focus initial auto et messages aria-live.  

**Étape suivante**  
Après livraison de cette UX, attaquer le backend (`resolveForceRange`) + purge cache + historique dans l’index DB / exports.

---

### Étape 5 – Backend : normalisation des plages & purge cache ciblée

- **Objectif**  
  Permettre au serveur (Node) de comprendre les nouveaux modes (today/yesterday/range/auto), de purger le cache pour les dates visées, puis de propager proprement la plage à Python.

- **Actions prévues**
  1. **Route `/api/garmin/sync`**  
     - Lire `mode`, `start`, `end`, `includeToday`.  
     - Appeler `resolveForceRange(mode, payload)` pour obtenir `{ start, end, forceRefresh }`.  
     - Journaliser la décision (`[FORCE SYNC]`).
  2. **Helper `resolveForceRange`**  
     - `today`, `yesterday`, `range`, `auto` (auto = si `lastSyncDate < today`, renvoyer `[lastSyncDate+1 → today]`).  
     - Validation de plage (`validateRange` côté serveur).
  3. **Purge cache**  
     - Parcourir `garmin-server/.cache`, supprimer fichiers `daily_metrics_<date>_*` compris dans `[start, end]`.  
     - Log : `[CACHE PURGE] Removed X files for 2025-11-02`.
  4. **Propagation vers Python**  
     - Passer `--start`, `--end`, `--forceRefresh` (ou en query).  
     - Si `auto`, transmettre la plage calculée (pas de logique auto dans Python pour éviter double décision).  
  5. **Réponse enrichie**  
     - Ajouter `forcedRange: { start, end, mode, triggeredAt }` dans le JSON renvoyé au front pour historisation.

- **Tests / validations**  
  - Unitaires sur `resolveForceRange`.  
  - Test manuel : forcer “la veille” → vérifier la purge + synchro.  
  - S’assurer que la synchro simple (sans force) est inchangée.

**Statut**  
✅ Backend : `resolveForceRange`, purge granulaire `.cache`, propagation `forcedRange` dans la réponse.  
🔜 Couverture de tests Node + métriques de monitoring (compteurs de purges / modes).  

**Étape suivante**  
Mettre à jour le contexte front pour stocker `forcedRangesHistory` dans l’index DB, l’export JSON, et afficher l’historique côté UI (badge ou timeline).

---

### Étape 6 – Front : historisation des forcings & export JSON

- **Objectif**  
  Enregistrer chaque synchronisation forcée (mode, plage, purge) dans IndexedDB, les exposer dans l’UI et les inclure dans l’export JSON des paramètres.

- **Actions prévues**  
  1. Étendre `useGarminData` / `garminDataSave` pour créer une store `forcedRangesHistory` (clé primaire auto) avec index sur `date`.  
  2. Au retour de `useGarminSync`, persister `response.forcedRange` si présent (ajouter `triggeredAt`, `pythonDuration`, `cachePurge`).  
  3. Charger l’historique dans le contexte (`GarminProvider`) → fournir `forcedRangesHistory` et `addForcedRange` / `clearForcedRanges`.  
  4. Export JSON : ajouter le tableau `forcedRangesHistory` (limité aux 200 dernières entrées).  
  5. Import JSON : fusionner les entrées (éviter doublons : même `triggeredAt` + `mode` + `start` + `end`).  
  6. UI : dans `SyncControls`, afficher le dernier forçage (résumé) + bouton “Historique” ouvrant un panel (table simple).  
  7. Option : badge indicateur sur les jours recalculés dans le tableau/graph (phase ultérieure).

- **Validation**  
  - Tests unitaires : `saveForcedRange`, `loadForcedRanges`, export/import cohérents.  
  - Vérification manuelle : forcer “La veille” → entrée ajoutée, affichée dans l’historique, export JSON contient l’info.

- **Statut**  
  ✅ Implémentation front terminée : IndexedDB (`forcedRangesHistory`), hook `useGarminSync`, contexte & UI (`SyncControls`), export JSON.  
  🔜 QA manuelle multi-modes + tests unitaires ciblés (`garminForcedHistory`).

**Étape suivante**  
 Vérifier la stabilité (tests manuels + unitaires), puis itérer sur le badge timeline (optionnel).


