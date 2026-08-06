import { blocksHaveHeadings, blocksAreOnlyParagraphs } from './anatomyDigestLayout';
import { cardsFromBlocks, paragraphsFromBlocks } from './familySectionArt';

/** Direction visuelle fiche muscle — priorité à l’id de section, puis forme du contenu. */
export function resolveMuscleArtDirection(section) {
  const id = section?.id || '';
  const blocks = section?.blocks || [];
  const cards = cardsFromBlocks(blocks);
  const titled = cards.filter((c) => c.title);
  const paras = paragraphsFromBlocks(blocks);
  const hasH3 = blocksHaveHeadings(blocks);

  const byId = {
    presentation: 'presentation-editorial',
    portions: hasH3 ? 'portions-faisceaux' : 'portions-zones',
    anatomie: 'anatomy-sheet',
    fonctions: hasH3 ? 'functions-grid' : 'functions-narrative',
    morphologie: 'morph-spotlight',
    recrutement: 'principles-steps',
    exercices: 'exercise-guide',
    erreurs: hasH3 ? 'errors-titled' : 'errors-points',
    blessures: 'alert-stack',
    'saviez-vous': 'insight-feature',
    faq: 'faq-bento',
    momentum: 'callout-vision',
    mobilite: 'mobility-inset',
    renforcement: 'renforcement-mix',
    muscles: 'muscle-roster',
    programme: 'programme-inset',
    volume: 'volume-inset'
  };
  if (byId[id]) return byId[id];

  if (blocks.some((b) => b.type === 'exerciseBlock')) return 'exercise-guide';
  if (titled.length >= 3) return 'faq-bento';
  if (titled.length === 2) return 'duo-titled';
  if (paras.length === 3 && blocksAreOnlyParagraphs(blocks)) return 'principles-steps';
  if (hasH3) return 'functions-grid';
  return 'narrative-flow';
}
