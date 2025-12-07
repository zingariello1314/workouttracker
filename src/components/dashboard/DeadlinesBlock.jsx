/**
 * DeadlinesBlock Component
 * Bloc Échéances à Venir - PRIORITY-LOW (Bloc 27)
 */

import { Calendar, AlertCircle } from 'lucide-react';
import TimelineView from './TimelineView';

const DeadlinesBlock = ({ deadlinesData, onComplete, onItemClick }) => {
  if (!deadlinesData) {
    return (
      <div className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="text-center text-slate-400">Chargement des échéances...</div>
      </div>
    );
  }

  const { deadlines } = deadlinesData;
  const upcomingDeadlines = deadlines.filter(d => !d.completed).sort((a, b) => new Date(a.date) - new Date(b.date));
  const urgentCount = upcomingDeadlines.filter(d => {
    const days = Math.ceil((new Date(d.date) - new Date()) / (1000 * 60 * 60 * 24));
    return days <= 3 && days >= 0;
  }).length;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 border-2 border-indigo-500/50 rounded-2xl p-6 backdrop-blur-sm">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/5 to-transparent pointer-events-none"></div>

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
              <Calendar className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Échéances à Venir</h3>
              <p className="text-sm text-slate-400 mt-1">
                {upcomingDeadlines.length} échéance{upcomingDeadlines.length > 1 ? 's' : ''} à venir
              </p>
            </div>
          </div>

          {/* Urgent badge */}
          {urgentCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 border-2 border-red-500/50 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="text-sm font-bold text-red-400">{urgentCount} urgent{urgentCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          <TimelineView
            items={upcomingDeadlines}
            onItemClick={onItemClick}
            onItemComplete={onComplete}
          />
        </div>

        {/* Summary */}
        {upcomingDeadlines.length > 0 && (
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-700/50">
            <div className="text-center p-3 bg-slate-800/50 rounded-lg">
              <div className="text-2xl font-bold text-white">{upcomingDeadlines.length}</div>
              <div className="text-xs text-slate-400 mt-1">À venir</div>
            </div>
            <div className="text-center p-3 bg-slate-800/50 rounded-lg">
              <div className="text-2xl font-bold text-orange-400">{urgentCount}</div>
              <div className="text-xs text-slate-400 mt-1">Urgentes</div>
            </div>
            <div className="text-center p-3 bg-slate-800/50 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {deadlines.filter(d => d.completed).length}
              </div>
              <div className="text-xs text-slate-400 mt-1">Complétées</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeadlinesBlock;
