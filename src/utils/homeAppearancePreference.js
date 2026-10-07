/**
 * Personnalisation page d’accueil (Paramètres › Apparence).
 * Tant que `active` est null, l’accueil stock (actuel) s’affiche — rien n’est cassé.
 */

export const HOME_APPEARANCE_STORAGE_KEY = 'momentum.homeAppearance.v1';
export const HOME_APPEARANCE_EVENT = 'momentum:home-appearance';

export const HOME_NAV_TAB_IDS = [
  'home',
  'dashboard',
  'today',
  'quests',
  'apprentissage',
  'rubiks',
  'books',
  'code',
  'finance',
  'settings'
];

export const HOME_NAV_TAB_LABELS = {
  home: 'Accueil',
  dashboard: 'Tableau de bord',
  today: 'Sport',
  quests: 'Quêtes',
  apprentissage: 'Apprentissage',
  rubiks: 'Rubik’s cube',
  books: 'Livres',
  code: 'Code',
  finance: 'Finance',
  settings: 'Paramètres'
};

/** Styles de boutons de navigation (barre du haut). */
export const HOME_NAV_STYLES = [
  { id: 'verre', label: 'Verre', hint: 'Pilules translucides (actuel)' },
  { id: 'encoche', label: 'Encoche', hint: 'Angles coupés, trait accent' },
  { id: 'plein', label: 'Plein', hint: 'Actif rempli d’accent' },
  { id: 'souligne', label: 'Souligné', hint: 'Sans fond, trait sous l’actif' },
  { id: 'contour', label: 'Contour', hint: 'Bordure fine, actif accent' },
  { id: 'xpHud', label: 'HUD XP', hint: 'Coins coupés façon barre XP' }
];

export const HOME_NAV_LAYOUTS = [
  { id: 'row', label: 'Une ligne', hint: 'Comme aujourd’hui (desktop)' },
  { id: 'wrap', label: 'Plusieurs lignes', hint: 'Retour à la ligne, ancré à droite' },
  { id: 'stack', label: 'Colonne', hint: 'Empilés à droite, sans pousser le contenu' }
];

export const HOME_ACCENTS = [
  { id: 'violet', label: 'Violet', hex: '#a06bff' },
  { id: 'rose', label: 'Rose', hex: '#ff5fa8' },
  { id: 'rouge', label: 'Rouge', hex: '#ff5a4a' },
  { id: 'orange', label: 'Orange', hex: '#ff8a3d' },
  { id: 'argent', label: 'Argent', hex: '#cdd3e2' }
];

/** Uniquement bas gauche / bas droite — pas de colonne latérale. */
export const HOME_ZONES = ['bottomLeft', 'bottomRight'];

export const HOME_ZONE_LABELS = {
  bottomLeft: 'Bas gauche',
  bottomRight: 'Bas droite'
};

export const HOME_WIDGET_DEFS = [
  {
    id: 'about',
    title: 'À propos de Momentum',
    description: 'Texte d’accueil + listes + CTA',
    variants: [
      { id: 'full', label: 'Complet' },
      { id: 'short', label: 'Court' }
    ],
    zones: [...HOME_ZONES],
    defaultZone: 'bottomLeft',
    defaultVariant: 'full',
    defaultEnabled: true,
    defaultOrder: 10
  },
  {
    id: 'xpBar',
    title: 'Barre d’XP',
    description: 'Progression grade / niveau / XP restants',
    variants: [
      { id: 'minimal', label: 'Minimal' },
      { id: 'compact', label: 'Compact' },
      { id: 'detailed', label: 'Détaillé' }
    ],
    zones: [...HOME_ZONES],
    defaultZone: 'bottomRight',
    defaultVariant: 'compact',
    defaultEnabled: false,
    defaultOrder: 20
  },
  {
    id: 'todayExercises',
    title: 'Exercices du jour',
    description: 'Séance du jour — coches & champs (même stockage)',
    variants: [
      { id: 'full', label: 'Complet' },
      { id: 'checks', label: 'Coches seules' }
    ],
    zones: [...HOME_ZONES],
    defaultZone: 'bottomLeft',
    defaultVariant: 'full',
    defaultEnabled: false,
    defaultOrder: 30
  },
  {
    id: 'month',
    title: 'Mois en cours',
    description: 'Calendrier ou bandeau des jours entraînés',
    variants: [
      { id: 'minimal', label: 'Minimal' },
      { id: 'calendar', label: 'Calendrier' }
    ],
    zones: [...HOME_ZONES],
    defaultZone: 'bottomLeft',
    defaultVariant: 'calendar',
    defaultEnabled: false,
    defaultOrder: 40
  },
  {
    id: 'week',
    title: 'Semaine en cours',
    description: '7 tuiles ou pastilles de la semaine',
    variants: [
      { id: 'band', label: 'Bandeau' },
      { id: 'dots', label: 'Points' }
    ],
    zones: [...HOME_ZONES],
    defaultZone: 'bottomRight',
    defaultVariant: 'dots',
    defaultEnabled: false,
    defaultOrder: 50
  },
  {
    id: 'stats',
    title: 'Stats chiffrées',
    description: 'Métriques du mois au choix',
    variants: [
      { id: 'grid', label: 'Grille' },
      { id: 'row', label: 'Ligne' }
    ],
    zones: [...HOME_ZONES],
    defaultZone: 'bottomRight',
    defaultVariant: 'grid',
    defaultEnabled: false,
    defaultOrder: 60
  }
];

