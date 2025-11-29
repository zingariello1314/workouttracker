import React, { useEffect, useMemo, useRef, useState } from 'react';
import './booksDome.css';

/**
 * books: tableau de { id, title, author?, coverUrl }
 * onBookOpen: callback (bookId: string) => void
 * dragSensitivity: plus grand = moins sensible
 * dragDampening: contrôle la traînée de l’inertie (0–1)
 */
const DEFAULT_SEGMENTS = 30;

export const buildDomeItems = (books, segments = DEFAULT_SEGMENTS) => {
  if (!Array.isArray(books) || books.length === 0) return [];

  const xCols = Array.from({ length: segments }, (_, i) => -37 + i * 2);
  const evenYs = [-4, -2, 0, 2, 4];
  const oddYs = [-3, -1, 1, 3, 5];

  const coords = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs;
    return ys.map((y) => ({ x, y, sizeX: 2, sizeY: 2 }));
  });

  const baseItems = books
    .filter((b) => b && b.coverUrl)
    .map((book) => ({
      src: book.coverUrl,
      alt: book.title || book.author || 'Livre',
      bookId: book.id,
      book,
    }));

  if (baseItems.length === 0) {
    return [];
  }

  const totalSlots = coords.length;
  const usedBooks = Array.from({ length: totalSlots }, (_, i) => baseItems[i % baseItems.length]);

  // Petit shuffle local pour éviter trop de doublons consécutifs
  for (let i = 1; i < usedBooks.length; i += 1) {
    if (usedBooks[i].src === usedBooks[i - 1].src) {
      for (let j = i + 1; j < usedBooks.length; j += 1) {
        if (usedBooks[j].src !== usedBooks[i].src) {
          const tmp = usedBooks[i];
          usedBooks[i] = usedBooks[j];
          usedBooks[j] = tmp;
          break;
        }
      }
    }
  }

  return coords.map((c, i) => {
    const item = usedBooks[i];
    return {
      ...c,
      src: item.src,
      alt: item.alt,
      bookId: item.bookId,
      book: item.book,
    };
  });
};

