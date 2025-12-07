/**
 * Dashboard Storage Service
 * Gestion centralisée des données Dashboard avec IndexedDB
 */

import { z } from 'zod';

// ============================================================================
// SCHEMAS VALIDATION
// ============================================================================

const QuestSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  xp: z.number(),
  completed: z.boolean(),
  priority: z.enum(['high', 'medium', 'low']),
  date: z.string()
});

const SportExerciseSchema = z.object({
  pompes: z.number().default(0),
  gainage: z.number().default(0),
  curls: z.number().default(0),
  tractions: z.number().default(0),
  dips: z.number().default(0),
  tractionsAustraliennes: z.number().default(0)
});

const SportSessionSchema = z.object({
  id: z.string(),
  date: z.string(),
  exercises: SportExerciseSchema,
  records: z.array(z.string()).default([])
});

const ReadingSessionSchema = z.object({
  id: z.string(),
  bookId: z.string(),
  date: z.string(),
  duration: z.number(), // minutes
  pagesRead: z.number(),
  notes: z.string().optional()
});

const BookSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  totalPages: z.number(),
  currentPage: z.number(),
  coverUrl: z.string().optional(),
  genre: z.string(),
  startDate: z.string(),
  active: z.boolean()
});

// ============================================================================
// NEW SCHEMAS FOR TODAY PERFORMANCE REFONTE
// ============================================================================

const MuscleGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  current: z.number(),
  target: z.number(),
  imageData: z.string().optional(), // Base64 encoded image
  createdAt: z.number(), // Timestamp
  updatedAt: z.number() // Timestamp
});

const PerformanceHistorySchema = z.object({
  id: z.string(), // date-based ID (YYYY-MM-DD)
  date: z.string(), // YYYY-MM-DD
  volume: z.number(),
  intensity: z.number(),
  duration: z.number(), // minutes
  restTime: z.number(), // seconds
  exercises: z.array(z.object({
    name: z.string(),
    current: z.number(),
    target: z.number(),
    unit: z.string()
  })),
  createdAt: z.number() // Timestamp
});

const AchievementSchema = z.object({
  id: z.string(),
  date: z.string(), // YYYY-MM-DD
  type: z.enum(['record', 'streak', 'performance', 'goal', 'consistency']),
  title: z.string(),
  description: z.string(),
  reward: z.string(),
  isNew: z.boolean(),
  completed: z.boolean(),
  createdAt: z.number() // Timestamp
});

// ============================================================================
// INDEXEDDB SETUP
// ============================================================================

const DB_NAME = 'QuietQuestDashboard';
const DB_VERSION = 2; // Incremented for new stores
const STORES = {
  QUESTS: 'quests',
  SPORT_SESSIONS: 'sportSessions',
  READING_SESSIONS: 'readingSessions',
  BOOKS: 'books',
  PATRIMONY: 'patrimony',
  SETTINGS: 'settings',
  // New stores for Today Performance refonte
  MUSCLE_GROUPS: 'muscleGroups',
  PERFORMANCE_HISTORY: 'performanceHistory',
  ACHIEVEMENTS: 'achievements'
};

let dbInstance = null;

const initDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Store Quests
      if (!db.objectStoreNames.contains(STORES.QUESTS)) {
        const questStore = db.createObjectStore(STORES.QUESTS, { keyPath: 'id' });
        questStore.createIndex('date', 'date', { unique: false });
      }

      // Store Sport Sessions
      if (!db.objectStoreNames.contains(STORES.SPORT_SESSIONS)) {
        const sportStore = db.createObjectStore(STORES.SPORT_SESSIONS, { keyPath: 'id' });
        sportStore.createIndex('date', 'date', { unique: false });
      }

      // Store Reading Sessions
      if (!db.objectStoreNames.contains(STORES.READING_SESSIONS)) {
        const readingStore = db.createObjectStore(STORES.READING_SESSIONS, { keyPath: 'id' });
        readingStore.createIndex('date', 'date', { unique: false });
        readingStore.createIndex('bookId', 'bookId', { unique: false });
      }

      // Store Books
      if (!db.objectStoreNames.contains(STORES.BOOKS)) {
        const bookStore = db.createObjectStore(STORES.BOOKS, { keyPath: 'id' });
        bookStore.createIndex('active', 'active', { unique: false });
      }

      // Store Patrimony
      if (!db.objectStoreNames.contains(STORES.PATRIMONY)) {
        db.createObjectStore(STORES.PATRIMONY, { keyPath: 'id' });
      }

      // Store Settings
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }

      // ========================================================================
      // NEW STORES FOR TODAY PERFORMANCE REFONTE
      // ========================================================================

      // Store Muscle Groups
      if (!db.objectStoreNames.contains(STORES.MUSCLE_GROUPS)) {
        const muscleStore = db.createObjectStore(STORES.MUSCLE_GROUPS, { keyPath: 'id' });
        muscleStore.createIndex('name', 'name', { unique: false });
        muscleStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Store Performance History
      if (!db.objectStoreNames.contains(STORES.PERFORMANCE_HISTORY)) {
        const perfStore = db.createObjectStore(STORES.PERFORMANCE_HISTORY, { keyPath: 'id' });
        perfStore.createIndex('date', 'date', { unique: true });
        perfStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Store Achievements
      if (!db.objectStoreNames.contains(STORES.ACHIEVEMENTS)) {
        const achieveStore = db.createObjectStore(STORES.ACHIEVEMENTS, { keyPath: 'id' });
        achieveStore.createIndex('date', 'date', { unique: false });
        achieveStore.createIndex('type', 'type', { unique: false });
        achieveStore.createIndex('completed', 'completed', { unique: false });
      }
    };
  });
};

// ============================================================================
// CACHE SYSTEM
// ============================================================================

const cache = {
  data: new Map(),
  timestamps: new Map(),
  TTL: 5 * 60 * 1000 // 5 minutes
};

const getCacheKey = (store, id = 'all') => `${store}:${id}`;

