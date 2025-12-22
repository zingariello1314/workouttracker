# Guide d'implémentation : Boutons Gradient Premium - Onglet Quête

## 📋 Vue d'ensemble

Ce guide détaille l'application de l'esthétique de boutons gradient premium (inspirée de `21st.dev`) à tous les boutons cliquables de l'onglet **Quête** (QuestsTab).

## 🎨 Styles CSS

Les styles CSS sont déjà définis dans `src/index.css`. Les classes suivantes sont disponibles :

- `.gradient-button-premium` : Classe de base
- `.gradient-button-premium-variant` : Variante cyan/blue pour actions secondaires
- `.gradient-button-premium-sm` : Taille petite (pagination, actions discrètes)
- `.gradient-button-premium-md` : Taille moyenne (formulaires, actions principales)
- `.gradient-button-premium-lg` : Taille grande (actions principales importantes)

### Référence CSS

Voir `src/index.css` pour les définitions complètes des `@property` et des classes `.gradient-button-premium*`.

## 🎯 Hiérarchie des couleurs

### Niveau 1 : Actions principales (Purple - par défaut)
- **Utilisation** : Actions principales, création, soumission, validation
- **Classes** : `gradient-button-premium gradient-button-premium-md` (ou `-lg` pour les plus importantes)
- **Exemples** :
  - "Nouvelle quête"
  - "Enregistrer" (dans le popup)
  - "Exporter" (sécurité)
  - "Réinitialiser" (sécurité)

### Niveau 2 : Actions secondaires (Cyan - variant)
- **Utilisation** : Modification, navigation active, annulation, actions de navigation
- **Classes** : `gradient-button-premium gradient-button-premium-md gradient-button-premium-variant`
- **Exemples** :
  - "Annuler" (dans le popup)
  - Navigation sous-onglets (actif)
  - Sélection de période (actif)
  - "Importer" (sécurité)

### Niveau 3 : Actions tertiaires (Purple Small)
- **Utilisation** : Actions discrètes, utilitaires, toggle, suppression
- **Classes** : `gradient-button-premium gradient-button-premium-sm`
- **Exemples** :
  - Boutons d'actions dans le tableau (Activer/Désactiver, Éditer, Dupliquer, Supprimer)
  - Boutons d'actions en lot
  - Boutons de sélection de jours dans le popup
  - Boutons de presets de récurrence

## 📝 Liste des boutons à transformer

### 1. Navigation principale (QuestsTab.jsx)

#### 1.1 Navigation sous-onglets
- **Fichier** : `src/components/tabs/QuestsTab.jsx`
- **Lignes** : ~529-540
- **Boutons** : 5 boutons de navigation
  - "Aujourd'hui"
  - "Cette semaine"
  - "Mes quêtes"
  - "Statistiques"
  - "Sécurité"
