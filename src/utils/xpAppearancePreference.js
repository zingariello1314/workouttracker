/**
 * Préférences d’apparence des barres XP (sport + accent nutrition).
 */

import { SPORT_SUB_TAB_IDS } from '../constants/sportSubTabs';

export const XP_APPEARANCE_STORAGE_KEY = 'momentum.xpAppearance';
export const XP_APPEARANCE_EVENT = 'momentum:xp-appearance';

export const SPORT_XP_ACCENTS = [
  { id: 'violet', label: 'Violet', hex: '#a06bff' },
  { id: 'rose', label: 'Rose', hex: '#ff5fa8' },
  { id: 'rouge', label: 'Rouge', hex: '#ff5a4a' },
  { id: 'orange', label: 'Orange', hex: '#ff8a3d' },
  { id: 'ambre', label: 'Ambre', hex: '#ffbf47' },
  { id: 'vert', label: 'Vert', hex: '#34d399' },
  { id: 'cyan', label: 'Cyan', hex: '#22d3ee' },
  { id: 'bleu', label: 'Bleu', hex: '#4a9eff' },
  { id: 'argent', label: 'Argent', hex: '#cdd3e2' }
];

export const SPORT_XP_TAB_OPTIONS = [
  { id: 'today', label: 'Aujourd’hui' },
  { id: 'calendar', label: 'Calendrier' },
  { id: 'recap', label: 'Récap' },
  { id: 'program', label: 'Programme' },
  { id: 'exercises', label: 'Banque' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'endurance', label: 'Endurance' },
  { id: 'progress', label: 'Suivi corporel' },
  { id: 'garmin', label: 'Garmin' },
  { id: 'charts', label: 'Graphiques' },
  { id: 'performance-challenges', label: 'Défis' },
  { id: 'sport-analytics', label: 'Analyses' },
  { id: 'data-entry', label: 'Saisie' },
  { id: 'addiction-quit', label: 'Addiction' }
];

/** Infos dépliables (détail barre XP). Cocher = afficher. */
export const SPORT_XP_DETAIL_FIELDS = [
  { id: 'meritedBox', label: 'Carte grade mérité', defaultOn: true },
  { id: 'levelXpBox', label: 'Carte XP du palier', defaultOn: true },
  { id: 'breakdownStack', label: 'Barre proportionnelle des sources', defaultOn: true },
  { id: 'breakdownRows', label: 'Tableau détaillé des sources', defaultOn: true },
  { id: 'rowWeightedReps', label: '· Reps pondérées', defaultOn: true },
  { id: 'rowChecked', label: '· Exercices cochés', defaultOn: true },
  { id: 'rowVolume', label: '· Volume cumulé', defaultOn: true },
  { id: 'rowStretches', label: '· Étirements', defaultOn: true },
  { id: 'rowChallenges', label: '· Défis', defaultOn: true },
  { id: 'rowWeightedTime', label: '· Temps pondéré', defaultOn: true },
  { id: 'rowCircuits', label: '· Circuits', defaultOn: true },
  { id: 'rowGtg', label: '· GTG', defaultOn: true },
  { id: 'rowFeedback', label: '· Séances + feedback', defaultOn: true },
  { id: 'rowProgramBonus', label: '· Bonus complétion programme', defaultOn: true },
  { id: 'rowCalories', label: '· Calories', defaultOn: true },
  { id: 'rowSteps', label: '· Pas', defaultOn: true },
  { id: 'rowFood', label: '· Aliments', defaultOn: true },
  { id: 'rowRunning', label: '· Trophées course', defaultOn: true },
  { id: 'rowPushups', label: '· Trophées pompes', defaultOn: true },
  { id: 'rowJumpRope', label: '· Trophées corde', defaultOn: true },
  { id: 'rowPlank', label: '· Trophées gainage', defaultOn: true },
  { id: 'rowDailyAvg', label: '· Moyenne XP / jour actif', defaultOn: true },
  { id: 'rowMastery', label: '· Score de maîtrise', defaultOn: true },
  { id: 'miscSessions', label: 'Pied : séances cumulées', defaultOn: true },
  { id: 'miscTrophies', label: 'Pied : paliers / trophées', defaultOn: true }
];

/** Blocs majeurs du détail (ordre = drag & drop dans Apparence). */
export const SPORT_XP_LAYOUT_BLOCKS = [
  { id: 'headerCards', label: 'Cartes grade mérité & XP palier' },
  { id: 'breakdownStack', label: 'Répartition visuelle (stack + légende)' },
  { id: 'groupTraining', label: 'Bloc Entraînement & défis' },
  { id: 'groupActivity', label: 'Bloc Activité & nutrition' },
  { id: 'groupTrophies', label: 'Bloc Trophées' },
  { id: 'misc', label: 'Pied séances & paliers' }
];

const DEFAULT_SHOW_TABS = SPORT_XP_TAB_OPTIONS.map((t) => t.id);
const DEFAULT_LAYOUT_ORDER = SPORT_XP_LAYOUT_BLOCKS.map((b) => b.id);
const DEFAULT_DETAIL_FIELD_ORDER = SPORT_XP_DETAIL_FIELDS.map((f) => f.id);

function defaultDetailFields() {
  const out = {};
  SPORT_XP_DETAIL_FIELDS.forEach((f) => {
    out[f.id] = f.defaultOn !== false;
  });
  return out;
}

function defaultPreference() {
  return {
    sportAccentId: 'violet',
    customAccents: [],
    showTabs: [...DEFAULT_SHOW_TABS],
    detailFields: defaultDetailFields(),
    layoutOrder: [...DEFAULT_LAYOUT_ORDER],
    detailFieldOrder: [...DEFAULT_DETAIL_FIELD_ORDER],
    nutritionAccent: '#22c55e',
    nutritionXpAccent: '#22d3ee'
  };
}

