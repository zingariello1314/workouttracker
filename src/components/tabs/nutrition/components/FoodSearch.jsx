/**
 * FoodSearch - Composant de Recherche d'Aliments
 * 
 * Permet de rechercher des aliments via OpenFoodFacts et USDA :
 * - Recherche par nom avec debounce
 * - Affichage résultats avec Nutri-Score
 * - Sélection et ajout automatique au repas
 * - Cache et fallback intelligents
 * 
 * @module components/tabs/nutrition/components/FoodSearch
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';
import { searchOpenFoodFacts, searchFoodWithFallback } from '../../../../services/nutrition/openFoodFactsService';
import { searchUSDA } from '../../../../services/nutrition/usdaService';
import { getFavoriteFoods } from '../../../../hooks/nutritionDataCRUD';
import logger from '../../../../utils/logger';

const log = logger.module('FoodSearch');

const FoodSearch = ({ onFoodSelected, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Recherche avec debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      await performSearch(query.trim());
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Effectuer la recherche
  const performSearch = useCallback(async (searchQuery) => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // Rechercher dans favoris d'abord
      const favorites = await getFavoriteFoods({});
      const favoriteMatches = favorites.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (favoriteMatches.length > 0) {
        const formattedFavorites = favoriteMatches.map(f => ({
          id: f.id,
          name: f.name,
          brand: f.brand || '',
          nutritionPer100: {
            calories: f.caloriesPer100 || 0,
            protein: f.proteinPer100 || 0,
            carbs: f.carbsPer100 || 0,
            fat: f.fatPer100 || 0,
            fiber: f.fiberPer100 || 0,
            sugar: f.sugarPer100 || 0,
            sodium: f.sodiumPer100 || 0,
          },
          source: 'favorite',
          sourceId: f.id,
          isFavorite: true,
        }));

        setResults(formattedFavorites);
        setLoading(false);
        return;
      }

      // Recherche OpenFoodFacts avec fallback USDA
      const products = await searchFoodWithFallback(searchQuery, {
        searchInFavorites: async (q) => {
          const favs = await getFavoriteFoods({});
          return favs.filter(f => f.name.toLowerCase().includes(q.toLowerCase()));
        },
        searchUSDA: async (q) => {
          try {
            return await searchUSDA(q, { useCache: true });
          } catch (err) {
            log.warn('Erreur recherche USDA:', err);
            return [];
          }
        }
      });

      if (products && products.length > 0) {
        setResults(products);
      } else {
        setError('Aucun aliment trouvé. Essayez un autre terme de recherche.');
      }
    } catch (err) {
      log.error('Erreur recherche aliments:', err);
      setError('Erreur lors de la recherche. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Sélectionner un aliment
  const handleSelectFood = useCallback((product) => {
    if (!product || !product.nutritionPer100) {
      return;
    }

    // Formater pour MealEntryForm
    const foodData = {
      id: `food_${Date.now()}_${Math.random()}`,
      name: product.name,
      quantity: 100, // Par défaut 100g
      unit: 'g',
      caloriesPer100: product.nutritionPer100.calories || 0,
      proteinPer100: product.nutritionPer100.protein || 0,
      carbsPer100: product.nutritionPer100.carbs || 0,
      fatPer100: product.nutritionPer100.fat || 0,
      fiberPer100: product.nutritionPer100.fiber || 0,
      sugarPer100: product.nutritionPer100.sugar || 0,
      sodiumPer100: product.nutritionPer100.sodium || 0,
      // Métadonnées
      source: product.source || 'unknown',
      sourceId: product.sourceId || null,
      brand: product.brand || '',
      nutriScore: product.nutriScore || null,
    };

    onFoodSelected(foodData);
    
    // Fermer le modal si onClose fourni
    if (onClose) {
      onClose();
    }
  }, [onFoodSelected, onClose]);

  // Navigation clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
        e.preventDefault();
        handleSelectFood(results[selectedIndex]);
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, results, handleSelectFood, onClose]);

  // Réinitialiser selectedIndex quand résultats changent
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un aliment (ex: poulet, riz, pomme)..."
          className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setError(null);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* État de chargement */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-blue-400" size={24} />
          <span className="ml-3 text-slate-400">Recherche en cours...</span>
        </div>
      )}

      {/* Erreur */}
      {error && !loading && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Résultats */}
      {!loading && !error && results.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.map((product, index) => (
            <FoodCard
              key={`${product.source}_${product.sourceId || product.id}`}
              product={product}
              isSelected={index === selectedIndex}
              onClick={() => handleSelectFood(product)}
            />
          ))}
        </div>
      )}

      {/* Aucun résultat */}
      {!loading && !error && query.length >= 2 && results.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <p>Aucun résultat pour "{query}"</p>
          <p className="text-sm mt-2">Essayez un autre terme de recherche</p>
        </div>
      )}

      {/* Instructions */}
      {!loading && !error && query.length < 2 && (
        <div className="text-center py-8 text-slate-500 text-sm">
          <p>Commencez à taper pour rechercher un aliment</p>
          <p className="mt-2">Recherche dans OpenFoodFacts et USDA</p>
        </div>
      )}
    </div>
  );
};

/**
 * Carte d'aliment dans les résultats
 */
const FoodCard = ({ product, isSelected, onClick }) => {
  const nutrition = product.nutritionPer100 || {};
  
  // Couleur Nutri-Score
  const getNutriScoreColor = (grade) => {
    if (!grade) return 'bg-slate-600';
    const gradeUpper = grade.toUpperCase();
    if (gradeUpper === 'A') return 'bg-green-500';
    if (gradeUpper === 'B') return 'bg-green-400';
    if (gradeUpper === 'C') return 'bg-yellow-400';
    if (gradeUpper === 'D') return 'bg-orange-500';
    if (gradeUpper === 'E') return 'bg-red-500';
    return 'bg-slate-600';
  };

  // Badge source
  const getSourceBadge = (source) => {
    if (source === 'favorite' || product.isFavorite) {
      return { label: '⭐ Favori', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    }
    if (source === 'openfoodfacts') {
      return { label: 'OFF', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    }
    if (source === 'usda') {
      return { label: 'USDA', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
    }
    return { label: source || '?', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
  };

  const sourceBadge = getSourceBadge(product.source);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border transition-all ${
        isSelected
          ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500'
          : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 hover:border-slate-600'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Infos principales */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-white truncate">{product.name}</h4>
            {product.brand && (
              <span className="text-xs text-slate-400 truncate">({product.brand})</span>
            )}
          </div>

          {/* Badge source */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded border ${sourceBadge.color}`}>
              {sourceBadge.label}
            </span>
            {product.nutriScore && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${getNutriScoreColor(product.nutriScore)}`}>
                Nutri-Score {product.nutriScore.toUpperCase()}
              </span>
            )}
          </div>

          {/* Macros */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>🔥 {Math.round(nutrition.calories || 0)} kcal</span>
            <span>🥩 {nutrition.protein?.toFixed(1) || 0}g protéines</span>
            <span>🍞 {nutrition.carbs?.toFixed(1) || 0}g glucides</span>
            <span>🧈 {nutrition.fat?.toFixed(1) || 0}g lipides</span>
          </div>
        </div>

        {/* Image (si disponible) */}
        {product.imageUrl && (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-16 h-16 object-cover rounded border border-slate-700"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
      </div>
    </button>
  );
};

export default FoodSearch;

