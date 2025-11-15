/**
 * DailyTotalsCard - Carte Totaux Journaliers
 * 
 * Affiche les totaux nutritionnels du jour avec :
 * - Calories, macros (protéines, glucides, lipides)
 * - Pourcentages de distribution
 * - Conformité vs programme actif
 * - Bilan calorique (avec Garmin)
 * 
 * @module components/tabs/nutrition/components/DailyTotalsCard
 */

import React from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { Target, TrendingUp, TrendingDown, Minus, Droplet } from 'lucide-react';
import { typography } from '../../../../styles/typography';
import { Badge } from '../../../ui/Badge';
import ProgressBar from '../../../ui/ProgressBar';
import ComplianceDisplay from './ComplianceDisplay';

const DailyTotalsCard = ({ dailyMeal, activeProgram, garminData, dateStr, nutritionData }) => {
  if (!dailyMeal || !dailyMeal.dailyTotals) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6 text-center text-slate-400">
          Aucune donnée pour ce jour
        </CardContent>
      </Card>
    );
  }

  const totals = dailyMeal.dailyTotals;
  const hasProgram = activeProgram !== null;

  // Calculer bilan calorique (avec Garmin si disponible)
  const balance = nutritionData.calculateCaloricBalance(
    totals.calories,
    garminData,
    dateStr
  );

  // ✅ OPTIMISATION 20 : Helpers extraits en composants réutilisables
  // - ProgressBar : Composant UI générique (src/components/ui/ProgressBar.jsx)
  // - ComplianceDisplay : Composant spécifique nutrition (src/components/tabs/nutrition/components/ComplianceDisplay.jsx)

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target size={24} className="text-blue-400" />
          Totaux du jour
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score de conformité */}
        {hasProgram && (
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 font-medium">Score de conformité</span>
              <Badge
                className={`${
                  totals.complianceScore >= 80
                    ? 'bg-green-500/20 text-green-400'
                    : totals.complianceScore >= 60
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {totals.complianceScore}%
              </Badge>
            </div>
            <ProgressBar
              value={totals.complianceScore}
              max={100}
              color={
                totals.complianceScore >= 80
                  ? 'green'
                  : totals.complianceScore >= 60
                  ? 'orange'
                  : 'red'
              }
            />
          </div>
        )}

        {/* Calories */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">Calories</span>
            <ComplianceDisplay 
              actual={totals.calories} 
              target={totals.targetCalories} 
              unit="kcal" 
              showTarget={hasProgram}
            />
          </div>
          {hasProgram && (
            <ProgressBar
              value={totals.calories}
              max={totals.targetCalories}
              color={
                totals.calories > totals.targetCalories * 1.2
                  ? 'red'
                  : totals.calories > totals.targetCalories
                  ? 'orange'
                  : totals.calories < totals.targetCalories * 0.8
                  ? 'red'
                  : 'green'
              }
            />
          )}
        </div>

        {/* Macros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Protéines */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Protéines</span>
              <span className="text-blue-400 font-semibold">
                {totals.proteinPercent}%
              </span>
            </div>
            <ComplianceDisplay 
              actual={totals.protein} 
              target={totals.targetProtein} 
              unit="g" 
              showTarget={hasProgram}
            />
          </div>

          {/* Glucides */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Glucides</span>
              <span className="text-green-400 font-semibold">
                {totals.carbsPercent}%
              </span>
            </div>
            <ComplianceDisplay 
              actual={totals.carbs} 
              target={totals.targetCarbs} 
              unit="g" 
              showTarget={hasProgram}
            />
          </div>

          {/* Lipides */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Lipides</span>
              <span className="text-orange-400 font-semibold">
                {totals.fatPercent}%
              </span>
            </div>
            <ComplianceDisplay 
              actual={totals.fat} 
              target={totals.targetFat} 
              unit="g" 
              showTarget={hasProgram}
            />
          </div>
        </div>

        {/* Bilan calorique */}
        {garminData && (
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 font-medium">Bilan calorique</span>
              <div className="flex items-center gap-2">
                {balance.classification === 'surplus' && (
                  <TrendingUp size={18} className="text-orange-400" />
                )}
                {balance.classification === 'deficit' && (
                  <TrendingDown size={18} className="text-blue-400" />
                )}
                {balance.classification === 'maintien' && (
                  <Minus size={18} className="text-green-400" />
                )}
                <span className={`font-semibold ${
                  balance.classification === 'surplus'
                    ? 'text-orange-400'
                    : balance.classification === 'deficit'
                    ? 'text-blue-400'
                    : 'text-green-400'
                }`}>
                  {balance.balance > 0 ? '+' : ''}{balance.balance.toLocaleString('fr-FR')} kcal
                </span>
              </div>
            </div>
            <div className="text-sm text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Consommé :</span>
                <span className="text-white">{balance.consumed.toLocaleString('fr-FR')} kcal</span>
              </div>
              <div className="flex justify-between">
                <span>Dépensé (Garmin) :</span>
                <span className="text-white">{balance.burned.toLocaleString('fr-FR')} kcal</span>
              </div>
            </div>
          </div>
        )}

        {/* Eau - Toujours afficher (même si 0) */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Droplet size={18} className="text-blue-400" />
              <span className="text-slate-300 font-medium">Hydratation</span>
            </div>
            <span className="text-white font-semibold">
              {totals.waterIntake || 0} ml / {totals.targetWater || 2000} ml
            </span>
          </div>
          <ProgressBar
            value={totals.waterIntake || 0}
            max={totals.targetWater || 2000}
            color="blue"
          />
          {(!totals.waterIntake || totals.waterIntake === 0) && (
            <p className="text-xs text-slate-400 mt-2 text-center">
              Utilisez le suivi d'hydratation ci-dessous pour ajouter de l'eau
            </p>
          )}
        </div>

        {/* Message si pas de programme */}
        {!hasProgram && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
            <p className="text-blue-400 text-sm">
              💡 Créez un programme nutritionnel pour suivre votre conformité
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyTotalsCard;

