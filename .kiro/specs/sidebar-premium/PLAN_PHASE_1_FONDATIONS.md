# 🏗️ PHASE 1: FONDATIONS ET STRUCTURE DE BASE

**Durée estimée**: 2-3 heures  
**Priorité**: CRITIQUE  
**Prérequis**: Aucun

---

## 🎯 OBJECTIFS

- Créer la structure de fichiers du projet
- Définir les design tokens CSS (variables)
- Charger les polices nécessaires
- Créer le conteneur principal de la sidebar
- Mettre en place le système de dégradés

---

## 📁 ÉTAPE 1.1: Structure de fichiers (15 min)

### Créer l'arborescence

```bash
# Créer les dossiers
mkdir -p src/components/sidebar
mkdir -p src/styles
mkdir -p src/services/sidebar

# Créer les fichiers principaux
touch src/components/sidebar/SidebarPremium.vue
touch src/components/sidebar/ProfileCardComponent.vue
touch src/styles/sidebar-premium.css
touch src/styles/sidebar-animations.css
touch src/services/sidebar/sidebarStorage.js
```

### Checklist
- [ ] Dossier `src/components/sidebar/` créé
- [ ] Dossier `src/styles/` créé
- [ ] Dossier `src/services/sidebar/` créé
- [ ] Fichier `SidebarPremium.vue` créé
- [ ] Fichier `ProfileCardComponent.vue` créé
- [ ] Fichiers CSS créés

---

## 🎨 ÉTAPE 1.2: Design Tokens CSS (30 min)

### Créer le fichier de variables

**Fichier**: `src/styles/sidebar-premium.css`

```css
/* ============================================
   SIDEBAR QUIETQUEST - DESIGN TOKENS
   ============================================ */

:root {
  /* === COULEURS PRIMAIRES === */
  --sidebar-magenta: #ff1493;
  --sidebar-orange: #ff8c00;
  --sidebar-gold: #ffd700;
  --sidebar-cyan: #00f5ff;
  
  /* === COULEURS SECONDAIRES === */
  --sidebar-green: #22c55e;
  --sidebar-blue: #3b82f6;
  --sidebar-purple: #a855f7;
  --sidebar-yellow: #eab308;
  --sidebar-red: #ef4444;
  
  /* === COULEURS DE FOND === */
  --sidebar-bg-dark-1: #1a1a2e;
  --sidebar-bg-dark-2: #16213e;
  --sidebar-bg-dark-3: #0f0f23;
  --sidebar-bg-black: rgba(0, 0, 0, 0.6);
  
  /* === ESPACEMENTS === */
  --sidebar-spacing-xs: 0.25rem;   /* 4px */
  --sidebar-spacing-sm: 0.5rem;    /* 8px */
  --sidebar-spacing-md: 1rem;      /* 16px */
  --sidebar-spacing-lg: 1.5rem;    /* 24px */
  --sidebar-spacing-xl: 2rem;      /* 32px */
  
  /* === TAILLES DE POLICE === */
  --sidebar-text-xs: 0.6rem;       /* 9.6px */
  --sidebar-text-sm: 0.7rem;       /* 11.2px */
  --sidebar-text-md: 0.8rem;       /* 12.8px */
  --sidebar-text-lg: 1rem;         /* 16px */
  --sidebar-text-xl: 1.2rem;       /* 19.2px */
  --sidebar-text-2xl: 1.6rem;      /* 25.6px */
  --sidebar-text-3xl: 2rem;        /* 32px */
  --sidebar-text-4xl: 2.4rem;      /* 38.4px */
  
  /* === BORDER RADIUS === */
  --sidebar-radius-sm: 6px;
  --sidebar-radius-md: 10px;
  --sidebar-radius-lg: 12px;
  --sidebar-radius-xl: 15px;
  
  /* === TRANSITIONS === */
  --sidebar-transition-fast: 0.15s ease;
  --sidebar-transition-normal: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --sidebar-transition-slow: 0.6s ease;
  
  /* === SHADOWS === */
  --sidebar-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
  --sidebar-shadow-md: 0 4px 15px rgba(0, 0, 0, 0.3);
  --sidebar-shadow-lg: 0 12px 30px rgba(0, 0, 0, 0.4);
  
  /* === BLUR === */
  --sidebar-blur-sm: blur(8px);
  --sidebar-blur-md: blur(10px);
  --sidebar-blur-lg: blur(15px);
  
  /* === DÉGRADÉS RÉUTILISABLES === */
  --sidebar-gradient-signature: linear-gradient(180deg,
    var(--sidebar-magenta) 0%,
    var(--sidebar-orange) 50%,
    var(--sidebar-gold) 100%
  );
  
  --sidebar-gradient-bg: linear-gradient(180deg,
    var(--sidebar-bg-dark-1) 0%,
    var(--sidebar-bg-dark-2) 50%,
    var(--sidebar-bg-dark-3) 100%
  );
  
  --sidebar-gradient-section: linear-gradient(135deg,
    rgba(255, 20, 147, 0.08) 0%,
    rgba(15, 15, 25, 0.6) 30%,
    rgba(255, 140, 0, 0.05) 70%,
    rgba(255, 215, 0, 0.08) 100%
  );
}
```

