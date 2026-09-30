/**
 * Dossier de preuves. Range des mesures déjà calculées.
 * Ne crée pas de seuil de détecteur. Le rédacteur ne lit pas le snapshot.
 */

import { addCalendarDays, inclusiveCalendarSpanDays } from './garminRunningPeriodStats';
import { daysBetweenYmd, formatDayFr } from './recapTrainingTimeline';
import { resolveExercisePerformance } from './exercisePerformanceUnit';
import { analyzeSleepRhythm } from './sleepRhythmAnalysis';
import { formatClockFr } from './sleepRhythmClock';
import { writeThreadCard } from './recapAnalysisDepth';
import { SENSE_NATURE, THREADS } from './recapAnalysisThreads';

const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
];

function monthLabel(ym) {
  const [y, m] = String(ym || '').split('-');
  const idx = Number(m) - 1;
  if (!y || !MONTHS[idx]) return ym;
  return `${MONTHS[idx]} ${y}`;
}

function num(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : null;
}

function shareOf(part, total) {
  const p = num(part);
  const t = num(total);
  if (p == null || t == null || t <= 0) return null;
  return Math.round((p / t) * 1000) / 10;
}

function durationLabel(minutes) {
  const m = num(minutes);
  if (m == null || m < 20) return null;
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  if (h <= 0) return `${min} min`;
  return min ? `${h} h ${String(min).padStart(2, '0')}` : `${h} h`;
}

function peakOf(measure) {
  const peak = measure?.peakDay;
  if (!peak || !num(peak.reps)) return null;
  const names = (peak.exercises || []).slice(0, 4).map((e) => `${e.reps} ${e.name}`).filter(Boolean);
  const others = num(measure.totalReps) != null ? Math.max(0, measure.totalReps - peak.reps) : null;
  return {
    dateLabel: formatDayFr(peak.date, true),
    reps: peak.reps,
    share: shareOf(peak.reps, measure.totalReps),
    exerciseNames: names,
    otherDaysReps: others
  };
}

function familiesOf(measure) {
  return (measure?.muscles || [])
    .filter((m) => num(m.reps) > 0)
    .slice(0, 4)
    .map((m) => ({ label: m.label, reps: Math.round(m.reps) }));
}

function lastSession(catalog, end) {
  const rows = (catalog || []).filter((r) => r?.date && r.date <= end && num(r.totalReps) > 0);
  return rows.length ? rows[rows.length - 1] : null;
}

function observedFrom(measure, catalog, voice) {
  const pending = voice === 'today' && (num(measure?.totalReps) || 0) < 20;
  const last = pending ? lastSession(catalog, measure?.window?.end) : null;
  const peak = peakOf(measure);
  const families = familiesOf(measure);
  const reps = pending ? 0 : num(measure?.totalReps);
  return {
    reps,
    sessions: num(measure?.trainingDays),
    repsPerSession: pending ? null : num(measure?.repsPerSession),
    pending,
    lastSession: last
      ? {
          dateLabel: formatDayFr(last.date, true),
          reps: last.totalReps,
          durationLabel: voice === 'today' || voice === '7d' ? durationLabel(last.minutes) : null,
          exerciseNames: (last.exercises || []).slice(0, 4).map((e) => `${e.reps} ${e.name}`)
        }
      : null,
    peak: pending ? null : peak,
    families,
    exerciseNames: (measure?.exercises || []).slice(0, 4).map((e) => `${e.reps} ${e.name}`),
    pushReps: num(measure?.pushReps),
    pullReps: num(measure?.pullReps)
  };
}

function comparisonFrom(label, measure) {
  if (!measure || !(num(measure.totalReps) > 0)) return null;
  return {
    label,
    reps: measure.totalReps,
    sessions: num(measure.trainingDays)
  };
}

/**
 * Lecture déjà prévue par le plan : une part ne suffit pas sans lecture.
 * 40 % vient de la spec (la semaine confirme ou ne résume pas).
 */
function continuityFrom(narrowLabel, narrow, wideLabel, wide) {
  const narrowReps = num(narrow?.totalReps);
  const wideReps = num(wide?.totalReps);
  if (!(narrowReps > 0) || !(wideReps >= narrowReps)) return null;
  const share = shareOf(narrowReps, wideReps);
  if (share == null) return null;
  const thin = (num(wide.trainingDays) || 0) < 2;
  const reading = thin
    ? 'manque de recul'
    : share >= 40
      ? 'pic confirmé'
      : 'pic relativisé';
  const status = thin ? 'too_early' : share >= 40 ? 'confirmed' : 'infirmed';
  return {
    status,
    reading,
    share,
    narrowLabel,
    wideLabel,
    narrowReps,
    wideReps,
    narrowSessions: num(narrow.trainingDays),
    wideSessions: num(wide.trainingDays)
  };
}

