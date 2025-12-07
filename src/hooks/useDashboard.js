/**
 * useDashboard Hook
 * State management centralisé pour le Dashboard
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  questsAPI, 
  sportAPI, 
  readingAPI, 
  patrimonyAPI, 
  learningAPI, 
  budgetAPI, 
  regularityAPI,
  weeklyProgressAPI,
  todayPerformanceAPI,
  readingRhythmAPI,
  quickStatsAPI,
  dcaAPI,
  salaryAllocationAPI,
  deadlinesAPI,
  smartProgressionAPI,
  sportComparisonsAPI,
  readingComparisonsAPI,
  readingPerformanceAPI,
  projectionsAPI,
  theoryRealityAPI,
  leisureObjectivesAPI,
  questExpressAPI,
  newsAPI,
  initDashboard 
} from '../services/dashboard/dashboardStorage';

export const useDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State - Phase 1
  const [quests, setQuests] = useState([]);
  const [questStats, setQuestStats] = useState(null);
  const [sportSession, setSportSession] = useState(null);
  const [sportStats, setSportStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [readingStats, setReadingStats] = useState(null);
  const [patrimony, setPatrimony] = useState(null);
  
  // State - Phase 2
  const [learningData, setLearningData] = useState(null);
  const [budgetData, setBudgetData] = useState(null);
  const [regularityData, setRegularityData] = useState(null);
  
  // State - Phase 3
  const [weeklyProgressData, setWeeklyProgressData] = useState(null);
  const [todayPerformanceData, setTodayPerformanceData] = useState(null);
  const [readingRhythmData, setReadingRhythmData] = useState(null);
  
  // State - Phase 4
  const [quickStatsData, setQuickStatsData] = useState(null);
  const [dcaData, setDcaData] = useState(null);
  const [salaryAllocationData, setSalaryAllocationData] = useState(null);
  const [deadlinesData, setDeadlinesData] = useState(null);
  const [smartProgressionData, setSmartProgressionData] = useState(null);
  const [sportComparisonsData, setSportComparisonsData] = useState(null);
  const [readingComparisonsData, setReadingComparisonsData] = useState(null);
  const [readingPerformanceData, setReadingPerformanceData] = useState(null);
  const [projectionsData, setProjectionsData] = useState(null);
  const [theoryRealityData, setTheoryRealityData] = useState(null);
  const [leisureObjectivesData, setLeisureObjectivesData] = useState(null);
  const [newsData, setNewsData] = useState(null);

  // ============================================================================
  // LOAD DATA - PHASE 1
  // ============================================================================

  const loadQuests = useCallback(async () => {
    try {
      const [todayQuests, stats] = await Promise.all([
        questsAPI.getToday(),
        questsAPI.getStats()
      ]);
      setQuests(todayQuests);
      setQuestStats(stats);
    } catch (err) {
      console.error('Error loading quests:', err);
      throw err;
    }
  }, []);

  const loadSport = useCallback(async () => {
    try {
      const [today, last, stats7, stats30] = await Promise.all([
        sportAPI.getToday(),
        sportAPI.getLast(),
        sportAPI.getStats(7),
        sportAPI.getStats(30)
      ]);
      setSportSession({ today, last });
      setSportStats({ days7: stats7, days30: stats30 });
    } catch (err) {
      console.error('Error loading sport:', err);
      throw err;
    }
  }, []);

  const loadReading = useCallback(async () => {
    try {
      const [activeBooks, stats7, stats30] = await Promise.all([
        readingAPI.getActiveBooks(),
        readingAPI.getStats(7),
        readingAPI.getStats(30)
      ]);
      setBooks(activeBooks);
      setReadingStats({ days7: stats7, days30: stats30 });
    } catch (err) {
      console.error('Error loading reading:', err);
      throw err;
    }
  }, []);

  const loadPatrimony = useCallback(async () => {
    try {
      const data = await patrimonyAPI.get();
      setPatrimony(data);
    } catch (err) {
      console.error('Error loading patrimony:', err);
      throw err;
    }
  }, []);

  // ============================================================================
  // LOAD DATA - PHASE 2
  // ============================================================================

  const loadLearning = useCallback(async () => {
    try {
      const [data, streak] = await Promise.all([
        learningAPI.getToday(),
        learningAPI.getStreak()
      ]);
      setLearningData({ ...data, streak });
    } catch (err) {
      console.error('Error loading learning:', err);
      throw err;
    }
  }, []);

  const loadBudget = useCallback(async () => {
    try {
      const [data, topCategories] = await Promise.all([
        budgetAPI.get(),
        budgetAPI.getTopCategories()
      ]);
      setBudgetData({ ...data, topCategories });
    } catch (err) {
      console.error('Error loading budget:', err);
      throw err;
    }
  }, []);

  const loadRegularity = useCallback(async () => {
    try {
      const [streakData, history] = await Promise.all([
        regularityAPI.getStreak(),
        regularityAPI.getHistory(7)
      ]);
      setRegularityData({ ...streakData, history });
    } catch (err) {
      console.error('Error loading regularity:', err);
      throw err;
    }
  }, []);

  // ============================================================================
  // LOAD DATA - PHASE 3
  // ============================================================================

  const loadWeeklyProgress = useCallback(async () => {
    try {
      const data = await weeklyProgressAPI.get();
      setWeeklyProgressData(data);
    } catch (err) {
      console.error('Error loading weekly progress:', err);
      throw err;
    }
  }, []);

  const loadTodayPerformance = useCallback(async () => {
    try {
      const data = await todayPerformanceAPI.get();
      setTodayPerformanceData(data);
    } catch (err) {
      console.error('Error loading today performance:', err);
      throw err;
    }
  }, []);

  const loadReadingRhythm = useCallback(async () => {
    try {
      const data = await readingRhythmAPI.get();
      setReadingRhythmData(data);
    } catch (err) {
      console.error('Error loading reading rhythm:', err);
      throw err;
    }
  }, []);

  // ============================================================================
  // LOAD DATA - PHASE 4
  // ============================================================================

  const loadQuickStats = useCallback(async () => {
    try {
      const data = await quickStatsAPI.get();
      setQuickStatsData(data);
    } catch (err) {
      console.error('Error loading quick stats:', err);
      throw err;
    }
  }, []);

  const loadDCA = useCallback(async () => {
    try {
      const data = await dcaAPI.get();
      setDcaData(data);
    } catch (err) {
      console.error('Error loading DCA:', err);
      throw err;
    }
  }, []);

  const loadSalaryAllocation = useCallback(async () => {
    try {
      const data = await salaryAllocationAPI.get();
      setSalaryAllocationData(data);
    } catch (err) {
      console.error('Error loading salary allocation:', err);
      throw err;
    }
  }, []);

  const loadDeadlines = useCallback(async () => {
    try {
      const data = await deadlinesAPI.getAll();
      setDeadlinesData(data);
    } catch (err) {
      console.error('Error loading deadlines:', err);
      throw err;
    }
  }, []);

  const loadSmartProgression = useCallback(async () => {
    try {
      const data = await smartProgressionAPI.get();
      setSmartProgressionData(data);
    } catch (err) {
      console.error('Error loading smart progression:', err);
      throw err;
    }
  }, []);

  const loadSportComparisons = useCallback(async () => {
    try {
      const data = await sportComparisonsAPI.get();
      setSportComparisonsData(data);
    } catch (err) {
      console.error('Error loading sport comparisons:', err);
      throw err;
    }
  }, []);

  const loadReadingComparisons = useCallback(async () => {
    try {
      const data = await readingComparisonsAPI.get();
      setReadingComparisonsData(data);
    } catch (err) {
      console.error('Error loading reading comparisons:', err);
      throw err;
    }
  }, []);

  const loadReadingPerformance = useCallback(async () => {
    try {
      const data = await readingPerformanceAPI.get();
      setReadingPerformanceData(data);
    } catch (err) {
      console.error('Error loading reading performance:', err);
      throw err;
    }
  }, []);

  const loadProjections = useCallback(async () => {
    try {
      const data = await projectionsAPI.get();
      setProjectionsData(data);
    } catch (err) {
      console.error('Error loading projections:', err);
      throw err;
    }
  }, []);

  const loadTheoryReality = useCallback(async () => {
    try {
      const data = await theoryRealityAPI.get();
      setTheoryRealityData(data);
    } catch (err) {
      console.error('Error loading theory reality:', err);
      throw err;
    }
  }, []);

  const loadNews = useCallback(async () => {
    try {
      const data = await newsAPI.get();
      setNewsData(data);
    } catch (err) {
      console.error('Error loading news:', err);
      throw err;
    }
  }, []);

  const loadLeisureObjectives = useCallback(async () => {
    try {
      const data = await leisureObjectivesAPI.getAll();
      setLeisureObjectivesData(data);
    } catch (err) {
      console.error('Error loading leisure objectives:', err);
      throw err;
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await initDashboard();
      await Promise.all([
        loadQuests(),
        loadSport(),
        loadReading(),
        loadPatrimony(),
        loadLearning(),
        loadBudget(),
        loadRegularity(),
        loadWeeklyProgress(),
        loadTodayPerformance(),
        loadReadingRhythm(),
        loadQuickStats(),
        loadDCA(),
        loadSalaryAllocation(),
        loadDeadlines(),
        loadSmartProgression(),
        loadSportComparisons(),
        loadReadingComparisons(),
        loadReadingPerformance(),
        loadProjections(),
        loadTheoryReality(),
        loadNews(),
        loadLeisureObjectives()
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    loadQuests, loadSport, loadReading, loadPatrimony, loadLearning, loadBudget, loadRegularity, 
    loadWeeklyProgress, loadTodayPerformance, loadReadingRhythm,
    loadQuickStats, loadDCA, loadSalaryAllocation, loadDeadlines, loadSmartProgression,
    loadSportComparisons, loadReadingComparisons, loadReadingPerformance, loadProjections,
    loadTheoryReality, loadNews, loadLeisureObjectives
  ]);

  // Initial load
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ============================================================================
  // QUESTS OPERATIONS
  // ============================================================================

  const toggleQuest = useCallback(async (questId) => {
    try {
      await questsAPI.toggle(questId);
      await Promise.all([loadQuests(), loadRegularity()]); // Refresh regularity too
    } catch (err) {
      setError(err.message);
    }
  }, [loadQuests, loadRegularity]);

  const addQuest = useCallback(async (questData) => {
    try {
      await questsAPI.add(questData);
      await loadQuests();
    } catch (err) {
      setError(err.message);
    }
  }, [loadQuests]);

  const completeAllQuests = useCallback(async () => {
    try {
      const incompleteQuests = quests.filter(q => !q.completed);
      await Promise.all(incompleteQuests.map(q => questsAPI.toggle(q.id)));
      await Promise.all([loadQuests(), loadRegularity()]);
    } catch (err) {
      setError(err.message);
    }
  }, [quests, loadQuests, loadRegularity]);

  // ============================================================================
  // SPORT OPERATIONS
  // ============================================================================

  const saveSportSession = useCallback(async (exercises) => {
    try {
      await sportAPI.save(exercises);
      await loadSport();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [loadSport]);

  // ============================================================================
  // READING OPERATIONS
  // ============================================================================

  const addBook = useCallback(async (bookData) => {
    try {
      await readingAPI.addBook(bookData);
      await loadReading();
    } catch (err) {
      setError(err.message);
    }
  }, [loadReading]);

  const saveReadingSession = useCallback(async (sessionData) => {
    try {
      await readingAPI.saveSession(sessionData);
      await loadReading();
    } catch (err) {
      setError(err.message);
    }
  }, [loadReading]);

  // ============================================================================
  // PATRIMONY OPERATIONS
  // ============================================================================

  const updatePatrimony = useCallback(async (data) => {
    try {
      await patrimonyAPI.update(data);
      await loadPatrimony();
    } catch (err) {
      setError(err.message);
    }
  }, [loadPatrimony]);

  // ============================================================================
  // LEARNING OPERATIONS
  // ============================================================================

  const startLearningTimer = useCallback(() => {
    // This will be handled by ActiveTimerBlock
    console.log('Starting learning timer...');
  }, []);

  // ============================================================================
  // BUDGET OPERATIONS
  // ============================================================================

  const addExpense = useCallback(async (category, amount) => {
    try {
      await budgetAPI.addExpense(category, amount);
      await loadBudget();
    } catch (err) {
      setError(err.message);
    }
  }, [loadBudget]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const metrics = useMemo(() => {
    if (!questStats || !sportStats || !readingStats || !patrimony) {
      return null;
    }

    return {
      quests: {
        completed: questStats.completed,
        total: questStats.total,
        xpGained: questStats.xpGained,
        xpPotential: questStats.xpPotential,
        progress: questStats.progress
      },
      sport: {
        frequency7: sportStats.days7.frequency,
        frequency30: sportStats.days30.frequency,
        hasSessionToday: !!sportSession?.today
      },
      reading: {
        sessions7: readingStats.days7.sessions,
        sessions30: readingStats.days30.sessions,
        avgSpeed: readingStats.days7.avgSpeed,
        activeBooks: books.length
      },
      patrimony: {
        total: patrimony.total.valorise,
        performance: patrimony.total.plusValuePourcent,
        lastUpdate: patrimony.lastUpdate
      }
    };
  }, [questStats, sportStats, readingStats, patrimony, sportSession, books]);

  // ============================================================================
  // PHASE 3 OPERATIONS
  // ============================================================================

  const selectMuscle = useCallback((muscleId) => {
    console.log('Selected muscle:', muscleId);
    // This will be used for tracking muscle selection
  }, []);

  const startReadingTimer = useCallback(() => {
    console.log('Starting reading timer...');
  }, []);

  const stopReadingTimer = useCallback((duration) => {
    console.log('Stopping reading timer, duration:', duration);
    // Save reading session with duration
  }, []);

  // ============================================================================
  // PHASE 4 OPERATIONS
  // ============================================================================

  const executeDCABuy = useCallback(async (assetId) => {
    try {
      await dcaAPI.executeBuy(assetId);
      await loadDCA();
    } catch (err) {
      setError(err.message);
    }
  }, [loadDCA]);

  const applyDCARecommendation = useCallback(async (recId) => {
    try {
      await dcaAPI.applyRecommendation(recId);
      await loadDCA();
    } catch (err) {
      setError(err.message);
    }
  }, [loadDCA]);

  const updateSalaryAllocation = useCallback(async (allocation) => {
    try {
      await salaryAllocationAPI.update(allocation);
      await loadSalaryAllocation();
    } catch (err) {
      setError(err.message);
    }
  }, [loadSalaryAllocation]);

  const completeDeadline = useCallback(async (id) => {
    try {
      await deadlinesAPI.complete(id);
      await loadDeadlines();
    } catch (err) {
      setError(err.message);
    }
  }, [loadDeadlines]);

  const createQuest = useCallback(async (questData) => {
    try {
      await questExpressAPI.create(questData);
      await loadQuests();
    } catch (err) {
      setError(err.message);
    }
  }, [loadQuests]);

  const addLeisureObjective = useCallback(async (objective) => {
    try {
      await leisureObjectivesAPI.add(objective);
      await loadLeisureObjectives();
    } catch (err) {
      setError(err.message);
    }
  }, [loadLeisureObjectives]);

  const updateLeisureProgress = useCallback(async (id, amount) => {
    try {
      await leisureObjectivesAPI.updateProgress(id, amount);
      await loadLeisureObjectives();
    } catch (err) {
      setError(err.message);
    }
  }, [loadLeisureObjectives]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State - Phase 1
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
    
    // State - Phase 2
    learningData,
    budgetData,
    regularityData,
    
    // State - Phase 3
    weeklyProgressData,
    todayPerformanceData,
    readingRhythmData,
    
    // State - Phase 4
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

    // Operations - Phase 1
    toggleQuest,
    addQuest,
    completeAllQuests,
    saveSportSession,
    addBook,
    saveReadingSession,
    updatePatrimony,
    
    // Operations - Phase 2
    startLearningTimer,
    addExpense,
    
    // Operations - Phase 3
    selectMuscle,
    startReadingTimer,
    stopReadingTimer,
    
    // Operations - Phase 4
    executeDCABuy,
    applyDCARecommendation,
    updateSalaryAllocation,
    completeDeadline,
    createQuest,
    addLeisureObjective,
    updateLeisureProgress,
    
    // Refresh
    refreshAll: loadAll,
    refreshQuests: loadQuests,
    refreshSport: loadSport,
    refreshReading: loadReading,
    refreshPatrimony: loadPatrimony,
    refreshLearning: loadLearning,
    refreshBudget: loadBudget,
    refreshRegularity: loadRegularity,
    refreshWeeklyProgress: loadWeeklyProgress,
    refreshTodayPerformance: loadTodayPerformance,
    refreshReadingRhythm: loadReadingRhythm,
    refreshQuickStats: loadQuickStats,
    refreshDCA: loadDCA,
    refreshSalaryAllocation: loadSalaryAllocation,
    refreshDeadlines: loadDeadlines,
    refreshSmartProgression: loadSmartProgression,
    refreshSportComparisons: loadSportComparisons,
    refreshReadingComparisons: loadReadingComparisons,
    refreshReadingPerformance: loadReadingPerformance,
    refreshProjections: loadProjections,
    refreshTheoryReality: loadTheoryReality,
    refreshLeisureObjectives: loadLeisureObjectives,
    refreshNews: loadNews
  };
};

export default useDashboard;
