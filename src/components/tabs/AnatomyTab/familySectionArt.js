/** Direction artistique par section famille (grilles adaptées au contenu). */

export function cardsFromBlocks(blocks) {
  const cards = [];
  let current = null;
  (blocks || []).forEach((block) => {
    if (block.type === 'h3') {
      if (current) cards.push(current);
      current = { title: block.text, body: [], items: [] };
      return;
    }
    if (!current) current = { title: null, body: [], items: [] };
    if (block.type === 'p') current.body.push(block.text);
    if (block.type === 'ul') current.items = block.items || [];
  });
  if (current) cards.push(current);
  return cards.filter((c) => c.title || c.body.length || c.items.length);
}

export function paragraphsFromBlocks(blocks) {
  return (blocks || []).filter((b) => b.type === 'p' && b.text).map((b) => b.text);
}

/** Choix de mise en page — id de section puis forme du contenu. */
export function resolveFamilyArtDirection(section) {
  const id = section?.id || '';
  const blocks = section?.blocks || [];
  const titled = cardsFromBlocks(blocks).filter((c) => c.title);
  const paras = paragraphsFromBlocks(blocks);

  const byId = {
    'erreurs-generales': 'errors-bento',
    'saviez-vous': 'insight-feature',
    faq: 'faq-bento',
    'faq-pilotage': 'faq-bento',
    synthese: 'synth-dual',
    'trois-roles': 'roles-trio',
    'exercices-core': 'guide-chapters',
    'biomecanique-jambes': 'timeline',
    blessures: 'alert-stack',
    'blessures-generales': 'alert-stack',
    momentum: 'callout-vision',
    'ceinture-lombaire': 'narrative-inset',
    'principes-entrainement': 'principles-mix',
    'chaines-jambes': 'narrative-inset',
    role: 'narrative-inset',
    composition: 'synth-dual'
  };
  if (byId[id]) return byId[id];

  if (titled.length === 3) return 'faq-bento';
  if (titled.length === 2) return 'duo-titled';
  if (paras.length === 3) return 'errors-bento';
  if (paras.length === 2) return 'synth-dual';
  return 'narrative-flow';
}

export function familySectionShellClass(sectionId) {
  switch (sectionId) {
    case 'erreurs-generales':
      return 'border-amber-500/40 shadow-[0_12px_40px_rgba(245,158,11,0.1),inset_0_1px_0_rgba(255,255,255,0.03)]';
    case 'saviez-vous':
      return 'border-cyan-400/35 shadow-[0_12px_40px_rgba(34,211,238,0.1),inset_0_1px_0_rgba(255,255,255,0.03)]';
    case 'faq':
    case 'faq-pilotage':
      return 'border-[#3897F0]/45 shadow-[0_12px_44px_rgba(56,151,240,0.12),inset_0_1px_0_rgba(255,255,255,0.04)]';
    case 'synthese':
      return 'border-violet-400/30 shadow-[0_12px_40px_rgba(139,92,246,0.1),inset_0_1px_0_rgba(255,255,255,0.03)]';
    case 'exercices-core':
      return 'border-emerald-400/30 shadow-[0_12px_36px_rgba(52,211,153,0.08)]';
    case 'blessures':
    case 'blessures-generales':
      return 'border-rose-400/35 shadow-[0_12px_36px_rgba(244,63,94,0.09)]';
    default:
      return 'border-[#3897F0]/28 shadow-[0_10px_36px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.03)]';
  }
}

export function familySectionGlow(sectionId) {
  switch (sectionId) {
    case 'erreurs-generales':
      return 'bg-[radial-gradient(ellipse_70%_55%_at_100%_0%,rgba(245,158,11,0.12),transparent_55%)]';
    case 'saviez-vous':
      return 'bg-[radial-gradient(ellipse_75%_60%_at_0%_100%,rgba(34,211,238,0.11),transparent_55%)]';
    case 'faq':
    case 'faq-pilotage':
      return 'bg-[radial-gradient(ellipse_65%_50%_at_50%_0%,rgba(56,151,240,0.12),transparent_50%)]';
    case 'synthese':
      return 'bg-[radial-gradient(ellipse_70%_55%_at_0%_50%,rgba(139,92,246,0.1),transparent_55%)]';
    default:
      return 'bg-[radial-gradient(ellipse_55%_45%_at_30%_0%,rgba(56,151,240,0.08),transparent_50%)]';
  }
}

export function familySectionTitleAccent(sectionId) {
  switch (sectionId) {
    case 'erreurs-generales':
      return 'border-amber-400/40';
    case 'saviez-vous':
      return 'border-cyan-400/40';
    case 'faq':
    case 'faq-pilotage':
      return 'border-[#3897F0]/45';
    case 'synthese':
      return 'border-violet-400/40';
    default:
      return 'border-[#3897F0]/35';
  }
}
