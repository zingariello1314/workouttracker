import { getMuscleContent } from '../../data/anatomy/anatomyContent';
import { ANATOMY_FAMILIES, ANATOMY_MUSCLES, getAnatomyFamily } from '../../data/anatomy/anatomyRegistry';
import { normalizeMuscleLabel } from '../../utils/anatomy/fineMuscleToVisualGroup';

function blockToPlainText(block) {
  if (!block || typeof block !== 'object') return '';
  switch (block.type) {
    case 'p':
    case 'h3':
    case 'callout':
      return String(block.text || '');
    case 'ul':
      return (block.items || []).map(String).join(' · ');
    case 'exerciseBlock':
      return [
        block.title,
        block.name,
        block.description,
        block.subtitle,
        ...(block.bullets || []),
        ...(block.steps || [])
      ]
        .filter(Boolean)
        .map(String)
        .join(' ');
    default:
      return String(block.text || block.title || block.name || '');
  }
}

function sectionPlainText(section) {
  const parts = [section.title || ''];
  (section.blocks || []).forEach((b) => parts.push(blockToPlainText(b)));
  return parts.filter(Boolean).join('\n');
}

/** @returns {{ muscleId: string, sectionId: string, sectionTitle: string, plain: string }[]} */
export function listSearchableMuscleTextChunks() {
  /** @type {{ muscleId: string, sectionId: string, sectionTitle: string, plain: string }[]} */
  const chunks = [];
  Object.keys(ANATOMY_MUSCLES).forEach((muscleId) => {
    const content = getMuscleContent(muscleId);
    if (!content?.sections) return;
    content.sections.forEach((sec) => {
      const plain = sectionPlainText(sec);
      if (plain.trim().length < 8) return;
      chunks.push({
        muscleId,
        sectionId: sec.id,
        sectionTitle: sec.title || sec.id,
        plain
      });
    });
  });
  return chunks;
}

/** @returns {{ familyId: string, sectionTitle: string, plain: string }[]} */
export function listSearchableFamilyTextChunks() {
  const chunks = [];
  Object.values(ANATOMY_FAMILIES).forEach((fam) => {
    const parts = [fam.name, fam.summary, fam.intro, fam.outro].filter(Boolean);
    (fam.sections || []).forEach((sec) => {
      parts.push(sec.title);
      (sec.blocks || []).forEach((b) => parts.push(blockToPlainText(b)));
    });
    const plain = parts.join('\n');
    if (plain.trim().length >= 8) {
      chunks.push({ familyId: fam.id, sectionTitle: fam.name, plain });
    }
  });
  return chunks;
}

/**
 * @param {string} plain
 * @param {string[]} tokens
 * @returns {{ excerpt: string, highlightFrom: number, highlightTo: number } | null}
 */
export function excerptAroundTokens(plain, tokens) {
  const norm = normalizeMuscleLabel(plain);
  if (!norm) return null;
  let bestIdx = -1;
  let bestToken = '';
  tokens.forEach((t) => {
    if (!t) return;
    const i = norm.indexOf(t);
    if (i >= 0 && (bestIdx < 0 || i < bestIdx)) {
      bestIdx = i;
      bestToken = t;
    }
  });
  if (bestIdx < 0 || !bestToken) return null;

  const rawNorm = plain.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const rawIdx = rawNorm.indexOf(bestToken);
  const idx = rawIdx >= 0 ? rawIdx : bestIdx;
  const start = Math.max(0, idx - 55);
  const end = Math.min(plain.length, idx + bestToken.length + 95);
  let excerpt = plain.slice(start, end).replace(/\s+/g, ' ').trim();
  if (start > 0) excerpt = `…${excerpt}`;
  if (end < plain.length) excerpt = `${excerpt}…`;
  const relStart = excerpt.indexOf(plain.slice(idx, idx + bestToken.length));
  const hlFrom = relStart >= 0 ? relStart : excerpt.toLowerCase().indexOf(bestToken);
  const hlTo = hlFrom >= 0 ? hlFrom + bestToken.length : hlFrom;
  return {
    excerpt,
    highlightFrom: Math.max(0, hlFrom),
    highlightTo: Math.max(0, hlTo)
  };
}

export function textMatchesTokens(plain, tokens) {
  const norm = normalizeMuscleLabel(plain);
  return tokens.some((t) => t && norm.includes(t));
}

export function muscleLabel(muscleId) {
  return ANATOMY_MUSCLES[muscleId]?.name || muscleId;
}

export function muscleFamilyLabel(muscleId) {
  const m = ANATOMY_MUSCLES[muscleId];
  return m ? getAnatomyFamily(m.familyId)?.name : '';
}