- **Transformation** :
  ```jsx
  // Avant
  <button
    onClick={() => setCurrentSubTab(tab.id)}
    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
      currentSubTab === tab.id
        ? 'bg-emerald-400 text-slate-900 border-emerald-300 shadow-lg shadow-emerald-500/30'
        : 'bg-slate-900/40 text-slate-200 border-slate-700 hover:bg-slate-800'
    }`}
  >
    {tab.label}
  </button>

  // Après
  <button
    type="button"
    onClick={() => setCurrentSubTab(tab.id)}
    className={`gradient-button-premium gradient-button-premium-md rounded-lg ${
      currentSubTab === tab.id
        ? 'gradient-button-premium-variant'
        : ''
    }`}
  >
    {tab.label}
  </button>
  ```

### 2. Vue "Mes quêtes" (QuestsTab.jsx)

#### 2.1 Bouton "Nouvelle quête"
- **Fichier** : `src/components/tabs/QuestsTab.jsx`
- **Lignes** : ~556-562
- **Transformation** :
  ```jsx
  // Avant
  <button
    onClick={openNewQuestPopup}
    className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 text-sm font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/50 hover:-translate-y-0.5 transition-all"
  >
    <span>＋</span>
    <span>Nouvelle quête</span>
  </button>

  // Après
  <button
    type="button"
    onClick={openNewQuestPopup}
    className="gradient-button-premium gradient-button-premium-md rounded-lg self-start inline-flex items-center gap-2"
  >
    <span>＋</span>
    <span>Nouvelle quête</span>
  </button>
  ```

#### 2.2 Actions en lot
- **Fichier** : `src/components/tabs/QuestsTab.jsx`
- **Lignes** : ~633-650
- **Boutons** : 3 boutons
  - "Activer"
  - "Désactiver"
  - "Supprimer"
- **Transformation** :
  ```jsx
  // Avant
  <button
    onClick={bulkActivate}
    className="px-2 py-1 rounded-full bg-emerald-500/90 text-slate-900 font-semibold hover:bg-emerald-400"
  >
    Activer
  </button>
  <button
    onClick={bulkDeactivate}
    className="px-2 py-1 rounded-full bg-amber-500/90 text-slate-900 font-semibold hover:bg-amber-400"
  >
    Désactiver
  </button>
  <button
    onClick={bulkDelete}
    className="px-2 py-1 rounded-full bg-rose-600/90 text-slate-50 font-semibold hover:bg-rose-500"
  >
    Supprimer
  </button>

  // Après
  <button
    type="button"
    onClick={bulkActivate}
    className="gradient-button-premium gradient-button-premium-sm rounded-lg"
  >
    Activer
  </button>
  <button
    type="button"
    onClick={bulkDeactivate}
    className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg"
  >
    Désactiver
  </button>
  <button
    type="button"
    onClick={bulkDelete}
    className="gradient-button-premium gradient-button-premium-sm rounded-lg"
  >
    Supprimer
  </button>
  ```

#### 2.3 Boutons d'actions dans le tableau
- **Fichier** : `src/components/tabs/QuestsTab.jsx`
- **Lignes** : ~770-803
- **Boutons** : 4 boutons par quête
  - Activer/Désactiver (toggle)
  - Éditer
  - Dupliquer
  - Supprimer
- **Transformation** :
  ```jsx
  // Avant
  <button
    onClick={() => toggleQuestActive(quest.id)}
    title={quest.active === false ? 'Activer' : 'Désactiver'}
    className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
      quest.active === false
        ? 'bg-emerald-500/90 text-slate-900'
        : 'bg-amber-500/90 text-slate-900'
    }`}
  >
    {quest.active === false ? '▶️' : '⏸️'}
  </button>
  <button
    onClick={() => openEditQuestPopup(quest.id)}
    className="px-2 py-1 rounded-full text-[11px] font-semibold bg-sky-500/90 text-slate-900"
    title="Éditer"
  >
    ✏️
  </button>
  <button
    onClick={() => duplicateQuest(quest.id)}
    className="px-2 py-1 rounded-full text-[11px] font-semibold bg-sky-700/90 text-slate-50"
    title="Dupliquer"
  >
    📋
  </button>
  <button
    onClick={() => deleteQuest(quest.id)}
    className="px-2 py-1 rounded-full text-[11px] font-semibold bg-rose-600/90 text-slate-50"
    title="Supprimer"
  >
    🗑️
  </button>

  // Après
  <button
    type="button"
    onClick={() => toggleQuestActive(quest.id)}
    title={quest.active === false ? 'Activer' : 'Désactiver'}
    className={`gradient-button-premium gradient-button-premium-sm rounded-lg ${
      quest.active === false
        ? ''
        : 'gradient-button-premium-variant'
    }`}
  >
    {quest.active === false ? '▶️' : '⏸️'}
  </button>
  <button
    type="button"
    onClick={() => openEditQuestPopup(quest.id)}
    className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg"
    title="Éditer"
  >
    ✏️
  </button>
  <button
    type="button"
    onClick={() => duplicateQuest(quest.id)}
    className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg"
    title="Dupliquer"
  >
    📋
  </button>
  <button
    type="button"
    onClick={() => deleteQuest(quest.id)}
    className="gradient-button-premium gradient-button-premium-sm rounded-lg"
    title="Supprimer"
  >
    🗑️
  </button>
  ```

### 3. Vue "Statistiques" (QuestsTab.jsx)

