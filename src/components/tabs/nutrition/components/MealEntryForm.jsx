/**
 * MealEntryForm - Formulaire Ajout/Modification Repas
 * 
 * Modal pour ajouter ou modifier un repas avec :
 * - Sélection type de repas
 * - Ajout d'aliments (nom, quantité, unité)
 * - Calcul automatique totaux
 * - Notes optionnelles
 * 
 * @module components/tabs/nutrition/components/MealEntryForm
 */

import React, { useState, useEffect } from 'react';
import Modal from '../../../ui/Modal';
import Button from '../../../ui/Button';
import Input from '../../../ui/Input';
import { X, Plus, Trash2, Save, Search } from 'lucide-react';
import { typography } from '../../../../styles/typography';
import FoodSearch from './FoodSearch';

const MealEntryForm = ({ isOpen, onClose, meal, dateStr, onSave, nutritionData }) => {
  const [mealType, setMealType] = useState('breakfast');
  const [foods, setFoods] = useState([]);
  const [notes, setNotes] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFoodSearch, setShowFoodSearch] = useState(false);

  // Types de repas
  const mealTypes = [
    { value: 'breakfast', label: 'Petit-déjeuner', icon: '🌅' },
    { value: 'lunch', label: 'Déjeuner', icon: '🍽️' },
    { value: 'dinner', label: 'Dîner', icon: '🌙' },
    { value: 'snack', label: 'Collation', icon: '🍎' }
  ];

  // Initialiser formulaire
  useEffect(() => {
    if (meal) {
      // Mode édition
      setMealType(meal.type || 'breakfast');
      setFoods(meal.foods || []);
      setNotes(meal.notes || '');
      setTimestamp(meal.timestamp || new Date().toISOString());
    } else {
      // Mode création
      setMealType('breakfast');
      setFoods([]);
      setNotes('');
      setTimestamp(new Date().toISOString());
    }
  }, [meal, isOpen]);

  // Ajouter un aliment vide
  const handleAddFood = () => {
    setFoods([...foods, {
      id: `food_${Date.now()}_${Math.random()}`,
      name: '',
      quantity: 100,
      unit: 'g',
      caloriesPer100: 0,
      proteinPer100: 0,
      carbsPer100: 0,
      fatPer100: 0
    }]);
  };

  // Ajouter un aliment depuis la recherche
  const handleFoodSelected = (foodData) => {
    setFoods([...foods, foodData]);
    setShowFoodSearch(false);
  };

  // Supprimer un aliment
  const handleRemoveFood = (foodId) => {
    setFoods(foods.filter(f => f.id !== foodId));
  };

  // Mettre à jour un aliment
  const handleUpdateFood = (foodId, field, value) => {
    setFoods(foods.map(f => {
      if (f.id === foodId) {
        return { ...f, [field]: value };
      }
      return f;
    }));
  };

  // Calculer totaux d'un aliment
  const calculateFoodTotals = (food) => {
    const ratio = food.quantity / 100;
    return {
      calories: (food.caloriesPer100 || 0) * ratio,
      protein: (food.proteinPer100 || 0) * ratio,
      carbs: (food.carbsPer100 || 0) * ratio,
      fat: (food.fatPer100 || 0) * ratio
    };
  };

  // Calculer totaux du repas
  const calculateMealTotals = () => {
    return foods.reduce((acc, food) => {
      const totals = calculateFoodTotals(food);
      return {
        calories: acc.calories + totals.calories,
        protein: acc.protein + totals.protein,
        carbs: acc.carbs + totals.carbs,
        fat: acc.fat + totals.fat
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  // Valider et sauvegarder
  const handleSave = async () => {
    // Validation
    if (foods.length === 0) {
      alert('Veuillez ajouter au moins un aliment');
      return;
    }

    const invalidFoods = foods.filter(f => !f.name || f.name.trim() === '');
    if (invalidFoods.length > 0) {
      alert('Veuillez renseigner le nom de tous les aliments');
      return;
    }

    setLoading(true);

    try {
      const totals = calculateMealTotals();

      const mealData = {
        id: meal?.id || nutritionData.generateMealId(),
        dailyMealId: dateStr,
        date: dateStr,
        type: mealType,
        timestamp: timestamp || new Date().toISOString(),
        foods: foods.map(f => ({
          ...f,
          // Calculer valeurs pour la quantité
          calories: calculateFoodTotals(f).calories,
          protein: calculateFoodTotals(f).protein,
          carbs: calculateFoodTotals(f).carbs,
          fat: calculateFoodTotals(f).fat
        })),
        totalCalories: Math.round(totals.calories),
        totalProtein: Math.round(totals.protein * 10) / 10,
        totalCarbs: Math.round(totals.carbs * 10) / 10,
        totalFat: Math.round(totals.fat * 10) / 10,
        notes: notes.trim() || null
      };

      await onSave(mealData);
    } catch (error) {
      console.error('[MealEntryForm] Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du repas');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateMealTotals();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={meal ? 'Modifier le repas' : 'Ajouter un repas'}
      size="lg"
    >
      <div className="p-6 space-y-6">
        {/* Type de repas */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Type de repas
          </label>
          <div className="grid grid-cols-4 gap-2">
            {mealTypes.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => setMealType(type.value)}
                className={`p-3 rounded-lg border transition-all ${
                  mealType === type.value
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="text-2xl mb-1">{type.icon}</div>
                <div className="text-xs">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Heure */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Heure
          </label>
          <Input
            type="datetime-local"
            value={timestamp ? new Date(timestamp).toISOString().slice(0, 16) : ''}
            onChange={(e) => setTimestamp(new Date(e.target.value).toISOString())}
            className="bg-slate-800 border-slate-600 text-white"
          />
        </div>

        {/* Liste des aliments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-slate-300 font-medium">
              Aliments
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setShowFoodSearch(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Search size={16} className="mr-2" />
                Rechercher
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddFood}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Plus size={16} className="mr-2" />
                Ajouter manuellement
              </Button>
            </div>
          </div>

          {foods.length === 0 ? (
            <div className="bg-slate-800/50 rounded-lg p-6 text-center border border-slate-700">
              <p className="text-slate-400 mb-4">Aucun aliment ajouté</p>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddFood}
                className="border-slate-600 text-slate-300"
              >
                <Plus size={16} className="mr-2" />
                Ajouter le premier aliment
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {foods.map((food, idx) => (
                <div
                  key={food.id}
                  className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm font-medium">
                      Aliment #{idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFood(food.id)}
                      className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Nom */}
                    <div className="col-span-2">
                      <label className="block text-slate-400 text-sm mb-1">
                        Nom de l'aliment *
                      </label>
                      <Input
                        type="text"
                        value={food.name}
                        onChange={(e) => handleUpdateFood(food.id, 'name', e.target.value)}
                        placeholder="Ex: Poulet grillé"
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                    </div>

                    {/* Quantité */}
                    <div>
                      <label className="block text-slate-400 text-sm mb-1">
                        Quantité
                      </label>
                      <Input
                        type="number"
                        value={food.quantity}
                        onChange={(e) => handleUpdateFood(food.id, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.1"
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                    </div>

                    {/* Unité */}
                    <div>
                      <label className="block text-slate-400 text-sm mb-1">
                        Unité
                      </label>
                      <select
                        value={food.unit}
                        onChange={(e) => handleUpdateFood(food.id, 'unit', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="g">g (grammes)</option>
                        <option value="ml">ml (millilitres)</option>
                        <option value="unité">unité</option>
                        <option value="tasse">tasse</option>
                        <option value="cuillère">cuillère</option>
                      </select>
                    </div>
                  </div>

                  {/* Valeurs nutritionnelles pour 100g/ml */}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-700">
                    <div>
                      <label className="block text-slate-400 text-xs mb-1">
                        Calories/100
                      </label>
                      <Input
                        type="number"
                        value={food.caloriesPer100 || 0}
                        onChange={(e) => handleUpdateFood(food.id, 'caloriesPer100', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.1"
                        className="bg-slate-900 border-slate-600 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs mb-1">
                        Protéines/100
                      </label>
                      <Input
                        type="number"
                        value={food.proteinPer100 || 0}
                        onChange={(e) => handleUpdateFood(food.id, 'proteinPer100', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.1"
                        className="bg-slate-900 border-slate-600 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs mb-1">
                        Glucides/100
                      </label>
                      <Input
                        type="number"
                        value={food.carbsPer100 || 0}
                        onChange={(e) => handleUpdateFood(food.id, 'carbsPer100', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.1"
                        className="bg-slate-900 border-slate-600 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs mb-1">
                        Lipides/100
                      </label>
                      <Input
                        type="number"
                        value={food.fatPer100 || 0}
                        onChange={(e) => handleUpdateFood(food.id, 'fatPer100', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.1"
                        className="bg-slate-900 border-slate-600 text-white text-sm"
                      />
                    </div>
                  </div>

                  {/* Totaux pour cette quantité */}
                  {food.quantity > 0 && (
                    <div className="pt-2 border-t border-slate-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Totaux pour {food.quantity} {food.unit} :</span>
                        <div className="flex items-center gap-3">
                          <span className="text-white">
                            {Math.round(calculateFoodTotals(food).calories)} kcal
                          </span>
                          <span className="text-blue-400">
                            P: {Math.round(calculateFoodTotals(food).protein * 10) / 10}g
                          </span>
                          <span className="text-green-400">
                            G: {Math.round(calculateFoodTotals(food).carbs * 10) / 10}g
                          </span>
                          <span className="text-orange-400">
                            L: {Math.round(calculateFoodTotals(food).fat * 10) / 10}g
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totaux du repas */}
        {foods.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-400 font-medium">Totaux du repas :</span>
              <div className="flex items-center gap-4">
                <span className="text-white font-semibold">
                  {Math.round(totals.calories)} kcal
                </span>
                <span className="text-blue-400">
                  P: {Math.round(totals.protein * 10) / 10}g
                </span>
                <span className="text-green-400">
                  G: {Math.round(totals.carbs * 10) / 10}g
                </span>
                <span className="text-orange-400">
                  L: {Math.round(totals.fat * 10) / 10}g
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Notes (optionnel)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Repas post-entraînement"
            rows={3}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-slate-300 hover:text-white"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || foods.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save size={18} className="mr-2" />
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {/* Modal recherche aliments */}
      <Modal
        isOpen={showFoodSearch}
        onClose={() => setShowFoodSearch(false)}
        title="Rechercher un aliment"
        size="lg"
      >
        <div className="p-4">
          <FoodSearch
            onFoodSelected={handleFoodSelected}
            onClose={() => setShowFoodSearch(false)}
          />
        </div>
      </Modal>
    </Modal>
  );
};

export default MealEntryForm;

