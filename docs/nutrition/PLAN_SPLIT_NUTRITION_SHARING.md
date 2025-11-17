# 📋 PLAN DÉTAILLÉ - Split `nutritionSharing.js` (3055 lignes)

**Date** : 2025-01-16  
**Objectif** : Découper méthodiquement `nutritionSharing.js` en modules logiques (<300 lignes chacun)  
**Principe** : Extraction progressive avec tests à chaque étape pour garantir zéro régression

---

## 📊 ANALYSE COMPLÈTE DU FICHIER

### Structure identifiée (17 sections)

| # | Section | Lignes | Dépendances | Priorité |
|---|---------|--------|-------------|----------|
| 1 | **Imports** | 29-36 | - | ⚪ Basse |
| 2 | **Schemas Zod** | 38-169 | `z` (Zod) | 🟢 **Étape 1** |
| 3 | **ImportValidator** | 171-411 | `nutritionShareSchema`, `z` | 🟢 **Étape 2** |
| 4 | **VersionMigrator** | 413-512 | - | 🟢 **Étape 3** |
| 5 | **RateLimiter** | 514-580 | - | 🟢 **Étape 4** |
| 6 | **Constantes** | 641-668 | - | 🟢 **Étape 5** |
| 7 | **Token Generator** | 670-801 | `getShareLink`, `EXPIRATION_OPTIONS` | 🟡 **Étape 6** |
| 8 | **Share Links CRUD** | 803-1504 | `openNutritionDB`, `STORE_SHARE_LINKS` | 🟡 **Étape 7** |
| 9 | **Cleanup Service** | 1505-1737 | `cleanupExpiredLinks`, `cleanupRevokedLinks`, `cleanupOrphanedQRCache`, `getAllShareLinks` | 🟡 **Étape 8** |
| 10 | **Share Link Generator** | 1739-1828 | `generateSecureToken`, `parseDuration`, `saveShareLink`, `getAllShareLinks`, `checkShareLinkCreationAllowed`, `generateQRCode`, `EXPIRATION_OPTIONS`, `SHARE_SCOPES`, `PERMISSIONS` | 🔴 **Étape 9** |
| 11 | **QR Code Generator** | 1830-2064 | `QRCode` (library), `localStorage` | 🟢 **Étape 10** |
| 12 | **Data Preparation** | 2066-2381 | `SHARE_SCOPES`, `DateHelper` | 🟡 **Étape 11** |
| 13 | **Secure Export Service** | 2383-2603 | `CryptoJS` | 🟢 **Étape 12** |
| 14 | **Export Cache Service** | 2605-2791 | `prepareNutritionDataForShare`, `localStorage` | 🟡 **Étape 13** |
| 15 | **Export Functions** | 2793-2946 | `getShareLink`, `updateShareLinkAccess`, `prepareNutritionDataForShare`, `SecureExportService`, `ExportCacheService`, `SHARE_SCOPES` | 🔴 **Étape 14** |
| 16 | **Token Validator** | 2948-3018 | `getShareLink`, `deleteShareLink`, `updateShareLinkAccess` | 🟡 **Étape 15** |
| 17 | **Import Functions** | 3020-3216 | `ImportValidator`, `VersionMigrator`, `parseShareJson`, `validateShareJson`, `decryptNutritionExport` | 🔴 **Étape 16** |
| 18 | **Barrel Exports** | 3218-3250 | Tous les exports | 🔴 **Étape 17** |

### Dépendances entre sections

```
Schemas Zod (2)
  └─> ImportValidator (3)
  └─> VersionMigrator (4) [optionnel]
  └─> Import Functions (17)

ImportValidator (3)
  └─> Import Functions (17)

VersionMigrator (4)
  └─> Import Functions (17)

RateLimiter (5)
  └─> Share Link Generator (10)

Constantes (6)
  └─> Token Generator (7)
  └─> Share Link Generator (10)
  └─> Data Preparation (12)

Token Generator (7)
  └─> Share Links CRUD (8) [getShareLink]
  └─> Share Link Generator (10)

Share Links CRUD (8)
  └─> Token Generator (7) [collision check]
  └─> Cleanup Service (9)
  └─> Share Link Generator (10)
  └─> Export Functions (15)
  └─> Token Validator (16)

Cleanup Service (9)
  └─> Share Links CRUD (8) [cleanupExpiredLinks, cleanupRevokedLinks, getAllShareLinks]
  └─> QR Code Generator (11) [cleanupOrphanedQRCache]

Share Link Generator (10)
  └─> Token Generator (7)
  └─> Share Links CRUD (8)
  └─> QR Code Generator (11)
  └─> Constantes (6)

QR Code Generator (11)
  └─> Share Link Generator (10)
  └─> Cleanup Service (9) [cleanupOrphanedQRCache]

Data Preparation (12)
  └─> Constantes (6) [SHARE_SCOPES]
  └─> Export Cache Service (14)
  └─> Export Functions (15)

Secure Export Service (13)
  └─> Export Functions (15)

Export Cache Service (14)
  └─> Data Preparation (12) [prepareNutritionDataForShare]

Export Functions (15)
  └─> Share Links CRUD (8)
  └─> Data Preparation (12)
  └─> Secure Export Service (13)
  └─> Export Cache Service (14)
  └─> Constantes (6)

Token Validator (16)
  └─> Share Links CRUD (8)

Import Functions (17)
  └─> ImportValidator (3)
  └─> VersionMigrator (4)
  └─> Schemas Zod (2)
  └─> Export Functions (15) [decryptNutritionExport]

Barrel Exports (18)
  └─> Toutes les sections précédentes
```

