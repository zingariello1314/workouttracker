/** Disposition par section pour éviter le « mur de tirets » vertical. */
export function layoutKindForSection(sectionId) {
  switch (sectionId) {
    case 'portions':
    case 'anatomie':
      return 'cards';
    case 'fonctions':
    case 'erreurs':
    case 'blessures':
    case 'renforcement':
      return 'chips';
    case 'exercices':
      return 'exercises';
    case 'presentation':
    case 'recrutement':
    case 'volume':
    case 'mobilite':
    case 'saviez-vous':
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
