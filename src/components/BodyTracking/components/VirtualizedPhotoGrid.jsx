/**
 * Composant VirtualizedPhotoGrid - Virtualisation haute performance pour grille photos
 * 
 * Utilise react-window pour rendre uniquement photos visibles
 * Intègre lazy loading images avec IntersectionObserver
 * Optimisé pour grandes collections (100+ photos)
 * 
 * Référence: ANALYSE_ULTRA_DENSIFIEE_VERIFIEE.md - Phase 6.3
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { Calendar, Eye, Sparkles } from 'lucide-react';
import Button from '../../ui/Button';
import { formatDate } from '../../../utils/dateUtils';
import logger from '../../../utils/logger';

const log = logger.component('VirtualizedPhotoGrid');

/**
 * Composant cellule individuelle avec lazy loading image amélioré
 * ✅ OPTIMISATION: Lazy Loading Images Amélioré avec préchargement intelligent
 */
const PhotoCell = ({ columnIndex, rowIndex, style, data }) => {
  const { photos, columns, onPhotoSelect, selectedPhotos, getAngleIcon, getAngleLabel, openModal, sortedPhotos } = data;
  const index = rowIndex * columns + columnIndex;
  const photo = photos[index];
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  // ✅ OPTIMISATION: Préchargement intelligent - pré-requête images suivantes
  useEffect(() => {
    if (!photo || !photo.url) return;

    // Précharger images suivantes (3-5) si proches du viewport
    const preloadImages = () => {
      const preloadCount = 5; // Précharger 5 images suivantes
      for (let i = 1; i <= preloadCount; i++) {
        const nextIndex = index + i;
        if (nextIndex < photos.length) {
          const nextPhoto = photos[nextIndex];
          if (nextPhoto?.url) {
            // Créer link preload pour priorité réseau
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = nextPhoto.url;
            link.setAttribute('fetchpriority', i === 1 ? 'high' : 'low'); // Première haute priorité
            document.head.appendChild(link);
            
            // Précharger aussi avec Image object (fallback)
            const img = new Image();
            img.src = nextPhoto.url;
            
            // Nettoyer après chargement
            img.onload = () => {
              document.head.removeChild(link);
            };
            img.onerror = () => {
              document.head.removeChild(link);
            };
          }
        }
      }
    };

    // Précharger seulement si cellule proche viewport (dans 2 lignes)
    if (rowIndex < 2) {
      preloadImages();
    }
  }, [index, photos, rowIndex]);

  // ✅ OPTIMISATION: IntersectionObserver amélioré - charger 100px avant visible
  useEffect(() => {
    if (!photo || !imgRef.current) return;

    // Options observer: charger 100px avant visible (plus agressif pour UX fluide)
    const options = {
      root: null,
      rootMargin: '100px', // ✅ Augmenté de 50px à 100px pour préchargement anticipé
      threshold: 0.01
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect(); // Charger une seule fois
      }
    }, options);

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [photo]);

  if (!photo) {
    return <div style={style} />; // Cellule vide
  }

  const globalIndex = sortedPhotos.findIndex(p => p.id === photo.id);
  const isSelected = selectedPhotos.includes(photo.id);

  return (
    <div style={style} className="p-2">
      <div
        ref={imgRef}
        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all h-full ${
          isSelected
            ? 'border-[#0F4C5C]/55 ring-2 ring-[#0F5C45]/50/50'
            : 'border-[#0F4C5C]/45 hover:border-[#0F4C5C]/50'
        }`}
        onClick={() => onPhotoSelect(photo.id)}
      >
        {/* ✅ OPTIMISATION: Skeleton loader amélioré avec blur-up technique */}
        {!isInView && (
          <div className="w-full h-full bg-black border border-[#0F4C5C]/45 relative overflow-hidden">
            {/* Gradient skeleton animé pour effet shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F4C5C]/50 via-teal-950/70 to-[#0F4C5C]/50 animate-pulse">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" 
                   style={{
                     backgroundSize: '200% 100%',
                     animation: 'shimmer 2s infinite'
                   }} />
            </div>
            {/* Placeholder avec icône */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-teal-100/45 animate-pulse" />
                <span className="text-teal-100/55 text-xs block">Chargement...</span>
              </div>
            </div>
          </div>
        )}

        {/* ✅ OPTIMISATION: Image avec lazy loading et progressive loading */}
        {isInView && (
          <div className="aspect-[3/4] bg-black border border-[#0F4C5C]/45 relative overflow-hidden">
            {/* Image principale avec fade-in */}
            <img
              src={photo.url}
              alt={`Photo ${getAngleLabel(photo.angle)} du ${formatDate(photo.date)}`}
              onLoad={() => setIsLoaded(true)}
              className={`w-full h-full object-cover transition-all duration-500 ${
                isLoaded 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-0 scale-105 blur-sm'
              }`}
              loading="lazy"
              decoding="async"
              fetchPriority={rowIndex < 2 ? "high" : "auto"} // ✅ Priorité pour premières images
            />
            
            {/* ✅ OPTIMISATION: Skeleton amélioré avec blur pendant chargement */}
            {!isLoaded && (
              <div className="absolute inset-0 bg-black border border-[#0F4C5C]/45">
                {/* Gradient shimmer animé */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0F4C5C]/40 via-teal-950/60 to-[#0F4C5C]/40"
                     style={{
                       backgroundSize: '200% 100%',
                       animation: 'shimmer 1.5s infinite'
                     }} />
                {/* Indicateur chargement */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-[#0F4C5C]/40 border-t-sky-400 rounded-full animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Overlay avec infos (seulement si image chargée) */}
        {isInView && isLoaded && (
          <>
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
              <div className="flex justify-between items-start">
                <span className="text-xs bg-black border border-[#0F4C5C]/50/80 px-2 py-1 rounded text-teal-100">
                  {getAngleIcon(photo.angle)} {getAngleLabel(photo.angle)}
                </span>
                <div className="flex gap-1">
                  {photo.analysis?.analyzed && (
                    <span className="text-xs bg-[#0F4C5C]/85 px-2 py-1 rounded text-teal-100 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Analysée
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal(globalIndex);
                    }}
                    className="p-1 h-auto bg-black border border-[#0F4C5C]/50/80 hover:bg-teal-950/35"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="text-xs text-teal-100">
                <div className="flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(photo.date)}
                </div>
                {photo.weight && <div>{photo.weight} kg</div>}
                {photo.capture?.qualityScore && (
                  <div className="text-sky-200/90">
                    Qualité: {photo.capture.qualityScore}/100
                  </div>
                )}
              </div>
            </div>

            {/* Indicateur de sélection */}
            {isSelected && (
              <div className="absolute top-2 left-2 w-6 h-6 bg-[#0F5C45]/40 rounded-full flex items-center justify-center text-teal-100 text-xs font-bold z-10">
                {selectedPhotos.indexOf(photo.id) + 1}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Composant principal virtualisé avec responsive
 */
const VirtualizedPhotoGrid = ({
  photos,
  columns: initialColumns = 4,
  itemWidth = 200,
  itemHeight = 266, // 3:4 aspect ratio (200 * 4/3)
  onPhotoSelect,
  selectedPhotos,
  getAngleIcon,
  getAngleLabel,
  openModal,
  sortedPhotos,
  containerHeight = 600
}) => {
  // ✅ Responsive: adapter colonnes selon viewport
  const [columns, setColumns] = useState(initialColumns);
  const containerRef = useRef(null);

  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.offsetWidth || window.innerWidth;
      
      // Breakpoints responsive (alignés avec Tailwind)
      if (width >= 1024) {
        setColumns(4); // lg: 4 colonnes
      } else if (width >= 768) {
        setColumns(3); // md: 3 colonnes
      } else {
        setColumns(2); // sm: 2 colonnes
      }
    };

    // Initialiser colonnes
    updateColumns();

    // Écouter resize
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Calculer dimensions grille
  const rows = Math.ceil(photos.length / columns);
  const containerWidth = columns * itemWidth;

  // Données passées aux cellules (memoized pour éviter re-renders)
  const cellData = useMemo(() => ({
    photos,
    columns,
    onPhotoSelect,
    selectedPhotos,
    getAngleIcon,
    getAngleLabel,
    openModal,
    sortedPhotos
  }), [photos, columns, onPhotoSelect, selectedPhotos, getAngleIcon, getAngleLabel, openModal, sortedPhotos]);

  log.info(`Virtualisation activée: ${photos.length} photos, ${columns} colonnes, ${rows} lignes`);

  return (
    <div ref={containerRef} className="w-full" style={{ height: containerHeight }}>
      <Grid
        columnCount={columns}
        columnWidth={itemWidth}
        height={containerHeight}
        rowCount={rows}
        rowHeight={itemHeight}
        width={containerWidth}
        overscanRowCount={3} // ✅ OPTIMISATION: Pré-rendre 3 lignes hors écran pour scroll ultra-fluide
        itemData={cellData}
        className="virtualized-grid"
      >
        {PhotoCell}
      </Grid>
    </div>
  );
};

export default VirtualizedPhotoGrid;

