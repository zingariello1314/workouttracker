import { MS } from './addictionQuitConstants';

/** id vide = non renseigné ; labelKey pour useTranslation */
export const CRAVING_TRIGGER_OPTIONS = [
  { id: '', labelKey: 'addictionQuit.trigger.none' },
  { id: 'stress', labelKey: 'addictionQuit.trigger.stress' },
  { id: 'boredom', labelKey: 'addictionQuit.trigger.boredom' },
  { id: 'alcohol', labelKey: 'addictionQuit.trigger.alcohol' },
  { id: 'social', labelKey: 'addictionQuit.trigger.social' },
  { id: 'sleep', labelKey: 'addictionQuit.trigger.sleep' },
  { id: 'afterMeal', labelKey: 'addictionQuit.trigger.afterMeal' },
  { id: 'work', labelKey: 'addictionQuit.trigger.work' },
  { id: 'other', labelKey: 'addictionQuit.trigger.other' },
];

export const CRAVING_OUTCOME_OPTIONS = [
  { id: '', labelKey: 'addictionQuit.outcome.none' },
  { id: 'held', labelKey: 'addictionQuit.outcome.held' },
  { id: 'slipped', labelKey: 'addictionQuit.outcome.slipped' },
];

/** Tri : heure saisie puis date de création */
export function sortCravingsForDay(entries) {
  if (!Array.isArray(entries)) return [];
  return [...entries].sort((a, b) => {
    const ta = a.timeHHMM || '99:99';
    const tb = b.timeHHMM || '99:99';
    if (ta !== tb) return ta.localeCompare(tb);
    return String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
  });
}

/** Normalise tout le calendrier des envies (tri par jour) */
export function normalizeCravingsByDay(cravingsByDay) {
  if (!cravingsByDay || typeof cravingsByDay !== 'object') return {};
  const out = {};
  for (const [day, arr] of Object.entries(cravingsByDay)) {
    if (!Array.isArray(arr) || arr.length === 0) continue;
    out[day] = sortCravingsForDay(arr);
  }
  return out;
}

/**
 * Prochain jalon dont ms > elapsedMs
 * @returns {{ milestone: {ms,t,label}, msUntil: number } | null}
 */
export function getNextMilestone(milestones, elapsedMs) {
  if (!Array.isArray(milestones) || elapsedMs < 0) return null;
  for (const m of milestones) {
    if (elapsedMs < m.ms) {
      return { milestone: m, msUntil: m.ms - elapsedMs };
    }
  }
  return null;
}

/** Texte « dans X j / h / min » (FR) */
export function formatTimeUntilFr(msUntil) {
  if (msUntil == null || msUntil <= 0) return 'maintenant';
  const h = MS.HOUR;
  const d = MS.DAY;
  if (msUntil >= d) {
    const days = Math.ceil(msUntil / d);
    return `dans ${days} jour${days > 1 ? 's' : ''}`;
  }
  if (msUntil >= h) {
    const hours = Math.ceil(msUntil / h);
    return `dans ${hours} h`;
  }
  const mins = Math.max(1, Math.ceil(msUntil / (60 * 1000)));
  return `dans ${mins} min`;
}

/** Texte « dans X j / h / min » (EN) */
export function formatTimeUntilEn(msUntil) {
  if (msUntil == null || msUntil <= 0) return 'now';
  const h = MS.HOUR;
  const d = MS.DAY;
  if (msUntil >= d) {
    const days = Math.ceil(msUntil / d);
    return `in ${days} day${days > 1 ? 's' : ''}`;
  }
  if (msUntil >= h) {
    const hours = Math.ceil(msUntil / h);
    return `in ${hours} h`;
  }
  const mins = Math.max(1, Math.ceil(msUntil / (60 * 1000)));
  return `in ${mins} min`;
}

export function flattenCravings(cravingsByDay, filterTrack = 'all') {
  const rows = [];
  for (const [day, arr] of Object.entries(cravingsByDay || {})) {
    if (!Array.isArray(arr)) continue;
    for (const c of sortCravingsForDay(arr)) {
      if (filterTrack !== 'all' && c.trackId !== filterTrack) continue;
      rows.push({ ...c, day });
    }
  }
  return rows;
}

