/**
 * TimelineView Component
 * Timeline verticale avec jalons et dates
 */

const TimelineView = ({ items, onItemClick, onItemComplete }) => {
  const getDaysRemaining = (dateStr) => {
    const target = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getUrgencyColor = (days) => {
    if (days < 0) return 'text-red-400 border-red-500';
    if (days <= 3) return 'text-orange-400 border-orange-500';
    if (days <= 7) return 'text-yellow-400 border-yellow-500';
    return 'text-blue-400 border-blue-500';
  };

  const getTypeIcon = (type) => {
    const icons = {
      finance: '💰',
      admin: '📋',
      health: '🏥',
      work: '💼',
      personal: '👤',
      default: '📌'
    };
    return icons[type] || icons.default;
  };

  return (
    <div className="space-y-3">
      {items && items.length > 0 ? (
        items.map((item, index) => {
          const daysRemaining = getDaysRemaining(item.date);
          const urgencyColor = getUrgencyColor(daysRemaining);
          const isOverdue = daysRemaining < 0;
          const isCompleted = item.completed;

          return (
            <div
              key={item.id || index}
              className={`relative pl-8 pb-4 ${index !== items.length - 1 ? 'border-l-2 border-slate-700' : ''}`}
            >
              {/* Timeline dot */}
              <div className={`absolute left-0 top-0 w-4 h-4 rounded-full border-2 ${urgencyColor} ${
                isCompleted ? 'bg-green-500' : 'bg-slate-900'
              } -translate-x-[9px]`}>
                {isCompleted && (
                  <svg className="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              {/* Content */}
              <div
                className={`p-4 rounded-xl border-2 ${urgencyColor} bg-slate-800/50 hover:bg-slate-800/70 transition-all duration-300 cursor-pointer ${
                  isCompleted ? 'opacity-60' : ''
                }`}
                onClick={() => onItemClick?.(item)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{getTypeIcon(item.type)}</span>
                      <h4 className={`text-sm font-bold ${isCompleted ? 'line-through text-slate-500' : 'text-white'}`}>
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1 text-slate-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{new Date(item.date).toLocaleDateString('fr-FR')}</span>
                      </div>

                      {!isCompleted && (
                        <div className={`font-bold ${urgencyColor}`}>
                          {isOverdue ? (
                            <span>⚠️ En retard de {Math.abs(daysRemaining)} jour{Math.abs(daysRemaining) > 1 ? 's' : ''}</span>
                          ) : (
                            <span>Dans {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-400 mt-2">{item.description}</p>
                    )}
                  </div>

                  {/* Complete button */}
                  {!isCompleted && onItemComplete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemComplete(item.id);
                      }}
                      className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-xs text-green-400 font-semibold transition-colors"
                      aria-label="Marquer comme complété"
                    >
                      ✓ Fait
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-8 text-slate-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>Aucune échéance à venir</p>
        </div>
      )}
    </div>
  );
};

export default TimelineView;