#### 3.1 Sélection de période (dans renderStatsView)
- **Fichier** : `src/components/tabs/QuestsTab.jsx`
- **Lignes** : ~1000-1026
- **Boutons** : 6 boutons de période
  - "7 jours"
  - "30 jours"
  - "90 jours"
  - "6 mois"
  - "12 mois"
  - "Tout"
- **Transformation** :
  ```jsx
  // Avant
  <button
    key={p}
    type="button"
    onClick={() => setSelectedPeriod(p)}
    className={`px-2 py-1 rounded-full border text-xs transition-all ${
      selectedPeriod === p
        ? 'bg-emerald-400 text-slate-900 border-emerald-300'
        : 'bg-slate-900/50 text-slate-200 border-slate-700 hover:bg-slate-800'
    }`}
  >
    {labelMap[p]}
  </button>

  // Après
  <button
    key={p}
    type="button"
    onClick={() => setSelectedPeriod(p)}
    className={`gradient-button-premium gradient-button-premium-sm rounded-lg ${
      selectedPeriod === p
        ? 'gradient-button-premium-variant'
        : ''
    }`}
  >
    {labelMap[p]}
  </button>
  ```

**Note** : Le composant `PeriodSelector.jsx` utilise déjà un style similaire mais doit aussi être transformé (voir section 5).

### 4. Vue "Sécurité" (QuestsTab.jsx)

#### 4.1 Bouton "Exporter"
- **Fichier** : `src/components/tabs/QuestsTab.jsx`
- **Lignes** : ~1338-1343
- **Transformation** :
  ```jsx
  // Avant
  <button
    onClick={handleExport}
    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-900 hover:bg-white"
  >
    Exporter
  </button>

  // Après
  <button
    type="button"
    onClick={handleExport}
    className="gradient-button-premium gradient-button-premium-md rounded-lg"
  >
    Exporter
  </button>
  ```

#### 4.2 Bouton "Importer"
- **Fichier** : `src/components/tabs/QuestsTab.jsx`
- **Lignes** : ~1355-1363
- **Transformation** :
  ```jsx
  // Avant
  <label className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-100 hover:bg-slate-700 cursor-pointer">
    Importer
    <input
      type="file"
      accept="application/json"
      onChange={handleImport}
      className="hidden"
    />
  </label>

  // Après
  <label className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg cursor-pointer inline-block">
    Importer
    <input
      type="file"
      accept="application/json"
      onChange={handleImport}
      className="hidden"
    />
  </label>
  ```

#### 4.3 Bouton "Réinitialiser"
- **Fichier** : `src/components/tabs/QuestsTab.jsx`
- **Lignes** : ~1375-1380
- **Transformation** :
  ```jsx
  // Avant
  <button
    onClick={handleReset}
    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-slate-50 hover:bg-rose-500"
  >
    Réinitialiser
  </button>

  // Après
  <button
    type="button"
    onClick={handleReset}
    className="gradient-button-premium gradient-button-premium-md rounded-lg"
  >
    Réinitialiser
  </button>
  ```

### 5. Popup de création/édition (QuestsTab.jsx)

#### 5.1 Bouton "Fermer" (X)
- **Fichier** : `src/components/tabs/QuestsTab.jsx`
- **Lignes** : ~1424-1429
- **Transformation** :
  ```jsx
  // Avant
  <button
    onClick={closeQuestPopup}
    className="text-slate-400 hover:text-slate-100 text-lg"
  >
    ✕
  </button>

  // Après
  <button
    type="button"
    onClick={closeQuestPopup}
    className="gradient-button-premium gradient-button-premium-sm rounded-lg"
  >
    ✕
  </button>
  ```

#### 5.2 Boutons de sélection de jours
- **Fichier** : `src/components/tabs/QuestsTab.jsx`
- **Lignes** : ~1537-1558
- **Boutons** : 7 boutons (Lun, Mar, Mer, Jeu, Ven, Sam, Dim)
- **Transformation** :
  ```jsx
  // Avant
  <button
    key={j.value}
    type="button"
    onClick={() => { /* ... */ }}
    className={`px-2 py-1 rounded-full border ${
      questForm.jours?.includes(Number(j.value))
        ? 'bg-emerald-500/90 border-emerald-300 text-slate-900'
        : 'bg-slate-950 border-slate-700 text-slate-200'
    }`}
  >
    {j.label.slice(0, 3)}
  </button>

  // Après
  <button
    key={j.value}
    type="button"
    onClick={() => { /* ... */ }}
    className={`gradient-button-premium gradient-button-premium-sm rounded-lg ${
      questForm.jours?.includes(Number(j.value))
        ? 'gradient-button-premium-variant'
        : ''
    }`}
  >
    {j.label.slice(0, 3)}
  </button>
  ```

