/**
 * MetricsPanel Component
 * 
 * Panneau affichant les métriques avancées de lecture avec analyse détaillée.
 * Inclut le temps total avec répartition, analyse des sessions, accomplissements
 * et métriques temporelles avancées.
 * 
 * @see Requirements 7.1, 7.2, 7.3
 */

import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Clock, Target, TrendingUp, Calendar, Award, 
  BarChart3, PieChart, Users, Zap, Star, Trophy,
  ChevronDown, ChevronUp, Activity, Timer
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { useTranslation } from '../../../../utils/translations';

const MetricCard = ({ icon: Icon, title, value, subtitle, trend, color = 'purple', onClick, isExpandable = false, isExpanded = false }) => {
  const colorClasses = {
    purple: 'text-purple-300 bg-purple-500/10 border-purple-500/20',
    blue: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
    green: 'text-green-300 bg-green-500/10 border-green-500/20',
    orange: 'text-orange-300 bg-orange-500/10 border-orange-500/20',
    red: 'text-red-300 bg-red-500/10 border-red-500/20',
    slate: 'text-slate-300 bg-slate-500/10 border-slate-500/20'
  };

  return (
    <Card variant="glass" className={`border ${colorClasses[color]} ${isExpandable ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <CardContent className="metric-card">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${colorClasses[color].split(' ')[0]}`} />
              <span className="metric-title text-xs font-medium text-slate-400 uppercase tracking-wide">
                {title}
              </span>
            </div>
            <div className="metric-value text-2xl font-bold text-white mb-1">
              {value}
            </div>
            {subtitle && (
              <div className="metric-subtitle text-xs text-slate-400">
                {subtitle}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {trend && (
              <div className={`text-xs px-2 py-1 rounded-full ${
                trend.type === 'positive' 
                  ? 'bg-green-500/20 text-green-300' 
                  : trend.type === 'negative'
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-slate-500/20 text-slate-300'
              }`}>
                {trend.value}
              </div>
            )}
            {isExpandable && (
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant pour les sections expandables avec persistance
const ExpandableSection = ({ 
  title, 
  icon: Icon, 
  children, 
  sectionId,
  defaultExpanded = false,
  userPreferences 
}) => {
  const isExpanded = userPreferences?.isSectionExpanded 
    ? userPreferences.isSectionExpanded(sectionId)
    : defaultExpanded;
  
  const handleToggle = () => {
    if (userPreferences?.toggleSection) {
      userPreferences.toggleSection(sectionId);
    }
  };
  
  return (
    <Card variant="glass" className="expandable-section">
      <CardHeader 
        className="expandable-header"
        onClick={handleToggle}
      >
        <CardTitle size="sm" className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-purple-300" />
            {title}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="expandable-content">
          {children}
        </CardContent>
      )}
    </Card>
  );
};

// Composant pour l'analyse des sessions
const SessionAnalysis = ({ metrics, patterns }) => {
  const t = useTranslation();
  
  // Répartition horaire basée sur les données réelles si disponibles
  const hourlyDistribution = React.useMemo(() => {
    const buckets = patterns?.bestTimeOfDay?.buckets || {};
    const order = [
      '6h-9h',
      '9h-12h',
      '12h-14h',
      '14h-18h',
      '18h-22h',
      '22h-6h',
    ];

    const colorByKey = {
      '6h-9h': 'bg-yellow-400',
      '9h-12h': 'bg-orange-400',
      '12h-14h': 'bg-red-400',
      '14h-18h': 'bg-blue-400',
      '18h-22h': 'bg-purple-400',
      '22h-6h': 'bg-indigo-400',
    };

    const items = order.map((key) => {
      const data = buckets[key] || {};
      return {
        hour: key,
        label: data.label || key,
        sessions: data.sessionCount || 0,
        color: colorByKey[key] || 'bg-emerald-400',
      };
    });

    const totalSessions = items.reduce((sum, s) => sum + s.sessions, 0);
    if (totalSessions === 0) {
      return null;
    }
    return items;
  }, [patterns]);
  
  const maxSessions = hourlyDistribution
    ? Math.max(...hourlyDistribution.map((h) => h.sessions))
    : 0;
  
  return (
    <div className="space-y-4">
      {/* Métriques de session */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">Durée moyenne</div>
          <div className="text-lg font-bold text-white">
            {metrics.averageSessionDuration?.toFixed(1) || 0}min
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">Fréquence</div>
          <div className="text-lg font-bold text-white">
            {metrics.readingFrequency?.toFixed(1) || 0}/sem
          </div>
        </div>
      </div>
      
      {/* Répartition horaire */}
      {hourlyDistribution ? (
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3">Répartition horaire</h4>
          <div className="space-y-2">
            {hourlyDistribution.map((slot) => (
              <div key={slot.hour} className="flex items-center gap-3">
                <div className="w-16 text-xs text-slate-400">{slot.hour}</div>
                <div className="flex-1 bg-slate-700 rounded-full h-2 relative">
                  <div
                    className={`${slot.color} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${maxSessions > 0 ? (slot.sessions / maxSessions) * 100 : 0}%` }}
                  />
                </div>
                <div className="w-8 text-xs text-slate-300 text-right">
                  {slot.sessions}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-400">
          Ajoute l'heure de début de tes sessions pour voir à quels moments tu lis le plus.
        </div>
      )}
      
      {/* Jours les plus productifs */}
      {patterns?.bestDaysOfWeek && (
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3">Meilleurs jours</h4>
          <div className="space-y-2">
            {Object.values(patterns.bestDaysOfWeek)
              .sort((a, b) => b.averagePagesPerDay - a.averagePagesPerDay)
              .slice(0, 3)
              .map((day, index) => (
                <div key={day.dayName} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      index === 0 ? 'bg-yellow-400' : 
                      index === 1 ? 'bg-slate-300' : 'bg-orange-400'
                    }`} />
                    <span className="text-sm text-slate-300">{day.dayName}</span>
                  </div>
                  <span className="text-sm text-white font-medium">
                    {day.averagePagesPerDay?.toFixed(1) || 0} p/j
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Composant pour les accomplissements
const AccomplishmentsSection = ({ books, metrics, predictions }) => {
  const t = useTranslation();
  
  // Filtrer uniquement les livres explicitement marqués comme terminés
  const completedBooks = books?.filter(book => 
    book.status === 'completed'
  ) || [];
  
  // Trier par date de dernière session (approximation de la date de fin)
  const recentCompletions = completedBooks
    .map(book => {
      const sessions = book.readingSessions || [];
      const lastSession = sessions.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      )[0];
      
      const totalPages = sessions.reduce((sum, s) => sum + (s.pagesRead || 0), 0);
      const totalTime = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      
      return {
        ...book,
        lastSessionDate: lastSession?.date,
        totalPages,
        totalTime,
        sessionsCount: sessions.length
      };
    })
    .filter(book => book.lastSessionDate)
    .sort((a, b) => new Date(b.lastSessionDate) - new Date(a.lastSessionDate))
    .slice(0, 5);
  
  // Statistiques d'accomplissement
  const accomplishmentStats = {
    totalCompleted: completedBooks.length,
    averageCompletionTime: recentCompletions.length > 0 ? 
      recentCompletions.reduce((sum, book) => sum + book.totalTime, 0) / recentCompletions.length : 0,
    fastestCompletion: recentCompletions.length > 0 ? 
      Math.min(...recentCompletions.map(book => book.totalTime)) : 0,
    longestBook: recentCompletions.length > 0 ? 
      Math.max(...recentCompletions.map(book => book.totalPages)) : 0
  };
  
  return (
    <div className="space-y-4">
      {/* Statistiques d'accomplissement */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <div className="text-xs text-green-300 mb-1">Livres terminés</div>
          <div className="text-lg font-bold text-white">
            {accomplishmentStats.totalCompleted}
          </div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="text-xs text-blue-300 mb-1">Temps moyen</div>
          <div className="text-lg font-bold text-white">
            {accomplishmentStats.averageCompletionTime > 0 ? 
              `${Math.round(accomplishmentStats.averageCompletionTime / 60)}h` : 'N/A'}
          </div>
        </div>
      </div>
      
      {/* Livres récemment terminés */}
      {recentCompletions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3">Récemment terminés</h4>
          <div className="space-y-3">
            {recentCompletions.map((book, index) => (
              <div key={book.id} className="bg-slate-800/30 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-white text-sm mb-1">
                      {book.title}
                    </div>
                    <div className="text-xs text-slate-400">
                      {book.author} • {new Date(book.lastSessionDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-300">
                      <span>{book.totalPages} pages</span>
                      <span>{Math.round(book.totalTime / 60)}h de lecture</span>
                      <span>{book.sessionsCount} sessions</span>
                    </div>
                  </div>
                  {index < 3 && (
                    <Trophy className={`w-4 h-4 ${
                      index === 0 ? 'text-yellow-400' : 
                      index === 1 ? 'text-slate-300' : 'text-orange-400'
                    }`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Prédictions de fin */}
      {predictions && predictions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3">Prochaines fins estimées</h4>
          <div className="space-y-2">
            {predictions.slice(0, 3).map((prediction) => (
              <div key={prediction.bookId} className="flex items-center justify-between bg-slate-800/30 rounded-lg p-2">
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">
                    {prediction.bookTitle}
                  </div>
                  <div className="text-xs text-slate-400">
                    {prediction.progressPercent}% • {prediction.remainingPages} pages restantes
                  </div>
                </div>
                <div className="text-xs text-purple-300 font-medium">
                  ~{prediction.estimatedHours}h
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MetricsPanel = ({ statisticsData, selectedPeriod, books = [], userPreferences }) => {
  const t = useTranslation();
  const [expandedMetric, setExpandedMetric] = useState(null); // 'pages' | 'time' | 'speed' | null

  if (!statisticsData || !statisticsData.hasData) {
    return (
      <div className="space-y-4">
        <Card variant="glass">
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400">
              {t('books.statistics.metrics.noData', 'Aucune métrique disponible')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { metrics, patterns, predictions, aggregatedData } = statisticsData;

  const totalDaysInPeriod =
    (aggregatedData && typeof aggregatedData.periodDays === 'number'
      ? aggregatedData.periodDays
      : metrics.uniqueDays) || 0;
  const daysWithReading = metrics.uniqueDays || 0;

  // Calculer les tendances (placeholder - sera implémenté avec les données historiques)
  const getTrend = (current, previous) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      type: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
      value: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
    };
  };

  // Formater la durée en heures et minutes (arrondi pour éviter les débordements)
  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return '0min';
    // Arrondir à l'entier le plus proche pour éviter les décimales
    const roundedMinutes = Math.round(minutes);
    if (roundedMinutes < 60) return `${roundedMinutes}min`;
    const hours = Math.floor(roundedMinutes / 60);
    const remainingMinutes = roundedMinutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes.toString().padStart(2, '0')}min` : `${hours}h`;
  };

  // Formater la vitesse de lecture
  const formatSpeed = (pagesPerHour) => {
    return `${pagesPerHour.toFixed(1)} p/h`;
  };

  // Livres ayant réellement contribué aux métriques (au moins une session)
  const booksWithStats = useMemo(() => {
    if (!Array.isArray(books) || books.length === 0) return [];

    const withActivity = books
      .map((book) => {
        const sessions = Array.isArray(book.readingSessions) ? book.readingSessions : [];
        const totalPages = sessions.reduce((sum, s) => sum + (s.pagesRead || 0), 0);
        const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
        return {
          ...book,
          _statsTotalPages: totalPages,
          _statsTotalMinutes: totalMinutes,
          _statsSessions: sessions.length,
        };
      })
      .filter((b) => b._statsTotalPages > 0 || b._statsTotalMinutes > 0);

    return withActivity.sort((a, b) => b._statsTotalPages - a._statsTotalPages);
  }, [books]);

  const topBooks = useMemo(() => booksWithStats.slice(0, 4), [booksWithStats]);

  return (
    <div className="space-y-4">
      {/* Métriques de base - Vue compacte */}
      <div className="metrics-grid">
        <MetricCard
          icon={BookOpen}
          title={t('books.statistics.metrics.totalPages', 'Pages lues')}
          value={metrics.totalPages?.toLocaleString() || '0'}
          subtitle={`${metrics.booksCompleted || 0} livre(s) terminé(s)`}
          color="purple"
          isExpandable
          isExpanded={expandedMetric === 'pages'}
          onClick={() => setExpandedMetric(expandedMetric === 'pages' ? null : 'pages')}
        />

        <MetricCard
          icon={Clock}
          title={t('books.statistics.metrics.totalTime', 'Temps total')}
          value={formatDuration(metrics.totalTime || 0)}
          subtitle={`${metrics.sessionsCount || 0} session(s)`}
          color="blue"
          isExpandable
          isExpanded={expandedMetric === 'time'}
          onClick={() => setExpandedMetric(expandedMetric === 'time' ? null : 'time')}
        />
      </div>

      <div className="metrics-grid">
        <MetricCard
          icon={TrendingUp}
          title={t('books.statistics.metrics.averageSpeed', 'Vitesse moyenne')}
          value={formatSpeed(metrics.averageSpeed || 0)}
          subtitle={`${(metrics.averageSessionDuration || 0).toFixed(1)}min/session`}
          color="green"
          isExpandable
          isExpanded={expandedMetric === 'speed'}
          onClick={() => setExpandedMetric(expandedMetric === 'speed' ? null : 'speed')}
        />

        <MetricCard
          icon={Calendar}
          title={t('books.statistics.metrics.currentStreak', 'Série actuelle')}
          value={`${metrics.currentStreak || 0} jour(s)`}
          subtitle={`Record: ${metrics.longestStreak || 0} jour(s)`}
          color="orange"
        />
      </div>

      {/* Détail lié aux métriques principales */}
      {expandedMetric && booksWithStats.length > 0 && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle size="sm" className="flex items-center gap-2 text-slate-200">
              {expandedMetric === 'pages' && (
                <>
                  <BookOpen className="w-4 h-4" />
                  <span>Pages lues par livre</span>
                </>
              )}
              {expandedMetric === 'time' && (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Temps total par livre</span>
                </>
              )}
              {expandedMetric === 'speed' && (
                <>
                  <TrendingUp className="w-4 h-4" />
                  <span>Vitesse moyenne par livre</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2 text-xs text-slate-300 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 pb-1 border-b border-slate-700/60">
                <div className="font-semibold text-slate-400">Livre</div>
                {expandedMetric === 'pages' && (
                  <div className="font-semibold text-slate-400 text-right">Pages</div>
                )}
                {expandedMetric === 'time' && (
                  <div className="font-semibold text-slate-400 text-right">Temps</div>
                )}
                {expandedMetric === 'speed' && (
                  <div className="font-semibold text-slate-400 text-right">Vitesse</div>
                )}
              </div>

              {booksWithStats.map((book) => {
                const initials = (book.title || '?')
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase() || '')
                  .join('');

                const speed =
                  book._statsTotalMinutes > 0
                    ? (book._statsTotalPages / (book._statsTotalMinutes / 60)).toFixed(1)
                    : null;

                return (
                  <div
                    key={book.id}
                    className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 items-center"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-12 rounded-md overflow-hidden bg-slate-800 flex items-center justify-center text-[10px] text-slate-300 border border-slate-700/60 flex-shrink-0">
                        {book.hasCover && book.coverInline ? (
                          <img
                            src={book.coverInline}
                            alt={book.title || 'Couverture'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-100 truncate">
                          {book.title || t('books.detail.noTitle', 'Livre sans titre')}
                        </div>
                        {book.author && (
                          <div className="text-slate-400 truncate">
                            {book.author}
                          </div>
                        )}
                      </div>
                    </div>
                    {expandedMetric === 'pages' && (
                      <div className="text-right">{book._statsTotalPages}</div>
                    )}
                    {expandedMetric === 'time' && (
                      <div className="text-right">
                        {formatDuration(book._statsTotalMinutes || 0)}
                      </div>
                    )}
                    {expandedMetric === 'speed' && (
                      <div className="text-right">
                        {speed ? `${speed} p/h` : '—'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Temps total avec répartition par période */}
      <ExpandableSection 
        title="Analyse temporelle détaillée" 
        icon={BarChart3}
        sectionId="temporal-analysis"
        defaultExpanded={true}
        userPreferences={userPreferences}
      >
        <div className="space-y-4">
          {/* Répartition du temps total */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3">Répartition du temps</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
                <div className="text-xs text-purple-300 mb-1">Quotidien</div>
                <div className="text-sm font-bold text-white truncate" title={formatDuration((metrics.totalTime || 0) / Math.max(1, metrics.uniqueDays || 1))}>
                  {formatDuration((metrics.totalTime || 0) / Math.max(1, metrics.uniqueDays || 1))}
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                <div className="text-xs text-blue-300 mb-1">Hebdomadaire</div>
                <div className="text-sm font-bold text-white truncate" title={formatDuration((metrics.totalTime || 0) / Math.max(1, Math.ceil((metrics.uniqueDays || 1) / 7)))}>
                  {formatDuration((metrics.totalTime || 0) / Math.max(1, Math.ceil((metrics.uniqueDays || 1) / 7)))}
                </div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                <div className="text-xs text-green-300 mb-1">Par session</div>
                <div className="text-sm font-bold text-white truncate" title={formatDuration(metrics.averageSessionDuration || 0)}>
                  {formatDuration(metrics.averageSessionDuration || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Métriques de régularité */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3">Régularité</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Jours avec lecture</span>
                <span className="text-sm text-white font-medium">
                  {patterns?.readingConsistency || 0}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-green-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${patterns?.readingConsistency || 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>
                  {daysWithReading} jour{daysWithReading > 1 ? 's' : ''} avec lecture
                  {' '}sur {totalDaysInPeriod || '—'} jour{totalDaysInPeriod > 1 ? 's' : ''} de la période
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Fréquence moyenne: {Math.round((metrics.readingFrequency || 0) * 10) / 10} session(s)/sem</span>
                <span>Jours actifs: {metrics.uniqueDays || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </ExpandableSection>

      {/* Détail par livre (pages / temps / vitesse) */}
      {booksWithStats.length > 0 && (
        <ExpandableSection
          title="Détail par livre"
          icon={BookOpen}
          sectionId="books-detail"
          defaultExpanded={false}
          userPreferences={userPreferences}
        >
          <div className="space-y-3 text-xs text-slate-300">
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 pb-1 border-b border-slate-700/60">
              <div className="font-semibold text-slate-400">Livre</div>
              <div className="font-semibold text-slate-400 text-right">Pages lues</div>
              <div className="font-semibold text-slate-400 text-right">Temps total</div>
              <div className="font-semibold text-slate-400 text-right">Vitesse</div>
            </div>
            {booksWithStats.map((book) => {
              const initials = (book.title || '?')
                .split(' ')
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase() || '')
                .join('');

              const speed =
                book._statsTotalMinutes > 0
                  ? (book._statsTotalPages / (book._statsTotalMinutes / 60)).toFixed(1)
                  : null;

              return (
                <div
                  key={book.id}
                  className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 items-center"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-12 rounded-md overflow-hidden bg-slate-800 flex items-center justify-center text-[10px] text-slate-300 border border-slate-700/60 flex-shrink-0">
                      {book.hasCover && book.coverInline ? (
                        <img
                          src={book.coverInline}
                          alt={book.title || 'Couverture'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-100 truncate">
                        {book.title || t('books.detail.noTitle', 'Livre sans titre')}
                      </div>
                      {book.author && (
                        <div className="text-slate-400 truncate">
                          {book.author}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">{book._statsTotalPages}</div>
                  <div className="text-right">
                    {formatDuration(book._statsTotalMinutes || 0)}
                  </div>
                  <div className="text-right">
                    {speed ? `${speed} p/h` : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </ExpandableSection>
      )}

      {/* Aperçu des livres concernés par les stats */}
      {topBooks.length > 0 && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle size="sm" className="text-slate-200">
              {t('books.statistics.metrics.relatedBooks', 'Livres concernés')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto py-1">
              {topBooks.map((book) => {
                const initials = (book.title || '?')
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase() || '')
                  .join('');

                return (
                  <div
                    key={book.id}
                    className="flex items-center gap-3 min-w-[170px]"
                  >
                    <div className="w-10 h-14 rounded-md overflow-hidden bg-slate-800 flex items-center justify-center text-xs text-slate-300 border border-slate-700/60">
                      {book.hasCover && book.coverInline ? (
                        <img
                          src={book.coverInline}
                          alt={book.title || 'Couverture'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-300 space-y-0.5">
                      <div className="font-semibold text-slate-100 truncate max-w-[140px]">
                        {book.title || t('books.detail.noTitle', 'Livre sans titre')}
                      </div>
                      {book.author && (
                        <div className="text-slate-400 truncate max-w-[140px]">
                          {book.author}
                        </div>
                      )}
                      <div className="text-slate-400">
                        {book._statsTotalPages} pages • {book._statsSessions} session(s)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}


      {/* Objectifs (si définis) */}
      {metrics.dailyGoal && (
        <Card variant="glass" className="border border-yellow-500/20">
          <CardHeader>
            <CardTitle size="sm" className="flex items-center gap-2 text-yellow-300">
              <Target className="w-4 h-4" />
              {t('books.statistics.metrics.dailyGoal', 'Objectif quotidien')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Aujourd'hui</span>
                <span className="text-white font-medium">
                  {metrics.todayProgress || 0} / {metrics.dailyGoal} min
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, ((metrics.todayProgress || 0) / metrics.dailyGoal) * 100)}%` 
                  }}
                />
              </div>
              <div className="text-xs text-slate-400">
                {((metrics.todayProgress || 0) / metrics.dailyGoal * 100).toFixed(1)}% complété
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MetricsPanel;
export { SessionAnalysis, AccomplishmentsSection };