# Configuration des Clés API pour le Module Actualités

## 🔑 Clés API Fournies

Voici les clés API que vous avez fournies. Ajoutez-les dans votre fichier `.env` à la racine du projet :

```env
# ==================== NEWS APIs ====================
# NewsAPI.org - Actualités générales et France (PRIORITÉ HAUTE)
# Quota: 100 requêtes/jour (gratuit)
VITE_NEWSAPI_API_KEY=3abc635f29ca4dd0bbcc1e21d2464c03

# Guardian API - Actualités monde (fallback)
# Quota: 5000 requêtes/jour (gratuit)
VITE_GUARDIAN_API_KEY=eb55161c-c8d4-476f-b668-103958c425b8

# MediaStack - Actualités alternative
# Quota: 1000 requêtes/mois (gratuit)
VITE_MEDIASTACK_API_KEY=f304c880e793e764770a9fecea1c8bd7

# NewsData.io - Actualités alternative
# Quota: 200 requêtes/jour (gratuit)
VITE_NEWSDATA_API_KEY=pub_460ec85d560447bba7abe0cc44169124
```

## 📝 Instructions

1. **Créer ou modifier le fichier `.env`** à la racine du projet
2. **Ajouter les clés ci-dessus** dans le fichier
3. **Redémarrer le serveur** : `npm run dev`

## ✅ Vérification

Une fois configuré, le module Actualités utilisera automatiquement ces APIs avec :
- **Fallback intelligent** : Si une API échoue, utilisation automatique d'une autre
- **Rate limiting** : Gestion automatique des quotas
- **Cache** : Mise en cache pour éviter les appels inutiles
- **Actualités France** : Priorité sur les actualités françaises via NewsAPI

## 🎯 Catégories Disponibles

Le module supporte maintenant :
- **Tout** : Toutes les actualités
- **France** : Actualités françaises (priorité)
- **Monde** : Actualités internationales
- **Bourse** : Actualités financières (Finnhub)
- **Crypto** : Cryptomonnaies
- **Économie** : Économie générale
- **Tech** : Technologie
- **Sport** : Sports
- **Culture** : Culture
- **Politique** : Politique
- **Santé** : Santé
- **Environnement** : Environnement

