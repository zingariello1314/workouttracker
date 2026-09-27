import React, { useMemo } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import Button from '../../ui/Button';
import SportBankExerciseCard from '../../sport/SportBankExerciseCard';
import { bankMediaUrl } from '../../sport/BankLinkedMedia';
import { buildBankExerciseViewFromDatabaseKey } from '../../../utils/exerciseBankViewModel';
import { resolveExerciseIntensityCoeff } from '../../../utils/trainingLoadUtils';
import CircuitRoutineCopy from './CircuitRoutineCopy';

/**
 * Fiche d'une routine : vidéo, exercices dans l'ordre, puis le texte composé
 * (dosage, équivalences, niveaux). Les circuits encore vides gardent une place
 * pour les cartes et une ligne d'attente pour le texte.
 */
export default function CircuitDetailPage({
  circuit,
  onBack,
  onOpenExercise,
  onRequestAddToProgram,
  showAddButton = false,
  intensityCoeffs,
  maxRecordsByExerciseId,
  workoutData
}) {
  const exerciseViews = useMemo(() => {
    return (circuit?.exerciseKeys || [])
      .map((key) => buildBankExerciseViewFromDatabaseKey(key))
      .filter(Boolean);
  }, [circuit]);

  const description = (circuit?.description || '').trim();
  const composed = exerciseViews.length > 0 || Boolean(description);

  return (
    <div className="max-w-[1600px] mx-auto px-2 sm:px-4 pb-16 space-y-6">
      <div className="flex flex-wrap items-start gap-4 pt-2">
        <Button
          type="button"
          variant="ghost"
          className="gap-2 shrink-0 text-teal-400/95 hover:text-teal-200"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux circuits
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-[#58d4aa] mb-1 font-semibold">
            Sport · Circuits
          </p>
          <h1 className="text-xl sm:text-2xl text-teal-100 leading-tight tracking-tight font-bold break-words">
            {circuit.title}
          </h1>
          {composed ? null : (
            <p className="mt-1 text-xs text-slate-400">
              Nom provisoire, repris du fichier. Il sera fixé à partir des exercices présents dans la vidéo.
            </p>
          )}
        </div>
        {showAddButton && (
          <button
            type="button"
            onClick={() => onRequestAddToProgram?.({ kind: 'circuit', circuit })}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#0F5C45]/55 bg-[#0F5C45]/18 px-3 py-1.5 text-xs font-medium text-teal-100 transition hover:bg-[#0F5C45]/35 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/45"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter le circuit
          </button>
        )}
      </div>

      <div className="flex justify-center">
        <video
          src={bankMediaUrl(circuit.sourcePath)}
          className="block h-auto w-auto max-h-[85vh] max-w-full rounded-xl bg-black"
          autoPlay
          muted
          loop
          playsInline
          controls
          preload="metadata"
        />
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#58d4aa]">
            Composition
          </p>
          {exerciseViews.length > 1 ? (
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {exerciseViews.map((exercise, index) => (
                <li key={exercise.databaseKey || exercise.id} className="flex items-center gap-2 text-sm text-slate-200">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#0F5C45]/70 bg-[#0F5C45]/20 text-[11px] font-semibold text-teal-100">
                    {index + 1}
                  </span>
                  <span>{exercise.name}</span>
                  {index < exerciseViews.length - 1 ? <span className="text-teal-700">→</span> : null}
                </li>
              ))}
            </ol>
          ) : null}
        </div>
        {exerciseViews.length === 0 ? (
          <p className="text-sm leading-relaxed text-slate-400">
            Les cartes des exercices de cette vidéo arriveront ici, juste sous la vidéo.
          </p>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exerciseViews.map((exercise) => (
              <SportBankExerciseCard
                key={exercise.databaseKey || exercise.id}
                exercise={exercise}
                onOpenDetail={onOpenExercise}
                effectiveLoadCoeff={resolveExerciseIntensityCoeff(exercise, intensityCoeffs)}
                hasRecordedMax={maxRecordsByExerciseId?.has(String(exercise.id))}
                maxRecord={maxRecordsByExerciseId?.get(String(exercise.id)) || null}
                showAddButton={showAddButton}
                onRequestAddToProgram={onRequestAddToProgram}
                workoutData={workoutData}
              />
            ))}
          </div>
        )}
      </section>

      {description ? (
        <CircuitRoutineCopy description={description} hideOrder={exerciseViews.length > 0} />
      ) : (
        <p className="text-sm leading-relaxed text-slate-500">
          Le texte de la routine sera ajouté à partir de la vidéo.
        </p>
      )}
    </div>
  );
}
