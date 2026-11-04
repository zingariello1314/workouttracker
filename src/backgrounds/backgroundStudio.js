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
  },
  'light-cables': {
    baseId: 'light-cables',
    title: 'Câbles lumineux',
    fields: [
      color('background', 'Fond', '#000000'),
      color('baseColor', 'Couleur de base', '#000000'),
      color('accentColor', "Couleur d'accent", '#ffb000'),
      color('highlight', 'Surbrillance', '#ffd900'),
      range('speed', 'Vitesse', 0, 100, 1, 34),
      range('hover', 'Survol', 0, 200, 1, 114),
      range('grab', 'Saisie', 10, 300, 1, 100),
      select('direction', 'Direction', [
        { value: 'ttb', label: 'Haut → bas' },
        { value: 'btt', label: 'Bas → haut' },
        { value: 'ltr', label: 'Gauche → droite' },
        { value: 'rtl', label: 'Droite → gauche' }
      ], 'ttb'),
      range('positionX', 'Position X', -100, 100, 1, -13),
      range('positionY', 'Position Y', -100, 100, 1, -21),
      toggle('cursor', 'Curseur', true)
    ],
    groups: [
      {
        id: 'bundle',
        label: 'Faisceau',
        fields: [
          range('count', 'Nombre', 4, 48, 1, 48),
          range('bend', 'Courbure', 0, 150, 1, 0),
          range('spread', 'Écart', 10, 300, 1, 89),
          range('thickness', 'Épaisseur', 20, 400, 1, 100),
          range('widthStart', 'Largeur début', 0, 300, 1, 100),
          range('widthEnd', 'Largeur fin', 0, 300, 1, 100)
        ]
      },
      {
        id: 'flow',
        label: 'Flux',
        fields: [
          range('flow', 'Débit', 0, 300, 1, 300),
          range('pulses', 'Impulsions', 1, 12, 1, 1)
        ]
      }
    ]
  },
  'liquid-vortex': {
    baseId: 'liquid-vortex',
    title: 'Vortex liquide',
    fields: [
      color('smoke', 'Fumée', '#fff700'),
      color('deep', 'Ombre', '#fff700'),
      color('ember', 'Braise', '#fff700'),
      range('swirl', 'Tourbillon', 1, 10, 1, 10),
      range('turbulence', 'Turbulence', 0, 20, 1, 20),
      range('detail', 'Détail', 1, 20, 1, 20),
      range('density', 'Densité', 1, 10, 1, 4),
      range('contrast', 'Contraste', 1, 20, 1, 20),
      range('emberAmount', 'Braises', 0, 20, 1, 0),
      range('speed', 'Vitesse', 0, 20, 1, 5),
      range('hoverBoost', 'Boost survol', 0, 20, 1, 20),
      range('sizePercent', 'Taille', 20, 200, 1, 100),
      toggle('cursor', 'Curseur', true)
    ],
    groups: []
  },
  'mood-field': {
    baseId: 'mood-field',
    title: "Champ d'humeur",
    fields: [
      color('background', 'Fond', '#05060a'),
      color('intenseColor', 'Intense', '#ff00b3'),
      color('calmColor', 'Calme', '#2f6bff'),
      select('mood', 'Humeur', [
        { value: 'intense', label: 'Intense' },
        { value: 'calm', label: 'Calme' }
      ], 'intense'),
      range('speed', 'Vitesse', 0, 100, 1, 50),
      range('density', 'Densité', 1, 200, 1, 100),
      range('damping', 'Amortissement', 1, 100, 1, 50),
      toggle('cursor', 'Curseur', true)
    ],
    groups: [
      {
        id: 'flow',
        label: 'Flux',
        fields: [
          range('warp', 'Déformation', 0, 200, 1, 100),
          range('turbulence', 'Turbulence', 0, 200, 1, 100),
          range('contrast', 'Contraste', 0, 200, 1, 100)
        ]
      },
      {
        id: 'cursorGroup',
        label: 'Curseur',
        fields: [
          range('reach', 'Portée', 10, 500, 1, 260),
          range('hover', 'Survol', 0, 200, 1, 100),
          range('swirl', 'Tourbillon', -90, 90, 1, 80)
        ]
      }
    ]
  },
  'rain-puddle': {
    baseId: 'rain-puddle',
    title: 'Flaques de pluie',
    fields: [
      color('background', 'Fond', '#000000'),
      color('baseColor', 'Couleur de base', '#03661a'),
      color('accentColor', "Couleur d'accent", '#ffffff'),
      range('rain', 'Pluie', 0, 100, 1, 100),
      range('speed', 'Vitesse', 0, 200, 1, 100),
      range('tilt', 'Inclinaison', 2, 60, 1, 25),
      toggle('cursor', 'Curseur', true)
    ],
    groups: [
      {
        id: 'puddles',
        label: 'Flaques',
        fields: [
          range('coverage', 'Couverture', 0, 100, 1, 62),
          range('puddleScale', 'Échelle', 10, 300, 1, 170),
          range('reflection', 'Réflexion', 0, 200, 1, 150)
        ]
      },
      {
        id: 'drops',
        label: 'Gouttes',
        fields: [
          range('ripples', 'Ondulations', 0, 200, 1, 100),
          range('streaks', 'Traînées', 0, 200, 1, 70)
        ]
      },
      {
        id: 'cursorGroup',
        label: 'Curseur',
        fields: [
          range('reach', 'Portée', 10, 200, 1, 54),
          range('cursorRipple', 'Onde', 0, 200, 1, 100),
          range('glow', 'Lueur', 0, 200, 1, 60)
        ]
      }
    ]
  },
  snowfall: {
    baseId: 'snowfall',
    title: 'Chute de neige',
    fields: [
      color('background', 'Fond', '#000000'),
      color('color', 'Couleur', '#ffffff'),
      range('count', 'Nombre', 0, 1200, 1, 632),
      range('wind', 'Vent', -10, 10, 1, -1),
      range('windVariation', 'Variation du vent', 0, 5, 0.1, 0),
      select('direction', 'Direction', [
        { value: 'down', label: 'Bas' },
        { value: 'up', label: 'Haut' }
      ], 'down'),
      toggle('cursor', 'Curseur', true)
    ],
    groups: [
      {
        id: 'flakes',
        label: 'Flocons',
        fields: [
          range('sizeMin', 'Taille min', 0.2, 8, 0.1, 0.5),
          range('sizeMax', 'Taille max', 0.2, 8, 0.1, 1.5),
          range('speedMin', 'Vitesse min', 0.1, 8, 0.1, 0.8),
          range('speedMax', 'Vitesse max', 0.1, 8, 0.1, 2.7),
          range('opacityMin', 'Opacité min', 0, 100, 1, 30),
          range('opacityMax', 'Opacité max', 0, 100, 1, 90)
        ]
      }
    ]
  },
  'toon-fireball': {
    baseId: 'toon-fireball',
    title: 'Boule de feu toon',
    fields: [
      color('background', 'Fond', '#000000'),
      color('baseColor', 'Couleur de base', '#ed7363'),
      color('accentColor', "Couleur d'accent", '#ffffff'),
      range('density', 'Densité', 1, 40, 1, 18),
      range('size', 'Taille', 20, 300, 1, 182),
      range('speed', 'Vitesse', 0, 100, 1, 21),
      range('angle', 'Angle', -90, 90, 1, -45),
      range('tilt', 'Inclinaison', 0, 90, 1, 45)
    ],
    groups: [
      {
        id: 'fire',
        label: 'Feu',
        fields: [
          color('fireCore', 'Cœur', '#ff0000'),
          color('fireTrail', 'Traînée', '#ff0e0e'),
          color('fireSteam', 'Vapeur', '#fb7171')
        ]
      },
      {
        id: 'bloom',
        label: 'Éclat',
        fields: [
          range('bloomStrength', 'Force', 0, 400, 1, 172),
          range('bloomRadius', 'Rayon', 0, 100, 1, 39)
        ]
      }
    ]
  },
  'wire-terrain': {
    baseId: 'wire-terrain',
    title: 'Terrain filaire',
    fields: [
      color('background', 'Fond', '#000000'),
      color('lineColor', 'Lignes', '#b12b00'),
      color('accentColor', "Couleur d'accent", '#ff3c00'),
      range('density', 'Densité', 10, 120, 1, 120),
      range('speed', 'Vitesse', 0, 200, 1, 100),
      range('relief', 'Relief', 0, 200, 1, 100),
      range('sunSize', 'Soleil', 0, 200, 1, 100),
      range('cameraHeight', 'Hauteur caméra', 10, 200, 1, 94),
      range('hover', 'Survol', 0, 300, 1, 200),
      toggle('cursor', 'Curseur', true)
    ],
    groups: []
  },
  'wire-terrain-02': {
    baseId: 'wire-terrain-02',
    title: 'Terrain filaire 2',
    fields: [
      color('background', 'Fond', '#0b0420'),
      color('lineColor', 'Lignes', '#ff2bd6'),
      color('accentColor', "Couleur d'accent", '#ffb23f'),
      range('density', 'Densité', 10, 120, 1, 80),
      range('speed', 'Vitesse', 0, 200, 1, 50),
      range('relief', 'Relief', 0, 200, 1, 100),
      range('sunSize', 'Soleil', 0, 200, 1, 100),
      range('cameraHeight', 'Hauteur caméra', 10, 200, 1, 100),
      range('hover', 'Survol', 0, 300, 1, 100),
      range('stars', 'Étoiles', 0, 100, 1, 50),
      toggle('cursor', 'Curseur', true)
    ],
    groups: []
  },
  'particle-drift': {
    baseId: 'particle-drift',
    title: 'Dérive de particules',
    fields: [
      color('background', 'Fond', '#030509'),
      color('baseColor', 'Couleur de base', '#ffffff'),
      color('accentColor', 'Survol', '#fdfd00'),
      range('density', 'Densité', 10, 400, 1, 400),
      range('dotSize', 'Points', 1, 24, 1, 6),
      range('speed', 'Vitesse', 0, 100, 1, 50),
      range('direction', 'Direction', 0, 360, 1, 0),
      range('hover', 'Intensité survol', 0, 200, 1, 200),
      range('linkDistance', 'Liens', 0, 400, 1, 230),
      range('linkThickness', 'Épaisseur liens', 0.5, 8, 0.5, 1),
      toggle('cursor', 'Curseur', true)
    ],
    groups: []
  },
  'formula-stream': {
    baseId: 'formula-stream',
    title: 'Flux de formules',
    fields: [
      color('background', 'Fond', '#0a0a0c'),
      color('textColor', 'Texte', '#e8e4dc'),
      range('textOpacity', 'Opacité texte', 0, 100, 1, 55),
      color('accentColor', "Couleur d'accent", '#ff4900'),
      range('fontSize', 'Taille police', 10, 80, 1, 26),
      range('density', 'Densité', 1, 40, 1, 18),
      range('speed', 'Vitesse', 0, 150, 1, 69),
      range('curve', 'Courbe', 0, 100, 1, 50),
      range('gap', 'Écart', 10, 200, 1, 81),
      range('hover', 'Survol', 0, 200, 1, 139),
      range('reach', 'Portée', 40, 400, 1, 240),
      toggle('cursor', 'Curseur', true)
    ],
    groups: [
      {
        id: 'font',
        label: 'Police',
        fields: [
          select('fontFamily', 'Famille', [
            { value: 'Georgia', label: 'Georgia' },
            { value: 'Times New Roman', label: 'Times New Roman' },
            { value: 'serif', label: 'Serif' }
          ], 'Georgia'),
          select('fontStyle', 'Style', [
            { value: 'italic', label: 'Italique' },
            { value: 'normal', label: 'Normal' }
          ], 'italic'),
          range('fontWeight', 'Graisse', 100, 900, 100, 400)
        ]
      }
    ]
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
