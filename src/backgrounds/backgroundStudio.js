/**
 * Atelier des fonds réglables.
 * Le fond vert (momentum) n'a pas d'entrée : il n'ouvre pas ce panneau.
 * Un prochain fond réglable s'ajoute ici, pas dans le composant vert.
 */

const ACCRETION = 'accretion-disc-03';
const SATURN = 'particle-saturn';

function clamp(value, min, max, fallback) {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function hex(value, fallback) {
  const raw = String(value || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw.toLowerCase() : fallback;
}

function range(key, label, min, max, step, fallback) {
  return { key, label, type: 'range', min, max, step, fallback };
}

function color(key, label, fallback) {
  return { key, label, type: 'color', fallback };
}

function toggle(key, label, fallback) {
  return { key, label, type: 'toggle', fallback };
}

function select(key, label, options, fallback) {
  return { key, label, type: 'select', options, fallback };
}

export const BACKGROUND_STUDIOS = {
  [ACCRETION]: {
    baseId: ACCRETION,
    title: "Disque d'accrétion",
    fields: [
      color('background', 'Fond', '#000000'),
      color('baseColor', 'Couleur de base', '#1900ff'),
      color('accentColor', "Couleur d'accent", '#a0c0ff'),
      range('density', 'Densité', 1, 70, 1, 61),
      range('dotSize', 'Taille des points', 10, 160, 1, 127),
      range('speed', 'Vitesse', 0, 150, 1, 100),
      range('distance', 'Distance', 80, 400, 1, 220)
    ],
    groups: [
      {
        id: 'field',
        label: 'Champ',
        fields: [
          range('scatter', 'Dispersion', 0, 100, 1, 0),
          range('blur', 'Flou', 0, 100, 1, 0)
        ]
      },
      {
        id: 'disc',
        label: 'Disque',
        fields: [
          range('tilt', 'Inclinaison', -30, 70, 1, 14),
          range('core', 'Noyau', 0, 40, 1, 7),
          range('arms', 'Bras', 1, 8, 1, 4)
        ]
      },
      {
        id: 'jets',
        label: 'Jets',
        fields: [
          range('jetAmount', 'Quantité', 0, 100, 1, 0),
          range('jetLength', 'Longueur', 0, 400, 1, 200),
          range('jetSpread', 'Ouverture', 0, 80, 1, 34)
        ]
      }
    ]
  },
  [SATURN]: {
    baseId: SATURN,
    title: 'Saturne',
    fields: [
      color('background', 'Fond', '#07060a'),
      color('coreColor', 'Couleur du noyau', '#997f00'),
      color('ringColor', "Couleur de l'anneau", '#ffd400'),
      range('density', 'Densité', 1, 20, 1, 20),
      range('particleSize', 'Taille des points', 1, 20, 1, 14),
      range('glow', 'Lueur', 1, 20, 1, 20),
      range('tilt', 'Inclinaison', -40, 40, 1, 6),
      range('roll', 'Roulis', -40, 40, 1, 7),
      range('spinSpeed', 'Rotation', 0, 20, 1, 7),
      range('sizePercent', 'Taille à l\'écran', 40, 180, 1, 134)
    ],
    groups: [
      {
        id: 'ring',
        label: 'Anneau',
        fields: [
          range('innerRadius', 'Rayon interne', 105, 180, 1, 138),
          range('outerRadius', 'Rayon externe', 140, 300, 1, 262),
          range('gaps', 'Lacunes', 0, 4, 1, 2),
          range('orbitSpeed', "Vitesse d'orbite", 0, 20, 1, 9)
        ]
      }
    ]
  },
  'chain-vortex': {
    baseId: 'chain-vortex',
    title: 'Vortex de chaînes',
    fields: [
      color('background', 'Fond', '#070000'),
      color('baseColor', 'Couleur de base', '#747474'),
      range('speed', 'Vitesse', -100, 100, 1, 100),
      range('density', 'Densité', 1, 24, 1, 7),
      range('twist', 'Torsion', -24, 24, 1, -5)
    ],
    groups: []
  },
  'chrome-cells': {
    baseId: 'chrome-cells',
    title: 'Cellules chromées',
    fields: [
      color('background', 'Fond', '#040405'),
      color('baseColor', 'Couleur de base', '#989898'),
      color('accentColor', "Couleur d'accent", '#ffffff'),
      range('speed', 'Vitesse', 0, 200, 1, 100),
      range('hover', 'Survol', 0, 200, 1, 200),
      toggle('cursor', 'Curseur', true)
    ],
    groups: [
      {
        id: 'web',
        label: 'Toile',
        fields: [
          range('scale', 'Échelle', 10, 200, 1, 46),
          range('thickness', 'Épaisseur', 0, 200, 1, 30),
          range('detail', 'Détail', 0, 200, 1, 200),
          range('warp', 'Déformation', 0, 400, 1, 250)
        ]
      },
      {
        id: 'metal',
        label: 'Métal',
        fields: [
          range('polish', 'Poli', 0, 200, 1, 100),
          range('contrast', 'Contraste', 20, 200, 1, 101),
          range('light', 'Angle de lumière', 0, 360, 1, 136)
        ]
      }
    ]
  },
  'cosmic-bg': {
    baseId: 'cosmic-bg',
    title: 'Cosmos',
    fields: [
      toggle('core', 'Noyau', true),
      color('coreColor', 'Couleur du noyau', '#6823c3'),
      color('midColor', 'Gaz médian', '#007bff'),
      color('accentColor', 'Accent', '#9900ff'),
      color('outerColor', 'Gaz extérieur', '#f9f9f9'),
      range('detail', 'Détail', 1, 20, 1, 20),
      range('brightness', 'Luminosité', 0, 100, 1, 32),
      range('speed', 'Vitesse', 0, 30, 1, 30),
      range('rotation', 'Rotation', 0, 20, 1, 15)
    ],
    groups: []
  },
  'grass-field': {
    baseId: 'grass-field',
    title: "Champ d'herbe",
    fields: [
      color('background', 'Fond', '#000000'),
      color('horizon', 'Horizon', '#000000'),
      color('bladeBase', 'Base des brins', '#000000'),
      color('bladeTip', 'Pointe des brins', '#3fff00'),
      range('density', 'Densité', 10, 100, 1, 100),
      range('speed', 'Vitesse', 0, 100, 1, 100),
      range('hover', 'Survol', 0, 200, 1, 200),
      range('reach', 'Portée', 10, 300, 1, 157),
      range('distance', 'Distance caméra', 40, 240, 1, 160),
      toggle('repel', 'Repousser', true)
    ],
    groups: [
      {
        id: 'field',
        label: 'Champ',
        fields: [
          range('bladeHeight', 'Hauteur', 30, 250, 1, 181),
          range('terrain', 'Terrain', 0, 250, 1, 100),
          range('haze', 'Brume', 0, 200, 1, 100)
        ]
      },
      {
        id: 'wind',
        label: 'Vent',
        fields: [
          range('windStrength', 'Force', 0, 300, 1, 100),
          range('gust', 'Rafale', 0, 200, 1, 90),
          range('direction', 'Direction', 0, 360, 1, 15)
        ]
      }
    ]
  },
  tornado: {
    baseId: 'tornado',
    title: 'Tornade',
    fields: [
      color('background', 'Fond', '#000000'),
      range('topRadius', 'Sommet', 40, 1000, 1, 900),
      range('waistRadius', 'Taille', 10, 400, 1, 103),
      range('waistPosition', 'Position de la taille', 0, 100, 1, 41),
      range('bottomRadius', 'Base', 40, 1500, 1, 585),
      range('twist', 'Torsion', 0, 30, 1, 5),
      range('zoom', 'Zoom', 1, 100, 1, 20),
      range('speed', 'Vitesse', 0, 100, 1, 10),
      select('direction', 'Direction', [
        { value: 'up', label: 'Haut' },
        { value: 'down', label: 'Bas' }
      ], 'up'),
      toggle('dots', 'Points', true),
      toggle('comets', 'Comètes', true),
      toggle('repel', 'Repousser', true)
    ],
    groups: [
      {
        id: 'lines',
        label: 'Lignes',
        fields: [
          range('lineCount', 'Nombre', 20, 480, 1, 240),
          color('lineColor', 'Couleur', '#ff9e7a'),
          range('lineGlow', 'Halo', 0, 20, 1, 8)
        ]
      },
      {
        id: 'dots',
        label: 'Points',
        fields: [
          range('dotCount', 'Nombre', 0, 12000, 100, 8000),
          range('dotSize', 'Taille', 1, 40, 1, 20),
          color('dotColor', 'Couleur', '#ffffff')
        ]
      },
      {
        id: 'comets',
        label: 'Comètes',
        fields: [
          range('cometCount', 'Nombre', 0, 40, 1, 12),
          range('cometSpeed', 'Vitesse', 0, 20, 1, 4),
          color('cometColor', 'Couleur', '#ff6500')
        ]
      }
    ]
  },
  'lattice-flight': {
    baseId: 'lattice-flight',
    title: 'Vol de lattice',
    fields: [
      color('background', 'Fond', '#000000'),
      color('baseColor', 'Couleur de base', '#00ffff'),
      range('density', 'Densité', 50, 500, 1, 307),
      range('speed', 'Vitesse', 0, 100, 1, 27),
      range('thickness', 'Épaisseur', 1, 40, 1, 4),
      range('fog', 'Brouillard', 1, 200, 1, 100),
      range('distance', 'Distance', 1, 20, 1, 3),
      range('yaw', 'Caméra yaw', -90, 90, 1, -43),
      range('pitch', 'Caméra pitch', -10, 90, 1, 65),
      toggle('cursor', 'Curseur', true)
    ],
    groups: []
  }
};

function allFields(studio) {
  return [...studio.fields, ...studio.groups.flatMap((group) => group.fields)];
}

const STUDIO_EVENT = 'momentum:background-studio';

export function studioFor(baseId) {
  return BACKGROUND_STUDIOS[baseId] || null;
}

export function setBackgroundStudioOpen(open) {
  if (typeof document === 'undefined') return;
  if (open) document.documentElement.dataset.backgroundStudio = '1';
  else delete document.documentElement.dataset.backgroundStudio;
  window.dispatchEvent(new CustomEvent(STUDIO_EVENT));
}

export function isBackgroundStudioOpen() {
  return typeof document !== 'undefined' && document.documentElement.dataset.backgroundStudio === '1';
}

export function defaultParams(baseId) {
  const studio = studioFor(baseId);
  if (!studio) return null;
  const params = {};
  allFields(studio).forEach((field) => {
    params[field.key] = field.fallback;
  });
  return params;
}

export function normalizeParams(baseId, raw) {
  const studio = studioFor(baseId);
  const defaults = defaultParams(baseId);
  if (!studio || !defaults) return null;
  const source = raw && typeof raw === 'object' ? raw : {};
  const params = {};
  allFields(studio).forEach((field) => {
    if (field.type === 'color') params[field.key] = hex(source[field.key], field.fallback);
    else if (field.type === 'toggle') {
      if (source[field.key] === true || source[field.key] === false) params[field.key] = source[field.key];
      else params[field.key] = field.fallback;
    } else if (field.type === 'select') {
      const values = (field.options || []).map((option) => option.value);
      params[field.key] = values.includes(source[field.key]) ? source[field.key] : field.fallback;
    } else params[field.key] = clamp(source[field.key], field.min, field.max, field.fallback);
  });
  return params;
}
