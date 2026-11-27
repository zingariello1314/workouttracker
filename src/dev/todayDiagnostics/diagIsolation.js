/**
 * Isolations expérimentales réversibles (diagnostic uniquement).
 * Aucune écriture métier : flags localStorage lus au runtime.
 *
 * Activer dans la console DevTools :
 *   localStorage.setItem('momentum:diag:suspendSportXpRecalc', '1')
 *   localStorage.setItem('momentum:diag:suspendGradeArtOfferXp', '1')
 *   localStorage.setItem('momentum:diag:suspendWarmRecap', '1')
 *   localStorage.setItem('momentum:diag:suspendSidebarPremium', '1')
 *   localStorage.setItem('momentum:diag:suspendFlightRecorderLoops', '1')
 * Désactiver : localStorage.removeItem(...) puis recharger.
 */

const KEYS = {
  suspendSportXpRecalc: 'momentum:diag:suspendSportXpRecalc',
  suspendGradeArtOfferXp: 'momentum:diag:suspendGradeArtOfferXp',
  suspendWarmRecap: 'momentum:diag:suspendWarmRecap',
  suspendAnimatedBackground: 'momentum:diag:suspendAnimatedBackground',
  suspendSidebarPremium: 'momentum:diag:suspendSidebarPremium',
  /** Garde les observers LT ; coupe rAF frames / memory / flush IDB — isolation bande ~440 ms. */
  suspendFlightRecorderLoops: 'momentum:diag:suspendFlightRecorderLoops'
};

function readFlag(key) {
  try {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

export function readDiagIsolationFlags() {
  return {
    suspendSportXpRecalc: readFlag(KEYS.suspendSportXpRecalc),
    suspendGradeArtOfferXp: readFlag(KEYS.suspendGradeArtOfferXp),
    suspendWarmRecap: readFlag(KEYS.suspendWarmRecap),
    suspendAnimatedBackground: readFlag(KEYS.suspendAnimatedBackground),
    suspendSidebarPremium: readFlag(KEYS.suspendSidebarPremium),
    suspendFlightRecorderLoops: readFlag(KEYS.suspendFlightRecorderLoops),
    keys: KEYS,
    note: 'Isolation contrôlée : n’activer qu’un flag à la fois pour démontrer la cause.'
  };
}

export function isDiagFlag(name) {
  const key = KEYS[name];
  return key ? readFlag(key) : false;
}

export { KEYS as DIAG_ISOLATION_KEYS };
