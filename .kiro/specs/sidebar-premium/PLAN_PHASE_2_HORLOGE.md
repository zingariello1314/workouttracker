# ⏰ PHASE 2: ZONE D'HORLOGE ET CARTE DÉVELOPPEUR

**Durée estimée**: 2-3 heures  
**Priorité**: CRITIQUE  
**Prérequis**: Phase 1 complétée

---

## 🎯 OBJECTIFS

- Créer la zone d'horloge fixe (non-scrollable)
- Implémenter l'affichage heure/date avec effets 3D
- Intégrer la carte développeur avec effet tilt 3D
- Ajouter les 4 statuts système (grille 2x2)
- Appliquer tous les effets visuels (lueurs, ombres, profondeur)

---

## 📐 ÉTAPE 2.1: Structure de la zone d'horloge (30 min)

### Modifier SidebarPremium.vue

**Fichier**: `src/components/sidebar/SidebarPremium.vue`

```vue
<template>
  <div class="sidebar-premium">
    <!-- ZONE FIXE: Horloge -->
    <div class="clock-section">
      <!-- Bloc heure/date -->
      <div class="time-date-block">
        <!-- Heure avec 3 couches de profondeur -->
        <div class="time-display">
          <div class="time-main">{{ formattedTime }}</div>
          <div class="time-shadow">{{ formattedTime }}</div>
          <div class="time-glow">{{ formattedTime }}</div>
        </div>
        
        <!-- Date avec 3 couches de profondeur -->
        <div class="date-display">
          <div class="date-main">{{ formattedDate }}</div>
          <div class="date-shadow">{{ formattedDate }}</div>
          <div class="date-glow">{{ formattedDate }}</div>
        </div>
      </div>
      
      <!-- Carte développeur (à implémenter) -->
      <div class="profile-card-placeholder">
        <p>Carte développeur</p>
      </div>
      
      <!-- Statuts système (à implémenter) -->
      <div class="system-status-placeholder">
        <p>Statuts système</p>
      </div>
    </div>
    
    <!-- Zone scrollable (vide pour l'instant) -->
    <div class="sidebar-content">
      <!-- Contenu à venir Phase 3 -->
    </div>
  </div>
</template>
```

### Ajouter les styles

