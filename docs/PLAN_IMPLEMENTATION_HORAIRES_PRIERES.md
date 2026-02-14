# Plan d’implémentation : horaires de prière (quêtes)

Récapitulatif des choix retenus et plan d’implémentation pour intégrer les **horaires de prière islamiques calculés** dans les quêtes, avec détection « catégorie = Prière » et choix parmi les 5 prières.

---

## 1. Objectif

- Quand l’utilisateur crée/édite une quête et choisit la catégorie **« Prière »**, un champ **« Quelle prière ? »** apparaît avec les 5 prières (Fajr, Dhuhr, Asr, Maghrib, Isha).
- L’heure n’est **pas saisie à la main** : elle est **calculée automatiquement** pour chaque jour à partir de la date et de la position de l’utilisateur (librairie).
- Le reste des quêtes (autres catégories) reste inchangé (plage / heure précise / période).

---

## 2. Choix techniques retenus

### 2.1 Librairie : **Adhan** (npm `adhan`)

| Critère | Choix |
|--------|--------|
| **Package** | `adhan` (batoulapps) |
| **Fiabilité** | Algorithmes type « Astronomical Algorithms » (Meeus), utilisés par US Naval Observatory / NOAA. Très répandue (Swift, Java, Python, etc.). |
| **Dépendances** | Aucune. |
| **Environnement** | Node + navigateur (CommonJS, ESM, UMD). |
| **API** | `Coordinates`, `CalculationMethod`, `PrayerTimes(coordinates, date, params)` → `.fajr`, `.dhuhr`, `.asr`, `.maghrib`, `.isha` (objets Date). |
| **Méthodes** | Plusieurs calculs (MoonsightingCommittee, MuslimWorldLeague, etc.) ; on pourra exposer une option dans les paramètres plus tard. |

**Installation :**
```bash
npm install adhan
```

**Usage type :**
```javascript
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

const coords = new Coordinates(48.8566, 2.3522); // Paris
const params = CalculationMethod.MoonsightingCommittee();
const date = new Date(2025, 1, 13); // 13 fév 2025
const times = new PrayerTimes(coords, date, params);

// times.fajr, .dhuhr, .asr, .maghrib, .isha sont des Date
// Formater en HH:mm pour l’app
```

### 2.2 Détection « quête prière »

- **Déclencheur** : `categorie === 'Prière'` dans le formulaire de quête.
- **Comportement** : afficher le bloc **« Quelle prière ? »** (Fajr, Dhuhr, Asr, Maghrib, Isha) et **masquer/désactiver** le bloc « Heure prévue » (plage / heure précise).
- **Donnée stockée** : champ optionnel sur la quête, ex. `priere: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'`. Rempli uniquement quand catégorie = « Prière » et qu’une prière est choisie.

### 2.3 Localisation (une fois pour toutes)

- **Stockage** : position utilisateur (latitude, longitude) en un seul endroit (paramètres app / profil), pas sur chaque quête.
- **Options possibles** :
  - **A** : Champs manuels « Latitude » / « Longitude » (ou « Ville » + géocodage une fois).
  - **B** : Géolocalisation navigateur (avec fallback manuel).
- **Recommandation** : démarrer avec **A** (saisie lat/lng ou ville) pour éviter les soucis de permissions ; ajouter B plus tard si besoin.
- **Clé de stockage** : par ex. `prayerLocation: { lat, lng }` dans `appState` ou `userData` (IndexedDB / localStorage selon l’existant).

### 2.4 Calcul de l’heure affichée / tri

- **Uniquement** pour les quêtes avec `quest.priere` défini.
- **Entrées** : `date` (jour affiché), `priere` (fajr/dhuhr/…), `{ lat, lng }` (config).
- **Sortie** : heure en `HH:mm` pour ce jour-là.
- **Utilisation** : dans le moteur de quêtes (tri du jour, liste « Aujourd’hui ») et dans les helpers d’affichage (`getHeureDisplay`, `getHeureSortMinutes`) en passant la **date cible** quand c’est une quête prière.

### 2.5 Rétrocompatibilité

