/**
 * SurveillanceBlock - Bloc Surveillance Marchés Ultra-Détaillé
 * 
 * PHASE 7 COMPLÈTE - TOUS LES 14 MODULES IMPLÉMENTÉS
 * 
 * Modules 1-14:
 * 1. Header Premium
 * 2. Market Status
 * 3. Stock Cards
 * 4. Alerts
 * 5. News Feed
 * 6. AI Recommendations
 * 7. Economic Calendar
 * 8. Performers
 * 9. Behavioral Analysis
 * 10. Correlation Lab
 * 11. Unexpected Correlations
 * 12. Arbitrage Opportunities
 * 13. Sentiment Multi-Source
 * 14. Predictive Intelligence
 * 
 * Conversion Vue.js → React complète avec 14 modules
 * Basé sur: docs/finance/codepourleblocsurveilance.md
 * 
 * @module SurveillanceBlock
 * @version 3.0.0 - Phase 7 FINALE (14/14 modules) - 100% COMPLET ✅
 */

import { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { 
  Eye, TrendingUp, TrendingDown, Plus, Upload, X, AlertTriangle, Bell,
  Newspaper, ThumbsUp, ThumbsDown, Lightbulb, Zap, ExternalLink
} from 'lucide-react';

/**
 * SurveillanceBlock - Composant principal de surveillance des marchés
 * 
 * @component
 * @param {Object} props - Props du composant
 * @param {Function} props.onRefresh - Callback pour rafraîchir les données
 */
const SurveillanceBlock = ({ onRefresh = () => {} }) => {
  // ============================================================================
  // ÉTATS PRINCIPAUX
  // ============================================================================
  
  // États pour les modals
  const [showModal, setShowModal] = useState(false);
  const [showCustomAssetForm, setShowCustomAssetForm] = useState(false);
  
  // États pour les formulaires
  const [newStock, setNewStock] = useState({
    name: '',
    ticker: '',
    price: '',
    change: '',
    signal: ''
  });
  const [logo, setLogo] = useState(null);
  const [newCustomAsset, setNewCustomAsset] = useState({
    name: '',
    symbol: '',
    yourHolding: '',
    performance7d: '+0.0%'
  });
  
  // États pour les expansions
  const [expandedCrypto, setExpandedCrypto] = useState(false);
  const [expandedStocks, setExpandedStocks] = useState(false);
  const [expandedCommodities, setExpandedCommodities] = useState(false);
  const [expandedEconomic, setExpandedEconomic] = useState(false);
  
  // États pour les corrélations
  const [selectedAssets, setSelectedAssets] = useState(['BTC', 'ETH', 'NVDA', 'TSLA', 'OR']);
  const [showAssetSelector, setShowAssetSelector] = useState(false);
  
  // ============================================================================
  // DONNÉES MOCK - MODULE 1: HEADER PREMIUM
  // ============================================================================
  
  const [stocks, setStocks] = useState([
    {
      name: 'Apple',
      ticker: 'AAPL',
      price: '182.52',
      change: '+2.3%',
      signal: 'ACHAT',
      logo: null
    },
    {
      name: 'Tesla',
      ticker: 'TSLA',
      price: '248.50',
      change: '-1.2%',
      signal: 'ATTENTE',
      logo: null
    },
    {
      name: 'NVIDIA',
      ticker: 'NVDA',
      price: '495.22',
      change: '+5.8%',
      signal: 'ACHAT FORT',
      logo: null
    }
  ]);
  
  // ============================================================================
  // DONNÉES MOCK - MODULE 2: MARKET STATUS
  // ============================================================================
  
  const marketIndices = [
    { name: 'CAC 40', value: '7,842.50', change: '+1.2%', trend: 'up' },
    { name: 'S&P 500', value: '4,783.45', change: '+0.8%', trend: 'up' },
    { name: 'NASDAQ', value: '15,310.97', change: '+1.5%', trend: 'up' },
    { name: 'DOW JONES', value: '37,545.33', change: '+0.3%', trend: 'up' }
  ];
  
  const commoditiesAndCrypto = [
    { name: 'OR', value: '2,045.30 $', change: '+0.5%', trend: 'up', type: 'commodity' },
    { name: 'PÉTROLE', value: '78.45 $', change: '-1.2%', trend: 'down', type: 'commodity' },
    { name: 'BTC', value: '43,250 $', change: '+3.2%', trend: 'up', type: 'crypto' },
    { name: 'ETH', value: '2,285 $', change: '+2.8%', trend: 'up', type: 'crypto' }
  ];
  
  // ============================================================================
  // DONNÉES MOCK - MODULE 4: ALERTS
  // ============================================================================
  
  const [alerts] = useState([
    {
      id: 1,
      ticker: 'AAPL',
      type: 'price',
      condition: 'above',
      targetPrice: '185.00',
      currentPrice: '182.52',
      status: 'active',
      message: 'Prix cible: 185.00 $'
    },
    {
      id: 2,
      ticker: 'TSLA',
      type: 'change',
      condition: 'drop',
      threshold: '-5%',
      currentChange: '-1.2%',
      status: 'active',
      message: 'Alerte baisse > -5%'
    },
    {
      id: 3,
      ticker: 'NVDA',
      type: 'volume',
      condition: 'spike',
      status: 'triggered',
      message: 'Volume anormal détecté'
    }
  ]);
  
  // ============================================================================
  // DONNÉES MOCK - MODULE 5: NEWS FEED
  // ============================================================================
  
  const [newsItems] = useState([
    {
      id: 1,
      title: 'La Fed maintient ses taux directeurs inchangés',
      source: 'Reuters',
      time: '2h',
      sentiment: 'neutral',
      impact: 'high',
      category: 'economie',
      url: '#'
    },
    {
      id: 2,
      title: 'NVIDIA annonce une nouvelle génération de GPU IA',
      source: 'TechCrunch',
      time: '4h',
      sentiment: 'positive',
      impact: 'high',
      category: 'tech',
      url: '#'
    },
    {
      id: 3,
      title: 'Le Bitcoin franchit la barre des 45000$',
      source: 'CoinDesk',
      time: '6h',
      sentiment: 'positive',
      impact: 'medium',
      category: 'crypto',
      url: '#'
    },
    {
      id: 4,
      title: 'Tensions géopolitiques: impact sur les marchés',
      source: 'Bloomberg',
      time: '8h',
      sentiment: 'negative',
      impact: 'high',
      category: 'geopolitique',
      url: '#'
    }
  ]);
  
  // ============================================================================
  // DONNÉES MOCK - MODULE 6: AI RECOMMENDATIONS
  // ============================================================================
  
  const [aiRecommendations] = useState([
    {
      id: 1,
      type: 'buy',
      ticker: 'MSFT',
      confidence: 85,
      reason: 'Forte croissance du cloud Azure',
      targetPrice: '420.00',
      currentPrice: '385.50',
      potential: '+8.9%'
    },
    {
      id: 2,
      type: 'hold',
      ticker: 'AAPL',
      confidence: 72,
      reason: 'Consolidation après résultats',
      targetPrice: '190.00',
      currentPrice: '182.52',
      potential: '+4.1%'
    },
    {
      id: 3,
      type: 'sell',
      ticker: 'META',
      confidence: 68,
      reason: 'Surévaluation technique',
      targetPrice: '320.00',
      currentPrice: '345.80',
      potential: '-7.5%'
    }
  ]);
  
  // ============================================================================
  // DONNÉES MOCK - MODULE 7: ECONOMIC CALENDAR
  // ============================================================================
  
  const [cryptoEvents] = useState([
    {
      id: 1,
      date: '15 Déc',
      time: '14:00',
      event: 'Bitcoin Halving Countdown',
      impact: 'high',
      description: 'Réduction de moitié des récompenses de minage BTC'
    },
    {
      id: 2,
      date: '18 Déc',
      time: '10:00',
      event: 'Ethereum Upgrade',
      impact: 'high',
      description: 'Mise à jour majeure du réseau Ethereum'
    },
    {
      id: 3,
      date: '20 Déc',
      time: '16:00',
      event: 'Solana Conference',
      impact: 'medium',
      description: 'Annonces importantes pour l\'écosystème SOL'
    }
  ]);
  
  const [stockEvents] = useState([
    {
      id: 1,
      date: '12 Déc',
      time: '09:30',
      event: 'NVIDIA Earnings',
      impact: 'high',
      description: 'Publication des résultats trimestriels'
    },
    {
      id: 2,
      date: '14 Déc',
      time: '14:00',
      event: 'Apple Product Launch',
      impact: 'high',
      description: 'Lancement de nouveaux produits'
    },
    {
      id: 3,
      date: '19 Déc',
      time: '11:00',
      event: 'Tesla Delivery Numbers',
      impact: 'medium',
      description: 'Chiffres de livraisons Q4'
    }
  ]);
  
  const [commodityEvents] = useState([
    {
      id: 1,
      date: '13 Déc',
      time: '15:00',
      event: 'Gold Reserve Report',
      impact: 'medium',
      description: 'Rapport sur les réserves d\'or mondiales'
    },
    {
      id: 2,
      date: '16 Déc',
      time: '12:00',
      event: 'OPEC Meeting',
      impact: 'high',
      description: 'Décision sur la production de pétrole'
    }
  ]);
  
  const [economicEvents] = useState([
    {
      id: 1,
      date: '13 Déc',
      time: '14:30',
      event: 'Fed Interest Rate Decision',
      impact: 'high',
      description: 'Décision de la Réserve Fédérale sur les taux'
    },
    {
      id: 2,
      date: '15 Déc',
      time: '10:00',
      event: 'US Inflation Data',
      impact: 'high',
      description: 'Publication des chiffres d\'inflation CPI'
    },
    {
      id: 3,
      date: '17 Déc',
      time: '09:00',
      event: 'ECB Press Conference',
      impact: 'high',
      description: 'Conférence de presse de la BCE'
    }
  ]);
  
  // ============================================================================
  // DONNÉES MOCK - MODULE 8: PERFORMERS
  // ============================================================================
  
  const [topPerformers] = useState([
    { symbol: 'NVDA', name: 'NVIDIA', change: '+12.5%', price: '495.22' },
    { symbol: 'BTC', name: 'Bitcoin', change: '+8.3%', price: '43,250' },
    { symbol: 'ETH', name: 'Ethereum', change: '+6.7%', price: '2,285' },
    { symbol: 'TSLA', name: 'Tesla', change: '+5.2%', price: '248.50' },
    { symbol: 'AAPL', name: 'Apple', change: '+4.1%', price: '182.52' }
  ]);
  
  const [worstPerformers] = useState([
    { symbol: 'META', name: 'Meta', change: '-8.2%', price: '345.80' },
    { symbol: 'NFLX', name: 'Netflix', change: '-5.4%', price: '428.30' },
    { symbol: 'AMZN', name: 'Amazon', change: '-3.8%', price: '152.45' },
    { symbol: 'GOOGL', name: 'Google', change: '-2.9%', price: '138.20' },
    { symbol: 'MSFT', name: 'Microsoft', change: '-1.5%', price: '385.50' }
  ]);
  
  // ============================================================================
  // DONNÉES MOCK - MODULE 10: CORRELATION LAB
  // ============================================================================
  
  const [correlationAssets, setCorrelationAssets] = useState([
    { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', yourHolding: '0.5 BTC', performance7d: '+8.3%' },
    { symbol: 'ETH', name: 'Ethereum', color: '#627EEA', yourHolding: '5 ETH', performance7d: '+6.7%' },
    { symbol: 'NVDA', name: 'NVIDIA', color: '#76B900', yourHolding: '10 actions', performance7d: '+12.5%' },
    { symbol: 'TSLA', name: 'Tesla', color: '#E82127', yourHolding: '5 actions', performance7d: '+5.2%' },
    { symbol: 'AAPL', name: 'Apple', color: '#A2AAAD', yourHolding: '15 actions', performance7d: '+4.1%' },
    { symbol: 'OR', name: 'Or', color: '#FFD700', yourHolding: '50g', performance7d: '+0.5%' },
    { symbol: 'SOL', name: 'Solana', color: '#14F195', yourHolding: '100 SOL', performance7d: '+7.2%' },
    { symbol: 'MSFT', name: 'Microsoft', color: '#00A4EF', yourHolding: '8 actions', performance7d: '-1.5%' }
  ]);
  
  const correlationMatrix = useMemo(() => ({
    'btc_eth': 0.85,
    'btc_nvda': 0.42,
    'btc_tsla': 0.38,
    'btc_aapl': 0.25,
    'btc_or': -0.15,
    'btc_sol': 0.78,
    'btc_msft': 0.18,
    'eth_nvda': 0.38,
    'eth_tsla': 0.35,
    'eth_aapl': 0.22,
    'eth_or': -0.12,
    'eth_sol': 0.82,
    'eth_msft': 0.15,
    'nvda_tsla': 0.65,
    'nvda_aapl': 0.58,
    'nvda_or': -0.08,
    'nvda_sol': 0.35,
    'nvda_msft': 0.72,
    'tsla_aapl': 0.52,
    'tsla_or': -0.05,
    'tsla_sol': 0.32,
    'tsla_msft': 0.48,
    'aapl_or': -0.03,
    'aapl_sol': 0.28,
    'aapl_msft': 0.68,
    'or_sol': -0.18,
    'or_msft': -0.10,
    'sol_msft': 0.20
  }), []);
  
  // ============================================================================
  // DONNÉES MOCK - MODULE 9: BEHAVIORAL ANALYSIS
  // ============================================================================
  
  const behavioralData = {
    totalTrades: 156,
    winningTrades: 94,
    losingTrades: 62,
    winRate: 60.3,
    avgWin: '+3.2%',
    avgLoss: '-1.8%'
  };
  
  const bestTradingTime = '10:00 - 11:00';
  const bestTimePerformance = '+5.8%';
  const worstTradingTime = '15:00 - 16:00';
  const worstTimePerformance = '-2.3%';
  
  const detectedBiases = [
    { name: 'Overtrading', severity: 'MODÉRÉ', description: 'Trop de trades en période de volatilité' },
    { name: 'Loss Aversion', severity: 'ÉLEVÉ', description: 'Tendance à garder les positions perdantes trop longtemps' },
    { name: 'Confirmation Bias', severity: 'FAIBLE', description: 'Recherche d\'informations confirmant vos positions' }
  ];
  
  // ============================================================================
  // DONNÉES MOCK - MODULE 11: UNEXPECTED CORRELATIONS
  // ============================================================================
  
  const [unexpectedCorrelations] = useState([
    {
      id: 1,
      asset1: 'BTC',
      asset2: 'OR',
      correlation: -0.15,
      strength: 'FAIBLE',
      explanation: 'Corrélation négative inhabituelle entre actifs refuges'
    },
    {
      id: 2,
      asset1: 'NVDA',
      asset2: 'SOL',
      correlation: 0.35,
      strength: 'MODÉRÉE',
      explanation: 'Lien via l\'écosystème IA et blockchain'
    },
    {
      id: 3,
      asset1: 'ETH',
      asset2: 'OR',
      correlation: -0.12,
      strength: 'FAIBLE',
      explanation: 'Divergence entre actifs numériques et physiques'
    }
  ]);
  
  // ============================================================================
  // DONNÉES MOCK - MODULE 12: ARBITRAGE OPPORTUNITIES
  // ============================================================================
  
  const [arbitrageOpportunities] = useState([
    {
      id: 1,
      asset: 'BTC',
      market1: 'Binance',
      price1: '43,250$',
      market2: 'Coinbase',
      price2: '43,380$',
      spread: '+0.3%',
      profit: '130$',
      risk: 'FAIBLE',
      timeWindow: '5-10 min'
    },
    {
      id: 2,
      asset: 'ETH',
      market1: 'Kraken',
      price1: '2,285$',
      market2: 'Bitstamp',
      price2: '2,310$',
      spread: '+1.1%',
      profit: '25$',
      risk: 'MODÉRÉ',
      timeWindow: '3-7 min'
    },
    {
      id: 3,
      asset: 'SOL',
      market1: 'FTX',
      price1: '98.50$',
      market2: 'Binance',
      price2: '99.80$',
      spread: '+1.3%',
      profit: '1.30$',
      risk: 'ÉLEVÉ',
      timeWindow: '2-5 min'
    }
  ]);
  
  // ============================================================================
  // DONNÉES MOCK - MODULE 13: SENTIMENT MULTI-SOURCE
  // ============================================================================
  
  const compositeSentiment = {
    score: 68,
    trend: 'up',
    change: '+5'
  };
  
  const sentimentSources = [
    { name: 'Twitter', score: 72, change: '+8', icon: 'twitter' },
    { name: 'Reddit', score: 65, change: '+3', icon: 'reddit' },
    { name: 'News', score: 58, change: '-2', icon: 'news' },
    { name: 'Analysts', score: 75, change: '+6', icon: 'analysts' }
  ];
  
  const [sentimentDivergences] = useState([
    {
      id: 1,
      source1: 'Twitter',
      source2: 'News',
      gap: 14,
      level: 'MODÉRÉE',
      explanation: 'Sentiment social plus optimiste que les médias traditionnels'
    },
    {
      id: 2,
      source1: 'Analysts',
      source2: 'Reddit',
      gap: 10,
      level: 'FAIBLE',
      explanation: 'Professionnels plus confiants que la communauté'
    }
  ]);
  
  // ============================================================================
  // DONNÉES MOCK - MODULE 14: PREDICTIVE INTELLIGENCE
  // ============================================================================
  
  const [shortTermPredictions] = useState([
    {
      id: 1,
      timeframe: '24h',
      direction: 'HAUSSE',
      variation: '+2.3%',
      confidence: 78,
      factors: ['Volume croissant', 'RSI favorable', 'Support technique']
    },
    {
      id: 2,
      timeframe: '48h',
      direction: 'HAUSSE',
      variation: '+3.8%',
      confidence: 65,
      factors: ['Momentum positif', 'Actualités favorables']
    },
    {
      id: 3,
      timeframe: '72h',
      direction: 'STABLE',
      variation: '+0.5%',
      confidence: 52,
      factors: ['Consolidation attendue', 'Résistance proche']
    }
  ]);
  
  const [weeklyScenarios] = useState([
    {
      id: 1,
      type: 'optimiste',
      variation: '+12.5%',
      probability: 25,
      targetPrice: '205.00',
      factors: ['Breakout technique', 'Catalyseur positif', 'Volume exceptionnel']
    },
    {
      id: 2,
      type: 'réaliste',
      variation: '+5.2%',
      probability: 50,
      targetPrice: '192.00',
      factors: ['Tendance haussière maintenue', 'Fondamentaux solides']
    },
    {
      id: 3,
      type: 'pessimiste',
      variation: '-3.8%',
      probability: 25,
      targetPrice: '175.00',
      factors: ['Correction technique', 'Prise de bénéfices']
    }
  ]);
  
  const [tradingSignals] = useState([
    {
      id: 1,
      type: 'ACHAT',
      strength: 'FORT',
      timeframe: 'Court terme (1-3 jours)',
      entryPrice: '182.50',
      stopLoss: '175.00',
      takeProfit: '195.00',
      confidence: 82
    },
    {
      id: 2,
      type: 'ATTENTE',
      strength: 'MODÉRÉ',
      timeframe: 'Moyen terme (1-2 semaines)',
      reason: 'Attendre confirmation du breakout',
      confidence: 58
    }
  ]);
  
  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  /**
   * Calcule le nombre total d'actions surveillées
   * @returns {number} Nombre d'actions
   */
  const watchedStocksCount = useMemo(() => stocks.length, [stocks]);
  
  /**
   * Filtre les actifs selon la sélection
   * @returns {Array} Actifs filtrés
   */
  const filteredAssets = useMemo(() => 
    correlationAssets.filter(asset => selectedAssets.includes(asset.symbol)),
    [correlationAssets, selectedAssets]
  );
  
  /**
   * Actifs disponibles (non sélectionnés)
   * @returns {Array} Actifs disponibles
   */
  const availableAssets = useMemo(() => 
    correlationAssets.filter(asset => !selectedAssets.includes(asset.symbol)),
    [correlationAssets, selectedAssets]
  );
  
  /**
   * Corrélations positives fortes (> 0.7)
   * @returns {Array} Paires de corrélations fortes
   */
  const strongPositiveCorrelations = useMemo(() => 
    Object.entries(correlationMatrix)
      .filter(([, value]) => value > 0.7)
      .slice(0, 5),
    [correlationMatrix]
  );
  
  /**
   * Corrélations négatives fortes (< -0.5)
   * @returns {Array} Paires de corrélations négatives
   */
  const strongNegativeCorrelations = useMemo(() => 
    Object.entries(correlationMatrix)
      .filter(([, value]) => value < -0.5)
      .slice(0, 5),
    [correlationMatrix]
  );
  
  /**
   * Corrélation moyenne
   * @returns {number} Moyenne des corrélations
   */
  const averageCorrelation = useMemo(() => {
    const values = Object.values(correlationMatrix);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }, [correlationMatrix]);
  
  /**
   * Risque de corrélation crypto
   * @returns {string} Niveau de risque (ÉLEVÉ/MODÉRÉ/FAIBLE)
   */
  const cryptoCorrelationRisk = useMemo(() => {
    const cryptoPairs = Object.entries(correlationMatrix)
      .filter(([pair]) => pair.includes('btc') || pair.includes('eth') || pair.includes('sol'));
    const avgCorr = cryptoPairs.reduce((sum, [, value]) => sum + Math.abs(value), 0) / cryptoPairs.length;
    return avgCorr > 0.7 ? 'ÉLEVÉ' : avgCorr > 0.5 ? 'MODÉRÉ' : 'FAIBLE';
  }, [correlationMatrix]);
  
  /**
   * Risque de corrélation tech
   * @returns {string} Niveau de risque (ÉLEVÉ/MODÉRÉ/FAIBLE)
   */
  const techCorrelationRisk = useMemo(() => {
    const techPairs = Object.entries(correlationMatrix)
      .filter(([pair]) => pair.includes('nvda') || pair.includes('tsla') || pair.includes('aapl'));
    const avgCorr = techPairs.reduce((sum, [, value]) => sum + Math.abs(value), 0) / techPairs.length;
    return avgCorr > 0.7 ? 'ÉLEVÉ' : avgCorr > 0.5 ? 'MODÉRÉ' : 'FAIBLE';
  }, [correlationMatrix]);
  
  // ============================================================================
  // HANDLERS - MODULE 1: GESTION DES STOCKS
  // ============================================================================
  
  /**
   * Gère l'ajout d'une nouvelle action
   * @callback
   */
  const handleAddStock = useCallback(() => {
    if (newStock.name && newStock.ticker) {
      const stockToAdd = {
        name: newStock.name,
        ticker: newStock.ticker,
        price: newStock.price || '0.00',
        change: newStock.change || '+0.0%',
        signal: newStock.signal || 'NEUTRE',
        logo: logo
      };
      
      setStocks(prev => [...prev, stockToAdd]);
      
      // Reset form
      setNewStock({ name: '', ticker: '', price: '', change: '', signal: '' });
      setLogo(null);
      setShowModal(false);
    }
  }, [newStock, logo]);
  
  /**
   * Gère l'upload d'un logo
   * @callback
   * @param {Event} event - Event de l'input file
   */
  const handleLogoUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogo(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);
  
  /**
   * Met à jour le logo d'une action existante
   * @callback
   * @param {string} ticker - Ticker de l'action
   * @param {string} logoUrl - URL du logo
   */
  const updateStockLogo = useCallback((ticker, logoUrl) => {
    setStocks(prev => prev.map(stock => 
      stock.ticker === ticker ? { ...stock, logo: logoUrl } : stock
    ));
  }, []);
  
  /**
   * Supprime une action de la liste
   * @callback
   * @param {string} ticker - Ticker de l'action à supprimer
   */
  const handleRemoveStock = useCallback((ticker) => {
    setStocks(prev => prev.filter(stock => stock.ticker !== ticker));
  }, []);
  
  /**
   * Obtient la classe CSS pour le signal technique
   * @callback
   * @param {string} signal - Signal technique
   * @returns {string} Classes CSS
   */
  const getSignalClass = useCallback((signal) => {
    const signalUpper = signal.toUpperCase();
    if (signalUpper.includes('ACHAT FORT')) return 'bg-green-500/20 border-green-500/50 text-green-400';
    if (signalUpper.includes('ACHAT')) return 'bg-green-500/20 border-green-500/40 text-green-400';
    if (signalUpper.includes('VENTE')) return 'bg-red-500/20 border-red-500/40 text-red-400';
    return 'bg-gray-500/20 border-gray-500/40 text-gray-400';
  }, []);
  
  // ============================================================================
  // HANDLERS - MODULE 10: CORRELATION LAB
  // ============================================================================
  
  /**
   * Obtient la valeur de corrélation entre deux actifs
   * @callback
   * @param {string} asset1 - Symbole du premier actif
   * @param {string} asset2 - Symbole du deuxième actif
   * @returns {number} Valeur de corrélation
   */
  const getCorrelationValue = useCallback((asset1, asset2) => {
    if (asset1 === asset2) return 1;
    const key = `${asset1.toLowerCase()}_${asset2.toLowerCase()}`;
    const reverseKey = `${asset2.toLowerCase()}_${asset1.toLowerCase()}`;
    return correlationMatrix[key] || correlationMatrix[reverseKey] || 0;
  }, [correlationMatrix]);
  
  /**
   * Formate une valeur de corrélation
   * @callback
   * @param {number} value - Valeur de corrélation
   * @returns {string} Valeur formatée
   */
  const formatCorrelationValue = useCallback((value) => {
    return value.toFixed(2);
  }, []);
  
  /**
   * Obtient la force de corrélation
   * @callback
   * @param {number} value - Valeur de corrélation
   * @returns {string} Force de corrélation
   */
  const getCorrelationStrength = useCallback((value) => {
    const abs = Math.abs(value);
    if (abs > 0.7) return 'FORTE';
    if (abs > 0.4) return 'MODÉRÉE';
    if (abs > 0.1) return 'FAIBLE';
    return 'NULLE';
  }, []);
  
  /**
   * Obtient la classe CSS pour une cellule de corrélation
   * @callback
   * @param {number} value - Valeur de corrélation
   * @returns {string} Classes CSS
   */
  const getCorrelationCellClass = useCallback((value) => {
    if (value > 0.7) return 'bg-green-500/30 border-green-500/50 text-green-400';
    if (value > 0.4) return 'bg-green-500/20 border-green-500/40 text-green-300';
    if (value > 0.1) return 'bg-blue-500/20 border-blue-500/40 text-blue-300';
    if (value > -0.1) return 'bg-gray-500/20 border-gray-500/40 text-gray-400';
    if (value > -0.4) return 'bg-orange-500/20 border-orange-500/40 text-orange-300';
    return 'bg-red-500/30 border-red-500/50 text-red-400';
  }, []);
  
  /**
   * Supprime un actif de la sélection
   * @callback
   * @param {string} symbol - Symbole de l'actif à supprimer
   */
  const handleRemoveAsset = useCallback((symbol) => {
    if (selectedAssets.length <= 2) return; // Minimum 2 actifs
    setSelectedAssets(prev => prev.filter(s => s !== symbol));
  }, [selectedAssets]);
  
  /**
   * Ajoute un actif à la sélection
   * @callback
   * @param {string} symbol - Symbole de l'actif à ajouter
   */
  const handleAddAsset = useCallback((symbol) => {
    if (selectedAssets.length >= 8) return; // Maximum 8 actifs
    if (!selectedAssets.includes(symbol)) {
      setSelectedAssets(prev => [...prev, symbol]);
    }
    setShowAssetSelector(false);
  }, [selectedAssets]);
  
  /**
   * Réinitialise la sélection d'actifs
   * @callback
   */
  const handleResetSelection = useCallback(() => {
    setSelectedAssets(['BTC', 'ETH']);
  }, []);
  
  /**
   * Sélectionne tous les actifs (limité à 8)
   * @callback
   */
  const handleSelectAll = useCallback(() => {
    const allSymbols = correlationAssets.map(asset => asset.symbol);
    setSelectedAssets(allSymbols.slice(0, 8));
  }, [correlationAssets]);
  
  /**
   * Crée un actif personnalisé
   * @callback
   */
  const handleCreateCustomAsset = useCallback(() => {
    if (newCustomAsset.name && newCustomAsset.symbol) {
      const customAsset = {
        ...newCustomAsset,
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
        performance7d: '+0.0%'
      };
      
      setCorrelationAssets(prev => [...prev, customAsset]);
      setNewCustomAsset({ name: '', symbol: '', yourHolding: '', performance7d: '+0.0%' });
      setShowCustomAssetForm(false);
    }
  }, [newCustomAsset]);
  
  // ============================================================================
  // RENDER - MODULE 1: HEADER PREMIUM
  // ============================================================================
  
  /**
   * Rendu du header premium avec compteur d'actions
   */
  const renderHeaderPremium = () => (
    <div className="flex items-center justify-between p-4 border-b border-gray-700">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Eye className="text-cyan-400 drop-shadow-glow flex-shrink-0" size={18} />
        <h1 className="text-xl font-black text-cyan-400 drop-shadow-glow tracking-widest">
          SURVEILLANCE
        </h1>
      </div>
      <span 
        className="bg-cyan-600 text-white text-xs font-black px-2 py-1 rounded-full shadow-lg flex-shrink-0 ml-1"
        aria-label={`${watchedStocksCount} actions surveillées`}
      >
        {watchedStocksCount} ACTIONS
      </span>
    </div>
  );
  
  // ============================================================================
  // RENDER - MODULE 2: MARKET STATUS
  // ============================================================================
  
  /**
   * Rendu du statut des marchés (indices, matières premières, crypto)
   */
  const renderMarketStatus = () => (
    <div className="p-4 space-y-4 border-b border-gray-700">
      {/* Indices Majeurs */}
      <div>
        <h3 className="text-xs font-black text-gray-400 tracking-widest mb-3">
          INDICES MAJEURS
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {marketIndices.map((index, i) => (
            <div 
              key={i}
              className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-cyan-500/50 transition-all duration-300"
            >
              <div className="text-xs font-bold text-gray-400 mb-1">
                {index.name}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-white">
                  {index.value}
                </span>
                <span className={`text-xs font-bold flex items-center gap-1 ${
                  index.trend === 'up' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {index.trend === 'up' ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  {index.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Matières Premières & Crypto */}
      <div>
        <h3 className="text-xs font-black text-gray-400 tracking-widest mb-3">
          MATIÈRES & CRYPTO
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {commoditiesAndCrypto.map((item, i) => (
            <div 
              key={i}
              className={`p-3 border rounded-lg hover:border-opacity-100 transition-all duration-300 ${
                item.type === 'crypto' 
                  ? 'bg-purple-900/20 border-purple-500/30 hover:border-purple-500/50' 
                  : 'bg-yellow-900/20 border-yellow-500/30 hover:border-yellow-500/50'
              }`}
            >
              <div className="text-xs font-bold text-gray-400 mb-1">
                {item.name}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-white">
                  {item.value}
                </span>
                <span className={`text-xs font-bold flex items-center gap-1 ${
                  item.trend === 'up' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {item.trend === 'up' ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  {item.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  // ============================================================================
  // RENDER - MODULE 3: STOCK CARDS
  // ============================================================================
  
  /**
   * Rendu des cartes d'actions surveillées
   */
  const renderStockCards = () => {
    if (stocks.length === 0) {
      return (
        <div className="p-4 border-b border-gray-700">
          <div className="text-center py-8 text-gray-400">
            <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-semibold">Aucune action surveillée</p>
            <p className="text-xs mt-1">Ajoutez des actions pour commencer</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="p-4 space-y-3 border-b border-gray-700">
        <h3 className="text-xs font-black text-gray-400 tracking-widest mb-3">
          ACTIONS SURVEILLÉES
        </h3>
        {stocks.map((stock, index) => (
          <div
            key={index}
            className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-cyan-500/50 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                {stock.logo ? (
                  <img
                    src={stock.logo}
                    alt={stock.name}
                    className="w-10 h-10 rounded-full border-2 border-gray-600 group-hover:border-cyan-500/50 transition-all"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-gray-600 group-hover:border-cyan-500/50 flex items-center justify-center transition-all">
                    <span className="text-xs font-black text-cyan-400">
                      {stock.ticker.substring(0, 2)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-white truncate">
                      {stock.name}
                    </h4>
                    <span className="text-xs font-bold text-gray-400">
                      {stock.ticker}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-black text-white">
                      {stock.price} €
                    </span>
                    <span className={`text-xs font-bold flex items-center gap-1 ${
                      stock.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {stock.change.startsWith('+') ? (
                        <TrendingUp size={12} />
                      ) : (
                        <TrendingDown size={12} />
                      )}
                      {stock.change}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRemoveStock(stock.ticker)}
                className="p-1 hover:bg-red-500/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                aria-label={`Supprimer ${stock.name}`}
              >
                <X size={16} className="text-red-400" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getSignalClass(stock.signal)}`}>
                {stock.signal}
              </span>
              <button
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                aria-label={`Modifier le logo de ${stock.name}`}
              >
                Modifier logo
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // ============================================================================
  // RENDER - MODULE 4: ALERTS
  // ============================================================================
  
  /**
   * Rendu des alertes de prix
   */
  const renderAlerts = () => {
    const activeAlerts = alerts.filter(a => a.status === 'active');
    const triggeredAlerts = alerts.filter(a => a.status === 'triggered');
    
    if (alerts.length === 0) {
      return null;
    }
    
    return (
      <div className="p-4 space-y-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black text-gray-400 tracking-widest">
            ALERTES
          </h3>
          <span className="text-xs font-bold text-cyan-400">
            {alerts.length} active{alerts.length > 1 ? 's' : ''}
          </span>
        </div>
        
        {/* Alertes déclenchées */}
        {triggeredAlerts.length > 0 && (
          <div className="space-y-2">
            {triggeredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg animate-pulse"
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} className="text-red-400" />
                  <span className="text-xs font-black text-red-400">
                    {alert.ticker}
                  </span>
                  <span className="text-xs font-bold text-red-400 ml-auto">
                    DÉCLENCHÉE
                  </span>
                </div>
                <p className="text-xs text-gray-300">
                  {alert.message}
                </p>
              </div>
            ))}
          </div>
        )}
        
        {/* Alertes actives */}
        {activeAlerts.length > 0 && (
          <div className="space-y-2">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-cyan-500/50 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Bell size={14} className="text-cyan-400" />
                  <span className="text-xs font-black text-white">
                    {alert.ticker}
                  </span>
                  <span className="text-xs font-bold text-gray-400 ml-auto">
                    ACTIVE
                  </span>
                </div>
                <p className="text-xs text-gray-300">
                  {alert.message}
                </p>
                {alert.type === 'price' && (
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="text-gray-400">Actuel:</span>
                    <span className="font-bold text-white">{alert.currentPrice} $</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-bold text-cyan-400">{alert.targetPrice} $</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  // ============================================================================
  // RENDER - MODULE 5: NEWS FEED
  // ============================================================================
  
  /**
   * Rendu du fil d'actualités avec sentiment analysis
   */
  const renderNewsFeed = () => {
    if (newsItems.length === 0) return null;
    
    const getSentimentIcon = (sentiment) => {
      if (sentiment === 'positive') return <ThumbsUp size={14} className="text-green-400" />;
      if (sentiment === 'negative') return <ThumbsDown size={14} className="text-red-400" />;
      return <span className="text-gray-400">—</span>;
    };
    
    const getSentimentClass = (sentiment) => {
      if (sentiment === 'positive') return 'bg-green-500/10 border-green-500/30';
      if (sentiment === 'negative') return 'bg-red-500/10 border-red-500/30';
      return 'bg-gray-500/10 border-gray-500/30';
    };
    
    const getImpactBadge = (impact) => {
      if (impact === 'high') return 'bg-red-500/20 text-red-400 border-red-500/40';
      if (impact === 'medium') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    };
    
    return (
      <div className="p-4 space-y-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Newspaper size={14} className="text-cyan-400" />
            <h3 className="text-xs font-black text-gray-400 tracking-widest">
              ACTUALITÉS
            </h3>
          </div>
          <span className="text-xs font-bold text-cyan-400">
            {newsItems.length} news
          </span>
        </div>
        
        <div className="space-y-2">
          {newsItems.map((news) => (
            <div
              key={news.id}
              className={`p-3 border rounded-lg hover:border-cyan-500/50 transition-all duration-300 cursor-pointer group ${getSentimentClass(news.sentiment)}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors flex-1 line-clamp-2">
                  {news.title}
                </h4>
                <ExternalLink size={12} className="text-gray-500 group-hover:text-cyan-400 transition-colors flex-shrink-0 mt-1" />
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <span className="font-semibold">{news.source}</span>
                <span>•</span>
                <span>{news.time}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {getSentimentIcon(news.sentiment)}
                  <span className="text-xs font-bold text-gray-300 capitalize">
                    {news.sentiment}
                  </span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getImpactBadge(news.impact)}`}>
                  Impact: {news.impact}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // ============================================================================
  // RENDER - MODULE 6: AI RECOMMENDATIONS
  // ============================================================================
  
  /**
   * Rendu des recommandations IA
   */
  const renderAIRecommendations = () => {
    if (aiRecommendations.length === 0) return null;
    
    const getRecommendationIcon = (type) => {
      if (type === 'buy') return <TrendingUp size={14} className="text-green-400" />;
      if (type === 'sell') return <TrendingDown size={14} className="text-red-400" />;
      return <span className="text-yellow-400">—</span>;
    };
    
    const getRecommendationClass = (type) => {
      if (type === 'buy') return 'bg-green-500/10 border-green-500/30';
      if (type === 'sell') return 'bg-red-500/10 border-red-500/30';
      return 'bg-yellow-500/10 border-yellow-500/30';
    };
    
    const getRecommendationBadge = (type) => {
      if (type === 'buy') return 'bg-green-500/20 text-green-400 border-green-500/40';
      if (type === 'sell') return 'bg-red-500/20 text-red-400 border-red-500/40';
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
    };
    
    const getConfidenceColor = (confidence) => {
      if (confidence >= 80) return 'text-green-400';
      if (confidence >= 60) return 'text-yellow-400';
      return 'text-red-400';
    };
    
    return (
      <div className="p-4 space-y-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightbulb size={14} className="text-purple-400" />
            <h3 className="text-xs font-black text-gray-400 tracking-widest">
              RECOMMANDATIONS IA
            </h3>
          </div>
          <Zap size={14} className="text-purple-400 animate-pulse" />
        </div>
        
        <div className="space-y-2">
          {aiRecommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-3 border rounded-lg hover:border-purple-500/50 transition-all duration-300 ${getRecommendationClass(rec.type)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getRecommendationIcon(rec.type)}
                  <span className="text-sm font-black text-white">
                    {rec.ticker}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border uppercase ${getRecommendationBadge(rec.type)}`}>
                    {rec.type}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">Confiance:</span>
                  <span className={`text-xs font-black ${getConfidenceColor(rec.confidence)}`}>
                    {rec.confidence}%
                  </span>
                </div>
              </div>
              
              <p className="text-xs text-gray-300 mb-2">
                {rec.reason}
              </p>
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Actuel:</span>
                  <span className="font-bold text-white">{rec.currentPrice} $</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-bold text-purple-400">{rec.targetPrice} $</span>
                </div>
                <span className={`font-black ${rec.potential.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                  {rec.potential}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // ============================================================================
  // RENDER - MODULE 7: ECONOMIC CALENDAR
  // ============================================================================
  
  /**
   * Rendu du calendrier économique avec événements expansibles
   */
  const renderEconomicCalendar = () => {
    const getImpactBadge = (impact) => {
      if (impact === 'high') return 'bg-red-500/20 text-red-400 border-red-500/40';
      if (impact === 'medium') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    };
    
    const renderEventSection = (title, events, expanded, onToggle, icon, color) => (
      <div className="mb-3">
        <button
          onClick={onToggle}
          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
            expanded 
              ? `bg-${color}-500/10 border-${color}-500/40` 
              : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
          }`}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Réduire' : 'Développer'} ${title}`}
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className={`text-xs font-black tracking-widest ${expanded ? `text-${color}-400` : 'text-gray-400'}`}>
              {title}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              expanded ? `bg-${color}-500/20 text-${color}-400` : 'bg-gray-700 text-gray-400'
            }`}>
              {events.length}
            </span>
          </div>
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''} ${
              expanded ? `text-${color}-400` : 'text-gray-400'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expanded && (
          <div className="mt-2 space-y-2 pl-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-3 bg-gray-800/30 border border-gray-700 rounded-lg hover:border-gray-600 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-400">
                      {event.date}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs font-semibold text-gray-400">
                      {event.time}
                    </span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getImpactBadge(event.impact)}`}>
                    {event.impact}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {event.event}
                </h4>
                <p className="text-xs text-gray-400">
                  {event.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
    
    return (
      <div className="p-4 space-y-3 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <svg className="text-purple-400" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <h3 className="text-xs font-black text-gray-400 tracking-widest">
            CALENDRIER ÉCONOMIQUE
          </h3>
        </div>
        
        {renderEventSection(
          'CRYPTO',
          cryptoEvents,
          expandedCrypto,
          () => setExpandedCrypto(!expandedCrypto),
          <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
          </svg>,
          'purple'
        )}
        
        {renderEventSection(
          'ACTIONS',
          stockEvents,
          expandedStocks,
          () => setExpandedStocks(!expandedStocks),
          <TrendingUp size={14} className="text-green-400" />,
          'green'
        )}
        
        {renderEventSection(
          'MATIÈRES PREMIÈRES',
          commodityEvents,
          expandedCommodities,
          () => setExpandedCommodities(!expandedCommodities),
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
          </svg>,
          'yellow'
        )}
        
        {renderEventSection(
          'ÉCONOMIE',
          economicEvents,
          expandedEconomic,
          () => setExpandedEconomic(!expandedEconomic),
          <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
          </svg>,
          'blue'
        )}
      </div>
    );
  };
  
  // ============================================================================
  // RENDER - MODULE 8: PERFORMERS
  // ============================================================================
  
  /**
   * Rendu des meilleurs et pires performers
   */
  const renderPerformers = () => {
    if (topPerformers.length === 0 && worstPerformers.length === 0) return null;
    
    const renderPerformersList = (title, performers, isTop) => (
      <div className="mb-4">
        <h4 className="text-xs font-black text-gray-400 tracking-widest mb-2 flex items-center gap-2">
          {isTop ? (
            <TrendingUp size={12} className="text-green-400" />
          ) : (
            <TrendingDown size={12} className="text-red-400" />
          )}
          {title}
        </h4>
        <div className="space-y-2">
          {performers.map((performer, index) => (
            <div
              key={performer.symbol}
              className={`p-3 rounded-lg border transition-all duration-300 hover:scale-[1.02] ${
                isTop 
                  ? 'bg-green-500/5 border-green-500/20 hover:border-green-500/40' 
                  : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-black ${
                    isTop ? 'text-green-400' : 'text-red-400'
                  }`}>
                    #{index + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">
                        {performer.symbol}
                      </span>
                      <span className="text-xs text-gray-400">
                        {performer.name}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-gray-500">
                      {performer.price} {performer.symbol.includes('BTC') || performer.symbol.includes('ETH') ? '$' : '€'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isTop ? (
                    <TrendingUp size={14} className="text-green-400" />
                  ) : (
                    <TrendingDown size={14} className="text-red-400" />
                  )}
                  <span className={`text-sm font-black ${
                    isTop ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {performer.change}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
    
    return (
      <div className="p-4 space-y-3 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-yellow-400" />
          <h3 className="text-xs font-black text-gray-400 tracking-widest">
            PERFORMANCES
          </h3>
        </div>
        
        {renderPerformersList('TOP PERFORMERS', topPerformers, true)}
        {renderPerformersList('WORST PERFORMERS', worstPerformers, false)}
      </div>
    );
  };
  
  // ============================================================================
  // RENDER - MODULE 10: CORRELATION LAB
  // ============================================================================
  
  /**
   * Rendu du laboratoire de corrélations
   */
  const renderCorrelationLab = () => {
    if (filteredAssets.length < 2) return null;
    
    const getRiskBadgeClass = (risk) => {
      if (risk === 'ÉLEVÉ') return 'bg-red-500/20 text-red-400 border-red-500/40';
      if (risk === 'MODÉRÉ') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      return 'bg-green-500/20 text-green-400 border-green-500/40';
    };
    
    return (
      <div className="p-4 space-y-4 border-b border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="text-pink-400" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            <h3 className="text-xs font-black text-gray-400 tracking-widest">
              LABORATOIRE DE CORRÉLATIONS
            </h3>
          </div>
          <Zap size={14} className="text-pink-400 animate-pulse" />
        </div>
        
        {/* Actifs sélectionnés */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-gray-400">Actifs sélectionnés ({selectedAssets.length})</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetSelection}
                className="text-xs font-bold text-gray-400 hover:text-cyan-400 transition-colors"
                aria-label="Réinitialiser la sélection"
              >
                Reset
              </button>
              <button
                onClick={handleSelectAll}
                className="text-xs font-bold text-gray-400 hover:text-cyan-400 transition-colors"
                aria-label="Sélectionner tous les actifs"
              >
                Select All
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {filteredAssets.map((asset) => (
              <div
                key={asset.symbol}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: `${asset.color}20`,
                  borderColor: `${asset.color}60`
                }}
              >
                <span className="text-xs font-black" style={{ color: asset.color }}>
                  {asset.symbol}
                </span>
                {selectedAssets.length > 2 && (
                  <button
                    onClick={() => handleRemoveAsset(asset.symbol)}
                    className="hover:opacity-70 transition-opacity"
                    aria-label={`Supprimer ${asset.symbol}`}
                  >
                    <X size={12} style={{ color: asset.color }} />
                  </button>
                )}
              </div>
            ))}
            
            {selectedAssets.length < 8 && (
              <button
                onClick={() => setShowAssetSelector(!showAssetSelector)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-gray-600 hover:border-cyan-400 text-gray-400 hover:text-cyan-400 transition-all"
                aria-label="Ajouter un actif"
              >
                <Plus size={12} />
                <span className="text-xs font-bold">Ajouter</span>
              </button>
            )}
          </div>
          
          {/* Sélecteur d'actifs */}
          {showAssetSelector && availableAssets.length > 0 && (
            <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg space-y-2">
              <h5 className="text-xs font-bold text-gray-400 mb-2">Actifs disponibles</h5>
              <div className="flex flex-wrap gap-2">
                {availableAssets.map((asset) => (
                  <button
                    key={asset.symbol}
                    onClick={() => handleAddAsset(asset.symbol)}
                    className="px-3 py-1.5 rounded-lg border border-gray-600 hover:border-cyan-400 text-xs font-bold text-gray-300 hover:text-cyan-400 transition-all"
                    aria-label={`Ajouter ${asset.name}`}
                  >
                    {asset.symbol} - {asset.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Matrice de corrélations */}
        <div className="overflow-x-auto">
          <h4 className="text-xs font-bold text-gray-400 mb-2">Matrice de corrélations</h4>
          <div className="inline-block min-w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-xs font-bold text-gray-500 text-left sticky left-0 bg-gray-900">
                    Actif
                  </th>
                  {filteredAssets.map((asset) => (
                    <th
                      key={asset.symbol}
                      className="p-2 text-xs font-black text-center"
                      style={{ color: asset.color }}
                    >
                      {asset.symbol}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((rowAsset) => (
                  <tr key={rowAsset.symbol}>
                    <td
                      className="p-2 text-xs font-black sticky left-0 bg-gray-900"
                      style={{ color: rowAsset.color }}
                    >
                      {rowAsset.symbol}
                    </td>
                    {filteredAssets.map((colAsset) => {
                      const value = getCorrelationValue(rowAsset.symbol, colAsset.symbol);
                      const isIdentity = rowAsset.symbol === colAsset.symbol;
                      
                      return (
                        <td
                          key={colAsset.symbol}
                          className={`p-2 text-center border transition-all duration-300 hover:scale-110 hover:z-10 ${
                            isIdentity 
                              ? 'bg-gray-700/50 border-gray-600' 
                              : getCorrelationCellClass(value)
                          }`}
                        >
                          <span className="text-xs font-black">
                            {isIdentity ? '1.00' : formatCorrelationValue(value)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="text-xs font-bold text-gray-400 mb-1">Corrélation moyenne</div>
            <div className="text-lg font-black text-white">
              {formatCorrelationValue(averageCorrelation)}
            </div>
          </div>
          
          <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="text-xs font-bold text-gray-400 mb-1">Risque Crypto</div>
            <span className={`text-xs font-black px-2 py-1 rounded-full border ${getRiskBadgeClass(cryptoCorrelationRisk)}`}>
              {cryptoCorrelationRisk}
            </span>
          </div>
          
          <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="text-xs font-bold text-gray-400 mb-1">Risque Tech</div>
            <span className={`text-xs font-black px-2 py-1 rounded-full border ${getRiskBadgeClass(techCorrelationRisk)}`}>
              {techCorrelationRisk}
            </span>
          </div>
          
          <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="text-xs font-bold text-gray-400 mb-1">Corrélations fortes</div>
            <div className="text-lg font-black text-green-400">
              {strongPositiveCorrelations.length}
            </div>
          </div>
        </div>
        
        {/* Bouton créer actif personnalisé */}
        <button
          onClick={() => setShowCustomAssetForm(true)}
          className="w-full p-3 border border-dashed border-gray-600 hover:border-pink-400 rounded-lg text-xs font-bold text-gray-400 hover:text-pink-400 transition-all flex items-center justify-center gap-2"
          aria-label="Créer un actif personnalisé"
        >
          <Plus size={14} />
          CRÉER UN ACTIF PERSONNALISÉ
        </button>
      </div>
    );
  };
  
  // ============================================================================
  // RENDER - MODULE 9: BEHAVIORAL ANALYSIS
  // ============================================================================
  
  /**
   * Rendu de l'analyse comportementale
   */
  const renderBehavioralAnalysis = () => {
    const winRate = ((behavioralData.winningTrades / behavioralData.totalTrades) * 100).toFixed(1);
    
    const getSeverityClass = (severity) => {
      if (severity === 'ÉLEVÉ') return 'bg-red-500/20 text-red-400 border-red-500/40';
      if (severity === 'MODÉRÉ') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      return 'bg-green-500/20 text-green-400 border-green-500/40';
    };
    
    return (
      <div className="p-4 space-y-4 border-b border-gray-700">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <svg className="text-orange-400" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <h3 className="text-xs font-black text-gray-400 tracking-widest">
            ANALYSE COMPORTEMENTALE
          </h3>
        </div>
        
        {/* Statistiques de trading */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="text-xs font-bold text-gray-400 mb-1">Total Trades</div>
            <div className="text-lg font-black text-white">{behavioralData.totalTrades}</div>
          </div>
          
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="text-xs font-bold text-gray-400 mb-1">Win Rate</div>
            <div className="text-lg font-black text-green-400">{winRate}%</div>
          </div>
          
          <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="text-xs font-bold text-gray-400 mb-1">Gain Moyen</div>
            <div className="text-sm font-black text-green-400">{behavioralData.avgWin}</div>
          </div>
          
          <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="text-xs font-bold text-gray-400 mb-1">Perte Moyenne</div>
            <div className="text-sm font-black text-red-400">{behavioralData.avgLoss}</div>
          </div>
        </div>
        
        {/* Meilleur/Pire créneau */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="text-xs font-bold text-gray-400 mb-1">Meilleur Créneau</div>
            <div className="text-sm font-black text-white mb-1">{bestTradingTime}</div>
            <div className="text-xs font-bold text-green-400">{bestTimePerformance}</div>
          </div>
          
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="text-xs font-bold text-gray-400 mb-1">Pire Créneau</div>
            <div className="text-sm font-black text-white mb-1">{worstTradingTime}</div>
            <div className="text-xs font-bold text-red-400">{worstTimePerformance}</div>
          </div>
        </div>
        
        {/* Biais détectés */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 mb-2">Biais Détectés</h4>
          <div className="space-y-2">
            {detectedBiases.map((bias, index) => (
              <div
                key={index}
                className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-orange-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-black text-white">{bias.name}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getSeverityClass(bias.severity)}`}>
                    {bias.severity}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{bias.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // ============================================================================
  // RENDER - MODULE 11: UNEXPECTED CORRELATIONS
  // ============================================================================
  
  /**
   * Rendu des corrélations inattendues
   */
  const renderUnexpectedCorrelations = () => {
    if (unexpectedCorrelations.length === 0) return null;
    
    const getStrengthClass = (strength) => {
      if (strength === 'FORTE') return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      if (strength === 'MODÉRÉE') return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
    };
    
    return (
      <div className="p-4 space-y-3 border-b border-gray-700">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <svg className="text-indigo-400" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <h3 className="text-xs font-black text-gray-400 tracking-widest">
            CORRÉLATIONS INATTENDUES
          </h3>
        </div>
        
        {/* Liste des corrélations */}
        <div className="space-y-2">
          {unexpectedCorrelations.map((corr) => (
            <div
              key={corr.id}
              className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg hover:border-indigo-500/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">{corr.asset1}</span>
                  <svg className="text-indigo-400" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span className="text-sm font-black text-white">{corr.asset2}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getStrengthClass(corr.strength)}`}>
                  {corr.strength}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-400">Corrélation:</span>
                <span className={`text-sm font-black ${corr.correlation > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {corr.correlation > 0 ? '+' : ''}{corr.correlation.toFixed(2)}
                </span>
              </div>
              
              <p className="text-xs text-gray-300">{corr.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // ============================================================================
  // RENDER - MODULE 12: ARBITRAGE OPPORTUNITIES
  // ============================================================================
  
  /**
   * Rendu des opportunités d'arbitrage
   */
  const renderArbitrageOpportunities = () => {
    if (arbitrageOpportunities.length === 0) return null;
    
    const getRiskClass = (risk) => {
      if (risk === 'ÉLEVÉ') return 'bg-red-500/20 text-red-400 border-red-500/40';
      if (risk === 'MODÉRÉ') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      return 'bg-green-500/20 text-green-400 border-green-500/40';
    };
    
    return (
      <div className="p-4 space-y-3 border-b border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="text-emerald-400" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
            <h3 className="text-xs font-black text-gray-400 tracking-widest">
              OPPORTUNITÉS D'ARBITRAGE
            </h3>
          </div>
          <span className="text-xs font-bold text-emerald-400">
            {arbitrageOpportunities.length} opportunité{arbitrageOpportunities.length > 1 ? 's' : ''}
          </span>
        </div>
        
        {/* Liste des opportunités */}
        <div className="space-y-2">
          {arbitrageOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:border-emerald-500/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-black text-white">{opp.asset}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400">{opp.spread}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getRiskClass(opp.risk)}`}>
                    {opp.risk}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="p-2 bg-gray-800/50 border border-gray-700 rounded">
                  <div className="text-xs text-gray-400">{opp.market1}</div>
                  <div className="text-xs font-bold text-white">{opp.price1}</div>
                </div>
                <div className="p-2 bg-gray-800/50 border border-gray-700 rounded">
                  <div className="text-xs text-gray-400">{opp.market2}</div>
                  <div className="text-xs font-bold text-white">{opp.price2}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Profit potentiel:</span>
                  <span className="font-black text-emerald-400">{opp.profit}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>{opp.timeWindow}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // ============================================================================
  // RENDER - MODULE 13: SENTIMENT MULTI-SOURCE
  // ============================================================================
  
  /**
   * Rendu du sentiment multi-source
   */
  const renderSentimentMultiSource = () => {
    const getCompositeSentimentColor = (score) => {
      if (score >= 70) return 'text-green-400';
      if (score >= 40) return 'text-yellow-400';
      return 'text-red-400';
    };
    
    const getSentimentBarClass = (score) => {
      if (score >= 70) return 'bg-green-500';
      if (score >= 40) return 'bg-yellow-500';
      return 'bg-red-500';
    };
    
    const getDivergenceLevelClass = (level) => {
      if (level === 'FORTE') return 'bg-red-500/20 text-red-400 border-red-500/40';
      if (level === 'MODÉRÉE') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    };
    
    const getSourceIcon = (icon) => {
      const icons = {
        twitter: (
          <svg className="text-blue-400" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
        ),
        reddit: (
          <svg className="text-orange-400" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
          </svg>
        ),
        news: (
          <Newspaper size={14} className="text-gray-400" />
        ),
        analysts: (
          <svg className="text-purple-400" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
        )
      };
      return icons[icon] || null;
    };
    
    return (
      <div className="p-4 space-y-4 border-b border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="text-teal-400" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <h3 className="text-xs font-black text-gray-400 tracking-widest">
              SENTIMENT MULTI-SOURCE
            </h3>
          </div>
          <Zap size={14} className="text-teal-400 animate-pulse" />
        </div>
        
        {/* Sentiment Composite */}
        <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
          <div className="text-xs font-bold text-gray-400 mb-2">Sentiment Composite</div>
          <div className="flex items-center justify-between mb-3">
            <div className={`text-4xl font-black ${getCompositeSentimentColor(compositeSentiment.score)}`}>
              {compositeSentiment.score}
            </div>
            <div className="flex items-center gap-1">
              {compositeSentiment.trend === 'up' ? (
                <TrendingUp size={16} className="text-green-400" />
              ) : (
                <TrendingDown size={16} className="text-red-400" />
              )}
              <span className={`text-sm font-black ${compositeSentiment.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {compositeSentiment.change}
              </span>
            </div>
          </div>
          {/* Barre de progression */}
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getSentimentBarClass(compositeSentiment.score)}`}
              style={{ width: `${compositeSentiment.score}%` }}
            />
          </div>
        </div>
        
        {/* Sources de Sentiment */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 mb-2">Sources de Sentiment</h4>
          <div className="space-y-2">
            {sentimentSources.map((source) => (
              <div
                key={source.name}
                className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-teal-500/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getSourceIcon(source.icon)}
                    <span className="text-sm font-bold text-white">{source.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-black ${getCompositeSentimentColor(source.score)}`}>
                      {source.score}
                    </span>
                    <span className={`text-xs font-bold ${source.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                      {source.change}
                    </span>
                  </div>
                </div>
                {/* Barre de progression */}
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getSentimentBarClass(source.score)}`}
                    style={{ width: `${source.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Divergences Détectées */}
        {sentimentDivergences.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-gray-400 mb-2">Divergences Détectées</h4>
            <div className="space-y-2">
              {sentimentDivergences.map((div) => (
                <div
                  key={div.id}
                  className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg hover:border-orange-500/50 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{div.source1}</span>
                      <svg className="text-orange-400" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span className="text-sm font-bold text-white">{div.source2}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getDivergenceLevelClass(div.level)}`}>
                      {div.level}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mb-1">
                    Écart: <span className="font-bold text-orange-400">{div.gap} points</span>
                  </div>
                  <p className="text-xs text-gray-300">{div.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // ============================================================================
  // RENDER - MODULE 14: PREDICTIVE INTELLIGENCE
  // ============================================================================
  
  /**
   * Rendu de l'intelligence prédictive
   */
  const renderPredictiveIntelligence = () => {
    const getDirectionColor = (direction) => {
      if (direction === 'HAUSSE') return 'text-green-400';
      if (direction === 'BAISSE') return 'text-red-400';
      return 'text-gray-400';
    };
    
    const getDirectionIcon = (direction) => {
      if (direction === 'HAUSSE') return <TrendingUp size={14} className="text-green-400" />;
      if (direction === 'BAISSE') return <TrendingDown size={14} className="text-red-400" />;
      return <span className="text-gray-400">—</span>;
    };
    
    const getScenarioClass = (type) => {
      if (type === 'optimiste') return 'bg-green-500/10 border-green-500/30';
      if (type === 'réaliste') return 'bg-blue-500/10 border-blue-500/30';
      return 'bg-red-500/10 border-red-500/30';
    };
    
    const getScenarioColor = (type) => {
      if (type === 'optimiste') return 'text-green-400';
      if (type === 'réaliste') return 'text-blue-400';
      return 'text-red-400';
    };
    
    const getSignalClass = (type) => {
      if (type === 'ACHAT') return 'bg-green-500/20 text-green-400 border-green-500/40';
      if (type === 'VENTE') return 'bg-red-500/20 text-red-400 border-red-500/40';
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
    };
    
    const getStrengthClass = (strength) => {
      if (strength === 'FORT') return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      if (strength === 'MODÉRÉ') return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
    };
    
    const getConfidenceColor = (confidence) => {
      if (confidence >= 80) return 'text-green-400';
      if (confidence >= 60) return 'text-yellow-400';
      return 'text-red-400';
    };
    
    return (
      <div className="p-4 space-y-4 border-b border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="text-violet-400" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            <h3 className="text-xs font-black text-gray-400 tracking-widest">
              INTELLIGENCE PRÉDICTIVE
            </h3>
          </div>
          <Zap size={14} className="text-violet-400 animate-pulse" />
        </div>
        
        {/* Prédictions Court Terme */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 mb-2">Prédictions Court Terme</h4>
          <div className="space-y-2">
            {shortTermPredictions.map((pred) => (
              <div
                key={pred.id}
                className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-violet-500/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">{pred.timeframe}</span>
                    {getDirectionIcon(pred.direction)}
                    <span className={`text-sm font-bold ${getDirectionColor(pred.direction)}`}>
                      {pred.direction}
                    </span>
                  </div>
                  <span className={`text-sm font-black ${pred.variation.startsWith('+') ? 'text-green-400' : pred.variation.startsWith('-') ? 'text-red-400' : 'text-gray-400'}`}>
                    {pred.variation}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-400">Confiance:</span>
                  <span className={`text-xs font-bold ${getConfidenceColor(pred.confidence)}`}>
                    {pred.confidence}%
                  </span>
                  <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${pred.confidence >= 80 ? 'bg-green-500' : pred.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${pred.confidence}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {pred.factors.map((factor, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded-full"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Scénarios Hebdomadaires */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 mb-2">Scénarios Hebdomadaires</h4>
          <div className="space-y-2">
            {weeklyScenarios.map((scenario) => (
              <div
                key={scenario.id}
                className={`p-3 border rounded-lg hover:border-opacity-70 transition-all duration-300 ${getScenarioClass(scenario.type)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-black uppercase ${getScenarioColor(scenario.type)}`}>
                    {scenario.type}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-black ${scenario.variation.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                      {scenario.variation}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({scenario.probability}%)
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 mb-2">
                  Prix cible: <span className={`font-bold ${getScenarioColor(scenario.type)}`}>{scenario.targetPrice} €</span>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {scenario.factors.map((factor, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded-full"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Signaux de Trading */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 mb-2">Signaux de Trading</h4>
          <div className="space-y-2">
            {tradingSignals.map((signal) => (
              <div
                key={signal.id}
                className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getSignalClass(signal.type)}`}>
                      {signal.type}
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getStrengthClass(signal.strength)}`}>
                      {signal.strength}
                    </span>
                  </div>
                  <span className={`text-xs font-bold ${getConfidenceColor(signal.confidence)}`}>
                    {signal.confidence}%
                  </span>
                </div>
                
                <div className="text-xs text-gray-400 mb-2">{signal.timeframe}</div>
                
                {signal.entryPrice && (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 bg-gray-800/50 border border-gray-700 rounded">
                      <div className="text-gray-400 mb-1">Entrée</div>
                      <div className="font-bold text-white">{signal.entryPrice} €</div>
                    </div>
                    <div className="p-2 bg-gray-800/50 border border-gray-700 rounded">
                      <div className="text-gray-400 mb-1">Stop Loss</div>
                      <div className="font-bold text-red-400">{signal.stopLoss} €</div>
                    </div>
                    <div className="p-2 bg-gray-800/50 border border-gray-700 rounded">
                      <div className="text-gray-400 mb-1">Take Profit</div>
                      <div className="font-bold text-green-400">{signal.takeProfit} €</div>
                    </div>
                  </div>
                )}
                
                {signal.reason && (
                  <p className="text-xs text-gray-300 mt-2 p-2 bg-gray-800/30 rounded">
                    {signal.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // ============================================================================
  // RENDER - MODAL AJOUT ACTION
  // ============================================================================
  
  /**
   * Rendu du modal pour ajouter une action
   */
  const renderAddStockModal = () => {
    if (!showModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
        <div className="bg-gray-900 border border-cyan-600 rounded-xl shadow-2xl p-6 w-96">
          <h3 className="text-2xl font-black text-cyan-400 mb-6 drop-shadow-glow tracking-widest">
            AJOUTER UNE ACTION
          </h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nom de l'entreprise"
              value={newStock.name}
              onChange={(e) => setNewStock(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white font-semibold focus:border-cyan-400 transition outline-none"
              aria-label="Nom de l'entreprise"
            />
            <input
              type="text"
              placeholder="Ticker (ex: AAPL)"
              value={newStock.ticker}
              onChange={(e) => setNewStock(prev => ({ ...prev, ticker: e.target.value }))}
              className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white font-semibold focus:border-cyan-400 transition outline-none"
              aria-label="Ticker"
            />
            <input
              type="text"
              placeholder="Prix actuel (€)"
              value={newStock.price}
              onChange={(e) => setNewStock(prev => ({ ...prev, price: e.target.value }))}
              className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white font-semibold focus:border-cyan-400 transition outline-none"
              aria-label="Prix actuel"
            />
            <input
              type="text"
              placeholder="Variation (ex: +2.5%)"
              value={newStock.change}
              onChange={(e) => setNewStock(prev => ({ ...prev, change: e.target.value }))}
              className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white font-semibold focus:border-cyan-400 transition outline-none"
              aria-label="Variation"
            />
            <input
              type="text"
              placeholder="Signal technique"
              value={newStock.signal}
              onChange={(e) => setNewStock(prev => ({ ...prev, signal: e.target.value }))}
              className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white font-semibold focus:border-cyan-400 transition outline-none"
              aria-label="Signal technique"
            />
            
            <label className="flex items-center gap-3 cursor-pointer text-gray-300 hover:text-cyan-400 transition p-3 border border-dashed border-gray-600 rounded-lg hover:border-cyan-400">
              <Upload size={20} />
              <span className="font-bold tracking-wide">UPLOADER UN LOGO</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleLogoUpload}
                aria-label="Upload logo"
              />
            </label>
            {logo && (
              <img
                src={logo}
                alt="preview"
                className="w-16 h-16 rounded-full border border-cyan-400 shadow-lg mx-auto"
              />
            )}
          </div>
          
          <div className="flex justify-end gap-4 mt-8">
            <button
              onClick={() => setShowModal(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-bold tracking-wide transition"
              aria-label="Annuler"
            >
              ANNULER
            </button>
            <button
              onClick={handleAddStock}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-3 rounded-lg shadow-lg font-black tracking-widest"
              aria-label="Ajouter l'action"
            >
              AJOUTER
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================
  
  return (
    <div className="surveillance-container">
      <div className="w-full rounded-2xl shadow-2xl bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 border border-gray-700">
        {/* MODULE 1: Header Premium */}
        {renderHeaderPremium()}
        
        {/* MODULE 2: Market Status */}
        {renderMarketStatus()}
        
        {/* MODULE 3: Stock Cards */}
        {renderStockCards()}
        
        {/* MODULE 4: Alerts */}
        {renderAlerts()}
        
        {/* MODULE 5: News Feed */}
        {renderNewsFeed()}
        
        {/* MODULE 6: AI Recommendations */}
        {renderAIRecommendations()}
        
        {/* MODULE 7: Economic Calendar */}
        {renderEconomicCalendar()}
        
        {/* MODULE 8: Performers */}
        {renderPerformers()}
        
        {/* MODULE 9: Behavioral Analysis */}
        {renderBehavioralAnalysis()}
        
        {/* MODULE 10: Correlation Lab */}
        {renderCorrelationLab()}
        
        {/* MODULE 11: Unexpected Correlations */}
        {renderUnexpectedCorrelations()}
        
        {/* MODULE 12: Arbitrage Opportunities */}
        {renderArbitrageOpportunities()}
        
        {/* MODULE 13: Sentiment Multi-Source */}
        {renderSentimentMultiSource()}
        
        {/* MODULE 14: Predictive Intelligence */}
        {renderPredictiveIntelligence()}
        
        {/* Bouton Ajouter Action */}
        <div className="flex justify-center p-4 border-t border-gray-700">
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-full px-8 py-3 shadow-lg flex items-center gap-3 font-black tracking-widest text-sm transition-all duration-300 hover:scale-105"
            aria-label="Ajouter une action"
          >
            <Plus size={20} />
            AJOUTER ACTION
          </button>
        </div>
        
        {/* Modal Ajout Action */}
        {renderAddStockModal()}
        
        {/* Modal Création Actif Personnalisé */}
        {showCustomAssetForm && (
          <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
            <div className="bg-gray-900 border border-pink-600 rounded-xl shadow-2xl p-6 w-96">
              <h3 className="text-2xl font-black text-pink-400 mb-6 drop-shadow-glow tracking-widest">
                CRÉER UN ACTIF
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nom de l'actif"
                  value={newCustomAsset.name}
                  onChange={(e) => setNewCustomAsset(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white font-semibold focus:border-pink-400 transition outline-none"
                  aria-label="Nom de l'actif"
                />
                <input
                  type="text"
                  placeholder="Symbole (ex: CUSTOM)"
                  value={newCustomAsset.symbol}
                  onChange={(e) => setNewCustomAsset(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                  className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white font-semibold focus:border-pink-400 transition outline-none"
                  aria-label="Symbole"
                />
                <input
                  type="text"
                  placeholder="Votre holding"
                  value={newCustomAsset.yourHolding}
                  onChange={(e) => setNewCustomAsset(prev => ({ ...prev, yourHolding: e.target.value }))}
                  className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white font-semibold focus:border-pink-400 transition outline-none"
                  aria-label="Votre holding"
                />
              </div>
              
              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={() => setShowCustomAssetForm(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-bold tracking-wide transition"
                  aria-label="Annuler"
                >
                  ANNULER
                </button>
                <button
                  onClick={handleCreateCustomAsset}
                  className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-8 py-3 rounded-lg shadow-lg font-black tracking-widest"
                  aria-label="Créer l'actif"
                >
                  CRÉER
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// PROPTYPES
// ============================================================================

SurveillanceBlock.propTypes = {
  onRefresh: PropTypes.func
};

export default SurveillanceBlock;
