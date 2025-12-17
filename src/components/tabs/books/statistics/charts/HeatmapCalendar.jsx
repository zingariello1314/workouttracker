/**
 * HeatmapCalendar Component
 * 
 * Calendrier heatmap affichant la régularité de lecture avec intensité colorée.
 * Calcule automatiquement les streaks et permet la navigation entre années.
 * 
 * @see Requirements 4.1, 4.2, 4.4, 4.5
 */

import React, { useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Flame, TrendingUp } from 'lucide-react';
import { useTranslation } from '../../../../../utils/translations';

// Utilitaires pour les dates
const getDaysInYear = (year) => {
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  return isLeapYear ? 366 : 365;
};

const getDateString = (date) => {
  return date.toISOString().split('T')[0];
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { 
    weekday: 'long',
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });
};

// Générer toutes les dates d'une année
const generateYearDates = (year) => {
  const dates = [];
  const startDate = new Date(year, 0, 1);
  const daysInYear = getDaysInYear(year);
  
  for (let i = 0; i < daysInYear; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(getDateString(date));
  }
  
  return dates;
};

// Calculer l'intensité de couleur basée sur l'activité
const getIntensityLevel = (pages, maxPages) => {
  if (pages === 0) return 0;
  if (maxPages === 0) return 1;
  
  const ratio = pages / maxPages;
  if (ratio >= 0.8) return 4; // Très actif
  if (ratio >= 0.6) return 3; // Actif
  if (ratio >= 0.3) return 2; // Modéré
  return 1; // Faible
};

// Calculer les streaks de lecture
const calculateStreaks = (activityData) => {
  const sortedDates = Object.keys(activityData).sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let streaks = [];
  let currentStreakStart = null;

  for (let i = 0; i < sortedDates.length; i++) {
    const date = sortedDates[i];
    const dayData = activityData[date];
    const hasActivity = dayData && dayData.pages > 0;
    
    if (hasActivity) {
      if (currentStreak === 0) {
        currentStreakStart = date;
      }
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      if (currentStreak > 0) {
        streaks.push({
          start: currentStreakStart,
          end: sortedDates[i - 1],
          length: currentStreak
        });
        currentStreak = 0;
      }
    }
  }
  
  // Ajouter le streak actuel s'il existe
  if (currentStreak > 0) {
    streaks.push({
      start: currentStreakStart,
      end: sortedDates[sortedDates.length - 1],
      length: currentStreak
    });
  }

  return { currentStreak, longestStreak, streaks };
};

