/**
 * Agrégations pour le calendrier Finance : uniquement des données datées « action » ou « engagement ».
 * Exclut : libellés de catégories seuls, répartition statique sans date, cours Yahoo sans mouvement.
 */

/** @param {unknown} raw */
export function financeDateToYmd(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'string') {
    const m = String(raw).trim().match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : null;
  }
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    const y = raw.getFullYear();
    const mo = String(raw.getMonth() + 1).padStart(2, '0');
    const da = String(raw.getDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  }
  return null;
}

/**
 * @param {number} year
 * @param {number} monthIndex 0-11
 */
export function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Jour du mois pour une charge « mensuelle » (1–31), borné au dernier jour du mois.
 */
export function clampChargeDayOfMonth(year, monthIndex, jour) {
  const dim = daysInMonth(year, monthIndex);
  const d = Math.min(Math.max(1, Math.floor(Number(jour) || 1)), dim);
  const m = String(monthIndex + 1).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${year}-${m}-${dd}`;
}

/**
 * @typedef {{
 *   budgetSpend: number,
 *   budgetCount: number,
 *   plannedCount: number,
 *   chargeCount: number,
 *   portfolioAdds: number,
 *   shoppingDone: number,
 *   loisirsMois: number,
 *   acquisitionCount: number
 * }} FinanceDayAgg
 */

export function emptyFinanceDayAgg() {
  return {
    budgetSpend: 0,
    budgetCount: 0,
    plannedCount: 0,
    chargeCount: 0,
    portfolioAdds: 0,
    shoppingDone: 0,
    loisirsMois: 0,
    acquisitionCount: 0,
  };
}

/**
 * Toutes les dates `YYYY-MM-DD` de l’année civile `year` ayant au moins un signal finance.
 * @param {number} year
 * @param {{
 *   depenses: Array<{ date?: string, montant?: number }>,
 *   depensesPlanifiees: Array<{ date?: string, statut?: string }>,
 *   chargesFixes: Array<{ active?: boolean, frequence?: { type?: string, jour?: number } }>,
 *   portfolio: Array<{ dateAchat?: string }>,
 *   shoppingListes: Array<{ statut?: string, dateCompletion?: string }>,
 *   achatsLoisirs: Array<{ moisCible?: string, statut?: string, prix?: number }>,
 *   acquisitions: Array<{ date?: string }>
 * }} input
 * @returns {Map<string, FinanceDayAgg>}
 */
export function buildFinanceCalendarYearDayMap(year, input) {
  const yPrefix = `${year}-`;
  const map = new Map();

  const merge = (ymd, updater) => {
    if (!ymd || !ymd.startsWith(yPrefix)) return;
    const prev = map.get(ymd) || emptyFinanceDayAgg();
    map.set(ymd, updater(prev));
  };

  (input.depenses || []).forEach((d) => {
    const ymd = financeDateToYmd(d?.date);
    const m = Number(d?.montant) || 0;
    merge(ymd, (prev) => ({
      ...prev,
      budgetSpend: prev.budgetSpend + m,
      budgetCount: prev.budgetCount + 1,
    }));
  });

  (input.depensesPlanifiees || []).forEach((p) => {
    if (String(p?.statut || '').toLowerCase() === 'annule') return;
    const ymd = financeDateToYmd(p?.date);
    merge(ymd, (prev) => ({ ...prev, plannedCount: prev.plannedCount + 1 }));
  });

  (input.chargesFixes || []).forEach((c) => {
    if (c?.active === false) return;
    const freq = c?.frequence;
    const type = String(freq?.type || '').toLowerCase();
    if (type !== 'mensuel') return;
    const jour = freq?.jour != null ? Number(freq.jour) : 1;
    for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
      const ymd = clampChargeDayOfMonth(year, monthIndex, jour);
      merge(ymd, (prev) => ({ ...prev, chargeCount: prev.chargeCount + 1 }));
    }
  });

  (input.portfolio || []).forEach((pos) => {
    const ymd = financeDateToYmd(pos?.dateAchat);
    merge(ymd, (prev) => ({ ...prev, portfolioAdds: prev.portfolioAdds + 1 }));
  });

  (input.shoppingListes || []).forEach((liste) => {
    if (liste?.statut !== 'completee' || !liste?.dateCompletion) return;
    const ymd = financeDateToYmd(liste.dateCompletion);
    merge(ymd, (prev) => ({ ...prev, shoppingDone: prev.shoppingDone + 1 }));
  });

  (input.achatsLoisirs || []).forEach((a) => {
    const mc = String(a?.moisCible || '');
    if (!mc.startsWith(yPrefix)) return;
    const monthKey = mc.length >= 7 ? mc.substring(0, 7) : mc;
    if (!/^\d{4}-\d{2}$/.test(monthKey)) return;
    const st = String(a?.statut || '').toLowerCase();
    if (st === 'annule') return;
    const ymd = `${monthKey}-01`;
    merge(ymd, (prev) => ({ ...prev, loisirsMois: prev.loisirsMois + (Number(a?.prix) || 0) }));
  });

  (input.acquisitions || []).forEach((row) => {
    const ymd = financeDateToYmd(row?.date);
    merge(ymd, (prev) => ({ ...prev, acquisitionCount: prev.acquisitionCount + 1 }));
  });

  return map;
}

/**
 * @param {{
 *   year: number,
 *   monthIndex: number,
 *   depenses: Array<{ date?: string, montant?: number }>,
 *   depensesPlanifiees: Array<{ date?: string, statut?: string }>,
 *   chargesFixes: Array<{ active?: boolean, titre?: string, frequence?: { type?: string, jour?: number }, dateDebut?: string }>,
 *   portfolio: Array<{ dateAchat?: string }>,
 *   shoppingListes: Array<{ statut?: string, dateCompletion?: string }>,
 *   achatsLoisirs: Array<{ moisCible?: string, statut?: string, prix?: number }>,
 *   acquisitions: Array<{ date?: string }>
 * }} input
 * @returns {Map<string, FinanceDayAgg>}
 */
export function buildFinanceCalendarDayMap(input) {
  const { year, monthIndex } = input;
  const monthPrefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  const map = new Map();

  (input.depenses || []).forEach((d) => {
    const ymd = financeDateToYmd(d?.date);
    if (!ymd || !ymd.startsWith(monthPrefix)) return;
    const m = Number(d?.montant) || 0;
    const prev = map.get(ymd) || emptyFinanceDayAgg();
    map.set(ymd, {
      ...prev,
      budgetSpend: prev.budgetSpend + m,
      budgetCount: prev.budgetCount + 1,
    });
  });

  (input.depensesPlanifiees || []).forEach((p) => {
    if (String(p?.statut || '').toLowerCase() === 'annule') return;
    const ymd = financeDateToYmd(p?.date);
    if (!ymd || !ymd.startsWith(monthPrefix)) return;
    const prev = map.get(ymd) || emptyFinanceDayAgg();
    map.set(ymd, { ...prev, plannedCount: prev.plannedCount + 1 });
  });

  (input.chargesFixes || []).forEach((c) => {
    if (c?.active === false) return;
    const freq = c?.frequence;
    const type = String(freq?.type || '').toLowerCase();
    if (type !== 'mensuel') return;
    const jour = freq?.jour != null ? Number(freq.jour) : 1;
    const ymd = clampChargeDayOfMonth(year, monthIndex, jour);
    const prev = map.get(ymd) || emptyFinanceDayAgg();
    map.set(ymd, { ...prev, chargeCount: prev.chargeCount + 1 });
  });

  (input.portfolio || []).forEach((pos) => {
    const ymd = financeDateToYmd(pos?.dateAchat);
    if (!ymd || !ymd.startsWith(monthPrefix)) return;
    const prev = map.get(ymd) || emptyFinanceDayAgg();
    map.set(ymd, { ...prev, portfolioAdds: prev.portfolioAdds + 1 });
  });

  (input.shoppingListes || []).forEach((liste) => {
    if (liste?.statut !== 'completee' || !liste?.dateCompletion) return;
    const ymd = financeDateToYmd(liste.dateCompletion);
    if (!ymd || !ymd.startsWith(monthPrefix)) return;
    const prev = map.get(ymd) || emptyFinanceDayAgg();
    map.set(ymd, { ...prev, shoppingDone: prev.shoppingDone + 1 });
  });

  (input.achatsLoisirs || []).forEach((a) => {
    if (String(a?.moisCible || '') !== monthPrefix) return;
    const st = String(a?.statut || '').toLowerCase();
    if (st === 'annule') return;
    const ymd = `${monthPrefix}-01`;
    const prev = map.get(ymd) || emptyFinanceDayAgg();
    map.set(ymd, { ...prev, loisirsMois: prev.loisirsMois + (Number(a?.prix) || 0) });
  });

  (input.acquisitions || []).forEach((row) => {
    const ymd = financeDateToYmd(row?.date);
    if (!ymd || !ymd.startsWith(monthPrefix)) return;
    const prev = map.get(ymd) || emptyFinanceDayAgg();
    map.set(ymd, { ...prev, acquisitionCount: prev.acquisitionCount + 1 });
  });

  return map;
}

export function monthSummaryFromMap(dayMap, year, monthIndex) {
  let budgetSpend = 0;
  let daysWithBudget = 0;
  let plannedDays = 0;
  let chargeDays = 0;
  let portfolioDays = 0;
  let shoppingDays = 0;
  let acquisitionDays = 0;

  dayMap.forEach((v) => {
    if (v.budgetSpend > 0 || v.budgetCount > 0) {
      budgetSpend += v.budgetSpend;
      if (v.budgetCount > 0) daysWithBudget += 1;
    }
    if (v.plannedCount > 0) plannedDays += 1;
    if (v.chargeCount > 0) chargeDays += 1;
    if (v.portfolioAdds > 0) portfolioDays += 1;
    if (v.shoppingDone > 0) shoppingDays += 1;
    if (v.acquisitionCount > 0) acquisitionDays += 1;
  });

  return {
    budgetSpend,
    daysWithBudget,
    plannedDays,
    chargeDays,
    portfolioDays,
    shoppingDays,
    acquisitionDays,
    loisirsOnFirst: Array.from(dayMap.entries()).find(([k, v]) => k.endsWith('-01') && v.loisirsMois > 0)?.[1]?.loisirsMois ?? 0,
  };
}
