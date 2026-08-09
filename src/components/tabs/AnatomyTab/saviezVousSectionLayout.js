import { cardsFromBlocks } from './familySectionArt';

const SOURCES_TITLE_RE = /sources?\s*(cit[eé]es?)?/i;

/** Sections « Le saviez-vous ? » des fiches muscle → accordéon magazine. */
export function isSaviezVousMuscleSection(sectionId) {
  return sectionId === 'saviez-vous';
}

export function parseSaviezVousBlocks(blocks) {
  const callouts = (blocks || []).filter((b) => b.type === 'callout');
  const contentBlocks = (blocks || []).filter((b) => b.type !== 'callout');
  const allCards = cardsFromBlocks(contentBlocks);

  const sources = allCards.find((c) => c.title && SOURCES_TITLE_RE.test(c.title)) || null;
  const items = allCards.filter((c) => c.title && c !== sources);
  const lead = allCards.filter((c) => !c.title && (c.body.length > 0 || c.items?.length > 0));

  return { items, sources, callouts, lead };
}