#### 5.3 Boutons de presets de récurrence
- **Fichier** : `src/components/tabs/QuestsTab.jsx`
- **Lignes** : ~1562-1573
- **Boutons** : 3 boutons
  - "Tous les jours"
  - "Semaine"
  - "Week‑end"
- **Transformation** :
  ```jsx
  // Avant
  <button
    key={preset.label}
    type="button"
    onClick={() => setQuestForm((prev) => ({ ...prev, jours: [...preset.jours] }))}
    className="px-2 py-1 rounded-full bg-slate-900 border border-slate-700 hover:bg-slate-800"
  >
    {preset.label}
  </button>

  // Après
  <button
    key={preset.label}
    type="button"
    onClick={() => setQuestForm((prev) => ({ ...prev, jours: [...preset.jours] }))}
    className="gradient-button-premium gradient-button-premium-sm rounded-lg"
  >
    {preset.label}
  </button>
  ```

#### 5.4 Boutons "Annuler" et "Enregistrer"
- **Fichier** : `src/components/tabs/QuestsTab.jsx`
- **Lignes** : ~1604-1615
- **Transformation** :
  ```jsx
  // Avant
  <button
    onClick={closeQuestPopup}
    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700"
  >
    Annuler
  </button>
  <button
    onClick={saveQuestFromForm}
    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-900 hover:bg-emerald-400"
  >
    Enregistrer
  </button>

  // Après
  <button
    type="button"
    onClick={closeQuestPopup}
    className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg"
  >
    Annuler
  </button>
  <button
    type="button"
    onClick={saveQuestFromForm}
    className="gradient-button-premium gradient-button-premium-md rounded-lg"
  >
    Enregistrer
  </button>
  ```

### 6. Vue "Aujourd'hui" (QuestsTodayView.jsx)