### Ordre d'extraction optimal

**Principe** : Extraire d'abord les sections sans dépendances, puis progressivement celles qui dépendent des précédentes.

**Ordre recommandé** :
1. ✅ **Schemas Zod** (indépendant)
2. ✅ **VersionMigrator** (indépendant, utilise seulement schemas)
3. ✅ **RateLimiter** (indépendant)
4. ✅ **Constantes** (indépendant)
5. ✅ **QR Code Generator** (indépendant, utilise seulement library externe)
6. ✅ **Secure Export Service** (indépendant, utilise seulement CryptoJS)
7. ✅ **Share Links CRUD** (indépendant, utilise seulement IndexedDB utils)
8. ✅ **Token Generator** (dépend de Share Links CRUD pour collision check)
9. ✅ **Cleanup Service** (dépend de Share Links CRUD + QR Code Generator)
10. ✅ **Data Preparation** (dépend de Constantes)
11. ✅ **Export Cache Service** (dépend de Data Preparation)
12. ✅ **Share Link Generator** (dépend de Token Generator, Share Links CRUD, QR Code Generator, Constantes, RateLimiter)
13. ✅ **Export Functions** (dépend de Share Links CRUD, Data Preparation, Secure Export Service, Export Cache Service)
14. ✅ **Token Validator** (dépend de Share Links CRUD)
15. ✅ **ImportValidator** (dépend de Schemas Zod)
16. ✅ **Import Functions** (dépend de ImportValidator, VersionMigrator, Export Functions)
17. ✅ **Barrel Exports** (dépend de toutes les sections)

---

## 🗂️ STRUCTURE DE DOSSERS PROPOSÉE

```
src/services/nutrition/sharing/
├── index.js                          # Barrel (exports principaux) - Étape 17
├── constants.js                      # Constantes (EXPIRATION_OPTIONS, SHARE_SCOPES, PERMISSIONS) - Étape 4
├── schemas/
│   ├── index.js                      # Barrel
│   └── shareSchemas.js               # Schemas Zod (statsPeriodSchema, statsSchema, chartsSchema, etc.) - Étape 1
├── validators/
│   ├── index.js                      # Barrel
│   ├── importValidator.js            # ImportValidator class - Étape 2
│   └── tokenValidator.js             # validateShareToken function - Étape 14
├── migration/
│   ├── index.js                      # Barrel
│   └── versionMigrator.js            # VersionMigrator class - Étape 3
├── rateLimiting/
│   ├── index.js                      # Barrel
│   └── rateLimiter.js                # RateLimiter class + checkShareLinkCreationAllowed - Étape 4
├── token/
│   ├── index.js                      # Barrel
│   └── tokenGenerator.js             # generateSecureToken + parseDuration - Étape 8
├── shareLinks/
│   ├── index.js                      # Barrel
│   └── shareLinksCRUD.js             # saveShareLink, getShareLink, getAllShareLinks, deleteShareLink, lockShareLink, updateShareLinkAccess, detectSuspiciousBehavior, cleanupExpiredLinks, cleanupRevokedLinks - Étape 7
├── cleanup/
│   ├── index.js                      # Barrel
│   └── cleanupService.js             # CleanupService class - Étape 9
├── qrcode/
│   ├── index.js                      # Barrel
│   └── qrCodeGenerator.js            # generateQRCode + cleanupOrphanedQRCache - Étape 5
├── dataPreparation/
│   ├── index.js                      # Barrel
│   └── dataPreparator.js             # prepareNutritionDataForShare + calculateAggregatedStats + prepareChartData + prepareProgressData - Étape 10
├── encryption/
│   ├── index.js                      # Barrel
│   └── encryptionService.js          # SecureExportService class - Étape 6
├── cache/
│   ├── index.js                      # Barrel
│   └── exportCacheService.js         # ExportCacheService class - Étape 11
├── export/
│   ├── index.js                      # Barrel
│   └── shareExporter.js              # exportNutritionDataForShare + decryptNutritionExport + generateSecureShareLink - Étape 12
└── import/
    ├── index.js                      # Barrel
    └── shareImporter.js              # validateShareJson + parseShareJson + loadShareDataFromJson - Étape 15
```