const getFromCache = (store, id) => {
  const key = getCacheKey(store, id);
  const timestamp = cache.timestamps.get(key);
  
  if (timestamp && Date.now() - timestamp < cache.TTL) {
    return cache.data.get(key);
  }
  
  return null;
};

const setCache = (store, id, data) => {
  const key = getCacheKey(store, id);
  cache.data.set(key, data);
  cache.timestamps.set(key, Date.now());
};

const clearCache = (store, id) => {
  if (id) {
    const key = getCacheKey(store, id);
    cache.data.delete(key);
    cache.timestamps.delete(key);
  } else {
    // Clear all cache for this store
    for (const [key] of cache.data) {
      if (key.startsWith(`${store}:`)) {
        cache.data.delete(key);
        cache.timestamps.delete(key);
      }
    }
  }
};

// ============================================================================
// GENERIC CRUD OPERATIONS
// ============================================================================

const getAll = async (storeName) => {
  const cached = getFromCache(storeName);
  if (cached) return cached;

  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      const data = request.result;
      setCache(storeName, 'all', data);
      resolve(data);
    };
    request.onerror = () => reject(request.error);
  });
};

const getById = async (storeName, id) => {
  const cached = getFromCache(storeName, id);
  if (cached) return cached;

  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => {
      const data = request.result;
      if (data) setCache(storeName, id, data);
      resolve(data);
    };
    request.onerror = () => reject(request.error);
  });
};

const add = async (storeName, data, schema) => {
  // Validation
  if (schema) {
    const validated = schema.parse(data);
    data = validated;
  }

  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(data);

    request.onsuccess = () => {
      clearCache(storeName);
      resolve(data);
    };
    request.onerror = () => reject(request.error);
  });
};

const update = async (storeName, data, schema) => {
  // Validation
  if (schema) {
    const validated = schema.parse(data);
    data = validated;
  }

  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => {
      clearCache(storeName, data.id);
      clearCache(storeName, 'all');
      resolve(data);
    };
    request.onerror = () => reject(request.error);
  });
};

const remove = async (storeName, id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => {
      clearCache(storeName, id);
      clearCache(storeName, 'all');
      resolve(true);
    };
    request.onerror = () => reject(request.error);
  });
};

// ============================================================================
// QUESTS OPERATIONS
// ============================================================================

export const questsAPI = {
  getToday: async () => {
    const today = new Date().toISOString().split('T')[0];
    const allQuests = await getAll(STORES.QUESTS);
    return allQuests.filter(q => q.date === today);
  },

  toggle: async (questId) => {
    const quest = await getById(STORES.QUESTS, questId);
    if (!quest) throw new Error('Quest not found');
    
    quest.completed = !quest.completed;
    return update(STORES.QUESTS, quest, QuestSchema);
  },

  add: async (questData) => {
    const quest = {
      id: `quest_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      completed: false,
      ...questData
    };
    return add(STORES.QUESTS, quest, QuestSchema);
  },

  getStats: async () => {
    const today = await questsAPI.getToday();
    const completed = today.filter(q => q.completed);
    const xpGained = completed.reduce((sum, q) => sum + q.xp, 0);
    const xpPotential = today.reduce((sum, q) => sum + q.xp, 0);
    
    return {
      total: today.length,
      completed: completed.length,
      xpGained,
      xpPotential,
      xpRemaining: xpPotential - xpGained,
      progress: today.length > 0 ? (completed.length / today.length) * 100 : 0
    };
  }
};

// ============================================================================
// SPORT OPERATIONS
// ============================================================================

export const sportAPI = {
  getToday: async () => {
    const today = new Date().toISOString().split('T')[0];
    const allSessions = await getAll(STORES.SPORT_SESSIONS);
    return allSessions.find(s => s.date === today);
  },

  getLast: async () => {
    const allSessions = await getAll(STORES.SPORT_SESSIONS);
    return allSessions.sort((a, b) => b.date.localeCompare(a.date))[0];
  },

  save: async (exercises) => {
    const today = new Date().toISOString().split('T')[0];
    const existing = await sportAPI.getToday();
    
    if (existing) {
      throw new Error('Session already saved today');
    }

    const last = await sportAPI.getLast();
    const records = [];

    // Detect records
    if (last) {
      Object.keys(exercises).forEach(key => {
        if (exercises[key] > (last.exercises[key] || 0)) {
          records.push(key);
        }
      });
    }

    const session = {
      id: `sport_${Date.now()}`,
      date: today,
      exercises,
      records
    };

    return add(STORES.SPORT_SESSIONS, session, SportSessionSchema);
  },

  getStats: async (days = 7) => {
    const allSessions = await getAll(STORES.SPORT_SESSIONS);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoff = cutoffDate.toISOString().split('T')[0];

    const recentSessions = allSessions.filter(s => s.date >= cutoff);
    
    const stats = {
      frequency: recentSessions.length,
      totalVolume: {},
      avgVolume: {},
      records: []
    };

    recentSessions.forEach(session => {
      Object.entries(session.exercises).forEach(([exercise, value]) => {
        stats.totalVolume[exercise] = (stats.totalVolume[exercise] || 0) + value;
      });
      stats.records.push(...session.records);
    });

    Object.keys(stats.totalVolume).forEach(exercise => {
      stats.avgVolume[exercise] = Math.round(stats.totalVolume[exercise] / recentSessions.length);
    });

    return stats;
  }
};

// ============================================================================
// READING OPERATIONS
// ============================================================================

export const readingAPI = {
  getActiveBooks: async () => {
    const allBooks = await getAll(STORES.BOOKS);
    return allBooks.filter(b => b.active);
  },

  addBook: async (bookData) => {
    const book = {
      id: `book_${Date.now()}`,
      currentPage: 0,
      active: true,
      startDate: new Date().toISOString().split('T')[0],
      ...bookData
    };
    return add(STORES.BOOKS, book, BookSchema);
  },

  saveSession: async (sessionData) => {
    const session = {
      id: `reading_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      ...sessionData
    };

    // Update book progress
    const book = await getById(STORES.BOOKS, sessionData.bookId);
    if (book) {
      book.currentPage += sessionData.pagesRead;
      await update(STORES.BOOKS, book, BookSchema);
    }

    return add(STORES.READING_SESSIONS, session, ReadingSessionSchema);
  },

  getStats: async (days = 7) => {
    const allSessions = await getAll(STORES.READING_SESSIONS);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoff = cutoffDate.toISOString().split('T')[0];

    const recentSessions = allSessions.filter(s => s.date >= cutoff);
    
    const totalTime = recentSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalPages = recentSessions.reduce((sum, s) => sum + s.pagesRead, 0);
    const avgSpeed = totalTime > 0 ? (totalPages / (totalTime / 60)).toFixed(1) : 0;

    return {
      sessions: recentSessions.length,
      totalTime,
      totalPages,
      avgSpeed, // pages/hour
      avgSession: recentSessions.length > 0 ? Math.round(totalTime / recentSessions.length) : 0
    };
  }
};