export const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const BooksDomeGallery = ({
  books,
  onBookOpen,
  dragSensitivity = 50,
  dragDampening = 0.3,
  maxVerticalRotationDeg = 8,
}) => {
  const items = useMemo(() => buildDomeItems(books, DEFAULT_SEGMENTS), [books]);

  const rootRef = useRef(null);
  const mainRef = useRef(null);
  const sphereRef = useRef(null);

  const rotationXRef = useRef(0);
  const rotationYRef = useRef(0);
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);

  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startRotationXRef = useRef(0);
  const startRotationYRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const inertiaFrameRef = useRef(null);

  const [openedItem, setOpenedItem] = useState(null);
  const [overlayVisible, setOverlayVisible] = useState(false);

  // Appliquer le transform à chaque changement de rotation
  useEffect(() => {
    const sphere = sphereRef.current;
    if (!sphere) return;

    sphere.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
  }, [rotationX, rotationY]);

  // Drag + inertie (Y uniquement, comme l’intégration Vue simplifiée)
  useEffect(() => {
    const mainEl = mainRef.current;
    const sphereEl = sphereRef.current;
    if (!mainEl || !sphereEl) return undefined;

    const handlePointerDown = (event) => {
      const e = event.touches ? event.touches[0] : event;
      draggingRef.current = true;
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
      startRotationXRef.current = rotationXRef.current;
      startRotationYRef.current = rotationYRef.current;
      lastMoveTimeRef.current = Date.now();

      if (inertiaFrameRef.current) {
        cancelAnimationFrame(inertiaFrameRef.current);
        inertiaFrameRef.current = null;
      }
    };

    const handlePointerMove = (event) => {
      if (!draggingRef.current) return;
      const e = event.touches ? event.touches[0] : event;

      const deltaX = e.clientX - startXRef.current;
      const deltaY = e.clientY - startYRef.current;
      const currentTime = Date.now();
      const deltaTime = currentTime - lastMoveTimeRef.current || 16;

      velocityRef.current = deltaX / deltaTime;
      lastMoveTimeRef.current = currentTime;

      const newRotationY = startRotationYRef.current + deltaX / dragSensitivity;
      const newRotationX = clamp(
        startRotationXRef.current - deltaY / dragSensitivity,
        -maxVerticalRotationDeg,
        maxVerticalRotationDeg
      );

      rotationXRef.current = newRotationX;
      rotationYRef.current = newRotationY;
      setRotationX(newRotationX);
      setRotationY(newRotationY);
    };

    const applyInertia = () => {
      let v = velocityRef.current * 0.05; // amortissement doux
      const friction = 0.92 + 0.05 * dragDampening; // ~0.92–0.97

      const step = () => {
        if (Math.abs(v) < 0.01) {
          inertiaFrameRef.current = null;
          return;
        }

        rotationYRef.current += v;
        setRotationY(rotationYRef.current);

        v *= friction;
        inertiaFrameRef.current = requestAnimationFrame(step);
      };

      inertiaFrameRef.current = requestAnimationFrame(step);
    };

    const handlePointerUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;

      if (Math.abs(velocityRef.current) > 0.1) {
        applyInertia();
      }
    };

    mainEl.addEventListener('mousedown', handlePointerDown);
    mainEl.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('mouseup', handlePointerUp);

    mainEl.addEventListener('touchstart', handlePointerDown, { passive: false });
    mainEl.addEventListener('touchmove', handlePointerMove, { passive: false });
    mainEl.addEventListener('touchend', handlePointerUp);

    return () => {
      mainEl.removeEventListener('mousedown', handlePointerDown);
      mainEl.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseup', handlePointerUp);

      mainEl.removeEventListener('touchstart', handlePointerDown);
      mainEl.removeEventListener('touchmove', handlePointerMove);
      mainEl.removeEventListener('touchend', handlePointerUp);

      if (inertiaFrameRef.current) {
        cancelAnimationFrame(inertiaFrameRef.current);
      }
    };
  }, [dragSensitivity, dragDampening]);

  // Fermeture overlay par Échap
  useEffect(() => {
    if (!overlayVisible) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOverlayVisible(false);
        setOpenedItem(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [overlayVisible]);

  if (!items.length) {
    return (
      <div className="books-dome-empty">
        <p>Ajoute quelques livres avec couverture pour activer la vue 3D.</p>
      </div>
    );
  }

  const handleItemClick = (item) => {
    if (onBookOpen) {
      onBookOpen(item.bookId);
    }
    setOpenedItem(item);
    setOverlayVisible(true);
  };

  return (
    <div className="books-dome-container">
      <div
        ref={rootRef}
        className="books-dome-sphere-root"
        style={{
          '--segments-x': DEFAULT_SEGMENTS,
          // 5 bandes verticales comme dans le globe d'origine
          '--segments-y': 5,
        }}
      >
        <main ref={mainRef} className="books-dome-main">
          <div className="books-dome-stage">
            <div
              ref={sphereRef}
              className="books-dome-sphere"
            >
              {items.map((item, index) => (
                <button
                  key={`${item.bookId}-${index}`}
                  type="button"
                  className="books-dome-item"
                  style={{
                    '--offset-x': item.x,
                    '--offset-y': item.y,
                    '--item-size-x': item.sizeX,
                    '--item-size-y': item.sizeY,
                  }}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="books-dome-item__image">
                    <img src={item.src} alt={item.alt} loading="lazy" />
                  </div>
                </button>
              ))}
            </div>
          </div>
          {/* Edge fades / overlay de fond */}
          <div className="books-dome-overlay" />
          <div className="books-dome-overlay books-dome-overlay--blur" />
          <div className="books-dome-edge-fade books-dome-edge-fade--top" />
          <div className="books-dome-edge-fade books-dome-edge-fade--bottom" />
        </main>

        {overlayVisible && openedItem && (
          <div
            className="books-dome-enlarge-scrim"
            onClick={() => {
              setOverlayVisible(false);
              setOpenedItem(null);
            }}
          >
            <div
              className="books-dome-enlarge-frame"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="books-dome-enlarge-image">
                <img src={openedItem.src} alt={openedItem.alt} />
              </div>
              <div className="books-dome-enlarge-meta">
                <h3 className="books-dome-enlarge-title">
                  {openedItem.book?.title || openedItem.alt}
                </h3>
                {openedItem.book?.author && (
                  <p className="books-dome-enlarge-author">
                    {openedItem.book.author}
                  </p>
                )}
                <div className="books-dome-enlarge-extra">
                  {openedItem.book?.genre && (
                    <span className="books-dome-enlarge-pill">
                      {openedItem.book.genre}
                    </span>
                  )}
                  {openedItem.book?.pages && (
                    <span className="books-dome-enlarge-pill">
                      {openedItem.book.pages} pages
                    </span>
                  )}
                  {openedItem.book?.status && (
                    <span className="books-dome-enlarge-pill books-dome-enlarge-pill--status">
                      {openedItem.book.status}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="books-dome-enlarge-button"
                  onClick={() => {
                    if (onBookOpen) {
                      onBookOpen(openedItem.bookId);
                    }
                    setOverlayVisible(false);
                    setOpenedItem(null);
                  }}
                >
                  Voir le détail dans l’onglet Livres
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BooksDomeGallery;