- Quêtes existantes sans `priere` : comportement actuel (heure fixe / créneau).
- Catégorie « Prière » déjà dans la liste : on ajoute **« Prière »** dans `CATEGORIES` si ce n’est pas déjà le cas (ex. à côté de « Spirituel »).

---

## 3. Modèle de données

### 3.1 Quête (schéma)

- **Ajout** :
  - `priere` : `string` optionnel, `''` par défaut. Valeurs autorisées : `'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'`.
- **Règles** :
  - Si `priere` est renseigné, l’heure affichée et le tri sont **toujours** calculés via la lib (on ignore `heure` / `heureType` / `creneau` pour l’affichage et le tri).
  - En création/édition : si catégorie = « Prière » et qu’une prière est choisie, on enregistre `priere` ; sinon on laisse `priere` vide et on garde l’heure classique si besoin.

### 3.2 Config app / utilisateur

- **Objet** : `prayerLocation` (ou équivalent dans l’état existant).
- **Champs** :
  - `lat` : number (ex. 48.8566).
  - `lng` : number (ex. 2.3522).
- **Optionnel** : `city` (string) pour affichage « Horaires pour : Paris ».
- **Défaut** : si absent, les quêtes « prière » peuvent afficher un message du type « Configure ta position dans les paramètres » et ne pas calculer d’heure (ou utiliser une valeur par défaut pour éviter les crashs).

---

## 4. Parcours utilisateur (UX)

1. **Première fois**  
   - Dans Paramètres (ou un bloc dédié) : « Localisation pour les horaires de prière » → saisie lat/lng (ou ville) → sauvegarde.

2. **Création d’une quête prière**  
   - Nom, description, etc.  
   - **Catégorie** : choix « Prière ».  
   - **Bloc « Quelle prière ? »** apparaît : liste ou boutons (Fajr, Dhuhr, Asr, Maghrib, Isha).  
   - **Heure prévue** : masqué ou désactivé, avec texte « Heure calculée automatiquement selon ta position ».  
   - Enregistrement → `categorie: 'Prière'`, `priere: 'fajr'` (ou autre).

3. **Vue « Aujourd’hui » / liste du jour**  
   - Pour chaque quête avec `priere` : appel à la lib avec la date du jour + `prayerLocation` → affichage de l’heure calculée (ex. « 06:42 ») et tri par cette heure.

4. **Édition**  
   - Si catégorie = « Prière » : afficher « Quelle prière ? » pré-rempli avec `quest.priere`, pas d’édition d’heure manuelle.

---

## 5. Plan d’implémentation (ordre conseillé)

### Phase 1 : Dépendance et helper de calcul

| Étape | Fichier / action | Détail |
|-------|------------------|--------|
| 1.1 | `package.json` | `npm install adhan`. |
| 1.2 | `src/utils/prayerTimes.js` (nouveau) | Créer un module qui : (1) importe `Coordinates`, `CalculationMethod`, `PrayerTimes` ; (2) exporte une fonction `getPrayerTimeForDate(date, priere, { lat, lng })` qui retourne `HH:mm` (ou `null` si coords manquantes). Utiliser une méthode de calcul par défaut (ex. `MoonsightingCommittee`). Gérer le cas `date` en string `YYYY-MM-DD` ou `Date`. |

**Mapping prière → propriété Adhan :**
- `fajr` → `times.fajr`
- `dhuhr` → `times.dhuhr`
- `asr` → `times.asr`
- `maghrib` → `times.maghrib`
- `isha` → `times.isha`

### Phase 2 : Stockage de la position

| Étape | Fichier / action | Détail |
|-------|------------------|--------|
| 2.1 | Décider du lieu de persistance | Soit `appState` (IndexedDB / localStorage), soit un objet dédié `prayerLocation` dans le même stockage que les préférences. |
| 2.2 | Lecture / écriture | Exposer une clé du type `prayerLocation` (ou `userData.prayerLocation`) et des helpers/fonctions pour la charger et la sauvegarder depuis le hook ou le contexte existant (ex. settings). |
| 2.3 | UI paramètres | Dans l’onglet/écran Paramètres : ajouter une section « Horaires de prière » avec champs Latitude, Longitude (et optionnellement Ville). Sauvegarder au même endroit que les autres préférences. |