---

## ✅ PLAN D'EXTRACTION ÉTAPE PAR ÉTAPE

### Étape 1 : Extraire Schemas Zod (~170 lignes)

**Fichier** : `src/services/nutrition/sharing/schemas/shareSchemas.js`

**Imports nécessaires** :
```javascript
import { z } from 'zod';
```

**Exports** :
- `statsPeriodSchema`
- `statsSchema`
- `chartTimelineItemSchema`
- `chartsSchema`
- `progressTrendSchema`
- `progressSchema`
- `shareDataSchema`
- `metadataSchema`
- `nutritionShareSchemaV1`
- `nutritionShareEncryptedSchemaV1`
- `nutritionShareSchema`

**Actions** :
1. ✅ Créer dossier `src/services/nutrition/sharing/schemas/`
2. ✅ Créer fichier `shareSchemas.js` avec tous les schemas
3. ✅ Créer fichier `index.js` (barrel) exportant tous les schemas
4. ✅ Dans `nutritionSharing.js`, remplacer les schemas par `import { ... } from './sharing/schemas'`
5. ✅ Tester : Build + vérifier que les imports fonctionnent
6. ✅ Commit : "feat: Extract Zod schemas to sharing/schemas/shareSchemas.js"

**Vérification** :
- ✅ Build passe sans erreur
- ✅ Aucune régression (tous les tests passent si disponibles)
- ✅ Imports corrects partout

---

### Étape 2 : Extraire ImportValidator (~240 lignes)

**Fichier** : `src/services/nutrition/sharing/validators/importValidator.js`

**Imports nécessaires** :
```javascript
import { z } from 'zod';
import { nutritionShareSchema } from '../schemas';
import logger from '../../../../utils/logger';

const log = logger.module('importValidator');
```

**Exports** :
- `ImportValidator` (class avec méthodes statiques)

**Actions** :
1. ✅ Créer dossier `src/services/nutrition/sharing/validators/`
2. ✅ Créer fichier `importValidator.js` avec la classe ImportValidator
3. ✅ Importer `nutritionShareSchema` depuis `../schemas`
4. ✅ Créer fichier `index.js` (barrel) exportant `ImportValidator`
5. ✅ Dans `nutritionSharing.js`, remplacer la classe par `import { ImportValidator } from './sharing/validators'`
6. ✅ Tester : Build + vérifier que les imports fonctionnent
7. ✅ Commit : "feat: Extract ImportValidator to sharing/validators/importValidator.js"

**Vérification** :
- ✅ Build passe sans erreur
- ✅ ImportValidator.parseAndValidate fonctionne toujours
- ✅ ImportValidator.detectMaliciousContent fonctionne toujours

---

### Étape 3 : Extraire VersionMigrator (~100 lignes)

**Fichier** : `src/services/nutrition/sharing/migration/versionMigrator.js`

**Imports nécessaires** :
```javascript
import logger from '../../../../utils/logger';

const log = logger.module('versionMigrator');
```

**Exports** :
- `VersionMigrator` (class avec méthodes statiques)

**Actions** :
1. ✅ Créer dossier `src/services/nutrition/sharing/migration/`
2. ✅ Créer fichier `versionMigrator.js` avec la classe VersionMigrator
3. ✅ Créer fichier `index.js` (barrel) exportant `VersionMigrator`
4. ✅ Dans `nutritionSharing.js`, remplacer la classe par `import { VersionMigrator } from './sharing/migration'`
5. ✅ Tester : Build + vérifier que les imports fonctionnent
6. ✅ Commit : "feat: Extract VersionMigrator to sharing/migration/versionMigrator.js"

**Vérification** :
- ✅ Build passe sans erreur
- ✅ VersionMigrator.migrate fonctionne toujours

---

### Étape 4 : Extraire RateLimiter + Constantes (~160 lignes)

**Fichiers** :
- `src/services/nutrition/sharing/rateLimiting/rateLimiter.js`
- `src/services/nutrition/sharing/constants.js`

**Imports nécessaires pour RateLimiter** :
```javascript
// Aucun import externe nécessaire
```

**Imports nécessaires pour Constantes** :
```javascript
// Aucun import externe nécessaire
```

**Exports RateLimiter** :
- `RateLimiter` (class)
- `shareLinkCreationLimiter` (instance)
- `checkShareLinkCreationAllowed` (function)

