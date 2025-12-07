/**
 * NewsBlock Component
 * Bloc News - PRIORITY-LOW (Bloc 28)
 * Actualités financières avec filtres avancés et tri
 */

import { useState } from 'react';
import { Newspaper, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import NewsCard from './NewsCard';
import FilterBar from './FilterBar';

const NewsBlock = ({ newsData, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('tout');
  const [filters, setFilters] = useState({
    impact: { value: [], options: [
      { value: 'high', label: 'Élevé', count: 12 },
      { value: 'medium', label: 'Moyen', count: 25 },
      { value: 'low', label: 'Faible', count: 18 }
    ]},
    source: { value: [], options: [
      { value: 'coindesk', label: 'CoinDesk', count: 8 },
      { value: 'bloomberg', label: 'Bloomberg', count: 15 },
      { value: 'reuters', label: 'Reuters', count: 12 },
      { value: 'wsj', label: 'Wall Street Journal', count: 10 }
    ]},
    sentiment: { value: [], options: [
      { value: 'positive', label: 'Positif', count: 20 },
      { value: 'neutral', label: 'Neutre', count: 22 },
      { value: 'negative', label: 'Négatif', count: 13 }
    ]}
  });
  const [sortBy, setSortBy] = useState('recence');

  if (!newsData) {
    return (
      <div className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="text-center text-slate-400">Chargement des actualités...</div>
      </div>
    );
  }

  const { news, apiStatus, marketStatus, stats } = newsData;

  const tabs = [
    { id: 'tout', label: 'Tout', count: news.length },
    { id: 'bourse', label: 'Bourse', count: news.filter(n => n.category === 'bourse').length },
    { id: 'crypto', label: 'Crypto', count: news.filter(n => n.category === 'crypto').length },
    { id: 'economie', label: 'Économie', count: news.filter(n => n.category === 'economie').length },
    { id: 'politique', label: 'Politique', count: news.filter(n => n.category === 'politique').length }
  ];

  const sortOptions = [
    { value: 'recence', label: 'Plus récent' },
    { value: 'anciennete', label: 'Plus ancien' },
    { value: 'pertinence', label: 'Pertinence' },
    { value: 'sentiment', label: 'Sentiment' }
  ];

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: { ...prev[filterKey], value }
    }));
  };

  const handleResetFilters = () => {
    setFilters(prev => {
      const reset = {};
      Object.keys(prev).forEach(key => {
        reset[key] = { ...prev[key], value: [] };
      });
      return reset;
    });
  };

  const filteredNews = news
    .filter(item => activeTab === 'tout' || item.category === activeTab)
    .filter(item => {
      // Apply filters
      const impactFilter = filters.impact.value;
      const sourceFilter = filters.source.value;
      const sentimentFilter = filters.sentiment.value;

      if (impactFilter.length > 0 && !impactFilter.includes(item.impact)) return false;
      if (sourceFilter.length > 0 && !sourceFilter.includes(item.source.toLowerCase())) return false;
      if (sentimentFilter.length > 0 && !sentimentFilter.includes(item.sentiment)) return false;

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recence':
          return new Date(b.time || 0) - new Date(a.time || 0);
        case 'anciennete':
          return new Date(a.time || 0) - new Date(b.time || 0);
        case 'pertinence':
          return b.quality - a.quality;
        case 'sentiment':
          const sentimentOrder = { positive: 3, neutral: 2, negative: 1 };
          return sentimentOrder[b.sentiment] - sentimentOrder[a.sentiment];
        default:
          return 0;
      }
    });

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border-2 border-emerald-500/50 rounded-2xl p-6 backdrop-blur-sm col-span-full">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-transparent pointer-events-none"></div>

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
              <Newspaper className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Actualités Financières</h3>
              <p className="text-sm text-slate-400 mt-1">Dernières nouvelles des marchés</p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 font-medium rounded-lg transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-6">
            {/* API Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">APIs:</span>
              {Object.entries(apiStatus).map(([api, status]) => (
                <div key={api} className="flex items-center gap-1">
                  {status === 'ok' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-xs text-slate-300 capitalize">{api}</span>
                </div>
              ))}
            </div>

            {/* Market Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Marchés:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                marketStatus === 'open' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-red-500/20 text-red-400 border border-red-500/50'
              }`}>
                {marketStatus === 'open' ? 'Ouverts' : 'Fermés'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-slate-400">Total: </span>
              <span className="text-white font-semibold">{stats.total}</span>
            </div>
            <div>
              <span className="text-slate-400">Aujourd'hui: </span>
              <span className="text-white font-semibold">{stats.today}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50'
                  : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:border-slate-500'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                activeTab === tab.id
                  ? 'bg-emerald-500/30 text-emerald-300'
                  : 'bg-slate-600/50 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Trier par:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* News Grid */}
        {filteredNews.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune actualité trouvée</p>
            <p className="text-sm mt-1">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNews.map(item => (
              <NewsCard
                key={item.id}
                news={item}
                onClick={() => window.open(item.url, '_blank')}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {filteredNews.length > 0 && filteredNews.length < news.length && (
          <div className="text-center">
            <button className="px-6 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-white font-medium rounded-lg transition-all">
              Charger plus d'actualités
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsBlock;