// ============================================================================
// PATRIMONY OPERATIONS
// ============================================================================

export const patrimonyAPI = {
  get: async () => {
    return getById(STORES.PATRIMONY, 'current') || {
      id: 'current',
      or: { valorisation: 0, grammes: 0, plusValue: 0, plusValuePourcent: 0 },
      bourse: { valorisation: 0, positions: 0, plusValue: 0, plusValuePourcent: 0 },
      cash: { valorisation: 0, plusValue: 0, plusValuePourcent: 0 },
      total: { valorise: 0, plusValue: 0, plusValuePourcent: 0 },
      lastUpdate: new Date().toISOString()
    };
  },

  update: async (data) => {
    const patrimony = {
      id: 'current',
      ...data,
      lastUpdate: new Date().toISOString()
    };
    return update(STORES.PATRIMONY, patrimony);
  }
};

// ============================================================================
// LEARNING OPERATIONS
// ============================================================================

const LearningSessionSchema = z.object({
  id: z.string(),
  subject: z.string(),
  date: z.string(),
  duration: z.number(), // minutes
  completed: z.boolean()
});

export const learningAPI = {
  getToday: async () => {
    const today = new Date().toISOString().split('T')[0];
    const allSessions = await getAll(STORES.SETTINGS);
    const learningData = allSessions.find(s => s.key === 'learning') || {
      key: 'learning',
      activeSubject: 'Mathématiques',
      dailyGoal: 120, // minutes
      subjects: ['Mathématiques', 'Physique', 'Informatique', 'Anglais']
    };
    
    // Get today's sessions
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('settings', 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(`learning_${today}`);

      request.onsuccess = () => {
        const data = request.result || {
          key: `learning_${today}`,
          sessions: [],
          totalTime: 0
        };
        resolve({ ...learningData, todaySessions: data });
      };
      request.onerror = () => reject(request.error);
    });
  },

  saveSession: async (duration) => {
    const today = new Date().toISOString().split('T')[0];
    const current = await learningAPI.getToday();
    
    const sessionData = {
      key: `learning_${today}`,
      sessions: [...(current.todaySessions.sessions || []), {
        id: `session_${Date.now()}`,
        duration,
        timestamp: new Date().toISOString()
      }],
      totalTime: (current.todaySessions.totalTime || 0) + duration
    };

    return update(STORES.SETTINGS, sessionData);
  },

  getStreak: async () => {
    // Calculate consecutive days with sessions
    const allSettings = await getAll(STORES.SETTINGS);
    const learningSessions = allSettings.filter(s => s.key.startsWith('learning_'));
    
    let streak = 0;
    let currentDate = new Date();
    
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const session = learningSessions.find(s => s.key === `learning_${dateStr}`);
      
      if (!session || session.totalTime === 0) break;
      
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  }
};

// ============================================================================
// BUDGET OPERATIONS
// ============================================================================

export const budgetAPI = {
  get: async () => {
    const budget = await getById(STORES.SETTINGS, 'budget') || {
      key: 'budget',
      monthlyIncome: 3000,
      expenses: [],
      categories: {
        alimentation: { budget: 400, spent: 0 },
        transport: { budget: 200, spent: 0 },
        loisirs: { budget: 300, spent: 0 },
        logement: { budget: 800, spent: 0 },
        autres: { budget: 300, spent: 0 }
      }
    };
    
    // Calculate totals
    const totalBudget = Object.values(budget.categories).reduce((sum, cat) => sum + cat.budget, 0);
    const totalSpent = Object.values(budget.categories).reduce((sum, cat) => sum + cat.spent, 0);
    const remaining = totalBudget - totalSpent;
    const percentUsed = (totalSpent / totalBudget) * 100;
    
    // Get days remaining in month
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysRemaining = lastDay.getDate() - now.getDate();
    
    return {
      ...budget,
      totalBudget,
      totalSpent,
      remaining,
      percentUsed,
      daysRemaining
    };
  },

  addExpense: async (category, amount) => {
    const budget = await budgetAPI.get();
    
    if (!budget.categories[category]) {
      throw new Error('Invalid category');
    }
    
    budget.categories[category].spent += amount;
    budget.expenses.push({
      id: `expense_${Date.now()}`,
      category,
      amount,
      date: new Date().toISOString()
    });
    
    return update(STORES.SETTINGS, budget);
  },

  getTopCategories: async () => {
    const budget = await budgetAPI.get();
    
    const categories = Object.entries(budget.categories).map(([name, data]) => ({
      name,
      ...data,
      percentUsed: (data.spent / data.budget) * 100,
      status: data.spent > data.budget ? 'exceeded' : data.spent > data.budget * 0.9 ? 'warning' : 'ok'
    }));
    
    // Sort by most remarkable (exceeded or high usage)
    return categories
      .sort((a, b) => {
        if (a.status === 'exceeded' && b.status !== 'exceeded') return -1;
        if (b.status === 'exceeded' && a.status !== 'exceeded') return 1;
        return b.percentUsed - a.percentUsed;
      })
      .slice(0, 3);
  }
};

// ============================================================================
// REGULARITY OPERATIONS
// ============================================================================

