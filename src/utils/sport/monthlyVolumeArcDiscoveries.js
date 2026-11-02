/**
 * Arcs de volume multi-mois : détection + rédaction.
 * Calcule depuis repsByDate (pas de constantes historiques hardcodées).
 */

function ymOf(ymd) {
  return String(ymd || '').slice(0, 7);
}

function monthLabelFr(ym) {
  const [y, m] = String(ym).split('-').map(Number);
  if (!y || !m) return String(ym);
  try {
    return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  } catch {
    return String(ym);
  }
}

function fmtInt(n) {
  return Math.round(Number(n) || 0).toLocaleString('fr-FR');
}

function pct(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return ((a - b) / Math.abs(b)) * 100;
}

function fmtSignedPct(p) {
  if (p == null || !Number.isFinite(p)) return 'n/d';
  const r = Math.round(p);
  return `${r > 0 ? '+' : ''}${r} %`;
}

function daysInMonth(ym) {
  const [y, m] = String(ym).split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

/**
 * Agrège repsByDate en mois chronologiques.
 * @param {Record<string, number>|Map} repsByDate
 * @returns {{ ym: string, reps: number, days: number, repsPerDay: number|null }[]}
 */
export function buildChronologicalMonths(repsByDate) {
  const by = {};
  const entries =
    repsByDate instanceof Map
      ? [...repsByDate.entries()]
      : Object.entries(repsByDate || {});
  for (const [ymd, reps] of entries) {
    const r = Number(reps) || 0;
    if (r <= 0) continue;
    const ym = ymOf(ymd);
    if (!/^\d{4}-\d{2}$/.test(ym)) continue;
    if (!by[ym]) by[ym] = { ym, reps: 0, days: 0 };
    by[ym].reps += r;
    by[ym].days += 1;
  }
  return Object.values(by)
    .sort((a, b) => a.ym.localeCompare(b.ym))
    .map((m) => ({
      ...m,
      repsPerDay: m.days > 0 ? m.reps / m.days : null
    }));
}

/**
 * Un mois est « incomplet » s’il est le mois de fin de fenêtre et
 * qu’il couvre trop peu de jours calendaires pour une comparaison loyale.
 */
export function isIncompleteRecentMonth(month, windowEndYmd, { minCoveredDays = 20 } = {}) {
  if (!month?.ym || !windowEndYmd) return false;
  if (ymOf(windowEndYmd) !== month.ym) return false;
  const dim = daysInMonth(month.ym);
  const dayOfEnd = Number(String(windowEndYmd).slice(8, 10)) || 0;
  const covered = Math.min(dayOfEnd, dim);
  return covered < minCoveredDays;
}

function decomposeDrop(from, to) {
  if (!from || !to || from.reps <= 0) {
    return { freqShare: null, densityShare: null, repsPct: null, daysPct: null, rpdPct: null };
  }
  const repsPct = pct(to.reps, from.reps);
  const daysPct = pct(to.days, from.days);
  const rpdPct =
    from.repsPerDay != null && to.repsPerDay != null ? pct(to.repsPerDay, from.repsPerDay) : null;
  // Approximation additive des contributions log : |Δjours| vs |Δrpd| sur la baisse de volume.
  const absDays = Math.abs(daysPct || 0);
  const absRpd = Math.abs(rpdPct || 0);
  const denom = absDays + absRpd;
  const freqShare = denom > 0 ? absDays / denom : null;
  const densityShare = denom > 0 ? absRpd / denom : null;
  return { freqShare, densityShare, repsPct, daysPct, rpdPct };
}

/**
 * @returns {{ arcKind: string, peak: object, trough: object, recent: object, mechanism: object }|null}
 */
export function detectMonthlyVolumeArcShape(months, { windowEndYmd = null } = {}) {
  const usable = (months || []).filter((m) => m.reps >= 80 && m.days >= 4);
  if (usable.length < 3) return null;

  let recent = usable[usable.length - 1];
  let series = usable;
  if (isIncompleteRecentMonth(recent, windowEndYmd)) {
    series = usable.slice(0, -1);
    recent = series[series.length - 1];
  }
  if (series.length < 3) return null;

  let peakIdx = 0;
  for (let i = 1; i < series.length; i += 1) {
    if (series[i].reps > series[peakIdx].reps) peakIdx = i;
  }
  const peak = series[peakIdx];

  // Creux après le sommet
  let troughIdx = peakIdx;
  for (let i = peakIdx + 1; i < series.length; i += 1) {
    if (series[i].reps < series[troughIdx].reps) troughIdx = i;
  }
  const trough = series[troughIdx];
  const dropFromPeak = pct(trough.reps, peak.reps);
  if (dropFromPeak == null || dropFromPeak > -20 || troughIdx <= peakIdx) {
    // Pas de baisse multi-mois nette après sommet
    // Essayer stabilité / progression simple fin de série
    const a = series[series.length - 3];
    const b = series[series.length - 2];
    const c = series[series.length - 1];
    const ab = pct(b.reps, a.reps);
    const bc = pct(c.reps, b.reps);
    if (ab != null && bc != null && ab > 12 && Math.abs(bc) < 10) {
      return {
        arcKind: 'stabilization_after_rise',
        peak: b,
        trough: a,
        recent: c,
        mechanism: decomposeDrop(a, b)
      };
    }
    return null;
  }

  const riseFromTrough = pct(recent.reps, trough.reps);
  const stillBelowPeak = pct(recent.reps, peak.reps);
  let arcKind = 'prolonged_decline';
  if (troughIdx < series.length - 1 && riseFromTrough != null && riseFromTrough >= 10) {
    if (stillBelowPeak != null && stillBelowPeak > -12) arcKind = 'full_recovery';
    else arcKind = 'partial_recovery';
  } else if (troughIdx === series.length - 1 && peakIdx <= series.length - 3) {
    arcKind = 'prolonged_decline';
  }

  const mechFrom = peak;
  const mechTo = arcKind === 'prolonged_decline' ? trough : trough;
  const mechanism = decomposeDrop(mechFrom, mechTo);

  // Si reprise : mécanisme du creux → récent aussi
  if (arcKind === 'partial_recovery' || arcKind === 'full_recovery') {
    mechanism.recovery = decomposeDrop(trough, recent);
  }

  return { arcKind, peak, trough, recent, mechanism, months: series };
}

function titleForArc(shape) {
  const { arcKind, peak, trough, recent, mechanism } = shape;
  const freqLed =
    mechanism.freqShare != null &&
    mechanism.densityShare != null &&
    mechanism.freqShare >= 0.55 &&
    (mechanism.repsPct || 0) < -15;

  if (arcKind === 'partial_recovery') {
    return `${monthLabelFr(recent.ym)} interrompt la baisse depuis ${monthLabelFr(peak.ym)}`;
  }
  if (arcKind === 'full_recovery') {
    return `${monthLabelFr(recent.ym)} revient près du niveau de ${monthLabelFr(peak.ym)}`;
  }
  if (arcKind === 'stabilization_after_rise') {
    return `Stabilisation après la hausse de ${monthLabelFr(peak.ym)}`;
  }
  if (freqLed) {
    return 'La fréquence explique l’essentiel du recul';
  }
  return `Recul prolongé de ${monthLabelFr(peak.ym)} à ${monthLabelFr(trough.ym)}`;
}

function bodyForArc(shape) {
  const { arcKind, peak, trough, recent, mechanism } = shape;
  const peakL = monthLabelFr(peak.ym);
  const troughL = monthLabelFr(trough.ym);
  const recentL = monthLabelFr(recent.ym);
  const dropBits = `${peakL} : ${fmtInt(peak.reps)} reps en ${peak.days} jours entraînés (≈${fmtInt(peak.repsPerDay)} / jour actif) → ${troughL} : ${fmtInt(trough.reps)} reps en ${trough.days} jours (≈${fmtInt(trough.repsPerDay)} / jour actif), soit ${fmtSignedPct(mechanism.repsPct)} de volume, ${fmtSignedPct(mechanism.daysPct)} de jours, ${fmtSignedPct(mechanism.rpdPct)} de volume par jour actif.`;

  let mech = '';
  if (mechanism.freqShare != null && mechanism.densityShare != null) {
    if (mechanism.freqShare >= 0.55) {
      mech = ` La baisse vient surtout de la fréquence (environ ${Math.round(mechanism.freqShare * 100)} % du mouvement mesurable), pas d’un effondrement du volume par journée active.`;
    } else if (mechanism.densityShare >= 0.55) {
      mech = ` La baisse vient surtout du volume par journée active (environ ${Math.round(mechanism.densityShare * 100)} % du mouvement mesurable), la fréquence jouant un rôle moindre.`;
    } else {
      mech = ' Fréquence et volume par jour actif contribuent tous les deux au recul.';
    }
  }

  if (arcKind === 'partial_recovery') {
    const rec = mechanism.recovery || {};
    return `${dropBits}${mech} ${recentL} remonte à ${fmtInt(recent.reps)} reps en ${recent.days} jours (≈${fmtInt(recent.repsPerDay)} / jour actif, ${fmtSignedPct(rec.repsPct)} vs ${troughL}), sans retrouver le sommet de ${peakL} (${fmtInt(peak.reps)} reps).`;
  }
  if (arcKind === 'full_recovery') {
    return `${dropBits}${mech} ${recentL} revient à ${fmtInt(recent.reps)} reps (${recent.days} j.), proche du niveau de ${peakL}.`;
  }
  if (arcKind === 'stabilization_after_rise') {
    return `Après la hausse vers ${peakL} (${fmtInt(peak.reps)} reps, ${peak.days} j.), ${recentL} se maintient à ${fmtInt(recent.reps)} reps en ${recent.days} jours — une stabilisation, pas une nouvelle accélération.`;
  }
  return `${dropBits}${mech} Aucune reprise nette n’est encore visible sur le dernier mois comparable (${recentL}).`;
}

/**
 * Producteur de découvertes d’arcs mensuels.
 * @returns {object[]} partials compatibles avec discovery()
 */
export function buildMonthlyVolumeArcDiscoveries(repsByDate, opts = {}) {
  const months = buildChronologicalMonths(repsByDate);
  const shape = detectMonthlyVolumeArcShape(months, {
    windowEndYmd: opts.windowEndYmd || null
  });
  if (!shape) return [];

  const title = titleForArc(shape);
  const body = bodyForArc(shape);
  const { peak, trough, recent, mechanism, arcKind } = shape;

  return [
    {
      kind: 'disc_monthly_volume_arc',
      nature: 'journey',
      family: 'monthly_volume_arc',
      title,
      body,
      evidence: `${monthLabelFr(peak.ym)} ${fmtInt(peak.reps)} → ${monthLabelFr(trough.ym)} ${fmtInt(trough.reps)} → ${monthLabelFr(recent.ym)} ${fmtInt(recent.reps)}`,
      weights: { importance: 0.97, reliability: 0.92, novelty: 0.94, fit: 0.98 },
      metrics: {
        arcKind,
        peakYm: peak.ym,
        troughYm: trough.ym,
        recentYm: recent.ym,
        peakReps: peak.reps,
        troughReps: trough.reps,
        recentReps: recent.reps,
        peakDays: peak.days,
        troughDays: trough.days,
        recentDays: recent.days,
        peakRepsPerDay: peak.repsPerDay,
        troughRepsPerDay: trough.repsPerDay,
        recentRepsPerDay: recent.repsPerDay,
        freqShareOfDrop: mechanism.freqShare,
        densityShareOfDrop: mechanism.densityShare,
        repsPct: mechanism.repsPct,
        daysPct: mechanism.daysPct,
        rpdPct: mechanism.rpdPct,
        incompleteRecentExcluded: Boolean(
          opts.windowEndYmd && isIncompleteRecentMonth(months[months.length - 1], opts.windowEndYmd)
        ),
        trajectoryOk: true,
        trajectoryRichness: 9,
        trajectoryPrimaryStory:
          arcKind === 'partial_recovery'
            ? 'partial_recovery'
            : arcKind === 'full_recovery'
              ? 'recovered'
              : arcKind === 'prolonged_decline'
                ? 'net_decline'
                : 'net_rise',
        temporalScope: { interpretingWithHistory: true }
      }
    }
  ];
}

/**
 * Interruption de course : sorties présentes puis absentes ≥ 2 mois calendaires complets.
 * @param {{ date: string, km?: number }[]} runDays
 */
export function buildRunningGapDiscoveries(runDays, opts = {}) {
  const windowStart = opts.windowStartYmd;
  const windowEnd = opts.windowEndYmd;
  const rows = (runDays || [])
    .map((d) => ({ date: String(d.date || d.ymd || ''), km: Number(d.km) || 0 }))
    .filter((d) => d.date && (!windowStart || d.date >= windowStart) && (!windowEnd || d.date <= windowEnd))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (rows.length < 2) return [];

  const byMonth = {};
  rows.forEach((r) => {
    const ym = ymOf(r.date);
    if (!byMonth[ym]) byMonth[ym] = { ym, sessions: 0, km: 0 };
    byMonth[ym].sessions += 1;
    byMonth[ym].km += r.km;
  });

  // Mois de la fenêtre avec activité course
  const activeMonths = Object.values(byMonth).sort((a, b) => a.ym.localeCompare(b.ym));
  if (activeMonths.length < 1) return [];

  const lastActive = activeMonths[activeMonths.length - 1];
  if (!windowEnd) return [];
  const endYm = ymOf(windowEnd);
  // Compter les mois calendaires strictement après lastActive jusqu’à endYm (hors mois courant incomplet)
  const gapMonths = [];
  let [y, m] = lastActive.ym.split('-').map(Number);
  for (let guard = 0; guard < 36; guard += 1) {
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    const ym = `${y}-${String(m).padStart(2, '0')}`;
    if (ym > endYm) break;
    if (ym === endYm && isIncompleteRecentMonth({ ym }, windowEnd)) break;
    if (!byMonth[ym]) gapMonths.push(ym);
  }
  if (gapMonths.length < 2) return [];

  const first = activeMonths[0];
  const peak = activeMonths.reduce((a, b) => (b.sessions > a.sessions ? b : a), activeMonths[0]);
  const title = `Aucune sortie de course enregistrée après ${monthLabelFr(lastActive.ym)}`;
  const body = `Des sorties sont documentées de ${monthLabelFr(first.ym)} à ${monthLabelFr(lastActive.ym)} (${activeMonths.reduce((s, x) => s + x.sessions, 0)} sorties, dont un pic de ${peak.sessions} en ${monthLabelFr(peak.ym)}). Sur ${gapMonths.length} mois calendaires suivants comparables (${monthLabelFr(gapMonths[0])} → ${monthLabelFr(gapMonths[gapMonths.length - 1])}), aucune sortie enregistrée n’apparaît. Absence de données de course — pas une affirmation sur l’activité physique globale.`;

  return [
    {
      kind: 'disc_running_gap',
      nature: 'journey',
      family: 'running_gap',
      title,
      body,
      evidence: `dernière ${monthLabelFr(lastActive.ym)} · trou ${gapMonths.length} mois`,
      weights: { importance: 0.93, reliability: 0.9, novelty: 0.92, fit: 0.95 },
      metrics: {
        lastActiveYm: lastActive.ym,
        gapMonths,
        sessionCount: activeMonths.reduce((s, x) => s + x.sessions, 0),
        peakYm: peak.ym,
        peakSessions: peak.sessions,
        trajectoryOk: true,
        trajectoryRichness: 7,
        trajectoryPrimaryStory: 'net_decline',
        temporalScope: { interpretingWithHistory: true }
      }
    }
  ];
}
