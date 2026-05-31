/**
 * Shadow validation — ne génère rien, détecte dérives et contradictions.
 * Renforce la résilience du scalaire global sans revenir au multi-volume v3.
 */

function clamp(min, max, v) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Signaux contradictoires (score principal vs réalité).
 * @returns {Array<{ id: string, severity: 'info'|'warn', message: string }>}
 */
export function detectLoadContradictions(loadState, constraints = {}, trainingEvidence = null, loadAnalysis = null) {
  const out = [];
  if (!loadState) return out;

  const rec = Number(constraints.recoveryScore);
  const ev = trainingEvidence;
  const g = loadState.globalLoadFactor ?? 1;
  const structural = loadState.structuralLoadFactor ?? g;
  const history = loadState.historyLoadFactor ?? g;

  if (rec < 48 && (ev?.regularityScore ?? 0) > 0.8) {
    out.push({
      id: 'recovery_vs_regularity',
      severity: 'warn',
      message:
        'Récupération quiz limitée mais forte régularité enregistrée — le live pourra compenser légèrement si la séance se passe bien.'
    });
  }

  if (rec >= 75 && g <= 0.82) {
    out.push({
      id: 'recovery_ok_low_global',
      severity: 'info',
      message: 'Bonne récupération déclarée : marge pour monter le volume progressivement si tes logs suivent.'
    });
  }

  const align = ev?.sessionLoadAlignment28;
  if (align?.avgScore0to100 >= 85 && loadAnalysis?.loadRatio > 1.08) {
    out.push({
      id: 'alignment_vs_nervous',
      severity: 'warn',
      message:
        'Tu performes bien sur les reps mais la semaine type est nerveusement dense — priorité récupération sur le fractionné.'
    });
  }

  if (Math.abs(structural - history) > 0.12) {
    out.push({
      id: 'structural_history_divergence',
      severity: 'info',
      message: `Profil structurel (${Math.round(structural * 100)} %) et historique (${Math.round(history * 100)} %) divergent — le moteur utilise un mix prudent.`
    });
  }

  if (ev?.adjustments?.adherenceVolumeCut && g > 0.95) {
    out.push({
      id: 'adherence_global_mismatch',
      severity: 'warn',
      message: 'Adhérence en baisse : le volume global a été resserré malgré un profil encore ambitieux au quiz.'
    });
  }

  return out.slice(0, 4);
}

/**
 * Écart km planifié vs cible (phase 6).
 * @param {object|null} cardioKmCheck
 */
export function detectKmPlanContradiction(cardioKmCheck) {
  if (!cardioKmCheck?.targetKm || cardioKmCheck.aligned) return null;
  return {
    id: 'km_target_gap',
    severity: 'warn',
    message:
      cardioKmCheck.warningFr ||
      cardioKmCheck.reasonFr ||
      'Volume course planifié éloigné de la cible hebdomadaire.'
  };
}

/**
 * Enrichit shadow post-génération (km, compat).
 */
export function enrichShadowValidationFromWeeklyPlan(shadow, weeklyPlan) {
  if (!shadow) return shadow;
  const contradictions = [...(shadow.contradictions || [])];
  const km = detectKmPlanContradiction(weeklyPlan?.cardioKmCheck);
  if (km) contradictions.push(km);
  const userWarnings = [...(shadow.userWarnings || [])];
  if (km?.message && !userWarnings.includes(km.message)) userWarnings.push(km.message);
  const warnCount = contradictions.filter((c) => c.severity === 'warn').length + (shadow.flags || []).filter((f) => f.level === 'warn').length;
  return {
    ...shadow,
    contradictions,
    userWarnings: userWarnings.slice(0, 3),
    passed: warnCount === 0,
    shadowScore: warnCount
  };
}

/**
 * @param {object} input
 */
export function runShadowValidation(input = {}) {
  const {
    loadState,
    constraints = {},
    trainingEvidence = null,
    loadAnalysis = null,
    weekProfiles = null,
    activeDayKeys = [],
    answers = {}
  } = input;

  const flags = [];
  const g = loadState?.globalLoadFactor ?? 1;
  const rec = Number(constraints.recoveryScore);

  if (Number.isFinite(rec) && rec < 45 && g > 0.92) {
    flags.push({
      id: 'fatigue_consistency',
      level: 'warn',
      detail: 'globalLoad élevé malgré récupération quiz faible — vérifier cohérence.'
    });
  }

  if (trainingEvidence?.maturity === 'rich') {
    const vol28 = trainingEvidence.volumeKgReps28 || 0;
    const days = trainingEvidence.activeDays28 || 1;
    const perDay = vol28 / Math.max(1, days);
    if (perDay > 8000 && g < 0.88) {
      flags.push({
        id: 'volume_anomaly',
        level: 'info',
        detail: 'Historique volume élevé avec charge globale basse — marge live à la hausse possible.'
      });
    }
    if (perDay < 1500 && g > 1.02 && days >= 6) {
      flags.push({
        id: 'volume_anomaly_low',
        level: 'warn',
        detail: 'Charge globale haute mais peu de volume enregistré — risque de sur-planification.'
      });
    }
  }

  let cardioDays = 0;
  let strengthDays = 0;
  (activeDayKeys || []).forEach((k) => {
    const p = weekProfiles?.[k];
    if (!p) return;
    if (p.modality === 'cardio') cardioDays += 1;
    else strengthDays += 1;
  });
  const cardioDesire = answers?.cardioTrainingDesire;
  if (cardioDays >= 3 && strengthDays >= 4 && loadAnalysis?.loadRatio > 1) {
    flags.push({
      id: 'cardio_conflict',
      level: 'warn',
      detail: 'Beaucoup de cardio + force sur la semaine type — stress nerveux surveillé.'
    });
  }
  if (cardioDesire === 'minimal' && cardioDays >= 3) {
    flags.push({
      id: 'cardio_quiz_mismatch',
      level: 'info',
      detail: 'Quiz : peu de cardio souhaité, mais plusieurs jours cardio dans le plan.'
    });
  }

  const contradictions = detectLoadContradictions(loadState, constraints, trainingEvidence, loadAnalysis);
  const hasUpliftHint = flags.some((f) => f.id === 'volume_anomaly') || contradictions.some((c) => c.id === 'recovery_ok_low_global');
  const hasTightenHint =
    flags.some((f) => f.level === 'warn') || contradictions.some((c) => c.severity === 'warn');

  const liveBand = {
    min: hasTightenHint ? 0.82 : 0.85,
    max: hasUpliftHint ? 1.1 : 1.05,
    allowUplift: hasUpliftHint && !hasTightenHint
  };

  const shadowScore = flags.filter((f) => f.level === 'warn').length + contradictions.filter((c) => c.severity === 'warn').length;

  return {
    passed: shadowScore === 0,
    shadowScore,
    flags,
    contradictions,
    liveBand,
    userWarnings: [
      ...contradictions.map((c) => c.message),
      ...flags.filter((f) => f.level === 'warn').map((f) => f.detail)
    ].slice(0, 2)
  };
}
