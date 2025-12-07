/**
 * MainBookProgressBlock - Bloc Progression Livre Principal (PRIORITY-HIGH)
 * Suivi progression livre actuel avec graphique 7 jours
 */

import { BookOpen, Upload, TrendingUp, Clock, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
import ProgressBar from './ProgressBar';

const MainBookProgressBlock = ({ books = [], readingStats }) => {
  const [selectedBook, setSelectedBook] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  useEffect(() => {
    if (books.length > 0 && !selectedBook) {
      setSelectedBook(books[0]);
    }
  }, [books]);

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
        // Save to localStorage
        localStorage.setItem(`book_cover_${selectedBook.id}`, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!selectedBook) {
    return (
      <div className="main-book-progress-block bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
        <div className="text-center py-8 text-slate-400">
          <div className="text-4xl mb-3">📖</div>
          <div>Aucun livre actif</div>
          <div className="text-xs mt-2">Ajoutez un livre pour commencer</div>
        </div>
      </div>
    );
  }

  const progress = (selectedBook.currentPage / selectedBook.totalPages) * 100;
  const pagesRemaining = selectedBook.totalPages - selectedBook.currentPage;
  
  // Calculate milestones
  const milestones = [25, 50, 75, 90, 100];
  const currentMilestone = milestones.find(m => progress < m) || 100;
  const nextMilestonePages = Math.ceil((currentMilestone / 100) * selectedBook.totalPages) - selectedBook.currentPage;

  // Estimate time to finish
  const avgSpeed = readingStats?.days7?.avgSpeed || 30; // pages/hour
  const hoursToFinish = pagesRemaining / avgSpeed;

  // Mock 7-day progress data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
      pages: Math.floor(Math.random() * 30) + 10
    };
  });

  return (
    <div className="main-book-progress-block bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-xl">
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
          Livre Principal
        </h3>
        {progress >= 100 && (
          <div className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-lg text-xs text-yellow-400 font-semibold animate-pulse">
            🎉 TERMINÉ !
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Book Info */}
        <div>
          {/* Cover */}
          <div className="mb-4">
            <div className="relative group">
              {coverPreview || selectedBook.coverUrl ? (
                <img
                  src={coverPreview || selectedBook.coverUrl}
                  alt={selectedBook.title}
                  className="w-full h-64 object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-2 border-dashed border-indigo-500/50 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-2">📖</div>
                    <div className="text-sm text-slate-400">Aucune couverture</div>
                  </div>
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer rounded-xl">
                <div className="text-center">
                  <Upload className="w-8 h-8 text-white mx-auto mb-2" />
                  <div className="text-sm text-white font-semibold">Changer la couverture</div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Book Details */}
          <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 border border-indigo-500/30 rounded-xl">
            <div className="font-bold text-white text-lg mb-1">{selectedBook.title}</div>
            <div className="text-sm text-slate-400 mb-3">{selectedBook.author}</div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Page {selectedBook.currentPage} / {selectedBook.totalPages}</span>
              <span className="text-indigo-400 font-bold">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Progress & Stats */}
        <div className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="text-sm font-semibold text-slate-300 mb-3">Progression</div>
            <ProgressBar
              value={progress}
              max={100}
              height="h-6"
              color="from-indigo-500 to-purple-500"
              showPercentage={true}
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-400" />
                <div className="text-xs text-slate-400">Temps estimé</div>
              </div>
              <div className="text-xl font-bold text-white">
                {hoursToFinish.toFixed(1)}h
              </div>
              <div className="text-xs text-blue-400 mt-1">Pour terminer</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <div className="text-xs text-slate-400">Pages restantes</div>
              </div>
              <div className="text-xl font-bold text-white">
                {pagesRemaining}
              </div>
              <div className="text-xs text-purple-400 mt-1">À lire</div>
            </div>
          </div>

          {/* Next Milestone */}
          <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-yellow-400" />
              <div className="text-sm font-semibold text-white">Prochain Jalon</div>
            </div>
            <div className="text-lg font-bold text-yellow-400 mb-1">{currentMilestone}%</div>
            <div className="text-xs text-slate-400">
              Plus que {nextMilestonePages} pages à lire
            </div>
          </div>

          {/* 7-Day Chart */}
          <div className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl">
            <div className="text-sm font-semibold text-slate-300 mb-3">7 Derniers Jours</div>
            <div className="flex items-end justify-between gap-2 h-24">
              {last7Days.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t transition-all duration-300 hover:from-indigo-400 hover:to-purple-400"
                    style={{ height: `${(day.pages / 40) * 100}%` }}
                  />
                  <div className="text-xs text-slate-500 mt-2">{day.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Book Selector */}
          {books.length > 1 && (
            <div>
              <label className="block text-sm text-slate-400 mb-2">Changer de livre</label>
              <select
                value={selectedBook.id}
                onChange={(e) => setSelectedBook(books.find(b => b.id === e.target.value))}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm"
              >
                {books.map(book => (
                  <option key={book.id} value={book.id}>
                    {book.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainBookProgressBlock;
