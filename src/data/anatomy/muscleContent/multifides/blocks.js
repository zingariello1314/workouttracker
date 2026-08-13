export {
  p,
  h3,
  ul,
  takeaway,
  pullquote,
  splitCards,
  pCallout,
  chips,
  functionEyebrow,
  functionNuance,
  functionSynthèse
} from '../erecteurs-rachis/blocks.js';

export const callout = (title, text, tone) => ({
  type: 'callout',
  title,
  text,
  tone: tone || 'info'
});

export const trajet = (text) => ({ type: 'trajet', text });
