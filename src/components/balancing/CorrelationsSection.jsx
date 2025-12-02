import React from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Activity, Link as LinkIcon, BarChart3 } from 'lucide-react';

const CorrelationsSection = ({
  garminCorrelations,
  nutritionCorrelations,
  bodyTrackingCorrelations,
  multiSourceCorrelations,
}) => {
  const hasAny =
    garminCorrelations ||
    nutritionCorrelations ||
    bodyTrackingCorrelations ||
    (multiSourceCorrelations &&
      (multiSourceCorrelations.riskPatterns.length > 0 ||
        multiSourceCorrelations.favorablePatterns.length > 0));

  if (!hasAny) return null;

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-cyan-400" />
          Corrélations Multi-Sources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Garmin ↔ Entraînement */}
        {garminCorrelations && (
          <div className="p-4 bg-slate-800/50 rounded-lg border border-cyan-400/40">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h5 className="text-sm font-medium text-white">
                Garmin ↔ Entraînement
              </h5>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
              {garminCorrelations.bodyBatteryWorkout.correlation !== null && (
                <div className="p-2 bg-cyan-400/10 rounded border border-cyan-400/30">
                  <div className="font-medium text-cyan-300">
                    Body Battery ↔ Performance
                  </div>
                  <div>
                    Corrélation:{' '}
                    {Math.round(
                      garminCorrelations.bodyBatteryWorkout.correlation * 100,
                    )}
                    %
                  </div>
                </div>
              )}
              {garminCorrelations.recoveryWorkout.intensityDifference !==
                null && (
                <div className="p-2 bg-green-400/10 rounded border border-green-400/30">
                  <div className="font-medium text-green-300">
                    Récupération ↔ Performance
                  </div>
                  <div>
                    Différence:{' '}
                    {Math.round(
                      garminCorrelations.recoveryWorkout.intensityDifference,
                    )}
                    %
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nutrition ↔ Entraînement */}
        {nutritionCorrelations && (
          <div className="p-4 bg-slate-800/50 rounded-lg border border-orange-400/40">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-orange-400" />
              <h5 className="text-sm font-medium text-white">
                Nutrition ↔ Entraînement
              </h5>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
              {nutritionCorrelations.caloriesWorkout?.correlation !== null && (
                <div className="p-2 bg-orange-400/10 rounded border border-orange-400/30">
                  <div className="font-medium text-orange-300">
                    Calories ↔ Performance
                  </div>
                  <div>
                    Corrélation:{' '}
                    {Math.round(
                      nutritionCorrelations.caloriesWorkout.correlation * 100,
                    )}
                    %
                  </div>
                </div>
              )}
              {nutritionCorrelations.proteinWorkout?.correlation !== null && (
                <div className="p-2 bg-red-400/10 rounded border border-red-400/30">
                  <div className="font-medium text-red-300">
                    Protéines ↔ Performance
                  </div>
                  <div>
                    Corrélation:{' '}
                    {Math.round(
                      nutritionCorrelations.proteinWorkout.correlation * 100,
                    )}
                    %
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Body Tracking ↔ Entraînement */}
        {bodyTrackingCorrelations && (
          <div className="p-4 bg-slate-800/50 rounded-lg border border-pink-400/40">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-pink-400" />
              <h5 className="text-sm font-medium text-white">
                Body Tracking ↔ Entraînement
              </h5>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
              {bodyTrackingCorrelations.weightWorkout?.correlation !==
                null && (
                <div className="p-2 bg-pink-400/10 rounded border border-pink-400/30">
                  <div className="font-medium text-pink-300">
                    Poids ↔ Performance
                  </div>
                  <div>
                    Corrélation:{' '}
                    {Math.round(
                      bodyTrackingCorrelations.weightWorkout.correlation * 100,
                    )}
                    %
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Patterns multi-sources */}
        {multiSourceCorrelations &&
          (multiSourceCorrelations.riskPatterns.length > 0 ||
            multiSourceCorrelations.favorablePatterns.length > 0) && (
            <div className="p-4 bg-slate-800/50 rounded-lg border border-purple-400/40">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <h5 className="text-sm font-medium text-white">
                  Patterns Croisés Multi-Sources
                </h5>
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                {multiSourceCorrelations.riskPatterns.map((pattern) => (
                  <div
                    key={`risk-${pattern.id}`}
                    className="p-2 bg-red-400/10 rounded border border-red-400/30"
                  >
                    <div className="font-medium text-red-300">
                      {pattern.label}
                    </div>
                    <div>{pattern.description}</div>
                  </div>
                ))}
                {multiSourceCorrelations.favorablePatterns.map((pattern) => (
                  <div
                    key={`fav-${pattern.id}`}
                    className="p-2 bg-green-400/10 rounded border border-green-400/30"
                  >
                    <div className="font-medium text-green-300">
                      {pattern.label}
                    </div>
                    <div>{pattern.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
};

export default CorrelationsSection;





