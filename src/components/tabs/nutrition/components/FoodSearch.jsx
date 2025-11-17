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

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Loader2, AlertCircle, CheckCircle, X, Camera, Mic } from 'lucide-react';
import { searchOpenFoodFacts, searchFoodWithFallback } from '../../../../services/nutrition/openFoodFactsService';
import { searchUSDA } from '../../../../services/nutrition/usdaService';
import { getFavoriteFoods } from '../../../../hooks/nutritionDataCRUD';
import { useDebouncedCallback } from '../../../../hooks/useDebouncedCallback';
import logger from '../../../../utils/logger';
import BarcodeScanner from './BarcodeScanner';
import VoiceInput from './VoiceInput';

const log = logger.module('FoodSearch');

const FoodSearch = ({ onFoodSelected, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  
  // ✅ OPTIMISATION 26 : Cache favoris pour éviter rechargement à chaque recherche
  const [favoriteFoodsCache, setFavoriteFoodsCache] = useState([]);
  const [favoritesCacheLoaded, setFavoritesCacheLoaded] = useState(false);

  // ✅ OPTIMISATION Phase 11.3 : Ref pour vérifier validité requête (éviter résultats désordonnés)
  const currentSearchQueryRef = useRef('');

  // Charger favoris une seule fois au montage
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const favorites = await getFavoriteFoods({});
        setFavoriteFoodsCache(favorites);
        setFavoritesCacheLoaded(true);
      } catch (err) {
        log.warn('Erreur chargement favoris pour cache:', err);
        setFavoritesCacheLoaded(true); // Marquer comme chargé même en cas d'erreur
      }
    };
    loadFavorites();
  }, []);

  // Effectuer la recherche
  const performSearch = useCallback(async (searchQuery) => {
    // ✅ OPTIMISATION Phase 11.3 : Vérifier validité requête avant de continuer
    currentSearchQueryRef.current = searchQuery;
    const queryForThisSearch = searchQuery;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // ✅ OPTIMISATION 26 : Utiliser cache favoris au lieu de recharger
      const favorites = favoriteFoodsCache;
      const favoriteMatches = favorites.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // ✅ OPTIMISATION Phase 11.3 : Vérifier si requête toujours valide après recherche favoris
      if (currentSearchQueryRef.current !== queryForThisSearch) {
        setLoading(false);
        return; // Requête annulée
      }

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

        // ✅ OPTIMISATION Phase 11.3 : Vérifier validité avant de mettre à jour résultats
        if (currentSearchQueryRef.current === queryForThisSearch) {
          setResults(formattedFavorites);
        }
        setLoading(false);
        return;
      }

      // Recherche OpenFoodFacts avec fallback USDA
      const products = await searchFoodWithFallback(searchQuery, {
        searchInFavorites: async (q) => {
          // ✅ OPTIMISATION 26 : Utiliser cache favoris au lieu de recharger
          return favoriteFoodsCache.filter(f => f.name.toLowerCase().includes(q.toLowerCase()));
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

      // ✅ OPTIMISATION Phase 11.3 : Vérifier validité requête avant de mettre à jour résultats
      if (currentSearchQueryRef.current !== queryForThisSearch) {
        setLoading(false);
        return; // Requête annulée, ignorer résultats
      }

      if (products && products.length > 0) {
        setResults(products);
      } else {
        setError('Aucun aliment trouvé. Essayez un autre terme de recherche.');
      }
    } catch (err) {
      // ✅ OPTIMISATION Phase 11.3 : Ignorer erreurs si requête annulée
      if (currentSearchQueryRef.current !== queryForThisSearch) {
        setLoading(false);
        return;
      }
      log.error('Erreur recherche aliments:', err);
      setError('Erreur lors de la recherche. Veuillez réessayer.');
    } finally {
      // ✅ OPTIMISATION Phase 11.3 : Ne mettre loading à false que si requête toujours valide
      if (currentSearchQueryRef.current === queryForThisSearch) {
        setLoading(false);
      }
    }
  }, [favoriteFoodsCache]);

  // ✅ OPTIMISATION Phase 11.3 : Utiliser hook debounce optimisé avec gestion annulation
  const { debouncedCallback: debouncedSearch, isPending: isSearchPending, cancel: cancelSearch } = useDebouncedCallback(
    (searchQuery) => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery.trim());
      } else {
        setResults([]);
        setError(null);
        setLoading(false);
      }
    },
    500, // Debounce 500ms
    [performSearch] // ✅ OPTIMISATION Phase 11.3 : Inclure performSearch dans dépendances
  );

  // Recherche avec debounce amélioré
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      cancelSearch(); // Annuler recherche en cours
      currentSearchQueryRef.current = ''; // ✅ OPTIMISATION Phase 11.3 : Réinitialiser ref
      return;
    }

    debouncedSearch(query);
  }, [query, debouncedSearch, cancelSearch]);

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

  // Gérer produit scanné
  const handleProductScanned = useCallback((product) => {
    if (!product || !product.nutritionPer100) {
      log.warn('Produit scanné invalide:', product);
      return;
    }

    // Formater pour MealEntryForm (même format que handleSelectFood)
    const foodData = {
      id: `food_${Date.now()}_${Math.random()}`,
      name: product.name || product.product_name || 'Produit scanné',
      quantity: 100, // Par défaut 100g
      unit: 'g',
      caloriesPer100: product.nutritionPer100?.calories || 0,
      proteinPer100: product.nutritionPer100?.protein || 0,
      carbsPer100: product.nutritionPer100?.carbs || 0,
      fatPer100: product.nutritionPer100?.fat || 0,
      fiberPer100: product.nutritionPer100?.fiber || 0,
      sugarPer100: product.nutritionPer100?.sugar || 0,
      sodiumPer100: product.nutritionPer100?.sodium || 0,
      // Métadonnées
      source: product.source || 'openfoodfacts',
      sourceId: product.sourceId || product.code || null,
      brand: product.brand || product.brands || '',
      nutriScore: product.nutriScore || product.nutriscore_grade || null,
    };

    log.debug('Produit scanné sélectionné:', foodData);
    onFoodSelected(foodData);
    setShowBarcodeScanner(false);
    
    // Fermer le modal si onClose fourni
    if (onClose) {
      onClose();
    }
  }, [onFoodSelected, onClose]);

  // Gérer aliments depuis saisie vocale
  const handleVoiceFoodsSelected = useCallback((voiceFoods) => {
    if (!Array.isArray(voiceFoods) || voiceFoods.length === 0) {
      log.warn('[FoodSearch] Aliments voix vides ou invalides');
      return;
    }

    log.debug('[FoodSearch] Aliments sélectionnés depuis voix', { count: voiceFoods.length });

    // Si un seul aliment avec données nutrition complètes : ajouter directement
    // Sinon : mettre à jour la recherche pour permettre sélection manuelle
    if (voiceFoods.length === 1 && voiceFoods[0] && !voiceFoods[0].needsManualInput && voiceFoods[0].caloriesPer100 > 0) {
      // Un seul aliment trouvé avec données complètes -> ajouter directement
      const food = voiceFoods[0];
      const foodData = {
        id: food.id || `food_${Date.now()}_${Math.random()}`,
        name: food.name,
        quantity: food.quantity || 100,
        unit: food.unit || 'g',
        caloriesPer100: food.caloriesPer100 || 0,
        proteinPer100: food.proteinPer100 || 0,
        carbsPer100: food.carbsPer100 || 0,
        fatPer100: food.fatPer100 || 0,
        fiberPer100: food.fiberPer100 || 0,
        sugarPer100: food.sugarPer100 || 0,
        sodiumPer100: food.sodiumPer100 || 0,
        source: food.source || 'voice',
        sourceId: food.sourceId || null,
        brand: food.brand || '',
        nutriScore: food.nutriScore || null,
      };

      log.debug('[FoodSearch] Ajout direct aliment voix', foodData);
      onFoodSelected(foodData);
      
      if (onClose) {
        onClose();
      }
    } else {
      // Plusieurs aliments ou données incomplètes -> mettre à jour recherche
      // Prendre le nom du premier aliment pour la recherche
      const searchQuery = voiceFoods[0]?.name || '';
      if (searchQuery) {
        log.debug('[FoodSearch] Mise à jour recherche avec:', searchQuery);
        setQuery(searchQuery);
        
        // Si plusieurs aliments, afficher message informatif
        if (voiceFoods.length > 1) {
          setError(`Plusieurs aliments détectés. Recherche du premier : "${searchQuery}"`);
        }
      }
    }
  }, [onFoodSelected, onClose]);

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
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
                cancelSearch(); // ✅ OPTIMISATION Phase 11.3 : Annuler recherche en cours
                currentSearchQueryRef.current = ''; // Réinitialiser ref
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        {/* Bouton Scanner */}
        <button
          onClick={() => setShowBarcodeScanner(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          title="Scanner un code-barres"
        >
          <Camera size={18} />
          <span className="hidden sm:inline">Scanner</span>
        </button>

        {/* Bouton Saisie Vocale */}
        <VoiceInput
          onFoodsSelected={handleVoiceFoodsSelected}
          autoSearch={true}
          lang="fr-FR"
          variant="icon"
        />
      </div>

      {/* État de chargement */}
      {/* ✅ OPTIMISATION Phase 11.3 : Utiliser isSearchPending pour feedback visuel plus précis */}
      {(loading || isSearchPending) && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-blue-400" size={24} />
          <span className="ml-3 text-slate-400">Recherche en cours...</span>
        </div>
      )}

      {/* Erreur */}
      {error && !loading && !isSearchPending && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Résultats */}
      {/* ✅ OPTIMISATION Phase 11.3 : Masquer résultats pendant chargement */}
      {!loading && !isSearchPending && !error && results.length > 0 && (
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
      {!loading && !isSearchPending && !error && query.length >= 2 && results.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <p>Aucun résultat pour "{query}"</p>
          <p className="text-sm mt-2">Essayez un autre terme de recherche</p>
        </div>
      )}

      {/* Instructions */}
      {!loading && !isSearchPending && !error && query.length < 2 && (
        <div className="text-center py-8 text-slate-500 text-sm">
          <p>Commencez à taper pour rechercher un aliment</p>
          <p className="mt-2">Recherche dans OpenFoodFacts et USDA</p>
          <p className="mt-2 text-xs">
            ou utilisez le bouton <Mic size={14} className="inline mx-1" /> pour la saisie vocale
            ou le bouton <Camera size={14} className="inline mx-1" /> pour scanner un code-barres
          </p>
        </div>
      )}

      {/* Modal Scanner Code-Barres */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onProductScanned={handleProductScanned}
      />
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

      </div>
    </button>
  );
};

export default FoodSearch;

