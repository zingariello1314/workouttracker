import React, { useMemo } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';

// Vue "dôme" ultra légère, purement CSS, sans accès IndexedDB.
// On se contente des métadonnées des livres (titre, auteur, hasCover).

const BooksDomeGallery = ({ books, onBookOpen }) => {
  const items = useMemo(() => {
    const base = Array.isArray(books) ? books : [];
    const withTitle = base.filter((b) => b && (b.title || b.author));
    // On limite pour garder la vue fluide même avec de grosses bibliothèques
    const limited = withTitle.slice(0, 80);

    const angleStep = limited.length > 0 ? (360 / limited.length) : 0;

    return limited.map((book, index) => {
      const angle = index * angleStep;
      const depth = (index % 5) / 10; // petite variation pour un effet de "profondeur"
      return {
        ...book,
        angle,
        depth,
      };
    });
  }, [books]);

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle size="md">Vue 3D livres</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-300">
            Ajoute quelques livres (et éventuellement des couvertures) pour activer la vue 3D.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle size="md">Vue 3D livres (expérimentale, légère)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <p className="text-xs text-slate-400">
            Cette vue est purement cosmétique : elle ne charge pas les PDFs ni les images,
            et reste très légère pour le navigateur.
          </p>
          <div className="relative w-full h-72 md:h-80 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-[260px] h-[260px] md:w-[320px] md:h-[320px] rounded-full border border-slate-700/60 bg-slate-900/40">
                {items.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => onBookOpen && onBookOpen(book)}
                    className="absolute w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-purple-700/80 to-slate-900/90 border border-slate-600/70 shadow-lg flex items-center justify-center text-center px-1 text-[10px] md:text-[11px] text-slate-50 hover:scale-105 hover:shadow-purple-500/40 transition-transform duration-200"
                    style={{
                      // positionnement circulaire simple
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) rotate(${book.angle}deg) translate(0, -48%) rotate(${-book.angle}deg) scale(${1 - book.depth * 0.2})`,
                      opacity: 0.6 + (1 - book.depth) * 0.3,
                    }}
                  >
                    <span className="leading-tight line-clamp-3">
                      {book.title || book.author || 'Livre'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BooksDomeGallery;


