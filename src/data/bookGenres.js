/**
 * Genres de livres canoniques — formulaire, filtres et statistiques.
 */

export const BOOK_GENRE_UNSPECIFIED = 'Non spécifié';

/** Liste canonique (triée à l’export pour les menus). */
const BOOK_GENRES_CANON = [
  'Roman',
  'Roman contemporain',
  'Roman historique',
  'Saga / Fresque',
  'Science-fiction',
  'Fantasy',
  'Fantastique',
  'Horreur / Gothic',
  'Polar / Thriller',
  'Espionnage',
  'Romance',
  'Comédie / Humour',
  'Aventure',
  'Western',
  'Fiction littéraire',
  'Nouvelle',
  'Biographie / Mémoires',
  'Autobiographie',
  'Essai',
  'Documentaire',
  'Reportage',
  'Journal intime / Correspondance',
  'Développement personnel',
  'Santé / Bien-être',
  'Psychologie',
  'Philosophie',
  'Religion / Spiritualité',
  'Ésotérisme',
  'Sciences',
  'Sciences naturelles',
  'Technologie / Informatique',
  'Médecine',
  'Histoire',
  'Géopolitique',
  'Politique / Société',
  'Droit',
  'Économie / Business',
  'Management / Leadership',
  'Marketing / Communication',
  'Finance / Investissement',
  'Art / Culture',
  'Musique',
  'Cinéma / Séries',
  'Photographie',
  'Architecture / Design',
  'Mode / Beauté',
  'Cuisine / Gastronomie',
  'Jardinage / Nature',
  'Voyage',
  'Sport',
  'Éducation / Pédagogie',
  'Parentalité / Famille',
  'Relations / Sexualité',
  'True crime',
  'Poésie',
  'Théâtre',
  'Jeunesse',
  'Young adult (YA)',
  'Bande dessinée',
  'Manga / Comics',
  'Graphic novel',
  'Classique',
  'Conte / Fable / Mythologie',
  'Livre audio (adaptation)',
  'Bilingue / Apprentissage langues',
  'Référence / Encyclopédie',
  'Manuel / Scolaire',
  'Professionnel / Technique',
  'Autre',
];

/** Ordre alphabétique (fr) pour formulaires, filtres et stats. */
export const BOOK_GENRES = [...BOOK_GENRES_CANON].sort((a, b) =>
  a.localeCompare(b, 'fr', { sensitivity: 'base' })
);

const GENRE_LOOKUP = new Map(
  BOOK_GENRES.map((g) => [g.toLowerCase(), g])
);