export const regularityAPI = {
  getStreak: async () => {
    // Get all quest data to calculate streak
    const allQuests = await getAll(STORES.QUESTS);
    
    let streak = 0;
    let record = 0;
    let currentDate = new Date();
    
    // Calculate current streak
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayQuests = allQuests.filter(q => q.date === dateStr);
      const completed = dayQuests.filter(q => q.completed);
      
      if (dayQuests.length === 0 || completed.length === 0) break;
      
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Calculate record (stored in settings)
    const settings = await getById(STORES.SETTINGS, 'regularity') || { key: 'regularity', record: 0 };
    record = Math.max(settings.record, streak);
    
    if (streak > settings.record) {
      await update(STORES.SETTINGS, { key: 'regularity', record: streak });
    }
    
    return { streak, record, progressToRecord: record > 0 ? (streak / record) * 100 : 0 };
  },

  getHistory: async (days = 7) => {
    const allQuests = await getAll(STORES.QUESTS);
    const history = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayQuests = allQuests.filter(q => q.date === dateStr);
      const completed = dayQuests.filter(q => q.completed);
      
      history.push({
        date: dateStr,
        total: dayQuests.length,
        completed: completed.length,
        status: dayQuests.length > 0 && completed.length === dayQuests.length ? 'complete' : 
                dayQuests.length > 0 && completed.length > 0 ? 'partial' : 'none'
      });
    }
    
    return history.reverse();
  }
};

// ============================================================================
// WEEKLY PROGRESS OPERATIONS (Phase 3)
// ============================================================================

export const weeklyProgressAPI = {
  get: async () => {
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();
    
    // Mock data - à remplacer par vraies données
    return {
      weekNumber,
      year,
      score: 4.2,
      totalTime: 1025, // minutes (17h05)
      sessions: 23,
      daysCompleted: 5,
      streak: 4,
      record: 12,
      dailyActivities: [
        { date: 8, status: 'completed' },
        { date: 9, status: 'completed' },
        { date: 10, status: 'partial' },
        { date: 11, status: 'completed' },
        { date: 12, status: 'missed' },
        { date: 13, status: 'inProgress' },
        { date: 14, status: 'upcoming' }
      ],
      subjectProgress: [
        { name: 'Sport', sessions: 3, target: 4, time: 240, progress: 75 },
        { name: 'Lecture', sessions: 5, target: 7, time: 320, progress: 71 },
        { name: 'Mathématiques', sessions: 4, target: 5, time: 240, progress: 80 },
        { name: 'Informatique', sessions: 3, target: 4, time: 180, progress: 75 }
      ],
      achievements: [
        { icon: '🔥', name: 'Consistency Master', description: '4 jours consécutifs', date: "Aujourd'hui", unlocked: true, rarity: 'rare' },
        { icon: '📚', name: 'Study Marathon', description: 'Plus de 3h en un jour', date: 'Mardi', unlocked: true, rarity: 'epic' },
        { icon: '🎯', name: 'Perfect Week', description: 'Tous les objectifs atteints', unlocked: false, rarity: 'legendary' },
        { icon: '⚡', name: 'Speed Learner', description: '20+ sessions en une semaine', unlocked: false, rarity: 'rare' }
      ],
      timeDistribution: [
        { category: 'Sport', percentage: 25.4, icon: '💪', color: 'from-[#40e0ff] to-[#00F5FF]' },
        { category: 'Lecture', percentage: 21.9, icon: '📚', color: 'from-[#66bb6a] to-[#43a047]' },
        { category: 'Maths', percentage: 18.0, icon: '🔢', color: 'from-[#ffa726] to-[#ff9800]' },
        { category: 'Informatique', percentage: 15.2, icon: '💻', color: 'from-[#ef5350] to-[#e53935]' },
        { category: 'Autres', percentage: 19.5, icon: '✨', color: 'from-[#ab47bc] to-[#9c27b0]' }
      ],
      heatmapData: Array.from({ length: 24 }, (_, i) => {
        // Simulate realistic performance by hour
        if (i >= 0 && i < 6) return Math.floor(Math.random() * 20); // Night: low
        if (i >= 6 && i < 9) return Math.floor(Math.random() * 40) + 40; // Morning: medium
        if (i >= 9 && i < 12) return Math.floor(Math.random() * 20) + 80; // Peak morning: high
        if (i >= 12 && i < 14) return Math.floor(Math.random() * 30) + 50; // Lunch: medium
        if (i >= 14 && i < 18) return Math.floor(Math.random() * 30) + 60; // Afternoon: good
        if (i >= 18 && i < 22) return Math.floor(Math.random() * 40) + 30; // Evening: low-medium
        return Math.floor(Math.random() * 20); // Late night: low
      }),
      bestTimeSlot: '10h-11h (90%)',
      worstTimeSlot: 'après 19h (35%)',
      trends: [
        { metric: 'Temps total', description: 'vs semaine dernière', change: 15, icon: '📈' },
        { metric: 'Sessions', description: 'vs semaine dernière', change: 8, icon: '🎯' },
        { metric: 'Régularité', description: 'vs semaine dernière', change: 12, icon: '🔥' }
      ],
      goals: [
        { title: "Atteindre 15h d'étude", progress: 100 },
        { title: 'Maintenir 4+ sessions/matière', progress: 100 },
        { title: 'Aucun jour à 0%', progress: 85 },
        { title: 'Étudier 1h avant 10h', progress: 25 }
      ],
      insights: [
        { type: 'positive', title: 'Performance exceptionnelle', description: 'Vos sessions de 10h-11h sont 40% plus productives que la moyenne.' },
        { type: 'warning', title: 'Zone d\'amélioration identifiée', description: 'Informatique (75%) nécessite plus d\'attention.' }
      ]
    };
  }
};

// ============================================================================
// TODAY PERFORMANCE OPERATIONS (Phase 3)
// ============================================================================

