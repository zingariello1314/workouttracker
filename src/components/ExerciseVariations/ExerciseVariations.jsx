import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const ExerciseVariations = ({ baseExercise, onClose }) => {
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Données d'exemple pour les variations d'exercices
  const exerciseVariations = {
    'Pompes': [
      { 
        name: 'Pompes classiques', 
        difficulty: 'Débutant', 
        description: 'Position standard, mains à largeur d\'épaules',
        muscles: ['Pectoraux', 'Triceps', 'Épaules'],
        tips: 'Gardez le corps aligné, descendez jusqu\'à ce que la poitrine touche presque le sol'
      },
      { 
        name: 'Pompes inclinées', 
        difficulty: 'Débutant', 
        description: 'Mains surélevées sur un banc ou une marche',
        muscles: ['Pectoraux', 'Triceps'],
        tips: 'Plus facile que les pompes classiques, idéal pour débuter'
      },
      { 
        name: 'Pompes déclinées', 
        difficulty: 'Intermédiaire', 
        description: 'Pieds surélevés sur un banc',
        muscles: ['Pectoraux supérieurs', 'Épaules', 'Triceps'],
        tips: 'Plus difficile, cible davantage le haut des pectoraux'
      },
      { 
        name: 'Pompes diamant', 
        difficulty: 'Avancé', 
        description: 'Mains en forme de diamant sous la poitrine',
        muscles: ['Triceps', 'Pectoraux internes'],
        tips: 'Très exigeant pour les triceps, progression lente recommandée'
      }
    ],
    'Squats': [
      { 
        name: 'Squats classiques', 
        difficulty: 'Débutant', 
        description: 'Position debout, pieds écartés largeur d\'épaules',
        muscles: ['Quadriceps', 'Fessiers', 'Ischio-jambiers'],
        tips: 'Descendez comme si vous vous asseyiez sur une chaise invisible'
      },
      { 
        name: 'Squats sumo', 
        difficulty: 'Débutant', 
        description: 'Pieds très écartés, pointes vers l\'extérieur',
        muscles: ['Fessiers', 'Adducteurs', 'Quadriceps'],
        tips: 'Excellent pour cibler les fessiers et l\'intérieur des cuisses'
      },
      { 
        name: 'Squats sautés', 
        difficulty: 'Intermédiaire', 
        description: 'Squat classique avec saut explosif',
        muscles: ['Quadriceps', 'Fessiers', 'Mollets'],
        tips: 'Atterrissez en douceur, genoux fléchis'
      },
      { 
        name: 'Squats pistol', 
        difficulty: 'Avancé', 
        description: 'Squat sur une seule jambe',
        muscles: ['Quadriceps', 'Fessiers', 'Stabilisateurs'],
        tips: 'Exercice très technique, nécessite force et équilibre'
      }
    ]
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Débutant': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Intermédiaire': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Avancé': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  // Vérification si l'exercice de base existe
  if (!baseExercise) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Exercice non trouvé" size="sm" variant="glass" showCloseButton={true}>
        <div className="p-6 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-slate-300 mb-6">
            Impossible de charger les variations pour cet exercice.
          </p>
          <Button variant="primary" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </Modal>
    );
  }

  const variations = exerciseVariations[baseExercise.name] || [];

  const handleVariationSelect = (variation) => {
    setSelectedVariation(variation);
    setShowDetails(true);
  };

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title={`Variations de ${baseExercise.name}`}
      size="xl" 
      variant="glass"
      showCloseButton={true}
    >
      <div className="p-6">
        <p className="text-slate-300 mb-6">
          Découvrez différentes façons de réaliser cet exercice
        </p>

        <div className="flex gap-6 min-h-[60vh]">
          {/* Liste des variations */}
          <div className="w-1/2 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">
              Choisissez une variation
            </h3>
            <div className="space-y-3">
              {variations.map((variation, index) => (
                <div
                  key={index}
                  onClick={() => handleVariationSelect(variation)}
                  className={`
                    p-4 rounded-lg border cursor-pointer transition-all duration-200
                    ${selectedVariation === variation
                      ? 'bg-blue-600/20 border-blue-500 shadow-md'
                      : 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50 hover:border-slate-500'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">
                      {variation.name}
                    </h4>
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium border
                      ${getDifficultyColor(variation.difficulty)}
                    `}>
                      {variation.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">
                    {variation.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Détails de la variation sélectionnée */}
          <div className="w-1/2 pl-6 border-l border-slate-700/50">
            {selectedVariation ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {selectedVariation.name}
                  </h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    selectedVariation.difficulty === 'Débutant' ? 'bg-green-600/20 text-green-400' :
                    selectedVariation.difficulty === 'Intermédiaire' ? 'bg-yellow-600/20 text-yellow-400' :
                    'bg-red-600/20 text-red-400'
                  }`}>
                    {selectedVariation.difficulty}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">📝 Description</h4>
                    <p className="text-slate-300 leading-relaxed">
                      {selectedVariation.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">🎯 Muscles ciblés</h4>
                    <p className="text-slate-300">
                      {selectedVariation.targetMuscles}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">💡 Conseils</h4>
                    <p className="text-blue-200 text-sm leading-relaxed">
                      {selectedVariation.tips}
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                      // Ici on pourrait ajouter la logique pour remplacer l'exercice
                      onClose();
                    }}
                  >
                    Utiliser cette variation
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <div className="text-4xl mb-4">👈</div>
                  <p className="text-slate-400">
                    Sélectionnez une variation pour voir les détails
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ExerciseVariations;