// ================ SURVEILLANCE BLOCK - VERSION MODULAIRE FINALE ================

// ================ CSS SURVEILLANCE MODULAIRE DÉJÀ CHARGÉ DANS INDEX.HTML ================
// Le CSS modulaire est maintenant chargé via surveillance-complete.css dans index.html


window.SurveillanceBlock = {
  template: `
    <div class="surveillance-container">
      <div class="w-full max-w-sm rounded-2xl shadow-2xl bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 border border-gray-700">
      <!-- Header (intégré dans le composant principal) -->
      <div class="flex items-center justify-between p-4 border-b border-gray-700">
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <svg class="text-cyan-400 drop-shadow-glow flex-shrink-0" width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
          </svg>
          <h1 class="super-title text-cyan-400 drop-shadow-glow">SURVEILLANCE</h1>
        </div>
        <span class="bg-cyan-600 text-white label-caps px-2 py-1 rounded-full shadow-neon-cyan flex-shrink-0 ml-1">
          {{ watchedStocksCount }} ACTIONS
        </span>
      </div>

      <!-- Market Status Block -->
      <market-status-block 
        :market-indices="marketIndices"
        :commodities-and-crypto="commoditiesAndCrypto">
      </market-status-block>

      <!-- Stock Cards Block -->
      <stock-cards-block 
        :stocks="stocks"
        @update-stock-logo="updateStockLogo">
      </stock-cards-block>

      <!-- Alerts Block -->
      <alerts-block></alerts-block>

      <!-- News Block -->
      <news-block :news-items="newsItems"></news-block>

      <!-- AI Recommendations Block -->
      <ai-recommendations-block :ai-recommendations="aiRecommendations"></ai-recommendations-block>

      <!-- Economic Calendar Block -->
      <economic-calendar-block 
        :crypto-events="cryptoEvents"
        :stock-events="stockEvents"
        :commodity-events="commodityEvents"
        :economic-events="economicEvents"
        :expanded-crypto="expandedCrypto"
        :expanded-stocks="expandedStocks"
        :expanded-commodities="expandedCommodities"
        :expanded-economic="expandedEconomic"
        @toggle-crypto-expansion="expandedCrypto = !expandedCrypto"
        @toggle-stocks-expansion="expandedStocks = !expandedStocks"
        @toggle-commodities-expansion="expandedCommodities = !expandedCommodities"
        @toggle-economic-expansion="expandedEconomic = !expandedEconomic">
      </economic-calendar-block>

      <!-- Performers Block -->
      <performers-block 
        :top-performers="topPerformers"
        :worst-performers="worstPerformers">
      </performers-block>

      <!-- Behavioral Block -->
      <behavioral-block 
        :behavioral-data="behavioralData"
        :best-trading-time="bestTradingTime"
        :best-time-performance="bestTimePerformance"
        :worst-trading-time="worstTradingTime"
        :worst-time-performance="worstTimePerformance"
        :detected-biases="detectedBiases">
      </behavioral-block>

      <!-- Laboratoire de Corrélations -->
      <correlation-lab-block
        :correlation-assets="correlationAssets"
        :correlation-matrix="correlationMatrix"
        :selected-assets="selectedAssets"
        :show-asset-selector="showAssetSelector"
        :show-custom-asset-form="showCustomAssetForm"
        :new-custom-asset="newCustomAsset"
        :available-assets="availableAssets"
        @update-selected-assets="selectedAssets = $event"
        @toggle-asset-selector="showAssetSelector = !showAssetSelector"
        @open-create-asset-modal="showCustomAssetForm = true"
        @close-create-asset-modal="showCustomAssetForm = false"
        @reset-selection="resetSelection"
        @select-all-assets="selectAllAssets"
        @remove-from-selection="removeFromSelection"
        @create-custom-asset="createCustomAsset">
      </correlation-lab-block>

      <!-- Corrélations Inattendues -->
      <unexpected-correlations-block 
        :unexpected-correlations="unexpectedCorrelations">
      </unexpected-correlations-block>

      <!-- Opportunités d'Arbitrage -->
      <arbitrage-opportunities-block 
        :arbitrage-opportunities="arbitrageOpportunities">
      </arbitrage-opportunities-block>

      <!-- Sentiment Multi-Source -->
      <sentiment-multi-source-block 
        :composite-sentiment="compositeSentiment"
        :sentiment-sources="sentimentSources"
        :sentiment-divergences="sentimentDivergences">
      </sentiment-multi-source-block>

      <!-- Intelligence Prédictive -->
      <predictive-intelligence-block 
        :short-term-predictions="shortTermPredictions"
        :weekly-scenarios="weeklyScenarios"
        :trading-signals="tradingSignals">
      </predictive-intelligence-block>


        <!-- Add button -->
        <div class="flex justify-center p-4 border-t border-gray-700">
          <button @click="showModal = true" class="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-full px-8 py-3 shadow-neon-cyan flex items-center gap-3 font-black tracking-widest text-sm">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
            </svg>
            AJOUTER ACTION
          </button>
        </div>

        <!-- Modal for adding stock -->
        <div v-if="showModal" class="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
          <div class="bg-gray-900 border border-cyan-600 rounded-xl shadow-neon-cyan p-6 w-96">
            <h3 class="text-2xl font-black text-cyan-400 mb-6 drop-shadow-glow tracking-widest">AJOUTER UNE ACTION</h3>
            <div class="space-y-4">
              <input type="text" placeholder="Nom de l'entreprise" v-model="newStock.name" class="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white font-semibold focus:border-cyan-400 transition" />
              <input type="text" placeholder="Ticker (ex: AAPL)" v-model="newStock.ticker" class="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white font-semibold focus:border-cyan-400 transition" />
              <input type="text" placeholder="Prix actuel (€)" v-model="newStock.price" class="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white font-semibold focus:border-cyan-400 transition" />
              <input type="text" placeholder="Variation (ex: +2.5%)" v-model="newStock.change" class="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white font-semibold focus:border-cyan-400 transition" />
              <input type="text" placeholder="Signal technique" v-model="newStock.signal" class="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white font-semibold focus:border-cyan-400 transition" />

              <label class="flex items-center gap-3 cursor-pointer text-gray-300 hover:text-cyan-400 transition p-3 border border-dashed border-gray-600 rounded-lg hover:border-cyan-400">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
                <span class="font-bold tracking-wide">UPLOADER UN LOGO</span>
                <input type="file" class="hidden" accept="image/*" @change="handleLogoUpload" />
              </label>
              <img v-if="logo" :src="logo" alt="preview" class="w-16 h-16 rounded-full border border-cyan-400 shadow-neon-cyan mx-auto" />
            </div>

            <div class="flex justify-end gap-4 mt-8">
              <button @click="showModal = false" class="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-bold tracking-wide transition">
                ANNULER
              </button>
              <button @click="handleAddStock" class="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-3 rounded-lg shadow-neon-cyan font-black tracking-widest">
                AJOUTER
              </button>
            </div>
          </div>
        </div>

        <!-- Modal pour créer un actif personnalisé -->
        <div v-if="showCustomAssetForm" class="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
          <div class="bg-gray-900 border border-pink-600 rounded-xl shadow-neon-pink p-6 w-96">
            <h3 class="text-2xl font-black text-pink-400 mb-6 drop-shadow-glow tracking-widest">CRÉER UN ACTIF</h3>
            <div class="space-y-4">
              <input type="text" placeholder="Nom de l'actif" v-model="newCustomAsset.name" class="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white font-semibold focus:border-pink-400 transition" />
              <input type="text" placeholder="Symbole (ex: CUSTOM)" v-model="newCustomAsset.symbol" class="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white font-semibold focus:border-pink-400 transition" />
              <input type="text" placeholder="Votre holding" v-model="newCustomAsset.yourHolding" class="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white font-semibold focus:border-pink-400 transition" />
            </div>

            <div class="flex justify-end gap-4 mt-8">
              <button @click="showCustomAssetForm = false" class="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-bold tracking-wide transition">
                ANNULER
              </button>
              <button @click="createCustomAsset" class="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-8 py-3 rounded-lg shadow-neon-pink font-black tracking-widest">
                CRÉER
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,

  components: {
    'market-status-block': window.MarketStatusBlock,
    'stock-cards-block': window.StockCardsBlock,
    'alerts-block': window.AlertsBlock,
    'news-block': window.NewsBlock,
    'ai-recommendations-block': window.AIRecommendationsBlock,
    'economic-calendar-block': window.EconomicCalendarBlock,
    'performers-block': window.PerformersBlock,
    'behavioral-block': window.BehavioralBlock,
    'correlation-lab-block': window.CorrelationLabBlock,
    'unexpected-correlations-block': window.UnexpectedCorrelationsBlock,
    'arbitrage-opportunities-block': window.ArbitrageOpportunitiesBlock,
    'sentiment-multi-source-block': window.SentimentMultiSourceBlock,
    'predictive-intelligence-block': window.PredictiveIntelligenceBlock
  },

  data() {
    return {
      // Données centralisées depuis SurveillanceData
      ...window.SurveillanceData,
      
      // États pour les modals et interactions
      showModal: false,
      newStock: {
        name: '',
        ticker: '',
        price: '',
        change: '',
        signal: ''
      },
      logo: null,
      
      // États pour la sélection des corrélations
      selectedAssets: ['BTC', 'ETH', 'NVDA', 'TSLA', 'OR'], // Sélection par défaut
      correlationMatrix: window.SurveillanceData.correlationMatrix,
      
      // États pour l'expansion des sections
      expandedCrypto: false,
      expandedStocks: false,
      expandedCommodities: false,
      expandedEconomic: false,
      
      // États pour les interactions avancées
      showAssetSelector: false,
      showCustomAssetForm: false,
      newCustomAsset: {
        name: '',
        symbol: '',
        yourHolding: '',
        performance7d: '+0.0%'
      }
    };
  },

  computed: {
    watchedStocksCount() {
      return this.stocks.length;
    },

    // Corrélations avancées
    strongPositiveCorrelations() {
      return Object.entries(this.correlationMatrix)
        .filter(([pair, value]) => value > 0.7)
        .slice(0, 5);
    },

    strongNegativeCorrelations() {
      return Object.entries(this.correlationMatrix)
        .filter(([pair, value]) => value < -0.5)
        .slice(0, 5);
    },

    averageCorrelation() {
      const values = Object.values(this.correlationMatrix);
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    },

    cryptoCorrelationRisk() {
      const cryptoPairs = Object.entries(this.correlationMatrix)
        .filter(([pair]) => pair.includes('btc') || pair.includes('eth') || pair.includes('sol'));
      const avgCorr = cryptoPairs.reduce((sum, [, value]) => sum + Math.abs(value), 0) / cryptoPairs.length;
      return avgCorr > 0.7 ? 'ÉLEVÉ' : avgCorr > 0.5 ? 'MODÉRÉ' : 'FAIBLE';
    },

    techCorrelationRisk() {
      const techPairs = Object.entries(this.correlationMatrix)
        .filter(([pair]) => pair.includes('nvda') || pair.includes('tsla') || pair.includes('aapl'));
      const avgCorr = techPairs.reduce((sum, [, value]) => sum + Math.abs(value), 0) / techPairs.length;
      return avgCorr > 0.7 ? 'ÉLEVÉ' : avgCorr > 0.5 ? 'MODÉRÉ' : 'FAIBLE';
    },

    filteredCorrelationAssets() {
      return this.correlationAssets.filter(asset => this.selectedAssets.includes(asset.symbol));
    },

    availableAssets() {
      return this.correlationAssets.filter(asset => !this.selectedAssets.includes(asset.symbol));
    }
  },

  methods: {
    // Méthodes pour la gestion des stocks
    handleAddStock() {
      if (this.newStock.name && this.newStock.ticker) {
        const newStock = {
          name: this.newStock.name,
          ticker: this.newStock.ticker,
          price: this.newStock.price || '0.00',
          change: this.newStock.change || '+0.0%',
          signal: this.newStock.signal || 'NEUTRE',
          logo: this.logo
        };
        
        this.stocks.push(newStock);
        
        // Reset form
        this.newStock = { name: '', ticker: '', price: '', change: '', signal: '' };
        this.logo = null;
        this.showModal = false;
        

      }
    },

    handleLogoUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.logo = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },

    updateStockLogo(ticker, logo) {
      const stock = this.stocks.find(s => s.ticker === ticker);
      if (stock) {
        stock.logo = logo;
      }
    },

    // Méthodes pour la gestion des corrélations
    resetSelection() {
      const newSelection = ['BTC', 'ETH'];
      this.selectedAssets = newSelection;
      this.saveSelectedAssets();

    },

    selectAllAssets() {
      const allSymbols = this.correlationAssets.map(asset => asset.symbol);
      this.selectedAssets = allSymbols.slice(0, 8); // Limiter à 8 pour éviter la surcharge
      this.saveSelectedAssets();
      this.$forceUpdate();
    },

    removeFromSelection(symbol) {
      if (this.selectedAssets.length <= 2) {
        return;
      }
      this.selectedAssets = this.selectedAssets.filter(s => s !== symbol);
      this.saveSelectedAssets();
      this.$forceUpdate();
    },

    createCustomAsset(assetData) {
      const newAsset = {
        ...assetData,
        color: assetData.color || '#' + Math.floor(Math.random()*16777215).toString(16),
        performance7d: '+0.0%'
      };
      
      this.correlationAssets.push(newAsset);
      this.showCustomAssetForm = false;

    },

    // Méthodes utilitaires pour les corrélations
    getCorrelationValue(asset1, asset2) {
      const key = `${asset1.toLowerCase()}_${asset2.toLowerCase()}`;
      const reverseKey = `${asset2.toLowerCase()}_${asset1.toLowerCase()}`;
      return this.correlationMatrix[key] || this.correlationMatrix[reverseKey] || 0;
    },

    // Méthodes pour les prédictions
    getPredictionClass(direction) {
      return direction === 'HAUSSE' ? 'bg-green-500/20 border-green-500/40' : 'bg-red-500/20 border-red-500/40';
    },

    getPredictionDirectionClass(direction) {
      return direction === 'HAUSSE' ? 'text-green-400' : 'text-red-400';
    },

    getConfidenceClass(confidence) {
      if (confidence >= 80) return 'bg-green-500/30 text-green-400';
      if (confidence >= 60) return 'bg-yellow-500/30 text-yellow-400';
      return 'bg-red-500/30 text-red-400';
    },

    // Méthodes de sauvegarde
    saveSelectedAssets() {
      localStorage.setItem('surveillance_selected_assets', JSON.stringify(this.selectedAssets));
    },

    loadSelectedAssets() {
      const saved = localStorage.getItem('surveillance_selected_assets');
      if (saved) {
        this.selectedAssets = JSON.parse(saved);
      }
    },

    // ========== MÉTHODES POUR CORRÉLATIONS (depuis version monolithique) ==========
    getCorrelationValue(asset1, asset2) {
      return window.SurveillanceCalculations?.getCorrelationValue(this.correlationMatrix, asset1, asset2) || 0;
    },

    formatCorrelationValue(value) {
      return window.SurveillanceCalculations?.formatCorrelationValue(value) || '0.00';
    },

    getCorrelationStrength(value) {
      return window.SurveillanceCalculations?.getCorrelationStrength(value) || 'NULLE';
    },

    getCorrelationCellClass(value) {
      return window.SurveillanceStyles?.getCorrelationCellClass(value) || '';
    },

    // ========== MÉTHODES POUR GESTION D'ACTIFS ==========
    getAssetColor(symbol) {
      const asset = this.correlationAssets.find(a => a.symbol === symbol);
      return asset?.color || '#6b7280';
    },

    getAssetHolding(symbol) {
      const asset = this.correlationAssets.find(a => a.symbol === symbol);
      return asset?.yourHolding || '';
    },

    // ========== MÉTHODES POUR INTERACTIONS ==========
    showCorrelationDetails(asset1, asset2) {
      const correlation = this.getCorrelationValue(asset1.symbol, asset2.symbol);
      const strength = this.getCorrelationStrength(correlation);
      
    },

    highlightCorrelation(asset1, asset2) {
      // Animation de mise en évidence
      this.$nextTick(() => {
        const cells = document.querySelectorAll('.correlation-cell-enhanced');
        cells.forEach(cell => {
          cell.style.opacity = '0.3';
        });
        
        // Mettre en évidence la cellule survolée
        if (event && event.target) {
          event.target.style.opacity = '1';
          event.target.style.transform = 'scale(1.1)';
          event.target.style.zIndex = '10';
        }
      });
    },

    clearHighlight() {
      this.$nextTick(() => {
        const cells = document.querySelectorAll('.correlation-cell-enhanced');
        cells.forEach(cell => {
          cell.style.opacity = '1';
          cell.style.transform = 'scale(1)';
          cell.style.zIndex = 'auto';
        });
      });
    },

    // Méthodes de mise à jour périodique
    startPeriodicUpdates() {
      // Mise à jour des corrélations toutes les 30 secondes
      this.correlationUpdateInterval = setInterval(() => {
        if (window.SurveillanceCalculations?.updateCorrelationsDemo) {
          window.SurveillanceCalculations.updateCorrelationsDemo(this);
        }
      }, 30000);
      
      // Mise à jour du sentiment toutes les 45 secondes
      this.sentimentUpdateInterval = setInterval(() => {
        if (window.SurveillanceCalculations?.updateSentimentDemo) {
          window.SurveillanceCalculations.updateSentimentDemo(this);
        }
      }, 45000);
      
      // Mise à jour des prédictions toutes les 60 secondes
      this.predictionUpdateInterval = setInterval(() => {
        if (window.SurveillanceCalculations?.updatePredictionsDemo) {
          window.SurveillanceCalculations.updatePredictionsDemo(this);
        }
      }, 60000);
    },

    stopPeriodicUpdates() {
      if (this.correlationUpdateInterval) {
        clearInterval(this.correlationUpdateInterval);
      }
      if (this.sentimentUpdateInterval) {
        clearInterval(this.sentimentUpdateInterval);
      }
      if (this.predictionUpdateInterval) {
        clearInterval(this.predictionUpdateInterval);
      }
    }
  },

  mounted() {

    
    // Charger la sélection d'actifs sauvegardée
    this.loadSelectedAssets();
    
    // Initialiser les corrélations
    if (window.SurveillanceCalculations?.calculateCorrelationMatrix) {
      this.correlationMatrix = window.SurveillanceCalculations.calculateCorrelationMatrix(
        this.correlationAssets, 
        this.selectedAssets
      );
    }
    
    // Démarrer les mises à jour périodiques
    this.startPeriodicUpdates();
  },

  beforeDestroy() {
    // Nettoyer les timers et événements
    this.stopPeriodicUpdates();
  }
};