### Phase 3 : Données quête (schéma + état)

| Étape | Fichier / action | Détail |
|-------|------------------|--------|
| 3.1 | `src/utils/validation/schemas.js` | Dans `questSchema`, ajouter `priere: z.enum(['fajr','dhuhr','asr','maghrib','isha']).optional().default('')` (ou `.or(z.literal(''))` selon la version Zod). |
| 3.2 | `src/components/tabs/QuestsTab/constants.js` | Définir et exporter `PRIERES = [{ value: 'fajr', label: 'Fajr' }, ...]` (les 5 prières). |
| 3.3 | `src/components/tabs/QuestsTab/hooks/useQuestsActions.js` | État initial du formulaire : `priere: ''`. À l’ouverture en édition : `priere: quest.priere || ''`. À la sauvegarde : inclure `priere` dans l’objet validé (déjà pris en charge si présent dans le schéma). |

### Phase 4 : Formulaire de quête (détection « Prière »)

| Étape | Fichier / action | Détail |
|-------|------------------|--------|
| 4.1 | `src/components/tabs/QuestsTab/components/QuestFormModal.jsx` | Si `questForm.categorie === 'Prière'` : afficher un bloc « Quelle prière ? » (select ou boutons) avec les 5 options (valeurs : fajr, dhuhr, asr, maghrib, isha). Valeur liée à `questForm.priere`. |
| 4.2 | Même fichier | Quand `categorie === 'Prière'` : masquer ou désactiver le bloc « Heure prévue » (plage / heure précise) et afficher un court texte : « Heure calculée automatiquement selon ta position ». |
| 4.3 | Même fichier | À la sélection d’une prière : `setQuestForm(prev => ({ ...prev, priere: value }))`. Si l’utilisateur repasse à une autre catégorie, remettre `priere: ''` pour rester cohérent. |
| 4.4 | Catégorie « Prière » | S’assurer que « Prière » figure dans `CATEGORIES` (dans `constants.js`). |

### Phase 5 : Moteur de quêtes (tri + affichage)

| Étape | Fichier / action | Détail |
|-------|------------------|--------|
| 5.1 | `src/utils/quests.js` | Étendre `getHeureSortMinutes(quest, targetDateStr, prayerLocation)` : si `quest.priere` est défini et `prayerLocation` présent, appeler `getPrayerTimeForDate(targetDateStr, quest.priere, prayerLocation)` et convertir `HH:mm` en minutes ; sinon comportement actuel (créneau / heure). |
| 5.2 | `src/utils/quests.js` | Étendre `getHeureDisplay(quest, targetDateStr, prayerLocation)` : si `quest.priere` défini et `prayerLocation` présent, retourner l’heure calculée en `HH:mm` ; sinon comportement actuel. |
| 5.3 | `src/hooks/useQuietQuestEngine.js` | Dans `getQuestsForDate`, récupérer `prayerLocation` (depuis state/IndexedDB) et passer `targetDate` + `prayerLocation` à `getHeureSortMinutes` pour les quêtes. Adapter l’appel à `getHeureSortMinutes` pour lui fournir la date et la position. |
| 5.4 | Composants qui affichent l’heure | Partout où `getHeureDisplay(quest)` est appelé pour la **vue du jour** (QuestsTodayView, sidebar, etc.) : passer la date du jour et `prayerLocation` pour que les quêtes prière affichent l’heure calculée. Pour le tableau « Mes quêtes » (liste globale), soit on passe la date du jour pour cohérence, soit on affiche « Selon le jour » ou l’heure du jour courant. |

### Phase 6 : Cas limites et robustesse

