# Analyse — roulement des fonds d’écran (accueil)

Date : 2026-11-04  
Périmètre : page d’accueil (`HomePage`) + réglages (`HomePageImageSettings`)  
Sources principales : `src/utils/wallpaperPlayback.js`, `src/utils/homepageImagePreferences.js`, `src/hooks/useHomeWallpaperPlayback.js`, `src/hooks/useHomepageImages.js`

## 1. Ce que le produit prétend faire

Deux modes d’ordre (`homePlayback.order`) :

| Mode | Label UI | Comportement réel |
|---|---|---|
| `random` (défaut) | « Aléatoire (les favoris sortent plus souvent) » | Tirage **pondéré** parmi le pool éligible, en **évitant de répéter** l’index courant si possible |
| `sequential` | « Dans l’ordre de la galerie » | `(indexCourant + 1) % taillePool` |

Intervalle : `rotationMs` (défaut **120 000 ms** = 2 min). `0` = pas de rotation auto.  
Clic : option `advanceOnClick` (même fonction de tirage que le timer).

## 2. Qui entre dans le pool (rotation)

`buildHomepageWeightedPool(images, { mediaKinds })` n’inclut une image que si **toutes** les conditions sont vraies :

1. `hidden !== true`
2. `useOnHome !== false` (défaut = **true** pour les uploads ; **false** pour les ajouts banque)
3. filtre `mediaKinds` : `all` | `images` | `videos`

Conséquence UX importante : un fond ajouté depuis la **banque** démarre avec `useOnHome: false`. Il est dans la collection mais **hors rotation** jusqu’à activation explicite (bouton Accueil / emplacement / action de groupe).

## 3. Tirage « aléatoire » — algorithme exact

Chaîne :

1. `pickNextHomepageImageIndex` → construit le pool + poids
2. `pickNextWallpaperIndex` → si `random`, délègue à `pickWeightedIndex`
3. `pickWeightedIndex(count, excludeIdx, weights)` :
   - construit la liste des indices **≠ courant**
   - tire `r = Math.random() * sommeDesPoids`
   - parcourt les éligibles en soustrayant leur poids jusqu’à `r <= 0`

Poids :

- favori (`liked`) → `3` (`LIKED_WALLPAPER_WEIGHT` / `HOMEPAGE_LIKED_WEIGHT`)
- sinon → `1`

Propriétés statistiques (pool de taille N, F favoris) :

- un favori a **3×** la chance d’un non-favori à chaque tirage
- **pas de file d’attente**, **pas de « encore jamais vu »**, **pas de round-robin**
- la seule garantie anti-répétition est « pas le même index que le courant » (si N ≥ 2)
- les **derniers ajoutés** n’ont aucun bonus de nouveauté : avec une grande collection + beaucoup de favoris, un nouveau non-favori peut mettre longtemps à apparaître **sans bug**

Index initial (`pickInitialHomepageImageIndex`) : même pondération, sans exclusion.

## 4. Persistance des flags (useOnHome / liked / hidden / useOnLock)

Deux canaux :

1. **IndexedDB** — champs sur chaque enregistrement (`liked`, `hidden`, `useOnHome`, `useOnLock`, …) via `saveBatchToIndexedDB`
2. **localStorage metadata** — map `preferences` via `extractHomepageImagePreferences` / `applyHomepageImagePreferences`

Ancien comportement à risque (corrigé en parallèle de cette note) :

- `extractHomepageImagePreferences` **omettait** les images aux prefs « par défaut »
- activer l’accueil (`useOnHome: true`) **supprimait** l’entrée prefs ; une sauvegarde asynchrone **périmée** (encore à `false`) pouvait réécrire l’UI / IndexedDB → sensation de « je coche, ça se décoche »
- la file `commitImages` pouvait lancer une sauvegarde sur un **snapshot** déjà dépassé ; `executeSaveImagesRobust` rappelait ensuite `setBackgroundImages(normalized)` et écrasait l’état live

## 5. Verrouillage (hors scope UI principal, même moteur)

Le verrou réutilise `pickNextWallpaperIndex` / poids favoris. Pool = images collection avec `useOnLock` + items « verrou seul », hors `hidden`. Ordre / intervalle stockés dans le record AppLock.

## 6. Checklist de diagnostic rapide

Si un fond « n’entre jamais » dans la rotation :

1. `useOnHome === false` ? (surtout ajouts banque)
2. `hidden === true` ?
3. filtre « Photos uniquement » / « Vidéos uniquement » qui l’exclut ?
4. collection grande + beaucoup de ♥ → attente longue normale en mode random
5. prefs / IndexedDB désynchronisés (symptôme historique du décochage)

## 7. Limites assumées du modèle actuel

- Aléatoire ≠ équitable sur une session courte
- Pas de mémoire « déjà montré récemment » au-delà de l’image courante
- Favoris dominent fortement (poids 3)
- Aucun boost « nouveau dans la rotation »
