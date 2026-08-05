import React, { useMemo, useState } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import AnatomyBankHighlight from '../anatomy/AnatomyBankHighlight';
import { formatMuscleList } from '../../utils/exerciseHeroContent';
import {
  listExerciseVariationsForProgramExercise
} from '../../utils/exerciseVariationResolver';

function MultilineBlock({ text }) {
  if (!text) return null;
  return (
    <div className="text-sm text-slate-300 leading-relaxed space-y-3 max-h-48 overflow-y-auto pr-1">
      {String(text)
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i}>{p}</p>
        ))}
    </div>
  );
}

const ExerciseVariations = ({ baseExercise, onClose, onApplyVariation }) => {
  const [selectedVariation, setSelectedVariation] = useState(null);

  const variations = useMemo(
    () => listExerciseVariationsForProgramExercise(baseExercise),
    [baseExercise]
  );

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Débutant':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Intermédiaire':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Avancé':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  if (!baseExercise) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Exercice non trouvé" size="sm" variant="glass" showCloseButton={true}>
        <div className="p-6 text-center">
          <p className="text-slate-300 mb-6">Impossible de charger les variations pour cet exercice.</p>
          <Button variant="primary" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </Modal>
    );
  }

  const titleName = baseExercise.name || 'Exercice';

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Variations de ${titleName}`}
      size="xl"
      variant="glass"
      showCloseButton={true}
    >
      <div className="p-6">
        <p className="text-slate-300 mb-6">Découvrez différentes façons de réaliser cet exercice (banque Momentum).</p>

        {variations.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            Aucune variation banque trouvée pour « {titleName} ».
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 min-h-[50vh]">
            <div className="lg:w-1/2 overflow-y-auto max-h-[65vh]">
              <h3 className="text-lg font-semibold text-white mb-4">Choisissez une variation</h3>
              <div className="space-y-3">
                {variations.map((variation) => (
                  <button
                    type="button"
                    key={variation.databaseKey}
                    onClick={() => setSelectedVariation(variation)}
                    className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                      selectedVariation?.databaseKey === variation.databaseKey
                        ? 'bg-teal-600/20 border-teal-500 shadow-md'
                        : 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h4 className="font-medium text-white">
                        {variation.name}
                        {variation.isCurrent ? (
                          <span className="ml-2 text-[10px] text-teal-300/90">(actuel)</span>
                        ) : null}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border shrink-0 ${getDifficultyColor(
                          variation.difficulty
                        )}`}
                      >
                        {variation.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2">{variation.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2 lg:pl-6 lg:border-l border-slate-700/50">
              {selectedVariation ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{selectedVariation.name}</h3>
                    {selectedVariation.equipment ? (
                      <p className="text-xs text-slate-500">{selectedVariation.equipment}</p>
                    ) : null}
                  </div>

                  <AnatomyBankHighlight
                    primaryMuscles={selectedVariation.primaryMuscles}
                    secondaryMuscles={selectedVariation.secondaryMuscles}
                    exerciseDatabaseKey={selectedVariation.databaseKey}
                    compact
                  />

                  <div>
                    <h4 className="font-semibold text-white mb-2">Muscles</h4>
                    <p className="text-sm text-slate-300">
                      <span className="text-teal-300/90">Principaux : </span>
                      {formatMuscleList(selectedVariation.primaryMuscles) || '—'}
                    </p>
                    {selectedVariation.secondaryMuscles?.length ? (
                      <p className="text-sm text-slate-400 mt-1">
                        <span className="text-slate-500">Secondaires : </span>
                        {formatMuscleList(selectedVariation.secondaryMuscles)}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">Fiche</h4>
                    <MultilineBlock text={selectedVariation.fullDescription || selectedVariation.description} />
                  </div>

                  {typeof onApplyVariation === 'function' && baseExercise.id != null && typeof baseExercise.id === 'number' ? (
                    <Button
                      variant="primary"
                      className="w-full"
                      disabled={selectedVariation.isCurrent}
                      onClick={() => {
                        onApplyVariation(selectedVariation);
                        onClose();
                      }}
                    >
                      Utiliser cette variation aujourd&apos;hui
                    </Button>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      Sélection informative — pour appliquer au programme du jour, ouvre les variations depuis un
                      exercice du programme (Aujourd&apos;hui).
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[200px] text-center">
                  <div>
                    <div className="text-4xl mb-4">👈</div>
                    <p className="text-slate-400">Sélectionnez une variation pour voir les détails et le modèle 3D</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ExerciseVariations;
