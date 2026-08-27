import { PHYSICAL_COLORS, DEFAULT_SCHEME } from './colorScheme';

export const NOTATION_MODES = ['wca', 'plain', 'both'];

const FACE_ROLE_FR = {
  U: 'du haut',
  D: 'du dessous',
  F: 'de devant',
  B: 'de derrière',
  R: 'de droite',
  L: 'de gauche'
};

const FACE_ROLE_EN = {
  U: 'top',
  D: 'bottom',
  F: 'front',
  B: 'back',
  R: 'right',
  L: 'left'
};

const FACE_LETTER = {
  U: 'U',
  D: 'D',
  F: 'F',
  B: 'B',
  R: 'R',
  L: 'L'
};

export function parseMoveToken(token) {
  const m = String(token || '').trim();
  const face = m[0];
  if (!FACE_LETTER[face]) return null;
  const twice = m.includes('2');
  const prime = m.includes("'") && !twice;
  return { face, twice, prime, raw: m };
}

function colorName(scheme, face, lang) {
  const id = (scheme || DEFAULT_SCHEME)[face];
  const fr = PHYSICAL_COLORS[id]?.label || face;
  if (lang === 'en') {
    const map = { Blanc: 'white', Jaune: 'yellow', Vert: 'green', Bleu: 'blue', Rouge: 'red', Orange: 'orange' };
    return map[fr] || fr;
  }
  return fr.toLowerCase();
}

function turnPhraseFr(parsed) {
  if (parsed.twice) return 'd’un demi-tour (180°)';
  if (parsed.prime) {
    return 'd’un quart de tour contre les aiguilles d’une montre (en regardant cette face)';
  }
  return 'd’un quart de tour dans le sens des aiguilles d’une montre (en regardant cette face)';
}

function turnPhraseEn(parsed) {
  if (parsed.twice) return '180°';
  if (parsed.prime) return '90° counter-clockwise (looking at that face)';
  return '90° clockwise (looking at that face)';
}

function shortTurnFr(parsed) {
  if (parsed.twice) return 'demi-tour';
  if (parsed.prime) return '↺ contre les aiguilles';
  return '↻ dans le sens des aiguilles';
}

function shortTurnEn(parsed) {
  if (parsed.twice) return 'half turn';
  if (parsed.prime) return '↺ CCW';
  return '↻ CW';
}

export function formatMove(token, { scheme = DEFAULT_SCHEME, mode = 'both', lang = 'fr', compact = true } = {}) {
  const parsed = parseMoveToken(token);
  if (!parsed) return String(token || '');
  const wca = parsed.raw;
  if (mode === 'wca') return wca;
  const color = colorName(scheme, parsed.face, lang);
  const role = lang === 'en' ? FACE_ROLE_EN[parsed.face] : FACE_ROLE_FR[parsed.face];
  let plain;
  if (lang === 'en') {
    plain = compact
      ? `${role} ${shortTurnEn(parsed)} (${color})`
      : `Turn the ${role} face (${color}) ${turnPhraseEn(parsed)}.`;
  } else {
    plain = compact
      ? `face ${role} ${shortTurnFr(parsed)} (${color})`
      : `Tourne la face ${role} (${color}) ${turnPhraseFr(parsed)}.`;
  }
  if (mode === 'plain') return plain;
  return lang === 'en' ? `${plain} — “${wca}”` : `${plain} — « ${wca} »`;
}

export function formatAlgorithm(algorithm, opts) {
  return String(algorithm || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => formatMove(tok, opts));
}
