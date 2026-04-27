/**
 * Phase d'un tour Garmin (course) — aligné sur RunningSessionDetailPage / export Garmin.
 * @returns {'effort'|'recovery'|'warmup'|'cooldown'|'other'}
 */
export function classifyLapPhase(lap) {
  const raw = String(lap?.intervalTypeKey || lap?.lapType || lap?.type || '').toUpperCase();
  if (!raw) return 'effort';
  if (/REST|RECOVERY|STATIONARY|PAUSE|STOP|RESTING|INTERVAL_REST/.test(raw)) return 'recovery';
  if (/COOLDOWN|COOL_DOWN|COOL/.test(raw)) return 'cooldown';
  if (/WARMUP|WARM_UP|WARM-UP/.test(raw)) return 'warmup';
  if (/ACTIVE|INTERVAL|WORK|WORKOUT|SPEED|RACE|REP|LAP/.test(raw)) return 'effort';
  return 'other';
}

/**
 * Infère le type de séance course pour l’import Garmin : fractionné si au moins un tour
 * récup / retour au calme et au moins un tour effort (même logique que l’UI des tours).
 * @returns {'interval'|'endurance'}
 */
export function inferRunningSessionTypeFromGarminActivity(gAct) {
  const laps = gAct?.running?.laps;
  if (!Array.isArray(laps) || laps.length === 0) return 'endurance';
  let effort = 0;
  let recovery = 0;
  for (const lap of laps) {
    const phase = classifyLapPhase(lap);
    if (phase === 'recovery' || phase === 'cooldown') recovery += 1;
    else effort += 1;
  }
  return recovery > 0 && effort > 0 ? 'interval' : 'endurance';
}

/** Clé type Garmin d’origine (à privilégier : activityType peut être forcé à « running » côté serveur). */
function garminTypeKeyLower(gAct) {
  return String(gAct?.garminTypeKey || gAct?.activityTypeDTO?.typeKey || '').toLowerCase();
}

function displayActivityTypeLower(gAct) {
  return String(gAct?.activityType || '').toLowerCase();
}

function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getActivityDistanceKm(gAct) {
  const distance = toFiniteNumber(gAct?.distance);
  if (distance != null && distance > 0) return distance;
  const meters = toFiniteNumber(gAct?.running?.distanceMeters ?? gAct?.distanceMeters);
  if (meters != null && meters > 0) return meters / 1000;
  return 0;
}

function getActivityDurationSec(gAct) {
  const sec = toFiniteNumber(gAct?.duration ?? gAct?.running?.durationSeconds);
  return sec != null && sec > 0 ? sec : 0;
}

function getActivityAvgSpeedKmh(gAct) {
  const direct = toFiniteNumber(gAct?.speed ?? gAct?.running?.avgSpeedKmh);
  if (direct != null && direct > 0) return direct;
  const km = getActivityDistanceKm(gAct);
  const sec = getActivityDurationSec(gAct);
  if (km > 0 && sec > 0) return (km / sec) * 3600;
  return 0;
}

function hasStrongNonRunningSignals(gAct) {
  const km = getActivityDistanceKm(gAct);
  const sec = getActivityDurationSec(gAct);
  const speed = getActivityAvgSpeedKmh(gAct);
  const laps = Array.isArray(gAct?.running?.laps) ? gAct.running.laps : [];

  // Vitesse : ne pas pénaliser une vraie sortie rapide (fractionné ~25–27 km/h).
  // On ne garde que des cas aberrants côté GPS / machine (pas un critère « cardio »).
  if (km > 0.05 && sec > 120 && speed > 35) return true;
  if (km > 0 && sec >= 20 * 60 && speed > 0 && speed < 5) return true;
  if (km > 0 && km < 1.0 && sec >= 30 * 60) return true;

  if (laps.length >= 8) {
    let smallLaps = 0;
    for (const lap of laps) {
      const m = toFiniteNumber(lap?.distanceMeters);
      if (m != null && m > 0 && m < 120) smallLaps += 1;
    }
    if (smallLaps >= Math.floor(laps.length * 0.6)) return true;
  }

  return false;
}

function activityTitleLower(gAct) {
  return String(gAct?.activityName || gAct?.name || '').toLowerCase();
}

/**
 * Libellé qui indique clairement une course à pied / fractionné / VMA, etc.
 * (sinon un profil Garmin « Cardio » / « HIIT » reste du cardio générique, pas une course.)
 */