#### 6.1 Boutons de validation de quête
- **Fichier** : `src/components/quests/QuestsTodayView.jsx`
- **Lignes** : ~95-104
- **Boutons** : 1 bouton par quête (checkbox-like)
- **Transformation** :
  ```jsx
  // Avant
  <button
    onClick={() => toggleQuestValidation(quest.id, today)}
    className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
      completed
        ? 'bg-emerald-400 border-emerald-300 text-slate-900'
        : 'bg-slate-900 border-slate-600 text-slate-400'
    }`}
  >
    {completed ? '✓' : ''}
  </button>

  // Après
  <button
    type="button"
    onClick={() => toggleQuestValidation(quest.id, today)}
    className={`gradient-button-premium gradient-button-premium-sm rounded-full mt-1 w-5 h-5 flex items-center justify-center text-[10px] ${
      completed
        ? 'gradient-button-premium-variant'
        : ''
    }`}
  >
    {completed ? '✓' : ''}
  </button>
  ```

### 7. Vue "Cette semaine" (QuestsWeekView.jsx)

#### 7.1 Boutons de validation de quête
- **Fichier** : `src/components/quests/QuestsWeekView.jsx`
- **Lignes** : ~116-140
- **Boutons** : 1 bouton par quête par jour
- **Transformation** :
  ```jsx
  // Avant
  <button
    key={quest.id}
    type="button"
    onClick={() => toggleQuestValidation(quest.id, day.date)}
    className={`w-full flex items-center justify-between text-[10px] rounded-lg px-2 py-1 mb-0.5 border ${
      completed
        ? 'bg-emerald-500/15 border-emerald-400/60 text-slate-100'
        : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
    }`}
  >
    {/* ... */}
  </button>

  // Après
  <button
    key={quest.id}
    type="button"
    onClick={() => toggleQuestValidation(quest.id, day.date)}
    className={`gradient-button-premium gradient-button-premium-sm rounded-lg w-full flex items-center justify-between text-[10px] px-2 py-1 mb-0.5 ${
      completed
        ? 'gradient-button-premium-variant'
        : ''
    }`}
  >
    {/* ... */}
  </button>
  ```

### 8. Composant PeriodSelector (PeriodSelector.jsx)

#### 8.1 Boutons de sélection de période
- **Fichier** : `src/components/quests/stats/components/PeriodSelector.jsx`
- **Lignes** : ~23-35
- **Boutons** : 6 boutons
- **Transformation** :
  ```jsx
  // Avant
  <button
    key={period.key}
    type="button"
    onClick={() => onPeriodChange(period.key)}
    className={`px-2 py-1 rounded-full border text-xs transition-all ${
      selectedPeriod === period.key
        ? 'bg-emerald-400 text-slate-900 border-emerald-300 shadow-lg shadow-emerald-500/30'
        : 'bg-slate-900/50 text-slate-200 border-slate-700 hover:bg-slate-800'
    }`}
  >
    <span className="mr-1">{period.icon}</span>
    {period.label}
  </button>

  // Après
  <button
    key={period.key}
    type="button"
    onClick={() => onPeriodChange(period.key)}
    className={`gradient-button-premium gradient-button-premium-sm rounded-lg ${
      selectedPeriod === period.key
        ? 'gradient-button-premium-variant'
        : ''
    }`}
  >
    <span className="mr-1">{period.icon}</span>
    {period.label}
  </button>
  ```

## ✅ Checklist d'implémentation

### Fichiers à modifier

- [ ] `src/components/tabs/QuestsTab.jsx`
  - [ ] Navigation sous-onglets (5 boutons)
  - [ ] Bouton "Nouvelle quête"
  - [ ] Actions en lot (3 boutons)
  - [ ] Boutons d'actions dans le tableau (4 boutons par quête)
  - [ ] Sélection de période dans renderStatsView (6 boutons)
  - [ ] Boutons de sécurité (3 boutons)
  - [ ] Bouton fermer popup (1 bouton)
  - [ ] Boutons de sélection de jours (7 boutons)
  - [ ] Boutons de presets de récurrence (3 boutons)
  - [ ] Boutons "Annuler" et "Enregistrer" (2 boutons)

- [ ] `src/components/quests/QuestsTodayView.jsx`
  - [ ] Boutons de validation de quête (1 par quête)

- [ ] `src/components/quests/QuestsWeekView.jsx`
  - [ ] Boutons de validation de quête (1 par quête par jour)

- [ ] `src/components/quests/stats/components/PeriodSelector.jsx`
  - [ ] Boutons de sélection de période (6 boutons)

### Points d'attention

1. **Boutons checkbox-like** : Les boutons de validation dans `QuestsTodayView` et `QuestsWeekView` sont de petite taille. Utiliser `gradient-button-premium-sm` avec ajustement de la taille si nécessaire.

2. **Boutons dans le tableau** : Les boutons d'actions dans le tableau sont très petits (`text-[11px]`). S'assurer que `gradient-button-premium-sm` fonctionne bien avec cette taille.

3. **Boutons de sélection de jours** : Ces boutons doivent conserver leur état visuel (sélectionné/non sélectionné). Utiliser `gradient-button-premium-variant` pour l'état sélectionné.

4. **Bouton "Importer"** : C'est un `<label>` qui contient un `<input type="file">`. Appliquer les classes gradient au `<label>`.

5. **Navigation sous-onglets** : Utiliser `gradient-button-premium-variant` pour l'onglet actif.

6. **Sélection de période** : Deux endroits utilisent cette fonctionnalité :
   - Dans `renderStatsView` de `QuestsTab.jsx` (lignes ~1000-1026)
   - Dans `PeriodSelector.jsx` (composant réutilisable)
   - Transformer les deux pour cohérence.

## 📊 Résumé des transformations

| Catégorie | Nombre de boutons | Niveau hiérarchique |
|-----------|-------------------|---------------------|
| Navigation sous-onglets | 5 | Niveau 2 (variant si actif) |
| Bouton "Nouvelle quête" | 1 | Niveau 1 |
| Actions en lot | 3 | Niveau 3 |
| Actions tableau (par quête) | 4 | Niveau 3 |
| Sélection période (renderStatsView) | 6 | Niveau 2 (variant si actif) |
| Boutons sécurité | 3 | Niveau 1 (Exporter, Réinitialiser), Niveau 2 (Importer) |
| Popup création/édition | 13 | Mix (voir détails) |
| Validation quêtes (Today) | Variable | Niveau 2 (variant si complété) |
| Validation quêtes (Week) | Variable | Niveau 2 (variant si complété) |
| PeriodSelector | 6 | Niveau 2 (variant si actif) |

**Total estimé** : ~50+ boutons (selon le nombre de quêtes)

## 🎨 Exemples de transformation complets

### Exemple 1 : Navigation sous-onglets

```jsx
// Avant
<button
  onClick={() => setCurrentSubTab(tab.id)}
  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
    currentSubTab === tab.id
      ? 'bg-emerald-400 text-slate-900 border-emerald-300 shadow-lg shadow-emerald-500/30'
      : 'bg-slate-900/40 text-slate-200 border-slate-700 hover:bg-slate-800'
  }`}
>
  {tab.label}
</button>

// Après
<button
  type="button"
  onClick={() => setCurrentSubTab(tab.id)}
  className={`gradient-button-premium gradient-button-premium-md rounded-lg ${
    currentSubTab === tab.id
      ? 'gradient-button-premium-variant'
      : ''
  }`}
>
  {tab.label}
</button>
```

