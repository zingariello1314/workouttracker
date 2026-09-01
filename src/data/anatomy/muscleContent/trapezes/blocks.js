export {
  p,
  h3,
  ul,
  takeaway,
  pullquote,
  splitCards,
  pCallout,
  callout
} from '../grand-dorsal/blocks.js';

export { trajet } from '../erecteurs-rachis/blocks.js';

export const comparisonTable = (headers, rows) => ({
  type: 'comparisonTable',
  headers,
  rows
});
