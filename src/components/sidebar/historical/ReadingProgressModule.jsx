/**
 * ReadingProgressModule - Module de progression lecture (Position 3)
 * Structure identique aux anciens modules sidebar
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { memo, useCallback, useState, useMemo } from 'react';
import deepLinkService from '../../../services/navigation/DeepLinkService';
import StatCard from '../enhanced/StatCard';
import PeriodSelector from '../enhanced/PeriodSelector';
import ReadingProgressChart from '../../charts/ReadingProgressChart';
import '../../../styles/sidebar-visual-enhancements.css';

/**
 * Composant principal ReadingProgressModule - PATTERN LEGACY
 */
const ReadingProgressModule = memo(({ 
  isExpanded,
  onToggle,
  data = {},
  navigation
}) => {
  // Période sélectionnée pour les calculs (Requirement 2.1, 2.2)
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  // Calculs sur périodes configurables (Requirements 2.1, 2.2)
  const periodMetrics = useMemo(() => {
    const days = selectedPeriod === '7d' ? 7 : 
                 selectedPeriod === '30d' ? 30 : 
                 selectedPeriod === '3m' ? 90 : 
                 selectedPeriod === '6m' ? 180 : 365;
    
    return calculateReadingMetrics(data.readingSessions || [], days);
  }, [data.readingSessions, selectedPeriod]);

  // Données formatées pour le graphique en barres (Requirement 2.1, 2.2)
  const chartData = useMemo(() => {
    const days = selectedPeriod === '7d' ? 7 : 
                 selectedPeriod === '30d' ? 30 : 
                 selectedPeriod === '3m' ? 90 : 
                 selectedPeriod === '6m' ? 180 : 365;
    
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    
    // Générer les données par jour pour la période
    const dailyData = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const daySessions = (data.readingSessions || []).filter(session => {
        const sessionDate = new Date(session.date || session.startTime);
        return sessionDate.toISOString().split('T')[0] === dateStr;
      });
      
      // Calculer les pages par type de lecture
      const fiction = daySessions
        .filter(s => s.bookType === 'fiction' || s.genre === 'fiction')
        .reduce((sum, s) => sum + (s.pagesRead || 0), 0);
      
      const nonFiction = daySessions
        .filter(s => s.bookType === 'non-fiction' || s.genre === 'non-fiction')
        .reduce((sum, s) => sum + (s.pagesRead || 0), 0);
      
      const technical = daySessions
        .filter(s => s.bookType === 'technical' || s.genre === 'technical')
        .reduce((sum, s) => sum + (s.pagesRead || 0), 0);
      
      const total = fiction + nonFiction + technical;
      
      if (total > 0 || dailyData.length < 7) { // Toujours montrer au moins 7 jours
        dailyData.push({
          date: dateStr,
          fiction,
          nonFiction,
          technical,
          total,
          formattedDate: d.toLocaleDateString('fr-FR', { 
            month: 'short', 
            day: 'numeric' 
          })
        });
      }
    }
    
    // Limiter à 14 points maximum pour la lisibilité
    if (dailyData.length > 14) {
      const step = Math.ceil(dailyData.length / 14);
      return dailyData.filter((_, index) => index % step === 0);
    }
    
    return dailyData;
  }, [data.readingSessions, selectedPeriod]);

  // Calcul des tendances (Requirement 2.5)
  const trends = useMemo(() => {
    const previousPeriodMetrics = calculateReadingMetrics(
      data.readingSessions || [], 
      selectedPeriod === '7d' ? 14 : 
      selectedPeriod === '30d' ? 60 : 
      selectedPeriod === '3m' ? 180 : 
      selectedPeriod === '6m' ? 360 : 730,
      selectedPeriod === '7d' ? 7 : 
      selectedPeriod === '30d' ? 30 : 
      selectedPeriod === '3m' ? 90 : 
      selectedPeriod === '6m' ? 180 : 365
    );
    
    return calculateTrends(periodMetrics, previousPeriodMetrics);
  }, [periodMetrics, data.readingSessions, selectedPeriod]);

  // Données de la période précédente pour comparaison (Task 3.3)
  const previousPeriodChartData = useMemo(() => {
    const days = selectedPeriod === '7d' ? 7 : 
                 selectedPeriod === '30d' ? 30 : 
                 selectedPeriod === '3m' ? 90 : 
                 selectedPeriod === '6m' ? 180 : 365;
    
    const previousEndDate = new Date();
    previousEndDate.setDate(previousEndDate.getDate() - days);
    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);
    
    // Générer les données de la période précédente
    const previousDailyData = [];
    for (let d = new Date(previousStartDate); d <= previousEndDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const daySessions = (data.readingSessions || []).filter(session => {
        const sessionDate = new Date(session.date || session.startTime);
        return sessionDate.toISOString().split('T')[0] === dateStr;
      });
      
      const fiction = daySessions
        .filter(s => s.bookType === 'fiction' || s.genre === 'fiction')
        .reduce((sum, s) => sum + (s.pagesRead || 0), 0);
      
      const nonFiction = daySessions
        .filter(s => s.bookType === 'non-fiction' || s.genre === 'non-fiction')
        .reduce((sum, s) => sum + (s.pagesRead || 0), 0);
      
      const technical = daySessions
        .filter(s => s.bookType === 'technical' || s.genre === 'technical')
        .reduce((sum, s) => sum + (s.pagesRead || 0), 0);
      
      const total = fiction + nonFiction + technical;
      
      if (total > 0 || previousDailyData.length < 7) {
        previousDailyData.push({
          date: dateStr,
          fiction,
          nonFiction,
          technical,
          total,
          formattedDate: d.toLocaleDateString('fr-FR', { 
            month: 'short', 
            day: 'numeric' 
          })
        });
      }
    }
    
    return previousDailyData;
  }, [data.readingSessions, selectedPeriod]);

  // Objectifs de lecture configurables (Task 3.3)
  const readingObjectives = useMemo(() => {
    // Objectifs par défaut basés sur des recommandations standards
    const baseObjectives = {
      daily: 50,      // 50 pages par jour
      weekly: 350,    // 7 * 50 pages
      monthly: 1500   // 30 * 50 pages
    };

    // Ajuster selon les données utilisateur si disponibles
    if (data.readingGoals) {
      return {
        daily: data.readingGoals.dailyPages || baseObjectives.daily,
        weekly: data.readingGoals.weeklyPages || baseObjectives.weekly,
        monthly: data.readingGoals.monthlyPages || baseObjectives.monthly
      };
    }

    return baseObjectives;
  }, [data.readingGoals]);

  /**
   * Calcule les métriques de lecture pour une période donnée
   */
  function calculateReadingMetrics(sessions, days, offset = 0) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - offset);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    
    const periodSessions = sessions.filter(session => {
      const sessionDate = new Date(session.date || session.startTime);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
    
    const totalPages = periodSessions.reduce((sum, session) => sum + (session.pagesRead || 0), 0);
    const totalTime = periodSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const avgSpeed = totalTime > 0 ? (totalPages / (totalTime / 60)) : 0;
    
    return {
      sessions: periodSessions.length,
      totalPages,
      totalTime: Math.round(totalTime / 60), // en minutes
      avgSpeed: Math.round(avgSpeed * 10) / 10
    };
  }

  /**
   * Calcule les indicateurs de tendance (Requirement 2.5)
   */
  function calculateTrends(current, previous) {
    const getTrendIcon = (currentValue, previousValue) => {
      if (previousValue === 0) return '➡️';
      const change = ((currentValue - previousValue) / previousValue) * 100;
      if (change > 5) return '↗️';
      if (change < -5) return '↘️';
      return '➡️';
    };

    return {
      sessions: getTrendIcon(current.sessions, previous.sessions),
      pages: getTrendIcon(current.totalPages, previous.totalPages),
      time: getTrendIcon(current.totalTime, previous.totalTime),
      speed: getTrendIcon(current.avgSpeed, previous.avgSpeed)
    };
  }

  // Handler de navigation
  const handleNavigateToBooks = useCallback(async () => {
    if (navigation?.setActiveTab) {
      try {
        await deepLinkService.navigateToModule({
          tab: 'books',
          subtab: 'reading',
          moduleId: 'reading-progress',
          scrollBehavior: 'smooth'
        }, navigation.setActiveTab);
      } catch (error) {
        console.error('Erreur de navigation vers Livres:', error);
        // Fallback
        navigation.setActiveTab('books');
      }
    }
  }, [navigation]);

  // Handler pour drill-down dans le graphique (Task 3.4)
  const handleChartDrillDown = useCallback(async (drillDownData) => {
    if (navigation?.setActiveTab) {
      try {
        // Navigation vers les détails avec contexte de la date sélectionnée
        await deepLinkService.navigateToModule({
          tab: 'books',
          subtab: 'reading',
          moduleId: 'reading-sessions',
          params: {
            date: drillDownData.date,
            readingType: drillDownData.readingType,
            filter: 'day'
          },
          scrollBehavior: 'smooth'
        }, navigation.setActiveTab);
      } catch (error) {
        console.error('Erreur de navigation drill-down:', error);
        // Fallback vers l'onglet livres
        navigation.setActiveTab('books');
      }
    }
  }, [navigation]);

  // Formatage du temps
  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}min` : `${hours}h`;
  };

  return (
    <section className={`sidebar-section ${isExpanded ? 'expanded' : ''}`}>
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon">📚</span>
          Progression Lecture
        </h2>
        <span 
          className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`}
          aria-hidden="true"
        >
          ▼
        </span>
      </header>

      {isExpanded && (
        <div className="sidebar-section-content">
          {/* Sélecteur de période enrichi - CORRIGE LES CARRÉS BLANCS */}
          <PeriodSelector
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            options={[
              { value: '7d', label: '7j' },
              { value: '30d', label: '30j' },
              { value: '3m', label: '3m' },
              { value: '6m', label: '6m' },
              { value: '1a', label: '1an' }
            ]}
            label="Période d'analyse"
            icon="📅"
          />

          {/* Graphique en barres empilées avec objectifs, comparaisons et interactivité (Task 3.3 + 3.4) */}
          <ReadingProgressChart
            data={chartData}
            title="Pages lues par jour"
            subtitle={`Période : ${selectedPeriod === '7d' ? '7 jours' : 
                                   selectedPeriod === '30d' ? '30 jours' : 
                                   selectedPeriod === '3m' ? '3 mois' : 
                                   selectedPeriod === '6m' ? '6 mois' : '1 an'}`}
            height={200}
            showTooltip={true}
            showGrid={true}
            showLegend={true}
            showObjectives={true}
            dailyObjective={readingObjectives.daily}
            monthlyObjective={readingObjectives.monthly}
            previousPeriodData={previousPeriodChartData}
            onBarClick={handleChartDrillDown}
            enableAnimations={true}
            className="reading-progress-chart"
          />

          <div className="sidebar-content-dense">
            {/* Sessions avec tendance */}
            <StatCard
              title="Sessions"
              value={periodMetrics.sessions}
              trend={trends.sessions}
              icon="📖"
              color="var(--sidebar-cyan)"
              onClick={handleNavigateToBooks}
            />

            {/* Pages avec tendance */}
            <StatCard
              title="Pages lues"
              value={periodMetrics.totalPages.toLocaleString()}
              trend={trends.pages}
              icon="📄"
              color="var(--sidebar-blue)"
              onClick={handleNavigateToBooks}
            />

            {/* Temps avec tendance */}
            <StatCard
              title="Temps total"
              value={formatTime(periodMetrics.totalTime)}
              trend={trends.time}
              icon="⏱️"
              color="var(--sidebar-purple)"
              onClick={handleNavigateToBooks}
            />

            {/* Vitesse avec tendance */}
            <StatCard
              title="Vitesse moyenne"
              value={`${periodMetrics.avgSpeed} p/h`}
              trend={trends.speed}
              icon="⚡"
              color="var(--sidebar-yellow)"
              onClick={handleNavigateToBooks}
            />
          </div>
        </div>
      )}
    </section>
  );
});

ReadingProgressModule.displayName = 'ReadingProgressModule';

export default ReadingProgressModule;