import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { useAppLock } from '../context/AppLockContext';
import { useHomepageImages } from '../hooks/useHomepageImages';
import {
  getVisibleHomepageImageIndices,
  normalizeHomepageImage,
  pickInitialHomepageImageIndex,
  pickNextHomepageImageIndex
} from '../utils/homepageImagePreferences';
import { preloadAdjacentImages, preloadImage } from '../utils/imageLazyLoader';
import logger from '../utils/logger';
import LanguageSelector from './ui/LanguageSelector';
import NavigationHeader from './ui/NavigationHeader';
import { useTranslation } from '../utils/translations';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import SwipeIndicator from './ui/SwipeIndicator';
import { getSettings } from '../services/swipeNavigationSettings';
import { useQuoteDisplay } from '../hooks/useQuoteDisplay';
import { SplineScene } from './ui/SplineScene';
import { MomentumWelcomeGate } from './ui/MomentumBrandedLoading';

const log = logger.component('HomePage');

/** Plafond de taille (rem) pour que N lignes tiennent sans mesure layout (évite zoom/dézoom JS) */
function getQuoteFontCapRem(lineCount, sandwichBold = false) {
  if (typeof window === 'undefined') return 5;
  const vh = window.innerHeight;
  const narrow = window.innerWidth < 768;
  const reserveFooter = narrow ? vh * 0.37 : vh * 0.31;
  const reserveHeader = Math.min(148, vh * 0.17);
  const budgetPx = Math.max(68, vh - reserveFooter - reserveHeader - 52);
  const lc = Math.max(lineCount, 1);
  let perLineEm = lc >= 5 ? 1.38 : lc >= 3 ? 1.22 : 1.12;
  /** 5 lignes max + sandwich fins→gras→fins : interligne un peu plus haut pour le budget vertical */
  if (lc === 5 && sandwichBold) {
    perLineEm = 1.52;
  }
  const tightFactor = lc === 5 && sandwichBold ? 0.84 : 0.88;
  const maxPx = (budgetPx / (lc * perLineEm)) * tightFactor;
  const cap = maxPx / 16;
  const absoluteMax =
    lc <= 1 ? 4.55 : lc === 2 ? 4 : lc === 3 ? 3.4 : lc === 4 ? 2.75 : 2.05;
  let abs = absoluteMax;
  if (lc === 5 && sandwichBold) {
    abs = Math.min(abs, 1.58);
  }
  return Math.max(0.68, Math.min(cap, abs));
}

