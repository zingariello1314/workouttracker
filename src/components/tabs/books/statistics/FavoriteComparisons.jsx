/**
 * FavoriteComparisons Component
 * 
 * Composant pour la gestion des comparaisons favorites dans les statistiques de lecture.
 * Permet de sauvegarder, charger et gérer les comparaisons entre périodes.
 * 
 * @see Requirements 9.5, 10.5
 */

import React, { useState } from 'react';
import { 
  Star, 
  Trash2, 
  Plus, 
  Calendar, 
  TrendingUp, 
  Download,
  Upload,
  Edit3,
  Check,
  X
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import Button from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { useTranslation } from '../../../../utils/translations';

const FavoriteComparisons = ({ 
  favoriteComparisons = [],
  onAddFavorite,
  onRemoveFavorite,
  onLoadComparison,
  currentComparison = null
}) => {
  const t = useTranslation();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newComparisonName, setNewComparisonName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  // Sauvegarder la comparaison actuelle
  const handleSaveCurrentComparison = () => {
    if (!currentComparison) return;
    
    setIsAddingNew(true);
    setNewComparisonName(
      `Comparaison ${new Date().toLocaleDateString()}`
    );
  };

  // Confirmer l'ajout d'une nouvelle comparaison
  const handleConfirmAdd = () => {
    if (!newComparisonName.trim() || !currentComparison) return;
    
    const comparison = {
      name: newComparisonName.trim(),
      period1: currentComparison.period1,
      period2: currentComparison.period2,
      filters: currentComparison.filters || {}
    };
    
    onAddFavorite(comparison);
    setIsAddingNew(false);
    setNewComparisonName('');
  };

  // Annuler l'ajout
  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setNewComparisonName('');
  };

  // Commencer l'édition d'un nom
  const handleStartEdit = (comparison) => {
    setEditingId(comparison.id);
    setEditingName(comparison.name);
  };

  // Confirmer l'édition
  const handleConfirmEdit = (comparisonId) => {
    if (!editingName.trim()) return;
    
    // Note: Cette fonctionnalité nécessiterait une méthode updateFavoriteComparison
    // dans le service des préférences
    setEditingId(null);
    setEditingName('');
  };

  // Annuler l'édition
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  // Formater la description d'une comparaison
  const formatComparisonDescription = (comparison) => {
    const period1Label = comparison.period1?.label || comparison.period1;
    const period2Label = comparison.period2?.label || comparison.period2;
    
    return `${period1Label} vs ${period2Label}`;
  };

  // Formater la date de création
  const formatCreatedDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Card variant="books">
      <CardHeader className="border-b border-[#3A86FF]/25">
        <CardTitle tone="books" className="flex items-center justify-between normal-case tracking-wide">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-[#93c5fd]" />
            {t('books.statistics.favoriteComparisons.title', 'Comparaisons favorites')}
          </div>
          
          {currentComparison && !isAddingNew && (
            <Button
              variant="booksMuted"
              size="sm"
              onClick={handleSaveCurrentComparison}
              className="flex items-center gap-2 normal-case tracking-normal"
            >
              <Plus className="w-4 h-4" />
              {t('books.statistics.favoriteComparisons.save', 'Sauvegarder')}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Formulaire d'ajout */}
        {isAddingNew && (
          <div className="bg-black/60 border border-[#3A86FF]/30 rounded-xl p-4 space-y-3">
            <div>
              <label className="text-sm text-[#93c5fd] mb-2 block">
                {t('books.statistics.favoriteComparisons.name', 'Nom de la comparaison')}
              </label>
              <Input
                fieldTone="books"
                value={newComparisonName}
                onChange={(e) => setNewComparisonName(e.target.value)}
                placeholder={t('books.statistics.favoriteComparisons.namePlaceholder', 'Ex: Comparaison mensuelle')}
                className="w-full"
                autoFocus
              />
            </div>
            
            {currentComparison && (
              <div className="text-sm text-[#93c5fd]/80">
                <span className="font-medium">Comparaison: </span>
                {formatComparisonDescription(currentComparison)}
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="books"
                size="sm"
                onClick={handleConfirmAdd}
                disabled={!newComparisonName.trim()}
                className="flex items-center gap-2 normal-case tracking-normal"
              >
                <Check className="w-4 h-4" />
                {t('books.statistics.favoriteComparisons.confirm', 'Confirmer')}
              </Button>
              <Button
                variant="booksMuted"
                size="sm"
                onClick={handleCancelAdd}
                className="flex items-center gap-2 normal-case tracking-normal"
              >
                <X className="w-4 h-4" />
                {t('books.statistics.favoriteComparisons.cancel', 'Annuler')}
              </Button>
            </div>
          </div>
        )}

        {/* Liste des comparaisons favorites */}
        {favoriteComparisons.length === 0 ? (
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 mb-2">
              {t('books.statistics.favoriteComparisons.empty', 'Aucune comparaison favorite')}
            </p>
            <p className="text-sm text-slate-500">
              {t('books.statistics.favoriteComparisons.emptyHint', 
                'Sauvegarde tes comparaisons préférées pour y accéder rapidement')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {favoriteComparisons.map((comparison) => (
              <div
                key={comparison.id}
                className="bg-slate-800/30 rounded-lg p-4 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingId === comparison.id ? (
                      <div className="flex items-center gap-2 mb-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1"
                          size="sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleConfirmEdit(comparison.id)}
                          disabled={!editingName.trim()}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-white">
                          {comparison.name}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(comparison)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <TrendingUp className="w-4 h-4" />
                        {formatComparisonDescription(comparison)}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {t('books.statistics.favoriteComparisons.created', 'Créé le')} {formatCreatedDate(comparison.createdAt)}
                      </div>
                      
                      {Object.keys(comparison.filters || {}).length > 0 && (
                        <div className="text-xs text-slate-500">
                          {t('books.statistics.favoriteComparisons.withFilters', 'Avec filtres appliqués')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onLoadComparison(comparison)}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {t('books.statistics.favoriteComparisons.load', 'Charger')}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveFavorite(comparison.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions d'export/import */}
        {favoriteComparisons.length > 0 && (
          <div className="border-t border-slate-600 pt-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Upload className="w-4 h-4" />
              <span>
                {t('books.statistics.favoriteComparisons.exportHint', 
                  'Tu peux exporter tes comparaisons dans les paramètres')}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FavoriteComparisons;