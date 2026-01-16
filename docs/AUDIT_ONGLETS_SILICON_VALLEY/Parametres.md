# Audit — Paramètres

## Vue d’ensemble (note globale)
**Note : 86/100**

**Points forts (+)**
- Découpage propre en hooks et sections (refactor massif, orchestration claire).  
- Couverture fonctionnelle riche : profil, exports/imports multi‑modules, migration, nettoyage, i18n, swipe.  
- Cohérence UI (Card + sections homogènes) et statut visuel clair.  
- Prévisualisation d’imports (Body Tracking + import complet).  
- Stats cross‑modules chargées proprement (QuietQuest/Livres/Apprentissage).  

**Points perfectibles (−) & solutions**
- **(−4)** Utilisation de `window.confirm`, `alert` et `window.location.reload` (UX bloquante + non testable).  
  **Solution :** remplacer par modales internes non bloquantes + toasts + actions de reload différé via “soft refresh” (invalidations, re-fetch, état local).  
- **(−3)** Styles inline injectés dans `SettingsTab` (style tag + inline style inputs) → CSS non centralisé, risque de divergence.  
  **Solution :** déplacer dans un fichier CSS/utility + classes (Tailwind utilities ou CSS module).  
- **(−3)** Debug de sessions mockées exposé en prod (console + bouton).  
  **Solution :** flag `__DEV__` / feature flag + log silencieux en prod.  
- **(−2)** Imports/exports utilisent des logs/console en production.  
  **Solution :** logger central conditionnel (niveau debug).  
- **(−2)** Validation d’email très simplifiée.  
  **Solution :** utiliser une validation plus stricte (regex robuste ou validation backend‑driven).  

---

## Onglet principal — `SettingsTab`
**Note : 87/100**

**Gains**
- Orchestration propre des hooks et sections (`useSettingsStats`, `useSettingsExport`, `useSettingsImport`, `useAllDataExportImport`, etc.).  
- Modals isolées (`ImportPreviewModal`, `ProfileCardSettings`, `HomePageImageSettings`).  
- Intégration multi‑module consolidée (Garmin, Nutrition, Books, QuietQuest, Apprentissage).  

**Pertes & correctifs**
- **(−3)** Injection de style dans le composant.  
  **Solution :** CSS global dédié (classes `.profile-input-dark`), éviter `<style>` inline.  
- **(−2)** `debugMockSessions` intégré à l’UI.  
  **Solution :** bouton visible uniquement en dev + logger.  
- **(−2)** Handlers d’import “wrapper” juste pour try/catch.  
  **Solution :** déplacer la gestion d’erreur dans le hook (API unique + erreurs typées).  
- **(−1)** Couplage direct à `setActiveTab` (navigation implicite).  
  **Solution :** passer via une action de navigation centralisée ou un service.  

---

## Sous‑sections principales

### 1) Profil & compte — `ProfileSettings` + `useProfileSettings`
**Note : 88/100**

**Gains**
- Statuts de progression clairs (loading/success/error).  
- Gestion avatar + email + password bien segmentée.  
- Reset des champs après succès + revocation d’URL blob.  

**Pertes & correctifs**
- **(−3)** Validation email/mot de passe côté client minimaliste.  
  **Solution :** schéma de validation (Zod/Yup) + messages côté backend.  
- **(−2)** `console.error` en prod dans le hook.  
  **Solution :** logger conditionnel.  
- **(−2)** `autoComplete="off"` sur le mot de passe (limite UX sécurité).  
  **Solution :** préférer `current-password`/`new-password`.  
- **(−1)** Pas de limite fichier avatar (poids/type) dans le hook.  
  **Solution :** validation dès `handleAvatarChange` (type, size).  

---

### 2) Export/Import global — `ExportImportSection` + `useSettingsExport` + `useSettingsImport`
**Note : 85/100**

**Gains**
- Couverture large (Sport, Body Tracking, Garmin, Nutrition, Books, Budget, QuietQuest, Apprentissage).  
- Export global enrichi (metadata détaillées, stats, dateRange).  
- Compression Garmin/Nutrition.  

**Pertes & correctifs**
- **(−4)** Usage de `alert/confirm` + reload forcé.  
  **Solution :** toasts + modales custom + soft reload (invalidate + refresh).  
- **(−3)** Logs console en prod pour succès/erreurs.  
  **Solution :** logger structuré + niveaux.  
- **(−2)** Couplage UI/logic avec fallback LocalStorage dans hooks (books) sans politique claire.  
  **Solution :** service de stockage unifié (IndexedDB > fallback) + status unique.  
- **(−2)** Validation import Garmin/Books/QuietQuest non normalisée (différents chemins).  
  **Solution :** pipeline d’import standardisé (parse → validate → migrate → store).  

---

### 3) Import complet — `useAllDataExportImport` + `ImportPreviewModal`
**Note : 86/100**