export const HOME_METRIC_DEFS = [
  { id: 'reps', label: 'Reps', tone: 'accent' },
  { id: 'kg', label: 'Kg soulevés', tone: 'accent' },
  { id: 'days', label: 'Jours entraînés', tone: 'accent' },
  { id: 'steps', label: 'Pas du mois', tone: 'green' },
  { id: 'km', label: 'Km courus', tone: 'green' },
  { id: 'sleep', label: 'Sommeil moyen', tone: 'gold' }
];

function defaultMetrics() {
  return {
    reps: true,
    kg: true,
    days: true,
    steps: true,
    km: false,
    sleep: true
  };
}

function defaultXpOptions() {
  return { image: true, total: true, percent: true };
}

function defaultWidgets() {
  const out = {};
  HOME_WIDGET_DEFS.forEach((def) => {
    out[def.id] = {
      enabled: def.defaultEnabled === true,
      zone: def.defaultZone,
      variant: def.defaultVariant,
      order: def.defaultOrder
    };
  });
  return out;
}

function migrateZone(zone, fallback) {
  if (zone === 'bottomLeft' || zone === 'bottomRight') return zone;
  /* Anciennes zones left/right → bas gauche */
  if (zone === 'left' || zone === 'right') return 'bottomLeft';
  return fallback;
}

/** Config visuelle « modèle de base » = accueil actuel Momentum. */
export function stockHomeLayoutConfig() {
  return {
    navStyle: 'verre',
    navLayout: 'row',
    navOrder: [...HOME_NAV_TAB_IDS],
    showRobot: true,
    showKeywords: true,
    showLocation: true,
    showLanguage: true,
    accentId: 'violet',
    metrics: defaultMetrics(),
    xpOptions: defaultXpOptions(),
    widgets: defaultWidgets()
  };
}