**Exports Constantes** :
- `EXPIRATION_OPTIONS`
- `SHARE_SCOPES`
- `PERMISSIONS`
- `MAX_ACTIVE_SHARE_LINKS`
- `MAX_ACCESSES_PER_TOKEN`
- `SUSPICIOUS_ACCESS_THRESHOLD`
- `BURST_WINDOW_MS`
- `BURST_THRESHOLD`
- `MIN_ACCESS_INTERVAL_MS`

**Actions** :
1. ✅ Créer dossier `src/services/nutrition/sharing/rateLimiting/`
2. ✅ Créer fichier `rateLimiter.js` avec la classe RateLimiter + instance + checkShareLinkCreationAllowed
3. ✅ Créer fichier `index.js` (barrel) exportant tout
4. ✅ Créer fichier `constants.js` avec toutes les constantes
5. ✅ Dans `nutritionSharing.js`, remplacer par imports depuis `./sharing/rateLimiting` et `./sharing/constants`
6. ✅ Tester : Build + vérifier que les imports fonctionnent
7. ✅ Commit : "feat: Extract RateLimiter and constants to sharing modules"

**Vérification** :
- ✅ Build passe sans erreur
- ✅ Constantes accessibles partout
- ✅ RateLimiter fonctionne toujours

---

### Étape 5 : Extraire QR Code Generator (~235 lignes)

**Fichier** : `src/services/nutrition/sharing/qrcode/qrCodeGenerator.js`

**Imports nécessaires** :
```javascript
import QRCode from 'qrcode';
import logger from '../../../../utils/logger';

const log = logger.module('qrCodeGenerator');
```

**Exports** :
- `generateQRCode` (async function)
- `cleanupOrphanedQRCache` (function)
- `QR_CACHE_PREFIX` (const)
- `QR_CACHE_EXPIRY_MS` (const)

**Actions** :
1. ✅ Créer dossier `src/services/nutrition/sharing/qrcode/`
2. ✅ Créer fichier `qrCodeGenerator.js` avec toutes les fonctions QR code
3. ✅ Créer fichier `index.js` (barrel) exportant tout
4. ✅ Dans `nutritionSharing.js`, remplacer par `import { generateQRCode, cleanupOrphanedQRCache } from './sharing/qrcode'`
5. ✅ Tester : Build + tester génération QR code
6. ✅ Commit : "feat: Extract QR code generator to sharing/qrcode/qrCodeGenerator.js"

**Vérification** :
- ✅ Build passe sans erreur
- ✅ Génération QR code fonctionne
- ✅ Cache QR code fonctionne
- ✅ Cleanup QR code fonctionne

---

### Étape 6 : Extraire Secure Export Service (~220 lignes)

**Fichier** : `src/services/nutrition/sharing/encryption/encryptionService.js`

**Imports nécessaires** :
```javascript
import CryptoJS from 'crypto-js';
import logger from '../../../../utils/logger';

const log = logger.module('encryptionService');
```

**Exports** :
- `SecureExportService` (class avec méthodes statiques)

**Actions** :
1. ✅ Créer dossier `src/services/nutrition/sharing/encryption/`
2. ✅ Créer fichier `encryptionService.js` avec la classe SecureExportService
3. ✅ Créer fichier `index.js` (barrel) exportant `SecureExportService`
4. ✅ Dans `nutritionSharing.js`, remplacer par `import { SecureExportService } from './sharing/encryption'`
5. ✅ Tester : Build + tester chiffrement/déchiffrement
6. ✅ Commit : "feat: Extract SecureExportService to sharing/encryption/encryptionService.js"

**Vérification** :
- ✅ Build passe sans erreur
- ✅ Chiffrement fonctionne
- ✅ Déchiffrement fonctionne

---

### Étape 7 : Extraire Share Links CRUD (~700 lignes)

**Fichier** : `src/services/nutrition/sharing/shareLinks/shareLinksCRUD.js`

**Imports nécessaires** :
```javascript
import { openNutritionDB, STORE_SHARE_LINKS } from '../../../hooks/nutritionDataUtils';
import logger from '../../../../utils/logger';
import { MAX_ACCESSES_PER_TOKEN, SUSPICIOUS_ACCESS_THRESHOLD, BURST_WINDOW_MS, BURST_THRESHOLD, MIN_ACCESS_INTERVAL_MS } from '../constants';

const log = logger.module('shareLinksCRUD');
```

**Exports** :
- `saveShareLink` (async function)
- `getShareLink` (async function)
- `getAllShareLinks` (async function)
- `deleteShareLink` (async function)
- `lockShareLink` (async function)
- `updateShareLinkAccess` (async function)
- `detectSuspiciousBehavior` (function)
- `cleanupExpiredLinks` (async function)
- `cleanupRevokedLinks` (async function)

