/**
 * NewsCard Component
 * Carte d'actualité avec sentiment, impact et qualité
 */

import { ExternalLink, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

const NewsCard = ({ news, onClick }) => {
  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-green-400 bg-green-500/20 border-green-500/50';
      case 'negative': return 'text-red-400 bg-red-500/20 border-red-500/50';
      case 'neutral': return 'text-slate-400 bg-slate-500/20 border-slate-500/50';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/50';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/50';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      case 'low': return 'text-blue-400 bg-blue-500/20 border-blue-500/50';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/50';
    }
  };

  const getQualityIcon = (quality) => {
    if (quality >= 80) return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (quality >= 60) return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    return <AlertCircle className="w-4 h-4 text-red-400" />;
  };

  const getSentimentIcon = (sentiment) => {
    if (sentiment === 'positive') return <TrendingUp className="w-4 h-4" />;
    if (sentiment === 'negative') return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  const getCategoryLabel = (category) => {
    const labels = {
      tout: 'Tout',
      france: 'France',
      monde: 'Monde',
      bourse: 'Bourse',
      crypto: 'Crypto',
      economie: 'Économie',
      tech: 'Tech',
      sport: 'Sport',
      culture: 'Culture',
      politique: 'Politique',
      sante: 'Santé',
      environnement: 'Environnement'
    };
    return labels[category] || category;
  };

  return (
    <div
      onClick={onClick}
      className="group relative p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 hover:bg-slate-800/70 transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium line-clamp-2 group-hover:text-blue-400 transition-colors">
            {news.title}
          </h4>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span>{news.source}</span>
            <span>•</span>
            <span>{news.time || 'Il y a 2h'}</span>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Category */}
        <span className="px-2 py-1 text-xs font-medium bg-slate-700/50 text-slate-300 rounded border border-slate-600">
          {getCategoryLabel(news.category)}
        </span>

        {/* Sentiment */}
        <span className={`px-2 py-1 text-xs font-medium rounded border flex items-center gap-1 ${getSentimentColor(news.sentiment)}`}>
          {getSentimentIcon(news.sentiment)}
          {news.sentiment}
        </span>

        {/* Impact */}
        <span className={`px-2 py-1 text-xs font-medium rounded border ${getImpactColor(news.impact)}`}>
          Impact: {news.impact}
        </span>
      </div>

      {/* Quality Score */}
      <div className="flex items-center gap-2">
        {getQualityIcon(news.quality)}
        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              news.quality >= 80 ? 'bg-green-500' :
              news.quality >= 60 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${news.quality}%` }}
          ></div>
        </div>
        <span className="text-xs text-slate-400 font-medium">{news.quality}%</span>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none"></div>
    </div>
  );
};

export default NewsCard;
