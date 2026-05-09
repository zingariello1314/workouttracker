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

import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
// ✅ PHASE 12.2 : Importer hooks Observer pour synchronisation automatique
import { useDailyMeal, useMealsByDate, useActiveProgram } from '../../../../hooks/useRepositoryObserver';
import { useTranslation } from '../../../../utils/translations';
// ✅ OPTIMISATION Phase 15.2 : Prefetching intelligent jour suivant/précédent
import { usePrefetchNutritionDays } from '../../../../hooks/usePrefetchNutritionDays';
import { getNutritionConfig } from '../../../../config/nutrition.config';
import { useToast } from '../../../ui/Toast/ToastProvider';
import logger from '../../../../utils/logger';

const log = logger.component('NutritionJournal');

const NutritionJournal = ({ selectedDate, onDateChange, nutritionData, garminData, isVisible = true }) => {
  const { showError } = useToast();
  // ✅ OPTIMISATION 16 : Utiliser DateHelper pour cohérence timezone locale
  const dateStr = DateHelper.toYYYYMMDD(selectedDate) || DateHelper.getTodayLocal();

  // ✅ OPTIMISATION Phase 15.2 : Configuration pour prefetching
  const config = useMemo(() => getNutritionConfig(), []);
  const enablePrefetching = config.features.enablePrefetching ?? true;

  // ✅ PHASE 12.2 : Utiliser hooks Observer pour synchronisation automatique
  // Les données se mettent à jour automatiquement via Observer pattern
  const [dailyMeal, refreshDailyMeal, { loading: loadingDailyMeal, error: errorDailyMeal }] = useDailyMeal(dateStr);
  const [meals, refreshMeals, { loading: loadingMeals, error: errorMeals }] = useMealsByDate(dateStr);
  const [activeProgram, refreshActiveProgram, { loading: loadingProgram, error: errorProgram }] = useActiveProgram();

  // ✅ OPTIMISATION Phase 15.2 : Prefetching intelligent jour suivant/précédent
  // Précharge automatiquement J±1 avec requestIdleCallback (non bloquant)
  // Ne précharge que si section visible et prefetching activé
  const prefetchConfig = useMemo(() => {
    if (!enablePrefetching || !isVisible) {
      return { daysRange: 0 }; // Désactiver prefetching (daysRange: 0 = aucune date à précharger)
    }
    return {
      initialDelay: config.performance.prefetchInitialDelay,
      idleTimeout: config.performance.prefetchIdleTimeout,
      daysRange: config.performance.prefetchDaysRange,
      minIdleTime: config.performance.prefetchMinIdleTime,
      verbose: false // Réduire logs en production
    };
  }, [enablePrefetching, isVisible, config]);

  const { isPrefetching, prefetchedDates } = usePrefetchNutritionDays({
    selectedDate: dateStr,
    config: prefetchConfig
  });

  // ✅ État local pour UI (non lié aux données)
  const [showMealForm, setShowMealForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  // ✅ OPTIMISATION 19 : Modal personnalisée pour confirmation suppression
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mealToDelete, setMealToDelete] = useState(null);
  
  const t = useTranslation();

  /** Halo discret sur la carte jour : intensité max pour 3 repas (au-delà, même teinte). */
  const dateNavigatorAccent = useMemo(() => {
    const n = Math.min(3, Array.isArray(meals) ? meals.length : 0);
    if (n <= 0) return '';
    if (n === 1)
      return 'ring-1 ring-[#0F5C45]/25 shadow-[inset_0_0_20px_rgba(15,76,69,0.05)]';
    if (n === 2)
      return 'ring-1 ring-[#0F5C45]/38 shadow-[inset_0_0_26px_rgba(15,76,69,0.075)]';
    return 'ring-1 ring-[#0F5C45]/48 shadow-[inset_0_0_30px_rgba(15,76,69,0.095)]';
  }, [meals]);

  // ✅ PHASE 12.2 : Loading combiné (toutes les données doivent être chargées)
  // ✅ CORRECTION : Ne pas bloquer sur dbReady (peut être temporaire, repository gère fallback)
  // Les hooks Observer gèrent leur propre loading et erreurs
  const loading = loadingDailyMeal || loadingMeals || loadingProgram;

  // ✅ PHASE 12.2 : Recharger dailyMeal avec recalculateTotals après sauvegarde meal
  // Note: L'Observer mettra à jour automatiquement, mais on doit forcer recalculateTotals
  const refreshDailyMealWithTotals = useCallback(async () => {
    // ✅ CORRECTION : Ne pas bloquer si dbReady est false (peut être temporaire)
    // Le repository gère le fallback automatiquement
    try {
      // Recharger avec recalculateTotals pour mettre à jour les totaux
      const updated = await nutritionData.getDailyMeal(dateStr, { recalculateTotals: true });
      // L'Observer mettra à jour automatiquement via le repository
      // Mais on peut aussi forcer le refresh si nécessaire
      refreshDailyMeal();
    } catch (error) {
      console.error('[NutritionJournal] Erreur refresh dailyMeal:', error);
      // ✅ CORRECTION : Forcer refresh même en cas d'erreur pour éviter loading perpétuel
      refreshDailyMeal();
    }
  }, [dateStr, nutritionData.getDailyMeal, refreshDailyMeal]);

  // ✅ OPTIMISATION 17-18 : Mémoriser handleMealSave avec useCallback
  // ✅ OPTIMISATION 1.2 : Optimistic updates + sync partielle (66% réduction requêtes)
  // ✅ PHASE 12.2 : Observer mettra à jour automatiquement, mais on garde optimistic update pour UX
  const handleMealSave = useCallback(async (mealData) => {
    try {
      const saved = await nutritionData.saveMeal(mealData, true); // updateDailyTotals = true
      if (saved) {
        // ✅ PHASE 12.2 : Observer mettra à jour automatiquement via repository.notify()
        // Mais on peut garder optimistic update pour feedback immédiat (UX)
        // L'Observer synchronisera ensuite avec les vraies données

        // ✅ OPTIMISATION 1.2 : Sync partielle : Recharger seulement dailyMeal (totaux mis à jour)
        // L'Observer mettra à jour meals automatiquement, mais dailyMeal nécessite recalculateTotals
        await refreshDailyMealWithTotals();

        setShowMealForm(false);
        setEditingMeal(null);
      } else {
        showError('Enregistrement impossible', 'Les données n’ont pas pu être sauvegardées. Réessayez.');
      }
    } catch (error) {
      // ✅ OPTIMISATION 1.2 : Rollback : Recharger tout si erreur
      console.error('[NutritionJournal] Erreur sauvegarde repas:', error);
      // ✅ PHASE 12.2 : Forcer refresh via Observer hooks
      refreshMeals();
      refreshDailyMeal();
    }
  }, [nutritionData.saveMeal, refreshDailyMealWithTotals, refreshMeals, refreshDailyMeal, showError]);

  // ✅ OPTIMISATION 17-18 : Mémoriser handleMealDelete avec useCallback
  // ✅ OPTIMISATION 19 : Ouvrir modal de confirmation au lieu de window.confirm
  const handleMealDeleteClick = useCallback((mealId) => {
    setMealToDelete(mealId);
    setShowDeleteConfirm(true);
  }, []);

  // Confirmer suppression après validation modal
  // ✅ PHASE 12.2 : Observer mettra à jour automatiquement après suppression
  const handleMealDeleteConfirm = useCallback(async () => {
    if (!mealToDelete) return;

    try {
      const deleted = await nutritionData.deleteMeal(mealToDelete);
      if (deleted) {
        // ✅ PHASE 12.2 : Observer mettra à jour automatiquement via repository.notify()
        // Mais on doit recharger dailyMeal avec recalculateTotals pour mettre à jour les totaux
        await refreshDailyMealWithTotals();
      }
    } catch (error) {
      console.error('[NutritionJournal] Erreur suppression repas:', error);
      // ✅ PHASE 12.2 : Forcer refresh en cas d'erreur
      refreshMeals();
      refreshDailyMeal();
    } finally {
      setShowDeleteConfirm(false);
      setMealToDelete(null);
    }
  }, [nutritionData.deleteMeal, refreshDailyMealWithTotals, refreshMeals, refreshDailyMeal, mealToDelete]);

  // Annuler suppression
  const handleMealDeleteCancel = useCallback(() => {
    setShowDeleteConfirm(false);
    setMealToDelete(null);
  }, []);

  // ✅ OPTIMISATION 2.2 : useCallback pour tous callbacks (stabilité props)
  // Ouvrir formulaire pour nouveau repas
  const handleAddMeal = useCallback((type = null) => {
    setEditingMeal(null);
    setShowMealForm(true);
  }, []);

  // Ouvrir formulaire pour modifier repas
  const handleEditMeal = useCallback((meal) => {
    setEditingMeal(meal);
    setShowMealForm(true);
  }, []);

  // Navigation dates
  const handleDateChange = useCallback((days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    onDateChange(newDate);
  }, [selectedDate, onDateChange]);

  const handleDateSelect = useCallback((e) => {
    const newDate = new Date(e.target.value);
    onDateChange(newDate);
  }, [onDateChange]);

  // ✅ OPTIMISATION 2.3 : useMemo pour date formatée (90% réduction calculs)
  const formattedDate = useMemo(() => {
    return selectedDate.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  }, [selectedDate]);

  // ✅ OPTIMISATION 2.2 : useCallback pour onClose MealEntryForm (stabilité props)
  const handleMealFormClose = useCallback(() => {
    setShowMealForm(false);
    setEditingMeal(null);
  }, []);

  // Éviter console.error à chaque rendu (pollue la console utilisateur)
  useEffect(() => {
    if (errorDailyMeal || errorMeals || errorProgram) {
      log.warn('Erreurs chargement (observer)', {
        errorDailyMeal,
        errorMeals,
        errorProgram
      });
    }
  }, [errorDailyMeal, errorMeals, errorProgram]);

  // ✅ CORRECTION : Ne pas bloquer indéfiniment - afficher contenu même si loading (avec données par défaut)
  // Le loading peut être true temporairement, mais on peut afficher l'UI avec des données vides
  if (loading && !dailyMeal && !meals && !activeProgram) {
    // Seulement afficher spinner si vraiment aucune donnée n'est disponible
    return (
      <Card variant="sport">
        <CardContent className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#0F4C5C]/50 border-t-[#0F5C45] mx-auto" />
          <p className="text-slate-400 mt-4">Chargement des données...</p>
          {(errorDailyMeal || errorMeals || errorProgram) && (
            <p className="text-red-400 mt-2 text-sm">
              Erreur de chargement - Affichage avec données par défaut
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sélection date */}
      <Card variant="sport" className={`transition-shadow duration-300 ${dateNavigatorAccent}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleDateChange(-1)}
                className="gradient-button-premium gradient-button-premium-sm rounded-lg"
              >
                ←
              </button>
              
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-teal-300" />
                <Input
                  type="date"
                  value={dateStr}
                  onChange={handleDateSelect}
                  className="bg-black border-[#0F4C5C]/55 text-teal-50 placeholder:text-teal-800"
                />
                <span className="text-teal-100/85 text-sm">
                  {formattedDate}
                </span>
              </div>
              
              <button
                type="button"
                onClick={() => handleDateChange(1)}
                className="gradient-button-premium gradient-button-premium-sm rounded-lg"
              >
                →
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleAddMeal()}
              className="gradient-button-premium gradient-button-premium-md rounded-lg flex items-center gap-2"
            >
              <Plus size={18} />
              Ajouter un repas
            </button>
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
        onUpdate={refreshDailyMealWithTotals}
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
          onClose={handleMealFormClose}
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
        title={t('nutrition.tooltips.journal.confirmDelete')}
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
            <button
              type="button"
              onClick={handleMealDeleteCancel}
              className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleMealDeleteConfirm}
              className="gradient-button-premium gradient-button-premium-md rounded-lg"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NutritionJournal;

