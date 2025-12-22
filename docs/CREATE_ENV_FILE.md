# Création du fichier .env

## Problème
Les clés API News ne sont pas détectées car le fichier `.env` n'existe pas ou n'a pas été chargé.

## Solution

### 1. Créer le fichier `.env` à la racine du projet

Créez un fichier nommé `.env` (sans extension) à la racine du projet (même niveau que `package.json`).

### 2. Ajouter les clés API suivantes :

```env
# CLABS API Prix de l Or
VITE_GOLDPRICEZ_API_KEY=7ae9dadc93a1c03288d255c207db83087ae9dadc
VITE_GOLD_API_KEY=3fec4bbb4b58a529c215816eba40de528a80051d2b4ea68cd5859fa3dcf4e637

# News APIs
VITE_NEWSAPI_API_KEY=3abc635f29ca4dd0bbcc1e21d2464c03
VITE_GUARDIAN_API_KEY=eb55161c-c8d4-476f-b668-103958c425b8
VITE_MEDIASTACK_API_KEY=f304c880e793e764770a9fecea1c8bd7
VITE_NEWSDATA_API_KEY=pub_460ec85d560447bba7abe0cc44169124
```

### 3. Redémarrer le serveur

**IMPORTANT** : Après avoir créé ou modifié le fichier `.env`, vous DEVEZ redémarrer le serveur de développement :

```bash
# Arrêter le serveur (Ctrl+C)
# Puis redémarrer :
npm run dev
```

### 4. Vérifier dans la console

Après le redémarrage, ouvrez la console du navigateur (F12) et vérifiez que vous voyez :
- ✅ Les clés API sont détectées (avec des ✅ au lieu de ❌)
- ✅ Les variables d'environnement sont présentes

## Notes importantes

- Le fichier `.env` doit être à la racine du projet (même niveau que `package.json`)
- Les variables doivent commencer par `VITE_` pour être accessibles dans le code
- Le serveur doit être redémarré après chaque modification du fichier `.env`
- Ne commitez JAMAIS le fichier `.env` dans Git (il est déjà dans `.gitignore`)