function normalizeNavOrder(raw) {
  const allowed = new Set(HOME_NAV_TAB_IDS);
  const seen = new Set();
  const out = [];
  if (Array.isArray(raw)) {
    for (const id of raw) {
      if (!allowed.has(id) || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
  }
  for (const id of HOME_NAV_TAB_IDS) {
    if (!seen.has(id)) out.push(id);
  }
  return out;
}

function normalizeLayoutConfig(raw) {
  const base = stockHomeLayoutConfig();
  if (!raw || typeof raw !== 'object') return base;

  const navStyle = HOME_NAV_STYLES.some((s) => s.id === raw.navStyle)
    ? raw.navStyle
    : base.navStyle;
  const navLayout = HOME_NAV_LAYOUTS.some((s) => s.id === raw.navLayout)
    ? raw.navLayout
    : base.navLayout;
  const accentId = HOME_ACCENTS.some((a) => a.id === raw.accentId)
    ? raw.accentId
    : base.accentId;

  const widgets = defaultWidgets();
  if (raw.widgets && typeof raw.widgets === 'object') {
    HOME_WIDGET_DEFS.forEach((def) => {
      const w = raw.widgets[def.id];
      if (!w || typeof w !== 'object') return;
      const order =
        typeof w.order === 'number' && Number.isFinite(w.order) ? w.order : def.defaultOrder;
      widgets[def.id] = {
        enabled: typeof w.enabled === 'boolean' ? w.enabled : def.defaultEnabled === true,
        zone: migrateZone(w.zone, def.defaultZone),
        variant: def.variants.some((v) => v.id === w.variant) ? w.variant : def.defaultVariant,
        order
      };
    });
  }

  const metrics = defaultMetrics();
  if (raw.metrics && typeof raw.metrics === 'object') {
    HOME_METRIC_DEFS.forEach((def) => {
      if (typeof raw.metrics[def.id] === 'boolean') metrics[def.id] = raw.metrics[def.id];
    });
  }

  const xpOptions = defaultXpOptions();
  if (raw.xpOptions && typeof raw.xpOptions === 'object') {
    ['image', 'total', 'percent'].forEach((key) => {
      if (typeof raw.xpOptions[key] === 'boolean') xpOptions[key] = raw.xpOptions[key];
    });
  }

  return {
    navStyle,
    navLayout,
    navOrder: normalizeNavOrder(raw.navOrder),
    showRobot: raw.showRobot !== false,
    showKeywords: raw.showKeywords !== false,
    showLocation: raw.showLocation !== false,
    showLanguage: raw.showLanguage !== false,
    accentId,
    metrics,
    xpOptions,
    widgets
  };
}

function normalizeStore(raw) {
  const draft = normalizeLayoutConfig(raw?.draft);
  let active = null;
  if (raw?.active && typeof raw.active === 'object') {
    active = normalizeLayoutConfig(raw.active);
  }
  const savedPresets = Array.isArray(raw?.savedPresets)
    ? raw.savedPresets
        .filter((p) => p && typeof p.id === 'string' && p.config)
        .slice(0, 24)
        .map((p) => ({
          id: String(p.id).slice(0, 48),
          name: String(p.name || 'Preset').slice(0, 48),
          savedAt: p.savedAt || new Date().toISOString(),
          config: normalizeLayoutConfig(p.config)
        }))
    : [];

  return {
    version: 1,
    active,
    draft,
    savedPresets
  };
}

function readRaw() {
  try {
    return localStorage.getItem(HOME_APPEARANCE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(HOME_APPEARANCE_STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(HOME_APPEARANCE_EVENT, { detail: store }));
  }
  return store;
}

export function getHomeAppearanceStore() {
  const raw = readRaw();
  if (!raw) return normalizeStore(null);
  try {
    return normalizeStore(JSON.parse(raw));
  } catch {
    return normalizeStore(null);
  }
}

/** Config réellement appliquée à l’accueil. `null` = modèle stock inchangé. */
export function getAppliedHomeLayout() {
  return getHomeAppearanceStore().active;
}

export function getHomeAppearanceDraft() {
  return getHomeAppearanceStore().draft;
}

export function updateHomeAppearanceDraft(partial) {
  const store = getHomeAppearanceStore();
  const next = normalizeStore({
    ...store,
    draft: { ...store.draft, ...partial }
  });
  return writeStore(next);
}

export function applyHomeAppearanceDraft() {
  const store = getHomeAppearanceStore();
  return writeStore(
    normalizeStore({
      ...store,
      active: { ...store.draft }
    })
  );
}

/** Revenir au modèle de base (accueil actuel) sans effacer les brouillons / presets. */
export function resetHomeAppearanceToStock() {
  const store = getHomeAppearanceStore();
  return writeStore(
    normalizeStore({
      ...store,
      active: null,
      draft: stockHomeLayoutConfig()
    })
  );
}

export function saveHomeAppearancePreset(name) {
  const store = getHomeAppearanceStore();
  const id = `preset-${Date.now().toString(36)}`;
  const savedPresets = [
    {
      id,
      name: String(name || 'Ma page').trim().slice(0, 48) || 'Ma page',
      savedAt: new Date().toISOString(),
      config: { ...store.draft }
    },
    ...store.savedPresets
  ].slice(0, 24);
  return writeStore(normalizeStore({ ...store, savedPresets }));
}

export function loadHomeAppearancePreset(presetId, { apply = false } = {}) {
  const store = getHomeAppearanceStore();
  const preset = store.savedPresets.find((p) => p.id === presetId);
  if (!preset) return store;
  const draft = { ...preset.config };
  return writeStore(
    normalizeStore({
      ...store,
      draft,
      active: apply ? { ...draft } : store.active
    })
  );
}

export function deleteHomeAppearancePreset(presetId) {
  const store = getHomeAppearanceStore();
  return writeStore(
    normalizeStore({
      ...store,
      savedPresets: store.savedPresets.filter((p) => p.id !== presetId)
    })
  );
}

export function applyHomePresetBuiltin(kind) {
  const stock = stockHomeLayoutConfig();
  let draft = stock;
  if (kind === 'sportif') {
    draft = {
      ...stock,
      widgets: {
        ...stock.widgets,
        about: { ...stock.widgets.about, enabled: false },
        todayExercises: {
          enabled: true,
          zone: 'bottomLeft',
          variant: 'full',
          order: 10
        },
        month: {
          enabled: true,
          zone: 'bottomLeft',
          variant: 'calendar',
          order: 20
        },
        xpBar: {
          enabled: true,
          zone: 'bottomRight',
          variant: 'compact',
          order: 10
        }
      }
    };
  } else if (kind === 'minimal') {
    draft = {
      ...stock,
      widgets: {
        ...stock.widgets,
        about: { ...stock.widgets.about, enabled: false },
        xpBar: {
          enabled: true,
          zone: 'bottomLeft',
          variant: 'minimal',
          order: 10
        },
        week: {
          enabled: true,
          zone: 'bottomRight',
          variant: 'dots',
          order: 10
        }
      }
    };
  }
  const store = getHomeAppearanceStore();
  return writeStore(normalizeStore({ ...store, draft }));
}

/** Active un widget dans une zone (bouton + de l’aperçu). */
export function enableHomeWidgetInZone(widgetId, zone) {
  const def = HOME_WIDGET_DEFS.find((d) => d.id === widgetId);
  if (!def || !HOME_ZONES.includes(zone)) return getHomeAppearanceStore();
  const store = getHomeAppearanceStore();
  const draft = store.draft || stockHomeLayoutConfig();
  const peers = HOME_WIDGET_DEFS.filter(
    (d) => draft.widgets[d.id]?.enabled && draft.widgets[d.id]?.zone === zone
  );
  const maxOrder = peers.reduce((m, d) => Math.max(m, draft.widgets[d.id]?.order ?? 0), 0);
  return writeStore(
    normalizeStore({
      ...store,
      draft: {
        ...draft,
        widgets: {
          ...draft.widgets,
          [widgetId]: {
            ...draft.widgets[widgetId],
            enabled: true,
            zone,
            variant: draft.widgets[widgetId]?.variant || def.defaultVariant,
            order: maxOrder + 10
          }
        }
      }
    })
  );
}

export function resolveHomeAccentHex(config) {
  const id = config?.accentId || 'violet';
  return HOME_ACCENTS.find((a) => a.id === id)?.hex || '#a06bff';
}

/** Widgets actifs d’une zone, triés. */
export function listHomeWidgetsInZone(layout, zone) {
  if (!layout?.widgets || !HOME_ZONES.includes(zone)) return [];
  return HOME_WIDGET_DEFS.map((def) => {
    const w = layout.widgets[def.id];
    if (!w?.enabled) return null;
    const z = migrateZone(w.zone, def.defaultZone);
    if (z !== zone) return null;
    return {
      def,
      variant: w.variant || def.defaultVariant,
      order: typeof w.order === 'number' ? w.order : def.defaultOrder
    };
  })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order || a.def.defaultOrder - b.def.defaultOrder);
}

export function subscribeHomeAppearance(listener) {
  const onCustom = (event) => listener(event.detail || getHomeAppearanceStore());
  const onStorage = (event) => {
    if (event.key === HOME_APPEARANCE_STORAGE_KEY) listener(getHomeAppearanceStore());
  };
  window.addEventListener(HOME_APPEARANCE_EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(HOME_APPEARANCE_EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}
