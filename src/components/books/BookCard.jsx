import React, { memo } from 'react';
import Card from '../ui/Card';
import { BookOpen, Star, Clock, FileText } from 'lucide-react';
import { useTranslation } from '../../utils/translations';
import { getBookDisplayRating } from '../../utils/bookReadingRatings';

const BookCard = memo(({ 
  book, 
  coverUrl, 
  progressPercent, 
  selectedBookId, 
  onBookClick,
  onStatusChange,
  onAddSession 
}) => {
  const t = useTranslation();
  const bookStatus = book.status || 'in-progress';
  const displayRating = getBookDisplayRating(book);

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'in-progress':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'completed':
        return 'bg-[#3A86FF]/18 text-sky-200 border border-[#3A86FF]/40';
      case 'to-read':
        return 'bg-purple-500/20 text-purple-300 border border-slate-500/40';
      case 'abandoned':
        return 'bg-red-500/20 text-red-300 border-red-400/30';
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-400/30';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'in-progress':
        return t('books.status.inProgress', 'En cours');
      case 'completed':
        return t('books.status.completed', 'Terminé');
      case 'to-read':
        return t('books.status.toRead', 'À lire');
      case 'abandoned':
        return t('books.status.abandoned', 'Abandonné');
      case 'paused':
        return t('books.status.paused', 'En pause');
      default:
        return status;
    }
  };

  const renderStars = (score) => {
    const stars = [];
    const numScore = Number(score) || 0;
    const fullStars = Math.floor(numScore);
    const hasHalfStar = numScore % 1 >= 0.5;

    // Toujours afficher 5 étoiles, même si score = 0 (étoiles grises)
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400 flex-shrink-0" style={{ display: 'block' }} />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400/50 flex-shrink-0" style={{ display: 'block' }} />
        );
      } else {
        stars.push(
          <Star key={i} className="w-5 h-5 text-slate-400/70 fill-slate-400/40 flex-shrink-0" style={{ display: 'block' }} />
        );
      }
    }
    return (
      <div className="flex items-center gap-0.5" style={{ minHeight: '20px', visibility: 'visible' }}>
        {stars}
      </div>
    );
  };

  return (
    <Card
      variant="books"
      className={`flex-shrink-0 w-[580px] min-w-[580px] max-w-[580px] min-h-[420px] cursor-pointer transition-all duration-300 ${
        selectedBookId === book.id 
          ? 'ring-2 ring-[#3A86FF] ring-offset-2 ring-offset-black scale-[1.02] shadow-lg shadow-[#3A86FF]/20' 
          : 'hover:scale-[1.01] hover:shadow-lg hover:shadow-black/20'
      }`}
      onClick={() => onBookClick(book.id)}
    >
      <div className="flex items-start gap-6 h-full w-full overflow-visible">
        {/* Cover Image - Left side */}
        {coverUrl ? (
          <div className="w-36 h-56 rounded-lg overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm flex-shrink-0 shadow-md shadow-black/20">
            <img
              src={coverUrl}
              alt={book.title || 'Couverture'}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              fetchpriority="low"
              style={{ contentVisibility: 'auto' }}
            />
          </div>
        ) : (
          <div className="w-36 h-56 rounded-lg border border-white/10 bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm flex-shrink-0 shadow-md shadow-black/20 flex items-center justify-center">
            <BookOpen className="w-14 h-14 text-slate-400/50" />
          </div>
        )}

        {/* Content - Right side */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 h-full justify-between">
          {/* Top section: Contenu principal */}
          <div className="flex flex-col gap-4 flex-shrink-0">
            {/* Section 1: Titre - avec limite de hauteur pour éviter de pousser le reste */}
            <div className="flex-shrink-0">
              <h4 className="font-semibold text-white text-xl leading-tight line-clamp-3" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                {book.title || 'Livre sans titre'}
              </h4>
            </div>

            {/* Section 2: Auteur */}
            {book.author && (
              <div className="flex-shrink-0">
                <p className="text-base text-slate-300/95 font-medium line-clamp-1">
                  {book.author}
                </p>
              </div>
            )}

            {/* Section 3: Métadonnées sur une ligne avec points médians */}
            <div className="flex items-center gap-2 text-sm text-slate-400/80 flex-shrink-0">
              {book.year && (
                <>
                  <span>{book.year}</span>
                  {(book.pages || book.genre) && <span className="text-slate-500/60">·</span>}
                </>
              )}
              {book.pages && (
                <>
                  <span>{book.pages} {t('books.pages', 'pages')}</span>
                  {book.genre && <span className="text-slate-500/60">·</span>}
                </>
              )}
              {book.genre && (
                <span>{book.genre}</span>
              )}
            </div>

            {/* Section 4: Status badge + Pourcentage sur une ligne */}
            <div className="flex items-center gap-4 flex-shrink-0">
              {/* Badge statut - amélioré avec meilleur centrage et style */}
              <span className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 inline-flex items-center justify-center whitespace-nowrap shadow-sm ${getStatusBadgeColor(bookStatus)}`} style={{ 
                minHeight: '32px',
                lineHeight: '1',
                textAlign: 'center',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {getStatusLabel(bookStatus)}
              </span>
              
              {/* Espace flexible */}
              <div className="flex-1"></div>
              
              {/* Pourcentage */}
              {progressPercent !== null && progressPercent !== undefined && (
                <div className="text-base font-semibold text-white/90 whitespace-nowrap" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                  {progressPercent}%
                </div>
              )}
            </div>

            {/* Section 4b: Étoiles sur une ligne dédiée */}
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <div style={{ opacity: 1, visibility: 'visible', zIndex: 10 }}>
                {renderStars(displayRating.value || 0)}
              </div>
              {displayRating.value > 0 && (
                <span className="text-[10px] text-slate-500">
                  {displayRating.source === 'personal' ? 'Note perso' : 'Synthèse sessions'} ·{' '}
                  {displayRating.value.toFixed(1)}/10
                </span>
              )}
            </div>
          </div>

          {/* Bottom section: Actions - toujours visibles en bas avec mt-auto */}
          <div className="flex flex-col gap-3 flex-shrink-0 mt-auto">
            {/* Ligne de séparation */}
            <div className="border-t border-white/10 flex-shrink-0"></div>

            {/* Section 5: Select statut */}
            {onStatusChange && (
              <div className="flex-shrink-0">
                <select
                  value={bookStatus}
                  onChange={(e) => {
                    e.stopPropagation();
                    onStatusChange(book.id, e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant w-full rounded-lg appearance-none cursor-pointer relative"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '12px',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="in-progress" style={{ background: '#1e293b', color: '#ffffff' }}>{t('books.status.inProgress', 'En cours')}</option>
                  <option value="completed" style={{ background: '#1e293b', color: '#ffffff' }}>{t('books.status.completed', 'Terminé')}</option>
                  <option value="to-read" style={{ background: '#1e293b', color: '#ffffff' }}>{t('books.status.toRead', 'À lire')}</option>
                  <option value="paused" style={{ background: '#1e293b', color: '#ffffff' }}>{t('books.status.paused', 'En pause')}</option>
                  <option value="abandoned" style={{ background: '#1e293b', color: '#ffffff' }}>{t('books.status.abandoned', 'Abandoné')}</option>
                </select>
              </div>
            )}

            {/* Section 6: Bouton "Ajouter session" - toujours visible en bas */}
            {onAddSession && (
              <div className="flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddSession(book.id);
                  }}
                  className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant w-full rounded-lg whitespace-nowrap"
                >
                  {t('books.actions.addSession', 'Ajouter session')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter les re-renders inutiles
  return (
    prevProps.book.id === nextProps.book.id &&
    prevProps.book.title === nextProps.book.title &&
    prevProps.book.author === nextProps.book.author &&
    prevProps.book.status === nextProps.book.status &&
    prevProps.book._progressPercent === nextProps.book._progressPercent &&
    prevProps.book.personalScore === nextProps.book.personalScore &&
    prevProps.book.readingSessions === nextProps.book.readingSessions &&
    prevProps.coverUrl === nextProps.coverUrl &&
    prevProps.progressPercent === nextProps.progressPercent &&
    prevProps.selectedBookId === nextProps.selectedBookId
  );
});

BookCard.displayName = 'BookCard';

export default BookCard;