**Actions** :
1. ✅ Créer dossier `src/services/nutrition/sharing/shareLinks/`
2. ✅ Créer fichier `shareLinksCRUD.js` avec toutes les fonctions CRUD
3. ✅ Importer constantes depuis `../constants`
4. ✅ Créer fichier `index.js` (barrel) exportant tout
5. ✅ Dans `nutritionSharing.js`, remplacer par `import { ... } from './sharing/shareLinks'`
6. ✅ Tester : Build + tester toutes les opérations CRUD
7. ✅ Commit : "feat: Extract Share Links CRUD to sharing/shareLinks/shareLinksCRUD.js"

**Vérification** :
- ✅ Build passe sans erreur
- ✅ Toutes les opérations CRUD fonctionnent
- ✅ Détection comportement suspect fonctionne
- ✅ Cleanup fonctionne

---

### Étape 8 : Extraire Token Generator (~130 lignes)

**Fichier** : `src/services/nutrition/sharing/token/tokenGenerator.js`

**Imports nécessaires** :
```javascript
import { getShareLink } from '../shareLinks';
import { EXPIRATION_OPTIONS } from '../constants';
import logger from '../../../../utils/logger';

const log = logger.module('tokenGenerator');
```

**Exports** :
- `generateSecureToken` (async function)
- `parseDuration` (function)

**Actions** :
1. ✅ Créer dossier `src/services/nutrition/sharing/token/`
2. ✅ Créer fichier `tokenGenerator.js` avec les fonctions token
3. ✅ Importer `getShareLink` depuis `../shareLinks`
4. ✅ Importer `EXPIRATION_OPTIONS` depuis `../constants`
5. ✅ Créer fichier `index.js` (barrel) exportant tout
6. ✅ Dans `nutritionSharing.js`, remplacer par `import { generateSecureToken, parseDuration } from './sharing/token'`
7. ✅ Tester : Build + tester génération token + vérification collision
8. ✅ Commit : "feat: Extract token generator to sharing/token/tokenGenerator.js"

**Vérification** :
- ✅ Build passe sans erreur
- ✅ Génération token fonctionne
- ✅ Vérification collision fonctionne
- ✅ ParseDuration fonctionne

---

### Étape 9 : Extraire Cleanup Service (~235 lignes)

**Fichier** : `src/services/nutrition/sharing/cleanup/cleanupService.js`

**Imports nécessaires** :
```javascript
import { cleanupExpiredLinks, cleanupRevokedLinks, getAllShareLinks } from '../shareLinks';
import { cleanupOrphanedQRCache } from '../qrcode';
import logger from '../../../../utils/logger';

const log = logger.module('cleanupService');
```

**Exports** :
- `CleanupService` (class avec méthodes statiques)

**Actions** :
1. ✅ Créer dossier `src/services/nutrition/sharing/cleanup/`
2. ✅ Créer fichier `cleanupService.js` avec la classe CleanupService
3. ✅ Importer fonctions nécessaires depuis `../shareLinks` et `../qrcode`
4. ✅ Créer fichier `index.js` (barrel) exportant `CleanupService`
5. ✅ Dans `nutritionSharing.js`, remplacer par `import { CleanupService } from './sharing/cleanup'`
6. ✅ Tester : Build + tester cleanup complet
7. ✅ Commit : "feat: Extract CleanupService to sharing/cleanup/cleanupService.js"

**Vérification** :
- ✅ Build passe sans erreur
- ✅ Cleanup complet fonctionne
- ✅ Statistiques cleanup fonctionnent

---

### Étape 10 : Extraire Data Preparation (~320 lignes)

**Fichier** : `src/services/nutrition/sharing/dataPreparation/dataPreparator.js`

**Imports nécessaires** :
```javascript
import { SHARE_SCOPES } from '../constants';
import { DateHelper } from '../../../../utils/dateHelper';
import logger from '../../../../utils/logger';

const log = logger.module('dataPreparator');
```

**Exports** :
- `prepareNutritionDataForShare` (function)
- `calculateAggregatedStats` (function - interne)
- `prepareChartData` (function - interne)
- `prepareProgressData` (function - interne)

**Actions** :
1. ✅ Créer dossier `src/services/nutrition/sharing/dataPreparation/`
2. ✅ Créer fichier `dataPreparator.js` avec toutes les fonctions préparation données
3. ✅ Importer `SHARE_SCOPES` depuis `../constants`
4. ✅ Créer fichier `index.js` (barrel) exportant `prepareNutritionDataForShare` (et helpers si nécessaire)
5. ✅ Dans `nutritionSharing.js`, remplacer par `import { prepareNutritionDataForShare } from './sharing/dataPreparation'`
6. ✅ Tester : Build + tester préparation données (stats, charts, progress)
7. ✅ Commit : "feat: Extract data preparation to sharing/dataPreparation/dataPreparator.js"