function normalizeOrder(rawOrder, defaults) {
  const allowed = new Set(defaults);
  const seen = new Set();
  const out = [];
  if (Array.isArray(rawOrder)) {
    for (const id of rawOrder) {
      if (!allowed.has(id) || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
  }
  for (const id of defaults) {
    if (!seen.has(id)) out.push(id);
  }
  return out;
}

function sanitizeHex(value, fallback) {
  const s = String(value || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    const r = s[1];
    const g = s[2];
    const b = s[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return fallback;
}

function normalize(raw) {
  const base = defaultPreference();
  if (!raw || typeof raw !== 'object') return base;

  const knownAccentIds = new Set([
    ...SPORT_XP_ACCENTS.map((a) => a.id),
    ...((Array.isArray(raw.customAccents) ? raw.customAccents : [])
      .map((c) => c?.id)
      .filter(Boolean))
  ]);

  let sportAccentId = typeof raw.sportAccentId === 'string' ? raw.sportAccentId : base.sportAccentId;
  if (!knownAccentIds.has(sportAccentId) && !SPORT_XP_ACCENTS.some((a) => a.id === sportAccentId)) {
    sportAccentId = base.sportAccentId;
  }

  const customAccents = (Array.isArray(raw.customAccents) ? raw.customAccents : [])
    .filter((c) => c && typeof c.id === 'string' && /^#[0-9a-fA-F]{3,6}$/.test(String(c.hex || '')))
    .slice(0, 12)
    .map((c) => ({
      id: String(c.id).slice(0, 40),
      label: String(c.label || 'Perso').slice(0, 24),
      hex: sanitizeHex(c.hex, '#a06bff')
    }));

  const allowedTabs = new Set(SPORT_SUB_TAB_IDS);
  let showTabs = Array.isArray(raw.showTabs)
    ? raw.showTabs.filter((id) => allowedTabs.has(id) && id !== 'anatomy')
    : [...DEFAULT_SHOW_TABS];
  if (!showTabs.length) showTabs = [...DEFAULT_SHOW_TABS];

  const detailFields = { ...defaultDetailFields() };
  if (raw.detailFields && typeof raw.detailFields === 'object') {
    Object.keys(detailFields).forEach((key) => {
      if (typeof raw.detailFields[key] === 'boolean') detailFields[key] = raw.detailFields[key];
    });
  }

  return {
    sportAccentId,
    customAccents,
    showTabs,
    detailFields,
    layoutOrder: normalizeOrder(raw.layoutOrder, DEFAULT_LAYOUT_ORDER),
    detailFieldOrder: normalizeOrder(raw.detailFieldOrder, DEFAULT_DETAIL_FIELD_ORDER),
    nutritionAccent: sanitizeHex(raw.nutritionAccent, base.nutritionAccent),
    nutritionXpAccent: sanitizeHex(raw.nutritionXpAccent, base.nutritionXpAccent)
  };
}

function readRaw() {
  try {
    return localStorage.getItem(XP_APPEARANCE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getXpAppearancePreference() {
  const raw = readRaw();
  if (!raw) return defaultPreference();
  try {
    return normalize(JSON.parse(raw));
  } catch {
    return defaultPreference();
  }
}

export function updateXpAppearancePreference(partial) {
  const next = normalize({ ...getXpAppearancePreference(), ...partial });
  try {
    localStorage.setItem(XP_APPEARANCE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(XP_APPEARANCE_EVENT, { detail: next }));
  }
  return next;
}

export function subscribeXpAppearance(listener) {
  const onCustom = (event) => listener(event.detail || getXpAppearancePreference());
  const onStorage = (event) => {
    if (event.key === XP_APPEARANCE_STORAGE_KEY) listener(getXpAppearancePreference());
  };
  window.addEventListener(XP_APPEARANCE_EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(XP_APPEARANCE_EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}

export function resolveSportXpAccentHex(preference) {
  const pref = preference || getXpAppearancePreference();
  const custom = (pref.customAccents || []).find((c) => c.id === pref.sportAccentId);
  if (custom) return custom.hex;
  const stock = SPORT_XP_ACCENTS.find((a) => a.id === pref.sportAccentId);
  return stock?.hex || '#a06bff';
}

export function shouldShowSportXpBar(tabId, preference) {
  if (!tabId || tabId === 'anatomy') return false;
  const pref = preference || getXpAppearancePreference();
  const tabs = pref.showTabs || DEFAULT_SHOW_TABS;
  return tabs.includes(tabId);
}

export function isDetailFieldOn(fieldId, preference) {
  const pref = preference || getXpAppearancePreference();
  if (pref.detailFields?.[fieldId] === false) return false;
  return true;
}

export function getLayoutOrder(preference) {
  const pref = preference || getXpAppearancePreference();
  return normalizeOrder(pref.layoutOrder, DEFAULT_LAYOUT_ORDER);
}

export function getDetailFieldOrder(preference) {
  const pref = preference || getXpAppearancePreference();
  return normalizeOrder(pref.detailFieldOrder, DEFAULT_DETAIL_FIELD_ORDER);
}

/** Compare deux ids de champs selon l’ordre perso (défaut catalogue). */
export function compareDetailFieldOrder(aId, bId, preference) {
  const order = getDetailFieldOrder(preference);
  const ia = order.indexOf(aId);
  const ib = order.indexOf(bId);
  const sa = ia === -1 ? 9999 : ia;
  const sb = ib === -1 ? 9999 : ib;
  return sa - sb;
}

export function listAllSportXpAccents(preference) {
  const pref = preference || getXpAppearancePreference();
  return [...SPORT_XP_ACCENTS, ...(pref.customAccents || [])];
}
