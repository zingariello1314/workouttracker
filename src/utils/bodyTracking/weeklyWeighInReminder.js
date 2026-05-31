/**
 * Rappel pesée hebdomadaire (jour configuré dans Impédancemètre).
 * Affiche à partir du jour choisi jusqu’à saisie impédance dans la fenêtre [dernier jour dû, prochain).
 */

function toYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseYmd(ymd) {
  const [y, m, d] = String(ymd).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(fromYmd, toYmd) {
  const a = parseYmd(fromYmd);
  const b = parseYmd(toYmd);
  if (!a || !b) return 0;
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

/**
 * Dernier jour de pesée prévu (jour de la semaine cfg) au plus tard à viewDate.
 * @param {Date} viewDate
 * @param {number} weekday 0=dim … 6=sam
 */
export function lastDueWeighInDate(viewDate, weekday) {
  const v = startOfDay(viewDate instanceof Date ? viewDate : new Date(viewDate));
  const d = new Date(v);
  while (d.getDay() !== weekday) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

/**
 * @param {object} params
 * @param {number|null|undefined} params.weeklyWeighInDay 0–6
 * @param {Date|string} [params.viewDate]
 * @param {Array<{ type?: string, date?: string }>} [params.progressEntries]
 */
export function computeWeeklyWeighInReminder({
  weeklyWeighInDay,
  viewDate = new Date(),
  progressEntries = []
}) {
  if (weeklyWeighInDay === undefined || weeklyWeighInDay === null) {
    return { show: false, daysOverdue: 0, dueDateYmd: null, nextDueDateYmd: null };
  }

  const cfg = Number(weeklyWeighInDay);
  if (!Number.isFinite(cfg) || cfg < 0 || cfg > 6) {
    return { show: false, daysOverdue: 0, dueDateYmd: null, nextDueDateYmd: null };
  }

  const view = startOfDay(viewDate instanceof Date ? viewDate : new Date(viewDate));
  const due = lastDueWeighInDate(view, cfg);
  const dueYmd = toYmd(due);
  const nextDue = new Date(due);
  nextDue.setDate(nextDue.getDate() + 7);
  const nextDueYmd = toYmd(nextDue);
  const viewYmd = toYmd(view);

  const hasEntryInWindow = progressEntries.some((e) => {
    if (!e || e.type !== 'impedance' || !e.date) return false;
    const ymd = String(e.date).slice(0, 10);
    return ymd >= dueYmd && ymd < nextDueYmd;
  });

  if (hasEntryInWindow) {
    return { show: false, daysOverdue: 0, dueDateYmd: dueYmd, nextDueDateYmd: nextDueYmd };
  }

  const daysOverdue = daysBetween(dueYmd, viewYmd);

  return {
    show: true,
    daysOverdue,
    dueDateYmd: dueYmd,
    nextDueDateYmd: nextDueYmd,
    isDueToday: daysOverdue === 0
  };
}

/**
 * @param {number} daysOverdue
 */
export function weighInReminderMessageFr(daysOverdue) {
  if (daysOverdue <= 0) {
    return "C'est ton jour de pesée — touche pour enregistrer ta mesure (impédancemètre).";
  }
  if (daysOverdue === 1) {
    return 'Pesée attendue depuis 1 jour — touche pour compléter ta saisie.';
  }
  return `Pesée attendue depuis ${daysOverdue} jours — touche pour compléter ta saisie.`;
}

/**
 * @param {number} daysOverdue
 */
export function weighInReminderTitleFr(daysOverdue) {
  if (daysOverdue <= 0) return 'Pesée du jour';
  if (daysOverdue === 1) return 'Pesée en retard (1 jour)';
  return `Pesée en retard (${daysOverdue} jours)`;
}
