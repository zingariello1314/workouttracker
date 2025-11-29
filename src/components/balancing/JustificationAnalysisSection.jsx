import React from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import { Calendar } from 'lucide-react';

const dayNamesShort = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const JustificationAnalysisSection = ({ justificationAnalysis }) => {
  if (!justificationAnalysis || justificationAnalysis.total <= 0) {
    return null;
  }

  const maxWeeklyTotal = justificationAnalysis.weeklyPattern
    ? Math.max(...justificationAnalysis.weeklyPattern.map((d) => d.total), 1)
    : 1;

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          Analyse des Justifications
          <Badge variant="outline" className="text-purple-400 border-purple-400">
            {justificationAnalysis.total} jour
            {justificationAnalysis.total > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Statistiques par raison */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-red-400/10 rounded-lg border border-red-400/30">
            <div className="text-2xl font-bold text-red-400 mb-1">
              {justificationAnalysis.byReason.maladie}
            </div>
            <div className="text-xs text-slate-300">Maladie</div>
          </div>
          <div className="text-center p-3 bg-orange-400/10 rounded-lg border border-orange-400/30">
            <div className="text-2xl font-bold text-orange-400 mb-1">
              {justificationAnalysis.byReason.flemme}
            </div>
            <div className="text-xs text-slate-300">Flemme</div>
          </div>
          <div className="text-center p-3 bg-yellow-400/10 rounded-lg border border-yellow-400/30">
            <div className="text-2xl font-bold text-yellow-400 mb-1">
              {justificationAnalysis.byReason.pas_le_temps}
            </div>
            <div className="text-xs text-slate-300">Pas le temps</div>
          </div>
          <div className="text-center p-3 bg-gray-400/10 rounded-lg border border-gray-400/30">
            <div className="text-2xl font-bold text-gray-400 mb-1">
              {justificationAnalysis.byReason.autre}
            </div>
            <div className="text-xs text-slate-300">Autre</div>
          </div>
        </div>

        {/* Taux de justification */}
        <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300">Taux de justification</span>
            <span className="text-sm font-semibold text-white">
              {justificationAnalysis.justificationRate}%
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${justificationAnalysis.justificationRate}%` }}
            ></div>
          </div>
          {justificationAnalysis.unaccountedDays > 0 && (
            <p className="text-xs text-slate-400 mt-2">
              {justificationAnalysis.unaccountedDays} jour
              {justificationAnalysis.unaccountedDays > 1 ? 's' : ''} sans activité ni justification
            </p>
          )}
        </div>

        {/* Patterns hebdomadaires */}
        {justificationAnalysis.weeklyPattern && (
          <div className="mb-6">
            <h5 className="text-sm font-medium text-white mb-3">Répartition Hebdomadaire</h5>
            <div className="space-y-2">
              {justificationAnalysis.weeklyPattern.map((day, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-10">
                    {dayNamesShort[day.day]}
                  </span>
                  <div className="flex-1 bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${maxWeeklyTotal > 0 ? (day.total / maxWeeklyTotal) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-300 w-8 text-right">{day.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patterns récurrents détectés */}
        {justificationAnalysis.recurringPatterns &&
          (justificationAnalysis.recurringPatterns.weekly?.length > 0 ||
            justificationAnalysis.recurringPatterns.seasonal?.length > 0) && (
            <div className="pt-4 border-t border-slate-600">
              <h5 className="text-sm font-medium text-white mb-3">Patterns Détectés</h5>
              <div className="space-y-2">
                {justificationAnalysis.recurringPatterns.weekly?.map((pattern, index) => (
                  <div
                    key={`weekly-${index}`}
                    className="p-2 bg-blue-400/10 rounded border border-blue-400/30"
                  >
                    <div className="text-xs font-medium text-blue-400">
                      Pattern hebdomadaire : {pattern.dayName}
                    </div>
                    <div className="text-xs text-slate-400">
                      {pattern.total} justification
                      {pattern.total > 1 ? 's' : ''} (confiance:{' '}
                      {Math.round(pattern.confidence * 100)}%)
                    </div>
                  </div>
                ))}
                {justificationAnalysis.recurringPatterns.seasonal?.map((pattern, index) => (
                  <div
                    key={`seasonal-${index}`}
                    className="p-2 bg-purple-400/10 rounded border border-purple-400/30"
                  >
                    <div className="text-xs font-medium text-purple-400">
                      Pattern saisonnier : {pattern.monthName}
                    </div>
                    <div className="text-xs text-slate-400">
                      {pattern.total} justification
                      {pattern.total > 1 ? 's' : ''} (confiance:{' '}
                      {Math.round(pattern.confidence * 100)}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
};

export default JustificationAnalysisSection;


