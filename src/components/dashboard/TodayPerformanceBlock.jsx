/**
 * TodayPerformanceBlock Component - Phase 5 Integration
 * Main container orchestrating all sub-components
 */

import { Zap, Calendar } from 'lucide-react';
import { useState, useMemo } from 'react';

// Error Boundary (Phase 6)
import TodayPerformanceErrorBoundary from './TodayPerformanceErrorBoundary';

// Utility Components (Phase 2)
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';

// Dashboard Components (Phases 2-4) - Memoized for performance
import MuscleGroupGrid from './MuscleGroupGrid';
import MuscleCreateForm from './MuscleCreateForm';
import MissionWeeklyGrid from './MissionWeeklyGrid';
import MissionAddForm from './MissionAddForm';
import ProgressionChart from './ProgressionChart';
import ComparisonMetrics from './ComparisonMetrics';
import PersonalHistory from './PersonalHistory';
import RecordsCelebration from './RecordsCelebration';
import AchievementsPanel from './AchievementsPanel';
import AIRecommendations from './AIRecommendations';

// Custom Hooks (Phase 5)
import useMuscleGroups from '../../hooks/useMuscleGroups';
import useWeeklyMissions from '../../hooks/useWeeklyMissions';
import usePerformanceComparison from '../../hooks/usePerformanceComparison';
import usePersonalHistory from '../../hooks/usePersonalHistory';
import useAIRecommendations from '../../hooks/useAIRecommendations';

