import React, { useState, useRef, useMemo, useEffect, useCallback, Suspense, lazy } from 'react';
import { useDeepCompareMemo } from 'use-deep-compare';
import { 
  Camera, 
  Upload, 
  Trash2, 
  Eye, 
  Calendar, 
  ArrowLeftRight,
  Grid,
  List,
  Filter,
  Download,
  RotateCcw,
  ZoomIn,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  Loader,
  BarChart3,
  Play,
  Activity,
  Target
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { formatDate } from '../../utils/dateUtils';
import { validatePhoto } from './utils/validation';
import { useToast } from './hooks/useToast';
import { compressImage, compressImageMultiResolution } from './utils/imageCompression'; // ✅ OPTIMISATION: Compression multi-résolution
import { usePagination } from './hooks/usePagination';
import usePhotosPaginated from './hooks/usePhotosPaginated'; // ✅ OPTIMISATION: Pagination avec cache LRU
import { getPhotoAnalysisOrchestrator } from './services/photoAnalysisOrchestrator';
import { getModelPreloader } from './services/modelPreloader';
import { getPhotoUrl } from './utils/photoNormalizer';
import logger from '../../utils/logger';

// Lazy loading composants lourds
const PhotoCaptureSession = lazy(() => import('./PhotoCaptureSession'));
const PhotoGlobalDashboard = lazy(() => import('./PhotoGlobalDashboard'));
const PhotoMuscleAnalysis = lazy(() => import('./PhotoMuscleAnalysis'));
const PhotoProgressionTimeline = lazy(() => import('./PhotoProgressionTimeline'));
const PhotoCorrelationsDashboard = lazy(() => import('./PhotoCorrelationsDashboard'));

// ✅ OPTIMISATION: Navigation Dashboard Améliorée
import DashboardNavigation from './components/DashboardNavigation';

const log = logger.component('PhotoGallerySection');

const PhotoGallerySection = () => {
  const { data, addProgressPhoto } = useWorkout();
  const { showSuccess, showError, showWarning, showInfo, ToastContainer } = useToast();
  
  // ✅ OPTIMISATION: Service feedback erreurs détaillé
  const { getErrorFeedbackService, ERROR_TYPES } = require('./services/errorFeedbackService');
  const errorFeedbackService = React.useMemo(() => getErrorFeedbackService(), []);
  const fileInputRef = useRef(null);
  
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'front', 'side', 'back'
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [compareMode, setCompareMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // États analyse IA
  const [showCaptureSession, setShowCaptureSession] = useState(false);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(null); // ID photo en cours d'analyse
  const [analysisProgress, setAnalysisProgress] = useState({ progress: 0, message: '' });
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [viewType, setViewType] = useState('gallery'); // 'gallery' | 'dashboard' | 'muscle' | 'timeline' | 'correlations'
  const [justCaptured, setJustCaptured] = useState(false); // ✅ OPTIMISATION: Flag pour suggestions intelligentes

  // ✅ OPTIMISATION: Activer pagination avec cache LRU si > 50 photos (réduction mémoire)
  const USE_PAGINATED_LOADING = (data?.progressPhotos?.length || 0) > 50;
  
  // 📄 PAGINATION OPTIMISÉE - Utilisée seulement si pas de virtualisation
  const itemsPerPage = viewMode === 'grid' ? 12 : 8; // Moins en mode liste (photos plus grandes)
  const [currentPage, setCurrentPage] = useState(1);
  
  // ✅ OPTIMISATION: Pagination avec cache LRU (si > 50 photos)
  const {
    photos: paginatedPhotosData,
    loading: paginationLoading,
    totalPages: paginatedTotalPages,
    totalPhotos: paginatedTotalPhotos,
    invalidateCache: invalidatePaginationCache
  } = usePhotosPaginated(
    USE_PAGINATED_LOADING ? currentPage : 1,
    itemsPerPage,
    {
      filterBy,
      enableCache: true,
      maxCacheSize: 10
    }
  );

  // 🔍 Récupérer les vraies photos de progression (MEMOIZED avec Deep Compare)
  // ✅ OPTIMISATION: Memoization Profonde - Re-render seulement si contenu change réellement
  // ✅ OPTIMISATION: Utiliser données paginées si activé, sinon calculer depuis mémoire
  const progressPhotos = useDeepCompareMemo(() => {
    // ✅ Si pagination activée, utiliser données paginées
    if (USE_PAGINATED_LOADING) {
      return paginatedPhotosData;
    }
    
    // ✅ Sinon, comportement classique (mémoire)
    if (!data?.progressPhotos || data.progressPhotos.length === 0) {
      return [];
    }
    
    return data.progressPhotos
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : (a.timestamp ? new Date(a.timestamp) : new Date(0));
        const dateB = b.date ? new Date(b.date) : (b.timestamp ? new Date(b.timestamp) : new Date(0));
        return dateB - dateA; // Plus récent en premier
      })
      .map(photo => ({
        id: photo.id,
        // ✅ OPTIMISATION: Préserver structure multi-résolution si présente
        ...(photo.resolutions ? { resolutions: photo.resolutions } : {}),
        url: getPhotoUrl(photo, 'preview'), // ✅ OPTIMISATION: Utiliser preview par défaut (bon équilibre)
        date: photo.date ? new Date(photo.date) : (photo.timestamp ? new Date(photo.timestamp) : new Date()),
        angle: photo.angle || 'front',
        weight: photo.weight,
        notes: photo.notes,
        tags: photo.tags || ['progress'],
        filename: photo.filename,
        type: photo.type,
        // Préserver métadonnées compression si présentes
        ...(photo.compression ? { compression: photo.compression } : {})
      }));
  }, [USE_PAGINATED_LOADING, paginatedPhotosData, data?.progressPhotos]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      // 🔍 Validation complète de la photo avant traitement
      const validation = validatePhoto(file, {
        maxSizeMB: 10,
        allowedFormats: ['image/jpeg', 'image/jpg', 'image/png'],
        maxPhotosPerDay: 5,
        existingPhotos: progressPhotos
      });
      
      if (validation && validation.error) {
        // Afficher erreur de validation via toast
        showError(validation.error);
        return; // Ne pas traiter ce fichier
      }
      
      if (file.type.startsWith('image/')) {
        // ✅ OPTIMISATION: COMPRESSION MULTI-RÉSOLUTION AVANT SAUVEGARDE
        setUploadProgress(0);
        
        // Compresser l'image en multi-résolution (thumbnail/preview/full)
        compressImageMultiResolution(
          file,
          {
            // Résolutions personnalisées (optionnel, utilise valeurs par défaut sinon)
            resolutions: [
              { name: 'thumbnail', width: 150, height: 200, quality: 0.6 },
              { name: 'preview', width: 400, height: 533, quality: 0.75 },
              { name: 'full', width: 1200, height: 1600, quality: 0.85 }
            ],
            progressive: true // JPEG progressif si fallback
          },
          (progress) => {
            setUploadProgress(progress);
          }
        )
          .then((compressionResult) => {
            // Afficher informations de compression
            const { originalSizeKB, totalSizeKB, reduction, format } = compressionResult;
            
            // Message informatif si compression significative
            if (reduction > 10) {
              showInfo(
                `Photo compressée (${format.toUpperCase()}): ${originalSizeKB.toFixed(1)}KB → ${totalSizeKB.toFixed(1)}KB (-${reduction}%)`
              );
            }
            
            // ✅ OPTIMISATION: Créer l'entrée photo avec structure multi-résolution
            const photoEntry = {
              id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              // Structure multi-résolution: { thumbnail, preview, full }
              resolutions: {
                thumbnail: compressionResult.thumbnail,
                preview: compressionResult.preview,
                full: compressionResult.full
              },
              // ✅ Compatibilité: garder url pour fallback (utilise preview)
              url: compressionResult.preview?.data || compressionResult.full?.data || null,
              date: new Date(),
              angle: 'front', // Par défaut, pourrait être sélectionnable
              weight: null, // Pourrait être récupéré des dernières métriques
              notes: '',
              tags: ['progress'],
              filename: file.name,
              type: 'photo',
              // Métadonnées de compression pour traçabilité
              compression: {
                originalSize: compressionResult.originalSize,
                totalSize: compressionResult.totalSize,
                reduction: reduction,
                format: format,
                dimensions: compressionResult.dimensions
              }
            };
            
            // Sauvegarder via le contexte (IndexedDB)
            return addProgressPhoto(photoEntry);
          })
          .then(async (savedPhoto) => {
            setUploadProgress(0);
            showSuccess('Photo enregistrée avec succès. Analyse automatique en cours...');
            
            // ✅ NAVIGATION: Lancer analyse automatique après upload
            try {
              setAnalyzingPhoto(savedPhoto?.id || 'upload');
              setAnalysisProgress({ progress: 0, message: 'Analyse photo en cours...' });
              
              const orchestrator = getPhotoAnalysisOrchestrator();
              // ✅ OPTIMISATION: Utiliser résolution 'full' pour analyse IA (meilleure précision)
              const analysisSource = getPhotoUrl(savedPhoto, 'full') || getPhotoUrl(savedPhoto, 'preview') || getPhotoUrl(savedPhoto);
              const analysisInput = {
                source: analysisSource,
                photoData: {
                  id: savedPhoto?.id,
                  angle: savedPhoto?.angle || 'front',
                  qualityScore: null
                }
              };
              
              const result = await orchestrator.analyzePhoto(
                analysisInput.source,
                analysisInput.photoData,
                {
                  targetResolution: 512,
                  segmentationResolution: 'medium'
                },
                (progress, message) => {
                  setAnalysisProgress({ 
                    progress, 
                    message: message || 'Analyse en cours...' 
                  });
                }
              );
              
              if (result.success) {
                // Enrichir photo avec résultats
                const enrichedPhoto = {
                  ...savedPhoto,
                  analysis: {
                    analyzed: true,
                    analyzedAt: new Date().toISOString(),
                    metrics: result.metrics,
                    poseDetection: result.poseDetection,
                    segmentation: result.segmentation,
                    preprocessing: result.preprocessing,
                    summary: result.summary
                  }
                };
                
                showSuccess(`✅ Photo analysée avec succès ! ${result.summary?.musclesAnalyzed || 0} muscles analysés.`);
                
                // ✅ NAVIGATION: Rediriger vers Dashboard pour voir résultats
                setJustCaptured(true); // ✅ Activer flag pour suggestions intelligentes
                setTimeout(() => {
                  setViewType('dashboard');
                  // Reset flag après 5s (temps pour voir la suggestion)
                  setTimeout(() => setJustCaptured(false), 5000);
                }, 1000);
              } else {
                const feedback = errorFeedbackService.analyzeError(
                result.error || 'Analyse échouée',
                ERROR_TYPES.ANALYSIS,
                null,
                { photoId: savedPhoto?.id }
              );
              showWarning(feedback.message, feedback);
              }
            } catch (error) {
              log.error('Erreur analyse automatique upload', error);
              const feedback = errorFeedbackService.analyzeError(
                error,
                ERROR_TYPES.ANALYSIS,
                null,
                { photoId: savedPhoto?.id }
              );
              showWarning(feedback.message, feedback);
            } finally {
              setAnalyzingPhoto(null);
              setAnalysisProgress({ progress: 0, message: '' });
            }
          })
          .catch((error) => {
            log.error('Erreur lors de la compression/sauvegarde de la photo', error);
            setUploadProgress(0);
            const feedback = errorFeedbackService.analyzeError(
              error,
              ERROR_TYPES.SAVE,
              null,
              { photoId: file.name }
            );
            showError(feedback.title, feedback);
          });
      }
    });
  };

  // 🔍 Filtrer et trier photos (MEMOIZED)
  // ✅ OPTIMISATION: Si pagination activée, photos déjà filtrées/triées par usePhotosPaginated
  const filteredPhotos = useMemo(() => {
    if (USE_PAGINATED_LOADING) {
      return progressPhotos; // Déjà filtrées par usePhotosPaginated
    }
    return progressPhotos.filter(photo => {
      if (filterBy === 'all') return true;
      return photo.angle === filterBy;
    });
  }, [progressPhotos, filterBy, USE_PAGINATED_LOADING]);

  const sortedPhotos = useMemo(() => {
    if (USE_PAGINATED_LOADING) {
      return filteredPhotos; // Déjà triées par usePhotosPaginated
    }
    return [...filteredPhotos].sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date || 0);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date || 0);
      return dateB - dateA; // Plus récent en premier
    });
  }, [filteredPhotos, USE_PAGINATED_LOADING]);

  // ✅ OPTIMISATION: Virtualisation automatique si > 50 photos (seuil performance)
  const shouldVirtualize = useMemo(() => {
    return sortedPhotos.length > 50; // Seuil: virtualisation si > 50 photos
  }, [sortedPhotos.length]);

  // 📄 PAGINATION OPTIMISÉE - Utilisée seulement si pas de virtualisation et pagination non activée
  const {
    paginatedItems: paginatedPhotos,
    currentPage: legacyCurrentPage,
    totalPages: legacyTotalPages,
    paginationInfo,
    goToNextPage,
    goToPrevPage,
    goToPage,
    goToFirstPage,
    goToLastPage,
    resetPagination
  } = usePagination(
    USE_PAGINATED_LOADING ? [] : sortedPhotos, // ✅ Ne pas paginer si déjà paginé
    {
      itemsPerPage,
      initialPage: 1
      // Note: Si pagination activée, usePagination reçoit tableau vide (pas utilisé)
    }
  );

  // ✅ OPTIMISATION: Fonctions navigation pagination avec cache LRU
  const handlePageChange = useCallback((newPage) => {
    if (USE_PAGINATED_LOADING) {
      setCurrentPage(newPage);
      // ✅ Invalider cache si nécessaire (après ajout/suppression photo)
      // invalidatePaginationCache(); // Décommenter si besoin
    } else {
      goToPage(newPage);
    }
  }, [USE_PAGINATED_LOADING, goToPage]);

  const goToNextPageOptimized = useCallback(() => {
    if (USE_PAGINATED_LOADING) {
      setCurrentPage(prev => Math.min(prev + 1, paginatedTotalPages));
    } else {
      goToNextPage();
    }
  }, [USE_PAGINATED_LOADING, paginatedTotalPages, goToNextPage]);

  const goToPrevPageOptimized = useCallback(() => {
    if (USE_PAGINATED_LOADING) {
      setCurrentPage(prev => Math.max(prev - 1, 1));
    } else {
      goToPrevPage();
    }
  }, [USE_PAGINATED_LOADING, goToPrevPage]);

  // ✅ Calculer valeurs pagination finales (selon mode)
  const finalCurrentPage = USE_PAGINATED_LOADING ? currentPage : legacyCurrentPage;
  const finalTotalPages = USE_PAGINATED_LOADING ? paginatedTotalPages : legacyTotalPages;
  const finalLoading = USE_PAGINATED_LOADING ? paginationLoading : false;

  // Réinitialiser pagination quand le filtre change (seulement si pagination active)
  useEffect(() => {
    if (USE_PAGINATED_LOADING) {
      setCurrentPage(1); // Reset à page 1 si filtre change
    } else if (!shouldVirtualize) {
      resetPagination();
    }
  }, [filterBy, resetPagination, shouldVirtualize, USE_PAGINATED_LOADING]);

  const handlePhotoSelect = useCallback((photoId) => {
    setSelectedPhotos(prev => {
      if (prev.includes(photoId)) {
        return prev.filter(id => id !== photoId);
      } else if (prev.length < 2) {
        return [...prev, photoId];
      } else {
        return [prev[1], photoId];
      }
    });
  }, []);

  const openModal = useCallback((index) => {
    setCurrentPhotoIndex(index);
    setShowModal(true);
  }, []);

  const navigatePhoto = (direction) => {
    if (direction === 'next') {
      setCurrentPhotoIndex((prev) => (prev + 1) % sortedPhotos.length);
    } else {
      setCurrentPhotoIndex((prev) => (prev - 1 + sortedPhotos.length) % sortedPhotos.length);
    }
  };

  const getAngleIcon = useCallback((angle) => {
    switch (angle) {
      case 'front': return '👤';
      case 'side': return '🚶';
      case 'back': return '🔄';
      default: return '📷';
    }
  }, []);

  const getAngleLabel = useCallback((angle) => {
    switch (angle) {
      case 'front': return 'Face';
      case 'side': return 'Profil';
      case 'back': return 'Dos';
      default: return 'Autre';
    }
  }, []);

  /**
   * Lance analyse IA d'une photo
   */
  const handleAnalyzePhoto = async (photo) => {
    // ✅ OPTIMISATION: Vérifier présence URL (multi-résolution ou classique)
    if (!photo || !getPhotoUrl(photo)) {
      const feedback = errorFeedbackService.analyzeError(
        'Photo invalide pour analyse',
        ERROR_TYPES.ANALYSIS,
        'PREPROCESS_FAILED',
        { photoId: photo?.id }
      );
      showError(feedback.title, feedback);
      return;
    }

    setAnalyzingPhoto(photo.id);
    setAnalysisProgress({ progress: 0, message: 'Démarrage analyse...' });

    try {
      const orchestrator = getPhotoAnalysisOrchestrator();
      
      // ✅ OPTIMISATION: Utiliser résolution 'full' pour analyse IA (meilleure précision)
      const analysisSource = getPhotoUrl(photo, 'full') || getPhotoUrl(photo, 'preview') || getPhotoUrl(photo);
      
      // Analyser photo
      const result = await orchestrator.analyzePhoto(
        analysisSource, // Source Base64 (full > preview > fallback)
        {
          id: photo.id,
          poseType: photo.capture?.poseType,
          angle: photo.angle,
          qualityScore: photo.capture?.qualityScore
        },
        {
          targetResolution: 512,
          segmentationResolution: 'medium'
        },
        (progress, message) => {
          setAnalysisProgress({ progress, message: message || '' });
        }
      );

      if (result.success) {
        // Enrichir photo avec métadonnées analyse
        const enrichedPhoto = {
          ...photo,
          analysis: {
            analyzed: true,
            analyzedAt: new Date().toISOString(),
            metrics: result.metrics,
            poseDetection: result.poseDetection,
            segmentation: result.segmentation,
            preprocessing: result.preprocessing,
            summary: result.summary
          }
        };

        // Mettre à jour photo dans données
        // Note: Devrait utiliser updateProgressPhoto si disponible dans WorkoutContext
        // Pour l'instant, on affiche juste les résultats
        setAnalysisResults(enrichedPhoto);
        setShowAnalysisModal(true);
        
        showSuccess(`Analyse terminée: ${result.summary?.musclesAnalyzed || 0} muscles analysés`);
      } else {
        const feedback = errorFeedbackService.analyzeError(
          result.error || 'Échec de l\'analyse',
          ERROR_TYPES.ANALYSIS,
          null,
          { photoId: photo.id }
        );
        showError(feedback.title, feedback);
      }
    } catch (error) {
      log.error('Erreur analyse photo', error);
      const feedback = errorFeedbackService.analyzeError(
        error,
        ERROR_TYPES.ANALYSIS,
        null,
        { photoId: photo.id }
      );
      showError(feedback.title, feedback);
    } finally {
      setAnalyzingPhoto(null);
      setAnalysisProgress({ progress: 0, message: '' });
    }
  };

  /**
   * Précharge modèles IA selon contexte
   */
  useEffect(() => {
    const preloader = getModelPreloader();
    
    // Précharger modèles selon vue active
    if (viewType === 'gallery' && showCaptureSession) {
      // Si onglet galerie et modal capture ouvert: précharger MediaPipe
      preloader.preloadPoseModel().catch(err => 
        log.warn('Erreur préchargement MediaPipe:', err)
      );
    } else if (viewType === 'dashboard' || viewType === 'muscle' || viewType === 'timeline') {
      // Si dashboards d'analyse: précharger tous modèles en idle
      preloader.preloadOnIdle('analysis', 1000);
    }
  }, [viewType, showCaptureSession]);

  /**
   * Gère sauvegarde session depuis PhotoCaptureSession avec analyse automatique
   * ✅ NAVIGATION: Redirige automatiquement vers Dashboard après analyse
   */
  const handleSessionComplete = useCallback(async (photos) => {
    try {
      // Photos sont déjà sauvegardées et analysées par PhotoCaptureSession
      const analyzedPhotos = photos.filter(p => p.analysis?.analyzed);
      const unanalyzedPhotos = photos.filter(p => !p.analysis?.analyzed);
      
      if (unanalyzedPhotos.length > 0) {
        // ✅ Lancer analyse automatique si pas encore fait (fallback)
        log.info(`Lancement analyse automatique ${unanalyzedPhotos.length} photo(s) non analysée(s)`);
        showInfo(`Analyse automatique de ${unanalyzedPhotos.length} photo(s) en cours...`);
        
        setAnalyzingPhoto('session');
        setAnalysisProgress({ progress: 0, message: 'Analyse session en cours...' });
        
        const orchestrator = getPhotoAnalysisOrchestrator();
        
        const analysisInputs = unanalyzedPhotos.map(photo => ({
          // ✅ OPTIMISATION: Utiliser résolution 'full' pour analyse IA (meilleure précision)
          source: getPhotoUrl(photo, 'full') || getPhotoUrl(photo, 'preview') || getPhotoUrl(photo),
          photoData: {
            id: photo.id,
            poseType: photo.capture?.poseType,
            angle: photo.angle,
            qualityScore: photo.capture?.qualityScore
          }
        }));
        
        const sessionResult = await orchestrator.analyzeSession(
          analysisInputs,
          {
            targetResolution: 512,
            segmentationResolution: 'medium',
            batchSize: 3
          },
          (progress, message) => {
            setAnalysisProgress({ progress, message: message || '' });
          }
        );
        
        // Enrichir photos non analysées
        const enrichedPhotos = [
          ...analyzedPhotos,
          ...unanalyzedPhotos.map((photo, idx) => {
            const result = sessionResult.photos[idx];
            if (result?.success) {
              return {
                ...photo,
                analysis: {
                  analyzed: true,
                  analyzedAt: new Date().toISOString(),
                  metrics: result.metrics,
                  poseDetection: result.poseDetection,
                  segmentation: result.segmentation,
                  summary: result.summary
                }
              };
            }
            return photo;
          })
        ];
        
        setAnalyzingPhoto(null);
        setAnalysisProgress({ progress: 0, message: '' });
        
        const successCount = enrichedPhotos.filter(p => p.analysis?.analyzed).length;
        showSuccess(
          `✅ Session analysée ! ${successCount}/${photos.length} photo(s) analysée(s). ` +
          `Redirection vers le Dashboard...`
        );
        
        // ✅ NAVIGATION: Fermer modal et rediriger vers Dashboard après 1s
        setShowCaptureSession(false);
        setJustCaptured(true); // ✅ Activer flag pour suggestions intelligentes
        setTimeout(() => {
          setViewType('dashboard');
          // Reset flag après 5s
          setTimeout(() => setJustCaptured(false), 5000);
        }, 1000);
        
      } else {
        // Toutes photos déjà analysées
        showSuccess(
          `✅ ${photos.length} photo(s) analysée(s). Redirection vers le Dashboard...`
        );
        
        // ✅ NAVIGATION: Fermer modal et rediriger vers Dashboard après 1s
        setShowCaptureSession(false);
        setJustCaptured(true); // ✅ Activer flag pour suggestions intelligentes
        setTimeout(() => {
          setViewType('dashboard');
          // Reset flag après 5s
          setTimeout(() => setJustCaptured(false), 5000);
        }, 1000);
      }
      
    } catch (error) {
      log.error('Erreur analyse session complète', error);
      const feedback = errorFeedbackService.analyzeError(
        'Erreur lors de l\'analyse',
        ERROR_TYPES.ANALYSIS,
        null
      );
      showError(feedback.title, feedback);
      setAnalyzingPhoto(null);
      setAnalysisProgress({ progress: 0, message: '' });
      setShowCaptureSession(false);
    }
  }, [showSuccess, showError, showInfo, setViewType]);

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
      {/* Contrôles d'upload et de vue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-green-400" />
              {viewType === 'gallery' ? 'Galerie de progression' : 'Dashboard Analyse IA'}
                    {viewType === 'gallery' && (
                      <span className="text-sm font-normal text-slate-400">
                        ({sortedPhotos.length} photos{finalTotalPages > 1 && ` - Page ${finalCurrentPage}/${finalTotalPages}`})
                        {finalLoading && <span className="ml-2 text-purple-400">(Chargement...)</span>}
                      </span>
                    )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* ✅ OPTIMISATION: Navigation Dashboard Améliorée avec breadcrumbs et suggestions */}
          <DashboardNavigation
            currentView={viewType}
            onViewChange={(newView) => {
              // Transition fluide avec scroll vers le haut
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setViewType(newView);
            }}
            showBackButton={viewType !== 'gallery'}
            onBack={() => setViewType('gallery')}
            context={{
              justCaptured: justCaptured, // ✅ Flag mis à jour après capture
              hasAnalyzedPhotos: progressPhotos.some(p => p.analysis?.analyzed),
              hasMultiplePhotos: progressPhotos.length > 1
            }}
          />
          <div className="mb-6"></div> {/* Espacement */}
          
          {/* Actions communes (disponibles dans toutes les vues) */}
          <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
            {/* Upload & Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => setShowCaptureSession(true)}
                className="bg-purple-600 hover:bg-purple-700"
                icon={Camera}
              >
                Nouvelle Session Photo
              </Button>
              {viewType === 'gallery' && (
                <>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Ajouter des photos
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </>
              )}
            </div>

            {/* Contrôles de vue (seulement en mode galerie) */}
            {viewType === 'gallery' && (
            <div className="flex gap-2 items-center">
              <div className="flex gap-1 bg-slate-700 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-sm text-white"
              >
                <option value="all">Tous les angles</option>
                <option value="front">Face</option>
                <option value="side">Profil</option>
                <option value="back">Dos</option>
              </select>

              {selectedPhotos.length === 2 && (
                <Button
                  onClick={() => setCompareMode(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Comparer
                </Button>
              )}
            </div>
            )}
          </div>

          {/* Contenu selon vue */}
          {viewType === 'dashboard' ? (
            <Suspense fallback={
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Loader className="w-12 h-12 mx-auto mb-4 text-purple-400 animate-spin" />
                  <p className="text-slate-400">Chargement dashboard...</p>
                </div>
              </div>
            }>
              <PhotoGlobalDashboard />
            </Suspense>
          ) : viewType === 'muscle' ? (
            <Suspense fallback={
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Loader className="w-12 h-12 mx-auto mb-4 text-purple-400 animate-spin" />
                  <p className="text-slate-400">Chargement analyse musculaire...</p>
                </div>
              </div>
            }>
              <PhotoMuscleAnalysis />
            </Suspense>
          ) : viewType === 'timeline' ? (
            <Suspense fallback={
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Loader className="w-12 h-12 mx-auto mb-4 text-purple-400 animate-spin" />
                  <p className="text-slate-400">Chargement timeline...</p>
                </div>
              </div>
            }>
              <PhotoProgressionTimeline />
            </Suspense>
          ) : viewType === 'correlations' ? (
            <Suspense fallback={
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Loader className="w-12 h-12 mx-auto mb-4 text-purple-400 animate-spin" />
                  <p className="text-slate-400">Chargement corrélations...</p>
                </div>
              </div>
            }>
              <PhotoCorrelationsDashboard />
            </Suspense>
          ) : (
            <>
              {/* Barre de progression de compression */}
              {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-400 animate-pulse" />
                  <span className="text-sm text-slate-300">
                    Compression en cours... {uploadProgress.toFixed(0)}%
                  </span>
                </div>
                <span className="text-xs text-slate-400">{uploadProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Optimisation de la taille et de la qualité pour un stockage efficace
              </p>
            </div>
          )}

          {/* Galerie avec virtualisation ou pagination selon nombre photos */}
          {viewMode === 'grid' ? (
            shouldVirtualize ? (
              // ✅ MODE VIRTUALISÉ: Pour grandes collections (>50 photos)
              <VirtualizedPhotoGrid
                photos={sortedPhotos} // Utiliser toutes photos triées (virtualisation gère l'affichage)
                columns={4} // Responsive: sera adapté automatiquement selon viewport
                itemWidth={200}
                itemHeight={266} // 3:4 aspect ratio
                onPhotoSelect={handlePhotoSelect}
                selectedPhotos={selectedPhotos}
                getAngleIcon={getAngleIcon}
                getAngleLabel={getAngleLabel}
                openModal={openModal}
                sortedPhotos={sortedPhotos}
                containerHeight={600}
              />
            ) : (
              // MODE PAGINÉ: Pour petites collections (<50 photos) - garde compatibilité
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {paginatedPhotos.map((photo, index) => {
                // Index global pour la navigation dans le modal
                const globalIndex = sortedPhotos.findIndex(p => p.id === photo.id);
                return (
                <div
                  key={photo.id}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedPhotos.includes(photo.id) 
                      ? 'border-purple-500 ring-2 ring-purple-500/50' 
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                  onClick={() => handlePhotoSelect(photo.id)}
                >
                  <div className="aspect-[3/4] bg-slate-700">
                    <img
                      src={getPhotoUrl(photo, 'thumbnail') || photo.url} // ✅ OPTIMISATION: Utiliser thumbnail pour grille (performance)
                      alt={`Photo ${getAngleLabel(photo.angle)} du ${formatDate(photo.date)}`}
                      className="w-full h-full object-cover"
                      loading="lazy" // ✅ OPTIMISATION: Lazy loading pour performances
                    />
                  </div>
                  
                  {/* Overlay avec infos */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex justify-between items-start">
                      <span className="text-xs bg-slate-800/80 px-2 py-1 rounded text-white">
                        {getAngleIcon(photo.angle)} {getAngleLabel(photo.angle)}
                      </span>
                      <div className="flex gap-1">
                        {photo.analysis?.analyzed && (
                          <span className="text-xs bg-purple-600/80 px-2 py-1 rounded text-white flex items-center gap-1">
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
                          className="p-1 h-auto bg-slate-800/80 hover:bg-slate-700"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-white">
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(photo.date)}
                      </div>
                      <div>{photo.weight} kg</div>
                      {photo.capture?.qualityScore && (
                        <div className="text-purple-300">
                          Qualité: {photo.capture.qualityScore}/100
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Indicateur de sélection */}
                  {selectedPhotos.includes(photo.id) && (
                    <div className="absolute top-2 left-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {selectedPhotos.indexOf(photo.id) + 1}
                    </div>
                  )}
                </div>
              );
              })}
              </div>
            )
          ) : (
            <div className="space-y-4">
              {paginatedPhotos.map((photo, index) => {
                // Index global pour la navigation dans le modal
                const globalIndex = sortedPhotos.findIndex(p => p.id === photo.id);
                return (
                <div
                  key={photo.id}
                  className={`flex gap-4 p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedPhotos.includes(photo.id)
                      ? 'border-purple-500 bg-purple-600/10'
                      : 'border-slate-600 bg-slate-800/30 hover:bg-slate-800/50'
                  }`}
                  onClick={() => handlePhotoSelect(photo.id)}
                >
                  <div className="w-20 h-24 bg-slate-700 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={getPhotoUrl(photo, 'thumbnail') || photo.url} // ✅ OPTIMISATION: Utiliser thumbnail pour liste (performance)
                      alt={`Photo ${getAngleLabel(photo.angle)}`}
                      className="w-full h-full object-cover"
                      loading="lazy" // ✅ OPTIMISATION: Lazy loading
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-white">
                        {getAngleIcon(photo.angle)} {getAngleLabel(photo.angle)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDate(photo.date)}
                      </span>
                      <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
                        {photo.weight} kg
                      </span>
                    </div>
                    
                    {photo.notes && (
                      <p className="text-sm text-slate-300 mb-2">{photo.notes}</p>
                    )}
                    
                    <div className="flex gap-2">
                      {photo.tags.map(tag => (
                        <span key={tag} className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(globalIndex);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
              })}
            </div>
          )}

          {/* Contrôles de pagination - Affichés seulement si pas de virtualisation */}
          {!shouldVirtualize && finalTotalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-slate-700 pt-4">
              <div className="text-sm text-slate-400">
                {USE_PAGINATED_LOADING ? (
                  <>Affichage {(finalCurrentPage - 1) * itemsPerPage + 1}-{Math.min(finalCurrentPage * itemsPerPage, sortedPhotos.length)} sur {paginatedTotalPhotos} photos</>
                ) : (
                  <>Affichage {paginationInfo.startIndex}-{paginationInfo.endIndex} sur {sortedPhotos.length} photos</>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Première page */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={finalCurrentPage === 1 || finalLoading}
                  className="p-2"
                  title="Première page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>

                {/* Page précédente */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPrevPageOptimized}
                  disabled={finalCurrentPage === 1 || finalLoading}
                  className="p-2"
                  title="Page précédente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Sélecteur de page */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-300">Page</span>
                  <select
                    value={finalCurrentPage}
                    onChange={(e) => handlePageChange(parseInt(e.target.value))}
                    disabled={finalLoading}
                    className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-sm text-white min-w-[60px] disabled:opacity-50"
                  >
                    {Array.from({ length: finalTotalPages }, (_, i) => i + 1).map(page => (
                      <option key={page} value={page}>
                        {page}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-slate-400">sur {finalTotalPages}</span>
                </div>

                {/* Page suivante */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNextPageOptimized}
                  disabled={finalCurrentPage === finalTotalPages || finalLoading}
                  className="p-2"
                  title="Page suivante"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                {/* Dernière page */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(finalTotalPages)}
                  disabled={finalCurrentPage === finalTotalPages || finalLoading}
                  className="p-2"
                  title="Dernière page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {sortedPhotos.length === 0 && (
            <div className="text-center py-12">
              <Camera className="w-16 h-16 mx-auto mb-4 text-slate-500" />
              <h4 className="text-xl font-semibold mb-2 text-white">Aucune photo</h4>
              <p className="text-slate-400 mb-4">Commencez votre suivi en ajoutant vos premières photos de progression.</p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Ajouter la première photo
              </Button>
            </div>
          )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Conseils pour les photos */}
      {viewType === 'gallery' && (
      <>
      <Card className="bg-blue-600/10 border-blue-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-200 mb-2">Conseils pour de meilleures photos</h4>
              <ul className="text-sm text-blue-100 space-y-1">
                <li>• Prenez vos photos dans les mêmes conditions (éclairage, heure, tenue)</li>
                <li>• Utilisez un arrière-plan neutre et uniforme</li>
                <li>• Maintenez la même distance et le même angle</li>
                <li>• Prenez des photos face, profil et dos pour un suivi complet</li>
                <li>• Photographiez-vous le matin à jeun pour plus de cohérence</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      </>
      )}

      {/* Modal de visualisation */}
      {viewType === 'gallery' && (
      <>
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">
                Photo du {formatDate(sortedPhotos[currentPhotoIndex]?.date)}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex">
              <div className="flex-1 p-4">
                <div className="relative">
                  <img
                    src={getPhotoUrl(sortedPhotos[currentPhotoIndex], 'preview') || sortedPhotos[currentPhotoIndex]?.url} // ✅ OPTIMISATION: Utiliser preview pour modal (bon équilibre qualité/performance)
                    alt="Photo de progression"
                    className="w-full max-h-[60vh] object-contain rounded"
                    loading="eager" // ✅ Chargement immédiat pour modal (UX)
                  />
                  
                  {/* Navigation */}
                  {sortedPhotos.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigatePhoto('prev')}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigatePhoto('next')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="w-80 p-4 border-l border-slate-700">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Détails</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Angle:</span>
                        <span className="text-white">{getAngleLabel(sortedPhotos[currentPhotoIndex]?.angle)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Poids:</span>
                        <span className="text-white">{sortedPhotos[currentPhotoIndex]?.weight} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Date:</span>
                        <span className="text-white">{formatDate(sortedPhotos[currentPhotoIndex]?.date)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {sortedPhotos[currentPhotoIndex]?.notes && (
                    <div>
                      <h4 className="font-semibold text-white mb-2">Notes</h4>
                      <p className="text-sm text-slate-300">{sortedPhotos[currentPhotoIndex]?.notes}</p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {/* Métriques si analysée */}
                    {sortedPhotos[currentPhotoIndex]?.analysis?.analyzed && (
                      <div>
                        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-purple-400" />
                          Métriques IA
                        </h4>
                        <div className="space-y-2">
                          {sortedPhotos[currentPhotoIndex]?.analysis?.metrics && 
                            Object.entries(sortedPhotos[currentPhotoIndex].analysis.metrics)
                              .filter(([_, m]) => m.success)
                              .slice(0, 3) // Top 3 muscles
                              .map(([muscle, metrics]) => (
                                <div key={muscle} className="bg-slate-700/50 rounded p-2">
                                  <div className="text-xs font-medium text-white capitalize mb-1">
                                    {muscle}
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                      <span className="text-slate-400">Volume:</span>
                                      <span className="text-white ml-1">
                                        {metrics.metrics?.volume?.score || 0}/100
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">Définition:</span>
                                      <span className="text-white ml-1">
                                        {metrics.metrics?.definition?.score || 0}/100
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">Symétrie:</span>
                                      <span className="text-white ml-1">
                                        {metrics.metrics?.symmetry?.score || 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))
                          }
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAnalysisResults(sortedPhotos[currentPhotoIndex]);
                              setShowAnalysisModal(true);
                            }}
                            className="w-full"
                          >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Voir analyse complète
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Actions */}
                    {!sortedPhotos[currentPhotoIndex]?.analysis?.analyzed && (
                      <Button
                        size="sm"
                        onClick={() => handleAnalyzePhoto(sortedPhotos[currentPhotoIndex])}
                        disabled={analyzingPhoto === sortedPhotos[currentPhotoIndex]?.id}
                        loading={analyzingPhoto === sortedPhotos[currentPhotoIndex]?.id}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        icon={Sparkles}
                      >
                        {analyzingPhoto === sortedPhotos[currentPhotoIndex]?.id 
                          ? 'Analyse en cours...' 
                          : 'Lancer analyse IA'}
                      </Button>
                    )}
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal analyse IA */}
      {showAnalysisModal && analysisResults && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Analyse IA - {formatDate(analysisResults.date)}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAnalysisModal(false);
                  setAnalysisResults(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
              {/* Résumé global */}
              {analysisResults.analysis?.summary && (
                <Card className="mb-6 bg-purple-600/10 border-purple-500/30">
                  <CardHeader>
                    <CardTitle size="sm" className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                      Résumé Analyse
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400 mb-1">
                          {analysisResults.analysis.summary.averageScores?.volume || 0}
                        </div>
                        <div className="text-xs text-slate-400">Volume moyen</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400 mb-1">
                          {analysisResults.analysis.summary.averageScores?.definition || 0}
                        </div>
                        <div className="text-xs text-slate-400">Définition moyenne</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400 mb-1">
                          {analysisResults.analysis.summary.musclesAnalyzed || 0}
                        </div>
                        <div className="text-xs text-slate-400">Muscles analysés</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-400 mb-1">
                          {analysisResults.analysis.summary.overallScore || 0}
                        </div>
                        <div className="text-xs text-slate-400">Score global</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Métriques par muscle */}
              {analysisResults.analysis?.metrics && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-white text-lg mb-4">Métriques par Muscle</h4>
                  
                  {Object.entries(analysisResults.analysis.metrics)
                    .filter(([_, m]) => m.success)
                    .map(([muscle, metricsData]) => {
                      const metrics = metricsData.metrics || {};
                      return (
                        <Card key={muscle} className="bg-slate-700/50">
                          <CardHeader>
                            <CardTitle size="sm" className="capitalize">{muscle}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {/* Volume */}
                              {metrics.volume && (
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-400">Volume</span>
                                    <span className="text-sm font-bold text-white">
                                      {metrics.volume.score}/100
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-600 rounded-full h-2">
                                    <div
                                      className="bg-purple-500 h-2 rounded-full transition-all"
                                      style={{ width: `${metrics.volume.score}%` }}
                                    />
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1">
                                    {metrics.volume.percentage}% | Percentile: {metrics.volume.percentile}%
                                  </div>
                                </div>
                              )}

                              {/* Définition */}
                              {metrics.definition && (
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-400">Définition</span>
                                    <span className="text-sm font-bold text-white">
                                      {metrics.definition.score}/100
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-600 rounded-full h-2">
                                    <div
                                      className="bg-blue-500 h-2 rounded-full transition-all"
                                      style={{ width: `${metrics.definition.score}%` }}
                                    />
                                  </div>
                                  {metrics.definition.breakdown && (
                                    <div className="text-xs text-slate-500 mt-1">
                                      Variance: {metrics.definition.breakdown.variance} | 
                                      FFT: {metrics.definition.breakdown.frequency} | 
                                      Contours: {metrics.definition.breakdown.contours}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Symétrie */}
                              {metrics.symmetry && (
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-400">Symétrie</span>
                                    <span className="text-sm font-bold text-white">
                                      {metrics.symmetry.score}/100
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-600 rounded-full h-2">
                                    <div
                                      className="bg-green-500 h-2 rounded-full transition-all"
                                      style={{ width: `${metrics.symmetry.score}%` }}
                                    />
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1">
                                    Différence: {metrics.symmetry.differencePercent}% | 
                                    {metrics.symmetry.weakerSide === 'left' ? 'Gauche' : 'Droite'} plus faible
                                  </div>
                                </div>
                              )}

                              {/* Vascularité */}
                              {metrics.vascularity && (
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-400">Vascularité</span>
                                    <span className="text-sm font-bold text-white">
                                      {metrics.vascularity.score}/100
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-600 rounded-full h-2">
                                    <div
                                      className="bg-red-500 h-2 rounded-full transition-all"
                                      style={{ width: `${metrics.vascularity.score}%` }}
                                    />
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1">
                                    {metrics.vascularity.veinCount} veines détectées
                                  </div>
                                </div>
                              )}

                              {/* Séparation */}
                              {metrics.separation && (
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-400">Séparation</span>
                                    <span className="text-sm font-bold text-white">
                                      {metrics.separation.score}/100
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-600 rounded-full h-2">
                                    <div
                                      className="bg-yellow-500 h-2 rounded-full transition-all"
                                      style={{ width: `${metrics.separation.score}%` }}
                                    />
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1">
                                    Ratio: {metrics.separation.ratio}
                                  </div>
                                </div>
                              )}

                              {/* Contours */}
                              {metrics.contours && (
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-400">Contours</span>
                                    <span className="text-sm font-bold text-white">
                                      {metrics.contours.score}/100
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-600 rounded-full h-2">
                                    <div
                                      className="bg-cyan-500 h-2 rounded-full transition-all"
                                      style={{ width: `${metrics.contours.score}%` }}
                                    />
                                  </div>
                                  {metrics.contours.breakdown && (
                                    <div className="text-xs text-slate-500 mt-1">
                                      Edges: {metrics.contours.breakdown.edges} | 
                                      Sharpness: {metrics.contours.breakdown.sharpness}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              )}

              {/* Détails pose détection */}
              {analysisResults.analysis?.poseDetection && (
                <Card className="mt-6 bg-slate-700/50">
                  <CardHeader>
                    <CardTitle size="sm">Détection Pose</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Confiance:</span>
                        <span className="text-white ml-2">
                          {Math.round((analysisResults.analysis.poseDetection.confidence || 0) * 100)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Orientation:</span>
                        <span className="text-white ml-2 capitalize">
                          {analysisResults.analysis.poseDetection.orientation || 'unknown'}
                        </span>
                      </div>
                      {analysisResults.analysis.poseDetection.validation && (
                        <>
                          <div>
                            <span className="text-slate-400">Validation:</span>
                            <span className={`ml-2 ${
                              analysisResults.analysis.poseDetection.validation.valid 
                                ? 'text-green-400' 
                                : 'text-yellow-400'
                            }`}>
                              {analysisResults.analysis.poseDetection.validation.valid ? '✅' : '⚠️'} 
                              {analysisResults.analysis.poseDetection.validation.confidence.toFixed(0)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Angles matchés:</span>
                            <span className="text-white ml-2">
                              {analysisResults.analysis.poseDetection.validation.matchedAngles}/
                              {analysisResults.analysis.poseDetection.validation.totalAngles}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PhotoCaptureSession Modal */}
      {showCaptureSession && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="text-center">
              <Loader className="w-12 h-12 mx-auto mb-4 text-purple-400 animate-spin" />
              <p className="text-slate-400">Chargement session photo...</p>
            </div>
          </div>
        }>
          <PhotoCaptureSession
            isOpen={showCaptureSession}
            onClose={() => setShowCaptureSession(false)}
            onComplete={handleSessionComplete}
            sessionType="COMPLETE"
          />
        </Suspense>
      )}

      {/* Barre progression analyse */}
      {analyzingPhoto && analysisProgress.progress > 0 && (
        <div className="fixed bottom-4 right-4 bg-slate-800 rounded-lg p-4 shadow-2xl border border-slate-700 max-w-md z-50">
          <div className="flex items-center gap-3 mb-3">
            <Loader className="w-5 h-5 text-purple-400 animate-spin" />
            <div className="flex-1">
              <div className="text-sm font-medium text-white mb-1">
                Analyse IA en cours...
              </div>
              <div className="text-xs text-slate-400">
                {analysisProgress.message || `${analysisProgress.progress}%`}
              </div>
            </div>
            <span className="text-sm font-bold text-purple-400">
              {analysisProgress.progress}%
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${analysisProgress.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Mode comparaison */}
      {compareMode && selectedPhotos.length === 2 && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Comparaison de progression</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCompareMode(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-2 gap-6">
                {selectedPhotos.map((photoId, index) => {
                  const photo = progressPhotos.find(p => p.id === photoId);
                  return (
                    <div key={photoId} className="text-center">
                      <div className="mb-4">
                        <h4 className="font-semibold text-white mb-2">
                          {index === 0 ? 'Avant' : 'Après'} - {formatDate(photo.date)}
                        </h4>
                        <div className="text-sm text-slate-400">
                          Poids: {photo.weight} kg
                        </div>
                      </div>
                      <img
                        src={getPhotoUrl(photo, 'preview') || photo.url} // ✅ OPTIMISATION: Utiliser preview pour comparaison (bon équilibre qualité/performance)
                        alt={`Photo ${index === 0 ? 'avant' : 'après'}`}
                        className="w-full max-h-[50vh] object-contain rounded"
                        loading="lazy" // ✅ OPTIMISATION: Lazy loading
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
    </>
  );
};

export default PhotoGallerySection;