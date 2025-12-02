# 🔐 FICHIER .env - TEMPLATE

## 📝 INSTRUCTIONS

1. **Créer un fichier `.env`** à la racine du projet (même niveau que `package.json`)

2. **Copier-coller le contenu suivant** dans le fichier `.env` :

```env
# ============================================
# CLÉS API - ONGLET FINANCE
# ============================================
# Ne jamais commiter ce fichier dans git !
# Le fichier .env est déjà dans .gitignore

# Alpha Vantage - Bourse et Indices (PRIORITÉ HAUTE)
# Site: https://www.alphavantage.co/support/#api-key
VITE_ALPHA_VANTAGE_API_KEY=BG1PSN4HD4YZUAAX

# Finnhub - Alternative Bourse (données financières)
# Site: https://finnhub.io/register
VITE_FINNHUB_API_KEY=d4nkqhhr01qk2nucfn70d4nkqhhr01qk2nucfn7g

# Polygon.io - Données boursières historiques
# Site: https://polygon.io/pricing
VITE_POLYGON_API_KEY=Kb_O_FH3fI2i4AAyxlppuG0rStr3nhU9

# Fixer.io - Taux de change et métaux précieux (Or)
# Site: https://fixer.io/product
VITE_FIXER_API_KEY=9e8ff910f6275ce4c492a35e68e29acb

# CoinGecko - Cryptomonnaies
# Site: https://www.coingecko.com/en/api
VITE_COINGECKO_API_KEY=CG-1qnmuBvvkeiM2i2p1c7Zyewv

# CoinCap - Cryptomonnaies (alternative)
# Site: https://docs.coincap.io/
VITE_COINCAP_API_KEY=bdd4bf5df18c55bd9936d441baced4210be3b3563ca151eba2e25b4a40d839c9
```

3. **Sauvegarder le fichier** - Les clés seront automatiquement chargées au démarrage de l'application

---

## ✅ VÉRIFICATION

Une fois le fichier `.env` créé, redémarre l'application pour que les clés soient chargées.

Les clés sont accessibles via `src/config/apiKeys.js` dans le code.

---

## 🔒 SÉCURITÉ

- ✅ Le fichier `.env` est dans `.gitignore` (ne sera pas commité)
- ✅ Les clés sont chargées uniquement côté client via `import.meta.env`
- ✅ Ne jamais partager ce fichier publiquement

---

**Important**: Ce fichier contient tes vraies clés API. Ne le partage jamais !