| Étape | Fichier / action | Détail |
|-------|------------------|--------|
| 6.1 | `getPrayerTimeForDate` | Si `!lat || !lng` (ou position non configurée), retourner `null`. Dans `getHeureDisplay` / `getHeureSortMinutes`, si `null` : pour l’affichage afficher ex. « Configure ta position » ; pour le tri utiliser une valeur par défaut (ex. 24*60) pour ne pas casser le tri. |
| 6.2 | Formulaire | Si catégorie = « Prière » et qu’aucune prière n’est choisie, à la validation : refuser ou rappeler de choisir une prière (validation schéma ou message d’erreur explicite). |
| 6.3 | Fuseau horaire | Adhan utilise la `Date` JS (donc le fuseau local du navigateur). Pas de changement nécessaire si l’utilisateur est toujours dans le même fuseau ; documenter que les horaires sont en heure locale. |

---

## 6. Fichiers à créer / modifier (résumé)

| Fichier | Action |
|---------|--------|
| `package.json` | Ajouter dépendance `adhan`. |
| `src/utils/prayerTimes.js` | **Créer** : wrapper autour d’Adhan, `getPrayerTimeForDate(date, priere, { lat, lng })` → `HH:mm` ou `null`. |
| Stockage (appState / userData / settings) | **Lire/écrire** `prayerLocation: { lat, lng }`. |
| Paramètres (UI) | **Ajouter** section « Horaires de prière » avec lat/lng (et optionnellement ville). |
| `src/utils/validation/schemas.js` | **Ajouter** champ `priere` (optionnel, enum des 5 valeurs). |
| `src/components/tabs/QuestsTab/constants.js` | **Ajouter** `PRIERES` et **vérifier** « Prière » dans `CATEGORIES`. |
| `src/components/tabs/QuestsTab/hooks/useQuestsActions.js` | **Gérer** `priere` dans l’état du formulaire (initial, édition, sauvegarde). |
| `src/components/tabs/QuestsTab/components/QuestFormModal.jsx` | **Afficher** « Quelle prière ? » si catégorie = « Prière » ; **masquer/désactiver** Heure prévue dans ce cas. |
| `src/utils/quests.js` | **Étendre** `getHeureSortMinutes` et `getHeureDisplay` avec `targetDateStr` et `prayerLocation` ; appeler `getPrayerTimeForDate` si `quest.priere`. |
| `src/hooks/useQuietQuestEngine.js` | **Récupérer** `prayerLocation` et **passer** date + position aux helpers de tri/affichage. |
| `QuestsTodayView.jsx`, `QuestsTableView.jsx`, `InteractiveQuestsModule.jsx` | **Passer** date du jour et `prayerLocation` à `getHeureDisplay` (et tri si nécessaire). |
| `src/components/tabs/QuestsTab/hooks/useQuestsSort.js` | Pour la colonne « Heure » : si quête prière, utiliser l’heure calculée pour **aujourd’hui** (ou la date sélectionnée) avec `prayerLocation`. |

---

## 7. Tests manuels recommandés

1. Sans position configurée : créer une quête « Prière » → afficher la vue du jour → message ou comportement dégradé propre (pas de crash).
2. Avec position : configurer lat/lng → créer quête Fajr → vérifier que l’heure affichée pour aujourd’hui est cohérente (comparer avec un site de référence).
3. Changer de jour (si possible) : vérifier que l’heure change.
4. Quête « normale » (autre catégorie) : pas de régression (heure fixe / créneau inchangé).
5. Édition : ouvrir une quête prière → « Quelle prière ? » pré-rempli, pas d’heure manuelle.

---

## 8. Résumé des choix « béton »

- **Lib** : `adhan` (fiable, 0 dépendance, Node + browser).
- **Détection** : catégorie = « Prière » → afficher « Quelle prière ? » (5 choix) et désactiver la saisie d’heure.
- **Stockage** : `priere` sur la quête ; `prayerLocation` (lat/lng) une fois dans les paramètres.
- **Calcul** : uniquement pour les quêtes avec `priere` ; entrée = date + prière + position ; sortie = `HH:mm` pour affichage et tri.
- **Implémentation** : phases 1 → 2 → 3 → 4 → 5 → 6 pour limiter les régressions et garder un flux clair.

Une fois ce plan suivi, les prières seront gérées par la lib avec une UX « je choisis Prière puis la prière dans la liste » et une heure toujours calculée automatiquement pour le jour affiché.