function looksLikeExplicitRunByTitle(title) {
  if (!title) return false;
  const t = title.toLowerCase();
  if (
    /\bcourse\b|\bcourse\s*à\s*pied\b|\brunning\b|\bjogging\b|\bfooting\b|\bfractionn[eé]\b|\binterval(le)?s?\b.*\b(run|course|cours)\b|\b(run|course)\b.*\binterval/i.test(
      t
    )
  ) {
    return true;
  }
  if (/\btrail\b|\b10[\s-]?k\b|semi[\s-]*marathon|marathon|\bvma\b|\bseuil\b|tempo\s*run|sortie\s*(longue|course)|\b5[\s-]?k\b|\b21[\s-]?k\b/i.test(t)) {
    return true;
  }
  if (/\btapis\b/i.test(t) && /\b(cours|run|footing|foot|running|interval)/i.test(t)) return true;
  return false;
}

/**
 * Street workout, muscu, renfo, etc. : ne doit pas apparaître en course/marche endurance.
 * Les types Garmin « force / yoga » sont exclus ; pour le cardio, on s’appuie surtout sur le libellé.
 */
export function shouldExcludeGarminFromEnduranceRunWalk(gAct) {
  if (!gAct) return false;
  const gTk = garminTypeKeyLower(gAct);
  const dTk = displayActivityTypeLower(gAct);
  const title = activityTitleLower(gAct);

  const isGenericCardioProfile =
    gTk === 'indoor_cardio' ||
    gTk === 'cardio' ||
    gTk === 'hiit' ||
    dTk === 'indoor_cardio' ||
    dTk === 'cardio' ||
    dTk === 'hiit';

  if (
    isGenericCardioProfile &&
    !isGarminRunningLikeTypeKey(gTk) &&
    !isGarminRunningLikeTypeKey(dTk) &&
    dTk !== 'running' &&
    !looksLikeExplicitRunByTitle(title) &&
    !looksLikeWalkingByTitle(title)
  ) {
    return true;
  }

  // Profil forcé « running » côté API mais libellé activité = cardio salle (ex. « Pessac Cardio ») : pas une course.
  if (
    title &&
    /\bcardio\b/i.test(title) &&
    !looksLikeExplicitRunByTitle(title) &&
    !looksLikeWalkingByTitle(title)
  ) {
    return true;
  }

  const typeBlock = new Set([
    'strength_training',
    'functional_strength_training',
    'yoga',
    'pilates',
    'elliptical_training',
    'elliptical',
    'indoor_cycling',
    'cycling',
    'indoor_rowing',
    'rowing',
    'stair_climbing',
    'multi_sport',
    'mobility',
    'breathwork',
    'meditation',
  ]);
  if (typeBlock.has(gTk) || typeBlock.has(dTk)) return true;

  if (!title) return false;

  if (
    /street\s*work|streetwork|calisthen|callisthen|musculation|\bmuscu\b|renforcement|\brenfo\b|halt[eè]re|haltères|poids du corps|\bpompes\b|tractions?|squat|deadlift|développé|developpe|abdos|gainage|plank|crossfit|\bhiit\b|tabata|wod\b|circuit\s*muscu|full\s*body|upper\s*body|lower\s*body/i.test(
      title
    )
  ) {
    if (/\bcourse\b|\brunning\b|\bjogging\b|\binterval\b.*\bcourse/i.test(title)) return false;
    return true;
  }
  return false;
}

/**
 * Seuils minimum pour importer une séance en course/marche (évite GPS / bruit « 20 m »).
 * @param {boolean} isWalk — marche un peu plus exigeante en distance.
 */
export function garminMeetsEnduranceRunWalkImportThresholds(gAct, isWalk) {
  const km = getActivityDistanceKm(gAct);
  const sec = getActivityDurationSec(gAct);
  const minKm = isWalk ? 0.45 : 0.35;
  const minSec = isWalk ? 150 : 120;
  return km >= minKm && sec >= minSec;
}

/** Marche / rando : à exclure du cumul « distance courue ». */
function isGarminWalkingLikeTypeKey(tk) {
  if (!tk) return false;
  if (
    tk === 'walking' ||
    tk === 'indoor_walking' ||
    tk === 'speed_walking' ||
    tk === 'hiking' ||
    tk === 'hike' ||
    tk === 'trail_hiking' ||
    tk === 'snow_shoeing' ||
    tk === 'ultra_hike'
  ) {
    return true;
  }
  if (tk.includes('hiking') || tk.includes('hike')) return true;
  if (tk.includes('walk') && !tk.includes('running')) return true;
  return false;
}

