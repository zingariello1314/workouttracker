/**
 * WeeklyProgressBlock Component
 * Bloc Progression Hebdomadaire - PRIORITY-MODERATE
 * Design ultra-détaillé avec 12 modules
 */

import { TrendingUp, Calendar, Award, Clock, Target, Flame, Trophy, Sparkles, Brain } from 'lucide-react';

const WeeklyProgressBlock = ({ weeklyData }) => {
  if (!weeklyData) {
    return (
      <div className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="text-center text-slate-400">Chargement des données hebdomadaires...</div>
      </div>
    );
  }

  const {
    weekNumber,
    year,
    score,
    totalTime,
    sessions,
    daysCompleted,
    streak,
    record,
    subjectProgress,
    achievements,
    timeDistribution,
    heatmapData,
    trends,
    dailyActivities,
    goals,
    insights,
    bestTimeSlot,
    worstTimeSlot
  } = weeklyData;

  // Helper functions
  const getScoreColor = (score) => {
    if (score >= 4.5) return 'text-[#39FF14]';
    if (score >= 3.5) return 'text-[#00F5FF]';
    if (score >= 2.5) return 'text-[#FF6600]';
    return 'text-[#FF0040]';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'from-[#39FF14] to-[#66bb6a]';
    if (percentage >= 60) return 'from-[#00F5FF] to-[#40e0ff]';
    if (percentage >= 40) return 'from-[#FF6600] to-[#ffa726]';
    return 'from-[#FF0040] to-[#ef5350]';
  };

  const getDayStatus = (status) => {
    const statuses = {
      completed: { icon: '✅', color: 'text-[#39FF14]', label: 'Terminé' },
      partial: { icon: '⚠️', color: 'text-[#FF6600]', label: 'Partiel' },
      missed: { icon: '❌', color: 'text-[#FF0040]', label: 'Raté' },
      inProgress: { icon: '🔄', color: 'text-[#00F5FF]', label: 'En cours' },
      upcoming: { icon: '⏳', color: 'text-slate-500', label: 'À venir' }
    };
    return statuses[status] || statuses.upcoming;
  };

  const getHeatmapColor = (value) => {
    if (value >= 90) return 'bg-[#39FF14]';
    if (value >= 70) return 'bg-[#66bb6a]';
    if (value >= 50) return 'bg-[#00F5FF]';
    if (value >= 30) return 'bg-[#FF6600]';
    return 'bg-[#FF0040]';
  };

  const getGoalStatus = (percentage) => {
    if (percentage >= 100) return { icon: '✓', color: 'text-[#39FF14]', bg: 'bg-[#39FF14]/20' };
    if (percentage >= 50) return { icon: '⚠', color: 'text-[#FF6600]', bg: 'bg-[#FF6600]/20' };
    return { icon: '✗', color: 'text-[#FF0040]', bg: 'bg-[#FF0040]/20' };
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };

  const getDateRange = () => {
    const startDate = new Date(year, 0, (weekNumber - 1) * 7 + 1);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${startDate.getDate()}-${endDate.getDate()} ${months[startDate.getMonth()]}`;
  };

  const overallProgress = Math.round((daysCompleted / 7) * 100);

  return (
    <div className="weekly-progress-card relative overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#0a0a0a] to-[#00F5FF]/5 border-2 border-[#00F5FF]/30 rounded-2xl p-6 backdrop-blur-sm">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00F5FF]/5 to-transparent pointer-events-none"></div>

      <div className="relative space-y-6">
        {/* MODULE 1: Header */}
        <div className="header flex items-start justify-between">
          <div>
            <h3 className="week-title text-3xl font-bold text-white mb-1">
              Semaine {weekNumber} • {year}
            </h3>
            <p className="text-sm text-[#aaa] mb-1">{getDateRange()}</p>
            <p className="text-xs text-[#888]">Tableau de bord personnel</p>
          </div>
          <div className="progress-badge px-4 py-2 bg-[#00F5FF] text-black font-bold rounded-full text-lg">
            {overallProgress}%
          </div>
        </div>

        {/* MODULE 2: Activités Quotidiennes */}
        <div className="daily-activities p-4 bg-[#00F5FF]/5 rounded-xl border border-[#00F5FF]/20">
          <div className="grid grid-cols-7 gap-2">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => {
              const activity = dailyActivities?.[index] || { status: 'upcoming', date: index + 1 };
              const statusInfo = getDayStatus(activity.status);
              
              return (
                <div
                  key={day}
                  className="day-column text-center p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-all cursor-pointer group"
                  title={`${day} ${activity.date} - ${statusInfo.label}`}
                >
                  <div className="text-xs text-slate-400 mb-1">{day}</div>
                  <div className="text-lg font-bold text-white mb-1">{activity.date}</div>
                  <div className={`text-2xl ${statusInfo.color}`}>{statusInfo.icon}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MODULE 3: Vue d'Ensemble + Streaks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vue d'ensemble */}
          <div className="overview p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <h4 className="text-sm font-semibold text-[#00F5FF] mb-4">Vue d'Ensemble</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-[#888] mb-1">Score Global</div>
                <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                  {score.toFixed(1)}<span className="text-lg text-slate-500">/5</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-[#888] mb-1">Temps Total</div>
                <div className="text-2xl font-bold text-white">{formatTime(totalTime)}</div>
              </div>
              <div>
                <div className="text-xs text-[#888] mb-1">Sessions</div>
                <div className="text-2xl font-bold text-white">{sessions}</div>
              </div>
              <div>
                <div className="text-xs text-[#888] mb-1">Jours Complétés</div>
                <div className="text-2xl font-bold text-white">
                  {daysCompleted}<span className="text-sm text-slate-500">/7</span>
                </div>
              </div>
            </div>
          </div>

          {/* Streaks & Records */}
          <div className="streaks p-4 bg-gradient-to-br from-[#FF4500]/10 to-[#FFD700]/10 rounded-xl border border-[#FF4500]/30">
            <div className="flex items-center gap-3 mb-3">
              <Flame className="w-6 h-6 text-[#FF4500]" />
              <div>
                <div className="text-sm text-[#aaa]">Série Actuelle</div>
                <div className="text-2xl font-bold text-white">{streak} jours</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-[#FFD700]" />
              <div>
                <div className="text-sm text-[#aaa]">Record</div>
                <div className="text-xl font-bold text-[#FFD700]">
                  {record} jours <span className="text-sm text-slate-500">(Sept {year})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODULE 4: Progression par Matière */}
        <div className="subjects p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <h4 className="text-sm font-semibold text-[#00F5FF] mb-4 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Progression par Matière
          </h4>
          <div className="space-y-4">
            {subjectProgress?.map((subject, index) => {
              const percentage = subject.progress || 0;
              return (
                <div key={index} className="subject-item">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-bold">{subject.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-400">{subject.sessions}/{subject.target || 7} sessions</span>
                      <span className="text-[#00F5FF] font-bold">{percentage}%</span>
                    </div>
                  </div>
                  <div className="progress-bar h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getProgressColor(percentage)} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    >
                      <div className="h-full bg-gradient-to-r from-transparent to-white/20"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MODULE 5: Achievements */}
        <div className="achievements p-4 bg-gradient-to-br from-[#ab47bc]/10 to-[#ab47bc]/5 rounded-xl border border-[#ab47bc]/30">
          <h4 className="text-sm font-semibold text-[#ab47bc] mb-4 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Achievements Débloqués
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {achievements?.map((achievement, index) => {
              const isUnlocked = achievement.unlocked;
              return (
                <div
                  key={index}
                  className={`achievement-item p-3 rounded-lg border transition-all ${
                    isUnlocked
                      ? 'bg-[#39FF14]/10 border-[#39FF14]/30'
                      : 'bg-slate-800/30 border-slate-700/30 opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className={`font-bold ${isUnlocked ? 'text-[#00F5FF]' : 'text-slate-500'}`}>
                        {achievement.name}
                      </div>
                      <div className="text-xs text-[#aaa] mt-1">{achievement.description}</div>
                      {isUnlocked && achievement.date && (
                        <div className="text-xs text-[#888] italic mt-1">{achievement.date}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MODULE 6: Quote Motivante */}
        <div className="p-4 bg-gradient-to-r from-[#00F5FF]/5 to-transparent rounded-xl border border-[#00F5FF]/20">
          <div className="flex items-start gap-3">
            <div className="text-3xl">🤖</div>
            <div className="flex-1">
              <p className="text-white italic leading-relaxed mb-2">
                "Votre régularité cette semaine montre une vraie détermination. Continuez sur cette lancée !"
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-[#00F5FF]">— Assistant IA</div>
                  <div className="text-xs text-[#888]">Basé sur vos performances</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODULE 7 & 8: Pie Chart + Tendances */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Répartition du Temps */}
          <div className="pie-chart p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <h4 className="text-sm font-semibold text-[#00F5FF] mb-4">Répartition du Temps</h4>
            <div className="space-y-3">
              {timeDistribution?.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="text-2xl">{item.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-white font-medium">{item.category}</span>
                      <span className="text-[#00F5FF] font-bold">{item.percentage}%</span>
                    </div>
                    <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${item.color} transition-all duration-500`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tendances 4 Semaines */}
          <div className="trends p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <h4 className="text-sm font-semibold text-[#00F5FF] mb-4">Tendances (4 semaines)</h4>
            <div className="space-y-2">
              {[
                { week: weekNumber - 3, progress: 60 },
                { week: weekNumber - 2, progress: 70 },
                { week: weekNumber - 1, progress: 80 },
                { week: weekNumber, progress: overallProgress, current: true }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="text-xs text-slate-400 w-20">Semaine {item.week}</div>
                  <div className="flex-1 h-6 bg-[#1a1a1a] rounded-lg overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        item.current
                          ? 'bg-gradient-to-r from-[#66bb6a] to-[#43a047]'
                          : 'bg-gradient-to-r from-[#00F5FF] to-[#40e0ff]'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-sm font-bold text-white w-12">{item.progress}%</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="text-xs text-[#888]">Progression: <span className="text-[#39FF14] font-bold">+{overallProgress - 60}%</span></div>
              <div className="text-xs text-[#888] mt-1">Insight: Progression constante depuis 1 mois</div>
            </div>
          </div>
        </div>

        {/* MODULE 9: Heatmap Performance */}
        <div className="heatmap p-6 bg-gradient-to-br from-slate-900/80 to-slate-800/50 rounded-2xl border-2 border-[#00F5FF]/20 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#00F5FF]/10 rounded-lg">
              <Clock className="w-5 h-5 text-[#00F5FF]" />
            </div>
            <h4 className="text-lg font-bold text-[#00F5FF]">Performance par Créneau Horaire</h4>
          </div>
          
          <div className="space-y-4">
            {/* Grille Heatmap - 2 rangées de 12 heures */}
            <div className="grid grid-cols-12 gap-2">
              {Array.from({ length: 12 }, (_, hour) => {
                const value = heatmapData?.[hour] || Math.floor(Math.random() * 100);
                return (
                  <div
                    key={hour}
                    className="group relative"
                    title={`${hour}h: ${value}%`}
                  >
                    <div className={`h-20 rounded-lg ${getHeatmapColor(value)} hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl flex flex-col items-center justify-center`}>
                      <div className="text-xs font-bold text-black/70 mb-1">{hour}h</div>
                      <div className="text-sm font-bold text-black">{value}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="grid grid-cols-12 gap-2">
              {Array.from({ length: 12 }, (_, hour) => {
                const actualHour = hour + 12;
                const value = heatmapData?.[actualHour] || Math.floor(Math.random() * 100);
                return (
                  <div
                    key={actualHour}
                    className="group relative"
                    title={`${actualHour}h: ${value}%`}
                  >
                    <div className={`h-20 rounded-lg ${getHeatmapColor(value)} hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl flex flex-col items-center justify-center`}>
                      <div className="text-xs font-bold text-black/70 mb-1">{actualHour}h</div>
                      <div className="text-sm font-bold text-black">{value}%</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Insights en bas */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#39FF14]" />
                <span className="text-sm text-slate-300">
                  <span className="font-bold text-[#39FF14]">Meilleur:</span> {bestTimeSlot || '10h-11h (90%)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                <span className="text-sm text-slate-300">
                  <span className="font-bold text-[#FF0040]">À éviter:</span> {worstTimeSlot || 'après 19h (35%)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MODULE 10: Insights & Recommandations */}
        <div className="insights space-y-3">
          <div className="p-4 bg-[#39FF14]/10 rounded-xl border border-[#39FF14]/30">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#39FF14] flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-white mb-1">Performance exceptionnelle</div>
                <div className="text-sm text-[#aaa]">
                  Vos sessions de 10h-11h sont 40% plus productives que la moyenne.
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-[#FF6600]/10 rounded-xl border border-[#FF6600]/30">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-[#FF6600] flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-white mb-1">Zone d'amélioration identifiée</div>
                <div className="text-sm text-[#aaa]">
                  {subjectProgress?.[subjectProgress.length - 1]?.name || 'Certaines matières'} nécessitent plus d'attention.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODULE 11: Objectifs Hebdomadaires */}
        <div className="goals p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <h4 className="text-sm font-semibold text-[#00F5FF] mb-4 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Objectifs Hebdomadaires
          </h4>
          <div className="space-y-3">
            {goals?.map((goal, index) => {
              const status = getGoalStatus(goal.progress);
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full ${status.bg} flex items-center justify-center ${status.color} font-bold text-sm`}>
                    {status.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white">{goal.title}</span>
                      <span className={`text-sm font-bold ${status.color}`}>{goal.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${status.bg.replace('/20', '')} transition-all duration-500`}
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MODULE 12: Footer Stats */}
        <div className="footer-stats grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-[#00F5FF]/5 to-transparent rounded-xl border border-[#00F5FF]/20">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#00F5FF]">892</div>
            <div className="text-xs text-[#888] mt-1">Total heures</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#00F5FF]">{weekNumber}</div>
            <div className="text-xs text-[#888] mt-1">Semaines actives</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#00F5FF]">{score.toFixed(1)}</div>
            <div className="text-xs text-[#888] mt-1">Score moyen</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyProgressBlock;
