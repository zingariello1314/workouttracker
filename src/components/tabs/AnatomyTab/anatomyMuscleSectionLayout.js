/** Disposition par section — le rendu s’adapte aussi au contenu (h3 ou paragraphes seuls). */
export function layoutKindForSection(sectionId) {
  switch (sectionId) {
    case 'portions':
      return 'portions';
    case 'anatomie':
    case 'morphologie':
    case 'blessures':
    case 'saviez-vous':
    case 'faq':
    case 'muscles':
      return 'cards';
    case 'erreurs':
    case 'erreurs-generales':
      return 'points';
    case 'exercices':
      return 'exercises';
    case 'presentation':
    case 'recrutement':
    case 'volume':
    case 'mobilite':
    case 'momentum':
    case 'programme':
    case 'renforcement':
    case 'coraco-brachial':
    case 'chaines-jambes':
    case 'biomecanique-jambes':
    case 'ceinture-lombaire':
    case 'exercices-core':
    case 'principes-entrainement':
    case 'core-concept':
    case 'trois-roles':
    case 'fonctions':
    default:
      return 'narrative';
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

/** Priorité au contenu : titres h3 → cartes FAQ ; paragraphes seuls → narratif ou points. */
export function resolveSectionLayoutKind(section) {
  const blocks = section?.blocks || [];
  const id = section?.id;
  const fromId = layoutKindForSection(id);

  if (fromId === 'portions' || fromId === 'exercises') return fromId;
  if (blocks.some((b) => b.type === 'h3')) return 'cards';
  if (fromId === 'points') return 'points';
  if (fromId === 'cards') return 'narrative';
  return 'narrative';
}