const HomePage = () => {
  const { setActiveTab, activeTab } = useWorkout();
  const { isAuthenticated } = useAuth();
  const { lockNow, lockReady } = useAppLock();
  const t = useTranslation();
  // ✅ Récupérer la langue depuis useTranslation pour éviter le double appel de useLanguage
  // useTranslation utilise déjà useLanguage en interne
  const language = t.language || 'fr'; // Fallback vers 'fr' si non disponible
  const { backgroundImages, isLoading, systemHealth } = useHomepageImages();
  const {
    displayQuote,
    currentQuote,
    loading: quoteLoading,
    tryAdvanceQuoteFromInteraction,
  } = useQuoteDisplay();
  /** Dernière citation affichée valide — évite un frame fallback / citation hors-sujet entre deux tours. */
  const lastStableQuoteRef = useRef(null);
  if (displayQuote?.lines?.length) {
    lastStableQuoteRef.current = displayQuote;
  }
  const quoteToRender =
    displayQuote?.lines?.length > 0
      ? displayQuote
      : !quoteLoading && lastStableQuoteRef.current?.lines?.length > 0
        ? lastStableQuoteRef.current
        : null;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userLocation, setUserLocation] = useState('');
  
  // ✅ Load swipe navigation settings from localStorage
  const [swipeSettings, setSwipeSettings] = useState(() => getSettings());
  
  // ✅ Listen for settings changes from SettingsTab
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'swipeNavigationSettings') {
        setSwipeSettings(getSettings());
      }
    };
    
    // Listen for storage events (changes from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom event (changes from same tab)
    const handleSettingsUpdate = () => {
      setSwipeSettings(getSettings());
    };
    window.addEventListener('swipeSettingsUpdated', handleSettingsUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('swipeSettingsUpdated', handleSettingsUpdate);
    };
  }, []);
  
  // ✅ Swipe navigation configuration with settings from localStorage
  const { swipeState, swipeProgress, isSwipeValid } = useSwipeNavigation({
    threshold: swipeSettings.threshold,
    velocityThreshold: swipeSettings.velocityThreshold,
    enabled: swipeSettings.enabled,
    onSwipeDown: () => {
      setActiveTab('dashboard');
    }
  });
  
  // Initialiser userLocation avec la traduction
  useEffect(() => {
    setUserLocation(t('home.location.loading'));
  }, [t]);
  
  // ✅ Phase 7: Double buffering pour transitions ultra-fluides
  const [activeLayer, setActiveLayer] = useState(0); // 0 ou 1
  const [layer0Src, setLayer0Src] = useState(null);
  const [layer1Src, setLayer1Src] = useState(null);
  const [layer0Opacity, setLayer0Opacity] = useState(1);
  const [layer1Opacity, setLayer1Opacity] = useState(0);
  const [layer0Loaded, setLayer0Loaded] = useState(false);
  const [layer1Loaded, setLayer1Loaded] = useState(false);
  
  // ✅ Chargement initial : État pour savoir si l'image initiale est chargée
  const [isInitialImageLoaded, setIsInitialImageLoaded] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  /** L’utilisateur a validé l’écran d’accueil (bouton déverrouiller). */
  const [introPlaybackDone, setIntroPlaybackDone] = useState(false);
  const onUnlockHomeWelcome = useCallback(() => {
    setIntroPlaybackDone(true);
    setShowLoadingScreen(false);
    // Si un code app lock est défini : afficher tout de suite l’écran PIN (LockScreen au-dessus).
    if (lockReady) {
      queueMicrotask(() => {
        lockNow();
      });
    }
  }, [lockReady, lockNow]);
  const initialImageLoadedRef = useRef(false); // Ref pour suivre si l'image initiale a été marquée comme chargée
  
  const imagePreloadedRef = useRef(new Set()); // Images déjà préchargées
  const loadingImageRef = useRef(null); // Référence image en cours de chargement
  const homeQuoteMainRef = useRef(null);

  // ✅ FIX: Géolocalisation uniquement après interaction utilisateur (conformité navigateur)
  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setUserLocation(t('home.location.notSupported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Utiliser une API de géocodage inverse pour obtenir le nom de la ville
        const lang = language === 'en' ? 'en' : 'fr';
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=${lang}`)
          .then(response => response.json())
          .then(data => {
            if (data.city && data.countryName) {
              // Supprimer les préfixes comme "la", "le", "les", "the" du nom du pays
              const cleanCountryName = data.countryName.replace(/^(la|le|les|the|du|de|des|d'|l')\s+/i, '');
              setUserLocation(`${data.city}, ${cleanCountryName}`);
            } else {
              setUserLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
            }
          })
          .catch(() => {
            setUserLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
          });
      },
      () => {
        setUserLocation(t('home.location.notAvailable'));
      }
    );
  };

  // ✅ FIX: Demander géolocalisation seulement après premier clic utilisateur
  useEffect(() => {
    // Ne pas demander automatiquement - attendre interaction utilisateur
    // setUserLocation sera mis à jour après le premier clic
    const handleFirstInteraction = () => {
      requestUserLocation();
      // Retirer listeners après premier appel
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  // ✅ Phase 7: Charger une image dans un layer spécifique
  // ✅ Chargement initial : Support pour marquer l'image initiale comme chargée
  const loadImageIntoLayer = async (imageData, layerIndex, useThumbnailFirst = true, isInitialLoad = false) => {
    if (!imageData) return null;
    
    try {
      // Déterminer les données full
      const fullData = typeof imageData === 'object' && imageData.full
        ? imageData.full
        : imageData;
      
      // Déterminer le thumbnail (si disponible)
      const thumbnail = typeof imageData === 'object' && imageData.thumbnail
        ? imageData.thumbnail
        : null;
      
      // Si thumbnail disponible et demandé, l'utiliser immédiatement
      if (useThumbnailFirst && thumbnail) {
        if (layerIndex === 0) {
          setLayer0Src(thumbnail);
          setLayer0Loaded(false);
          // ✅ Chargement initial : Si c'est le chargement initial, marquer comme chargé dès que thumbnail est visible
          if (isInitialLoad && !initialImageLoadedRef.current) {
            initialImageLoadedRef.current = true;
            setIsInitialImageLoaded(true);
            // Masquer l'écran de chargement avec un léger délai pour transition fluide
            setTimeout(() => {
              setShowLoadingScreen(false);
            }, 300);
          }
        } else {
          setLayer1Src(thumbnail);
          setLayer1Loaded(false);
        }
      } else if (!useThumbnailFirst || !thumbnail) {
        // Si pas de thumbnail, attendre le chargement complet
        // Mais pour le chargement initial, on peut marquer comme chargé dès que l'image commence à se charger
        if (isInitialLoad && layerIndex === 0 && !initialImageLoadedRef.current) {
          // Attendre un court instant pour que l'image commence à se charger
          setTimeout(() => {
            if (!initialImageLoadedRef.current) {
              initialImageLoadedRef.current = true;
              setIsInitialImageLoaded(true);
              setTimeout(() => {
                setShowLoadingScreen(false);
              }, 300);
            }
          }, 100);
        }
      }
      
      // Précharger full en arrière-plan
      return new Promise((resolve) => {
        const img = new Image();
        img.src = fullData;
        
        img.onload = () => {
          // Mettre à jour le layer avec l'image full
          if (layerIndex === 0) {
            setLayer0Src(fullData);
            setLayer0Loaded(true);
            // ✅ Chargement initial : Si c'est le chargement initial et pas encore marqué, le marquer maintenant
            if (isInitialLoad && !initialImageLoadedRef.current) {
              initialImageLoadedRef.current = true;
              setIsInitialImageLoaded(true);
              setTimeout(() => {
                setShowLoadingScreen(false);
              }, 300);
            }
          } else {
            setLayer1Src(fullData);
            setLayer1Loaded(true);
          }
          log.debug(`✅ Image full chargée dans layer ${layerIndex}`);
          resolve(fullData);
        };
        
        img.onerror = () => {
          // En cas d'erreur, garder thumbnail si disponible, sinon garder l'ancienne image
          log.warn(`⚠️ Erreur chargement image full, utilisation thumbnail si disponible`);
          if (thumbnail) {
            if (layerIndex === 0) {
              setLayer0Src(thumbnail);
              setLayer0Loaded(true); // Considérer comme chargé même si c'est thumbnail
              // ✅ Chargement initial : Marquer comme chargé même en cas d'erreur
              if (isInitialLoad && !initialImageLoadedRef.current) {
                initialImageLoadedRef.current = true;
                setIsInitialImageLoaded(true);
                setTimeout(() => {
                  setShowLoadingScreen(false);
                }, 300);
              }
            } else {
              setLayer1Src(thumbnail);
              setLayer1Loaded(true);
            }
          }
          resolve(thumbnail || fullData);
        };
      });
    } catch (error) {
      log.error('❌ Erreur chargement image', error);
      // ✅ Chargement initial : En cas d'erreur, masquer quand même l'écran de chargement
      if (isInitialLoad && layerIndex === 0 && !initialImageLoadedRef.current) {
        initialImageLoadedRef.current = true;
        setIsInitialImageLoaded(true);
        setTimeout(() => {
          setShowLoadingScreen(false);
        }, 300);
      }
      return null;
    }
  };

  // ✅ Phase 7: Fonction pour changer l'image avec double buffering
  // ✅ RANDOMISATION : Rotation aléatoire avec évitement répétition
  const changeBackgroundImage = async () => {
    const visible = getVisibleHomepageImageIndices(backgroundImages);
    if (visible.length <= 1) return;

    const nextIndex = pickNextHomepageImageIndex(backgroundImages, currentImageIndex);
    if (nextIndex < 0) return;

    const nextImage = backgroundImages[nextIndex];
    
    if (!nextImage) return;
    
    // Déterminer le layer inactif
    const inactiveLayer = activeLayer === 0 ? 1 : 0;
    
    // Charger la nouvelle image dans le layer inactif (thumbnail d'abord, puis full)
    await loadImageIntoLayer(nextImage, inactiveLayer, true);
    
    // Attendre un court instant pour que le thumbnail soit visible
    // Puis faire le cross-fade immédiatement (l'image full se chargera en arrière-plan)
    // Layer actif : opacity 1 → 0
    // Layer inactif : opacity 0 → 1
    if (activeLayer === 0) {
      setLayer1Opacity(1); // Afficher layer 1 (avec thumbnail ou full)
      setLayer0Opacity(0); // Masquer layer 0
      setActiveLayer(1);
    } else {
      setLayer0Opacity(1); // Afficher layer 0 (avec thumbnail ou full)
      setLayer1Opacity(0); // Masquer layer 1
      setActiveLayer(0);
    }
    
    // Mettre à jour l'index
    setCurrentImageIndex(nextIndex);
  };

  // ✅ Phase 7: Charger image actuelle dans layer 0 (au montage et quand images changent)
  // ✅ Chargement initial : Détecter si c'est le premier chargement
  // ✅ RANDOMISATION : Index initial aléatoire
  const isFirstLoadRef = useRef(true);
  const initialIndexSetRef = useRef(false); // ✅ RANDOMISATION : Éviter de réinitialiser index plusieurs fois
  
  useEffect(() => {
    if (!backgroundImages || backgroundImages.length === 0) {
      setLayer0Src(null);
      setLayer1Src(null);
      setLayer0Loaded(false);
      setLayer1Loaded(false);
      // ✅ Chargement initial : Si pas d'images, masquer l'écran de chargement
      if (isFirstLoadRef.current) {
        initialImageLoadedRef.current = true;
        setIsInitialImageLoaded(true);
        setTimeout(() => {
          setShowLoadingScreen(false);
        }, 300);
        isFirstLoadRef.current = false;
      }
      return;
    }

    // Index initial pondéré (likées plus souvent), images masquées exclues
    if (!initialIndexSetRef.current && backgroundImages.length > 0) {
      const randomIndex = pickInitialHomepageImageIndex(backgroundImages);
      setCurrentImageIndex(randomIndex);
      initialIndexSetRef.current = true;
      log.debug(`🎲 Index initial pondéré: ${randomIndex}/${backgroundImages.length}`);
    }

    const currentNorm = normalizeHomepageImage(backgroundImages[currentImageIndex], currentImageIndex);
    if (currentNorm?.hidden) {
      const nextVisible = pickNextHomepageImageIndex(backgroundImages, currentImageIndex);
      if (nextVisible >= 0 && nextVisible !== currentImageIndex) {
        setCurrentImageIndex(nextVisible);
      }
      return;
    }

    const currentImage = backgroundImages[currentImageIndex];
    if (!currentImage) {
      // ✅ Chargement initial : Si pas d'image actuelle, masquer l'écran de chargement
      if (isFirstLoadRef.current) {
        initialImageLoadedRef.current = true;
        setIsInitialImageLoaded(true);
        setTimeout(() => {
          setShowLoadingScreen(false);
        }, 300);
        isFirstLoadRef.current = false;
      }
      return;
    }

    // Charger image actuelle dans layer 0 (layer actif) au montage initial
    // Note: Les changements d'image sont gérés par changeBackgroundImage()
    if (!layer0Src) {
      const isInitialLoad = isFirstLoadRef.current;
      loadImageIntoLayer(currentImage, 0, true, isInitialLoad);
      if (isInitialLoad) {
        isFirstLoadRef.current = false;
      }
    }
  }, [backgroundImages, currentImageIndex]); // ✅ RANDOMISATION : Ajouter currentImageIndex aux dépendances

  // ✅ Phase 7: Préchargement proactif des images (adapté pour rotation aléatoire)
  // ✅ RANDOMISATION : Précharger images aléatoires au lieu de séquentielles
  useEffect(() => {
    const visible = getVisibleHomepageImageIndices(backgroundImages);
    if (!backgroundImages || visible.length <= 1) return;

    const currentImage = backgroundImages[currentImageIndex];
    if (!currentImage) return;

    const preloadRandomImages = async () => {
      const indicesToPreload = new Set();
      const candidates = visible.filter((i) => i !== currentImageIndex);
      const maxPreload = Math.min(3, candidates.length);

      while (indicesToPreload.size < maxPreload && candidates.length > 0) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        indicesToPreload.add(pick);
      }
      
      for (const index of indicesToPreload) {
        const imageToPreload = backgroundImages[index];
        
        if (imageToPreload && !imagePreloadedRef.current.has(index)) {
          try {
            const fullData = typeof imageToPreload === 'object' && imageToPreload.full
              ? imageToPreload.full
              : imageToPreload;
            
            // Précharger dans cache navigateur
            const img = new Image();
            img.src = fullData;
            
            await new Promise((resolve) => {
              img.onload = () => {
                imagePreloadedRef.current.add(index);
                log.debug(`✅ Image ${index} préchargée dans cache navigateur (aléatoire)`);
                resolve();
              };
              img.onerror = () => resolve(); // Ignorer erreurs de préchargement
            });
          } catch (error) {
            // Ignorer erreurs de préchargement
          }
        }
      }
    };

    preloadRandomImages();
  }, [currentImageIndex, backgroundImages]);

  // Rotation automatique toutes les 2 minutes
  useEffect(() => {
    if (getVisibleHomepageImageIndices(backgroundImages).length <= 1) return;

    const rotationInterval = setInterval(() => {
      changeBackgroundImage();
    }, 2 * 60 * 1000);

    return () => clearInterval(rotationInterval);
  }, [backgroundImages]);

  // Échelle pilotée par le nombre de lignes réelles (display) : une même phrase peut
  // faire 2 lignes en base (autosplit ~28 chars) tout en étant « longue » → l’ancien
  // « textLength ≤ 52 ⇒ géant » enflait l’occupation sans raison ; 3 lignes avaient un max trop bas à l’écran large.
  const adjustQuoteSize = useCallback(() => {
    const quoteElement = document.querySelector('.adaptive-quote-text');
    if (!quoteElement) return;

    const lineCount = quoteToRender?.lines?.length ?? 0;
    if (lineCount < 1) return;

    const textLength = (quoteToRender.lines || []).join(' ').trim().length;

    quoteElement.removeAttribute('data-long');
    quoteElement.removeAttribute('data-very-long');

    const veryDense = textLength > 132;
    /** Bloc fins → gras → fins : transitions de graisse créent trop d’air + dernières lignes rognées */
    const bf = quoteToRender.boldFrom ?? 2;
    const bt = quoteToRender.boldTo ?? bf;
    const sandwichBold =
      lineCount >= 4 && bf > 1 && bt < lineCount && bf <= bt;

    const cap = getQuoteFontCapRem(lineCount, sandwichBold);
    /** Un seul `clamp` avec plafond lié au viewport : pas de ResizeObserver ni boucle sur la font-size */
    const capped = (min, pref, ceilingRem) =>
      `clamp(${min}, ${pref}, min(${ceilingRem}rem, ${cap}rem))`;

    /* vmin : un peu lié à la hauteur de viewport pour ne pas garder tout petit sur grands écrans */

    if (textLength > 158) {
      quoteElement.setAttribute('data-very-long', 'true');
      quoteElement.style.fontSize = capped('0.88rem', '1.62vw + 0.36vmin', 1.62);
    } else if (lineCount >= 5 || textLength > 142 || veryDense) {
      quoteElement.setAttribute('data-very-long', 'true');
      quoteElement.style.fontSize = sandwichBold
        ? capped('0.8rem', '1.58vw + 0.32vmin', 1.46)
        : capped('0.92rem', '1.88vw + 0.38vmin', 1.78);
    } else if (textLength > 118) {
      quoteElement.setAttribute('data-long', 'true');
      quoteElement.style.fontSize = capped('1.12rem', '2.5vw + 0.52vmin', 2.35);
    } else if (lineCount >= 4 || textLength > 105) {
      quoteElement.setAttribute('data-long', 'true');
      quoteElement.style.fontSize = capped('1.32rem', '2.68vw + 0.72vmin', 2.92);
    } else if (lineCount >= 3 || textLength > 88) {
      quoteElement.setAttribute('data-long', 'true');
      quoteElement.style.fontSize = capped('1.52rem', '2.85vw + 0.95vmin', 3.45);
    } else if (lineCount === 2) {
      quoteElement.style.fontSize =
        textLength > 78
          ? capped('1.48rem', '3.6vw + 0.55vmin', 3.35)
          : capped('1.72rem', '4.1vw + 0.65vmin', 3.95);
    } else {
      /* 1 ligne : impact maximum */
      quoteElement.style.fontSize = capped('1.95rem', '4.8vw + 0.85vmin', 4.35);
    }

    /** Libère de la place verticale : plafond 5 lignes — padding généreux pour ombre / descendantes */
    if (lineCount >= 5) {
      /** Léger air au-dessus : évite l’effet « collée au haut » / premières lettres trop près du bord */
      quoteElement.style.paddingTop = 'max(6px, 0.08em)';
      quoteElement.style.paddingBottom = sandwichBold
        ? 'max(22px, 0.82em)'
        : 'max(20px, 0.78em)';
    } else if (lineCount >= 4) {
      quoteElement.style.paddingTop = 'max(4px, 0.06em)';
      quoteElement.style.paddingBottom = 'max(6px, 0.55rem)';
    } else {
      quoteElement.style.removeProperty('padding-top');
      quoteElement.style.removeProperty('padding-bottom');
    }
  }, [quoteToRender?.lines]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      adjustQuoteSize();
    }, 100);
    return () => window.clearTimeout(timer);
  }, [displayQuote, quoteLoading, quoteToRender, adjustQuoteSize]);

  /**
   * Repartir du haut à chaque citation ; le centrage vertical est géré par le conteneur interne
   * (`min-h` + `justify-center`), pas par scrollIntoView.
   */
  useEffect(() => {
    if (quoteLoading) return;
    const mainEl = homeQuoteMainRef.current;
    if (!mainEl) return;
    mainEl.scrollTop = 0;
  }, [currentQuote?.id, quoteLoading, quoteToRender?.lines]);

  /**
   * Citation en 5 lignes (hauteur max) : après `adjustQuoteSize`, si le bas du H1 dépasse encore
   * le scrollport (marges négatives / ombre / scrollHeight avec flex), on corrige par petits timeouts.
   */
  useEffect(() => {
    if (quoteLoading || !quoteToRender?.lines?.length) return;
    if (quoteToRender.lines.length !== 5) return;

    const mainEl = homeQuoteMainRef.current;
    if (!mainEl) return;

    const ensureBottomGap = () => {
      const q = mainEl.querySelector('.adaptive-quote-text');
      if (!q) return;
      const pad = 16;
      const mr = mainEl.getBoundingClientRect();
      const qr = q.getBoundingClientRect();
      if (qr.bottom > mr.bottom - pad) {
        mainEl.scrollTop += qr.bottom - (mr.bottom - pad);
      }
    };

    const t1 = window.setTimeout(ensureBottomGap, 140);
    const t2 = window.setTimeout(ensureBottomGap, 280);
    const t3 = window.setTimeout(ensureBottomGap, 420);
    let rafOuter = 0;
    let rafInner = 0;
    const t0 = window.setTimeout(() => {
      rafOuter = requestAnimationFrame(() => {
        rafInner = requestAnimationFrame(ensureBottomGap);
      });
    }, 0);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      if (rafOuter) cancelAnimationFrame(rafOuter);
      if (rafInner) cancelAnimationFrame(rafInner);
    };
  }, [currentQuote?.id, quoteLoading, quoteToRender]);

  // Une seule action par « cycle » : même throttle que les citations pour éviter
  // plusieurs fonds différents pour une même phrase (sensation de flash hors-sujet).
  const handleInteraction = () => {
    const quoteWillAdvance = tryAdvanceQuoteFromInteraction();
    if (quoteWillAdvance) {
      changeBackgroundImage();
    }
  };

  // Fonction pour naviguer vers un autre onglet avec transition
  const navigateToTab = (tabId) => {
    // Transition fluide sans opacité
    setTimeout(() => {
      setActiveTab(tabId);
    }, 200);
  };

  // ✅ Masquer la scrollbar sur la page d'accueil
  useEffect(() => {
    // Ajouter une classe au body pour masquer la scrollbar
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Restaurer le scroll au démontage
      document.body.style.overflow = '';
    };
  }, []);

  // ✅ Keyboard navigation support - Press 'D' to navigate to Dashboard
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Check if 'D' key is pressed (case-insensitive)
      if (event.key === 'd' || event.key === 'D') {
        // Prevent default behavior
        event.preventDefault();
        // Navigate to Dashboard
        setActiveTab('dashboard');
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyPress);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [setActiveTab]);

  // ✅ Mouse wheel navigation support - Désactivé, géré par HomePageScrollTransition
  // La navigation par scroll est maintenant gérée par le composant HomePageScrollTransition
  // qui offre une transition fluide et animée entre HomePage et Dashboard

  // ✅ Chargement initial : Déterminer si on doit afficher l'écran de chargement
  // Ne s'affiche que si on est vraiment sur home ET que le chargement est en cours
  const shouldShowLoading =
    activeTab === 'home' && (isLoading || showLoadingScreen || !introPlaybackDone);

  // ✅ Screen reader announcement state
  const [screenReaderAnnouncement, setScreenReaderAnnouncement] = useState('');

  // ✅ N'afficher la scène Spline que sur les écrans larges (évite les warnings WebGL taille 0)
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = (e) => setIsLargeScreen(e.matches);
    setIsLargeScreen(mq.matches);
    mq.addEventListener('change', update);
    return () => {
      mq.removeEventListener('change', update);
    };
  }, []);

  // ✅ Announce navigation to screen readers when swipe is detected
  useEffect(() => {
    if (swipeState.isSwipping && swipeState.direction === 'down') {
      if (isSwipeValid) {
        setScreenReaderAnnouncement('Swipe threshold reached. Release to navigate to Dashboard.');
      } else {
        setScreenReaderAnnouncement(`Swipe in progress. ${Math.round(swipeProgress * 100)}% complete.`);
      }
    } else {
      setScreenReaderAnnouncement('');
    }
  }, [swipeState.isSwipping, swipeState.direction, isSwipeValid, swipeProgress]);

  return (
    <div 
      className="relative h-screen overflow-hidden bg-gradient-to-br from-slate-900/20 via-slate-800/10 to-slate-900/20 flex flex-col"
      onClick={handleInteraction}
      style={{ minHeight: '100vh', maxHeight: '100vh' }}
      role="main"
      aria-label="Home page"
    >
      {/* ✅ Screen reader announcements - aria-live region */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {screenReaderAnnouncement}
      </div>

      {/* ✅ Screen reader instructions - visible alternative text */}
      <div className="sr-only">
        <h1>Momentum - Home Page</h1>
        <p>
          Welcome to Momentum. You can navigate to the Dashboard by swiping down on this page, 
          scrolling down with your mouse wheel, or by pressing the 'D' key on your keyboard. 
          Alternatively, use the navigation buttons at the top of the page to access different 
          sections of the application.
        </p>
      </div>

      {/* ✅ Navigation Header - Logo et boutons de navigation */}
      {!shouldShowLoading && <NavigationHeader />}

      {/* ✅ Chargement initial : Écran de chargement élégant et professionnel */}
      {/* Ne s'affiche que lors du premier chargement de l'app, pas lors de la navigation */}
      {shouldShowLoading && (
        <MomentumWelcomeGate
          onUnlock={onUnlockHomeWelcome}
          title={t('home.loading.title')}
          subtitle={t('home.loading.subtitle')}
          unlockLabel={t('home.loading.unlock')}
          unlockHint={t('home.loading.unlockHint')}
          syncMessage={t('home.loading.sync')}
          isDataLoading={isLoading || showLoadingScreen}
        />
      )}

      {/* ✅ Phase 7: Double buffering — masqué pendant l’intro pour ne pas concurrencer le Player (GPU / peinture). */}
      {!shouldShowLoading && backgroundImages.length > 0 && layer0Src && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${layer0Src})`,
            opacity: layer0Opacity,
            filter: 'contrast(1.1) brightness(0.9)',
            transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: activeLayer === 0 ? 1 : 0,
            willChange: 'opacity', // Optimisation GPU
          }}
        >
          {/* Overlay avec effet de grain */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
              mixBlendMode: 'overlay'
            }}
          />
        </div>
      )}

      {/* ✅ Phase 7: Double buffering - Layer 1 */}
      {!shouldShowLoading && backgroundImages.length > 0 && layer1Src && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${layer1Src})`,
            opacity: layer1Opacity,
            filter: 'contrast(1.1) brightness(0.9)',
            transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: activeLayer === 1 ? 1 : 0,
            willChange: 'opacity', // Optimisation GPU
          }}
        >
          {/* Overlay avec effet de grain */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
              mixBlendMode: 'overlay'
            }}
          />
        </div>
      )}

      {/* Robot Spline — pas pendant l’écran de chargement (WebGL + Remotion = saccades). */}
      {activeTab === 'home' && isLargeScreen && !shouldShowLoading && (
        <div className="fixed bottom-0 right-[8rem] xl:right-[16rem] w-72 h-72 xl:w-96 xl:h-96 z-50 pointer-events-none">
          <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full pointer-events-auto"
          />
        </div>
      )}

      {/* ✅ Chargement initial : Masquer le contenu principal pendant le chargement */}
      {!shouldShowLoading && (
        <>
      {/* ✅ Swipe Indicator - Visual feedback for swipe gestures */}
      <SwipeIndicator 
        progress={swipeProgress}
        isValid={isSwipeValid}
        visible={swipeState.isSwipping && swipeState.direction === 'down'}
      />

      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col gap-5 md:gap-6">
      {/* Zone citation ; le CTA est dans « À propos ». */}
      {(() => {
        const lc = quoteToRender?.lines?.length ?? 0;
        /** Phrase en 5 lignes (plafond accueil) : coussin bas pour le scroll / ombre */
        const isFiveLines = !quoteLoading && lc === 5;
        const liftTallQuote = !quoteLoading && lc >= 5;
        const tallScrollableQuote = liftTallQuote;
        const mainPt = liftTallQuote
          ? 'pt-[max(0.12rem,calc(env(safe-area-inset-top,0px)+0.2rem))] sm:pt-[max(0.2rem,calc(env(safe-area-inset-top,0px)+0.3rem))]'
          : 'pt-[max(0rem,calc(env(safe-area-inset-top,0px)+0.2rem))] sm:pt-1 md:pt-2';
        const mainPb = isFiveLines
          ? 'pb-[max(3.15rem,min(13vh,6.75rem))] scroll-pb-[max(2.6rem,min(20vh,6.75rem))] md:pb-[max(3.5rem,min(14vh,7.5rem))]'
          : 'pb-[max(1.5rem,7vh)] scroll-pb-[max(1.35rem,min(14vh,4rem))] md:pb-[max(1.85rem,min(11vh,4.5rem))]';
        const mainScrollChrome = tallScrollableQuote
          ? '[scrollbar-width:thin] [-ms-overflow-style:auto] [scrollbar-color:rgba(255,255,255,0.45)_rgba(0,0,0,0.15)]'
          : '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';
        return (
      <main
        ref={homeQuoteMainRef}
        className={`relative z-[1] flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain px-4 ${mainPb} ${mainPt} md:px-8 ${mainScrollChrome}`}
      >
        {/*
          Centrage uniquement si la citation est plus courte que la zone : deux flex-1 (min-h-0) absorbent
          l’espace libre. `justify-center` sur un bloc min-h=max(100%, max-content) centrait le h1 dans
          TOUTE la hauteur du texte : quand ça dépassait le <main>, scrollTop=0 montrait le « haut » du bloc
          (vide) et coupait les dernières lignes — donnant l’impression qu’un module du bas rognait le texte.
        */}
        <div className="max-w-2xl flex w-full shrink-0 min-w-0 flex-col isolate box-border overflow-visible pb-[max(0.5rem,0.35cm)] pt-0 min-h-[max(100%,max-content)]">
          <div className="min-h-0 flex-1 shrink" aria-hidden="true" />
          {/* Citations dynamiques — zone étendue verticalement pour ne pas rogner les glyphes */}
          <h1
            className="adaptive-quote-text font-light mb-0"
            style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              gap: 0,
              lineHeight: 1.32,
            }}
          >
            {quoteLoading ? (
              <>
                <span className="text-white opacity-50">Chargement...</span>
              </>
            ) : quoteToRender && quoteToRender.lines && quoteToRender.lines.length > 0 ? (
              (() => {
                const linesArr = quoteToRender.lines;
                const lc = linesArr.length;
                const bf0 = quoteToRender.boldFrom ?? 2;
                const bt0 = quoteToRender.boldTo ?? bf0;
                const lineBold = (i) => {
                  const ob = i + 1;
                  return ob >= bf0 && ob <= bt0;
                };
                const sandwichBold =
                  lc >= 4 && bf0 > 1 && bt0 < lc && bf0 <= bt0;
                const tightStack = lc >= 5 || sandwichBold;
                const ultraTight = lc >= 5 || sandwichBold;
                return (
                  <div
                    key={currentQuote?.id ?? linesArr.join('|')}
                    className={`flex animate-quote-fade-in flex-col [animation-duration:0.45s] ${
                      ultraTight ? '[row-gap:0.05em]' : tightStack ? '[row-gap:0.1em]' : '[row-gap:0.2em]'
                    }`}
                  >
                    {linesArr.map((line, index) => {
                      const isBold = lineBold(index);
                      const weightFlip =
                        index > 0 && isBold !== lineBold(index - 1);
                      return (
                        <span
                          key={index}
                          className="block overflow-visible py-0 text-white"
                          style={{
                            fontWeight: isBold ? 560 : 330,
                            lineHeight: ultraTight ? 1.16 : sandwichBold ? 1.18 : tightStack ? 1.22 : 1.28,
                            letterSpacing: ultraTight || sandwichBold ? '-0.01em' : undefined,
                            paddingTop:
                              index === 0
                                ? ultraTight || sandwichBold
                                  ? '0.1em'
                                  : tightStack
                                    ? '0.085em'
                                    : '0.06em'
                                : undefined,
                            marginTop:
                              weightFlip === true
                                ? ultraTight
                                  ? lc >= 5
                                    ? '-0.04em'
                                    : '-0.12em'
                                  : sandwichBold
                                    ? lc >= 5
                                      ? '-0.04em'
                                      : '-0.11em'
                                    : tightStack
                                      ? lc >= 5
                                        ? '-0.03em'
                                        : '-0.078em'
                                      : '-0.045em'
                                : undefined,
                            paddingBottom:
                              index === linesArr.length - 1
                                ? lc === 5 && sandwichBold
                                  ? '0.16em'
                                  : ultraTight || sandwichBold
                                    ? '0.12em'
                                    : tightStack
                                      ? '0.1em'
                                      : '0.08em'
                                : undefined,
                          }}
                        >
                          {line}
                        </span>
                      );
                    })}
                  </div>
                );
              })()
            ) : (
              <>
                <span className="text-white">{t('home.title.line1')}</span>
                <span className="text-white font-bold">{t('home.title.line2')}</span>
                <span className="text-white">{t('home.title.line3')}</span>
              </>
            )}
          </h1>

          <div className="min-h-0 flex-1 shrink" aria-hidden="true" />
        </div>
      </main>
        );
      })()}

      {/* Footer : z-0 pour rester sous la zone citation (main z-[1]) si jamais le layout déborde d’un px. */}
      <footer className="relative z-0 grid shrink-0 grid-cols-[minmax(0,1fr)_auto] md:flex md:flex-row md:justify-between md:items-end items-end gap-3 md:gap-8 px-4 pb-6 pt-0 md:px-8 md:pb-12 flex-shrink-0" style={{ minHeight: 'fit-content' }}>
        {/* Section À propos améliorée */}
        <div className="self-start flex min-h-0 w-full md:max-w-2xl flex-col bg-black/10 backdrop-blur-3xl rounded-2xl border border-white/5 px-4 py-3 shadow-2xl max-h-[40vh] overflow-auto md:max-h-none md:overflow-visible md:rounded-3xl md:px-6 md:py-4">
          <div className="flex items-center mb-3 md:mb-3.5">
            <h3 className="text-white font-bold text-sm tracking-wider mr-4" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{t('home.about.title')}</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-white/20 via-white/40 to-transparent"></div>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-white text-sm md:text-sm font-medium leading-snug md:leading-relaxed" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
              {t('home.about.description')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-xs">
              <div>
                <h4 className="font-semibold text-white mb-1.5" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{t('home.about.features.title')}</h4>
                <ul className="space-y-1 text-white/90" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>
                  <li>{t('home.about.features.items.bodyTracking')}</li>
                  <li>{t('home.about.features.items.programs')}</li>
                  <li>{t('home.about.features.items.predictions')}</li>
                  <li>{t('home.about.features.items.analyses')}</li>
                  <li>{t('home.about.features.items.code')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1.5" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{t('home.about.data.title')}</h4>
                <ul className="space-y-1 text-white/90" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>
                  <li>{t('home.about.data.items.photos')}</li>
                  <li>{t('home.about.data.items.metrics')}</li>
                  <li>{t('home.about.data.items.history')}</li>
                  <li>{t('home.about.data.items.statistics')}</li>
                </ul>
              </div>
            </div>
            <div className="flex justify-center border-t border-white/10 pt-2 sm:justify-start" data-swipe-ignore>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToTab(isAuthenticated ? 'today' : 'auth');
                }}
                className="bg-white/8 backdrop-blur-xl border border-white/12 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[11px] md:text-xs font-medium transition-all duration-300 hover:bg-white/18 hover:border-white/25 hover:shadow-lg hover:shadow-white/10 max-w-full text-center leading-snug"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.65)' }}
                aria-label={isAuthenticated ? 'Navigate to Today section' : 'Get started with Momentum'}
              >
                {isAuthenticated ? 'Accéder à l’onglet Aujourd’hui' : t('home.cta')}
              </button>
            </div>
          </div>
        </div>

        {/* Mots-clés simplifiés - Collés tout à droite */}
        <div className="w-auto text-right flex flex-col items-end md:items-end flex-shrink-0" style={{ minHeight: 'fit-content' }}>
          <div className="text-white text-xs md:text-base font-semibold space-y-0.5 md:space-y-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
            <div>{t('home.keywords.fitness')}</div>
            <div>{t('home.keywords.performance')}</div>
            <div>{t('home.keywords.progress')}</div>
            <div>{t('home.keywords.intelligence')}</div>
            <div>{t('home.keywords.startTransformation')}</div>
            <div>{userLocation}</div>
          </div>
          
          {/* Sélecteur de langue en dessous de Localisation - Dimensions fixes pour éviter les décalages */}
          <div className="mt-3 md:mt-2 w-[44px] h-[44px] flex items-center justify-end flex-shrink-0" data-swipe-ignore>
            <LanguageSelector variant="compact" />
          </div>
        </div>
      </footer>
      </div>
      </>
      )}

    </div>
  );
};

export default HomePage;
