/**
 * NutritionJournal - Journal Nutritionnel
 * 
 * Composant principal pour la saisie et visualisation des repas journaliers.
 * 
 * Fonctionnalités :
 * - Sélection de date
 * - Affichage totaux journaliers avec conformité
 * - Liste des repas du jour
 * - Saisie rapide de repas
 * - Intégration favoris
 * 
 * @module components/tabs/nutrition/components/NutritionJournal
 */

import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import Button from '../../../ui/Button';
import Input from '../../../ui/Input';
import { Calendar, Plus, Clock } from 'lucide-react';
import { typography } from '../../../../styles/typography';
import DailyTotalsCard from './DailyTotalsCard';
import MealList from './MealList';
import MealEntryForm from './MealEntryForm';

const NutritionJournal = ({ selectedDate, onDateChange, nutritionData, garminData }) => {
  const [dailyMeal, setDailyMeal] = useState(null);
  const [meals, setMeals] = useState([]);
  const [activeProgram, setActiveProgram] = useState(null);
  const [showMealForm, setShowMealForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [loading, setLoading] = useState(true);

  const dateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD

  // Charger données du jour
  useEffect(() => {
    loadDayData();
  }, [dateStr, nutritionData.dbReady]);

  const loadDayData = async () => {
    if (!nutritionData.dbReady) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Charger dailyMeal avec recalcul totaux
      const daily = await nutritionData.getDailyMeal(dateStr, { recalculateTotals: true });
      setDailyMeal(daily);

      // Charger meals du jour
      const dayMeals = await nutritionData.getMealsByDate(dateStr);
      setMeals(dayMeals || []);

      // Charger programme actif
      const program = await nutritionData.getActiveProgram();
      setActiveProgram(program);
    } catch (error) {
      console.error('[NutritionJournal] Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gérer ajout/modification repas
  const handleMealSave = async (mealData) => {
    try {
      const saved = await nutritionData.saveMeal(mealData, true); // updateDailyTotals = true
      if (saved) {
        // Recharger données
        await loadDayData();
        setShowMealForm(false);
        setEditingMeal(null);
      }
    } catch (error) {
      console.error('[NutritionJournal] Erreur sauvegarde repas:', error);
    }
  };

  // Gérer suppression repas
  const handleMealDelete = async (mealId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce repas ?')) {
      return;
    }

    try {
      const deleted = await nutritionData.deleteMeal(mealId);
      if (deleted) {
        await loadDayData();
      }
    } catch (error) {
      console.error('[NutritionJournal] Erreur suppression repas:', error);
    }
  };

  // Ouvrir formulaire pour nouveau repas
  const handleAddMeal = (type = null) => {
    setEditingMeal(null);
    setShowMealForm(true);
  };

  // Ouvrir formulaire pour modifier repas
  const handleEditMeal = (meal) => {
    setEditingMeal(meal);
    setShowMealForm(true);
  };

  // Navigation dates
  const handleDateChange = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    onDateChange(newDate);
  };

  const handleDateSelect = (e) => {
    const newDate = new Date(e.target.value);
    onDateChange(newDate);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-400 mt-4">Chargement des données...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sélection date */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDateChange(-1)}
                className="text-slate-300 hover:text-white"
              >
                ←
              </Button>
              
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-blue-400" />
                <Input
                  type="date"
                  value={dateStr}
                  onChange={handleDateSelect}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <span className="text-slate-300 text-sm">
                  {selectedDate.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDateChange(1)}
                className="text-slate-300 hover:text-white"
              >
                →
              </Button>
            </div>

            <Button
              onClick={() => handleAddMeal()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus size={18} className="mr-2" />
              Ajouter un repas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Totaux journaliers */}
      {dailyMeal && (
        <DailyTotalsCard
          dailyMeal={dailyMeal}
          activeProgram={activeProgram}
          garminData={garminData}
          dateStr={dateStr}
          nutritionData={nutritionData}
        />
      )}

      {/* Liste des repas */}
      <MealList
        meals={meals}
        onEdit={handleEditMeal}
        onDelete={handleMealDelete}
        onAdd={handleAddMeal}
      />

      {/* Formulaire repas (modal) */}
      {showMealForm && (
        <MealEntryForm
          isOpen={showMealForm}
          onClose={() => {
            setShowMealForm(false);
            setEditingMeal(null);
          }}
          meal={editingMeal}
          dateStr={dateStr}
          onSave={handleMealSave}
          nutritionData={nutritionData}
        />
      )}
    </div>
  );
};

export default NutritionJournal;