function repertoireFrom(period, previous) {
  const now = new Map((period?.exercises || []).map((e) => [String(e.id), e]));
  const before = new Map((previous?.exercises || []).map((e) => [String(e.id), e]));
  let entered = null;
  now.forEach((ex) => {
    if (before.has(String(ex.id))) return;
    if (!entered || ex.reps > entered.reps) entered = { name: ex.name, reps: ex.reps };
  });
  let exited = null;
  before.forEach((ex) => {
    if (now.has(String(ex.id))) return;
    if (!exited || ex.reps > exited.reps) exited = { name: ex.name, reps: ex.reps };
  });
  if (!entered && !exited) return null;
  return { entered, exited };
}

function seriesFrom(snapshot, measure) {
  const exercises = measure?.exercises || [];
  const dates = Object.keys(measure?.exercisesByDate || {});
  let best = null;
  let totalOnly = null;
  exercises.forEach((ex) => {
    dates.forEach((date) => {
      const key = `${date}_${ex.id}`;
      const row = resolveExercisePerformance(snapshot, key);
      if (row.provenance === 'structured' && row.unit === 'reps' && num(row.observed?.bestSet) > 0) {
        const setCount = Array.isArray(snapshot?.exerciseSetLogs?.[key]?.sets)
          ? snapshot.exerciseSetLogs[key].sets.length
          : null;
        if (!best || row.observed.bestSet > best.bestSet) {
          best = {
            name: ex.name,
            bestSet: row.observed.bestSet,
            setCount,
            volume: num(row.sessionTotal),
            officialReps: num(row.official?.reps) > 0 ? row.official.reps : null
          };
        }
      } else if (!best && row.provenance === 'total_only' && num(row.sessionTotal) > 0 && !totalOnly) {
        totalOnly = { name: ex.name, totalOnly: true, volume: row.sessionTotal, bestSet: null };
      }
    });
  });
  return best || totalOnly;
}

function splitBlocks(measure) {
  const start = measure?.window?.start;
  const end = measure?.window?.end;
  const byDate = measure?.repsByDate || {};
  if (!start || !end) return null;
  const span = inclusiveCalendarSpanDays(start, end);
  if (span < 60) return null;
  const mid = addCalendarDays(start, Math.floor(span / 2));
  const sumRange = (from, to) => {
    let reps = 0;
    let sessions = 0;
    Object.keys(byDate).forEach((date) => {
      if (date < from || date > to) return;
      const r = num(byDate[date]) || 0;
      if (r <= 0) return;
      reps += r;
      sessions += 1;
    });
    return { reps, sessions };
  };
  const a = sumRange(start, addCalendarDays(mid, -1));
  const b = sumRange(mid, end);
  if (!(a.reps > 0) || !(b.reps > 0)) return null;
  return {
    a: { ...a, label: `${monthLabel(start.slice(0, 7))} – ${monthLabel(addCalendarDays(mid, -1).slice(0, 7))}` },
    b: { ...b, label: `${monthLabel(mid.slice(0, 7))} – ${monthLabel(end.slice(0, 7))}` }
  };
}

function coverageFrom(measure) {
  const byDate = measure?.repsByDate || {};
  const dates = Object.keys(byDate).filter((d) => num(byDate[d]) > 0).sort();
  if (dates.length < 2) return null;
  const byMonth = new Map();
  dates.forEach((date) => {
    const ym = date.slice(0, 7);
    byMonth.set(ym, (byMonth.get(ym) || 0) + (num(byDate[date]) || 0));
  });
  const months = [...byMonth.entries()];
  if (months.length < 2) return null;
  const high = months.reduce((a, b) => (b[1] > a[1] ? b : a));
  const low = months.reduce((a, b) => (b[1] < a[1] ? b : a));
  if (high[0] === low[0]) return null;
  const first = dates[0];
  const late = daysBetweenYmd(measure.window?.start, first) > 60;
  return {
    firstDateLabel: formatDayFr(first, true),
    late: Boolean(late),
    high: { label: monthLabel(high[0]), reps: high[1] },
    low: { label: monthLabel(low[0]), reps: low[1] }
  };
}

function monthLead(measure) {
  const byDate = measure?.repsByDate || {};
  const byMonth = new Map();
  const days = new Map();
  Object.keys(byDate).forEach((date) => {
    const reps = num(byDate[date]) || 0;
    if (reps <= 0) return;
    const ym = date.slice(0, 7);
    byMonth.set(ym, (byMonth.get(ym) || 0) + reps);
    days.set(ym, (days.get(ym) || 0) + 1);
  });
  if (!byMonth.size) return null;
  const top = [...byMonth.entries()].sort((a, b) => b[1] - a[1])[0];
  return { label: monthLabel(top[0]), reps: top[1], sessions: days.get(top[0]) || 0 };
}

