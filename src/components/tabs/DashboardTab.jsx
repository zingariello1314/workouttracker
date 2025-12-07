/**
 * Dashboard Tab - Onglet principal Dashboard
 * Vue d'ensemble globale avec 28 blocs modulaires
 */

import { LayoutDashboard, RefreshCw, AlertTriangle } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import QuestDailyBlock from '../dashboard/QuestDailyBlock';
import SportSessionBlock from '../dashboard/SportSessionBlock';
import PatrimonyLiveBlock from '../dashboard/PatrimonyLiveBlock';
import ReadingSessionBlock from '../dashboard/ReadingSessionBlock';
import LearningStatusBlock from '../dashboard/LearningStatusBlock';
import ActiveTimerBlock from '../dashboard/ActiveTimerBlock';
import LastChanceBlock from '../dashboard/LastChanceBlock';
import DailyRegularityBlock from '../dashboard/DailyRegularityBlock';
import MonthlyBudgetBlock from '../dashboard/MonthlyBudgetBlock';
import MainBookProgressBlock from '../dashboard/MainBookProgressBlock';
import StockPortfolioBlock from '../dashboard/StockPortfolioBlock';
import SurveillanceBlock from '../dashboard/SurveillanceBlock';
import WeeklyProgressBlock from '../dashboard/WeeklyProgressBlock';
import TodayPerformanceBlock from '../dashboard/TodayPerformanceBlock';
import ReadingRhythmBlock from '../dashboard/ReadingRhythmBlock';
import QuickStatsBlock from '../dashboard/QuickStatsBlock';
import DCAObjectivesBlock from '../dashboard/DCAObjectivesBlock';
import SalaryAllocationBlock from '../dashboard/SalaryAllocationBlock';
import DeadlinesBlock from '../dashboard/DeadlinesBlock';
import SmartProgressionBlock from '../dashboard/SmartProgressionBlock';
import SportComparisonsBlock from '../dashboard/SportComparisonsBlock';
import ReadingComparisonsBlock from '../dashboard/ReadingComparisonsBlock';
import ReadingPerformanceBlock from '../dashboard/ReadingPerformanceBlock';
import QuestExpressBlock from '../dashboard/QuestExpressBlock';
import LeisureObjectivesBlock from '../dashboard/LeisureObjectivesBlock';
import ProjectionMatrixBlock from '../dashboard/ProjectionMatrixBlockRefonte';
import TheoryRealityBlock from '../dashboard/TheoryRealityBlock';
import NewsBlock from '../dashboard/NewsBlock';

