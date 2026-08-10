export {
  p,
  h3,
  ul,
  takeaway,
  pullquote,
  splitCards,
  pCallout,
  exerciseGrid
} from '../grand-pectoral/blocks.js';

export const callout = (title, text, tone) => ({
  type: 'callout',
  title,
  text,
  tone: tone || 'info'
});

export const comparisonTable = (rows) => ({
  type: 'comparisonTable',
  headers: ['', 'Grand pectoral', 'Petit pectoral'],
  rows
});

export const trajet = (text) => ({ type: 'trajet', text });

const GRAND_PEC = 'grand-pectoral';

export const figure = (file, caption, alt = '', layout = 'landscape') => ({
  type: 'figure',
  src: `/anatomy/${GRAND_PEC}/${file}`,
  caption,
  alt: alt || caption,
  layout
});