/**
 * Aligné sur garmin-server `is_running_like_activity` : course à pied / tapis / trail, etc.
 * Ne s’appuie pas sur activityType seul si garminTypeKey indique marche.
 */
function isGarminRunningLikeTypeKey(tk) {
  if (!tk || isGarminWalkingLikeTypeKey(tk)) return false;
  if (/running|treadmill|trail|virtual_run|race|jog/.test(tk)) return true;
  const keys = new Set([
    'running',
    'street_running',
    'track_running',
    'indoor_running',
    'treadmill_running',
    'trail_running',
    'virtual_run',
    'ultra_run',
    'track_run',
    'indoor_track',
    'race',
    'treadmill',
  ]);
  return keys.has(tk);
}

function garminHasPositiveRunDistance(gAct) {
  let d = gAct?.distance;
  if (d != null && typeof d === 'object') {
    d = d.total ?? d.value ?? d.current ?? d.avg ?? 0;
  }
  const n = Number(d);
  if (Number.isFinite(n) && n > 0) return true;
  const m = gAct?.running?.distanceMeters ?? gAct?.distanceMeters;
  return m != null && Number(m) > 0;
}

function looksLikeWalkingByTitle(title) {
  if (!title) return false;
  if (/\bcourse\b|\bcorrida\b|\brunning\b|\bjogging\b|\binterval/.test(title)) return false;
  if (
    /\bmarche\b|\bwalk(ing)?\b|\brandonn(?:ée|e)?\b|\bhiking\b|\btrail\s*hike\b|\brando\b/i.test(title)
  ) {
    return true;
  }
  return false;
}

function isIndoorCardioOrCardioTypeKey(gTk, dTk) {
  return (
    gTk === 'indoor_cardio' ||
    gTk === 'cardio' ||
    gTk === 'hiit' ||
    dTk === 'indoor_cardio' ||
    dTk === 'cardio' ||
    dTk === 'hiit'
  );
}

/** Marche / rando côté activité complète (clés Garmin + libellé). */
export function isGarminWalkingLikeActivity(gAct) {
  if (!gAct) return false;
  if (shouldExcludeGarminFromEnduranceRunWalk(gAct)) return false;
  const gTk = garminTypeKeyLower(gAct);
  const dTk = displayActivityTypeLower(gAct);
  if (isGarminWalkingLikeTypeKey(gTk) || isGarminWalkingLikeTypeKey(dTk)) return true;

  const title = activityTitleLower(gAct);
  if (looksLikeWalkingByTitle(title) && isIndoorCardioOrCardioTypeKey(gTk, dTk) && garminHasPositiveRunDistance(gAct)) {
    const speed = getActivityAvgSpeedKmh(gAct);
    if (!(speed > 0) || speed < 7) return true;
  }
  return false;
}

/**
 * Titre d’activité extrait des notes « Garmin — … » (import course).
 * @param {string|undefined} notes
 * @returns {string} en minuscules, ou chaîne vide
 */
export function garminActivityTitleFromStoredNotes(notes) {
  const n = String(notes || '').trim();
  const m = n.match(/^garmin\s*[\u2013\u2014-]\s*(.+)$/i);
  return m ? m[1].trim().toLowerCase() : '';
}

/**
 * Session `running` déjà en base mais issue d’un profil cardio Garmin (ex. notes « Garmin — Pessac Cardio ») :
 * à exclure des défis, XP course, charge calendrier, listes « course » — comme si non importée.
 * Les séances manuelles (sans motif Garmin cardio) ne sont pas touchées.
 *
 * Si l’utilisateur a choisi « Restaurer » dans l’onglet Défis, `includeInRunningDespiteGarminCardio: true`
 * est persisté sur la séance et annule cette exclusion.
 */
export function shouldExcludeStoredGarminRunningSession(session) {
  if (!session || typeof session !== 'object') return false;
  if (session.includeInRunningDespiteGarminCardio === true) return false;

  // Les sessions explicitement classées "marche" doivent toujours rester visibles
  // dans l'onglet Marche/Défis, même si le nom Garmin contient "cardio".
  const explicitType = String(session?.type || '').toLowerCase();
  if (/\b(walk|walking|marche|rando|hike|hiking)\b/i.test(explicitType)) return false;

  const src = String(session.source || '').toLowerCase();
  if (src !== 'garmin') return false;
  const title = garminActivityTitleFromStoredNotes(session.notes);
  if (!title) return false;
  if (looksLikeExplicitRunByTitle(title) || looksLikeWalkingByTitle(title)) return false;
  if (/\bcardio\b/i.test(title)) return true;
  if (
    /musculation|\bmuscu\b|renforcement|\brenfo\b|street\s*work|halt[eè]re|hiit|tabata|crossfit|elliptique|spinning|\bspin\b|v(?:é|e)lo\s*d'?\s*intérieur|indoor\s*cycl|yoga|pilates/i.test(
      title
    )
  ) {
    return true;
  }
  return false;
}