// Composant de tooltip pour une cellule
const DayTooltip = ({ date, data, onClose }) => {
  if (!data) return null;

  return (
    <div className="absolute z-50 bg-slate-800/95 border border-slate-600 rounded-lg p-3 shadow-lg min-w-48">
      <p className="font-semibold text-white mb-2">
        {formatDate(date)}
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-300">Pages lues:</span>
          <span className="text-white font-medium">{data.pages}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-300">Temps:</span>
          <span className="text-white font-medium">{data.minutes} min</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-300">Sessions:</span>
          <span className="text-white font-medium">{data.sessions}</span>
        </div>
        {data.books && data.books.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-600">
            <p className="text-xs text-slate-400 mb-1">Livres:</p>
            {data.books.slice(0, 2).map((book, index) => (
              <p key={index} className="text-xs text-slate-300">
                • {book.title}
              </p>
            ))}
            {data.books.length > 2 && (
              <p className="text-xs text-slate-400">
                ... et {data.books.length - 2} autre(s)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Composant de cellule du calendrier
const CalendarDay = ({ date, data, intensity, onClick, onMouseEnter, onMouseLeave }) => {
  const intensityColors = {
    0: 'bg-slate-800/30', // Pas d'activité
    1: 'bg-purple-900/40', // Faible
    2: 'bg-purple-700/60', // Modéré
    3: 'bg-purple-500/80', // Actif
    4: 'bg-purple-400' // Très actif
  };

  return (
    <div
      className={`w-3 h-3 rounded-sm cursor-pointer transition-all duration-200 hover:scale-110 ${intensityColors[intensity]}`}
      onClick={() => onClick(date, data)}
      onMouseEnter={(e) => onMouseEnter(e, date, data)}
      onMouseLeave={onMouseLeave}
      title={`${date}: ${data?.pages || 0} pages`}
    />
  );
};

const HeatmapCalendar = ({ books, statisticsData, selectedPeriod, filters }) => {
  const t = useTranslation();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [tooltip, setTooltip] = useState(null);

  // Traiter les données d'activité pour l'année sélectionnée
  const { activityData, maxPages, streakData, yearStats } = useMemo(() => {
    if (!statisticsData?.chartData?.heatmap) {
      return { activityData: {}, maxPages: 0, streakData: {}, yearStats: {} };
    }

    const heatmapData = statisticsData.chartData.heatmap;
    const yearDates = generateYearDates(selectedYear);
    
    // Créer un objet avec toutes les dates de l'année
    const activity = {};
    let maxPagesInYear = 0;
    
    yearDates.forEach(date => {
      const dayData = heatmapData.find(d => d.date === date);
      activity[date] = dayData || { pages: 0, minutes: 0, sessions: 0, books: [] };
      maxPagesInYear = Math.max(maxPagesInYear, activity[date].pages);
    });

    // Calculer les streaks
    const streaks = calculateStreaks(activity);
    
    // Calculer les statistiques de l'année
    const totalPages = Object.values(activity).reduce((sum, day) => sum + (day?.pages || 0), 0);
    const activeDays = Object.values(activity).filter(day => day && day.pages > 0).length;
    const totalMinutes = Object.values(activity).reduce((sum, day) => sum + (day?.minutes || 0), 0);

    return {
      activityData: activity,
      maxPages: maxPagesInYear,
      streakData: streaks,
      yearStats: {
        totalPages,
        activeDays,
        totalMinutes,
        averagePages: activeDays > 0 ? totalPages / activeDays : 0
      }
    };
  }, [statisticsData, selectedYear]);

  // Organiser les données par semaines pour l'affichage
  const weeklyData = useMemo(() => {
    const yearDates = generateYearDates(selectedYear);
    const weeks = [];
    let currentWeek = [];
    
    // Commencer par le premier jour de l'année
    const firstDate = new Date(selectedYear, 0, 1);
    const firstDayOfWeek = firstDate.getDay(); // 0 = dimanche, 1 = lundi, etc.
    
    // Ajouter des cellules vides pour aligner la première semaine
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }
    
    yearDates.forEach(date => {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      const data = activityData[date];
      const intensity = getIntensityLevel(data?.pages || 0, maxPages);
      
      currentWeek.push({ date, data, intensity });
    });
    
    // Compléter la dernière semaine si nécessaire
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
    
    return weeks;
  }, [selectedYear, activityData, maxPages]);

  const handleDayClick = (date, data) => {
    if (data && data.pages > 0) {
      // Émettre un événement pour afficher les détails du jour
      console.log('Day clicked:', date, data);
    }
  };

  const handleMouseEnter = (e, date, data) => {
    if (data) {
      const rect = e.target.getBoundingClientRect();
      setTooltip({
        date,
        data,
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const availableYears = useMemo(() => {
    if (!statisticsData?.chartData?.heatmap) return [new Date().getFullYear()];
    
    const years = [...new Set(
      statisticsData.chartData.heatmap.map(d => new Date(d.date).getFullYear())
    )].sort((a, b) => b - a);
    
    return years.length > 0 ? years : [new Date().getFullYear()];
  }, [statisticsData]);

  if (!statisticsData?.chartData?.heatmap || Object.keys(activityData).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="w-16 h-16 text-slate-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-300 mb-2">
          {t('books.statistics.charts.heatmap.noData.title', 'Aucune donnée d\'activité')}
        </h3>
        <p className="text-slate-400 max-w-md">
          {t('books.statistics.charts.heatmap.noData.description', 
            'Enregistre des sessions de lecture pour voir ton calendrier d\'activité.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation et statistiques de l'année */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Navigation par année */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedYear(prev => prev - 1)}
            disabled={!availableYears.includes(selectedYear - 1)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-xl font-semibold text-white min-w-20 text-center">
            {selectedYear}
          </h3>
          <button
            onClick={() => setSelectedYear(prev => prev + 1)}
            disabled={!availableYears.includes(selectedYear + 1)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Statistiques de l'année */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-slate-800/50 rounded-lg p-2">
            <div className="text-lg font-bold text-white">{yearStats.totalPages}</div>
            <div className="text-xs text-slate-400">Pages totales</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2">
            <div className="text-lg font-bold text-white">{yearStats.activeDays}</div>
            <div className="text-xs text-slate-400">Jours actifs</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2">
            <div className="text-lg font-bold text-white">{streakData.longestStreak}</div>
            <div className="text-xs text-slate-400">Plus long streak</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2">
            <div className="text-lg font-bold text-white">{streakData.currentStreak}</div>
            <div className="text-xs text-slate-400">Streak actuel</div>
          </div>
        </div>
      </div>

      {/* Calendrier heatmap */}
      <div className="bg-slate-800/30 rounded-lg p-4">
        <div className="flex flex-col items-center">
          {/* Étiquettes des mois */}
          <div className="flex justify-between w-full mb-2 text-xs text-slate-400">
            {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map((month, index) => (
              <span key={index} className="flex-1 text-center">{month}</span>
            ))}
          </div>
          
          {/* Grille du calendrier */}
          <div className="grid grid-cols-53 gap-1 mb-4">
            {weeklyData.map((week, weekIndex) => 
              week.map((day, dayIndex) => (
                <div key={`${weekIndex}-${dayIndex}`}>
                  {day ? (
                    <CalendarDay
                      date={day.date}
                      data={day.data}
                      intensity={day.intensity}
                      onClick={handleDayClick}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    />
                  ) : (
                    <div className="w-3 h-3" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Légende d'intensité */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Moins</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={`w-3 h-3 rounded-sm ${
                    level === 0 ? 'bg-slate-800/30' :
                    level === 1 ? 'bg-purple-900/40' :
                    level === 2 ? 'bg-purple-700/60' :
                    level === 3 ? 'bg-purple-500/80' :
                    'bg-purple-400'
                  }`}
                />
              ))}
            </div>
            <span>Plus</span>
          </div>
        </div>
      </div>

      {/* Informations sur les streaks */}
      {streakData.streaks && streakData.streaks.length > 0 && (
        <div className="bg-slate-800/30 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            Séries de lecture (Streaks)
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-300 mb-2">
                <span className="font-medium">Streak actuel:</span> 
                <span className="ml-2 text-orange-400 font-bold">
                  {streakData.currentStreak} jour(s)
                </span>
              </p>
              <p className="text-sm text-slate-300">
                <span className="font-medium">Record personnel:</span> 
                <span className="ml-2 text-orange-400 font-bold">
                  {streakData.longestStreak} jour(s)
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-300 mb-1">Meilleures séries de {selectedYear}:</p>
              <div className="space-y-1">
                {streakData.streaks
                  .sort((a, b) => b.length - a.length)
                  .slice(0, 3)
                  .map((streak, index) => (
                    <div key={index} className="text-xs text-slate-400">
                      {streak.length} jours ({new Date(streak.start).toLocaleDateString('fr-FR')} - {new Date(streak.end).toLocaleDateString('fr-FR')})
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%) translateY(-100%)',
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          <DayTooltip
            date={tooltip.date}
            data={tooltip.data}
            onClose={() => setTooltip(null)}
          />
        </div>
      )}
    </div>
  );
};

export default HeatmapCalendar;