const DashboardTab = () => {
  const {
    loading,
    error,
    quests,
    questStats,
    sportSession,
    sportStats,
    books,
    readingStats,
    patrimony,
    metrics,
    learningData,
    budgetData,
    regularityData,
    weeklyProgressData,
    todayPerformanceData,
    readingRhythmData,
    quickStatsData,
    dcaData,
    salaryAllocationData,
    deadlinesData,
    smartProgressionData,
    sportComparisonsData,
    readingComparisonsData,
    readingPerformanceData,
    projectionsData,
    theoryRealityData,
    leisureObjectivesData,
    newsData,
    toggleQuest,
    completeAllQuests,
    saveSportSession,
    saveReadingSession,
    addBook,
    startLearningTimer,
    addExpense,
    selectMuscle,
    startReadingTimer,
    stopReadingTimer,
    executeDCABuy,
    applyDCARecommendation,
    updateSalaryAllocation,
    completeDeadline,
    createQuest,
    addLeisureObjective,
    updateLeisureProgress,
    refreshAll,
    refreshPatrimony,
    refreshNews
  } = useDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-slate-400">Chargement du Dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <div className="text-red-400 mb-4">Erreur: {error}</div>
          <button
            onClick={refreshAll}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-tab min-h-[calc(100vh-140px)]">
      <div className="max-w-[2400px] mx-auto p-4 md:p-6 space-y-6">
        {/* Header Premium */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20 border border-indigo-500/30 p-6">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-pink-500/10 animate-pulse"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
                  <LayoutDashboard className="w-7 h-7 text-indigo-400" />
                </div>
                Dashboard Global
              </h1>
              <p className="text-slate-300 text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Vue d'ensemble complète de toutes vos données
              </p>
            </div>
            <button
              onClick={refreshAll}
              className="group px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-purple-500/50 hover:scale-105 transform"
              aria-label="Rafraîchir toutes les données"
            >
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                Rafraîchir
              </span>
            </button>
          </div>
        </div>

        {/* Quick Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Quests Metric */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-2 border-purple-500/50 rounded-xl p-4 hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 to-purple-600/0 group-hover:from-purple-400/10 group-hover:to-purple-600/10 transition-all duration-300"></div>
              <div className="relative">
                <div className="text-2xl mb-2">🎯</div>
                <div className="text-sm text-slate-400 mb-1">Quêtes</div>
                <div className="text-2xl font-bold text-white">
                  {metrics.quests.completed}/{metrics.quests.total}
                </div>
                <div className="text-xs text-purple-400 font-semibold mt-1">
                  {metrics.quests.xpGained} XP gagnés
                </div>
              </div>
            </div>

            {/* Sport Metric */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-2 border-orange-500/50 rounded-xl p-4 hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/0 to-orange-600/0 group-hover:from-orange-400/10 group-hover:to-orange-600/10 transition-all duration-300"></div>
              <div className="relative">
                <div className="text-2xl mb-2">💪</div>
                <div className="text-sm text-slate-400 mb-1">Sport (7j)</div>
                <div className="text-2xl font-bold text-white">
                  {metrics.sport.frequency7}
                </div>
                <div className="text-xs text-orange-400 font-semibold mt-1">
                  {metrics.sport.hasSessionToday ? '✓ Séance du jour' : 'Pas de séance'}
                </div>
              </div>
            </div>

            {/* Reading Metric */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 border-2 border-indigo-500/50 rounded-xl p-4 hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/0 to-indigo-600/0 group-hover:from-indigo-400/10 group-hover:to-indigo-600/10 transition-all duration-300"></div>
              <div className="relative">
                <div className="text-2xl mb-2">📚</div>
                <div className="text-sm text-slate-400 mb-1">Lecture (7j)</div>
                <div className="text-2xl font-bold text-white">
                  {metrics.reading.sessions7}
                </div>
                <div className="text-xs text-indigo-400 font-semibold mt-1">
                  {metrics.reading.avgSpeed} p/h
                </div>
              </div>
            </div>

            {/* Patrimony Metric */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500/50 rounded-xl p-4 hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/0 to-green-600/0 group-hover:from-green-400/10 group-hover:to-green-600/10 transition-all duration-300"></div>
              <div className="relative">
                <div className="text-2xl mb-2">💎</div>
                <div className="text-sm text-slate-400 mb-1">Patrimoine</div>
                <div className="text-xl font-bold text-white">
                  {(metrics.patrimony.total / 1000).toFixed(1)}k€
                </div>
                <div className={`text-xs font-semibold mt-1 ${
                  metrics.patrimony.performance >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {metrics.patrimony.performance >= 0 ? '+' : ''}
                  {metrics.patrimony.performance.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRIORITY-MAX BLOCKS */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent rounded-full"></div>
            <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              PRIORITY-MAX
            </h2>
            <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent rounded-full"></div>
          </div>

          {/* Quête du Jour */}
          <QuestDailyBlock 
            quests={quests}
            questStats={questStats}
            onToggle={toggleQuest}
          />

          {/* Séance Sport Active - Span 2 columns on large screens */}
          <SportSessionBlock
            sportSession={sportSession}
            sportStats={sportStats}
            onSave={saveSportSession}
          />

          {/* Patrimoine Temps Réel */}
          <PatrimonyLiveBlock
            patrimony={patrimony}
            onRefresh={refreshPatrimony}
          />

          {/* Session de Lecture - Span 2 columns on large screens */}
          <ReadingSessionBlock
            books={books}
            readingStats={readingStats}
            onSaveSession={saveReadingSession}
            onAddBook={addBook}
          />
        </div>

        {/* PRIORITY-HIGH BLOCKS */}
        <div className="mt-12 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent rounded-full"></div>
            <h2 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              PRIORITY-HIGH
            </h2>
            <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent rounded-full"></div>
          </div>

          {/* Learning Status */}
          <LearningStatusBlock
            allData={{
              mockData: {
                learningStatus: {
                  activeSubject: 'Lecture',
                  subjectType: 'apprentissage',
                  sessionsCompleted: 5,
                  sessionsPlanned: 7,
                  timeStudiedToday: 105, // 1h45
                  dailyObjectiveMinutes: 120, // 2h
                  streakDays: 4,
                  subjects: ['Sport', 'Lecture', 'Mathématiques', 'Informatique'],
                  latestReward: null
                },
                activeTimer: {
                  isActive: false
                },
                user: {
                  streakDays: 4
                }
              }
            }}
            learningData={learningData}
            onStartTimer={startLearningTimer}
          />

          {/* Active Timer */}
          <ActiveTimerBlock />

          {/* Last Chance */}
          <LastChanceBlock
            quests={quests}
            questStats={questStats}
            onToggle={toggleQuest}
            onCompleteAll={completeAllQuests}
          />

          {/* Daily Regularity */}
          <DailyRegularityBlock
            regularityData={regularityData}
          />

          {/* Monthly Budget */}
          <MonthlyBudgetBlock
            budgetData={budgetData}
            onAddExpense={addExpense}
          />

          {/* Main Book Progress */}
          <MainBookProgressBlock
            books={books}
            readingStats={readingStats}
          />

          {/* Stock Portfolio */}
          <StockPortfolioBlock
            onRefresh={refreshPatrimony}
          />

          {/* Surveillance + Reading Rhythm - Grid 2 colonnes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Surveillance */}
            <SurveillanceBlock
              onRefresh={refreshAll}
            />

            {/* Reading Rhythm */}
            <ReadingRhythmBlock
              rhythmData={readingRhythmData}
              onStartTimer={startReadingTimer}
              onStopTimer={stopReadingTimer}
            />
          </div>
        </div>

        {/* PRIORITY-MODERATE BLOCKS */}
        <div className="mt-12 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent rounded-full"></div>
            <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              PRIORITY-MODERATE
            </h2>
            <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent rounded-full"></div>
          </div>

          {/* Weekly Progress */}
          <WeeklyProgressBlock weeklyData={weeklyProgressData} />

          {/* Today Performance */}
          <TodayPerformanceBlock 
            performanceData={todayPerformanceData}
            onSelectMuscle={selectMuscle}
          />
        </div>

        {/* PRIORITY-LOW BLOCKS */}
        <div className="mt-12 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-slate-500/50 to-transparent rounded-full"></div>
            <h2 className="text-lg font-bold text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></span>
              PRIORITY-LOW
            </h2>
            <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-slate-500/50 to-transparent rounded-full"></div>
          </div>

          {/* Quick Stats */}
          <QuickStatsBlock statsData={quickStatsData} />

          {/* Grid 2 colonnes pour blocs financiers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* DCA Objectives */}
            <DCAObjectivesBlock
              dcaData={dcaData}
              onExecuteBuy={executeDCABuy}
              onApplyRecommendation={applyDCARecommendation}
            />

            {/* Salary Allocation */}
            <SalaryAllocationBlock
              allocationData={salaryAllocationData}
              onUpdate={updateSalaryAllocation}
            />
          </div>

          {/* Deadlines */}
          <DeadlinesBlock
            deadlinesData={deadlinesData}
            onComplete={completeDeadline}
            onItemClick={(item) => console.log('Deadline clicked:', item)}
          />

          {/* Smart Progression */}
          <SmartProgressionBlock progressionData={smartProgressionData} />

          {/* Grid 2 colonnes pour blocs analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sport Comparisons */}
            <SportComparisonsBlock comparisonsData={sportComparisonsData} />

            {/* Reading Comparisons */}
            <ReadingComparisonsBlock comparisonsData={readingComparisonsData} />
          </div>

          {/* Reading Performance */}
          <ReadingPerformanceBlock performanceData={readingPerformanceData} />

          {/* Grid 2 colonnes pour blocs outils */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quest Express */}
            <QuestExpressBlock onCreateQuest={createQuest} />

            {/* Leisure Objectives */}
            <LeisureObjectivesBlock
              objectivesData={leisureObjectivesData}
              onAddObjective={addLeisureObjective}
              onUpdateProgress={updateLeisureProgress}
            />
          </div>

          {/* Projection Matrix - Full width - REFONTE */}
          <ProjectionMatrixBlock allData={{}} />

          {/* Theory Reality - Full width */}
          <TheoryRealityBlock comparisonData={theoryRealityData} />

          {/* News - Full width */}
          <NewsBlock newsData={newsData} onRefresh={refreshNews} />
        </div>

        {/* Footer Info */}
        <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
              <span>Dashboard: <span className="text-white font-semibold">Phase 4 - PRIORITY-LOW COMPLÉTÉE (28/28 blocs - 100%)</span></span>
            </div>
            <div className="text-slate-500 text-xs">
              Version: 4.0.0 ✅
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
