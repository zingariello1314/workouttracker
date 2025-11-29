import React from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { TrendingUp, Clock } from 'lucide-react';

const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const TemporalAnalysisSection = ({ programAnalysis, justificationAnalysis }) => {
  if (!programAnalysis && !justificationAnalysis) return null;

  const bestDays = programAnalysis?.patterns?.bestDays || [];
  const bestHours = programAnalysis?.patterns?.bestHours || [];

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Analyse Temporelle
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Jours d'entraînement les plus réguliers */}
        {bestDays.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-white mb-2">
              Jours les plus réguliers
            </h5>
            <div className="flex flex-wrap gap-2 text-xs">
              {bestDays.map((entry, idx) => {
                const dayIndex =
                  typeof entry === 'number'
                    ? entry
                    : typeof entry?.day === 'number'
                    ? entry.day
                    : idx;
                return (
                  <span
                    key={`best-day-${idx}`}
                    className="px-2 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/40 text-emerald-300"
                  >
                    {dayNames[dayIndex]}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Heures favorables */}
        {bestHours.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-white mb-2 flex items-center gap-1">
              <Clock className="w-4 h-4 text-sky-400" />
              Créneaux horaires les plus favorables
            </h5>
            <div className="flex flex-wrap gap-2 text-xs">
              {bestHours.map((slot, idx) => (
                <span
                  key={`best-hour-${idx}-${slot.label || `${slot.start}-${slot.end}`}`}
                  className="px-2 py-1 rounded-full bg-sky-400/10 border border-sky-400/40 text-sky-300"
                >
                  {slot.label || `${slot.start}–${slot.end}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Synthèse justifications dans le temps */}
        {justificationAnalysis && justificationAnalysis.monthlyPattern && (
          <div>
            <h5 className="text-sm font-medium text-white mb-2">
              Justifications sur les derniers mois
            </h5>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1 text-xs">
              {Object.entries(justificationAnalysis.monthlyPattern)
                .slice(-6)
                .map(([monthKey, stats]) => (
                  <div
                    key={monthKey}
                    className="flex items-center justify-between px-2 py-1 rounded bg-slate-800/60"
                  >
                    <span className="text-slate-300">{monthKey}</span>
                    <span className="text-slate-400">
                      {stats.total} justification
                      {stats.total > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TemporalAnalysisSection;


