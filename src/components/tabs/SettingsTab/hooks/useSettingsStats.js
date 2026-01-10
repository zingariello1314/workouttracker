/**
 * Hook useSettingsStats - Statistiques pour SettingsTab
 * 
 * ✅ PHASE 4 : Extraction de la logique de chargement des statistiques
 * 
 * Charge les statistiques pour QuietQuest, Books et Apprentissage
 * 
 * @module components/tabs/SettingsTab/hooks/useSettingsStats
 */

import { useState, useEffect } from 'react';
import { 
  openQuietQuestDB, 
  loadQuestsFromIndexedDB, 
  loadValidationsFromIndexedDB, 
  loadUserDataFromIndexedDB 
} from '../../../../utils/quietQuestIndexedDB';
import { 
  STORAGE_KEYS, 
  loadFromStorage, 
  defaultUserData 
} from '../../../../hooks/useQuietQuestEngine';
import { 
  getAllBooksFromIndexedDB, 
  saveBooksToIndexedDB 
} from '../../../../utils/booksIndexedDB';
import { 
  loadBooks as loadBooksFromLocalStorage, 
  saveBooks as saveBooksToLocalStorage 
} from '../../../../utils/booksStorage';
import { 
  prepareApprentissageExportData 
} from '../../../../utils/apprentissageExportImport';

/**
 * Hook pour charger les statistiques des différents modules
 * 
 * @returns {Object} { quietQuestStats, booksStats, apprentissageStats }
 */
export const useSettingsStats = () => {
  const [quietQuestStats, setQuietQuestStats] = useState({
    questsCount: 0,
    validationsCount: 0,
    userLevel: 1,
  });
  
  const [booksStats, setBooksStats] = useState({
    totalBooks: 0,
    totalSessions: 0,
    inProgress: 0,
    completed: 0,
  });
  
  const [apprentissageStats, setApprentissageStats] = useState({
    subjectsCount: 0,
    sessionsCount: 0,
    globalLevel: 1,
    globalXP: 0,
    totalStudyTime: 0,
  });

  useEffect(() => {
    const loadQuietQuestStats = async () => {
      try {
        const db = await openQuietQuestDB();
        if (db) {
          const quests = await loadQuestsFromIndexedDB(db, 'main');
          const validations = await loadValidationsFromIndexedDB(db, 'main');
          const userData = await loadUserDataFromIndexedDB(db, 'main');
          setQuietQuestStats({
            questsCount: quests.length,
            validationsCount: validations.length,
            userLevel: userData?.level || 1,
          });
        } else {
          // Fallback localStorage
          const quests = loadFromStorage(STORAGE_KEYS.quests, []);
          const validations = loadFromStorage(STORAGE_KEYS.validations, []);
          const userData = loadFromStorage(STORAGE_KEYS.userData, defaultUserData);
          setQuietQuestStats({
            questsCount: quests.length,
            validationsCount: validations.length,
            userLevel: userData?.level || 1,
          });
        }
      } catch (error) {
        console.error('[SettingsTab] Erreur chargement stats QuietQuest:', error);
      }
    };

    const loadBooksStats = async () => {
      try {
        let books = [];
        try {
          const indexedBooks = await getAllBooksFromIndexedDB();
          if (Array.isArray(indexedBooks) && indexedBooks.length > 0) {
            books = indexedBooks;
          } else {
            books = loadBooksFromLocalStorage();
          }
        } catch {
          books = loadBooksFromLocalStorage();
        }

        const totalSessions = books.reduce((sum, book) => sum + (book.sessions?.length || 0), 0);
        const inProgress = books.filter(b => b.status === 'in-progress').length;
        const completed = books.filter(b => b.status === 'completed').length;

        setBooksStats({
          totalBooks: books.length,
          totalSessions,
          inProgress,
          completed,
        });
      } catch (error) {
        console.error('[SettingsTab] Erreur chargement stats Livres:', error);
      }
    };

    const loadApprentissageStats = async () => {
      try {
        const exportData = await prepareApprentissageExportData('main');
        setApprentissageStats({
          subjectsCount: exportData.subjects?.length || 0,
          sessionsCount: exportData.sessionsHistory?.length || 0,
          globalLevel: exportData.progression?.globalLevel || 1,
          globalXP: exportData.progression?.globalXP || 0,
          totalStudyTime: exportData.progression?.totalStudyTime || 0,
        });
      } catch (error) {
        console.error('[SettingsTab] Erreur chargement stats Apprentissage:', error);
      }
    };

    loadQuietQuestStats();
    loadBooksStats();
    loadApprentissageStats();
  }, []);

  return {
    quietQuestStats,
    booksStats,
    apprentissageStats,
  };
};

export default useSettingsStats;