**Gains**
- Prévisualisation détaillée avec warnings.  
- Backup avant import (sécurité).  
- Support format export complet + import books détecté.  

**Pertes & correctifs**
- **(−3)** Merge manuel body tracking (dédoublonnage partiel par date).  
  **Solution :** stratégie de merge déterministe par ID/sha + règle de résolution.  
- **(−2)** `localStorage` utilisé pour backup sans expiration ni versioning.  
  **Solution :** IndexedDB + TTL + version.  
- **(−2)** Pas de rollback transactionnel si import échoue partiellement.  
  **Solution :** pipeline transactionnel + journal d’import.  
- **(−1)** Parsing JSON brut sans taille maximale.  
  **Solution :** vérifier taille du fichier + chunking si nécessaire.  

---

### 4) Nettoyage données — `DataCleanupSection` + `useDataCleanup`
**Note : 84/100**

**Gains**
- Backup avant suppression.  
- Détection détaillée des anomalies (durées/sauts/dates futures).  
- Retour d’état lisible.  

**Pertes & correctifs**
- **(−4)** Workflow basé sur `confirm/alert`.  
  **Solution :** modal de confirmation + rapport de nettoyage + bouton “annuler”.  
- **(−2)** Backup dans `localStorage` non chiffré.  
  **Solution :** export sécurisé (chiffrement local) ou clé utilisateur.  
- **(−2)** Suppression non transactionnelle (risque d’état partiel).  
  **Solution :** transaction unique + rollback.  
- **(−1)** Debug disponible en prod.  
  **Solution :** garder pour dev uniquement.  

---

### 5) Navigation swipe — `SwipeNavigationSettings` + `useSwipeSettings`
**Note : 89/100**

**Gains**
- UI claire (toggle + slider + état visuel).  
- Sauvegarde persistée + event custom pour refresh.  

**Pertes & correctifs**
- **(−3)** Aucune validation du threshold côté service.  
  **Solution :** clamp dans `saveSettings` + guard.  
- **(−2)** Status de sauvegarde reset via timeout arbitraire.  
  **Solution :** centraliser via hook de notifications.  
- **(−1)** Aucune gestion d’erreur d’accès storage.  
  **Solution :** fallback & message UI.  

---

### 6) Langue — `LanguageSettings`
**Note : 92/100**

**Gains**
- I18n propre via `useTranslation`.  
- UI minimale, claire, isolée.  

**Pertes & correctifs**
- **(−3)** Aucun feedback de changement (toast) ni persistance visible.  
  **Solution :** toast “langue enregistrée” + badge actuel.  
- **(−1)** Aucun fallback si `useTranslation` échoue.  
  **Solution :** fallback de texte + default locale.  

---

### 7) Informations — `InfoCards`
**Note : 83/100**

**Gains**
- Transparence des mécanismes de sauvegarde.  
- Attributions externes claires.  

**Pertes & correctifs**
- **(−4)** Données statiques potentiellement fausses (fréquence, retries).  
  **Solution :** alimenter via stats runtime réelles (source unique).  
- **(−3)** Aucun lien entre affichage et état réel (e.g. IndexedDB down).  
  **Solution :** health‑check storage + badge dynamique.  
- **(−2)** URL externe sans monitoring (risque d’obsolescence).  
  **Solution :** config centralisée + validation périodique.  

---

## Détails par sous‑sections “Export/Import” individuels

### QuietQuest — `QuietQuestExportImport`
**Note : 87/100**
- **(−3)** Import forcé par file input DOM (non contrôlé).  
  **Solution :** composant d’upload réutilisable + drag & drop + validation size/type.  
- **(−2)** Confirm/reload forcés.  
  **Solution :** refresh local + toast.  

### Livres — `BooksExportImport`
**Note : 86/100**
- **(−3)** Import bloquant via confirm.  
  **Solution :** non‑blocking modal + post‑import refresh.  
- **(−2)** Aucun aperçu d’import (livres, sessions).  
  **Solution :** preview par catégorie.  

### Budget — `BudgetExportImport`
**Note : 85/100**
- **(−3)** Import sans preview.  
  **Solution :** preview et diff.  
- **(−2)** Merge vs overwrite gérés en dur.  
  **Solution :** options utilisateur explicites.  

### Apprentissage — `ApprentissageExportImport`
**Note : 86/100**
- **(−3)** Import sans validation explicite de schéma.  
  **Solution :** schema + message d’erreurs.  
- **(−1)** Reload forcé.  
  **Solution :** re‑fetch des données + toast.  

---

## Synthèse “Silicon Valley”
Pour atteindre **100/100**, il faut :
- Remplacer tous les `alert/confirm/reload` par une UX non bloquante (modals + toasts + refresh ciblé).  
- Centraliser les validations (Zod/Yup) et l’import/export via un pipeline unique.  
- Supprimer les styles inline (CSS/utility).  
- Ajouter gestion transactionnelle + rollback sur import/cleanup.  
- Standardiser logs/erreurs via un logger.  