### Exemple 2 : Bouton "Nouvelle quête"

```jsx
// Avant
<button
  onClick={openNewQuestPopup}
  className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 text-sm font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/50 hover:-translate-y-0.5 transition-all"
>
  <span>＋</span>
  <span>Nouvelle quête</span>
</button>

// Après
<button
  type="button"
  onClick={openNewQuestPopup}
  className="gradient-button-premium gradient-button-premium-md rounded-lg self-start inline-flex items-center gap-2"
>
  <span>＋</span>
  <span>Nouvelle quête</span>
</button>
```

### Exemple 3 : Boutons d'actions dans le tableau

```jsx
// Avant
<div className="inline-flex gap-1">
  <button
    onClick={() => toggleQuestActive(quest.id)}
    title={quest.active === false ? 'Activer' : 'Désactiver'}
    className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
      quest.active === false
        ? 'bg-emerald-500/90 text-slate-900'
        : 'bg-amber-500/90 text-slate-900'
    }`}
  >
    {quest.active === false ? '▶️' : '⏸️'}
  </button>
  {/* ... autres boutons ... */}
</div>

// Après
<div className="inline-flex gap-1">
  <button
    type="button"
    onClick={() => toggleQuestActive(quest.id)}
    title={quest.active === false ? 'Activer' : 'Désactiver'}
    className={`gradient-button-premium gradient-button-premium-sm rounded-lg ${
      quest.active === false
        ? ''
        : 'gradient-button-premium-variant'
    }`}
  >
    {quest.active === false ? '▶️' : '⏸️'}
  </button>
  {/* ... autres boutons ... */}
</div>
```

## 🔍 Vérifications post-implémentation

1. ✅ Tous les boutons utilisent `type="button"` (sauf les boutons de formulaire qui doivent rester `type="submit"` si nécessaire)
2. ✅ Les classes `gradient-button-premium` sont appliquées
3. ✅ La hiérarchie des couleurs est respectée
4. ✅ Les états actifs/sélectionnés utilisent `gradient-button-premium-variant`
5. ✅ Les tailles sont appropriées (`-sm`, `-md`, `-lg`)
6. ✅ Les animations au survol fonctionnent
7. ✅ Aucune erreur de lint
8. ✅ Les boutons restent accessibles (aria-labels conservés si présents)

## 📚 Références

- Guide Livres : `docs/GUIDE_BOUTONS_GRADIENT_LIVRES.md`
- Guide Finance : `docs/GUIDE_BOUTONS_GRADIENT_FINANCE.md`
- Guide Apprentissage : `docs/GUIDE_BOUTONS_GRADIENT_APPRENTISSAGE.md`
- Styles CSS : `src/index.css` (section `@layer components`)

