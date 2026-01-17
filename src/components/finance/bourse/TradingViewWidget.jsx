import React, { useEffect, useRef, useState, useMemo } from 'react';
import { convertTickerToTradingViewSymbol, generateTradingViewSymbolVariants } from '../../../utils/tradingViewSymbol';

/**
 * Composant TradingView Widget
 * Utilise le widget Advanced Chart de TradingView (JavaScript) pour afficher graphique professionnel
 * Documentation: https://www.tradingview.com/widget-docs/
 */
const TradingViewWidget = ({ ticker, interval = 'D', height = 500 }) => {
  const containerRef = useRef(null);
  const widgetInstanceRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSymbolIndex, setCurrentSymbolIndex] = useState(0);

  // ✅ FIX TSMC : Générer les variantes de symboles TradingView
  const symbolVariants = useMemo(() => {
    return generateTradingViewSymbolVariants(ticker);
  }, [ticker]);

  // Générer un ID unique pour ce widget (mémorisé pour éviter les changements)
  const widgetId = useMemo(() => {
    return `tradingview_${ticker}_${Math.random().toString(36).substr(2, 9)}`;
  }, [ticker]);

  useEffect(() => {
    if (!ticker || !containerRef.current) return;

    // Réinitialiser l'index de symbole quand le ticker change
    setCurrentSymbolIndex(0);

    // Fonction pour créer le widget
    const createWidget = (symbolIndex = 0) => {
      const containerElement = containerRef.current;
      if (!containerElement) {
        setError('Container non trouvé');
        setLoading(false);
        return;
      }

      // ✅ FIX TSMC : Utiliser le symbole TradingView converti
      const symbol = symbolVariants[symbolIndex] || convertTickerToTradingViewSymbol(ticker);

      const widgetConfig = {
        autosize: true,
        symbol: symbol,
        interval: interval,
        timezone: 'Europe/Paris',
        theme: 'dark',
        style: '1',
        locale: 'fr',
        toolbar_bg: '#1e293b',
        enable_publishing: false,
        allow_symbol_change: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        container_id: widgetId,
        studies: [
          'MASimple@tv-basicstudies',
          'MACD@tv-basicstudies',
          'RSI@tv-basicstudies'
        ],
        overrides: {
          'paneProperties.background': '#0f172a',
          'paneProperties.vertGridProperties.color': '#1e293b',
          'paneProperties.horzGridProperties.color': '#1e293b',
        }
      };

      if (window.TradingView && window.TradingView.widget) {
        try {
          // Nettoyer l'instance précédente si elle existe
          // TradingView nettoie automatiquement quand on crée une nouvelle instance sur le même conteneur
          widgetInstanceRef.current = null;
          
          widgetInstanceRef.current = new window.TradingView.widget(widgetConfig);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error('Error creating TradingView widget:', err);
          setError(`Erreur lors de la création du widget: ${err.message}`);
          setLoading(false);
        }
      } else {
        // Charger le script TradingView
        const existingScript = document.querySelector('script[src="https://s3.tradingview.com/tv.js"]');
        if (existingScript) {
          // Script déjà chargé, attendre qu'il soit prêt
          const checkTradingView = setInterval(() => {
            if (window.TradingView && window.TradingView.widget && containerRef.current) {
              clearInterval(checkTradingView);
              try {
                // Nettoyer l'instance précédente si elle existe
                widgetInstanceRef.current = null;
                
                widgetInstanceRef.current = new window.TradingView.widget(widgetConfig);
                setLoading(false);
                setError(null);
              } catch (err) {
                console.error('Error creating TradingView widget:', err);
                setError(`Erreur lors de la création du widget: ${err.message}`);
                setLoading(false);
              }
            }
          }, 100);
          
          // Timeout après 5 secondes
          const timeoutId = setTimeout(() => {
            clearInterval(checkTradingView);
            if (loading) {
              setError('Timeout lors du chargement de TradingView');
              setLoading(false);
            }
          }, 5000);

          return () => {
            clearInterval(checkTradingView);
            clearTimeout(timeoutId);
          };
        } else {
          // Charger le script TradingView
          const script = document.createElement('script');
          script.src = 'https://s3.tradingview.com/tv.js';
          script.async = true;
          script.onload = () => {
            if (window.TradingView && window.TradingView.widget && containerRef.current) {
              try {
                widgetInstanceRef.current = new window.TradingView.widget(widgetConfig);
                setLoading(false);
                setError(null);
              } catch (err) {
                console.error('Error creating TradingView widget:', err);
                setError(`Erreur lors de la création du widget: ${err.message}`);
                setLoading(false);
              }
            } else {
              setError('TradingView non disponible après chargement');
              setLoading(false);
            }
          };
          script.onerror = () => {
            setError('Erreur lors du chargement du script TradingView');
            setLoading(false);
          };
          document.head.appendChild(script);
        }
      }
    };

    // Attendre que le DOM soit prêt
    // Utiliser requestAnimationFrame pour s'assurer que le rendu est terminé
    const rafId = requestAnimationFrame(() => {
      setTimeout(() => {
        createWidget(currentSymbolIndex);
      }, 200);
    });

    // Cleanup
    return () => {
      cancelAnimationFrame(rafId);
      // Réinitialiser les références
      // Laisser React gérer le nettoyage du DOM naturellement
      // TradingView nettoie automatiquement quand le conteneur est supprimé par React
      widgetInstanceRef.current = null;
      // Ne pas supprimer le script car il peut être utilisé par d'autres widgets
    };
  }, [ticker, interval, widgetId]);

  if (!ticker) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        Aucun ticker fourni
      </div>
    );
  }

  return (
    <div 
      className="w-full rounded-lg overflow-hidden bg-slate-900"
      style={{ minHeight: `${height}px`, height: `${height}px`, position: 'relative' }}
    >
      {/* Conteneur pour TradingView avec ID unique */}
      <div 
        id={widgetId}
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 pointer-events-none">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Chargement du graphique TradingView...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 pointer-events-none">
          <div className="text-center text-slate-400">
            <p>{error}</p>
            <p className="text-sm mt-2">Ticker: {ticker}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingViewWidget;
