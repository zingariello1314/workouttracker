# 🔐 CONFIGURATION DES CLÉS API

## ✅ CLÉS API INTÉGRÉES

Les clés API ont été intégrées dans le projet. Pour les utiliser, crée le fichier `.env` à la racine du projet.

## 📋 ÉTAPES DE CONFIGURATION

### 1. Créer le fichier `.env`

À la racine du projet, crée un fichier `.env` avec le contenu du template.

**Voir**: `docs/finance/ENV_TEMPLATE.md` pour le template complet avec toutes les clés API.

### 2. Vérifier que `.env` est dans `.gitignore`

Le fichier `.env` doit être ignoré par git (déjà configuré dans le projet).

---

## 📝 UTILISATION DANS LE CODE

Les clés API sont accessibles via le fichier `src/config/apiKeys.js` :

```javascript
import { getApiKey, hasApiKey } from '../config/apiKeys';

// Vérifier si une clé est disponible
if (hasApiKey('ALPHA_VANTAGE')) {
  const apiKey = getApiKey('ALPHA_VANTAGE');
  // Utiliser la clé...
}
```

---

## ✅ VÉRIFICATION

Une fois les clés configurées, l'application vérifiera automatiquement leur présence au démarrage.

---

**Important**: Ne jamais commiter le fichier `.env` dans git !

