/**
 * ReadingSessionBlock - Bloc Session de Lecture (PRIORITY-MAX)
 * Enregistrement sessions lecture + analytics 7/30 jours
 */

import { useState } from 'react';
import { BookOpen, Clock, TrendingUp, Save, CheckCircle2, Plus } from 'lucide-react';

const ReadingSessionBlock = ({ books = [], readingStats, onSaveSession, onAddBook }) => {
  const [selectedBookId, setSelectedBookId] = useState(books[0]?.id || '');
  const [duration, setDuration] = useState({ hours: 0, minutes: 0 });
  const [pagesRead, setPagesRead] = useState(0);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [showAddBook, setShowAddBook] = useState(false);

  const selectedBook = books.find(b => b.id === selectedBookId);

  const handleSave = async () => {
    if (!selectedBookId || pagesRead === 0) return;

    const totalMinutes = (duration.hours * 60) + duration.minutes;
    if (totalMinutes === 0) return;

    await onSaveSession({
      bookId: selectedBookId,
      duration: totalMinutes,
      pagesRead: parseInt(pagesRead),
      notes
    });

    // Reset form
    setDuration({ hours: 0, minutes: 0 });
    setPagesRead(0);
    setNotes('');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const calculateTimeToFinish = () => {
    if (!selectedBook || !readingStats?.days7?.avgSpeed) return null;
    const pagesRemaining = selectedBook.totalPages - selectedBook.currentPage;
    const hoursNeeded = pagesRemaining / parseFloat(readingStats.days7.avgSpeed);
    return hoursNeeded.toFixed(1);
  };

  return (
    <div className="reading-session-block bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-xl">
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
          Session de Lecture
        </h3>
        <button
          onClick={() => setShowAddBook(!showAddBook)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all duration-300 hover:scale-105 transform flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau livre
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Form */}
        <div className="space-y-4">
          {/* Book Selector */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Livre actif</label>
            {books.length === 0 ? (
              <div className="p-4 bg-slate-700/30 border border-slate-600/50 rounded-lg text-center text-slate-400 text-sm">
                Aucun livre actif. Ajoutez-en un pour commencer.
              </div>
            ) : (
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                {books.map(book => (
                  <option key={book.id} value={book.id}>
                    {book.title} - {book.author}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selected Book Info */}
          {selectedBook && (
            <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 border border-indigo-500/30 rounded-xl">
              <div className="flex items-start gap-4">
                {selectedBook.coverUrl ? (
                  <img 
                    src={selectedBook.coverUrl} 
                    alt={selectedBook.title}
                    className="w-16 h-24 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-24 bg-slate-700/50 rounded-lg flex items-center justify-center text-3xl">
                    📖
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold text-white mb-1">{selectedBook.title}</div>
                  <div className="text-xs text-slate-400 mb-2">{selectedBook.author}</div>
                  <div className="text-xs text-slate-300">
                    Page {selectedBook.currentPage} / {selectedBook.totalPages}
                  </div>
                  <div className="mt-2 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${(selectedBook.currentPage / selectedBook.totalPages) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-indigo-400 font-semibold">
                    {((selectedBook.currentPage / selectedBook.totalPages) * 100).toFixed(1)}% complété
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Durée de lecture</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  value={duration.hours}
                  onChange={(e) => setDuration(prev => ({ ...prev, hours: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  min="0"
                  placeholder="Heures"
                />
              </div>
              <div>
                <input
                  type="number"
                  value={duration.minutes}
                  onChange={(e) => setDuration(prev => ({ ...prev, minutes: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  min="0"
                  max="59"
                  placeholder="Minutes"
                />
              </div>
            </div>
          </div>

          {/* Pages Read */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Pages lues</label>
            <input
              type="number"
              value={pagesRead}
              onChange={(e) => setPagesRead(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              min="0"
              placeholder="Nombre de pages"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
              rows="3"
              placeholder="Vos impressions..."
            />
          </div>

          {/* Time to Finish */}
          {selectedBook && readingStats?.days7?.avgSpeed && (
            <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="text-slate-400">Temps estimé pour terminer:</span>
                <span className="text-purple-400 font-semibold">{calculateTimeToFinish()}h</span>
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!selectedBookId || pagesRead === 0 || (duration.hours === 0 && duration.minutes === 0) || saved}
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Session enregistrée !
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Enregistrer la session
              </>
            )}
          </button>
        </div>

        {/* RIGHT: Analytics */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <span>📊</span> Analytics
          </h4>

          {/* 7 Days Stats */}
          {readingStats?.days7 && (
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h5 className="text-sm font-semibold text-blue-400">7 Derniers Jours</h5>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Sessions</span>
                  <span className="text-white font-semibold">{readingStats.days7.sessions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Temps total</span>
                  <span className="text-white font-semibold">{Math.floor(readingStats.days7.totalTime / 60)}h {readingStats.days7.totalTime % 60}min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Pages lues</span>
                  <span className="text-white font-semibold">{readingStats.days7.totalPages}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Vitesse moyenne</span>
                  <span className="text-blue-400 font-semibold">{readingStats.days7.avgSpeed} p/h</span>
                </div>
              </div>
            </div>
          )}

          {/* 30 Days Stats */}
          {readingStats?.days30 && (
            <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <h5 className="text-sm font-semibold text-purple-400">30 Derniers Jours</h5>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Sessions</span>
                  <span className="text-white font-semibold">{readingStats.days30.sessions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Temps total</span>
                  <span className="text-white font-semibold">{Math.floor(readingStats.days30.totalTime / 60)}h {readingStats.days30.totalTime % 60}min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Session moyenne</span>
                  <span className="text-white font-semibold">{readingStats.days30.avgSession} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Vitesse moyenne</span>
                  <span className="text-purple-400 font-semibold">{readingStats.days30.avgSpeed} p/h</span>
                </div>
              </div>
            </div>
          )}

          {/* Active Books */}
          <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-green-400" />
              <h5 className="text-sm font-semibold text-green-400">Livres Actifs</h5>
            </div>
            <div className="text-2xl font-bold text-white">{books.length}</div>
            <div className="text-xs text-slate-400 mt-1">
              {books.length === 0 ? 'Ajoutez votre premier livre' : 'En cours de lecture'}
            </div>
          </div>

          {/* Empty state */}
          {!readingStats && (
            <div className="text-center py-8 text-slate-400">
              <div className="text-4xl mb-3">📚</div>
              <div className="text-sm">Enregistrez votre première session</div>
              <div className="text-xs mt-2">Les statistiques apparaîtront ici</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReadingSessionBlock;
