import React, { useState, useEffect, useRef } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useHomepageImages } from '../hooks/useHomepageImages';
import { preloadAdjacentImages, preloadImage } from '../utils/imageLazyLoader';
import logger from '../utils/logger';

const log = logger.component('HomePage');

const HomePage = () => {
  const { setActiveTab } = useWorkout();
  const { backgroundImages, isLoading, systemHealth } = useHomepageImages();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userLocation, setUserLocation] = useState('Localisation...');
  
  // ✅ Phase 7: Double buffering pour transitions ultra-fluides
  const [activeLayer, setActiveLayer] = useState(0); // 0 ou 1
  const [layer0Src, setLayer0Src] = useState(null);
  const [layer1Src, setLayer1Src] = useState(null);
  const [layer0Opacity, setLayer0Opacity] = useState(1);
  const [layer1Opacity, setLayer1Opacity] = useState(0);
  const [layer0Loaded, setLayer0Loaded] = useState(false);
  const [layer1Loaded, setLayer1Loaded] = useState(false);
  
  const imagePreloadedRef = useRef(new Set()); // Images déjà préchargées
  const loadingImageRef = useRef(null); // Référence image en cours de chargement

  // ✅ FIX: Géolocalisation uniquement après interaction utilisateur (conformité navigateur)
  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setUserLocation('Géolocalisation non supportée');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Utiliser une API de géocodage inverse pour obtenir le nom de la ville
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`)
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
        setUserLocation('Position non disponible');
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
  const loadImageIntoLayer = async (imageData, layerIndex, useThumbnailFirst = true) => {
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
        } else {
          setLayer1Src(thumbnail);
          setLayer1Loaded(false);
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
      return null;
    }
  };

  // ✅ Phase 7: Fonction pour changer l'image avec double buffering
  const changeBackgroundImage = async () => {
    if (backgroundImages.length <= 1) return;
    
    const nextIndex = (currentImageIndex + 1) % backgroundImages.length;
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
  useEffect(() => {
    if (!backgroundImages || backgroundImages.length === 0) {
      setLayer0Src(null);
      setLayer1Src(null);
      setLayer0Loaded(false);
      setLayer1Loaded(false);
      return;
    }

    const currentImage = backgroundImages[currentImageIndex];
    if (!currentImage) return;

    // Charger image actuelle dans layer 0 (layer actif) au montage initial
    // Note: Les changements d'image sont gérés par changeBackgroundImage()
    if (!layer0Src) {
      loadImageIntoLayer(currentImage, 0, true);
    }
  }, [backgroundImages]); // Se déclenche quand images changent (montage initial)

  // ✅ Phase 7: Préchargement proactif des images suivantes
  useEffect(() => {
    if (!backgroundImages || backgroundImages.length <= 1) return;

    const currentImage = backgroundImages[currentImageIndex];
    if (!currentImage) return;

    // Précharger les 3 images suivantes dans le cache navigateur
    const preloadNextImages = async () => {
      for (let i = 1; i <= 3; i++) {
        const nextIndex = (currentImageIndex + i) % backgroundImages.length;
        const nextImage = backgroundImages[nextIndex];
        
        if (nextImage && !imagePreloadedRef.current.has(nextIndex)) {
          try {
            const fullData = typeof nextImage === 'object' && nextImage.full
              ? nextImage.full
              : nextImage;
            
            // Précharger dans cache navigateur
            const img = new Image();
            img.src = fullData;
            
            await new Promise((resolve) => {
              img.onload = () => {
                imagePreloadedRef.current.add(nextIndex);
                log.debug(`✅ Image ${nextIndex} préchargée dans cache navigateur`);
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

    preloadNextImages();
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

  return (
    <div 
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900/20 via-slate-800/10 to-slate-900/20"
      onClick={handleInteraction}
    >
      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-3xl z-50 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p>Chargement des images...</p>
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

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-8">
        {/* Logo et informations */}
        <div className="flex flex-col items-center space-y-0.5 -ml-8 mr-8 -mt-24">
          <img 
            src="/logo.png" 
            alt="Momentum Logo" 
            className="w-24 h-24 rounded-2xl opacity-95 drop-shadow-2xl"
            style={{ transform: 'translateY(55px)' }}
          />
        </div>

        {/* Navigation en une seule ligne */}
        <nav className="flex items-center space-x-8">
          <div className="flex space-x-2 text-white text-base font-medium">
            <button 
              onClick={() => navigateToTab('today')}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            >
              Aujourd'hui
            </button>
            <button 
              onClick={() => navigateToTab('data-entry')}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            >
              Saisie
            </button>
            <button 
              onClick={() => navigateToTab('program')}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            >
              Programme
            </button>
            <button 
              onClick={() => navigateToTab('exercises')}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            >
              Exercices
            </button>
            <button 
              onClick={() => navigateToTab('progress')}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            >
              Suivi Corporel
            </button>
            <button 
              onClick={() => navigateToTab('endurance')}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            >
              Endurance
            </button>
            <button 
              onClick={() => navigateToTab('calendar')}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            >
              Calendrier
            </button>
            <button 
              onClick={() => navigateToTab('history')}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            >
              Historique
            </button>
            <button 
              onClick={() => navigateToTab('charts')}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            >
              Graphiques
            </button>
            <button 
              onClick={() => navigateToTab('stats')}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            >
              Statistiques
            </button>
            <button 
              onClick={() => navigateToTab('predictions')}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            >
              Prédictions
            </button>
            <button 
              onClick={() => navigateToTab('smart-balancing')}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            >
              Équilibrage IA
            </button>
            <button 
              onClick={() => navigateToTab('garmin')}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            >
              Garmin
            </button>
            <button 
              onClick={() => navigateToTab('settings')}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            >
              Paramètres
            </button>
          </div>
        </nav>
      </header>

      {/* Contenu principal */}
      <main className="relative z-10 flex-1 flex items-center justify-start px-8 pt-20">
        <div className="max-w-2xl">
          {/* Titre principal */}
          <h1 className="text-6xl md:text-7xl font-light leading-tight mb-8" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            <span className="text-white">Où</span>
            <br />
            <span className="text-white font-bold">Imagination</span>
            <br />
            <span className="text-white">Rencontre l'Intelligence</span>
          </h1>

          {/* Bouton CTA */}
          <div className="relative">
            <button 
              onClick={() => navigateToTab('today')}
              className="bg-white/8 backdrop-blur-2xl border border-white/15 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-500 hover:bg-white/20 hover:border-white/30 hover:shadow-2xl hover:shadow-white/20 hover:scale-105 hover:backdrop-blur-3xl"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
            >
              COMMENCER L'ENTRAÎNEMENT
            </button>
            
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex justify-between items-end p-8 pb-12">
        {/* Section À propos améliorée */}
        <div className="max-w-2xl bg-black/10 backdrop-blur-3xl rounded-3xl p-10 border border-white/5 shadow-2xl">
          <div className="flex items-center mb-6">
            <h3 className="text-white font-bold text-sm tracking-wider mr-4" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>À PROPOS DE MOMENTUM</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-white/20 via-white/40 to-transparent"></div>
          </div>
          <div className="space-y-4">
            <p className="text-white text-sm font-medium leading-relaxed" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
              Momentum est votre compagnon intelligent pour transformer votre corps et votre esprit. 
              Grâce à l'intelligence artificielle avancée, nous comprenons vos objectifs de fitness 
              et adaptons votre parcours d'entraînement en temps réel.
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <h4 className="font-semibold text-white mb-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>🎯 Fonctionnalités</h4>
                <ul className="space-y-1 text-white/90" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>
                  <li>• Suivi corporel intelligent</li>
                  <li>• Programmes personnalisés</li>
                  <li>• Prédictions IA</li>
                  <li>• Analyses avancées</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>📊 Données</h4>
                <ul className="space-y-1 text-white/90" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>
                  <li>• Photos de progression</li>
                  <li>• Métriques corporelles</li>
                  <li>• Historique complet</li>
                  <li>• Statistiques détaillées</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Mots-clés simplifiés */}
        <div className="text-right">
          <div className="text-white text-base font-semibold space-y-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
            <div>Fitness</div>
            <div>Performance</div>
            <div>Progrès</div>
            <div>Intelligence</div>
            <div>Commencez votre transformation</div>
            <div>{userLocation}</div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;