/** Activité cardio enregistrée comme course (même critères que l’import endurance). */
export function isGarminRunningLikeActivity(gAct) {
  if (!gAct || (gAct.jumps && gAct.jumps > 0)) return false;

  if (shouldExcludeGarminFromEnduranceRunWalk(gAct)) return false;
  if (isGarminWalkingLikeActivity(gAct)) return false;

  const gTk = garminTypeKeyLower(gAct);
  const dTk = displayActivityTypeLower(gAct);

  if (isGarminRunningLikeTypeKey(gTk) || isGarminRunningLikeTypeKey(dTk)) {
    return !hasStrongNonRunningSignals(gAct);
  }

  if (gAct.running && garminHasPositiveRunDistance(gAct)) {
    if (!gTk) return !hasStrongNonRunningSignals(gAct);
    if (dTk === 'running') return true;
    if (
      isIndoorCardioOrCardioTypeKey(gTk, dTk) &&
      !hasStrongNonRunningSignals(gAct) &&
      looksLikeExplicitRunByTitle(activityTitleLower(gAct))
    ) {
      return true;
    }
  }

  return false;
}

function lapDistanceKm(lap) {
  if (lap == null) return 0;
  if (lap.distanceKm != null) {
    const k = Number(lap.distanceKm);
    if (Number.isFinite(k) && k > 0) return k;
  }
  let d = lap.distance;
  if (d != null && typeof d === 'object') {
    d = d.total ?? d.value ?? d.current ?? d.avg ?? 0;
  }
  const n = Number(d);
  if (Number.isFinite(n) && n > 0) {
    if (n > 400 && n < 200000) return n / 1000;
    return n;
  }
  const m = Number(lap.distanceMeters ?? lap.distanceMeter ?? 0);
  if (Number.isFinite(m) && m > 0) return m / 1000;
  return 0;
}

function lapDurationSec(lap) {
  const sec = Number(lap?.durationSeconds ?? lap?.duration ?? lap?.elapsedDuration ?? 0);
  return Number.isFinite(sec) && sec > 0 ? sec : 0;
}

/**
 * Pic d’allure / vitesse sur les tours « effort » (pas récup ni retour au calme).
 * Si aucun tour exploitable en strict, retente en excluant seulement récup / cooldown (warmup inclus).
 * @returns {{ bestPaceSecPerKm: number, bestSpeedKmh: number } | null}
 */
export function getRunningPeakPaceFromEffortLaps(activity) {
  const laps = activity?.running?.laps;
  if (!Array.isArray(laps) || laps.length === 0) return null;

  const scan = (strictEffortOnly) => {
    let bestPace = null;
    let bestSpeed = 0;
    for (const lap of laps) {
      const phase = classifyLapPhase(lap);
      if (strictEffortOnly) {
        if (phase !== 'effort') continue;
      } else if (phase === 'recovery' || phase === 'cooldown') {
        continue;
      }
      const km = lapDistanceKm(lap);
      const sec = lapDurationSec(lap);
      if (km < 0.03 || sec < 5) continue;
      const pace = sec / km;
      const spd =
        lap.avgSpeedKmh != null && Number.isFinite(Number(lap.avgSpeedKmh)) && Number(lap.avgSpeedKmh) > 0
          ? Number(lap.avgSpeedKmh)
          : (km / sec) * 3600;
      if (bestPace == null || pace < bestPace) bestPace = pace;
      if (spd > bestSpeed) bestSpeed = spd;
    }
    return bestPace != null ? { bestPaceSecPerKm: bestPace, bestSpeedKmh: bestSpeed } : null;
  };

  return scan(true) || scan(false);
}

/**
 * @returns {'interval'|'endurance'|null} null = autre cardio (vélo, elliptique, etc.)
 */
export function getGarminCardioActivityRunKind(gAct) {
  if (!isGarminRunningLikeActivity(gAct)) return null;
  return inferRunningSessionTypeFromGarminActivity(gAct);
}
