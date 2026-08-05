/** Disposition par section pour éviter le « mur de tirets » vertical. */
export function layoutKindForSection(sectionId) {
  switch (sectionId) {
    case 'anatomie':
      return 'cards';
    case 'portions':
      return 'portions';
    case 'fonctions':
    case 'morphologie':
    case 'blessures':
    case 'saviez-vous':
    case 'faq':
      return 'cards';
    case 'coraco-brachial':
      return 'prose';
    case 'muscles':
      return 'cards';
    case 'renforcement':
      return 'prose';
    case 'exercices':
      return 'exercises';
    case 'presentation':
    case 'recrutement':
    case 'volume':
    case 'mobilite':
    default:
      return 'prose';
  }
}

/** Regroupe erreurs + blessures sur une même ligne desktop. */
export function groupSectionsForLayout(sections) {
  if (!Array.isArray(sections)) return [];
  const out = [];
  let i = 0;
  while (i < sections.length) {
    const s = sections[i];
    const next = sections[i + 1];
    if (
      s?.id === 'erreurs' &&
      next?.id === 'blessures' &&
      layoutKindForSection(s.id) === 'chips' &&
      layoutKindForSection(next.id) === 'chips'
    ) {
      out.push({ type: 'pair', sections: [s, next] });
      i += 2;
      continue;
    }
    out.push({ type: 'single', section: s });
    i += 1;
  }
  return out;
}
