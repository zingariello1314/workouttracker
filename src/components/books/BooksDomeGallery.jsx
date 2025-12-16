import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, memo, useCallback } from 'react';
import './booksDome.css';

/**
 * books: tableau de { id, title, author?, coverUrl }
 * onBookOpen: callback (bookId: string) => void
 * dragSensitivity: plus grand = moins sensible
 * dragDampening: contrôle la traînée de l’inertie (0–1)
 */
const DEFAULT_SEGMENTS = 35;

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
  const usedBooks = Array.from({ length: totalSlots }, (_, i) => 
    baseItems[i % baseItems.length]
  );

  // Éviter les doublons consécutifs (comme dans la référence, pas de Fisher-Yates)
  for (let i = 1; i < usedBooks.length; i++) {
    if (usedBooks[i].src === usedBooks[i - 1].src) {
      for (let j = i + 1; j < usedBooks.length; j++) {
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
  maxSegments,
  className,
  // Options pour ResizeObserver (comme dans la référence)
  fit = 0.6,
  fitBasis = 'auto',
  minRadius = 400,
  maxRadius = 800,
  padFactor = 0.2,
  overlayBlurColor = '#000000',
  imageBorderRadius = '12px',
  openedImageBorderRadius = '12px',
  grayscale = false,
}) => {
  const segments = maxSegments ? Math.min(maxSegments, DEFAULT_SEGMENTS) : DEFAULT_SEGMENTS;
  const items = useMemo(() => buildDomeItems(books, segments), [books, segments]);

  const rootRef = useRef(null);
  const mainRef = useRef(null);
  const sphereRef = useRef(null);

  const rotationXRef = useRef(0);
  const rotationYRef = useRef(0);
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [mounted, setMounted] = useState(false);

  const draggingRef = useRef(false);
  const inertiaActiveRef = useRef(false); // Pour tracker si l'inertie est active
  const lastDragEndAtRef = useRef(0); // Pour vérifier si on a fait un drag récemment
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startRotationXRef = useRef(0);
  const startRotationYRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const inertiaFrameRef = useRef(null);
  const lastInertiaTimeRef = useRef(null);
  const pendingTransformRef = useRef(null);
  const transformRafIdRef = useRef(null);
  const moveRafIdRef = useRef(null);
  const pendingDeltaXRef = useRef(0);
  const pendingTimeRef = useRef(0);

  const [openedItem, setOpenedItem] = useState(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  
  // Solution 4: Virtualisation avec Intersection Observer pour les items du dôme
  const [visibleItems, setVisibleItems] = useState(new Set());
  const itemRefs = useRef(new Map());

  // ResizeObserver pour calculer dynamiquement le radius (comme dans la référence Vue.js)
  // Optimisé avec RAF pour éviter les recalculs excessifs
  useEffect(() => {
    const root = rootRef.current;
    let resizeRafId = null;
    
    if (!root) {
      // Réessayer après un court délai si root n'est pas encore disponible
      const timer = setTimeout(() => {
        const retryRoot = rootRef.current;
        if (retryRoot) {
          // Déclencher manuellement le calcul
          const cr = retryRoot.getBoundingClientRect();
          const w = Math.max(1, cr.width);
          const h = Math.max(1, cr.height);
          const minDim = Math.min(w, h);
          const maxDim = Math.max(w, h);
          const aspect = w / h;
          
          let basis;
          switch (fitBasis) {
            case 'min':
              basis = minDim;
              break;
            case 'max':
              basis = maxDim;
              break;
            case 'width':
              basis = w;
              break;
            case 'height':
              basis = h;
              break;
            default:
              basis = aspect >= 1.3 ? w : minDim;
          }
          
          let radius = basis * fit;
          const heightGuard = h * 1.35;
          radius = Math.min(radius, heightGuard);
          radius = clamp(radius, minRadius, maxRadius);
          const finalRadius = Math.round(radius);
          const viewerPad = Math.max(8, Math.round(minDim * padFactor));
          
          retryRoot.style.setProperty('--radius', `${finalRadius}px`);
          retryRoot.style.setProperty('--viewer-pad', `${viewerPad}px`);
          retryRoot.style.setProperty('--overlay-blur-color', overlayBlurColor);
          retryRoot.style.setProperty('--tile-radius', imageBorderRadius);
          retryRoot.style.setProperty('--enlarge-radius', openedImageBorderRadius);
          retryRoot.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none');
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    let resizeTimeout = null;
    
    const ro = new ResizeObserver((entries) => {
      // Solution 10: Debounce agressif avec setTimeout + RAF pour éviter les recalculs excessifs
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      resizeTimeout = setTimeout(() => {
        if (resizeRafId) return; // Ignorer si déjà en attente de RAF
        
        resizeRafId = requestAnimationFrame(() => {
          const cr = entries[0].contentRect;
          const w = Math.max(1, cr.width);
          const h = Math.max(1, cr.height);
        const minDim = Math.min(w, h);
        const maxDim = Math.max(w, h);
        const aspect = w / h;

        // Utiliser les options passées en props (comme dans la référence avec override)

        let basis;
        switch (fitBasis) {
          case 'min':
            basis = minDim;
            break;
          case 'max':
            basis = maxDim;
            break;
          case 'width':
            basis = w;
            break;
          case 'height':
            basis = h;
            break;
          default:
            basis = aspect >= 1.3 ? w : minDim;
        }

        let radius = basis * fit;
        const heightGuard = h * 1.35;
        radius = Math.min(radius, heightGuard);
        radius = clamp(radius, minRadius, maxRadius);
        const finalRadius = Math.round(radius);

        const viewerPad = Math.max(8, Math.round(minDim * padFactor));

        root.style.setProperty('--radius', `${finalRadius}px`);
        root.style.setProperty('--viewer-pad', `${viewerPad}px`);
        root.style.setProperty('--overlay-blur-color', overlayBlurColor);
        root.style.setProperty('--tile-radius', imageBorderRadius);
        root.style.setProperty('--enlarge-radius', openedImageBorderRadius);
        root.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none');
        
        resizeRafId = null;
      });
      }, 200); // Délai de 200ms pour debounce agressif
    });

    ro.observe(root);

    return () => {
      ro.disconnect();
      if (resizeRafId) {
        cancelAnimationFrame(resizeRafId);
        resizeRafId = null;
      }
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
        resizeTimeout = null;
      }
    };
  }, [fit, fitBasis, minRadius, maxRadius, padFactor, overlayBlurColor, imageBorderRadius, openedImageBorderRadius, grayscale]);

  // Appliquer le transform uniquement pour l'initialisation (optimisé pour éviter les conflits)
  useEffect(() => {
    const sphere = sphereRef.current;
    if (!sphere) return;
    
    // Ne pas interférer pendant le drag actif ou l'inertie
    if (draggingRef.current || inertiaActiveRef.current) return;
    
    // Seulement si la rotation a vraiment changé (évite les updates inutiles)
    if (rotationYRef.current === rotationY) return;

    // Initialisation ou changement externe uniquement
    rotationYRef.current = rotationY;
    sphere.style.transition = 'transform 120ms ease-out';
    sphere.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(0deg) rotateY(${rotationY}deg)`;
  }, []); // Dépendances vides - seulement au mount

  // Forcer le montage après le premier rendu
  useEffect(() => {
    setMounted(true);
  }, []);

  // Drag + inertie - Optimisé pour fluidité maximale
  useEffect(() => {
    let retryCount = 0;
    const MAX_RETRIES = 20;
    let retryTimer = null;
    let cleanupFn = null;
    
    const tryAttachListeners = () => {
      const mainEl = mainRef.current;
      const sphereEl = sphereRef.current;
      
      if (!mainEl || !sphereEl) {
        retryCount++;
        if (retryCount < MAX_RETRIES) {
          retryTimer = setTimeout(tryAttachListeners, 100);
          return;
        }
        return;
      }
      
      // Initialiser la rotation initiale
      rotationYRef.current = rotationY;
      if (sphereEl) {
        sphereEl.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(0deg) rotateY(${rotationY}deg)`;
      }

      // Variables exactement comme dans la référence
      let isDragging = false;
      let startX = 0;
      let startRotationY = 0;
      let lastMoveTime = 0;
      let lastMoveX = 0; // Position X du dernier mouvement pour calculer la vélocité instantanée
      let velocity = 0;
      let inertiaFrameId = null; // Utiliser requestAnimationFrame au lieu de setInterval
      const velocityHistory = []; // Pour moyenne glissante
      const MAX_VELOCITY_HISTORY = 5;
      
      // Fonction pour appliquer le transform avec batching (RAF)
      const applyTransformBatched = (rotationY) => {
        pendingTransformRef.current = rotationY;
        
        if (!transformRafIdRef.current) {
          transformRafIdRef.current = requestAnimationFrame(() => {
            const sphere = sphereRef.current;
            if (sphere && pendingTransformRef.current !== null) {
              sphere.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(0deg) rotateY(${pendingTransformRef.current}deg)`;
              pendingTransformRef.current = null;
            }
            transformRafIdRef.current = null;
          });
        }
      };

      const handleMouseDown = (e) => {
        // Arrêter l'inertie si elle était en cours
        if (inertiaFrameId) {
          cancelAnimationFrame(inertiaFrameId);
          inertiaFrameId = null;
          inertiaFrameRef.current = null;
          inertiaActiveRef.current = false;
        }
        
        // Annuler les RAF en attente
        if (moveRafIdRef.current) {
          cancelAnimationFrame(moveRafIdRef.current);
          moveRafIdRef.current = null;
        }
        if (transformRafIdRef.current) {
          cancelAnimationFrame(transformRafIdRef.current);
          transformRafIdRef.current = null;
        }
        
        // Démarrer le drag
        isDragging = true;
        draggingRef.current = true;
        startX = e.clientX;
        startRotationY = rotationYRef.current;
        lastMoveTime = Date.now();
        lastMoveX = e.clientX; // Initialiser pour le calcul de vélocité instantanée
        velocityHistory.length = 0; // Réinitialiser l'historique
        document.body.style.cursor = 'grabbing';
        
        // Désactiver la transition pendant le drag
        const currentSphereEl = sphereRef.current;
        if (currentSphereEl) {
          currentSphereEl.style.transition = 'none';
          // Appliquer will-change pendant le drag
          currentSphereEl.style.willChange = 'transform';
        }
      };

      const handleMouseMove = (e) => {
        if (!isDragging) return;
        
        const currentX = e.clientX;
        const deltaX = currentX - startX; // Delta total depuis le début pour la rotation
        const moveDeltaX = currentX - lastMoveX; // Delta depuis le dernier mouvement pour la vélocité
        const currentTime = Date.now();
        const deltaTime = currentTime - lastMoveTime;
        
        // Calculer la vélocité instantanée pour l'inertie (delta depuis le dernier mouvement)
        // C'est plus précis que d'utiliser le delta total
        if (deltaTime > 0) {
          velocity = moveDeltaX / deltaTime;
        }
        lastMoveTime = currentTime;
        lastMoveX = currentX;
        
        // Sensibilité encore plus réduite pour rotation très douce
        const sensitivity = 0.08; // Réduit de 0.12 à 0.08 pour rotation plus lente
        const newRotationY = startRotationY + deltaX * sensitivity;
        
        // Garder la rotation X fixe à 0
        rotationXRef.current = 0;
        rotationYRef.current = newRotationY;
        
        // Appliquer le transform directement (sans transition)
        const currentSphereEl = sphereRef.current;
        if (currentSphereEl) {
          currentSphereEl.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(0deg) rotateY(${newRotationY}deg)`;
        }
      };

      const handleMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;
        draggingRef.current = false;
        document.body.style.cursor = '';
        
        // Nettoyer les RAF en attente
        if (moveRafIdRef.current) {
          cancelAnimationFrame(moveRafIdRef.current);
          moveRafIdRef.current = null;
        }
        
        // Retirer will-change après le drag
        const currentSphereEl = sphereRef.current;
        if (currentSphereEl) {
          currentSphereEl.style.willChange = 'auto';
        }
        
        // Enregistrer le moment de fin du drag
        lastDragEndAtRef.current = performance.now();
        
        // Ajouter l'inertie (traînée) - paramètres optimisés pour traînée plus visible
        if (Math.abs(velocity) > 0.1) {
          // Facteur d'amortissement ajusté pour compenser la sensibilité réduite
          // Avec sensitivity 0.08, on augmente le facteur d'inertie pour maintenir une traînée visible
          let inertiaVelocity = velocity * 0.2; // Augmenté pour compenser la sensibilité très réduite (0.08)
          const friction = 0.93; // Friction légèrement réduite pour traînée plus longue
          
          inertiaActiveRef.current = true; // Marquer l'inertie comme active
          lastInertiaTimeRef.current = null; // Réinitialiser le temps pour RAF
          
          const applyInertia = (timestamp) => {
            // Gérer la visibilité de l'onglet
            if (document.hidden) {
              cancelAnimationFrame(inertiaFrameId);
              inertiaFrameId = null;
              inertiaFrameRef.current = null;
              inertiaActiveRef.current = false;
              return;
            }
            
            // Initialiser le temps si première frame
            if (lastInertiaTimeRef.current === null) {
              lastInertiaTimeRef.current = timestamp;
            }
            
            const deltaTime = timestamp - lastInertiaTimeRef.current;
            lastInertiaTimeRef.current = timestamp;
            
            // Normaliser la friction en fonction du temps réel (indépendant de la fréquence)
            const frictionFactor = Math.pow(friction, deltaTime / 16); // Normaliser à 16ms
            
            if (Math.abs(inertiaVelocity) < 0.02) {
              if (inertiaFrameId) {
                cancelAnimationFrame(inertiaFrameId);
                inertiaFrameId = null;
                inertiaFrameRef.current = null;
              }
              inertiaActiveRef.current = false; // Marquer l'inertie comme terminée
              // Synchroniser avec le state seulement à la fin
              setRotationY(rotationYRef.current);
              // Réactiver la transition après l'inertie
              const currentSphereEl = sphereRef.current;
              if (currentSphereEl) {
                currentSphereEl.style.transition = 'transform 120ms ease-out';
                currentSphereEl.style.willChange = 'auto';
              }
              return;
            }
            
            // Appliquer l'inertie normalisée par le temps
            rotationYRef.current += inertiaVelocity * (deltaTime / 16); // Normaliser à 16ms
            applyTransformBatched(rotationYRef.current);
            
            // Appliquer la friction normalisée
            inertiaVelocity *= frictionFactor;
            
            // Continuer avec RAF
            inertiaFrameId = requestAnimationFrame(applyInertia);
            inertiaFrameRef.current = inertiaFrameId;
          };
          
          // Démarrer l'inertie avec RAF
          inertiaFrameId = requestAnimationFrame(applyInertia);
          inertiaFrameRef.current = inertiaFrameId;
        } else {
          setRotationY(rotationYRef.current);
        }
      };

      const handleTouchStart = (e) => {
        // Arrêter l'inertie si elle était en cours
        if (inertiaFrameId) {
          cancelAnimationFrame(inertiaFrameId);
          inertiaFrameId = null;
          inertiaFrameRef.current = null;
          inertiaActiveRef.current = false;
        }
        
        // Annuler les RAF en attente
        if (moveRafIdRef.current) {
          cancelAnimationFrame(moveRafIdRef.current);
          moveRafIdRef.current = null;
        }
        if (transformRafIdRef.current) {
          cancelAnimationFrame(transformRafIdRef.current);
          transformRafIdRef.current = null;
        }
        
        e.preventDefault();
        const touch = e.touches[0];
        isDragging = true;
        draggingRef.current = true;
        startX = touch.clientX;
        startRotationY = rotationYRef.current;
        lastMoveTime = Date.now();
        lastMoveX = touch.clientX; // Initialiser pour le calcul de vélocité instantanée
        
        const currentSphereEl = sphereRef.current;
        if (currentSphereEl) {
          currentSphereEl.style.transition = 'none';
          // Appliquer will-change pendant le drag
          currentSphereEl.style.willChange = 'transform';
        }
        velocityHistory.length = 0; // Réinitialiser l'historique
      };

      const handleTouchMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        
        const currentX = touch.clientX;
        const deltaX = currentX - startX; // Delta total depuis le début pour la rotation
        const moveDeltaX = currentX - lastMoveX; // Delta depuis le dernier mouvement pour la vélocité
        const currentTime = Date.now();
        const deltaTime = currentTime - lastMoveTime;
        
        // Accumuler les deltas pour le throttling
        pendingDeltaXRef.current += moveDeltaX;
        pendingTimeRef.current = deltaTime;
        lastMoveX = currentX;
        
        // Calculer la vélocité instantanée avec moyenne glissante
        if (deltaTime > 0) {
          const instantVelocity = moveDeltaX / deltaTime;
          velocityHistory.push(instantVelocity);
          if (velocityHistory.length > MAX_VELOCITY_HISTORY) {
            velocityHistory.shift();
          }
          // Moyenne des dernières vélocités pour plus de cohérence
          velocity = velocityHistory.reduce((a, b) => a + b, 0) / velocityHistory.length;
        }
        lastMoveTime = currentTime;
        
        // Throttler avec RAF (limiter à 60 FPS)
        if (!moveRafIdRef.current) {
          moveRafIdRef.current = requestAnimationFrame(() => {
            // Sensibilité encore plus réduite pour rotation très douce
            const sensitivity = 0.08; // Réduit de 0.12 à 0.08 pour rotation plus lente
            const newRotationY = startRotationY + deltaX * sensitivity;
            
            // Garder la rotation X fixe à 0
            rotationXRef.current = 0;
            rotationYRef.current = newRotationY;
            
            // Appliquer le transform avec batching
            applyTransformBatched(newRotationY);
            
            pendingDeltaXRef.current = 0;
            moveRafIdRef.current = null;
          });
        }
      };

      const handleTouchEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        draggingRef.current = false;
        
        // Nettoyer les RAF en attente
        if (moveRafIdRef.current) {
          cancelAnimationFrame(moveRafIdRef.current);
          moveRafIdRef.current = null;
        }
        
        // Retirer will-change après le drag
        const currentSphereEl = sphereRef.current;
        if (currentSphereEl) {
          currentSphereEl.style.willChange = 'auto';
        }
        
        // Enregistrer le moment de fin du drag
        lastDragEndAtRef.current = performance.now();
        
        // Ajouter l'inertie (traînée) - paramètres optimisés
        if (Math.abs(velocity) > 0.1) {
          // Facteur d'amortissement ajusté pour compenser la sensibilité réduite
          let inertiaVelocity = velocity * 0.2; // Augmenté pour compenser la sensibilité très réduite (0.08)
          const friction = 0.93; // Friction légèrement réduite pour traînée plus longue
          
          inertiaActiveRef.current = true; // Marquer l'inertie comme active
          lastInertiaTimeRef.current = null; // Réinitialiser le temps pour RAF
          
          const applyInertia = (timestamp) => {
            // Gérer la visibilité de l'onglet
            if (document.hidden) {
              cancelAnimationFrame(inertiaFrameId);
              inertiaFrameId = null;
              inertiaFrameRef.current = null;
              inertiaActiveRef.current = false;
              return;
            }
            
            // Initialiser le temps si première frame
            if (lastInertiaTimeRef.current === null) {
              lastInertiaTimeRef.current = timestamp;
            }
            
            const deltaTime = timestamp - lastInertiaTimeRef.current;
            lastInertiaTimeRef.current = timestamp;
            
            // Normaliser la friction en fonction du temps réel (indépendant de la fréquence)
            const frictionFactor = Math.pow(friction, deltaTime / 16); // Normaliser à 16ms
            
            if (Math.abs(inertiaVelocity) < 0.02) {
              if (inertiaFrameId) {
                cancelAnimationFrame(inertiaFrameId);
                inertiaFrameId = null;
                inertiaFrameRef.current = null;
              }
              inertiaActiveRef.current = false; // Marquer l'inertie comme terminée
              // Synchroniser avec le state seulement à la fin
              setRotationY(rotationYRef.current);
              // Réactiver la transition après l'inertie
              const currentSphereEl = sphereRef.current;
              if (currentSphereEl) {
                currentSphereEl.style.transition = 'transform 120ms ease-out';
                currentSphereEl.style.willChange = 'auto';
              }
              return;
            }
            
            // Appliquer l'inertie normalisée par le temps
            rotationYRef.current += inertiaVelocity * (deltaTime / 16); // Normaliser à 16ms
            applyTransformBatched(rotationYRef.current);
            
            // Appliquer la friction normalisée
            inertiaVelocity *= frictionFactor;
            
            // Continuer avec RAF
            inertiaFrameId = requestAnimationFrame(applyInertia);
            inertiaFrameRef.current = inertiaFrameId;
          };
          
          // Démarrer l'inertie avec RAF
          inertiaFrameId = requestAnimationFrame(applyInertia);
          inertiaFrameRef.current = inertiaFrameId;
        } else {
          setRotationY(rotationYRef.current);
        }
      };

      // Événements souris
      mainEl.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      // Événements tactiles
      mainEl.addEventListener('touchstart', handleTouchStart, { passive: false });
      mainEl.addEventListener('touchmove', handleTouchMove, { passive: false });
      mainEl.addEventListener('touchend', handleTouchEnd);

      // Fonction de cleanup
      cleanupFn = () => {
        mainEl.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        mainEl.removeEventListener('touchstart', handleTouchStart);
        mainEl.removeEventListener('touchmove', handleTouchMove);
        mainEl.removeEventListener('touchend', handleTouchEnd);

        // Nettoyer tous les RAF
        if (inertiaFrameId) {
          cancelAnimationFrame(inertiaFrameId);
          inertiaFrameId = null;
          inertiaFrameRef.current = null;
        }
        if (moveRafIdRef.current) {
          cancelAnimationFrame(moveRafIdRef.current);
          moveRafIdRef.current = null;
        }
        if (transformRafIdRef.current) {
          cancelAnimationFrame(transformRafIdRef.current);
          transformRafIdRef.current = null;
        }
      };
    };
    
    // Démarrer la tentative d'attachement
    tryAttachListeners();
    
    // Retourner la fonction de cleanup
    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [items.length]); // Réexécuter seulement quand les items changent (rotationY retiré pour éviter les re-attachements)

  // Solution 4: Intersection Observer pour virtualisation des items du dôme
  useEffect(() => {
    if (!sphereRef.current || items.length === 0 || !mounted) return;

    const observers = [];
    const visibleSet = new Set();
    let rafId = null;

    // Fonction pour mettre à jour l'état de manière batchée via RAF
    const updateVisibleItems = () => {
      setVisibleItems(new Set(visibleSet));
      rafId = null;
    };

    // Observer tous les items pour détecter leur visibilité
    items.forEach((item, index) => {
      const itemElement = itemRefs.current.get(index);
      if (!itemElement) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              visibleSet.add(index);
            } else {
              visibleSet.delete(index);
            }
            // Mettre à jour l'état avec un batch via RAF pour éviter les re-renders excessifs
            if (!rafId) {
              rafId = requestAnimationFrame(updateVisibleItems);
            }
          });
        },
        {
          root: sphereRef.current,
          rootMargin: '50%', // Pré-rendre les items proches
          threshold: 0.01, // Même 1% de visibilité compte
        }
      );

      observer.observe(itemElement);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [items.length, mounted]);

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
    // Vérifier si on a fait un drag récemment - logique améliorée
    if (draggingRef.current) return;
    
    // Réduire le délai de 80ms à 50ms et ajouter une vérification d'inertie
    const timeSinceDragEnd = performance.now() - lastDragEndAtRef.current;
    if (timeSinceDragEnd < 50 && inertiaActiveRef.current) return;
    
    console.log('📚 Clic sur livre détecté:', item.book?.title || item.alt);
    
    if (onBookOpen) {
      onBookOpen(item.bookId);
    }
    setOpenedItem(item);
    setOverlayVisible(true);
  };

  return (
    <div className={`books-dome-container ${className || ''}`}>
      <div
        ref={rootRef}
        className="books-dome-sphere-root"
        style={{
          '--segments-x': segments,
          '--segments-y': segments, // Comme dans la référence HTML (35, pas 5)
          // Les autres variables (--overlay-blur-color, --tile-radius, etc.) sont définies par ResizeObserver
        }}
      >
        <main ref={mainRef} className="books-dome-main">
          <div className="books-dome-stage">
            <div
              ref={sphereRef}
              className="books-dome-sphere"
            >
              {items.map((item, index) => {
                // Solution 4: Ne rendre que les items visibles ou proches (virtualisation)
                // Toujours rendre les 20 premiers items pour l'initialisation
                const isVisible = index < 20 || 
                                 visibleItems.has(index) || 
                                 visibleItems.has(index - 1) || 
                                 visibleItems.has(index + 1) ||
                                 visibleItems.has(index - 2) ||
                                 visibleItems.has(index + 2);
                
                // Pour les items non visibles, créer un placeholder minimal pour l'Intersection Observer
                if (!isVisible && visibleItems.size > 0) {
                  return (
                    <div
                      key={`${item.bookId}-${index}`}
                      className="books-dome-item"
                      style={{
                        '--offset-x': item.x,
                        '--offset-y': item.y,
                        '--item-size-x': item.sizeX,
                        '--item-size-y': item.sizeY,
                        visibility: 'hidden',
                        pointerEvents: 'none',
                        position: 'absolute',
                      }}
                      ref={(el) => {
                        if (el) itemRefs.current.set(index, el);
                      }}
                      aria-hidden="true"
                    />
                  );
                }

                return (
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
                    ref={(el) => {
                      if (el) itemRefs.current.set(index, el);
                    }}
                  >
                    <div className="books-dome-item__image">
                      <img 
                        src={item.src} 
                        alt={item.alt} 
                        loading={index < 20 ? "eager" : "lazy"}
                        decoding="async"
                        fetchpriority={index < 20 ? "high" : "low"}
                      />
                    </div>
                  </button>
                );
              })}
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
                {openedItem.book?.shortSummary && (
                  <p className="books-dome-enlarge-summary">
                    {openedItem.book.shortSummary}
                  </p>
                )}
                <div className="books-dome-enlarge-extra">
                  {openedItem.book?.genre && (
                    <span className="books-dome-enlarge-pill">
                      {openedItem.book.genre}
                    </span>
                  )}
                  {openedItem.book?.year && (
                    <span className="books-dome-enlarge-pill">
                      {openedItem.book.year}
                    </span>
                  )}
                  {openedItem.book?.pages && (
                    <span className="books-dome-enlarge-pill">
                      {openedItem.book.pages} pages
                    </span>
                  )}
                  {typeof openedItem.book?.personalScore === 'number' &&
                    openedItem.book.personalScore > 0 && (
                      <span className="books-dome-enlarge-pill books-dome-enlarge-pill--score">
                        ⭐ {openedItem.book.personalScore}/10
                      </span>
                    )}
                  {openedItem.book?.status && (
                    <span className="books-dome-enlarge-pill books-dome-enlarge-pill--status">
                      {openedItem.book.status === 'in-progress'
                        ? 'En cours'
                        : openedItem.book.status === 'completed'
                        ? 'Terminé'
                        : openedItem.book.status === 'to-read'
                        ? 'À lire'
                        : openedItem.book.status === 'paused'
                        ? 'En pause'
                        : openedItem.book.status === 'abandoned'
                        ? 'Abandonné'
                        : openedItem.book.status}
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
                  Voir le détail dans l'onglet Livres
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(BooksDomeGallery);