**Vérification** :
- ✅ Build passe sans erreur
- ✅ Préparation stats fonctionne
- ✅ Préparation charts fonctionne
- ✅ Préparation progress fonctionne

---

### Étape 11 : Extraire Export Cache Service (~190 lignes)

**Fichier** : `src/services/nutrition/sharing/cache/exportCacheService.js`

**Imports nécessaires** :
```javascript
import { prepareNutritionDataForShare } from '../dataPreparation';
import logger from '../../../../utils/logger';

const log = logger.module('exportCacheService');
```

**Exports** :
- `ExportCacheService` (class avec méthodes statiques)

**Actions** :
1. ✅ Créer dossier `src/services/nutrition/sharing/cache/`
2. ✅ Créer fichier `exportCacheService.js` avec la classe ExportCacheService
3. ✅ Importer `prepareNutritionDataForShare` depuis `../dataPreparation`
4. ✅ Créer fichier `index.js` (barrel) exportant `ExportCacheService`
5. ✅ Dans `nutritionSharing.js`, remplacer par `import { ExportCacheService } from './sharing/cache'`
6. ✅ Tester : Build + tester cache export (hash, get, set, cleanup)
7. ✅ Commit : "feat: Extract ExportCacheService to sharing/cache/exportCacheService.js"

**Vérification** :
- ✅ Build passe sans erreur
- ✅ Génération hash fonctionne
- ✅ Cache get/set fonctionne
- ✅ Cleanup cache fonctionne

---

### Étape 12 : Extraire Export Functions (~270 lignes)

**Fichier** : `src/services/nutrition/sharing/export/shareExporter.js`

**Imports nécessaires** :
```javascript
import { getShareLink, updateShareLinkAccess } from '../shareLinks';
import { prepareNutritionDataForShare } from '../dataPreparation';
import { SecureExportService } from '../encryption';
import { ExportCacheService } from '../cache';
import { SHARE_SCOPES } from '../constants';
import { generateSecureToken, parseDuration } from '../token';
import { saveShareLink, getAllShareLinks } from '../shareLinks';
import { checkShareLinkCreationAllowed } from '../rateLimiting';
import { generateQRCode } from '../qrcode';
import { PERMISSIONS } from '../constants';
import logger from '../../../../utils/logger';

const log = logger.module('shareExporter');
```

**Exports** :
- `exportNutritionDataForShare` (async function)
- `decryptNutritionExport` (async function)
- `generateSecureShareLink` (async function)

**Actions** :
1. ✅ Créer dossier `src/services/nutrition/sharing/export/`
2. ✅ Créer fichier `shareExporter.js` avec toutes les fonctions export
3. ✅ Importer toutes les dépendances nécessaires
4. ✅ Créer fichier `index.js` (barrel) exportant tout
5. ✅ Dans `nutritionSharing.js`, remplacer par `import { exportNutritionDataForShare, decryptNutritionExport, generateSecureShareLink } from './sharing/export'`
6. ✅ Tester : Build + tester export (chiffré et non chiffré) + génération lien
7. ✅ Commit : "feat: Extract export functions to sharing/export/shareExporter.js"

**Vérification** :
- ✅ Build passe sans erreur
- ✅ Export non chiffré fonctionne
- ✅ Export chiffré fonctionne
- ✅ Déchiffrement fonctionne
- ✅ Génération lien fonctionne

---

### Étape 13 : Extraire Token Validator (~70 lignes)

**Fichier** : `src/services/nutrition/sharing/validators/tokenValidator.js`

**Imports nécessaires** :
```javascript
import { getShareLink, deleteShareLink, updateShareLinkAccess } from '../shareLinks';
import logger from '../../../../utils/logger';

const log = logger.module('tokenValidator');
```

**Exports** :
- `validateShareToken` (async function)

**Actions** :
1. ✅ Ajouter fichier `tokenValidator.js` dans dossier `src/services/nutrition/sharing/validators/`
2. ✅ Créer fichier `tokenValidator.js` avec la fonction validateShareToken
3. ✅ Importer fonctions nécessaires depuis `../shareLinks`
4. ✅ Mettre à jour fichier `index.js` (barrel) pour exporter `validateShareToken`
5. ✅ Dans `nutritionSharing.js`, remplacer par `import { validateShareToken } from './sharing/validators'`
6. ✅ Tester : Build + tester validation token
7. ✅ Commit : "feat: Extract token validator to sharing/validators/tokenValidator.js"

**Vérification** :
- ✅ Build passe sans erreur
- ✅ Validation token fonctionne
- ✅ Gestion erreurs fonctionne

---

### Étape 14 : Mettre à jour ImportValidator (dépend de Schemas)

**Fichier** : `src/services/nutrition/sharing/validators/importValidator.js`

