# Configuration API Prix de l'Or

## Clés API fournies

1. **GoldPriceZ**
   - Clé: `7ae9dadc93a1c03288d255c207db83087ae9dadc`
   - Limite: 30-60 requêtes/heure (plan gratuit)
   - Site: https://goldpricez.com

2. **Gold-API.com**
   - Clé: `3fec4bbb4b58a529c215816eba40de528a80051d2b4ea68cd5859fa3dcf4e637`
   - Limite: ~50 requêtes/heure (estimation)
   - Site: https://www.goldapi.io

## Configuration

### Étape 1: Créer/modifier le fichier `.env`

À la racine du projet, créez ou modifiez le fichier `.env` et ajoutez :

```env
# Clés API Prix de l'Or
VITE_GOLDPRICEZ_API_KEY=7ae9dadc93a1c03288d255c207db83087ae9dadc
VITE_GOLD_API_KEY=3fec4bbb4b58a529c215816eba40de528a80051d2b4ea68cd5859fa3dcf4e637
```

### Étape 2: Redémarrer le serveur de développement

Après avoir ajouté les clés, redémarrez le serveur :

```bash
npm run dev
```

## Rate Limiting

Le système gère automatiquement les limites d'appels :

- **GoldPriceZ**: 40 req/heure (conservateur, limite max: 60)
- **Gold-API.com**: 50 req/heure (estimation)

### Cache

Le prix est mis en cache pendant **5 minutes** pour :
- Éviter de dépasser les limites
- Garder des données récentes
- Réduire les appels API

Avec un cache de 5 minutes, on fait maximum **12 appels/heure** par API, ce qui est bien en dessous des limites.

## Stratégie de récupération

Le système essaie les APIs dans cet ordre :

1. **GoldPriceZ** (priorité haute)
2. **Gold-API.com** (si GoldPriceZ échoue)
3. **Fallback** avec conversion USD/EUR (si toutes les APIs échouent)

## Attribution requise

⚠️ **Important**: GoldPriceZ demande une attribution visible sur votre site.

Ajoutez un lien dans votre footer ou page "À propos" :
```html
<a href="https://goldpricez.com" target="_blank" rel="noopener">Source: GoldPriceZ.com</a>
```

Après avoir ajouté l'attribution, envoyez un email à `goldpricekg@gmail.com` avec votre clé API et l'URL de votre site.

## Vérification

Pour vérifier que tout fonctionne, consultez la console du navigateur. Vous devriez voir des logs comme :

```
[orPriceService] Prix or récupéré et mis en cache: XX.XX€/g
```

En cas d'erreur, vérifiez :
- Les clés API sont bien dans le `.env`
- Le serveur a été redémarré
- Les limites de rate limiting ne sont pas dépassées

