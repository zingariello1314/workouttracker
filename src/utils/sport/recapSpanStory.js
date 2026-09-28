/**
 * Point d'entrée des lectures de plage.
 * La sélection vit dans recapAnalysisCatalog : une analyse n'est émise
 * que si son signal dépasse le seuil, une seule fois par famille et par sujet.
 */

import { selectAnalysisCatalog } from './recapAnalysisCatalog';

export function buildSpanStoryCandidates(opts = {}) {
  return selectAnalysisCatalog(opts);
}

export function spanStoriesToInsights(candidates = []) {
  const toCard = (c) => ({
    title: c.context?.title || '',
    body: c.context?.body || '',
    evidence: '',
    text: `${c.context?.title || ''}\n\n${c.context?.body || ''}`,
    kind: c.context?.kind || '',
    rewardTone: 'discovery'
  });
  return {
    shortTerm: candidates.filter((c) => c.horizon === 'short').map(toCard),
    mediumTerm: candidates.filter((c) => c.horizon === 'medium').map(toCard),
    longTerm: candidates.filter((c) => c.horizon === 'long').map(toCard)
  };
}