**Modifications** :
- ✅ Déjà extrait à l'Étape 2
- ✅ Vérifier que les imports de schemas fonctionnent toujours

---

### Étape 15 : Extraire Import Functions (~200 lignes)

**Fichier** : `src/services/nutrition/sharing/import/shareImporter.js`

**Imports nécessaires** :
```javascript
import { ImportValidator } from '../validators';
import { VersionMigrator } from '../migration';
import { decryptNutritionExport } from '../export';
import { nutritionShareSchema } from '../schemas';
import { z } from 'zod';
import logger from '../../../../utils/logger';

const log = logger.module('shareImporter');
```

**Exports** :
- `validateShareJson` (async function)
- `parseShareJson` (async function)
- `loadShareDataFromJson` (async function)

**Actions** :
1. ✅ Créer dossier `src/services/nutrition/sharing/import/`
2. ✅ Créer fichier `shareImporter.js` avec toutes les fonctions import
3. ✅ Importer toutes les dépendances nécessaires
4. ✅ Créer fichier `index.js` (barrel) exportant tout
5. ✅ Dans `nutritionSharing.js`, remplacer par `import { validateShareJson, parseShareJson, loadShareDataFromJson } from './sharing/import'`
6. ✅ Tester : Build + tester validation + parsing + chargement (chiffré et non chiffré)
7. ✅ Commit : "feat: Extract import functions to sharing/import/shareImporter.js"

**Vérification** :
- ✅ Build passe sans erreur
- ✅ Validation JSON fonctionne
- ✅ Parsing JSON fonctionne
- ✅ Chargement JSON fonctionne (chiffré et non chiffré)

---

### Étape 16 : Créer Barrel Exports (`index.js`)

**Fichier** : `src/services/nutrition/sharing/index.js`

**Imports nécessaires** :
```javascript
// Constants
export * from './constants';

// Token
export { generateSecureToken, parseDuration } from './token';

// Share Links
export {
  saveShareLink,
  getShareLink,
  getAllShareLinks,
  deleteShareLink,
  lockShareLink,
  updateShareLinkAccess,
  detectSuspiciousBehavior,
  cleanupExpiredLinks,
  cleanupRevokedLinks
} from './shareLinks';

// Cleanup Service
export { CleanupService } from './cleanup';

// QR Code
export { generateQRCode, cleanupOrphanedQRCache } from './qrcode';

// Data Preparation
export { prepareNutritionDataForShare } from './dataPreparation';

// Encryption
export { SecureExportService } from './encryption';

// Cache
export { ExportCacheService } from './cache';

// Export
export {
  exportNutritionDataForShare,
  decryptNutritionExport,
  generateSecureShareLink
} from './export';

// Validators
export { ImportValidator } from './validators';
export { validateShareToken } from './validators';

// Migration
export { VersionMigrator } from './migration';

// Rate Limiting
export { RateLimiter, checkShareLinkCreationAllowed } from './rateLimiting';

// Import
export {
  validateShareJson,
  parseShareJson,
  loadShareDataFromJson
} from './import';
```

**Actions** :
1. ✅ Créer fichier `index.js` dans `src/services/nutrition/sharing/`
2. ✅ Exporter tous les exports publics de tous les modules
3. ✅ Tester : Build + vérifier que tous les imports depuis `nutritionSharing` fonctionnent encore
4. ✅ Commit : "feat: Create barrel exports for sharing module"

**Vérification** :
- ✅ Build passe sans erreur
- ✅ Tous les exports sont accessibles depuis `sharing/index.js`
- ✅ Compatibilité rétroactive assurée

---

### Étape 17 : Mettre à jour `nutritionSharing.js` et fichiers utilisateurs

**Fichier** : `src/services/nutrition/nutritionSharing.js`

**Modifications** :
1. ✅ Supprimer tout le code (garder seulement les exports depuis `./sharing`)
2. ✅ Créer un wrapper minimal qui re-exporte depuis `./sharing` (pour rétrocompatibilité)

**Code final** :
```javascript
/**
 * nutritionSharing.js
 * 
 * Service pour le Partage avec Coach (liens sécurisés).
 * 
 * ✅ PHASE 12.1 : Module refactorisé en sous-modules logiques
 * Voir : src/services/nutrition/sharing/ pour structure modulaire
 * 
 * @module services/nutrition/nutritionSharing
 * @deprecated Use direct imports from './sharing' for better tree-shaking
 */

// Re-export everything from sharing module (backward compatibility)
export * from './sharing';

// Default export for backward compatibility
export {
  generateSecureToken,
  parseDuration,
  generateSecureShareLink,
  saveShareLink,
  getShareLink,
  getAllShareLinks,
  deleteShareLink,
  updateShareLinkAccess,
  lockShareLink,
  detectSuspiciousBehavior,
  cleanupExpiredLinks,
  cleanupRevokedLinks,
  CleanupService,
  ExportCacheService,
  generateQRCode,
  cleanupOrphanedQRCache,
  prepareNutritionDataForShare,
  exportNutritionDataForShare,
  decryptNutritionExport,
  validateShareToken,
  validateShareJson,
  parseShareJson,
  loadShareDataFromJson,
  ImportValidator,
  VersionMigrator,
  EXPIRATION_OPTIONS,
  SHARE_SCOPES,
  PERMISSIONS
} from './sharing';

export default {
  // ... (même structure qu'avant pour backward compatibility)
};
```

