# 🎮 Guide d'Utilisation - Projection Matrix Block

## Comment Tester le Nouveau Bloc

### 1. Démarrer l'Application

```bash
npm run dev
```

### 2. Accéder au Dashboard

Naviguez vers l'onglet **Dashboard** dans votre application.

### 3. Localiser le Bloc

Le bloc **Projection Matrix** se trouve dans le dashboard, généralement en position basse (bloc 23 - PRIORITY-LOW).

---

## 🎯 Fonctionnalités à Tester

### A. Simulateur Temps Réel

**Comment tester:**
1. Localisez la section "⚡ Simulateur Temps Réel"
2. Cliquez sur le bouton "Quêtes Journalières" (affiche X/5)
3. Observez le compteur qui cycle: 0→1→2→3→4→5→0
4. Cliquez sur le bouton "Quêtes Hebdomadaires" (affiche X/3)
5. Observez le compteur qui cycle: 0→1→2→3→0

**Résultat attendu:**
- Les valeurs "XP/Jour" et "Prochain niveau" se mettent à jour automatiquement
- L'efficacité dans les cartes du haut change aussi
- Les transitions sont fluides

### B. Modes IA

**Comment tester:**
1. Localisez la section "🤖 CONTRÔLE IA"
2. Cliquez sur chaque mode:
   - 🛡️ MODE SÉCURISÉ
   - ⚡ MODE OPTIMISTE (actif par défaut)
   - 🔥 MODE EXTRÊME

**Résultat attendu:**
- Le mode sélectionné s'illumine avec une bordure colorée
- Les autres modes s'estompent
- Transition fluide entre les modes

### C. Graphique XP

**Comment tester:**
1. Localisez la section "📈 ÉVOLUTION XP - 30 JOURS"
2. Observez le graphique Canvas avec:
   - Grille de fond
   - Axes X et Y avec labels
   - Courbe bleue cyan
   - Points sur la courbe
   - Point rose pour "Aujourd'hui"

**Résultat attendu:**
- Le graphique est dessiné proprement
- Les métriques en bas affichent: Moyenne, Maximum, Minimum, Aujourd'hui
- Pas d'erreurs dans la console

### D. Graphique des Activités

**Comment tester:**
1. Localisez la section "🎯 ACTIVITÉS VIA QUÊTES"
2. Observez:
   - 3 métriques en haut (Total Quêtes, Streak, Top Activité)
   - Graphique en barres avec 6 activités
   - Couleurs distinctes par activité
   - Valeurs sur les barres
   - Statistiques détaillées en bas
   - 4 tendances mensuelles

**Résultat attendu:**
- Les barres ont des hauteurs différentes
- Chaque activité a sa couleur (Lecture=bleu, Sport=vert, etc.)
- Les pourcentages de variation sont affichés (+25%, -2%, etc.)

### E. Heatmap d'Activité

**Comment tester:**
1. Localisez la section "🔥 ACTIVITÉ MATRIX"
2. Observez:
   - Matrice de 20 lignes (semaines) × 7 colonnes (jours)
   - Labels des jours (L, M, M, J, V, S, D)
   - Numéros de semaine (S16 à S35)
   - Cellules colorées selon l'intensité
3. Survolez une cellule avec la souris

**Résultat attendu:**
- Les cellules ont différentes intensités de couleur
- Un tooltip apparaît au survol avec: "X quêtes - SXX Jour"
- La légende en bas montre les 5 niveaux
- Les métriques affichent: Régularité, Streak, Semaine

---

## 🎨 Effets Visuels à Observer

### 1. Animations
- **Glow d'arrière-plan**: Pulse lentement (4 secondes)
- **Bordures lumineuses**: Brillent en haut et en bas (3 secondes)
- **Neural Link**: Le point vert pulse (2 secondes)
- **Hover**: Les cartes se soulèvent légèrement au survol

