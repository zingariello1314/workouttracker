# 🔍 EXPLICATION : Pourquoi TSMC n'affiche que son prix d'entrée

## 📊 PROBLÈME IDENTIFIÉ

**TSMC** (Taiwan Semiconductor Manufacturing Company) est coté sur le **Taiwan Stock Exchange (TSE)** et nécessite un **suffixe d'échange** pour être reconnu par les APIs.

### Différence entre NVDA et TSMC

| Ticker | Exchange | Format API | Statut |
|--------|----------|------------|--------|
| **NVDA** | NASDAQ (US) | `NVDA` | ✅ Fonctionne (ticker US standard) |
| **TSMC** | Taiwan Stock Exchange | `TSMC` ❌ ou `TSMC.TW` ✅ | ❌ Échoue sans suffixe |

## 🔬 CAUSE RACINE

1. **TSMC sans suffixe** : Les APIs (Alpha Vantage, Finnhub) ne reconnaissent pas `TSMC` tel quel
2. **Erreur silencieuse** : Le système essaie `TSMC`, échoue, et retourne le prix d'entrée comme fallback
3. **Pas de log détaillé** : Les erreurs sont loggées en `debug` seulement, donc invisibles

## 💡 SOLUTION

Il faut essayer plusieurs variantes du ticker :
- `TSMC` (format original)
- `TSMC.TW` (Taiwan Stock Exchange)
- `TSMC.TWO` (Taiwan OTC)
- `2330.TW` (code ISIN taiwanais)
