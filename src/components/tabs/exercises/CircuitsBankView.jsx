import React, { useMemo, useState } from 'react';
import { Film, Plus } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '../../ui/Card';
import BankAddToProgramModal from '../../sport/BankAddToProgramModal';
import { bankMediaUrl, circuitList } from '../../sport/BankLinkedMedia';
import ExerciseDetailPage from './ExerciseDetailPage';
import CircuitDetailPage from './CircuitDetailPage';
import { buildBankExerciseViewFromDatabaseKey } from '../../../utils/exerciseBankViewModel';

function compositionLine(circuit) {
  const names = (circuit?.exerciseKeys || [])
    .map((key) => buildBankExerciseViewFromDatabaseKey(key)?.name)
    .filter(Boolean);
  if (names.length === 0) return 'Les exercices de cette vidéo seront listés ici.';
  return names.join(' → ');
}

export default function CircuitsBankView({
  data,
  updateData,
  isAuthenticated = false,
  intensityCoeffs,
  maxRecordsByExerciseId
}) {
  const circuits = useMemo(() => {
    const list = circuitList();
    const filled = [];
    const empty = [];
    for (const circuit of list) {
      const ready = (circuit.exerciseKeys || []).length > 0 || Boolean((circuit.description || '').trim());
      if (ready) filled.push(circuit);
      else empty.push(circuit);
    }
    return [...filled, ...empty];
  }, []);
  const [selected, setSelected] = useState(null);
  const [detailExercise, setDetailExercise] = useState(null);
  const [bankAddPayload, setBankAddPayload] = useState(null);

  const requestAdd = isAuthenticated ? (payload) => setBankAddPayload(payload) : undefined;

  return (
    <>
      <BankAddToProgramModal payload={bankAddPayload} onClose={() => setBankAddPayload(null)} />

      {detailExercise ? (
        <ExerciseDetailPage
          exercise={detailExercise}
          data={data}
          updateData={updateData}
          onBack={() => setDetailExercise(null)}
          readOnly={!isAuthenticated}
          onOpenSimilarBankExercise={(ex) => setDetailExercise(ex)}
          maxRecordsByExerciseId={maxRecordsByExerciseId}
          onRequestAddToProgram={requestAdd}
          isAuthenticated={isAuthenticated}
        />
      ) : selected ? (
        <CircuitDetailPage
          circuit={selected}
          onBack={() => setSelected(null)}
          onOpenExercise={setDetailExercise}
          onRequestAddToProgram={requestAdd}
          showAddButton={isAuthenticated}
          intensityCoeffs={intensityCoeffs}
          maxRecordsByExerciseId={maxRecordsByExerciseId}
          workoutData={data}
        />
      ) : (
        <div className="space-y-4">
          <Card variant="sport">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Film className="w-5 h-5 text-teal-300" />
                Circuits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">
                {circuits.length} routines. Celles qui ont déjà leurs exercices sont en haut.
              </p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {circuits.map((circuit) => (
              <article
                key={circuit.mediaId}
                className="flex h-full flex-col gap-3 rounded-xl border-2 border-[#0F4C5C]/85 bg-black p-4 shadow-lg shadow-black/40 transition-all duration-200 hover:border-[#0F5C45]/80 hover:shadow-[0_0_24px_-8px_rgba(15,92,69,0.45)]"
              >
                <button
                  type="button"
                  onClick={() => setSelected(circuit)}
                  className="flex flex-1 cursor-pointer flex-col gap-3 text-left focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/45"
                >
                  <div className="flex min-h-[3.25rem] items-start justify-between gap-3 border-b border-[#0F4C5C]/35 pb-3">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">
                      {circuit.title}
                    </h3>
                    <span className="shrink-0 rounded-md border border-sky-500/35 bg-sky-950/35 px-2 py-0.5 text-[10px] text-sky-200">
                      Circuit
                    </span>
                  </div>
                  <div className="h-[300px] w-full overflow-hidden rounded-lg bg-black">
                    <video
                      src={bankMediaUrl(circuit.sourcePath)}
                      className="pointer-events-none h-full w-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    />
                  </div>
                  <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-snug text-slate-300">
                    {compositionLine(circuit)}
                  </p>
                </button>
                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => requestAdd?.({ kind: 'circuit', circuit })}
                    className="inline-flex w-fit items-center gap-1 rounded-md border border-[#0F5C45]/55 bg-[#0F5C45]/18 px-2 py-0.5 text-[10px] font-medium text-teal-100 transition hover:bg-[#0F5C45]/35 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/45"
                  >
                    <Plus className="h-3 w-3 shrink-0" />
                    Ajouter le circuit
                  </button>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
