import React, { useState, useEffect, useRef } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { useHomepageImages } from '../hooks/useHomepageImages';
import { preloadAdjacentImages, preloadImage } from '../utils/imageLazyLoader';
import logger from '../utils/logger';
import LanguageSelector from './ui/LanguageSelector';
import { useTranslation } from '../utils/translations';
import { useLanguage } from '../context/LanguageContext';

const log = logger.component('HomePage');

const HomePage = () => {
  const { setActiveTab } = useWorkout();
  const { isAuthenticated } = useAuth();
  const t = useTranslation();
  const { language } = useLanguage();
  const { backgroundImages, isLoading, systemHealth } = useHomepageImages();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userLocation, setUserLocation] = useState('');
  
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

  // Fonction pour changer l'image de fond lors des interactions
  const handleInteraction = () => {
    changeBackgroundImage();
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

  // ✅ Chargement initial : Déterminer si on doit afficher l'écran de chargement
  const shouldShowLoading = isLoading || showLoadingScreen;

  return (
    <div 
      className="relative h-screen overflow-hidden bg-gradient-to-br from-slate-900/20 via-slate-800/10 to-slate-900/20 flex flex-col"
      onClick={handleInteraction}
      style={{ minHeight: '100vh', maxHeight: '100vh' }}
    >
      {/* ✅ Chargement initial : Écran de chargement élégant et professionnel */}
      {shouldShowLoading && (
        <div 
          className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-[100] flex items-center justify-center transition-opacity duration-500"
          style={{
            opacity: shouldShowLoading ? 1 : 0,
            pointerEvents: shouldShowLoading ? 'auto' : 'none',
          }}
        >
          <div className="text-center">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <img 
                src="/logo.png" 
                alt="Momentum Logo" 
                className="w-32 h-32 rounded-3xl opacity-95 drop-shadow-2xl animate-pulse"
              />
            </div>
            
            {/* Spinner moderne */}
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-4 border-transparent border-r-white/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            
            {/* Texte de chargement */}
            <p className="text-white text-lg font-medium mb-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              {t('home.loading.title')}
            </p>
            <p className="text-white/70 text-sm" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>
              {t('home.loading.subtitle')}
            </p>
          </div>
        </div>
      )}

      {/* ✅ Phase 7: Double buffering - Layer 0 */}
      {backgroundImages.length > 0 && layer0Src && (
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
      {backgroundImages.length > 0 && layer1Src && (
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

      {/* ✅ Chargement initial : Masquer le contenu principal pendant le chargement */}
      {!shouldShowLoading && (
        <>
      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-8 flex-shrink-0">
        {/* Logo et informations */}
        <div className="flex flex-col items-center space-y-0.5 -ml-8 mr-8 -mt-24">
          <img 
            src="/logo.png" 
            alt="Momentum Logo" 
            className="w-24 h-24 rounded-2xl opacity-95 drop-shadow-2xl"
            style={{ transform: 'translateY(55px)' }}
          />
        </div>

        {/* Navigation en une seule ligne – version simplifiée */}
        <nav className="flex items-center space-x-8">
          <div className="flex space-x-2 text-white text-base font-medium">
            {/* Accueil */}
            <button 
              onClick={() => navigateToTab('home')}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            >
              {t('nav.home')}
            </button>
            {/* Sport regroupe tous les onglets d'entraînement (Today, Saisie, Programme, etc.) */}
            <button 
              onClick={() => navigateToTab('today')}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            >
              {t('nav.sport')}
            </button>
            {/* QuietQuest – Quêtes */}
            <button 
              onClick={() => navigateToTab('quests')}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            >
              {t('nav.quests')}
            </button>
            {/* Apprentissage */}
            <button 
              onClick={() => navigateToTab('apprentissage')}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            >
              {t('nav.apprentissage')}
            </button>
            {/* Livres */}
            <button 
              onClick={() => navigateToTab('books')}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            >
              {t('nav.books')}
            </button>
            {/* Paramètres */}
            <button 
              onClick={() => navigateToTab('settings')}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            >
              {t('nav.settings')}
            </button>
          </div>
        </nav>
      </header>

      {/* Contenu principal */}
      <main className="relative z-10 flex-1 flex items-center justify-start px-8 pt-20 min-h-0 overflow-hidden">
        <div className="max-w-2xl flex-shrink-0">
          {/* Titre principal - Proportions ajustées */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-[1.1] mb-8" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)', minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: '0.25rem' }}>
            <span className="text-white">{t('home.title.line1')}</span>
            <span className="text-white font-bold">{t('home.title.line2')}</span>
            <span className="text-white">{t('home.title.line3')}</span>
          </h1>

          {/* Bouton CTA - Texte non coupé */}
          <div className="relative flex-shrink-0">
            <button 
              onClick={() => navigateToTab(isAuthenticated ? 'today' : 'auth')}
              className="bg-white/8 backdrop-blur-2xl border border-white/15 text-white px-8 py-4 rounded-2xl text-base md:text-lg font-semibold transition-all duration-500 hover:bg-white/20 hover:border-white/30 hover:shadow-2xl hover:shadow-white/20 hover:scale-105 hover:backdrop-blur-3xl whitespace-nowrap overflow-visible"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
            >
              {isAuthenticated ? 'Accéder à l’onglet Aujourd’hui' : t('home.cta')}
            </button>
            
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex justify-between items-end p-8 pb-12 flex-shrink-0" style={{ minHeight: 'fit-content' }}>
        {/* Section À propos améliorée */}
        <div className="max-w-2xl bg-black/10 backdrop-blur-3xl rounded-3xl p-10 border border-white/5 shadow-2xl">
          <div className="flex items-center mb-6">
            <h3 className="text-white font-bold text-sm tracking-wider mr-4" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{t('home.about.title')}</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-white/20 via-white/40 to-transparent"></div>
          </div>
          <div className="space-y-4">
            <p className="text-white text-sm font-medium leading-relaxed" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
              {t('home.about.description')}
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs">
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
        <div className="text-right flex flex-col items-end flex-shrink-0" style={{ minHeight: 'fit-content' }}>
          <div className="text-white text-base font-semibold space-y-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
            <div>{t('home.keywords.fitness')}</div>
            <div>{t('home.keywords.performance')}</div>
            <div>{t('home.keywords.progress')}</div>
            <div>{t('home.keywords.intelligence')}</div>
            <div>{t('home.keywords.startTransformation')}</div>
            <div>{userLocation}</div>
          </div>
          
          {/* Sélecteur de langue en dessous de Localisation - Dimensions fixes pour éviter les décalages */}
          <div className="mt-2 w-[44px] h-[44px] flex items-center justify-end flex-shrink-0">
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