```css
/* === ZONE D'HORLOGE === */
.clock-section {
  /* Position fixe en haut */
  position: relative;
  z-index: 10;
  
  /* Padding */
  padding: 1rem 0.9375rem;
  min-height: 6.25rem; /* 100px */
  
  /* Marges négatives pour toucher les bords */
  margin: -10px -10px 0 -10px;
  
  /* Background */
  background: linear-gradient(135deg, 
    rgba(10, 10, 15, 0.95) 0%, 
    rgba(5, 5, 10, 0.98) 100%
  );
  
  /* Bordure inférieure */
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
}

/* === BLOC HEURE/DATE === */
.time-date-block {
  /* Espacement */
  padding: 12px 15px;
  margin: 70px 0 45px 0;
  
  /* Bordure dorée */
  border-radius: var(--sidebar-radius-xl);
  border: 2px solid var(--sidebar-gold);
  
  /* Background avec dégradé triple */
  background: linear-gradient(135deg, 
    rgba(255, 20, 147, 0.15) 0%,
    rgba(255, 140, 0, 0.1) 50%,
    rgba(255, 215, 0, 0.15) 100%
  );
  
  /* Effet de flou */
  backdrop-filter: var(--sidebar-blur-md);
  
  /* Ombres multiples */
  box-shadow: 
    0 0 20px rgba(255, 215, 0, 0.3),
    0 4px 15px rgba(255, 215, 0, 0.2),
    inset 0 0 20px rgba(255, 215, 0, 0.1);
}

/* === AFFICHAGE DE L'HEURE === */
.time-display {
  position: relative;
  text-align: center;
  margin-bottom: 0.5rem;
}

.time-main {
  /* Typographie */
  font-family: 'Tanker', 'Rajdhani', sans-serif;
  font-size: var(--sidebar-text-4xl); /* 2.4rem */
  font-weight: 400;
  letter-spacing: 0.02em;
  
  /* Dégradé signature */
  background: var(--sidebar-gradient-signature);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  /* Ombre */
  text-shadow: 0 0 20px rgba(255, 20, 147, 0.4);
  
  /* Position */
  position: relative;
  z-index: 0;
}

.time-shadow {
  /* Copie du texte */
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  
  /* Même style que time-main */
  font-family: 'Tanker', 'Rajdhani', sans-serif;
  font-size: var(--sidebar-text-4xl);
  font-weight: 400;
  letter-spacing: 0.02em;
  background: var(--sidebar-gradient-signature);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  /* Effet d'ombre */
  opacity: 0.2;
  filter: blur(2px);
  z-index: -1;
}

.time-glow {
  /* Copie du texte */
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  
  /* Même style */
  font-family: 'Tanker', 'Rajdhani', sans-serif;
  font-size: var(--sidebar-text-4xl);
  font-weight: 400;
  letter-spacing: 0.02em;
  background: var(--sidebar-gradient-signature);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  /* Effet de lueur */
  opacity: 0.4;
  filter: blur(4px);
  z-index: -2;
}

/* === AFFICHAGE DE LA DATE === */
.date-display {
  position: relative;
  text-align: center;
}

.date-main {
  /* Typographie */
  font-family: 'Tanker', 'Rajdhani', sans-serif;
  font-size: var(--sidebar-text-lg); /* 1rem */
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  
  /* Dégradé signature */
  background: var(--sidebar-gradient-signature);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  /* Position */
  position: relative;
  z-index: 0;
}

.date-shadow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  font-family: 'Tanker', 'Rajdhani', sans-serif;
  font-size: var(--sidebar-text-lg);
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: var(--sidebar-gradient-signature);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  opacity: 0.1;
  filter: blur(1px);
  z-index: -1;
}

.date-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  font-family: 'Tanker', 'Rajdhani', sans-serif;
  font-size: var(--sidebar-text-lg);
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: var(--sidebar-gradient-signature);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  opacity: 0.3;
  filter: blur(3px);
  z-index: -2;
}
```

### Checklist
- [ ] Zone clock-section créée
- [ ] Bloc time-date-block avec bordure dorée
- [ ] Affichage heure avec 3 couches (main, shadow, glow)
- [ ] Affichage date avec 3 couches
- [ ] Dégradé signature appliqué
- [ ] Effets de profondeur visibles

---

## 👤 ÉTAPE 2.2: Carte développeur (60 min)

### Créer le composant ProfileCardComponent

**Fichier**: `src/components/sidebar/ProfileCardComponent.vue`

```vue
<template>
  <div class="profile-card-wrapper" ref="cardWrapper">
    <div class="profile-card" ref="card">
      <!-- Couche d'images -->
      <div class="pc-images-layer">
        <img 
          v-if="mainAvatarUrl" 
          :src="mainAvatarUrl" 
          alt="Avatar principal"
          class="main-avatar"
        />
      </div>
      
      <!-- Effets holographiques -->
      <div class="pc-shine"></div>
      <div class="pc-glare"></div>
      
      <!-- Contenu texte -->
      <div class="pc-content">
        <h3>{{ name }}</h3>
        <p>{{ title }}</p>
        
        <!-- Mini-avatar et infos -->
        <div class="mini-user-info">
          <img 
            v-if="miniAvatarUrl" 
            :src="miniAvatarUrl" 
            alt="Mini avatar"
            class="mini-avatar"
          />
          <div class="user-details">
            <span class="user-handle">@{{ handle }}</span>
            <span class="user-status">{{ status }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProfileCardComponent',
  props: {
    name: {
      type: String,
      default: 'zingariello'
    },
    title: {
      type: String,
      default: 'Développeur'
    },
    handle: {
      type: String,
      default: 'zingariello1314'
    },
    status: {
      type: String,
      default: 'En ligne'
    },
    mainAvatarUrl: String,
    miniAvatarUrl: String
  },
  mounted() {
    this.setupTiltEffect();
  },
  methods: {
    setupTiltEffect() {
      const card = this.$refs.card;
      const wrapper = this.$refs.cardWrapper;
      
      if (!card || !wrapper) return;
      
      wrapper.addEventListener('mousemove', (e) => {
        const rect = wrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 5;
        const rotateY = (centerX - x) / 4;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });
      
      wrapper.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      });
    }
  }
};
</script>

<style scoped>
.profile-card-wrapper {
  margin: 2.8rem 0;
  perspective: 1000px;
}

.profile-card {
  position: relative;
  width: 100%;
  height: 180px;
  border-radius: var(--sidebar-radius-lg);
  background: linear-gradient(135deg, 
    rgba(255, 20, 147, 0.1) 0%,
    rgba(0, 0, 0, 0.8) 50%,
    rgba(255, 140, 0, 0.1) 100%
  );
  border: 2px solid rgba(255, 215, 0, 0.3);
  overflow: hidden;
  transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  transform-style: preserve-3d;
}

.pc-images-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.main-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.8;
}

.pc-content {
  position: relative;
  z-index: 3;
  padding: 1rem;
  color: white;
}

.pc-content h3 {
  font-size: 1.2rem;
  margin-bottom: 0.25rem;
  background: var(--sidebar-gradient-signature);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.pc-content p {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.mini-user-info {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.6);
  padding: 0.5rem;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.mini-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--sidebar-gold);
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-handle {
  font-size: 0.7rem;
  color: var(--sidebar-gold);
}

.user-status {
  font-size: 0.6rem;
  color: var(--sidebar-green);
}
</style>
```

