import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { evaluateAndMergeTrophies } from '../../services/code/codeContributionsTrophies';

export default function CodeContributionsTrophiesPanel({ weeks }) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id || 'main';
  const [state, setState] = useState({ details: [], unlocked: {}, loading: true });

  useEffect(() => {
    if (!weeks?.length) {
      setState({ details: [], unlocked: {}, loading: false });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { unlocked, details } = await evaluateAndMergeTrophies(userId, weeks);
        if (!cancelled) setState({ unlocked, details, loading: false });
      } catch {
        if (!cancelled) setState({ details: [], unlocked: {}, loading: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, weeks]);

  if (state.loading && !weeks?.length) {
    return null;
  }

  return (
    <section className="rounded-xl border border-rose-500/45 bg-black/55 p-4 md:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-2">
          <Trophy className="h-6 w-6 text-rose-300" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Trophées contributions</h2>
          <p className="mt-1 text-sm text-rose-200/75">
            Défis sur <strong className="text-rose-100">cumul historique</strong>,{' '}
            <strong className="text-rose-100">fenêtres glissantes</strong> (7 à 365 j. UTC) et{' '}
            <strong className="text-rose-100">séries</strong> de jours consécutifs. Chaque palier débloqué attribue de
            l’XP Code (250 à 10&nbsp;000 XP, jusqu’à <strong className="text-amber-200">100&nbsp;000 XP</strong> pour
            100&nbsp;000 contributions totales) — cumulée dans la barre Code.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            <span className="font-medium text-rose-200/80">Court terme :</span> chaque ouverture de l’onglet Code et
            chaque « Rafraîchir » rechargent le graphe GitHub (fenêtre 12 mois ou année civile).{' '}
            <span className="font-medium text-rose-200/80">Long terme :</span> ce panneau et l’XP trophées utilisent
            l’agrégat multi-années ; les déblocages restent enregistrés sur l’appareil (IndexedDB) même si tu changes de
            période d’affichage.
          </p>
        </div>
      </div>

      {!weeks?.length ? (
        <p className="text-sm text-slate-500">Connecte GitHub et attends le chargement des contributions pour afficher les trophées.</p>
      ) : (
        <ul className="grid max-h-[min(70vh,920px)] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
          {state.details.map((d) => {
            const unlockedAt = state.unlocked[d.id];
            return (
              <li
                key={d.id}
                className={`rounded-lg border p-3 ${
                  unlockedAt ? 'border-amber-400/50 bg-amber-950/15' : 'border-rose-500/30 bg-black/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">{d.title}</h3>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="text-[10px] font-semibold text-rose-300/90">+{Number(d.xpReward || 0).toLocaleString('fr-FR')} XP</span>
                    {unlockedAt ? (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-amber-200/90">Débloqué</span>
                    ) : null}
                  </div>
                </div>
                <p className="mt-1 text-xs text-rose-100/70">{d.description}</p>
                <dl className="mt-2 space-y-0.5 text-[11px] text-rose-200/80">
                  <div className="flex justify-between gap-2">
                    <dt>{d.streakMin != null ? 'Type' : d.windowDays != null ? 'Fenêtre' : 'Périmètre'}</dt>
                    <dd>
                      {d.streakMin != null
                        ? 'Série (record)'
                        : d.windowDays != null
                          ? `${d.windowDays} j. UTC`
                          : 'Cumul tout profil'}
                    </dd>
                  </div>
                  {d.streakMin != null ? (
                    <>
                      <div className="flex justify-between gap-2">
                        <dt>Record série</dt>
                        <dd>{d.stats.total}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Palier</dt>
                        <dd>≥ {d.streakMin} j.</dd>
                      </div>
                    </>
                  ) : d.windowDays == null && d.streakMin == null ? (
                    <div className="flex justify-between gap-2">
                      <dt>Total cumulé (profil)</dt>
                      <dd>{d.stats.total}</dd>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between gap-2">
                        <dt>Total contrib.</dt>
                        <dd>{d.stats.total}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Jours actifs</dt>
                        <dd>{d.stats.activeDays}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Moy. / jour cal.</dt>
                        <dd>{Number(d.stats.avgPerCalendarDay || 0).toFixed(2)}</dd>
                      </div>
                    </>
                  )}
                </dl>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full transition-all ${d.met ? 'bg-amber-400/90' : 'bg-rose-500/70'}`}
                    style={{ width: `${Math.min(100, d.progressPercent)}%` }}
                  />
                </div>
                {unlockedAt ? (
                  <p className="mt-1 text-[10px] text-amber-100/80">
                    depuis le {new Date(unlockedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