/** Alias courants → genre canonique (anciennes saisies libres). */
const GENRE_ALIASES = {
  fiction: 'Roman',
  littérature: 'Fiction littéraire',
  litterature: 'Fiction littéraire',
  'science-fiction': 'Science-fiction',
  'sci-fi': 'Science-fiction',
  sf: 'Science-fiction',
  polar: 'Polar / Thriller',
  thriller: 'Polar / Thriller',
  policier: 'Polar / Thriller',
  'nouvelles': 'Nouvelle',
  nouvelle: 'Nouvelle',
  'développement personnel': 'Développement personnel',
  devperso: 'Développement personnel',
  'dev perso': 'Développement personnel',
  biographie: 'Biographie / Mémoires',
  memoires: 'Biographie / Mémoires',
  mémoires: 'Biographie / Mémoires',
  autobiographie: 'Autobiographie',
  bd: 'Bande dessinée',
  manga: 'Manga / Comics',
  comics: 'Manga / Comics',
  'graphic novel': 'Graphic novel',
  ya: 'Young adult (YA)',
  'young adult': 'Young adult (YA)',
  historique: 'Roman historique',
  histoire: 'Histoire',
  essai: 'Essai',
  philosophie: 'Philosophie',
  psychologie: 'Psychologie',
  religion: 'Religion / Spiritualité',
  spiritualité: 'Religion / Spiritualité',
  business: 'Économie / Business',
  économie: 'Économie / Business',
  economie: 'Économie / Business',
  informatique: 'Technologie / Informatique',
  tech: 'Technologie / Informatique',
  cuisine: 'Cuisine / Gastronomie',
  gastronomie: 'Cuisine / Gastronomie',
  voyage: 'Voyage',
  sport: 'Sport',
  poésie: 'Poésie',
  poesie: 'Poésie',
  théâtre: 'Théâtre',
  theatre: 'Théâtre',
  jeunesse: 'Jeunesse',
  enfant: 'Jeunesse',
  classique: 'Classique',
  classiques: 'Classique',
  horreur: 'Horreur / Gothic',
  gothic: 'Horreur / Gothic',
  fantasy: 'Fantasy',
  fantastique: 'Fantastique',
  romance: 'Romance',
  amour: 'Romance',
  espionnage: 'Espionnage',
  'true crime': 'True crime',
  crime: 'True crime',
  société: 'Politique / Société',
  societe: 'Politique / Société',
  politique: 'Politique / Société',
  géopolitique: 'Géopolitique',
  geopolitique: 'Géopolitique',
  management: 'Management / Leadership',
  leadership: 'Management / Leadership',
  marketing: 'Marketing / Communication',
  finance: 'Finance / Investissement',
  investissement: 'Finance / Investissement',
  santé: 'Santé / Bien-être',
  sante: 'Santé / Bien-être',
  bienêtre: 'Santé / Bien-être',
  'bien-être': 'Santé / Bien-être',
  éducation: 'Éducation / Pédagogie',
  education: 'Éducation / Pédagogie',
  pédagogie: 'Éducation / Pédagogie',
  pedagogie: 'Éducation / Pédagogie',
  nature: 'Jardinage / Nature',
  jardinage: 'Jardinage / Nature',
  musique: 'Musique',
  cinéma: 'Cinéma / Séries',
  cinema: 'Cinéma / Séries',
  séries: 'Cinéma / Séries',
  series: 'Cinéma / Séries',
  photo: 'Photographie',
  photographie: 'Photographie',
  architecture: 'Architecture / Design',
  design: 'Architecture / Design',
  mode: 'Mode / Beauté',
  beauté: 'Mode / Beauté',
  beaute: 'Mode / Beauté',
  langues: 'Bilingue / Apprentissage langues',
  encyclopédie: 'Référence / Encyclopédie',
  encyclopedie: 'Référence / Encyclopédie',
  manuel: 'Manuel / Scolaire',
  scolaire: 'Manuel / Scolaire',
  technique: 'Professionnel / Technique',
  professionnel: 'Professionnel / Technique',
  mythologie: 'Conte / Fable / Mythologie',
  conte: 'Conte / Fable / Mythologie',
  fable: 'Conte / Fable / Mythologie',
  'bande dessinée / manga': 'Manga / Comics',
  'bande dessinée': 'Bande dessinée',
};

/**
 * @param {string} raw
 * @returns {string}
 */
export function normalizeBookGenre(raw) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return '';

  const exact = GENRE_LOOKUP.get(trimmed.toLowerCase());
  if (exact) return exact;

  const alias = GENRE_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;

  const lower = trimmed.toLowerCase();
  for (const g of BOOK_GENRES) {
    if (g.toLowerCase() === lower) return g;
  }

  // Correspondance partielle (ex. « polar thriller » → Polar / Thriller)
  for (const g of BOOK_GENRES) {
    const gl = g.toLowerCase();
    if (lower.includes(gl) || gl.includes(lower)) return g;
  }

  return 'Autre';
}

export function resolveBookGenreForStats(genre) {
  const n = normalizeBookGenre(genre);
  return n || BOOK_GENRE_UNSPECIFIED;
}

export function migrateBooksGenres(books) {
  if (!Array.isArray(books)) return [];
  let changed = false;
  const next = books.map((book) => {
    if (!book) return book;
    const raw = book.genre;
    if (!raw) return book;
    const normalized = normalizeBookGenre(raw);
    if (normalized === raw) return book;
    changed = true;
    return { ...book, genre: normalized };
  });
  return changed ? next : books;
}