### Intégrer dans SidebarPremium.vue

Remplacer le placeholder par:
```vue
<ProfileCardComponent 
  :name="user.name"
  :title="user.title"
  :handle="user.handle"
  :status="user.status"
  :mainAvatarUrl="mainAvatarUrl"
  :miniAvatarUrl="miniAvatarUrl"
/>
```

### Checklist
- [ ] Composant ProfileCardComponent créé
- [ ] Effet tilt 3D fonctionnel
- [ ] Avatars affichés correctement
- [ ] Infos utilisateur visibles
- [ ] Dégradé appliqué au nom

---

## 📊 ÉTAPE 2.3: Statuts système (45 min)

### Ajouter la grille de statuts

**Dans SidebarPremium.vue**, remplacer le placeholder par:

```vue
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
    <span>FOCUS {{ focusPercent }}%</span>
  </div>
</div>
```

### Ajouter les styles

```css
/* === STATUTS SYSTÈME === */
.system-status {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-top: 2.8rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid;
  font-size: var(--sidebar-text-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03125rem;
}

/* Variante ACTIF (vert) */
.status-item.active {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { 
    opacity: 1; 
    transform: scale(1); 
  }
  50% { 
    opacity: 0.7; 
    transform: scale(1.2); 
  }
}

/* Variante NUIT (bleu) */
.status-item.night {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.3);
  color: #3b82f6;
}

/* Variante CONNECTÉ (violet) */
.status-item.connected {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.3);
  color: #a855f7;
}

/* Variante FOCUS (vert) */
.status-item.focus {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.status-icon {
  font-size: 0.9rem;
}
```

### Checklist
- [ ] Grille 2x2 créée
- [ ] 4 statuts affichés
- [ ] Point pulsant pour "Actif"
- [ ] Couleurs correctes pour chaque statut
- [ ] Icônes emoji visibles

---

## ✅ VALIDATION DE LA PHASE 2

### Critères de succès
- ✅ Zone d'horloge fixe en haut
- ✅ Heure affichée avec effet 3D (3 couches)
- ✅ Date affichée avec effet 3D
- ✅ Carte développeur avec effet tilt
- ✅ 4 statuts système en grille 2x2
- ✅ Tous les dégradés appliqués
- ✅ Animations fonctionnelles

### Tests visuels
- [ ] L'heure a un effet de profondeur visible
- [ ] La date a un effet de profondeur visible
- [ ] La carte bouge au survol de la souris
- [ ] Le point "Actif" pulse
- [ ] Les couleurs correspondent au design

---

## 🚀 PROCHAINE ÉTAPE

Passer à **PLAN_PHASE_3_SECTIONS.md** - Système de sections scrollables

---

**Temps total Phase 2**: 2h15 (estimation)  
**Difficulté**: Élevée  
**Bloquant**: Oui
