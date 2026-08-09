/** Parse blocs « Fonctions principales » (h3 + eyebrow, nuance, synthèse). */
export function functionCardsFromBlocks(blocks) {
  const cards = [];
  let lead = [];
  let current = null;
  let synthèse = null;

  (blocks || []).forEach((block) => {
    if (block.type === 'functionSynthèse' || block.type === 'functionSynthese') {
      synthèse = {
        lead: block.lead || block.intro || '',
        text: block.text || ''
      };
      return;
    }
    if (block.type === 'h3') {
      if (current) cards.push(current);
      current = {
        title: block.text,
        eyebrow: block.eyebrow || null,
        body: [],
        items: [],
        nuances: []
      };
      return;
    }
    if (!current) {
      if (block.type === 'p' && block.text) lead.push(block.text);
      return;
    }
    if (block.type === 'functionEyebrow' && block.text) {
      current.eyebrow = block.text;
      return;
    }
    if (block.type === 'functionNuance' && block.text) {
      current.nuances.push(block.text);
      return;
    }
    if (block.type === 'p' && block.text) current.body.push(block.text);
    if (block.type === 'ul') current.items = block.items || [];
  });

  if (current) cards.push(current);

  return {
    lead,
    cards: cards.filter((c) => c.title || c.body.length || c.items.length || c.nuances.length),
    synthèse
  };
}

export function hasFunctionMagazine(blocks) {
  const { cards, synthèse } = functionCardsFromBlocks(blocks);
  return cards.some((c) => c.eyebrow || c.nuances.length > 0) || !!synthèse;
}
