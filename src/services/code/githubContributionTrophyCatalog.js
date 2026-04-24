/**
 * Défis / trophées GitHub (contributions) — cumul historique, fenêtres glissantes UTC, séries.
 * Chaque entrée : id stable, xpReward (250–10_000 sauf palier 100k → 100_000 XP).
 */

/** @param {number} t */
function life(t, xp) {
  return {
    id: `life_total_${t}`,
    title: `${t.toLocaleString('fr-FR')} contributions (tout profil)`,
    description: `Cumul ≥ ${t.toLocaleString('fr-FR')} contributions sur l’historique agrégé (API GitHub, même périmètre que l’onglet Code).`,
    xpReward: xp,
    met: (ctx) => ctx.lifetimeTotal >= t,
    progress: (ctx) => Math.min(100, (ctx.lifetimeTotal / t) * 100),
  };
}

/** Fenêtre glissante : seuils exigeants (total OU jours actifs OU moyenne / jour cal.). */
function roll(id, days, xp, title, description, met, progress) {
  return {
    id,
    title,
    description,
    xpReward: xp,
    windowDays: days,
    met: (ctx) => met(ctx.window(days)),
    progress: (ctx) => progress(ctx.window(days)),
  };
}

function streak(id, minDays, xp, title, description) {
  return {
    id,
    title,
    description,
    xpReward: xp,
    streakMin: minDays,
    met: (ctx) => ctx.longestStreak >= minDays,
    progress: (ctx) => Math.min(100, (ctx.longestStreak / minDays) * 100),
  };
}

const LIFETIME_RUNGS = [
  [50, 280],
  [100, 380],
  [150, 460],
  [250, 580],
  [400, 780],
  [600, 1050],
  [900, 1450],
  [1200, 1850],
  [1800, 2400],
  [2500, 3100],
  [3500, 4200],
  [5000, 5600],
  [7000, 7200],
  [10000, 10000],
  [14000, 10000],
  [20000, 10000],
  [30000, 10000],
  [45000, 10000],
  [60000, 10000],
  [80000, 10000],
  [100000, 100000],
];