function axesFor(base) {
  const axes = [];
  const o = base.observed || {};
  if (num(o.reps) > 0 || o.pending) axes.push('volume');
  if (num(o.sessions) > 0 && !o.pending) axes.push('frequency');
  if (o.peak?.reps) axes.push('concentration');
  if ((o.exerciseNames || []).length || o.lastSession?.exerciseNames?.length) axes.push('exercises');
  if ((o.families || []).length) axes.push('families');
  if (num(o.pushReps) > 0 || num(o.pullReps) > 0) axes.push('pushPull');
  if (o.series) axes.push('series');
  if (o.repertoire) axes.push('repertoire');
  if (base.comparison) axes.push('comparison');
  if (base.continuity?.reading) axes.push('continuity');
  if (base.blocks) axes.push('blocks');
  if (base.coverage) axes.push('coverage');
  if (base.sleep) axes.push('sleep');
  return axes;
}

function dossier(thread, sense, voice, windowLabel, partial) {
  const row = {
    thread,
    sense,
    voice,
    windowLabel,
    observed: partial.observed || {},
    comparison: partial.comparison || null,
    continuity: partial.continuity || null,
    blocks: partial.blocks || null,
    coverage: partial.coverage || null,
    sleep: partial.sleep || null
  };
  row.axes = axesFor(row);
  if (thread === 'continuity') {
    row.axes = row.continuity?.reading ? ['continuity', 'volume'] : [];
  }
  if (thread === 'series') row.axes = row.observed?.series ? ['series', 'volume'] : [];
  if (thread === 'pushPull') {
    const push = num(row.observed?.pushReps);
    const pull = num(row.observed?.pullReps);
    row.axes = push != null && pull != null && (push > 0 || pull > 0) ? ['pushPull', 'volume'] : [];
  }
  if (thread === 'composition') row.axes = (row.observed?.families || []).length ? ['families', 'volume'] : [];
  if (thread === 'repertoire') row.axes = row.observed?.repertoire ? ['repertoire', 'volume'] : [];
  if (thread === 'sleepPlacement' || thread === 'sleepRegularity' || thread === 'sleepLink') {
    row.axes = row.sleep ? ['sleep'] : [];
  }
  return row;
}

function windowLabel(voice) {
  if (voice === 'today') return "Aujourd'hui";
  if (voice === '7d') return 'Ces 7 jours';
  if (voice === '30d') return 'Ces 30 jours';
  if (voice === '3m') return 'Ces trois mois';
  if (voice === '6m') return 'Ces six mois';
  return 'Depuis le début compté';
}

function parentContinuity(voice, cmp) {
  if (voice === '7d') return continuityFrom('ces 7 jours', cmp.d7, 'les 30 jours', cmp.d30);
  if (voice === '30d') return continuityFrom('les 7 derniers jours', cmp.d7, 'ces 30 jours', cmp.period);
  if (voice === '3m' || voice === '6m' || voice === '1y') {
    return continuityFrom('les 30 derniers jours', cmp.d30, windowLabel(voice).toLowerCase(), cmp.period);
  }
  return null;
}

export function buildThreadDossiers({ comparisons, catalog = [], snapshot = null } = {}) {
  if (!comparisons?.period) return [];
  const voice = comparisons.periodId || '7d';
  if (!['today', '7d', '30d', '3m', '6m', '1y'].includes(voice)) return [];
  const period = comparisons.period;
  const observed = observedFrom(period, catalog, voice);
  const previous = voice === '30d' || voice === '7d' || voice === 'today'
    ? comparisonFrom('Les 30 jours d\'avant', comparisons.prev30)
    : voice === '3m'
      ? comparisonFrom('Le mois précédent dans la fenêtre', comparisons.prev30)
      : null;
  const todayReps = num(period.totalReps);
  const continuity = voice === 'today'
    ? (todayReps > 0
        ? continuityFrom("aujourd'hui", period, 'les 7 jours', comparisons.d7)
        : null)
    : parentContinuity(voice, comparisons);
  if (voice === 'today' && !(todayReps > 0) && observed.lastSession) {
    const wide = num(comparisons.d7?.totalReps);
    const reps = num(observed.lastSession.reps);
    const share = wide != null && reps != null && wide >= reps ? shareOf(reps, wide) : null;
    if (share != null && share <= 100) {
      observed.lastSessionShare = { reps, share, wideReps: wide };
    }
  }
  const blocks = voice === '6m' ? splitBlocks(period) : null;
  const coverage = voice === '1y' ? coverageFrom(period) : null;
  const lead = voice === '3m' ? monthLead(period) : null;
  if (lead && observed.peak) {
    observed.peak = { ...observed.peak, monthLead: lead };
  }
  observed.repertoire = repertoireFrom(period, comparisons.prev30);
  observed.series = seriesFrom(snapshot, period);
  if (lead) observed.monthLead = lead;

  const label = windowLabel(voice);
  const common = { observed, comparison: previous, continuity, blocks, coverage };
  const senses = ['fact', 'relation', 'transformation'];
  const threads = ['concentration', 'rhythm', 'composition', 'repertoire', 'pushPull', 'series', 'continuity'];
  return threads.flatMap((thread) => senses.map((sense) => dossier(thread, sense, voice, label, common)));
}

