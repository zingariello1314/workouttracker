/**
 * Sections famille affichées côte à côte (≥ md) — paires explicites uniquement.
 * FAQ, exercices-core, principes longs restent pleine largeur (jamais dans une paire).
 * @type {Record<string, [string, string][]>}
 */
export const FAMILY_SECTION_SIDE_PAIRS = {
  'haut-dos': [
    ['erreurs-generales', 'saviez-vous'],
    ['synthese', 'faq-pilotage']
  ],
  'bas-dos': [['role', 'composition']],
  abdominaux: [
    ['core-concept', 'trois-roles'],
    ['erreurs-generales', 'saviez-vous']
  ],
  cuisses: [
    ['chaines-jambes', 'biomecanique-jambes'],
    ['saviez-vous', 'momentum']
  ]
};

/** Jamais jumeler en colonne (trop de contenu ou layout horizontal interne). */
export const FAMILY_SECTION_NO_PAIR = new Set([
  'faq',
  'exercices-core',
  'principes-entrainement',
  'blessures',
  'blessures-generales'
]);

/**
 * @param {{ id: string }[]} sections
 * @param {string} familyId
 * @returns {({ type: 'single', section: object } | { type: 'pair', sections: object[] })[]}
 */
export function layoutFamilySectionRows(sections, familyId) {
  const list = sections || [];
  if (list.length === 0) return [];

  const pairs = FAMILY_SECTION_SIDE_PAIRS[familyId] || [];
  const partnerOf = new Map();
  pairs.forEach(([a, b]) => {
    if (FAMILY_SECTION_NO_PAIR.has(a) || FAMILY_SECTION_NO_PAIR.has(b)) return;
    partnerOf.set(a, b);
    partnerOf.set(b, a);
  });

  const byId = new Map(list.map((s) => [s.id, s]));
  const used = new Set();
  const rows = [];

  for (const section of list) {
    if (used.has(section.id)) continue;

    const partnerId = partnerOf.get(section.id);
    const partner = partnerId ? byId.get(partnerId) : null;

    if (partner && !used.has(partnerId)) {
      const iA = list.indexOf(section);
      const iB = list.indexOf(partner);
      const ordered = iA <= iB ? [section, partner] : [partner, section];
      rows.push({ type: 'pair', sections: ordered });
      used.add(section.id);
      used.add(partnerId);
    } else {
      rows.push({ type: 'single', section });
      used.add(section.id);
    }
  }

  return rows;
}