const ROLLING = [
  roll(
    'warm_pulse_7d',
    7,
    260,
    'Échauffement 7 jours',
    'Semaine UTC : ≥ 4 contributions ou ≥ 3 jours actifs.',
    (s) => s.total >= 4 || s.activeDays >= 3,
    (s) => Math.min(100, Math.max((s.total / 4) * 55, (s.activeDays / 3) * 55)),
  ),
  roll(
    'sprint_7d',
    7,
    1200,
    'Sprint 7 jours',
    'Semaine UTC intense : ≥ 18 contributions ou ≥ 5 jours actifs.',
    (s) => s.total >= 18 || s.activeDays >= 5,
    (s) => Math.min(100, Math.max((s.total / 18) * 70, (s.activeDays / 5) * 70)),
  ),
  roll(
    'burst_7d',
    7,
    4500,
    'Rafale 7 jours',
    'Semaine UTC très dense : ≥ 45 contributions.',
    (s) => s.total >= 45,
    (s) => Math.min(100, (s.total / 45) * 100),
  ),
  roll(
    'rhythm_14d',
    14,
    520,
    'Rythme 14 jours',
    '14 j. UTC : moyenne ≥ 0,35 contrib/j cal. ou ≥ 14 contributions totales.',
    (s) => s.avgPerCalendarDay >= 0.35 || s.total >= 14,
    (s) => Math.min(100, Math.max((s.avgPerCalendarDay / 0.35) * 65, (s.total / 14) * 65)),
  ),
  roll(
    'grind_14d',
    14,
    2200,
    'Grind 14 jours',
    '14 j. UTC : ≥ 55 contributions ou ≥ 10 jours actifs.',
    (s) => s.total >= 55 || s.activeDays >= 10,
    (s) => Math.min(100, Math.max((s.total / 55) * 72, (s.activeDays / 10) * 72)),
  ),
  roll(
    'monthly_pulse_30d',
    30,
    400,
    'Pouls 30 jours',
    '30 j. UTC : ≥ 12 contributions ou ≥ 8 jours actifs.',
    (s) => s.total >= 12 || s.activeDays >= 8,
    (s) => Math.min(100, Math.max((s.total / 12) * 55, (s.activeDays / 8) * 55)),
  ),
  roll(
    'cadence_30d',
    30,
    900,
    'Cadence 30 jours',
    '30 j. UTC : moyenne ≥ 0,22 contrib/j cal. ou ≥ 28 contributions.',
    (s) => s.avgPerCalendarDay >= 0.22 || s.total >= 28,
    (s) => Math.min(100, Math.max((s.avgPerCalendarDay / 0.22) * 70, (s.total / 28) * 70)),
  ),
  roll(
    'forge_30d',
    30,
    3800,
    'Forge 30 jours',
    '30 j. UTC : ≥ 120 contributions ou moyenne ≥ 2,8 / jour cal.',
    (s) => s.total >= 120 || s.avgPerCalendarDay >= 2.8,
    (s) => Math.min(100, Math.max((s.total / 120) * 80, (s.avgPerCalendarDay / 2.8) * 80)),
  ),
  roll(
    'marathon_30d',
    30,
    10000,
    'Marathon 30 jours',
    '30 j. UTC d’élite : ≥ 220 contributions.',
    (s) => s.total >= 220,
    (s) => Math.min(100, (s.total / 220) * 100),
  ),
  roll(
    'depth_60d',
    60,
    1100,
    'Profondeur 60 jours',
    '60 j. UTC : ≥ 70 contributions ou ≥ 35 jours actifs.',
    (s) => s.total >= 70 || s.activeDays >= 35,
    (s) => Math.min(100, Math.max((s.total / 70) * 65, (s.activeDays / 35) * 65)),
  ),
  roll(
    'depth_hard_60d',
    60,
    5200,
    'Profondeur 60 j. (dur)',
    '60 j. UTC : ≥ 200 contributions ou moyenne ≥ 1,9 / jour cal.',
    (s) => s.total >= 200 || s.avgPerCalendarDay >= 1.9,
    (s) => Math.min(100, Math.max((s.total / 200) * 75, (s.avgPerCalendarDay / 1.9) * 75)),
  ),
  roll(
    'depth_90d_surge',
    90,
    800,
    'Surge 90 jours',
    '90 j. UTC : ≥ 40 contributions ou ≥ 28 jours actifs.',
    (s) => s.total >= 40 || s.activeDays >= 28,
    (s) => Math.min(100, Math.max((s.total / 40) * 60, (s.activeDays / 28) * 60)),
  ),
  roll(
    'depth_hard_90d',
    90,
    3200,
    'Profondeur 90 j. (exigeant)',
    '90 j. UTC : ≥ 150 contributions ou moyenne ≥ 1,05 / jour cal.',
    (s) => s.total >= 150 || s.avgPerCalendarDay >= 1.05,
    (s) => Math.min(100, Math.max((s.total / 150) * 72, (s.avgPerCalendarDay / 1.05) * 72)),
  ),
  roll(
    'apex_90d',
    90,
    10000,
    'Sommet 90 jours',
    '90 j. UTC : ≥ 400 contributions.',
    (s) => s.total >= 400,
    (s) => Math.min(100, (s.total / 400) * 100),
  ),
  roll(
    'halfyear_180d',
    180,
    1500,
    'Semestre 180 j.',
    '180 j. UTC : ≥ 220 contributions ou ≥ 95 jours actifs.',
    (s) => s.total >= 220 || s.activeDays >= 95,
    (s) => Math.min(100, Math.max((s.total / 220) * 62, (s.activeDays / 95) * 62)),
  ),
  roll(
    'halfyear_hard_180d',
    180,
    7500,
    'Semestre 180 j. (challenging)',
    '180 j. UTC : ≥ 520 contributions ou moyenne ≥ 1,35 / jour cal.',
    (s) => s.total >= 520 || s.avgPerCalendarDay >= 1.35,
    (s) => Math.min(100, Math.max((s.total / 520) * 78, (s.avgPerCalendarDay / 1.35) * 78)),
  ),
  roll(
    'year_window_365d',
    365,
    2800,
    'Année glissante 365 j.',
    '365 j. UTC : ≥ 520 contributions ou ≥ 200 jours actifs.',
    (s) => s.total >= 520 || s.activeDays >= 200,
    (s) => Math.min(100, Math.max((s.total / 520) * 65, (s.activeDays / 200) * 65)),
  ),
  roll(
    'year_hard_365d',
    365,
    10000,
    'Année glissante (élite)',
    '365 j. UTC : ≥ 1100 contributions.',
    (s) => s.total >= 1100,
    (s) => Math.min(100, (s.total / 1100) * 100),
  ),
];