function sleepPack(profile, cards) {
  const has = (kind) => (cards || []).some((c) => c.kind === kind);
  if (!profile?.n) return null;
  const pack = { level: profile.level, n: profile.n };
  if (has('disc_sleep_rhythm_obs') || has('disc_sleep_rhythm_habit')) {
    pack.bedLabel = profile.bed?.median != null ? formatClockFr(profile.bed.median) : null;
    pack.wakeLabel = profile.wake?.median != null ? formatClockFr(profile.wake.median) : null;
  }
  const reg = (cards || []).find((c) => c.kind === 'disc_sleep_regularity');
  if (reg) {
    pack.regularity = /groupés/i.test(reg.body) ? 'stable' : 'irregular';
    pack.iqrMin = profile.bed?.iqr != null ? Math.round(profile.bed.iqr) : null;
  }
  const weekend = (cards || []).find((c) => c.kind === 'disc_sleep_weekend');
  if (weekend) {
    pack.weekendAxes = weekend.evidence;
    pack.weekendGapMin = weekend.metrics?.weekendGapMin ?? null;
  }
  const ref = (cards || []).find((c) => c.kind === 'disc_sleep_reference');
  if (ref) pack.referenceLabel = ref.evidence;
  const tol = (cards || []).find((c) => c.kind === 'disc_sleep_tolerance');
  if (tol) pack.associationLabel = tol.body;
  const drift = (cards || []).find((c) => c.kind === 'disc_sleep_drift');
  if (drift?.metrics?.axis) {
    const axisFr = { rhythm: 'le coucher et le lever', bed: 'le coucher', wake: 'le lever' };
    pack.driftAxis = axisFr[drift.metrics.axis] || null;
    pack.driftMin = drift.metrics.driftMin != null ? Math.abs(drift.metrics.driftMin) : null;
  }
  return pack;
}

export function rewriteSleepDiscoveries(cards, nights) {
  const profile = analyzeSleepRhythm(nights || []);
  const pack = sleepPack(profile, cards);
  if (!pack) return cards || [];
  return (cards || []).map((card) => {
    let thread = null;
    let sense = 'fact';
    if (card.kind === 'disc_sleep_rhythm_obs' || card.kind === 'disc_sleep_rhythm_habit') {
      thread = 'sleepPlacement';
    } else if (card.kind === 'disc_sleep_regularity') {
      thread = 'sleepRegularity';
    } else if (card.kind === 'disc_sleep_weekend' || card.kind === 'disc_sleep_reference' || card.kind === 'disc_sleep_tolerance') {
      thread = 'sleepLink';
      sense = 'relation';
    } else if (card.kind === 'disc_sleep_drift') {
      thread = 'sleepPlacement';
      sense = 'transformation';
    }
    if (!thread) return card;
    if (thread === 'sleepLink' || sense === 'transformation') return card;
    const text = writeThreadCard({
      thread,
      sense,
      voice: '30d',
      windowLabel: 'Le sommeil mesuré',
      axes: ['sleep'],
      sleep: pack,
      observed: {}
    });
    if (!text?.body) return card;
    return { ...card, title: text.title, body: text.body, evidence: card.evidence };
  });
}

function scoreOf(dossier) {
  const n = (dossier.axes || []).length;
  return Math.min(82, 58 + n * 3);
}

export function buildThreadDiscoveries(input) {
  return buildThreadDossiers(input)
    .map((row) => {
      const text = writeThreadCard(row);
      if (!text) return null;
      const meta = THREADS[row.thread];
      return {
        id: text.kind,
        kind: text.kind,
        nature: SENSE_NATURE[row.sense],
        family: meta.family,
        score: scoreOf(row),
        title: text.title,
        body: text.body,
        evidence: text.evidence,
        relevance: 0.9,
        metrics: { thread: row.thread, axes: text.axes, sense: row.sense }
      };
    })
    .filter(Boolean);
}
