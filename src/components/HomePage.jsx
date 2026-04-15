import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { useAppLock } from '../context/AppLockContext';
import { useHomepageImages } from '../hooks/useHomepageImages';
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

const HomePage = () => {
  const { setActiveTab, activeTab } = useWorkout();
  const { isAuthenticated } = useAuth();
  const { lockNow, lockReady } = useAppLock();
  const t = useTranslation();
  // ✅ Récupérer la langue depuis useTranslation pour éviter le double appel de useLanguage
  // useTranslation utilise déjà useLanguage en interne
  const language = t.language || 'fr'; // Fallback vers 'fr' si non disponible
  const { backgroundImages, isLoading, systemHealth } = useHomepageImages();
  const { displayQuote, loading: quoteLoading, handleInteraction: handleQuoteInteraction } = useQuoteDisplay();
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
    if (backgroundImages.length <= 1) return;
    
    // ✅ RANDOMISATION : Choisir index aléatoire, éviter l'actuel
    let nextIndex;
    if (backgroundImages.length === 2) {
      // Si seulement 2 images, alterner (évite boucle infinie)
      nextIndex = (currentImageIndex + 1) % backgroundImages.length;
    } else {
      // Sinon, choisir aléatoirement mais éviter l'actuel
      do {
        nextIndex = Math.floor(Math.random() * backgroundImages.length);
      } while (nextIndex === currentImageIndex && backgroundImages.length > 1);
    }
    
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

    // ✅ RANDOMISATION : Définir index initial aléatoire une seule fois
    if (!initialIndexSetRef.current && backgroundImages.length > 0) {
      const randomIndex = Math.floor(Math.random() * backgroundImages.length);
      setCurrentImageIndex(randomIndex);
      initialIndexSetRef.current = true;
      log.debug(`🎲 Index initial aléatoire: ${randomIndex}/${backgroundImages.length}`);
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
    if (!backgroundImages || backgroundImages.length <= 1) return;

    const currentImage = backgroundImages[currentImageIndex];
    if (!currentImage) return;

    // ✅ RANDOMISATION : Précharger 3 images aléatoires (pas l'actuelle)
    const preloadRandomImages = async () => {
      const indicesToPreload = new Set();
      const maxPreload = Math.min(3, backgroundImages.length - 1);
      
      // Générer indices aléatoires uniques (pas l'actuel)
      while (indicesToPreload.size < maxPreload) {
        const randomIndex = Math.floor(Math.random() * backgroundImages.length);
        if (randomIndex !== currentImageIndex) {
          indicesToPreload.add(randomIndex);
        }
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
    if (backgroundImages.length <= 1) return;

    const rotationInterval = setInterval(() => {
      changeBackgroundImage();
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(rotationInterval);
  }, [backgroundImages.length]);

  // Fonction pour ajuster la taille de police des citations longues
  const adjustQuoteSize = () => {
    const quoteElement = document.querySelector('.adaptive-quote-text');
    if (!quoteElement) return;

    const textContent = quoteElement.textContent || '';
    const textLength = textContent.length;
    
    // Supprimer les attributs précédents
    quoteElement.removeAttribute('data-long');
    quoteElement.removeAttribute('data-very-long');
    
    // Ajuster selon la longueur
    if (textLength > 120) {
      quoteElement.setAttribute('data-very-long', 'true');
      quoteElement.style.fontSize = 'clamp(1rem, 2.5vw, 2rem)';
    } else if (textLength > 80) {
      quoteElement.setAttribute('data-long', 'true');
      quoteElement.style.fontSize = 'clamp(1.25rem, 3vw, 2.5rem)';
    } else if (textLength > 50) {
      quoteElement.style.fontSize = 'clamp(1.5rem, 4vw, 3.5rem)';
    } else {
      quoteElement.style.fontSize = 'clamp(2rem, 6vw, 5rem)';
    }
  };

  // Ajuster la taille quand la citation change
  useEffect(() => {
    const timer = setTimeout(() => {
      adjustQuoteSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [displayQuote, quoteLoading]);

  // Fonction pour changer l'image de fond ET la citation lors des interactions
  const handleInteraction = () => {
    changeBackgroundImage();
    handleQuoteInteraction(); // Change aussi la citation
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

      {/* Contenu principal */}
      <main className="relative z-10 flex-1 flex flex-col md:flex-row items-start md:items-center justify-start px-4 md:px-8 pt-7 md:pt-12 pb-6 md:pb-12 gap-3 md:gap-0 min-h-0 overflow-hidden">
        <div className="max-w-2xl flex-shrink-0 w-full">
          {/* Titre principal - Citations dynamiques (lignes variables + gras paramétrable) */}
          <h1
            key={displayQuote ? displayQuote.lines.join('|') : 'default'}
            className="adaptive-quote-text font-light mb-10 animate-quote-fade-in"
            style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              gap: '0.25rem',
              animation: 'quoteFadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
              lineHeight: '1.2',
              paddingTop: '0.1em'
            }}
          >
            {quoteLoading ? (
              <>
                <span className="text-white opacity-50">Chargement...</span>
              </>
            ) : displayQuote && displayQuote.lines && displayQuote.lines.length > 0 ? (
              displayQuote.lines.map((line, index) => {
                const oneBased = index + 1;
                const isBold = oneBased >= (displayQuote.boldFrom || 2) && oneBased <= (displayQuote.boldTo || 2);
                return (
                  <span key={index} className={isBold ? 'text-white font-bold' : 'text-white'}>
                    {line}
                  </span>
                );
              })
            ) : (
              <>
                <span className="text-white">{t('home.title.line1')}</span>
                <span className="text-white font-bold">{t('home.title.line2')}</span>
                <span className="text-white">{t('home.title.line3')}</span>
              </>
            )}
          </h1>

          {/* Bouton CTA - Texte non coupé */}
          <div className="relative flex-shrink-0 mb-2 md:mb-8">
            <button 
              data-swipe-ignore
              onClick={() => navigateToTab(isAuthenticated ? 'today' : 'auth')}
              className="bg-white/8 backdrop-blur-2xl border border-white/15 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl text-sm md:text-lg font-semibold transition-all duration-500 hover:bg-white/20 hover:border-white/30 hover:shadow-2xl hover:shadow-white/20 hover:scale-105 hover:backdrop-blur-3xl whitespace-normal md:whitespace-nowrap overflow-visible"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
              aria-label={isAuthenticated ? 'Navigate to Today section' : 'Get started with Momentum'}
            >
              {isAuthenticated ? 'Accéder à l’onglet Aujourd’hui' : t('home.cta')}
            </button>
            
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-auto grid grid-cols-[minmax(0,1fr)_auto] md:flex md:flex-row md:justify-between md:items-end items-end gap-3 md:gap-8 px-4 md:p-8 pb-6 md:pb-12 flex-shrink-0" style={{ minHeight: 'fit-content' }}>
        {/* Section À propos améliorée */}
        <div className="w-full md:max-w-2xl bg-black/10 backdrop-blur-3xl rounded-3xl p-5 md:p-10 border border-white/5 shadow-2xl max-h-[40vh] overflow-auto md:max-h-none md:overflow-visible">
          <div className="flex items-center mb-6">
            <h3 className="text-white font-bold text-sm tracking-wider mr-4" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{t('home.about.title')}</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-white/20 via-white/40 to-transparent"></div>
          </div>
          <div className="space-y-4">
            <p className="text-white text-sm md:text-sm font-medium leading-relaxed" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
              {t('home.about.description')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs md:text-xs">
              <div>
                <h4 className="font-semibold text-white mb-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{t('home.about.features.title')}</h4>
                <ul className="space-y-1 text-white/90" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>
                  <li>{t('home.about.features.items.bodyTracking')}</li>
                  <li>{t('home.about.features.items.programs')}</li>
                  <li>{t('home.about.features.items.predictions')}</li>
                  <li>{t('home.about.features.items.analyses')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{t('home.about.data.title')}</h4>
                <ul className="space-y-1 text-white/90" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>
                  <li>{t('home.about.data.items.photos')}</li>
                  <li>{t('home.about.data.items.metrics')}</li>
                  <li>{t('home.about.data.items.history')}</li>
                  <li>{t('home.about.data.items.statistics')}</li>
                </ul>
              </div>
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
      </>
      )}

    </div>
  );
};

export default HomePage;
