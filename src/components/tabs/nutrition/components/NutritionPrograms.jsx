/**
 * NutritionPrograms - Gestion Programmes Nutritionnels
 * 
 * Composant complet pour la gestion des programmes nutritionnels :
 * - Liste des programmes (actifs, archivés)
 * - Création/Modification/Suppression
 * - Activation/Désactivation (un seul actif à la fois)
 * - Affichage conformité et statistiques
 * 
 * @module components/tabs/nutrition/components/NutritionPrograms
 * @see ../../../../../nouvelongletnutritionplan.md
 */

import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import Button from '../../../ui/Button';
import Input from '../../../ui/Input';
import { Target, Plus, Edit2, Trash2, Play, Pause, CheckCircle, Calendar, TrendingUp, Archive } from 'lucide-react';
import { typography } from '../../../../styles/typography';
import NutritionProgramForm from './NutritionProgramForm';
import { Badge } from '../../../ui/Badge';

const NutritionPrograms = ({ nutritionData }) => {
  const [programs, setPrograms] = useState([]);
  const [activeProgram, setActiveProgram] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger programmes
  useEffect(() => {
    loadPrograms();
  }, [nutritionData.dbReady]);

  const loadPrograms = async () => {
    if (!nutritionData.dbReady) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const allPrograms = await nutritionData.getAllPrograms();
      setPrograms(allPrograms || []);

      const active = await nutritionData.getActiveProgram();
      setActiveProgram(active);
    } catch (error) {
      console.error('[NutritionPrograms] Erreur chargement programmes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gérer création/modification
  const handleSaveProgram = async (programData) => {
    try {
      const saved = await nutritionData.saveProgram(programData);
      if (saved) {
        await loadPrograms();
        setShowForm(false);
        setEditingProgram(null);
      }
    } catch (error) {
      console.error('[NutritionPrograms] Erreur sauvegarde programme:', error);
    }
  };

  // Gérer activation
  const handleActivateProgram = async (programId) => {
    try {
      const activated = await nutritionData.activateProgram(programId);
      if (activated) {
        await loadPrograms();
      }
    } catch (error) {
      console.error('[NutritionPrograms] Erreur activation programme:', error);
    }
  };

  // Gérer désactivation
  const handleDeactivateProgram = async () => {
    try {
      const deactivated = await nutritionData.deactivateProgram();
      if (deactivated) {
        await loadPrograms();
      }
    } catch (error) {
      console.error('[NutritionPrograms] Erreur désactivation programme:', error);
    }
  };

  // Gérer suppression
  const handleDeleteProgram = async (programId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce programme ? Cette action est irréversible.')) {
      return;
    }

    try {
      const deleted = await nutritionData.deleteProgram(programId);
      if (deleted) {
        await loadPrograms();
      }
    } catch (error) {
      console.error('[NutritionPrograms] Erreur suppression programme:', error);
    }
  };

  // Ouvrir formulaire création
  const handleCreateProgram = () => {
    setEditingProgram(null);
    setShowForm(true);
  };

  // Ouvrir formulaire modification
  const handleEditProgram = (program) => {
    setEditingProgram(program);
    setShowForm(true);
  };

  // Formater objectif
  const formatGoal = (goal) => {
    const goals = {
      bulk: { label: 'Prise de masse', icon: '📈', color: 'text-orange-400' },
      cut: { label: 'Sèche', icon: '📉', color: 'text-blue-400' },
      maintain: { label: 'Maintien', icon: '⚖️', color: 'text-green-400' },
      recomp: { label: 'Recomposition', icon: '🔄', color: 'text-purple-400' }
    };
    return goals[goal] || goals.maintain;
  };

  // Calculer durée programme
  const calculateDuration = (startDate, endDate = null) => {
    if (!startDate) return 'Non défini';
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} semaine${weeks > 1 ? 's' : ''}`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} mois`;
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-400 mt-4">Chargement des programmes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${typography.presets.h2} text-white mb-2 flex items-center gap-2`}>
            <Target size={28} className="text-blue-400" />
            Programmes Nutritionnels
          </h2>
          <p className="text-slate-400">
            Créez et gérez vos programmes nutritionnels personnalisés
          </p>
        </div>
        <Button
          onClick={handleCreateProgram}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus size={18} className="mr-2" />
          Nouveau Programme
        </Button>
      </div>

      {/* Programme Actif */}
      {activeProgram && (
        <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-green-400" />
                <CardTitle className="text-white">Programme Actif</CardTitle>
              </div>
              <Button
                onClick={handleDeactivateProgram}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/20"
              >
                <Pause size={16} className="mr-2" />
                Désactiver
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className={`${typography.presets.h3} text-white mb-1`}>
                  {activeProgram.name}
                </h3>
                {activeProgram.description && (
                  <p className="text-slate-300">{activeProgram.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-slate-400 text-sm mb-1">Objectif</div>
                  <div className={`font-semibold ${formatGoal(activeProgram.goal).color}`}>
                    {formatGoal(activeProgram.goal).icon} {formatGoal(activeProgram.goal).label}
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-slate-400 text-sm mb-1">Calories</div>
                  <div className="text-white font-semibold">
                    {activeProgram.targetCalories} kcal
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-slate-400 text-sm mb-1">Protéines</div>
                  <div className="text-blue-400 font-semibold">
                    {activeProgram.targetProtein} g
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-slate-400 text-sm mb-1">Durée</div>
                  <div className="text-white font-semibold">
                    {calculateDuration(activeProgram.startDate, activeProgram.endDate)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2 border-t border-slate-700/50">
                <Button
                  onClick={() => handleEditProgram(activeProgram)}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Edit2 size={16} className="mr-2" />
                  Modifier
                </Button>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Calendar size={16} />
                  <span>
                    Actif depuis {activeProgram.startDate ? new Date(activeProgram.startDate).toLocaleDateString('fr-FR') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des Programmes */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive size={24} className="text-blue-400" />
            Tous les Programmes ({programs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {programs.length === 0 ? (
            <div className="text-center py-12">
              <Target size={48} className="mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400 mb-4">Aucun programme créé</p>
              <Button
                onClick={handleCreateProgram}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus size={18} className="mr-2" />
                Créer votre premier programme
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {programs.map((program) => {
                const goalInfo = formatGoal(program.goal);
                const isActive = program.id === activeProgram?.id;

                return (
                  <div
                    key={program.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isActive
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : program.isArchived
                        ? 'border-slate-600/50 bg-slate-800/30 opacity-60'
                        : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className={`${typography.presets.h4} text-white`}>
                            {program.name}
                          </h4>
                          {isActive && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              <CheckCircle size={14} className="mr-1" />
                              Actif
                            </Badge>
                          )}
                          {program.isArchived && (
                            <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                              Archivé
                            </Badge>
                          )}
                          <Badge className={`${goalInfo.color} bg-opacity-20`}>
                            {goalInfo.icon} {goalInfo.label}
                          </Badge>
                        </div>

                        {program.description && (
                          <p className="text-slate-400 text-sm mb-3">
                            {program.description}
                          </p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-slate-400">Calories: </span>
                            <span className="text-white font-semibold">
                              {program.targetCalories} kcal
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Protéines: </span>
                            <span className="text-blue-400 font-semibold">
                              {program.targetProtein} g
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Glucides: </span>
                            <span className="text-green-400 font-semibold">
                              {program.targetCarbs} g
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Lipides: </span>
                            <span className="text-orange-400 font-semibold">
                              {program.targetFat} g
                            </span>
                          </div>
                        </div>

                        {program.startDate && (
                          <div className="flex items-center gap-2 text-slate-500 text-xs mt-3">
                            <Calendar size={14} />
                            <span>
                              Créé le {new Date(program.startDate).toLocaleDateString('fr-FR')}
                              {program.endDate && ` - Terminé le ${new Date(program.endDate).toLocaleDateString('fr-FR')}`}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {!isActive && !program.isArchived && (
                          <Button
                            onClick={() => handleActivateProgram(program.id)}
                            variant="ghost"
                            size="sm"
                            className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                            title="Activer ce programme"
                          >
                            <Play size={16} />
                          </Button>
                        )}
                        <Button
                          onClick={() => handleEditProgram(program)}
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          title="Modifier"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          onClick={() => handleDeleteProgram(program.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulaire création/modification */}
      {showForm && (
        <NutritionProgramForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingProgram(null);
          }}
          program={editingProgram}
          onSave={handleSaveProgram}
          nutritionData={nutritionData}
        />
      )}
    </div>
  );
};

export default NutritionPrograms;