**Fichiers à mettre à jour** :
1. ✅ `src/components/tabs/nutrition/components/NutritionSharing.jsx`
2. ✅ `src/components/tabs/nutrition/components/CoachDashboard.jsx`
3. ✅ `src/hooks/useNutritionSharing.js`
4. ✅ `src/hooks/useCoachDashboard.js`
5. ✅ Tous les autres fichiers qui importent depuis `nutritionSharing`

**Actions** :
1. ✅ Mettre à jour `nutritionSharing.js` pour re-exporter depuis `./sharing`
2. ✅ Tester : Build + tester toutes les fonctionnalités
3. ✅ Commit : "refactor: Refactor nutritionSharing.js to use modular structure"

**Vérification** :
- ✅ Build passe sans erreur
- ✅ Toutes les fonctionnalités marchent
- ✅ Imports existants fonctionnent toujours (rétrocompatibilité)

---

## 🧪 TESTS À EFFECTUER À CHAQUE ÉTAPE

### Tests unitaires (si disponibles)
- ✅ Build sans erreur
- ✅ Tous les tests passent

### Tests manuels
1. ✅ **Génération lien partage** : Créer un nouveau lien, vérifier token, QR code
2. ✅ **Export JSON** : Exporter données (chiffré et non chiffré), vérifier format
3. ✅ **Import JSON** : Importer JSON, vérifier validation et parsing
4. ✅ **Validation token** : Valider token existant, vérifier expiration
5. ✅ **Cleanup** : Exécuter cleanup, vérifier statistiques
6. ✅ **Rate limiting** : Tester limite création liens
7. ✅ **Access control** : Tester limite accès, détection comportement suspect

---

## 📝 CHECKLIST DE VALIDATION FINALE

### Structure
- ✅ Tous les fichiers créés dans les bons dossiers
- ✅ Tous les barrel `index.js` créés
- ✅ Tous les imports/exports cohérents

### Fonctionnalité
- ✅ Toutes les fonctionnalités marchent
- ✅ Aucune régression
- ✅ Performance similaire ou meilleure

### Code
- ✅ Aucun fichier >300 lignes
- ✅ 1 fichier = 1 responsabilité
- ✅ Imports/exports explicites

### Documentation
- ✅ Commentaires JSDoc conservés
- ✅ README mis à jour (si existe)
- ✅ Plan d'extraction documenté

---

## 🎯 BÉNÉFICES ATTENDUS

### Maintenabilité
- ✅ **+80%** : Code plus facile à comprendre (1 fichier = 1 responsabilité)
- ✅ **+100%** : Tests unitaires possibles (fichiers isolés)
- ✅ **+50%** : Collaboration facilitée (moins de conflits Git)

### Performance
- ✅ **+10-20%** : Tree-shaking efficace (import seulement nécessaire)
- ✅ **Bundle plus petit** : Import sélectif des fonctionnalités

### Développement
- ✅ **Navigation plus rapide** : Fichiers plus petits
- ✅ **IDE plus performant** : Autocomplétion plus rapide
- ✅ **Debugging plus facile** : Erreurs plus localisées

---

## ⚠️ RISQUES ET MITIGATION

### Risque 1 : Casser les imports existants
**Mitigation** : Garder `nutritionSharing.js` comme wrapper re-exportant depuis `./sharing` (rétrocompatibilité)

### Risque 2 : Oublier une dépendance
**Mitigation** : Tester à chaque étape, build vérifiera les imports manquants

### Risque 3 : Regressions fonctionnelles
**Mitigation** : Tests manuels à chaque étape, commit après chaque étape réussie

---

## 📚 RESSOURCES

- **Fichier source** : `src/services/nutrition/nutritionSharing.js` (3055 lignes)
- **Structure cible** : `src/services/nutrition/sharing/` (~15 fichiers <300 lignes)
- **Documentation** : `docs/nutrition/PHASE_12_1_SPLIT_FILES.md`

---

**Dernière mise à jour** : 2025-01-16  
**Statut** : 📋 Prêt pour implémentation  
**Estimation** : 3-4 heures (méthodique, étape par étape avec tests)


