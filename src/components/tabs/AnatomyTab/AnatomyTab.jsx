import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AnatomyAccueilView from './AnatomyAccueilView';
import AnatomyFamilyView from './AnatomyFamilyView';
import AnatomyMuscleView from './AnatomyMuscleView';
import AnatomyShell from './AnatomyShell';
import { getAnatomyFamily, getAnatomyMuscle } from '../../../data/anatomy/anatomyRegistry';

/** @typedef {{ view: 'home' } | { view: 'family', familyId: string } | { view: 'muscle', muscleId: string }} AnatomyRoute */

function parseHashRoute() {
  const raw = typeof window !== 'undefined' ? window.location.hash : '';
  const m = raw.match(/^#anatomy(?:\/(family|muscle)\/([^/?]+))?/);
  if (!m) return { view: 'home' };
  if (m[1] === 'family' && m[2]) return { view: 'family', familyId: decodeURIComponent(m[2]) };
  if (m[1] === 'muscle' && m[2]) return { view: 'muscle', muscleId: decodeURIComponent(m[2]) };
  return { view: 'home' };
}

function writeHashRoute(route) {
  if (typeof window === 'undefined') return;
  if (route.view === 'home') {
    if (window.location.hash.startsWith('#anatomy')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    return;
  }
  const seg =
    route.view === 'family'
      ? `#anatomy/family/${encodeURIComponent(route.familyId)}`
      : `#anatomy/muscle/${encodeURIComponent(route.muscleId)}`;
  if (window.location.hash !== seg) {
    window.history.replaceState(null, '', seg);
  }
}

export default function AnatomyTab() {
  const [route, setRoute] = useState(() => parseHashRoute());

  useEffect(() => {
    const onHash = () => setRoute(parseHashRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [route]);

  const goHome = useCallback(() => {
    setRoute({ view: 'home' });
    writeHashRoute({ view: 'home' });
  }, []);

  const openFamily = useCallback((familyId) => {
    const next = { view: 'family', familyId };
    setRoute(next);
    writeHashRoute(next);
  }, []);

  const openMuscle = useCallback((muscleId) => {
    const next = { view: 'muscle', muscleId };
    setRoute(next);
    writeHashRoute(next);
  }, []);

  const onSearchExercise = useCallback(
    (hit) => {
      if (hit.kind !== 'exercise') return;
      const name = hit.label.toLowerCase();
      if (name.includes('développé') || name.includes('pompes') || name.includes('pec')) {
        openMuscle('grand-pectoral');
      } else if (name.includes('militaire') || name.includes('élévation')) {
        openMuscle('deloide');
      } else if (
        name.includes('traction') ||
        name.includes('tirage') ||
        name.includes('rowing') ||
        name.includes('soulevé') ||
        name.includes('deadlift')
      ) {
        openMuscle('grand-dorsal');
      } else if (name.includes('lombaire') || name.includes('good morning') || name.includes('hyperextension')) {
        openMuscle('erecteurs-rachis');
      } else if (name.includes('curl') || name.includes('biceps')) {
        openMuscle('biceps-brachial');
      } else if (
        name.includes('triceps') ||
        name.includes('dip') ||
        name.includes('pushdown') ||
        name.includes('barre au front')
      ) {
        openMuscle('triceps-brachial');
      } else if (
        name.includes('crunch') ||
        name.includes('abdo') ||
        name.includes('planche') ||
        name.includes('gainage')
      ) {
        openMuscle('grand-droit');
      }
    },
    [openMuscle]
  );

  const shellMode =
    route.view === 'home' ? 'accueil' : route.view === 'family' ? 'famille' : 'fiche';

  const familyId = useMemo(() => {
    if (route.view === 'family') return route.familyId;
    if (route.view === 'muscle') return getAnatomyMuscle(route.muscleId)?.familyId ?? null;
    return null;
  }, [route]);

  const muscleId = route.view === 'muscle' ? route.muscleId : null;

  const body = useMemo(() => {
    if (route.view === 'family' && getAnatomyFamily(route.familyId)) {
      return <AnatomyFamilyView familyId={route.familyId} onOpenMuscle={openMuscle} />;
    }
    if (route.view === 'muscle') {
      return <AnatomyMuscleView muscleId={route.muscleId} onOpenMuscle={openMuscle} />;
    }
    return (
      <AnatomyAccueilView
        onOpenFamily={openFamily}
        onOpenMuscle={openMuscle}
        onSearchNavigate={onSearchExercise}
      />
    );
  }, [route, openFamily, openMuscle, onSearchExercise]);

  return (
    <div className="min-h-full px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto">
      <AnatomyShell
        mode={shellMode}
        familyId={familyId}
        muscleId={muscleId}
        onAccueil={goHome}
        onFamille={openFamily}
        onFiche={openMuscle}
      >
        {body}
      </AnatomyShell>
    </div>
  );
}