const TodayPerformanceBlock = () => {
  // Modal states
  const [showMuscleForm, setShowMuscleForm] = useState(false);
  const [showMissionForm, setShowMissionForm] = useState(false);

  // Custom hooks
  const { muscleGroups, loading: musclesLoading, error: musclesError, createMuscleGroup } = useMuscleGroups();
  const { missions, loading: missionsLoading, toggleMission, addMission } = useWeeklyMissions();
  const { comparisons, loading: comparisonLoading } = usePerformanceComparison();
  const { records, trends, chartData, currentPeriod, changePeriod, loading: historyLoading } = usePersonalHistory();
  const { recommendations, alternatives, refreshRecommendation } = useAIRecommendations();

  // Calculate current date display
  const currentDate = useMemo(() => {
    const now = new Date();
    const dayName = now.toLocaleDateString('fr-FR', { weekday: 'long' });
    const formatted = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${formatted}`;
  }, []);

  // Calculate main metrics
  const mainMetrics = useMemo(() => {
    const totalVolume = muscleGroups.reduce((sum, mg) => sum + (mg.current || 0), 0);
    const targetVolume = muscleGroups.reduce((sum, mg) => sum + (mg.target || 0), 0);
    const variety = muscleGroups.filter(mg => mg.current > 0).length;
    const targetVariety = muscleGroups.length;

    // Calculate intensity based on volume completion
    const intensity = targetVolume > 0 ? Math.min(100, Math.round((totalVolume / targetVolume) * 100)) : 0;

    return {
      volume: { current: totalVolume, target: targetVolume },
      variety: { current: variety, target: targetVariety },
      intensity
    };
  }, [muscleGroups]);

  // Generate chart data for progression (last 7 days)
  const progressionData = useMemo(() => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const today = new Date().getDay();

    return days.map((day, index) => ({
      day,
      volume: Math.floor(Math.random() * 200) + 50, // Mock data - replace with real data
      intensity: Math.floor(Math.random() * 40) + 60,
      records: Math.floor(Math.random() * 3),
      isToday: index === (today === 0 ? 6 : today - 1)
    }));
  }, []);

  // Extract weekly records (mock data - replace with real calculation)
  const weeklyRecords = useMemo(() => [
    { exercise: 'Pompes', current: 45, delta: 5, icon: '💪' },
    { exercise: 'Tractions', current: 12, delta: 2, icon: '🏋️' },
    { exercise: 'Squats', current: 60, delta: 10, icon: '🦵' }
  ], []);

  // Generate achievements (mock data - replace with real data)
  const achievements = useMemo(() => [
    {
      id: 'ach_1',
      icon: '🏆',
      title: 'Record personnel battu',
      description: 'Nouveau record sur les pompes !',
      reward: '+50 XP',
      type: 'record',
      isNew: true,
      status: 'ACCOMPLI',
      statusClass: 'completed'
    },
    {
      id: 'ach_2',
      icon: '🔥',
      title: 'Série de 7 jours',
      description: 'Une semaine complète d\'entraînement',
      reward: '+100 XP',
      type: 'streak',
      isNew: false,
      status: 'EN COURS',
      statusClass: 'active'
    }
  ], []);

  // Handle muscle group creation
  const handleCreateMuscle = async (data) => {
    try {
      await createMuscleGroup(data);
      setShowMuscleForm(false);
    } catch (err) {
      console.error('Error creating muscle group:', err);
    }
  };

  // Handle mission addition
  const handleAddMission = (data) => {
    try {
      addMission(data);
      setShowMissionForm(false);
    } catch (err) {
      console.error('Error adding mission:', err);
    }
  };

  // Loading state
  if (musclesLoading || missionsLoading || comparisonLoading || historyLoading) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-2 border-orange-500/50 rounded-2xl p-6">
        <LoadingSpinner size="large" text="Chargement des données de performance..." />
      </div>
    );
  }

  // Error state
  if (musclesError) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-2 border-orange-500/50 rounded-2xl p-6">
        <ErrorMessage message={musclesError} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-2 border-orange-500/50 rounded-2xl p-6 backdrop-blur-sm">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400/5 to-transparent pointer-events-none"></div>

      <div className="relative space-y-6">
        {/* Header with Date and Metrics */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-400/30">
              <Zap className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Performance Aujourd'hui</h3>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                <p className="text-sm text-slate-400">{currentDate}</p>
              </div>
            </div>
          </div>

          {/* Main Metrics */}
          <div className="flex gap-4">
            <div className="px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Volume</div>
              <div className="text-lg font-bold text-white">
                {mainMetrics.volume.current}/{mainMetrics.volume.target} reps
              </div>
            </div>
            <div className="px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Variété</div>
              <div className="text-lg font-bold text-white">
                {mainMetrics.variety.current}/{mainMetrics.variety.target} muscles
              </div>
            </div>
            <div className="px-4 py-2 bg-orange-500/20 rounded-xl border border-orange-400/30">
              <div className="text-xs text-slate-400 mb-1">Intensité</div>
              <div className="text-2xl font-bold text-orange-400">{mainMetrics.intensity}%</div>
            </div>
          </div>
        </div>

        {/* Muscle Groups Grid */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-300">Groupes musculaires</h4>
          <MuscleGroupGrid
            muscleGroups={muscleGroups}
            onCreateNew={() => setShowMuscleForm(true)}
          />
        </div>

        {/* Weekly Records Celebration */}
        {weeklyRecords.length > 0 && (
          <RecordsCelebration records={weeklyRecords} />
        )}

        {/* Weekly Missions Grid */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-300">Missions de la semaine</h4>
          <MissionWeeklyGrid
            missions={missions}
            onToggleMission={toggleMission}
            onAddMission={() => setShowMissionForm(true)}
          />
        </div>

        {/* Main Content Grid - 2 Columns on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Progression Chart */}
            <ProgressionChart data={progressionData} />

            {/* Comparison Metrics */}
            <ComparisonMetrics comparisons={comparisons} />

            {/* Achievements Panel */}
            <AchievementsPanel achievements={achievements} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* AI Recommendations */}
            <AIRecommendations
              recommendations={recommendations}
              alternatives={alternatives}
              onRefresh={refreshRecommendation}
            />

            {/* Personal History */}
            <PersonalHistory
              records={records}
              trends={trends}
              chartData={chartData}
              currentPeriod={currentPeriod}
              onPeriodChange={changePeriod}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <MuscleCreateForm
        isOpen={showMuscleForm}
        onClose={() => setShowMuscleForm(false)}
        onSubmit={handleCreateMuscle}
      />

      <MissionAddForm
        isOpen={showMissionForm}
        onClose={() => setShowMissionForm(false)}
        onSubmit={handleAddMission}
      />
    </div>
  );
};

// Wrap with Error Boundary for Phase 6
const TodayPerformanceBlockWithErrorBoundary = () => (
  <TodayPerformanceErrorBoundary>
    <TodayPerformanceBlock />
  </TodayPerformanceErrorBoundary>
);

export default TodayPerformanceBlockWithErrorBoundary;
