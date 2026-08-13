import { blocksHaveHeadings, blocksAreOnlyParagraphs } from './anatomyDigestLayout';
import { cardsFromBlocks, paragraphsFromBlocks } from './familySectionArt';
import { hasProgressionTimeline } from './progressionSectionLayout';
import { hasFunctionMagazine } from './functionSectionLayout';

/** Direction visuelle fiche muscle — priorité à l’id de section, puis forme du contenu. */
export function resolveMuscleArtDirection(section) {
  const id = section?.id || '';
  const blocks = section?.blocks || [];
  const cards = cardsFromBlocks(blocks);
  const titled = cards.filter((c) => c.title);
  const paras = paragraphsFromBlocks(blocks);
  const hasH3 = blocksHaveHeadings(blocks);

  const hasFigures = blocks.some((b) => b.type === 'figure');
  if (hasFigures && (id === 'morphologie' || id === 'recrutement' || id === 'blessures')) {
    if (titled.length >= 2 || id === 'recrutement') return 'anatomy-chapters';
    return 'narrative-flow';
  }
  if (hasFigures && id === 'fonctions' && titled.length >= 2) {
    return 'anatomy-chapters';
  }

  const byId = {
    presentation: 'presentation-magazine',
    portions: hasH3 ? 'portions-faisceaux' : 'portions-zones',
    anatomie: 'anatomy-sheet',
    fonctions: hasH3 ? 'functions-grid' : 'functions-narrative',
    morphologie: 'morph-spotlight',
    recrutement: 'principles-steps',
    exercices: 'exercise-guide',
    erreurs: hasH3 ? 'errors-titled' : 'errors-points',
    blessures: 'alert-stack',
    faq: 'faq-bento',
    momentum: 'callout-vision',
    mobilite: 'mobility-inset',
    renforcement: 'renforcement-mix',
    muscles: 'muscle-roster',
    programme: 'programme-inset',
    volume: 'volume-inset'
  };
  if (id === 'saviez-vous') {
    return 'saviez-vous-accordion';
  }
  if (id === 'anatomie') {
    return titled.length >= 3 ? 'anatomy-chapters' : 'anatomy-sheet';
  }
  if (id === 'momentum' && (hasH3 || titled.length >= 2)) {
    return 'anatomy-chapters';
  }
  if (id === 'blessures') {
    return titled.length >= 3 ? 'blessures-chapters' : 'alert-stack';
  }
  if (id === 'volume') {
    return titled.length >= 2 ? 'volume-chapters' : 'volume-inset';
  }
  if (id === 'muscles' && titled.length >= 3) {
    return 'anatomy-chapters';
  }
  if (id === 'fonctions' && hasFunctionMagazine(blocks)) {
    return 'functions-grid';
  }
  if (id === 'fonctions' && titled.length >= 3) {
    return 'anatomy-chapters';
  }
  if (id === 'mobilite' && titled.length >= 2) {
    return 'anatomy-chapters';
  }
  if (id === 'recrutement' && hasProgressionTimeline(blocks)) {
    return 'progression-timeline';
  }
  if (id === 'recrutement' && (titled.length >= 2 || blocks.some((b) => b.type === 'callout'))) {
    return 'volume-chapters';
  }
  if (id === 'morphologie' && titled.length >= 2) {
    return 'anatomy-chapters';
  }
  if (byId[id]) return byId[id];

  if (blocks.some((b) => b.type === 'exerciseBlock')) return 'exercise-guide';
  if (titled.length >= 3) return 'faq-bento';
  if (titled.length === 2) return 'duo-titled';
  if (paras.length === 3 && blocksAreOnlyParagraphs(blocks)) return 'principles-steps';
  if (hasH3) return 'functions-grid';
  return 'narrative-flow';
}
