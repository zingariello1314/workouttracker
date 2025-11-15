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

import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import Button from '../../../ui/Button';
import Input from '../../../ui/Input';
import Modal from '../../../ui/Modal';
import { Calendar, Plus, Clock, AlertTriangle } from 'lucide-react';
import { typography } from '../../../../styles/typography';
import { DateHelper } from '../../../../utils/dateHelper';
import DailyTotalsCard from './DailyTotalsCard';
import MealList from './MealList';
import MealEntryForm from './MealEntryForm';
import HydrationTracker from './HydrationTracker';

const NutritionJournal = ({ selectedDate, onDateChange, nutritionData, garminData }) => {
  const [dailyMeal, setDailyMeal] = useState(null);
  const [meals, setMeals] = useState([]);
  const [activeProgram, setActiveProgram] = useState(null);
  const [showMealForm, setShowMealForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  // ✅ OPTIMISATION 19 : Modal personnalisée pour confirmation suppression
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mealToDelete, setMealToDelete] = useState(null);

  // ✅ OPTIMISATION 16 : Utiliser DateHelper pour cohérence timezone locale
  const dateStr = DateHelper.toYYYYMMDD(selectedDate) || DateHelper.getTodayLocal();

  // ✅ OPTIMISATION 17-18 : Mémoriser callbacks avec useCallback pour éviter recréation
  const loadDayData = useCallback(async () => {
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
  }, [dateStr, nutritionData.dbReady, nutritionData.getDailyMeal, nutritionData.getMealsByDate, nutritionData.getActiveProgram]);

  // Charger données du jour
  useEffect(() => {
    loadDayData();
  }, [loadDayData]);

  // ✅ OPTIMISATION 17-18 : Mémoriser handleMealSave avec useCallback
  const handleMealSave = useCallback(async (mealData) => {
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
  }, [nutritionData.saveMeal, loadDayData]);

  // ✅ OPTIMISATION 17-18 : Mémoriser handleMealDelete avec useCallback
  // ✅ OPTIMISATION 19 : Ouvrir modal de confirmation au lieu de window.confirm
  const handleMealDeleteClick = useCallback((mealId) => {
    setMealToDelete(mealId);
    setShowDeleteConfirm(true);
  }, []);

  // Confirmer suppression après validation modal
  const handleMealDeleteConfirm = useCallback(async () => {
    if (!mealToDelete) return;

    try {
      const deleted = await nutritionData.deleteMeal(mealToDelete);
      if (deleted) {
        await loadDayData();
      }
    } catch (error) {
      console.error('[NutritionJournal] Erreur suppression repas:', error);
    } finally {
      setShowDeleteConfirm(false);
      setMealToDelete(null);
    }
  }, [nutritionData.deleteMeal, loadDayData, mealToDelete]);

  // Annuler suppression
  const handleMealDeleteCancel = useCallback(() => {
    setShowDeleteConfirm(false);
    setMealToDelete(null);
  }, []);

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

      {/* Suivi Hydratation */}
      <HydrationTracker
        date={dateStr}
        nutritionData={nutritionData}
        onUpdate={loadDayData}
      />

      {/* Liste des repas */}
      <MealList
        meals={meals}
        onEdit={handleEditMeal}
        onDelete={handleMealDeleteClick}
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

      {/* ✅ OPTIMISATION 19 : Modal de confirmation suppression */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={handleMealDeleteCancel}
        title="Confirmer la suppression"
        size="sm"
        showCloseButton={true}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="text-yellow-500" size={24} />
            </div>
            <div className="flex-1">
              <p className="text-slate-200 mb-2">
                Êtes-vous sûr de vouloir supprimer ce repas ?
              </p>
              <p className="text-sm text-slate-400">
                Cette action est irréversible.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
            <Button
              variant="ghost"
              onClick={handleMealDeleteCancel}
              className="px-4 py-2"
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleMealDeleteConfirm}
              className="px-4 py-2"
            >
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NutritionJournal;