export const todayPerformanceAPI = {
  get: async () => {
    // Mock data - à remplacer par vraies données
    return {
      musclesTargeted: ['pectoraux', 'triceps', 'abdos'],
      intensity: 85,
      volumeByMuscle: {
        pectoraux: 120,
        dos: 0,
        epaules: 0,
        biceps: 60,
        triceps: 80,
        abdos: 180,
        jambes: 0
      },
      recordsThisWeek: [
        { exercise: 'Pompes', oldValue: 45, newValue: 50 },
        { exercise: 'Gainage', oldValue: 90, newValue: 120 }
      ],
      weeklyMissions: [
        { day: 'Lundi', description: 'Pectoraux + Triceps', completed: true },
        { day: 'Mardi', description: 'Dos + Biceps', completed: true },
        { day: 'Mercredi', description: 'Repos actif', completed: true },
        { day: 'Jeudi', description: 'Jambes + Abdos', completed: false },
        { day: 'Vendredi', description: 'Full Body', completed: false }
      ],
      livePerformance: [
        { name: 'Pompes', current: 45, target: 50 },
        { name: 'Gainage', current: 90, target: 120 },
        { name: 'Curls', current: 30, target: 40 }
      ],
      vsYesterday: {
        volume: 12,
        intensité: -5,
        'temps repos': -8,
        durée: 15
      },
      accomplishments: [
        { icon: '🏆', title: 'Record personnel', reward: '+50 XP' },
        { icon: '💪', title: 'Volume élevé', reward: '+30 XP' },
        { icon: '⚡', title: 'Intensité maximale', reward: '+40 XP' }
      ],
      aiRecommendations: [
        'Augmentez progressivement le volume sur les pectoraux (+10% par semaine)',
        'Ajoutez des exercices pour le dos pour équilibrer le développement',
        'Réduisez le temps de repos entre les séries pour améliorer l\'endurance'
      ],
      personalHistory: {
        records: 12,
        totalSessions: 45,
        avgIntensity: 78
      }
    };
  }
};

// ============================================================================
// READING RHYTHM OPERATIONS (Phase 3)
// ============================================================================

