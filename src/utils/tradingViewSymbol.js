/**
 * Convertit un ticker en symbole TradingView
 * TradingView utilise des formats spécifiques pour différents exchanges
 * 
 * @param {string} ticker - Ticker original (ex: "TSMC", "NVDA")
 * @returns {string} Symbole TradingView (ex: "TWSE:2330", "NASDAQ:NVDA")
 */
export function convertTickerToTradingViewSymbol(ticker) {
  if (!ticker) return ticker;
  
  const upperTicker = ticker.toUpperCase();
  
  // ✅ FIX TSMC : Conversion spécifique pour Taiwan
  if (upperTicker === 'TSMC' || /^2330$/i.test(ticker)) {
    // TradingView utilise NYSE:TSM pour l'ADR US (plus fiable que TWSE:2330)
    // L'ADR US est plus liquide et mieux supporté par TradingView
    return 'NYSE:TSM'; // Format TradingView pour ADR US
  }
  
  // Si le ticker contient déjà un suffixe d'échange, le convertir au format TradingView
  if (ticker.includes('.')) {
    const [base, exchange] = ticker.split('.');
    
    // Mapping des suffixes vers les formats TradingView
    const exchangeMap = {
      'TW': 'TWSE',
      'TWO': 'TWSE', // Taiwan OTC utilise aussi TWSE
      'US': 'NASDAQ', // Par défaut US = NASDAQ
      'NYSE': 'NYSE',
      'NASDAQ': 'NASDAQ',
      'L': 'LSE', // London Stock Exchange
      'LON': 'LSE',
      'PA': 'EURONEXT', // Euronext Paris
      'AS': 'EURONEXT', // Euronext Amsterdam
      'DE': 'XETR', // XETRA
      'T': 'TSE', // Tokyo Stock Exchange
      'TO': 'TSX', // Toronto Stock Exchange
    };
    
    const tradingViewExchange = exchangeMap[exchange.toUpperCase()] || exchange.toUpperCase();
    return `${tradingViewExchange}:${base}`;
  }
  
  // Pour les tickers US sans suffixe, TradingView les détecte automatiquement
  // Mais on peut essayer de spécifier l'échange si on le connaît
  // Pour l'instant, on retourne le ticker tel quel et TradingView essaiera de le détecter
  return ticker;
}

/**
 * Génère plusieurs variantes de symboles TradingView pour un ticker
 * Utile si le premier symbole ne fonctionne pas
 * 
 * @param {string} ticker - Ticker original
 * @returns {string[]} Liste des variantes à essayer
 */
export function generateTradingViewSymbolVariants(ticker) {
  if (!ticker) return [ticker];
  
  const variants = [];
  const upperTicker = ticker.toUpperCase();
  
  // ✅ FIX TSMC : Variantes spécifiques
  if (upperTicker === 'TSMC' || /^2330$/i.test(ticker)) {
    // Essayer d'abord ADR US (NYSE) car c'est plus fiable sur TradingView
    variants.push('NYSE:TSM');
    // Puis Taiwan Stock Exchange
    variants.push('TWSE:2330');
    // Puis format simple (TradingView peut détecter)
    variants.push('TSM');
    variants.push('2330.TW');
  } else {
    // Pour autres tickers, commencer par le ticker original
    variants.push(ticker);
    
    // Si pas de suffixe, essayer d'ajouter des suffixes communs
    if (!ticker.includes('.')) {
      variants.push(`${ticker}.TW`);
      variants.push(`TWSE:${ticker}`);
    }
  }
  
  return [...new Set(variants)];
}
