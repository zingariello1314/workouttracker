/**
 * Rappel pesées : régime (date de début + N fois / semaine + jours) ou legacy (un jour/semaine).
 */

function toYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseYmd(ymd) {
  const [y, m, d] = String(ymd || '')
    .slice(0, 10)
    .split('-')
    .map(Number);
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

/** Lundi 00:00 de la semaine ISO-like (lundi → dimanche) contenant `viewDate`. */
export function mondayOfWeek(viewDate) {
  const v = startOfDay(viewDate instanceof Date ? viewDate : new Date(viewDate));
  const day = v.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  v.setDate(v.getDate() + diff);
  return v;
}

export function lastDueWeighInDate(viewDate, weekday) {
  const v = startOfDay(viewDate instanceof Date ? viewDate : new Date(viewDate));
  const d = new Date(v);
  while (d.getDay() !== weekday) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

export function defaultWeighInWeekdays(anchorYmd, timesPerWeek) {
  const n = Math.min(7, Math.max(1, Number(timesPerWeek) || 1));
  const anchor = parseYmd(anchorYmd) || new Date();
  const start = anchor.getDay();
  const step = Math.max(1, Math.floor(7 / n));
  const days = [];
  for (let i = 0; i < n; i += 1) {
    let d = (start + i * step) % 7;
    let guard = 0;
    while (days.includes(d) && guard < 8) {
      d = (d + 1) % 7;
      guard += 1;
    }
    days.push(d);
  }
  return days.sort((a, b) => a - b);
}

export function normalizeWeighInPrefs(prefs) {
  const p = prefs && typeof prefs === 'object' ? prefs : {};
  const anchor = p.weighInAnchorDate ? String(p.weighInAnchorDate).slice(0, 10) : null;
  let perWeek = Number(p.weighInsPerWeek);
  if (!Number.isFinite(perWeek) || perWeek < 1) {
    perWeek = p.weeklyWeighInDay != null && p.weeklyWeighInDay !== '' ? 1 : 0;
  }
  perWeek = Math.min(7, Math.max(0, Math.round(perWeek)));

  let weekdays = Array.isArray(p.weighInWeekdays)
    ? [...new Set(p.weighInWeekdays.map((d) => Number(d)).filter((d) => d >= 0 && d <= 6))]
    : [];

  const legacyDay =
    p.weeklyWeighInDay === undefined || p.weeklyWeighInDay === null || p.weeklyWeighInDay === ''
      ? null
      : Number(p.weeklyWeighInDay);

  if (weekdays.length === 0 && Number.isFinite(legacyDay) && legacyDay >= 0 && legacyDay <= 6) {
    weekdays = [legacyDay];
    if (!perWeek) perWeek = 1;
  }
  if (weekdays.length === 0 && perWeek > 0 && anchor) {
    weekdays = defaultWeighInWeekdays(anchor, perWeek);
  }
  if (weekdays.length > perWeek && perWeek > 0) {
    weekdays = weekdays.slice(0, perWeek);
  }
  if (weekdays.length < perWeek && perWeek > 0 && anchor) {
    const extra = defaultWeighInWeekdays(anchor, perWeek).filter((d) => !weekdays.includes(d));
    weekdays = [...weekdays, ...extra].slice(0, perWeek);
  }

  return {
    weighInAnchorDate: anchor && parseYmd(anchor) ? anchor : null,
    weighInsPerWeek: perWeek,
    weighInWeekdays: weekdays.sort((a, b) => a - b),
    weeklyWeighInDay: weekdays[0] ?? (Number.isFinite(legacyDay) ? legacyDay : null)
  };
}

function impedanceYmds(progressEntries) {
  const set = new Set();
  (progressEntries || []).forEach((e) => {
    if (!e || e.type !== 'impedance' || !e.date) return;
    const ymd = String(e.date).slice(0, 10);
    if (parseYmd(ymd)) set.add(ymd);
  });
  return set;
}

/**
 * @param {object} params
 * @param {object} [params.prefs] bodyTrackingPrefs
 * @param {number|null} [params.weeklyWeighInDay] legacy
 * @param {Date|string} [params.viewDate]
 * @param {Array} [params.progressEntries]
 */
export function computeWeeklyWeighInReminder({
  prefs,
  weeklyWeighInDay,
  viewDate = new Date(),
  progressEntries = []
}) {
  const hidden = {
    show: false,
    daysOverdue: 0,
    dueDateYmd: null,
    nextDueDateYmd: null,
    remaining: 0,
    doneThisWeek: 0,
    perWeek: 0,
    isDueToday: false,
    weighedToday: false,
    weekStartYmd: null,
    weekEndYmd: null
  };

  const merged = normalizeWeighInPrefs({
    ...(prefs && typeof prefs === 'object' ? prefs : {}),
    weeklyWeighInDay: weeklyWeighInDay !== undefined ? weeklyWeighInDay : prefs?.weeklyWeighInDay
  });

  const view = startOfDay(viewDate instanceof Date ? viewDate : new Date(viewDate));
  const viewYmd = toYmd(view);
  const ymds = impedanceYmds(progressEntries);
  const weighedToday = ymds.has(viewYmd);

  const hasRegime = Boolean(merged.weighInAnchorDate && merged.weighInsPerWeek > 0);
  const hasLegacy = merged.weeklyWeighInDay != null && Number.isFinite(Number(merged.weeklyWeighInDay));

  if (!hasRegime && !hasLegacy) return { ...hidden, weighedToday };

  if (hasRegime) {
    if (viewYmd < merged.weighInAnchorDate) {
      return { ...hidden, weighedToday, perWeek: merged.weighInsPerWeek };
    }
    const weekStart = mondayOfWeek(view);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekStartYmd = toYmd(weekStart);
    const nextDueYmd = toYmd(weekEnd);
    const weekEndInclusive = new Date(weekEnd);
    weekEndInclusive.setDate(weekEndInclusive.getDate() - 1);

    const doneThisWeek = [...ymds].filter((ymd) => ymd >= weekStartYmd && ymd < nextDueYmd).length;
    const remaining = Math.max(0, merged.weighInsPerWeek - doneThisWeek);
    const scheduledToday = merged.weighInWeekdays.includes(view.getDay());
    const isDueToday = remaining > 0 && scheduledToday && !weighedToday;

    let daysOverdue = 0;
    if (remaining > 0) {
      const scheduledThisWeek = merged.weighInWeekdays
        .map((wd) => {
          const d = new Date(weekStart);
          const mon = 1;
          const offset = wd === 0 ? 6 : wd - mon;
          d.setDate(weekStart.getDate() + offset);
          return toYmd(d);
        })
        .filter((ymd) => ymd >= merged.weighInAnchorDate && ymd <= viewYmd);
      const missed = scheduledThisWeek.filter((ymd) => !ymds.has(ymd));
      if (missed.length) {
        daysOverdue = daysBetween(missed[0], viewYmd);
      }
    }

    return {
      show: remaining > 0,
      daysOverdue,
      dueDateYmd: scheduledToday ? viewYmd : merged.weighInWeekdays.length ? null : viewYmd,
      nextDueDateYmd: nextDueYmd,
      remaining,
      doneThisWeek,
      perWeek: merged.weighInsPerWeek,
      isDueToday,
      weighedToday,
      weekStartYmd,
      weekEndYmd: toYmd(weekEndInclusive),
      regime: true
    };
  }

  const cfg = Number(merged.weeklyWeighInDay);
  if (!Number.isFinite(cfg) || cfg < 0 || cfg > 6) return { ...hidden, weighedToday };

  const due = lastDueWeighInDate(view, cfg);
  const dueYmd = toYmd(due);
  const nextDue = new Date(due);
  nextDue.setDate(nextDue.getDate() + 7);
  const nextDueYmd = toYmd(nextDue);

  const hasEntryInWindow = [...ymds].some((ymd) => ymd >= dueYmd && ymd < nextDueYmd);
  if (hasEntryInWindow) {
    return {
      ...hidden,
      dueDateYmd: dueYmd,
      nextDueDateYmd: nextDueYmd,
      perWeek: 1,
      doneThisWeek: 1,
      weighedToday
    };
  }

  const daysOverdue = daysBetween(dueYmd, viewYmd);
  return {
    show: true,
    daysOverdue,
    dueDateYmd: dueYmd,
    nextDueDateYmd: nextDueYmd,
    remaining: 1,
    doneThisWeek: 0,
    perWeek: 1,
    isDueToday: daysOverdue === 0,
    weighedToday,
    regime: false
  };
}

export function weighInReminderMessageFr(info) {
  const daysOverdue = typeof info === 'number' ? info : info?.daysOverdue || 0;
  const remaining = typeof info === 'object' ? info.remaining : null;
  const perWeek = typeof info === 'object' ? info.perWeek : null;
  const isDueToday = typeof info === 'object' ? info.isDueToday : daysOverdue <= 0;

  if (perWeek > 1 && remaining != null) {
    if (isDueToday) {
      return `C’est un jour de pesée — ${remaining} mesure${remaining > 1 ? 's' : ''} encore cette semaine (${info.doneThisWeek}/${perWeek}). Enregistre depuis ici.`;
    }
    return `Il reste ${remaining} pesée${remaining > 1 ? 's' : ''} cette semaine (${info.doneThisWeek}/${perWeek}). Tu peux la faire maintenant.`;
  }
  if (daysOverdue <= 0) {
    return "C'est ton jour de pesée — enregistre ta mesure (impédancemètre) depuis ici.";
  }
  if (daysOverdue === 1) {
    return 'Pesée attendue depuis 1 jour — tu peux la compléter maintenant.';
  }
  return `Pesée attendue depuis ${daysOverdue} jours — tu peux la compléter maintenant.`;
}

export function weighInReminderTitleFr(info) {
  const daysOverdue = typeof info === 'number' ? info : info?.daysOverdue || 0;
  const remaining = typeof info === 'object' ? info.remaining : null;
  const perWeek = typeof info === 'object' ? info.perWeek : null;
  const isDueToday = typeof info === 'object' ? info.isDueToday : daysOverdue <= 0;

  if (perWeek > 1 && remaining != null) {
    if (isDueToday) return `Pesée du jour (${remaining} restante${remaining > 1 ? 's' : ''})`;
    return `Pesées de la semaine (${remaining} restante${remaining > 1 ? 's' : ''})`;
  }
  if (daysOverdue <= 0) return 'Pesée du jour';
  if (daysOverdue === 1) return 'Pesée en retard (1 jour)';
  return `Pesée en retard (${daysOverdue} jours)`;
}

export const WEEKDAY_LABELS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
