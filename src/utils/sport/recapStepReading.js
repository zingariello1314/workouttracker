/**
 * Pas du jour (Garmin), comparés au niveau déjà mesuré de la personne.
 * Pas de carte si la série est trop courte ou si l'écart reste sous 12 %.
 */

const HABIT_GAP = 12;

function median(nums) {
  const sorted = [...nums].filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function pct(now, before) {
  if (before == null || before <= 0 || now == null) return null;
  return ((now - before) / before) * 100;
}

function stepsIn(dailyMetrics, start, end) {
  const dm = dailyMetrics || {};
  const rows = [];
  Object.keys(dm).forEach((date) => {
    if (!date || date < start || date > end) return;
    const steps = Number(dm[date]?.steps);
    if (Number.isFinite(steps) && steps > 0) rows.push({ date, steps });
  });
  return rows;
}

function fmt(n) {
  return Math.round(n).toLocaleString('fr-FR');
}

/**
 * @returns {Array<{ title: string, body: string, evidence: string, nature: string }>}
 */
export function describeStepReadings({
  dailyMetrics = {},
  start,
  end,
  trainingDates = [],
  thisPeriod = 'cette période'
} = {}) {
  if (!start || !end) return [];
  const current = stepsIn(dailyMetrics, start, end);
  if (current.length < 5) return [];
  const out = [];
  const nowMed = median(current.map((row) => row.steps));
  const priorEnd = shift(start, -1);
  const priorStart = shift(start, -30);
  const prior = stepsIn(dailyMetrics, priorStart, priorEnd);
  const priorMed = prior.length >= 5 ? median(prior.map((row) => row.steps)) : null;
  const delta = pct(nowMed, priorMed);
  if (delta != null && Math.abs(delta) >= HABIT_GAP) {
    const up = delta > 0;
    out.push({
      nature: 'trajectory',
      title: up
        ? `Les pas de ${thisPeriod} sont au-dessus de ton niveau des 30 jours d'avant`
        : `Les pas de ${thisPeriod} sont en dessous de ton niveau des 30 jours d'avant`,
      body: `Les jours avec un compte de pas se situent autour de ${fmt(nowMed)} pas (médiane, ${current.length} jours). Sur les 30 jours d'avant, la médiane est ${fmt(priorMed)} pas (${prior.length} jours), soit environ ${Math.abs(Math.round(delta))} % ${up ? 'de plus' : 'de moins'}. Ce n'est pas une séance : c'est le déplacement quotidien, à côté de l'entraînement.`,
      evidence: `${fmt(nowMed)} vs ${fmt(priorMed)} pas`
    });
  }

  const trained = new Set(trainingDates);
  const on = current.filter((row) => trained.has(row.date)).map((row) => row.steps);
  const off = current.filter((row) => !trained.has(row.date)).map((row) => row.steps);
  const onMed = on.length >= 4 ? median(on) : null;
  const offMed = off.length >= 4 ? median(off) : null;
  const split = pct(offMed, onMed);
  if (split != null && Math.abs(split) >= HABIT_GAP) {
    const quieter = split < 0;
    out.push({
      nature: 'now',
      title: quieter
        ? 'Les jours sans séance portent moins de pas que les jours entraînés'
        : 'Les jours sans séance portent plus de pas que les jours entraînés',
      body: `Sur ${thisPeriod}, les jours entraînés tournent autour de ${fmt(onMed)} pas (${on.length} jours) et les jours sans séance autour de ${fmt(offMed)} pas (${off.length} jours). L'écart est d'environ ${Math.abs(Math.round(split))} %. Les pas ne remplacent pas la séance : ils disent comment le jour bouge en dehors d'elle.`,
      evidence: `entraîné ${fmt(onMed)} · sans séance ${fmt(offMed)}`
    });
  }
  return out;
}

function shift(ymd, days) {
  const [y, m, d] = String(ymd).split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setDate(date.getDate() + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}