### 2. Couleurs
- **Cyan (#06b6d4)**: Couleur principale, graphiques
- **Rose (#ec4899)**: Efficacité, point actuel
- **Vert (#10b981)**: Sport, quêtes journalières
- **Violet (#8b5cf6)**: Apprentissage, quêtes hebdomadaires
- **Bleu (#3b82f6)**: Lecture
- **Orange (#f59e0b)**: Ménage
- **Rouge (#ef4444)**: Santé

### 3. Transitions
- Toutes les interactions ont des transitions fluides (0.3s)
- Les changements de valeurs sont animés
- Les hover effects sont subtils mais visibles

---

## 📱 Test Responsive

### Desktop (>1024px)
- Toutes les sections visibles en grille
- 4 colonnes pour les stats principales
- Layout complet

### Tablet (768-1024px)
- 2 colonnes pour les stats
- Graphiques adaptés
- Tout reste lisible

### Mobile (<768px)
- 1 colonne verticale
- Header en colonne
- Graphiques redimensionnés
- Scrolling vertical

**Comment tester:**
1. Ouvrez les DevTools (F12)
2. Activez le mode responsive
3. Testez différentes tailles: 375px, 768px, 1024px, 1920px

---

## 🐛 Problèmes Potentiels et Solutions

### Problème 1: Le bloc ne s'affiche pas
**Solution:**
- Vérifiez que le CSS est bien importé
- Vérifiez la console pour des erreurs
- Assurez-vous que DashboardTab.jsx importe bien `ProjectionMatrixBlockRefonte`

### Problème 2: Les graphiques Canvas sont vides
**Solution:**
- Vérifiez la console pour des erreurs Canvas
- Assurez-vous que les refs sont bien attachés
- Vérifiez que les données sont passées correctement

### Problème 3: Les animations ne fonctionnent pas
**Solution:**
- Vérifiez que le CSS est chargé
- Vérifiez les keyframes dans projection-matrix-block.css
- Testez dans un navigateur moderne (Chrome, Firefox, Edge)

### Problème 4: Le responsive ne fonctionne pas
**Solution:**
- Vérifiez les media queries dans le CSS
- Testez avec les DevTools en mode responsive
- Assurez-vous que le viewport est configuré

---

## 🔍 Console Debug

### Messages Attendus
Aucun message d'erreur ne devrait apparaître dans la console.

### Messages à Surveiller
- ❌ "Failed to get 2D context" → Problème Canvas
- ❌ "Canvas ref not available" → Problème de ref
- ✅ Aucun message = Tout fonctionne!

---

## 📊 Données Affichées

### Valeurs par Défaut
- **Niveau**: 42
- **XP Total**: 7.9k
- **Quêtes Complétées**: 145
- **Efficacité**: Variable selon simulation
- **Quêtes Journalières**: 3/5 (par défaut)
- **Quêtes Hebdomadaires**: 2/3 (par défaut)

### Calculs Dynamiques
Quand vous changez les compteurs:
- **XP/Jour** = (journalières × 50) + (hebdomadaires × 150 / 7)
- **Prochain niveau** = Jours calculés automatiquement
- **Efficacité** = (XP/jour / 100) × 100, max 100%

---

## 🎯 Checklist de Test

- [ ] Le bloc s'affiche correctement
- [ ] Les 4 cartes de stats sont visibles
- [ ] Le simulateur fonctionne (compteurs cliquables)
- [ ] Les calculs se mettent à jour automatiquement
- [ ] Les 3 modes IA sont sélectionnables
- [ ] Le graphique XP est dessiné
- [ ] Le graphique des activités est visible
- [ ] La heatmap s'affiche avec 20 semaines
- [ ] Les tooltips fonctionnent au survol
- [ ] Les animations sont fluides
- [ ] Le glow d'arrière-plan pulse
- [ ] Les bordures lumineuses brillent
- [ ] Le point neural pulse
- [ ] Le responsive fonctionne (mobile, tablet, desktop)
- [ ] Aucune erreur dans la console

---

## 🚀 Prochaines Actions

### Si Tout Fonctionne
1. ✅ Profitez du nouveau bloc!
2. 📸 Prenez des screenshots pour documentation
3. 🎉 Partagez avec l'équipe

### Si Vous Voulez Personnaliser
1. Modifiez les couleurs dans `projection-matrix-block.css`
2. Ajustez les données dans `ProjectionMatrixBlockRefonte.jsx`
3. Connectez aux vraies données du dashboard

### Si Vous Trouvez des Bugs
1. Vérifiez la console pour les erreurs
2. Testez dans différents navigateurs
3. Consultez la documentation dans `.kiro/specs/projection-matrix-refonte/`

---

## 📚 Documentation Complète

Pour plus de détails, consultez:
- `README.md` - Vue d'ensemble
- `requirements.md` - Exigences détaillées
- `design.md` - Architecture et design
- `tasks.md` - Plan d'implémentation
- `IMPLEMENTATION_COMPLETE.md` - Résumé de l'implémentation
- `MIGRATION_COMPLETE.md` - Détails de la migration
- `INTEGRATION_SUCCESS.md` - Statut de l'intégration

---

## 🎊 Bon Test!

Le bloc Projection Matrix est prêt à impressionner! 🚀✨