const STREAKS = [
  streak('streak_7', 7, 420, 'Série 7 jours', 'Plus longue série de jours consécutifs avec ≥1 contribution : 7.'),
  streak('streak_14', 14, 780, 'Série 14 jours', 'Série consécutive : 14 jours.'),
  streak('streak_30', 30, 2200, 'Série 30 jours', 'Série consécutive : 30 jours.'),
  streak('streak_60', 60, 5200, 'Série 60 jours', 'Série consécutive : 60 jours.'),
  streak('streak_100', 100, 10000, 'Série 100 jours', 'Série consécutive : 100 jours.'),
  streak('streak_180', 180, 10000, 'Série 180 jours', 'Série consécutive : 180 jours.'),
  streak('streak_365', 365, 10000, 'Série 365 jours', 'Une année complète de jours consécutifs avec activité.'),
];

/** Anciens défis (compatibilité ids déjà débloqués) — conservés avec XP modeste. */
const LEGACY = [
  {
    id: 'pulse_7d',
    title: 'Pouls 7 jours (classique)',
    description: '≥ 3 contributions sur 7 j. UTC ou ≥ 2 jours actifs.',
    xpReward: 250,
    windowDays: 7,
    met: (ctx) => {
      const s = ctx.window(7);
      return s.total >= 3 || s.activeDays >= 2;
    },
    progress: (ctx) => {
      const s = ctx.window(7);
      return Math.min(100, Math.max((s.total / 3) * 50, (s.activeDays / 2) * 50));
    },
  },
  {
    id: 'rhythm_30d',
    title: 'Rythme 30 jours (classique)',
    description: 'Moyenne ≥ 0,12 contrib/j cal. sur 30 j. ou ≥ 8 contributions.',
    xpReward: 300,
    windowDays: 30,
    met: (ctx) => {
      const s = ctx.window(30);
      return s.avgPerCalendarDay >= 0.12 || s.total >= 8;
    },
    progress: (ctx) => {
      const s = ctx.window(30);
      return Math.min(100, Math.max((s.avgPerCalendarDay / 0.12) * 70, (s.total / 8) * 70));
    },
  },
  {
    id: 'depth_90d',
    title: 'Profondeur 90 jours (classique)',
    description: '≥ 25 contributions sur 90 j. ou ≥ 18 jours actifs.',
    xpReward: 350,
    windowDays: 90,
    met: (ctx) => {
      const s = ctx.window(90);
      return s.total >= 25 || s.activeDays >= 18;
    },
    progress: (ctx) => {
      const s = ctx.window(90);
      return Math.min(100, Math.max((s.total / 25) * 60, (s.activeDays / 18) * 60));
    },
  },
];

export const GITHUB_CONTRIBUTION_TROPHY_DEFS = [
  ...LEGACY,
  ...LIFETIME_RUNGS.map(([t, xp]) => life(t, xp)),
  ...ROLLING,
  ...STREAKS,
];
