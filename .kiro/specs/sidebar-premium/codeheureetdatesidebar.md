# 📝 CODE COMPLET LIGNE PAR LIGNE - HEURE/DATE & CARTE DÉVELOPPEUR

## 🎯 OBJECTIF DU DOCUMENT

Ce document répertorie **TOUTES** les lignes de code concernées pour l'affichage de l'heure/date et de la carte développeur dans la sidebar QuietQuest, avec des explications détaillées pour chaque module. Il permet de reproduire **trait pour trait** les mêmes éléments.

---

## 📚 TABLE DES MATIÈRES

1. [Module Heure & Date](#module-heure--date)
   - Composant JavaScript (Template HTML)
   - Styles CSS
   - Logique de formatage
   - Intégration

2. [Module Carte Développeur](#module-carte-développeur)
   - Composant JavaScript complet
   - Styles CSS complets
   - Intégration dans la sidebar

3. [Fichiers de Configuration](#fichiers-de-configuration)
   - Imports CSS
   - Chargement des composants
   - Enregistrement Vue

---

# 📦 MODULE HEURE & DATE

## 1️⃣ COMPOSANT JAVASCRIPT - TEMPLATE HTML

**Fichier** : `src/components/sidebar/SidebarComponent.js`

### Lignes 1-3 : Déclaration du composant

```javascript
// ================ COMPOSANT SIDEBAR PREMIUM ================

window.SidebarComponent = {
```

**Explication** :
- Ligne 1 : Commentaire de section
- Ligne 3 : Déclaration du composant Vue 3 en tant que propriété globale `window`
- Permet l'accès au composant depuis n'importe où dans l'application

---

### Lignes 4-5 : Début du template

```javascript
  template: `
    <div class="sidebar-premium">
```

**Explication** :
- Ligne 4 : Début du template Vue (template literal)
- Ligne 5 : Conteneur principal de la sidebar avec classe `.sidebar-premium`
- Cette div englobe tout le contenu de la sidebar

---

### Lignes 6-9 : Section horloge - Conteneurs

```javascript
      <!-- 1. HORLOGE & STATUT GLOBAL - Version Premium -->
      <div class="clock-section">
        <div class="clock-container">
          <!-- Bloc encadré pour heure et date -->
```

**Explication** :
- Ligne 6 : Commentaire HTML pour identifier la section
- Ligne 7 : `.clock-section` - Section fixe en haut (non-scrollable)
- Ligne 8 : `.clock-container` - Conteneur interne pour centrage et layout
- Ligne 9 : Commentaire pour le bloc heure/date

**Rôle CSS** :
- `.clock-section` : Position fixe, background dégradé, bordure inférieure
- `.clock-container` : Flexbox pour centrage vertical

---

### Lignes 10-21 : Bloc heure/date avec 3 couches

```javascript
          <div class="time-date-block">
            <div class="time-display">
              <div class="time-main">{{ formattedTime }}</div>
              <div class="time-shadow">{{ formattedTime }}</div>
              <div class="time-glow">{{ formattedTime }}</div>
            </div>
            <div class="date-display">
              <div class="date-main">{{ formattedDate }}</div>
              <div class="date-shadow">{{ formattedDate }}</div>
              <div class="date-glow">{{ formattedDate }}</div>
            </div>
          </div>
```

**Explication détaillée** :

**Ligne 10** : `.time-date-block`
- Conteneur principal du bloc heure/date
- Bordure dorée 2px, border-radius 15px
- Background dégradé magenta→orange→or
- Box-shadow triple (externe, portée, interne)

**Lignes 11-15** : Affichage de l'heure (3 couches)
- Ligne 11 : `.time-display` - Conteneur de l'heure
- Ligne 12 : `.time-main` - **Couche principale visible** avec dégradé
  - Affiche `{{ formattedTime }}` (ex: "14:32:15")
  - Font-size: 2.4rem (38.4px)
  - Dégradé magenta→orange→or appliqué au texte
  - Z-index: 0 (devant)
- Ligne 13 : `.time-shadow` - **Couche ombre**
  - Même texte que main
  - Position absolute, z-index: -1
  - Opacity: 0.2, blur: 2px
  - Crée l'effet d'ombre
- Ligne 14 : `.time-glow` - **Couche lueur**
  - Même texte que main
  - Position absolute, z-index: -2
  - Opacity: 0.4, blur: 4px
  - Crée l'effet de lueur diffuse

**Lignes 16-20** : Affichage de la date (3 couches)
- Ligne 16 : `.date-display` - Conteneur de la date
- Ligne 17 : `.date-main` - **Couche principale visible**
  - Affiche `{{ formattedDate }}` (ex: "SAMEDI 7 DÉCEMBRE 2024")
  - Font-size: 1rem (16px)
  - Text-transform: uppercase
  - Même dégradé que l'heure
  - Z-index: 0
- Ligne 18 : `.date-shadow` - **Couche ombre**
  - Position absolute, z-index: -1
  - Color: rgba(255, 255, 255, 0.1)
  - Blur: 1px
- Ligne 19 : `.date-glow` - **Couche lueur**
  - Position absolute, z-index: -2
  - Opacity: 0.3, blur: 3.2px
  - Dégradé magenta→orange→or

**Ligne 21** : Fermeture du `.time-date-block`

**Pourquoi 3 couches ?**
- **Main** : Texte net et lisible avec dégradé
- **Shadow** : Crée la profondeur et l'ombre
- **Glow** : Ajoute la lueur cyberpunk diffuse
- **Résultat** : Effet 3D avec profondeur et luminosité

---

### Lignes 23-37 : Intégration de la carte développeur

```javascript
          <!-- Profile Card -->
          <profile-card-component
            :name="user.name || 'zingariello'"
            :title="user.title || 'Développeur'"
            :handle="user.handle || 'zingariello1314'"
            :status="user.status || 'En ligne'"
            :contact-text="'Contacter'"
            :avatar-url="currentProfileImage"
            :main-avatar-id="currentMainAvatarId"
            :mini-avatar-id="currentMiniAvatarId"
            :show-user-info="true"
            :enable-tilt="true"
            :enable-mobile-tilt="false"
            @contact-click="handleProfileContact"
          />
```

**Explication détaillée** :

**Ligne 23** : Commentaire HTML

**Ligne 24** : Balise du composant `<profile-card-component>`
- Composant Vue 3 autonome
- Défini dans `src/components/layout/ProfileCardComponent.js`

**Props passées au composant** :

**Ligne 25** : `:name="user.name || 'zingariello'"`
- Nom de l'utilisateur affiché sur la carte
- Valeur par défaut : 'zingariello'
- Binding dynamique avec `:`

**Ligne 26** : `:title="user.title || 'Développeur'"`
- Titre/profession de l'utilisateur
- Valeur par défaut : 'Développeur'
- Affiché sous le nom

**Ligne 27** : `:handle="user.handle || 'zingariello1314'"`
- Handle/pseudo de l'utilisateur (avec @)
- Valeur par défaut : 'zingariello1314'
- Affiché dans la mini-user-info

**Ligne 28** : `:status="user.status || 'En ligne'"`
- Statut de connexion
- Valeur par défaut : 'En ligne'
- Peut être 'En ligne' ou 'Hors ligne'

**Ligne 29** : `:contact-text="'Contacter'"`
- Texte du bouton de contact
- Valeur statique : 'Contacter'

**Ligne 30** : `:avatar-url="currentProfileImage"`
- URL de l'image de profil
- Variable computed depuis `src/core/computed.js`
- Valeur par défaut : 'photodeprofil.png'

**Ligne 31** : `:main-avatar-id="currentMainAvatarId"`
- ID de l'avatar principal dans IndexedDB
- Permet de charger l'image depuis la base de données locale

**Ligne 32** : `:mini-avatar-id="currentMiniAvatarId"`
- ID du mini-avatar dans IndexedDB
- Utilisé pour la mini-user-info en bas de la carte

**Ligne 33** : `:show-user-info="true"`
- Affiche ou cache la section mini-user-info
- Valeur : true (affichée)

**Ligne 34** : `:enable-tilt="true"`
- Active l'effet tilt 3D au survol de la souris
- Valeur : true (activé)

**Ligne 35** : `:enable-mobile-tilt="false"`
- Active l'effet tilt sur mobile (gyroscope)
- Valeur : false (désactivé pour mobile)

**Ligne 36** : `@contact-click="handleProfileContact"`
- Événement émis quand on clique sur le bouton contact
- Méthode handler : `handleProfileContact`

**Ligne 37** : Fermeture de la balise `</profile-card-component>`

---

### Lignes 39-57 : Statuts système

```javascript
          <!-- Statuts système avancés -->
          <div class="system-status">
            <div class="status-item active">
              <div class="status-dot"></div>
              <span>SYSTÈME ACTIF</span>
            </div>
            <div class="status-item night">
              <span class="status-icon">🌙</span>
              <span>MODE NUIT</span>
            </div>
            <div class="status-item connected">
              <span class="status-icon">📶</span>
              <span>CONNECTÉ</span>
            </div>
            <div class="status-item focus">
              <span class="status-icon">🔋</span>
              <span>FOCUS 87%</span>
            </div>
          </div>
```

**Explication** :

**Ligne 40** : `.system-status`
- Grille 2x2 des statuts système
- Display: grid, grid-template-columns: 1fr 1fr
- Gap: 8px

**Lignes 41-45** : Statut "Système Actif"
- Classe : `.status-item.active`
- Couleur : Vert (#22c55e)
- Icône : Point pulsant (`.status-dot`)
- Animation : pulse-dot 2s infinite

**Lignes 46-49** : Statut "Mode Nuit"
- Classe : `.status-item.night`
- Couleur : Bleu (#3b82f6)
- Icône : 🌙 (emoji lune)

**Lignes 50-53** : Statut "Connecté"
- Classe : `.status-item.connected`
- Couleur : Violet (#a855f7)
- Icône : 📶 (emoji signal)

**Lignes 54-57** : Statut "Focus"
- Classe : `.status-item.focus`
- Couleur : Vert (#22c55e)
- Icône : 🔋 (emoji batterie)
- Texte : "FOCUS 87%" (pourcentage dynamique)

---

### Résumé du template heure/date

**Structure complète** :
```
sidebar-premium
└── clock-section (fixe, non-scrollable)
    └── clock-container
        ├── time-date-block (bloc encadré)
        │   ├── time-display (heure)
        │   │   ├── time-main (visible)
        │   │   ├── time-shadow (ombre)
        │   │   └── time-glow (lueur)
        │   └── date-display (date)
        │       ├── date-main (visible)
        │       ├── date-shadow (ombre)
        │       └── date-glow (lueur)
        ├── profile-card-component (carte 3D)
        └── system-status (grille 2x2)
            ├── status-item.active
            ├── status-item.night
            ├── status-item.connected
            └── status-item.focus
```


---

## 2️⃣ LOGIQUE DE FORMATAGE - COMPUTED PROPERTIES

**Fichier** : `src/core/computed.js`

### Lignes 1-6 : Déclaration du module

```javascript
// ================ QUIETQUEST - PROPRIÉTÉS CALCULÉES ================

window.AppComputed = {
  createAppComputed(state) {
    const { computed } = Vue;

    return {
```

**Explication** :
- Ligne 1 : Commentaire de section
- Ligne 3 : Déclaration du module global `AppComputed`
- Ligne 4 : Fonction factory qui crée les computed properties
- Ligne 5 : Destructuration de `computed` depuis Vue 3
- Ligne 7 : Retour de l'objet contenant toutes les computed properties

---

### Lignes 9-16 : Formatage de l'heure

```javascript
      // ================ TEMPS FORMATÉ ================
      formattedTime: computed(() => {
        return state.currentTime.value.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }),
```

**Explication détaillée** :

**Ligne 9** : Commentaire de section

**Ligne 10** : `formattedTime: computed(() => {`
- Propriété computed Vue 3
- Réactive : se met à jour automatiquement quand `state.currentTime` change
- Retourne une chaîne de caractères formatée

**Ligne 11** : `return state.currentTime.value.toLocaleTimeString('fr-FR', {`
- `state.currentTime.value` : Objet Date JavaScript
- `.toLocaleTimeString()` : Méthode native JavaScript
- `'fr-FR'` : Locale française (format français)

**Options de formatage** :
- **Ligne 12** : `hour: '2-digit'` → Heure sur 2 chiffres (ex: 09, 14)
- **Ligne 13** : `minute: '2-digit'` → Minutes sur 2 chiffres (ex: 05, 32)
- **Ligne 14** : `second: '2-digit'` → Secondes sur 2 chiffres (ex: 07, 45)

**Résultat** : "14:32:15" (format HH:MM:SS)

**Note** : Pas de `hour12: false` ici, mais le format 24h est implicite avec 'fr-FR'

---

### Lignes 18-25 : Formatage de la date

```javascript
      formattedDate: computed(() => {
        return state.currentTime.value.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }),
```

**Explication détaillée** :

**Ligne 18** : `formattedDate: computed(() => {`
- Propriété computed Vue 3
- Réactive : se met à jour automatiquement

**Ligne 19** : `return state.currentTime.value.toLocaleDateString('fr-FR', {`
- `.toLocaleDateString()` : Méthode native JavaScript
- `'fr-FR'` : Locale française

**Options de formatage** :
- **Ligne 20** : `weekday: 'long'` → Jour complet (ex: "samedi", "lundi")
- **Ligne 21** : `year: 'numeric'` → Année complète (ex: 2024)
- **Ligne 22** : `month: 'long'` → Mois complet (ex: "décembre", "janvier")
- **Ligne 23** : `day: 'numeric'` → Jour du mois (ex: 7, 15)

**Résultat brut** : "samedi 7 décembre 2024"

**Note** : Le template applique `.toUpperCase()` dans le composant pour obtenir :
"SAMEDI 7 DÉCEMBRE 2024"

---

### Lignes 59-63 : Image de profil

```javascript
      // ================ IMAGE DE PROFIL ACTUELLE ================
      currentProfileImage: computed(() => {
        // Utiliser l'image par défaut pour l'instant
        // Le ProfileCardComponent gère ses propres images depuis IndexedDB
        return 'photodeprofil.png';
      }),
```

**Explication** :

**Ligne 60** : `currentProfileImage: computed(() => {`
- Computed property pour l'image de profil
- Utilisée par la carte développeur

**Lignes 61-62** : Commentaires
- Le ProfileCardComponent gère lui-même le chargement depuis IndexedDB
- Cette valeur est un fallback

**Ligne 63** : `return 'photodeprofil.png';`
- Image par défaut
- Fichier situé à la racine du projet

**Note** : Le ProfileCardComponent a sa propre logique pour charger les images depuis IndexedDB via `ProfileImageManager`

---

### Résumé du formatage

**Flux de données** :
```
state.currentTime (Date object)
    ↓
formattedTime computed → "14:32:15"
    ↓
Template {{ formattedTime }}
    ↓
Affiché dans .time-main, .time-shadow, .time-glow

state.currentTime (Date object)
    ↓
formattedDate computed → "samedi 7 décembre 2024"
    ↓
Template {{ formattedDate }}
    ↓
Affiché dans .date-main, .date-shadow, .date-glow
```

**Mise à jour** :
- `state.currentTime` est mis à jour toutes les secondes
- Les computed properties se recalculent automatiquement
- Le template se met à jour automatiquement (réactivité Vue)


---

## 3️⃣ STYLES CSS - HEURE & DATE

**Fichier** : `src/styles/components/sidebar.css`

### Lignes 96-115 : Conteneur principal (.time-date-block)

```css
.time-date-block {
  background: linear-gradient(135deg, 
    rgba(255, 20, 147, 0.15) 0%,
    rgba(255, 140, 0, 0.1) 50%,
    rgba(255, 215, 0, 0.15) 100%);
  border: 2px solid #ffd700;
  border-radius: 15px;
  padding: 12px 15px;
  margin: 70px 0 45px 0;
  position: relative;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 0 20px rgba(255, 215, 0, 0.3),
    0 4px 15px rgba(255, 215, 0, 0.2),
    inset 0 0 20px rgba(255, 215, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
}
```

**Explication ligne par ligne** :

**Ligne 96** : Sélecteur `.time-date-block`

**Lignes 97-100** : `background: linear-gradient(135deg, ...)`
- **Angle** : 135deg (diagonal haut-gauche vers bas-droite)
- **Stop 1 (0%)** : `rgba(255, 20, 147, 0.15)` - Magenta semi-transparent
- **Stop 2 (50%)** : `rgba(255, 140, 0, 0.1)` - Orange semi-transparent
- **Stop 3 (100%)** : `rgba(255, 215, 0, 0.15)` - Or semi-transparent
- **Effet** : Dégradé diagonal avec les 3 couleurs signature

**Ligne 101** : `border: 2px solid #ffd700;`
- Bordure dorée de 2px
- Couleur : #ffd700 (or pur)
- Style : solid (ligne continue)

**Ligne 102** : `border-radius: 15px;`
- Coins arrondis de 15px
- Appliqué aux 4 coins

**Ligne 103** : `padding: 12px 15px;`
- Padding vertical : 12px (haut et bas)
- Padding horizontal : 15px (gauche et droite)
- Espace intérieur du bloc

**Ligne 104** : `margin: 70px 0 45px 0;`
- Margin top : 70px (espace pour le laser au-dessus)
- Margin right : 0
- Margin bottom : 45px (espace pour la carte développeur en dessous)
- Margin left : 0

**Ligne 105** : `position: relative;`
- Permet le positionnement absolu des enfants (shadow, glow)
- Crée un contexte de positionnement

**Ligne 106** : `backdrop-filter: blur(10px);`
- Effet glassmorphism
- Floute l'arrière-plan visible à travers l'élément
- Valeur : 10px de flou

**Lignes 107-110** : `box-shadow: ...` (3 ombres)
- **Ombre 1** : `0 0 20px rgba(255, 215, 0, 0.3)` - Lueur externe dorée
  - Offset X : 0, Offset Y : 0
  - Blur : 20px
  - Couleur : Or avec 30% d'opacité
- **Ombre 2** : `0 4px 15px rgba(255, 215, 0, 0.2)` - Ombre portée
  - Offset X : 0, Offset Y : 4px (vers le bas)
  - Blur : 15px
  - Couleur : Or avec 20% d'opacité
- **Ombre 3** : `inset 0 0 20px rgba(255, 215, 0, 0.1)` - Lueur interne
  - Mot-clé `inset` : ombre à l'intérieur
  - Blur : 20px
  - Couleur : Or avec 10% d'opacité

**Ligne 111** : `display: flex;`
- Layout flexbox
- Permet l'alignement des enfants

**Ligne 112** : `flex-direction: column;`
- Direction verticale
- Heure au-dessus, date en dessous

**Ligne 113** : `justify-content: center;`
- Centre verticalement le contenu

---

### Lignes 117-122 : Conteneur heure (.time-display)

```css
.time-display {
  position: relative;
  margin-bottom: 0.5rem;
  padding: 0 0.625rem;
  min-width: 12.5rem;
}
```

**Explication** :

**Ligne 118** : `position: relative;`
- Contexte de positionnement pour shadow et glow

**Ligne 119** : `margin-bottom: 0.5rem;`
- 0.5rem = 8px
- Espace entre l'heure et la date

**Ligne 120** : `padding: 0 0.625rem;`
- 0.625rem = 10px
- Padding horizontal uniquement

**Ligne 121** : `min-width: 12.5rem;`
- 12.5rem = 200px
- Largeur minimale pour éviter le rétrécissement

---

### Lignes 124-137 : Texte principal heure (.time-main)

```css
.time-main {
  font-family: 'Tanker', 'Rajdhani', sans-serif;
  font-size: 2.4rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  background: linear-gradient(180deg,
    #ff1493 0%,
    #ff8c00 50%,
    #ffd700 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 1.25rem rgba(255, 20, 147, 0.4);
  line-height: 1.1;
  white-space: nowrap;
  overflow: visible;
  margin: 0;
}
```

**Explication détaillée** :

**Ligne 125** : `font-family: 'Tanker', 'Rajdhani', sans-serif;`
- Police 1 : 'Tanker' (cyberpunk, futuriste)
- Police 2 : 'Rajdhani' (fallback moderne)
- Police 3 : sans-serif (fallback système)

**Ligne 126** : `font-size: 2.4rem;`
- 2.4rem = 38.4px (avec base 16px)
- Très grande taille pour l'heure

**Ligne 127** : `font-weight: 400;`
- Poids Regular (normal)

**Ligne 128** : `letter-spacing: 0.02em;`
- Espacement entre caractères : 2% de la taille de police
- Légèrement espacé

**Lignes 129-132** : `background: linear-gradient(180deg, ...)`
- **Angle** : 180deg (vertical, haut vers bas)
- **Stop 1 (0%)** : #ff1493 (Magenta en haut)
- **Stop 2 (50%)** : #ff8c00 (Orange au milieu)
- **Stop 3 (100%)** : #ffd700 (Or en bas)
- **Dégradé signature** QuietQuest

**Ligne 133** : `background-clip: text;`
- Applique le dégradé au texte lui-même
- Standard CSS

**Ligne 134** : `-webkit-background-clip: text;`
- Version préfixée pour Safari/Chrome
- Nécessaire pour la compatibilité

**Ligne 135** : `-webkit-text-fill-color: transparent;`
- Rend le texte transparent
- Permet de voir le dégradé en arrière-plan
- Le dégradé devient la couleur du texte

**Ligne 136** : `text-shadow: 0 0 1.25rem rgba(255, 20, 147, 0.4);`
- Offset X : 0, Offset Y : 0
- Blur : 1.25rem = 20px
- Couleur : Magenta avec 40% d'opacité
- Crée une lueur magenta autour du texte

**Ligne 137** : `line-height: 1.1;`
- Hauteur de ligne : 110% de la taille de police
- Compact

**Ligne 138** : `white-space: nowrap;`
- Empêche le retour à la ligne
- L'heure reste sur une seule ligne

**Ligne 139** : `overflow: visible;`
- Permet aux effets de déborder

**Ligne 140** : `margin: 0;`
- Pas de marge externe


---

### Lignes 142-158 : Ombre heure (.time-shadow)

```css
.time-shadow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  font-family: 'Tanker', 'Rajdhani', sans-serif;
  font-size: 2.6rem;
  font-weight: 400;
  letter-spacing: 0.05em;
  background: linear-gradient(180deg,
    #ff1493 0%,
    #ff8c00 50%,
    #ffd700 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  opacity: 0.2;
  filter: blur(0.125rem);
  z-index: -1;
}
```

**Explication** :

**Ligne 143** : `position: absolute;`
- Positionnement absolu par rapport à `.time-display`
- Superposé au texte principal

**Lignes 144-146** : Positionnement
- `top: 0;` - Aligné en haut
- `left: 0;` - Aligné à gauche
- `right: 0;` - Étiré jusqu'à droite
- Couvre exactement la même zone que `.time-main`

**Ligne 148** : `font-size: 2.6rem;`
- 2.6rem = 41.6px
- **Plus grand** que `.time-main` (2.4rem)
- Crée un effet de débordement pour l'ombre

**Ligne 150** : `letter-spacing: 0.05em;`
- 5% de la taille de police
- **Plus espacé** que `.time-main` (0.02em)
- Effet de diffusion

**Lignes 151-154** : Même dégradé que `.time-main`
- Magenta → Orange → Or

**Lignes 155-157** : Application du dégradé au texte
- Identique à `.time-main`

**Ligne 158** : `opacity: 0.2;`
- 20% d'opacité
- Très transparent
- Crée l'effet d'ombre subtile

**Ligne 159** : `filter: blur(0.125rem);`
- 0.125rem = 2px de flou
- Adoucit l'ombre

**Ligne 160** : `z-index: -1;`
- Derrière `.time-main` (z-index: 0 par défaut)
- Devant `.time-glow` (z-index: -2)

---

### Lignes 163-179 : Lueur heure (.time-glow)

```css
.time-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  font-family: 'Tanker', 'Rajdhani', sans-serif;
  font-size: 2.6rem;
  font-weight: 400;
  letter-spacing: 0.05em;
  background: linear-gradient(180deg,
    #ff1493 0%,
    #ff8c00 50%,
    #ffd700 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  opacity: 0.4;
  filter: blur(0.25rem);
  z-index: -2;
}
```

**Explication** :

**Lignes 164-168** : Positionnement
- Identique à `.time-shadow`
- Position absolute, couvre toute la zone

**Lignes 169-177** : Typographie et dégradé
- Identique à `.time-shadow`
- Font-size: 2.6rem (plus grand que main)
- Même dégradé magenta→orange→or

**Ligne 178** : `opacity: 0.4;`
- 40% d'opacité
- **Plus opaque** que `.time-shadow` (0.2)
- Crée une lueur plus visible

**Ligne 179** : `filter: blur(0.25rem);`
- 0.25rem = 4px de flou
- **Plus flouté** que `.time-shadow` (2px)
- Crée l'effet de lueur diffuse

**Ligne 180** : `z-index: -2;`
- **Tout au fond** de la pile
- Derrière shadow (-1) et main (0)

**Résultat des 3 couches** :
```
Vue de face:
┌─────────────┐
│  14:32:15   │  ← time-main (net, dégradé visible)
└─────────────┘

Vue de profondeur:
        time-main (z: 0)
      time-shadow (z: -1, blur: 2px, opacity: 0.2)
    time-glow (z: -2, blur: 4px, opacity: 0.4)

Effet final: Texte avec profondeur 3D et lueur cyberpunk
```

---

### Lignes 182-187 : Conteneur date (.date-display)

```css
.time-date-block .date-display {
  position: relative;
  margin-bottom: 0;
  margin-top: 0;
  padding: 0 0.625rem;
  text-align: center;
}
```

**Explication** :

**Ligne 182** : Sélecteur `.time-date-block .date-display`
- Sélecteur descendant
- Cible uniquement les `.date-display` dans `.time-date-block`

**Ligne 183** : `position: relative;`
- Contexte pour shadow et glow

**Lignes 184-185** : Marges
- `margin-bottom: 0;` - Collé au bas du bloc
- `margin-top: 0;` - Pas d'espace supplémentaire

**Ligne 186** : `padding: 0 0.625rem;`
- 0.625rem = 10px horizontal
- Identique à `.time-display`

**Ligne 187** : `text-align: center;`
- Centre le texte horizontalement

---

### Lignes 189-202 : Texte principal date (.date-main)

```css
.date-main {
  font-family: 'Tanker', 'Rajdhani', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: linear-gradient(180deg,
    #ff1493 0%,
    #ff8c00 50%,
    #ffd700 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 0.8rem rgba(255, 20, 147, 0.3);
}
```

**Explication** :

**Ligne 190** : `font-family: 'Tanker', 'Rajdhani', sans-serif;`
- Mêmes polices que l'heure

**Ligne 191** : `font-size: 1rem;`
- 1rem = 16px
- **Beaucoup plus petit** que l'heure (2.4rem)

**Ligne 193** : `letter-spacing: 0.1em;`
- 10% de la taille de police
- **Très espacé** (vs 0.02em pour l'heure)
- Donne un aspect aéré

**Ligne 194** : `text-transform: uppercase;`
- **TOUT EN MAJUSCULES**
- "samedi 7 décembre 2024" → "SAMEDI 7 DÉCEMBRE 2024"

**Lignes 195-199** : Dégradé
- Identique à l'heure
- Magenta → Orange → Or

**Lignes 200-202** : Application du dégradé
- Identique à l'heure

**Ligne 203** : `text-shadow: 0 0 0.8rem rgba(255, 20, 147, 0.3);`
- Blur : 0.8rem = 12.8px
- Couleur : Magenta avec 30% d'opacité
- **Moins intense** que l'heure (20px, 40%)

---

### Lignes 205-215 : Ombre date (.date-shadow)

```css
.date-shadow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  font-family: 'Tanker', 'Rajdhani', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.1);
  filter: blur(0.0625rem);
  z-index: -1;
}
```

**Explication** :

**Lignes 206-210** : Positionnement et typographie
- Position absolute
- Mêmes propriétés que `.date-main`

**Ligne 215** : `color: rgba(255, 255, 255, 0.1);`
- **Différence importante** : Pas de dégradé ici
- Couleur simple : Blanc avec 10% d'opacité
- Très subtil

**Ligne 216** : `filter: blur(0.0625rem);`
- 0.0625rem = 1px de flou
- **Très léger** (vs 2px pour l'heure)

**Ligne 217** : `z-index: -1;`
- Derrière `.date-main`

---

### Lignes 219-233 : Lueur date (.date-glow)

```css
.date-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  font-family: 'Tanker', 'Rajdhani', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: linear-gradient(180deg,
    #ff1493 0%,
    #ff8c00 50%,
    #ffd700 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  opacity: 0.3;
  filter: blur(0.2rem);
  z-index: -2;
}
```

**Explication** :

**Lignes 220-229** : Positionnement et typographie
- Identique à `.date-main`

**Lignes 230-234** : Dégradé
- **Retour du dégradé** magenta→orange→or
- Appliqué au texte

**Ligne 235** : `opacity: 0.3;`
- 30% d'opacité
- **Moins opaque** que l'heure (0.4)

**Ligne 236** : `filter: blur(0.2rem);`
- 0.2rem = 3.2px de flou
- **Moins flouté** que l'heure (4px)

**Ligne 237** : `z-index: -2;`
- Tout au fond

**Résumé date** :
- Main : Dégradé net, uppercase
- Shadow : Blanc transparent, blur 1px
- Glow : Dégradé flouté, blur 3.2px


---

# 👤 MODULE CARTE DÉVELOPPEUR

## 4️⃣ COMPOSANT PROFILECARDCOMPONENT

**Fichier** : `src/components/layout/ProfileCardComponent.js`

### Vue d'ensemble du composant

Le ProfileCardComponent est un composant Vue 3 autonome qui crée une carte 3D interactive avec effet tilt au survol de la souris.

### Structure du template (lignes 4-56)

```javascript
window.ProfileCardComponent = {
  template: `
    <div ref="wrapRef" :class="\`pc-card-wrapper \${className}\`" :style="cardStyle">
      <section ref="cardRef" class="pc-card">
        <div class="pc-inside">
          <!-- IMAGES EN COULEUR -->
          <div class="pc-images-layer">
            <img class="main-avatar" :src="currentMainAvatar || avatarUrl" />
            <div v-if="showUserInfo" class="mini-user-info">
              <img class="mini-avatar" :src="currentMiniAvatar" />
              <div class="mini-user-text">
                <div class="mini-handle">@{{ handle }}</div>
                <div class="mini-status">{{ status }}</div>
              </div>
            </div>
          </div>
          
          <!-- EFFETS HOLOGRAPHIQUES -->
          <div class="pc-shine" />
          <div class="pc-glare" />
          
          <!-- TEXTES -->
          <div class="pc-content">
            <h3>{{ name }}</h3>
            <p>{{ title }}</p>
          </div>
        </div>
      </section>
    </div>
  `,
```

**Hiérarchie** :
```
pc-card-wrapper (conteneur avec perspective)
└── pc-card (carte avec transform 3D)
    └── pc-inside (contenu interne)
        ├── pc-images-layer (couche images)
        │   ├── main-avatar (avatar principal)
        │   └── mini-user-info (infos utilisateur)
        │       ├── mini-avatar (mini photo)
        │       └── mini-user-text
        │           ├── mini-handle (@username)
        │           └── mini-status (En ligne/Hors ligne)
        ├── pc-shine (effet brillance)
        ├── pc-glare (effet éblouissement)
        └── pc-content (texte principal)
            ├── h3 (nom)
            └── p (titre)
```

### Props principales (lignes 58-100)

```javascript
props: {
  name: String,              // Nom utilisateur
  title: String,             // Titre/profession
  handle: String,            // @username
  status: String,            // En ligne/Hors ligne
  avatarUrl: String,         // URL avatar par défaut
  mainAvatarId: String,      // ID IndexedDB avatar principal
  miniAvatarId: String,      // ID IndexedDB mini avatar
  showUserInfo: Boolean,     // Afficher mini-user-info
  enableTilt: Boolean,       // Activer effet 3D
  enableMobileTilt: Boolean, // Activer sur mobile
  className: String          // Classes CSS additionnelles
}
```

### Logique de l'effet Tilt 3D

**Fonction updateCardTransform** (simplifié) :
```javascript
const updateCardTransform = (offsetX, offsetY, card, wrap) => {
  // Calcul du centre
  const centerX = offsetX - (wrap.offsetWidth / 2);
  const centerY = offsetY - (wrap.offsetHeight / 2);
  
  // Calcul des rotations
  const rotateX = (centerY / (wrap.offsetHeight / 2)) * (centerX / 5);
  const rotateY = (centerX / (wrap.offsetWidth / 2)) * (centerY / 4);
  
  // Application des variables CSS
  wrap.style.setProperty('--pointer-x', `${percentX}%`);
  wrap.style.setProperty('--pointer-y', `${percentY}%`);
  wrap.style.setProperty('--rotate-x', `${rotateX}deg`);
  wrap.style.setProperty('--rotate-y', `${rotateY}deg`);
  
  // Application du transform 3D
  card.style.transform = `
    rotateX(${rotateX}deg) 
    rotateY(${rotateY}deg) 
    scale3d(1, 1, 1)
  `;
};
```

**Événements** :
- `mousemove` : Met à jour la rotation en temps réel
- `mouseleave` : Réinitialise la carte (rotation 0)
- `mouseenter` : Active l'effet

### Chargement des avatars depuis IndexedDB

```javascript
const loadAvatars = async () => {
  if (props.mainAvatarId) {
    const mainImg = await ProfileImageManager.getImage(props.mainAvatarId);
    if (mainImg) currentMainAvatar.value = mainImg.dataUrl;
  }
  
  if (props.miniAvatarId) {
    const miniImg = await ProfileImageManager.getImage(props.miniAvatarId);
    if (miniImg) currentMiniAvatar.value = miniImg.dataUrl;
  }
};
```

---

## 5️⃣ STYLES CSS - CARTE DÉVELOPPEUR

**Fichier** : `src/styles/components/ProfileCardComponent.css`

### Styles principaux

```css
/* Conteneur avec perspective 3D */
.pc-card-wrapper {
  perspective: 1000px;
  transform-style: preserve-3d;
  width: 100%;
  max-width: 300px;
  margin: 2.8rem auto;
}

/* Carte principale avec transform 3D */
.pc-card {
  transform-style: preserve-3d;
  transition: transform 600ms cubic-bezier(0.23, 1, 0.32, 1);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
}

/* Avatar principal */
.main-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 16px;
  transition: opacity 0.4s, transform 0.4s;
}

/* Mini infos utilisateur */
.mini-user-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Mini avatar */
.mini-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 215, 0, 0.5);
}

/* Handle et statut */
.mini-handle {
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffd700;
}

.mini-status {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
}

/* Effets holographiques */
.pc-shine {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    farthest-side circle at var(--pointer-x) var(--pointer-y),
    rgba(255, 255, 255, 0.8),
    transparent
  );
  opacity: 0;
  mix-blend-mode: overlay;
  transition: opacity 0.3s;
}

.pc-card:hover .pc-shine {
  opacity: 0.3;
}

.pc-glare {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    calc(var(--rotate-y) * -1deg),
    rgba(255, 255, 255, 0.5),
    transparent 50%
  );
  opacity: 0;
  mix-blend-mode: soft-light;
}

.pc-card:hover .pc-glare {
  opacity: 0.5;
}

/* Texte principal */
.pc-content {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  z-index: 10;
}

.pc-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  margin: 0 0 8px 0;
}

.pc-content p {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.5);
  margin: 0;
}
```

---

## 6️⃣ INTÉGRATION & CONFIGURATION

### Fichier : `src/app-modular.js`

**Passage des props à la sidebar** (lignes 24-30) :
```javascript
<sidebar-component
  :formatted-time="formattedTime"
  :formatted-date="formattedDate"
  :user="user"
  :current-profile-image="currentProfileImage"
  :current-main-avatar-id="currentMainAvatarId"
  :current-mini-avatar-id="currentMiniAvatarId"
  ...
/>
```

**Enregistrement des composants** (lignes 289-293) :
```javascript
if (window.SidebarComponent) {
  QuietQuestApp.component('sidebar-component', window.SidebarComponent);
}
if (window.ProfileCardComponent) {
  QuietQuestApp.component('profile-card-component', window.ProfileCardComponent);
}
```

### Fichier : `src/styles/main.css`

**Imports CSS** (lignes 17-18) :
```css
@import './components/sidebar.css';
@import './components/ProfileCardComponent.css';
```

### Fichier : `src/loader.js`

**Chargement des composants** (ligne 26) :
```javascript
'src/components/layout/ProfileCardComponent.js',
```

---

## 📊 RÉCAPITULATIF COMPLET

### Flux de données - Heure & Date

```
1. Timer (setInterval 1000ms)
   ↓
2. state.currentTime mis à jour (Date object)
   ↓
3. Computed properties recalculées
   - formattedTime → "14:32:15"
   - formattedDate → "samedi 7 décembre 2024"
   ↓
4. Props passées au SidebarComponent
   ↓
5. Template Vue affiche {{ formattedTime }} et {{ formattedDate }}
   ↓
6. 3 couches HTML pour chaque (main, shadow, glow)
   ↓
7. CSS applique les styles
   - Dégradé magenta→orange→or
   - Effets de profondeur (blur, opacity, z-index)
   - Box-shadow et text-shadow
   ↓
8. Rendu final : Heure et date avec effet 3D cyberpunk
```

### Flux de données - Carte Développeur

```
1. Props passées depuis app-modular.js
   - name, title, handle, status
   - avatarUrl, mainAvatarId, miniAvatarId
   ↓
2. ProfileCardComponent monté
   ↓
3. Chargement des avatars depuis IndexedDB
   - ProfileImageManager.getImage()
   - currentMainAvatar et currentMiniAvatar mis à jour
   ↓
4. Template affiche les images et textes
   ↓
5. Event listeners ajoutés (mousemove, mouseleave)
   ↓
6. Au survol : updateCardTransform()
   - Calcul des rotations X et Y
   - Variables CSS mises à jour
   - Transform 3D appliqué
   ↓
7. CSS applique les styles
   - Perspective 3D
   - Effets holographiques (shine, glare)
   - Backdrop-filter
   ↓
8. Rendu final : Carte 3D interactive avec effet tilt
```

---

## ✅ CHECKLIST DE REPRODUCTION

### Pour l'heure/date

- [ ] Créer le template HTML avec 3 couches (main, shadow, glow)
- [ ] Implémenter les computed properties (formattedTime, formattedDate)
- [ ] Appliquer les styles CSS au conteneur (.time-date-block)
- [ ] Appliquer les styles aux couches principales (.time-main, .date-main)
- [ ] Appliquer les styles aux ombres (.time-shadow, .date-shadow)
- [ ] Appliquer les styles aux lueurs (.time-glow, .date-glow)
- [ ] Configurer le dégradé magenta→orange→or
- [ ] Configurer les box-shadow et text-shadow
- [ ] Passer les props au composant
- [ ] Importer les styles CSS

### Pour la carte développeur

- [ ] Créer le composant ProfileCardComponent
- [ ] Implémenter le template avec hiérarchie correcte
- [ ] Ajouter les props (name, title, handle, etc.)
- [ ] Implémenter la logique de tilt 3D (updateCardTransform)
- [ ] Implémenter le chargement des avatars depuis IndexedDB
- [ ] Appliquer les styles CSS (perspective, transform)
- [ ] Ajouter les effets holographiques (shine, glare)
- [ ] Configurer les event listeners (mousemove, mouseleave)
- [ ] Intégrer dans la sidebar
- [ ] Enregistrer le composant Vue
- [ ] Importer les styles CSS

---

*Document créé le 8 décembre 2024*
*Version: 1.0 - Documentation exhaustive ligne par ligne*