### Checklist
- [ ] Fichier `sidebar-premium.css` créé
- [ ] Toutes les variables de couleurs définies
- [ ] Variables d'espacement définies
- [ ] Variables de typographie définies
- [ ] Dégradés réutilisables définis

---

## 🔤 ÉTAPE 1.3: Chargement des polices (20 min)

### Option A: Polices locales (Tanker)

**Fichier**: `src/styles/sidebar-premium.css` (ajouter)

```css
/* === POLICES === */
@font-face {
  font-family: 'Tanker';
  src: url('/Fonts tanker/WEB/Tanker-Regular.woff2') format('woff2'),
       url('/Fonts tanker/WEB/Tanker-Regular.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

### Option B: Google Fonts (Rajdhani)

**Fichier**: `index.html` ou `App.vue`

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
```

### Checklist
- [ ] Police Tanker chargée (si disponible localement)
- [ ] Police Rajdhani chargée depuis Google Fonts
- [ ] Fallback sans-serif configuré
- [ ] Test de chargement des polices effectué

---

## 📦 ÉTAPE 1.4: Conteneur principal (45 min)

### Créer le composant Vue

**Fichier**: `src/components/sidebar/SidebarPremium.vue`

```vue
<template>
  <div class="sidebar-premium">
    <!-- Contenu à venir dans les prochaines phases -->
    <div class="sidebar-test">
      <h1>Sidebar QuietQuest</h1>
      <p>Phase 1: Fondations ✅</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SidebarPremium',
  props: {
    formattedTime: {
      type: String,
      default: '00:00:00'
    },
    formattedDate: {
      type: String,
      default: 'DATE'
    }
  },
  data() {
    return {
      expandedSections: {}
    };
  }
};
</script>

<style scoped>
@import '@/styles/sidebar-premium.css';

.sidebar-premium {
  /* Dimensions */
  width: 18.75rem; /* 300px */
  min-height: fit-content;
  max-height: 100vh;
  
  /* Background avec dégradé */
  background: var(--sidebar-gradient-bg);
  
  /* Couleur du texte */
  color: #ffffff;
  
  /* Layout */
  display: flex;
  flex-direction: column;
  
  /* Bordure dorée */
  border: 0.125rem solid rgba(255, 215, 0, 0.2);
  border-radius: 0 var(--sidebar-radius-lg) var(--sidebar-radius-lg) 0;
  
  /* Effet de flou d'arrière-plan */
  backdrop-filter: var(--sidebar-blur-lg);
  
  /* Positionnement */
  flex-shrink: 0;
  position: relative;
  z-index: 900;
  
  /* Padding interne */
  padding: 0.625rem;
  
  /* Ombre portée */
  box-shadow: 0.125rem 0 1.875rem rgba(0, 0, 0, 0.5);
  
  /* Overflow */
  overflow: hidden;
}

/* Test temporaire */
.sidebar-test {
  padding: 2rem;
  text-align: center;
}

.sidebar-test h1 {
  background: var(--sidebar-gradient-signature);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}
</style>
```

### Checklist
- [ ] Composant `SidebarPremium.vue` créé
- [ ] Dimensions correctes (300px de largeur)
- [ ] Dégradé de fond appliqué
- [ ] Bordure dorée visible
- [ ] Backdrop-filter fonctionnel
- [ ] Test du dégradé signature sur le titre

---

## 🧪 ÉTAPE 1.5: Test d'intégration (30 min)

### Intégrer dans l'application

**Fichier**: `src/App.vue` ou page principale

```vue
<template>
  <div class="app-container">
    <SidebarPremium 
      :formattedTime="currentTime"
      :formattedDate="currentDate"
    />
    <main class="main-content">
      <!-- Contenu principal -->
    </main>
  </div>
</template>

<script>
import SidebarPremium from '@/components/sidebar/SidebarPremium.vue';

export default {
  components: {
    SidebarPremium
  },
  data() {
    return {
      currentTime: '14:32:15',
      currentDate: 'SAMEDI 7 DÉCEMBRE 2024'
    };
  }
};
</script>

<style>
.app-container {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 2rem;
}
</style>
```

### Tests à effectuer
- [ ] La sidebar s'affiche à gauche
- [ ] La largeur est de 300px
- [ ] Le dégradé de fond est visible
- [ ] La bordure dorée est visible
- [ ] Le texte de test utilise le dégradé signature
- [ ] Aucune erreur dans la console

---

## ✅ VALIDATION DE LA PHASE 1

### Critères de succès
- ✅ Structure de fichiers créée
- ✅ Design tokens CSS définis
- ✅ Polices chargées
- ✅ Conteneur principal fonctionnel
- ✅ Dégradés appliqués correctement
- ✅ Sidebar visible dans l'application

### Résultat attendu
Une sidebar de 300px de largeur avec:
- Fond dégradé bleu-noir
- Bordure dorée
- Texte de test avec dégradé Magenta-Orange-Or
- Aucune erreur

---

## 🚀 PROCHAINE ÉTAPE

Une fois la Phase 1 validée, passer à:
**PLAN_PHASE_2_HORLOGE.md** - Implémentation de la zone d'horloge et de la carte développeur

---

**Temps total Phase 1**: 2h20 (estimation)  
**Difficulté**: Moyenne  
**Bloquant**: Oui (requis pour toutes les autres phases)