/** Compte d'envies par date sur les `days` derniers jours (inclus aujourd'hui) */
export function countsLastNDays(cravingsByDay, nDays, now = new Date()) {
  const map = {};
  for (let i = 0; i < nDays; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${day}`;
    let count = 0;
    const arr = cravingsByDay?.[key];
    if (Array.isArray(arr)) count = arr.length;
    map[key] = count;
  }
  return map;
}

export function chartDataLast30Days(cravingsByDay, filterTrack = 'all', now = new Date()) {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${day}`;
    const arr = cravingsByDay?.[key] || [];
    let count = 0;
    for (const c of arr) {
      if (filterTrack === 'all' || c.trackId === filterTrack) count += 1;
    }
    data.push({
      dateKey: key,
      label: `${day}/${m}`,
      count,
    });
  }
  return data;
}

/** Moyenne intensité sur les entrées dont day >= startKey (YYYY-MM-DD) */
export function avgIntensitySince(cravingsByDay, startDateStr, filterTrack = 'all') {
  let sum = 0;
  let n = 0;
  for (const [day, arr] of Object.entries(cravingsByDay || {})) {
    if (day < startDateStr) continue;
    if (!Array.isArray(arr)) continue;
    for (const c of arr) {
      if (filterTrack !== 'all' && c.trackId !== filterTrack) continue;
      const int = Number(c.intensity);
      if (!Number.isNaN(int) && int >= 1 && int <= 10) {
        sum += int;
        n += 1;
      }
    }
  }
  return n > 0 ? sum / n : null;
}

/** Total envies sur une fenêtre de jours calendaires [startStr, endStr] */
export function countCravingsInRange(cravingsByDay, startStr, endStr, filterTrack = 'all') {
  let n = 0;
  for (const [day, arr] of Object.entries(cravingsByDay || {})) {
    if (day < startStr || day > endStr) continue;
    if (!Array.isArray(arr)) continue;
    for (const c of arr) {
      if (filterTrack !== 'all' && c.trackId !== filterTrack) continue;
      n += 1;
    }
  }
  return n;
}

/** Tendance : compare total 7 derniers jours vs 7 jours précédents → 1 up -1 down 0 flat */
export function weeklyTrend(cravingsByDay, filterTrack = 'all', now = new Date()) {
  const d0 = new Date(now);
  const end1 = getDateStrLocal(d0);
  d0.setDate(d0.getDate() - 6);
  const start1 = getDateStrLocal(d0);
  const d1 = new Date(now);
  d1.setDate(d1.getDate() - 7);
  const end2 = getDateStrLocal(d1);
  d1.setDate(d1.getDate() - 6);
  const start2 = getDateStrLocal(d1);

  const c1 = countCravingsInRange(cravingsByDay, start1, end1, filterTrack);
  const c2 = countCravingsInRange(cravingsByDay, start2, end2, filterTrack);
  if (c2 === 0 && c1 === 0) return 0;
  if (c1 > c2) return 1;
  if (c1 < c2) return -1;
  return 0;
}

function getDateStrLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function cravingsToCsvRows(cravingsByDay, filterTrack = 'all') {
  const headers = [
    'id',
    'jour',
    'suivi',
    'intensite',
    'heure',
    'duree_min',
    'declencheur',
    'resultat',
    'lieu',
    'notes',
    'cree_le',
  ];
  const lines = [headers.join(';')];
  const days = Object.keys(cravingsByDay || {}).sort();
  for (const day of days) {
    const arr = cravingsByDay[day] || [];
    for (const c of sortCravingsForDay(arr)) {
      if (filterTrack !== 'all' && c.trackId !== filterTrack) continue;
      const row = [
        c.id,
        day,
        c.trackId,
        c.intensity,
        c.timeHHMM || '',
        c.durationMinutes ?? '',
        c.triggerId || '',
        c.outcomeId || '',
        csvEscape(c.place),
        csvEscape(c.notes),
        c.createdAt || '',
      ];
      lines.push(row.join(';'));
    }
  }
  return lines.join('\n');
}

function csvEscape(s) {
  if (s == null) return '';
  const t = String(s).replace(/"/g, '""');
  if (/[;\n\r]/.test(t)) return `"${t}"`;
  return t;
}

export function downloadTextFile(filename, text, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob(['\ufeff', text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