export const readingRhythmAPI = {
  get: async () => {
    // Mock data - à remplacer par vraies données
    return {
      streak: 12,
      streakRecord: 21,
      stats: {
        today: 45,
        week: 320,
        avgSession: 38,
        speed: 42
      },
      dailyGoal: 60,
      predictions: [
        {
          scenario: 'optimiste',
          date: '15 Jan 2025',
          probability: 25,
          details: {
            'Pages/jour': '50',
            'Sessions': '2/jour',
            'Jours restants': '12'
          }
        },
        {
          scenario: 'realiste',
          date: '22 Jan 2025',
          probability: 60,
          details: {
            'Pages/jour': '35',
            'Sessions': '1/jour',
            'Jours restants': '19'
          }
        },
        {
          scenario: 'pessimiste',
          date: '5 Fév 2025',
          probability: 15,
          details: {
            'Pages/jour': '20',
            'Sessions': '3/semaine',
            'Jours restants': '33'
          }
        }
      ],
      optimizationLevers: [
        { name: 'Augmenter vitesse', description: '+5 pages/h', impact: 15, icon: '⚡' },
        { name: 'Sessions quotidiennes', description: '2 sessions/jour', impact: 25, icon: '📅' },
        { name: 'Profiter du weekend', description: 'Sessions longues', impact: 12, icon: '🌅' }
      ],
      aiPlan: [
        'Lire 40 pages par jour en moyenne',
        'Privilégier les sessions matinales (meilleure concentration)',
        'Ajouter une session courte le soir (20 min)',
        'Profiter du weekend pour des sessions de 60+ minutes'
      ],
      nextMilestone: {
        name: '75% du livre',
        progress: 68,
        remaining: 85
      },
      motivators: [
        { text: 'Vous êtes à 85 pages de votre prochain jalon !', context: '75% du livre' },
        { text: 'Votre streak actuel est excellent, continuez !', context: '12 jours consécutifs' }
      ]
    };
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const generateMockHeatmap = () => {
  // Generate 7 days x 6 hours heatmap with random values
  return Array(7).fill(0).map(() =>
    Array(6).fill(0).map(() => Math.floor(Math.random() * 120))
  );
};

// ============================================================================
// PHASE 4 OPERATIONS - PRIORITY-LOW
// ============================================================================

// Quick Stats API
export const quickStatsAPI = {
  get: async () => {
    return {
      stats: [
        { icon: '🎯', label: 'Quêtes', value: '8/10', trend: +5, color: 'purple' },
        { icon: '💪', label: 'Sport (7j)', value: '5', trend: +12, color: 'orange' },
        { icon: '📚', label: 'Lecture', value: '45min', trend: +8, color: 'indigo' },
        { icon: '🎓', label: 'Apprentissage', value: '2h', trend: +15, color: 'blue' },
        { icon: '💰', label: 'Épargne', value: '600€', trend: +3, color: 'green' },
        { icon: '🔥', label: 'Streak', value: '12j', trend: +20, color: 'red' },
        { icon: '📈', label: 'Progression', value: '85%', trend: +7, color: 'pink' },
        { icon: '⚡', label: 'XP', value: '1250', trend: +10, color: 'yellow' }
      ]
    };
  }
};

// DCA Objectives API
export const dcaAPI = {
  get: async () => {
    return {
      assets: [
        { 
          id: 1, 
          name: 'Bitcoin', 
          icon: '₿', 
          target: 500, 
          invested: 350, 
          progress: 70, 
          nextBuy: '2024-12-15',
          gap: -50
        },
        { 
          id: 2, 
          name: 'Ethereum', 
          icon: 'Ξ', 
          target: 300, 
          invested: 180, 
          progress: 60, 
          nextBuy: '2024-12-20',
          gap: 0
        },
        { 
          id: 3, 
          name: 'S&P 500', 
          icon: '📊', 
          target: 1000, 
          invested: 800, 
          progress: 80, 
          nextBuy: '2024-12-25',
          gap: +100
        }
      ],
      totalTarget: 1800,
      totalInvested: 1330,
      recommendations: [
        { 
          id: 1, 
          title: 'Augmenter Bitcoin', 
          description: 'Rattraper le retard de 50€ sur Bitcoin' 
        },
        { 
          id: 2, 
          title: 'Maintenir S&P 500', 
          description: 'Vous êtes en avance, continuez ainsi' 
        }
      ]
    };
  },
  executeBuy: async (assetId) => {
    console.log('Executing buy for asset:', assetId);
  },
  applyRecommendation: async (recId) => {
    console.log('Applying recommendation:', recId);
  }
};

// Salary Allocation API
export const salaryAllocationAPI = {
  get: async () => {
    return {
      salary: 3000,
      allocation: {
        epargne: 600,
        investissement: 450,
        depenses: 1500,
        loisirs: 450
      }
    };
  },
  update: async (allocation) => {
    console.log('Updating allocation:', allocation);
  }
};

// Deadlines API
export const deadlinesAPI = {
  getAll: async () => {
    return {
      deadlines: [
        { 
          id: 1, 
          title: 'Paiement loyer', 
          date: '2024-12-10', 
          type: 'finance', 
          completed: false,
          description: 'Virement mensuel loyer'
        },
        { 
          id: 2, 
          title: 'Renouvellement assurance', 
          date: '2024-12-25', 
          type: 'admin', 
          completed: false,
          description: 'Assurance habitation'
        },
        { 
          id: 3, 
          title: 'Rendez-vous médecin', 
          date: '2024-12-08', 
          type: 'health', 
          completed: false,
          description: 'Contrôle annuel'
        },
        { 
          id: 4, 
          title: 'Déclaration impôts', 
          date: '2025-01-15', 
          type: 'admin', 
          completed: false,
          description: 'Déclaration trimestrielle'
        }
      ]
    };
  },
  complete: async (id) => {
    console.log('Completing deadline:', id);
  }
};

// Smart Progression API
export const smartProgressionAPI = {
  get: async () => {
    return {
      metrics: {
        sport: { current: 85, trend: +12, suggestion: 'Augmenter fréquence hebdomadaire' },
        lecture: { current: 78, trend: +8, suggestion: 'Maintenir le rythme actuel' },
        learning: { current: 92, trend: +15, suggestion: 'Excellent, continuez ainsi' },
        regularity: { current: 88, trend: +5, suggestion: 'Très bonne régularité' }
      },
      overallScore: 86,
      trend: +10
    };
  }
};

// Sport Comparisons API
export const sportComparisonsAPI = {
  get: async () => {
    return {
      exercises: {
        pompes: { week: 45, month: 42, quarter: 38, trend: 'up', change: +18 },
        gainage: { week: 120, month: 110, quarter: 95, trend: 'up', change: +26 },
        curls: { week: 35, month: 32, quarter: 30, trend: 'up', change: +17 },
        tractions: { week: 12, month: 10, quarter: 8, trend: 'up', change: +50 }
      }
    };
  }
};

// Reading Comparisons API
export const readingComparisonsAPI = {
  get: async () => {
    return {
      periods: {
        week: { time: 320, pages: 180, books: 0, speed: 42 },
        month: { time: 1200, pages: 650, books: 2, speed: 40 },
        quarter: { time: 3500, pages: 1850, books: 5, speed: 38 }
      },
      genres: {
        fiction: { percentage: 60, trend: 'stable', change: 0 },
        technique: { percentage: 25, trend: 'up', change: +5 },
        essai: { percentage: 15, trend: 'down', change: -5 }
      }
    };
  }
};

// Reading Performance API
export const readingPerformanceAPI = {
  get: async () => {
    return {
      speed: {
        fiction: 45,
        technique: 32,
        essai: 38,
        overall: 40
      },
      trends: {
        speed: +5,
        consistency: +8,
        comprehension: +3,
        retention: +6
      },
      consistency: {
        score: 88,
        activeDays: 26,
        avgDaily: 42
      },
      bestTime: 'Matin (8h-10h)',
      worstTime: 'Soir (22h-24h)'
    };
  }
};

// Projections API
export const projectionsAPI = {
  get: async () => {
    return {
      metrics: {
        patrimoine: {
          '1M': { optimiste: 32000, realiste: 30500, pessimiste: 29000 },
          '3M': { optimiste: 35000, realiste: 32000, pessimiste: 30000 },
          '6M': { optimiste: 40000, realiste: 35000, pessimiste: 32000 },
          '1A': { optimiste: 50000, realiste: 42000, pessimiste: 38000 }
        },
        sport: {
          '1M': { optimiste: 95, realiste: 85, pessimiste: 75 },
          '3M': { optimiste: 110, realiste: 95, pessimiste: 80 },
          '6M': { optimiste: 130, realiste: 110, pessimiste: 90 },
          '1A': { optimiste: 150, realiste: 125, pessimiste: 100 }
        },
        lecture: {
          '1M': { optimiste: 800, realiste: 650, pessimiste: 500 },
          '3M': { optimiste: 2500, realiste: 2000, pessimiste: 1500 },
          '6M': { optimiste: 5000, realiste: 4000, pessimiste: 3000 },
          '1A': { optimiste: 10000, realiste: 8000, pessimiste: 6000 }
        },
        apprentissage: {
          '1M': { optimiste: 50, realiste: 40, pessimiste: 30 },
          '3M': { optimiste: 150, realiste: 120, pessimiste: 90 },
          '6M': { optimiste: 300, realiste: 240, pessimiste: 180 },
          '1A': { optimiste: 600, realiste: 480, pessimiste: 360 }
        }
      },
      currentValues: {
        patrimoine: 28500,
        sport: 72,
        lecture: 650,
        apprentissage: 38
      }
    };
  }
};

// Theory Reality API
export const theoryRealityAPI = {
  get: async () => {
    return {
      categories: {
        sport: { 
          target: 7, 
          actual: 5, 
          gap: -2, 
          reason: 'Manque de temps en semaine',
          recommendation: 'Planifier sessions le weekend'
        },
        lecture: { 
          target: 60, 
          actual: 45, 
          gap: -15, 
          reason: 'Fatigue le soir',
          recommendation: 'Lire le matin avant travail'
        },
        learning: { 
          target: 120, 
          actual: 140, 
          gap: +20, 
          reason: 'Motivation élevée',
          recommendation: 'Maintenir le rythme'
        },
        regularity: { 
          target: 100, 
          actual: 88, 
          gap: -12, 
          reason: 'Quelques jours manqués',
          recommendation: 'Utiliser rappels quotidiens'
        }
      },
      globalScore: 78
    };
  }
};

// Leisure Objectives API
export const leisureObjectivesAPI = {
  getAll: async () => {
    return {
      objectives: [
        {
          id: 1,
          name: 'PlayStation 5',
          cost: 500,
          saved: 350,
          targetDate: '2025-02-01',
          image: null
        },
        {
          id: 2,
          name: 'Vélo électrique',
          cost: 1200,
          saved: 400,
          targetDate: '2025-06-01',
          image: null
        }
      ],
      totalBudget: 1700,
      monthlyContribution: 150
    };
  },
  add: async (objective) => {
    console.log('Adding leisure objective:', objective);
  },
  updateProgress: async (id, amount) => {
    console.log('Updating progress:', id, amount);
  }
};

// Quest Express API
export const questExpressAPI = {
  create: async (questData) => {
    console.log('Creating quest:', questData);
    // Add to quests
    await questsAPI.add(questData);
  }
};

// News API
export const newsAPI = {
  get: async () => {
    return {
      news: [
        {
          id: 1,
          title: 'Bitcoin atteint 45k$',
          summary: 'Le Bitcoin franchit un nouveau palier psychologique',
          source: 'CoinDesk',
          category: 'crypto',
          sentiment: 'positive',
          impact: 'high',
          quality: 85,
          url: 'https://example.com',
          date: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Fed maintient les taux',
          summary: 'La Réserve Fédérale maintient sa politique monétaire',
          source: 'Bloomberg',
          category: 'economie',
          sentiment: 'neutral',
          impact: 'medium',
          quality: 90,
          url: 'https://example.com',
          date: new Date().toISOString()
        },
        {
          id: 3,
          title: 'Apple annonce nouveaux produits',
          summary: 'Apple dévoile sa nouvelle gamme de produits',
          source: 'TechCrunch',
          category: 'bourse',
          sentiment: 'positive',
          impact: 'medium',
          quality: 80,
          url: 'https://example.com',
          date: new Date().toISOString()
        }
      ],
      apiStatus: { newsapi: 'ok', finnhub: 'ok', reddit: 'ok' },
      marketStatus: 'open',
      stats: {
        total: 3,
        positive: 2,
        neutral: 1,
        negative: 0,
        urgent: 1
      }
    };
  }
};

// ============================================================================
// MUSCLE GROUPS API (Today Performance Refonte)
// ============================================================================

export const muscleGroupsAPI = {
  getAll: async () => {
    return getAll(STORES.MUSCLE_GROUPS);
  },

  getById: async (id) => {
    return getById(STORES.MUSCLE_GROUPS, id);
  },

  create: async (muscleData) => {
    const muscle = {
      id: `muscle_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...muscleData
    };
    return add(STORES.MUSCLE_GROUPS, muscle, MuscleGroupSchema);
  },

  update: async (id, muscleData) => {
    const existing = await getById(STORES.MUSCLE_GROUPS, id);
    if (!existing) throw new Error('Muscle group not found');
    
    const updated = {
      ...existing,
      ...muscleData,
      updatedAt: Date.now()
    };
    return update(STORES.MUSCLE_GROUPS, updated, MuscleGroupSchema);
  },

  delete: async (id) => {
    return remove(STORES.MUSCLE_GROUPS, id);
  },

  uploadImage: async (id, imageData) => {
    return muscleGroupsAPI.update(id, { imageData });
  }
};

// ============================================================================
// MISSIONS API (Today Performance Refonte)
// ============================================================================

export const missionsAPI = {
  getWeekly: () => {
    // Get missions from localStorage for the current week
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    
    const missions = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayMissions = missionsAPI.getByDate(dateStr);
      missions.push({
        date: dateStr,
        missions: dayMissions
      });
    }
    
    return missions;
  },

  getByDate: (dateStr) => {
    const key = `mission_${dateStr}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  },

  create: (missionData) => {
    const mission = {
      id: Date.now(),
      completed: false,
      createdAt: new Date().toISOString(),
      ...missionData
    };
    
    const key = `mission_${missionData.date}`;
    const existing = missionsAPI.getByDate(missionData.date);
    existing.push(mission);
    localStorage.setItem(key, JSON.stringify(existing));
    
    return mission;
  },

  toggle: (missionId, dayName) => {
    // Find and toggle mission state
    const missions = missionsAPI.getWeekly();
    const day = missions.find(d => d.date.includes(dayName.toLowerCase()));
    
    if (day) {
      const dayMissions = missionsAPI.getByDate(day.date);
      const mission = dayMissions.find(m => m.id === missionId);
      
      if (mission) {
        mission.completed = !mission.completed;
        localStorage.setItem(`mission_${day.date}`, JSON.stringify(dayMissions));
        
        // Save state separately for quick access
        const stateKey = `mission_${missionId}_${dayName}`;
        localStorage.setItem(stateKey, JSON.stringify({
          completed: mission.completed,
          timestamp: new Date().toISOString()
        }));
      }
    }
  },

  delete: (missionId, date) => {
    const dayMissions = missionsAPI.getByDate(date);
    const filtered = dayMissions.filter(m => m.id !== missionId);
    localStorage.setItem(`mission_${date}`, JSON.stringify(filtered));
  }
};

// ============================================================================
// PERFORMANCE HISTORY API (Today Performance Refonte)
// ============================================================================

export const performanceHistoryAPI = {
  get: async (date) => {
    const id = date || new Date().toISOString().split('T')[0];
    return getById(STORES.PERFORMANCE_HISTORY, id);
  },

  getByPeriod: async (startDate, endDate) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.PERFORMANCE_HISTORY, 'readonly');
      const store = transaction.objectStore(STORES.PERFORMANCE_HISTORY);
      const index = store.index('date');
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  save: async (performanceData) => {
    const today = new Date().toISOString().split('T')[0];
    const data = {
      id: today,
      date: today,
      createdAt: Date.now(),
      ...performanceData
    };
    
    const existing = await performanceHistoryAPI.get(today);
    if (existing) {
      return update(STORES.PERFORMANCE_HISTORY, data, PerformanceHistorySchema);
    } else {
      return add(STORES.PERFORMANCE_HISTORY, data, PerformanceHistorySchema);
    }
  },

  calculateTrends: async (days = 7) => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const history = await performanceHistoryAPI.getByPeriod(startDateStr, endDate);
    
    if (history.length < 2) return null;
    
    // Calculate trends
    const recent = history.slice(-3);
    const older = history.slice(0, 3);
    
    const avgRecent = recent.reduce((sum, h) => sum + h.volume, 0) / recent.length;
    const avgOlder = older.reduce((sum, h) => sum + h.volume, 0) / older.length;
    
    const volumeTrend = avgOlder > 0 ? ((avgRecent - avgOlder) / avgOlder) * 100 : 0;
    
    return {
      volumeTrend: Math.round(volumeTrend),
      avgVolume: Math.round(avgRecent),
      totalSessions: history.length
    };
  }
};

// ============================================================================
// AI RECOMMENDATIONS API (Today Performance Refonte)
// ============================================================================

export const recommendationsAPI = {
  get: async () => {
    // Get current recommendations from settings
    const stored = await getById(STORES.SETTINGS, 'ai_recommendations');
    
    if (stored && stored.recommendations) {
      return stored.recommendations;
    }
    
    // Return default recommendations
    return [
      {
        id: 'rec_1',
        icon: '🏋️',
        title: 'Boost Tractions',
        description: 'Ajouter 2 séries de tractions demain pour compenser la baisse',
        category: 'Optimisation',
        priority: 'high',
        priorityText: 'PRIORITÉ HAUTE',
        impact: '+15% force dos',
        impactClass: 'high-impact'
      },
      {
        id: 'rec_2',
        icon: '⏱️',
        title: 'Optimisation Repos',
        description: 'Réduire temps de repos de 5-10s pour maintenir l\'intensité',
        category: 'Technique',
        priority: 'medium',
        priorityText: 'RECOMMANDÉ',
        impact: '+8% efficacité',
        impactClass: 'medium-impact'
      },
      {
        id: 'rec_3',
        icon: '💥',
        title: 'Focus Explosivité',
        description: 'Intégrer des mouvements explosifs pour améliorer la puissance',
        category: 'Progression',
        priority: 'medium',
        priorityText: 'SUGGÉRÉ',
        impact: '+12% puissance',
        impactClass: 'medium-impact'
      },
      {
        id: 'rec_4',
        icon: '🔥',
        title: 'Progression Dips',
        description: 'Excellent +20% sur dips, ajouter du poids pour continuer',
        category: 'Évolution',
        priority: 'low',
        priorityText: 'OPTIONNEL',
        impact: '+5% force triceps',
        impactClass: 'low-impact'
      },
      {
        id: 'rec_5',
        icon: '🧘',
        title: 'Récupération Active',
        description: 'Augmenter étirements à 15min pour optimiser la récupération',
        category: 'Bien-être',
        priority: 'medium',
        priorityText: 'RECOMMANDÉ',
        impact: '+10% récupération',
        impactClass: 'medium-impact'
      }
    ];
  },

  rotate: async (recommendationId) => {
    // Get alternatives pool
    const alternatives = [
      {
        id: 'alt_1',
        icon: '🎵',
        title: 'Contrôle du Tempo',
        description: 'Ralentir la phase négative pour maximiser l\'hypertrophie',
        category: 'Technique',
        priority: 'medium',
        priorityText: 'TECHNIQUE',
        impact: '+18% croissance',
        impactClass: 'medium-impact'
      },
      {
        id: 'alt_2',
        icon: '⚡',
        title: 'Pré-Fatigue',
        description: 'Commencer par isolation avant les exercices composés',
        category: 'Méthode',
        priority: 'high',
        priorityText: 'INTENSITÉ',
        impact: '+22% activation',
        impactClass: 'high-impact'
      },
      {
        id: 'alt_3',
        icon: '⚖️',
        title: 'Travail Unilatéral',
        description: 'Intégrer plus d\'exercices à un bras/jambe pour équilibrer',
        category: 'Équilibre',
        priority: 'medium',
        priorityText: 'ÉQUILIBRE',
        impact: '+14% symétrie',
        impactClass: 'medium-impact'
      }
    ];
    
    // Get current recommendations
    const current = await recommendationsAPI.get();
    
    // Find index of recommendation to replace
    const index = current.findIndex(r => r.id === recommendationId);
    
    if (index !== -1) {
      // Pick random alternative
      const randomAlt = alternatives[Math.floor(Math.random() * alternatives.length)];
      current[index] = randomAlt;
      
      // Save updated recommendations
      await update(STORES.SETTINGS, {
        key: 'ai_recommendations',
        recommendations: current,
        updatedAt: Date.now()
      });
    }
    
    return current;
  }
};

// ============================================================================
// INITIALIZATION
// ============================================================================

export const initDashboard = async () => {
  try {
    await initDB();
    
    // Initialize with mock data if empty
    const quests = await questsAPI.getToday();
    if (quests.length === 0) {
      await questsAPI.add({ name: 'Séance de sport', icon: '💪', xp: 50, priority: 'high' });
      await questsAPI.add({ name: 'Session de lecture', icon: '📚', xp: 30, priority: 'high' });
      await questsAPI.add({ name: 'Apprentissage', icon: '🎓', xp: 40, priority: 'medium' });
    }

    return true;
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    throw error;
  }
};

export default {
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
  // New APIs for Today Performance refonte
  muscleGroupsAPI,
  missionsAPI,
  performanceHistoryAPI,
  recommendationsAPI,
  initDashboard
};
