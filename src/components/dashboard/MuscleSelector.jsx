/**
 * MuscleSelector Component
 * Sélecteur de groupes musculaires avec visualisation et upload d'images
 */

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { migrateMuscleImagesToIndexedDB } from '../../utils/migrateMuscleImages';
import {
  MUSCLE_IMAGES_DB_NAME,
  MUSCLE_IMAGES_DB_VERSION,
  STORE_MUSCLE_IMAGES,
  applyMuscleImagesSchemaUpgrade,
} from '../../services/bodyTracking/muscleImagesDbGateway.js';

// ============================================================================
// INDEXEDDB HELPERS - Stockage des images muscles
// ============================================================================

const openMuscleImagesDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MUSCLE_IMAGES_DB_NAME, MUSCLE_IMAGES_DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      applyMuscleImagesSchemaUpgrade(event);
    };
  });
};

const saveMuscleImageToDB = async (db, muscleId, imageData) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_MUSCLE_IMAGES], 'readwrite');
    const store = transaction.objectStore(STORE_MUSCLE_IMAGES);
    const request = store.put({ muscleId, imageData, timestamp: Date.now() });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const loadMuscleImageFromDB = async (db, muscleId) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_MUSCLE_IMAGES], 'readonly');
    const store = transaction.objectStore(STORE_MUSCLE_IMAGES);
    const request = store.get(muscleId);
    
    request.onsuccess = () => resolve(request.result?.imageData || null);
    request.onerror = () => reject(request.error);
  });
};

const loadAllMuscleImagesFromDB = async (db) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_MUSCLE_IMAGES], 'readonly');
    const store = transaction.objectStore(STORE_MUSCLE_IMAGES);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const images = {};
      request.result.forEach(item => {
        images[item.muscleId] = item.imageData;
      });
      resolve(images);
    };
    request.onerror = () => reject(request.error);
  });
};

const deleteMuscleImageFromDB = async (db, muscleId) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_MUSCLE_IMAGES], 'readwrite');
    const store = transaction.objectStore(STORE_MUSCLE_IMAGES);
    const request = store.delete(muscleId);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const MuscleSelector = ({ selected, onSelect, showVolume = false, volumeData = {} }) => {
  const [hoveredMuscle, setHoveredMuscle] = useState(null);
  const [muscleImages, setMuscleImages] = useState({});
  const [uploadingMuscle, setUploadingMuscle] = useState(null);
  const fileInputRefs = useRef({});

  // Charger les images depuis IndexedDB au démarrage
  useEffect(() => {
    const loadImages = async () => {
      try {
        // Migrer les anciennes données de localStorage si nécessaire
        await migrateMuscleImagesToIndexedDB();
        
        // Charger depuis IndexedDB
        const db = await openMuscleImagesDB();
        const images = await loadAllMuscleImagesFromDB(db);
        setMuscleImages(images);
        console.log(`✅ ${Object.keys(images).length} images muscles chargées depuis IndexedDB`);
      } catch (error) {
        console.error('❌ Erreur chargement images muscles:', error);
      }
    };
    loadImages();
  }, []);

  const muscleGroups = [
    { id: 'pectoraux', name: 'Pectoraux', icon: '💪', color: 'red' },
    { id: 'dos', name: 'Dos', icon: '🦾', color: 'blue' },
    { id: 'epaules', name: 'Épaules', icon: '🏋️', color: 'yellow' },
    { id: 'biceps', name: 'Biceps', icon: '💪', color: 'green' },
    { id: 'triceps', name: 'Triceps', icon: '🔥', color: 'orange' },
    { id: 'abdos', name: 'Abdos', icon: '⚡', color: 'purple' },
    { id: 'jambes', name: 'Jambes', icon: '🦵', color: 'indigo' },
    { id: 'avant-bras', name: 'Avant-bras', icon: '🤜', color: 'cyan' },
    { id: 'mollets', name: 'Mollets', icon: '🦿', color: 'teal' }
  ];

  // Charger les images depuis localStorage au montage
  useState(() => {
    const savedImages = localStorage.getItem('muscleImages');
    if (savedImages) {
      setMuscleImages(JSON.parse(savedImages));
    }
  }, []);

  const handleImageUpload = (muscleId, event) => {
    event.stopPropagation();
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image est trop volumineuse (max 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onloadstart = () => setUploadingMuscle(muscleId);
    reader.onloadend = async () => {
      const imageData = reader.result;
      const newImages = { ...muscleImages, [muscleId]: imageData };
      setMuscleImages(newImages);
      
      // Utiliser IndexedDB au lieu de localStorage pour éviter QuotaExceededError
      try {
        const db = await openMuscleImagesDB();
        await saveMuscleImageToDB(db, muscleId, imageData);
        console.log(`✅ Image muscle ${muscleId} sauvegardée dans IndexedDB`);
      } catch (error) {
        console.error(`❌ Erreur sauvegarde image muscle ${muscleId}:`, error);
      }
      
      setUploadingMuscle(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = async (muscleId, event) => {
    event.stopPropagation();
    const newImages = { ...muscleImages };
    delete newImages[muscleId];
    setMuscleImages(newImages);
    
    // Supprimer de IndexedDB
    try {
      const db = await openMuscleImagesDB();
      await deleteMuscleImageFromDB(db, muscleId);
      console.log(`✅ Image muscle ${muscleId} supprimée de IndexedDB`);
    } catch (error) {
      console.error(`❌ Erreur suppression image muscle ${muscleId}:`, error);
    }
  };

  const triggerFileInput = (muscleId, event) => {
    event.stopPropagation();
    fileInputRefs.current[muscleId]?.click();
  };

  const getColorClasses = (color, isSelected, isHovered) => {
    const colors = {
      red: {
        bg: isSelected ? 'bg-red-500/30' : 'bg-red-500/10',
        border: isSelected ? 'border-red-500' : 'border-red-500/30',
        text: 'text-red-400',
        hover: 'hover:bg-red-500/20 hover:border-red-500/50'
      },
      blue: {
        bg: isSelected ? 'bg-blue-500/30' : 'bg-blue-500/10',
        border: isSelected ? 'border-blue-500' : 'border-blue-500/30',
        text: 'text-blue-400',
        hover: 'hover:bg-blue-500/20 hover:border-blue-500/50'
      },
      yellow: {
        bg: isSelected ? 'bg-yellow-500/30' : 'bg-yellow-500/10',
        border: isSelected ? 'border-yellow-500' : 'border-yellow-500/30',
        text: 'text-yellow-400',
        hover: 'hover:bg-yellow-500/20 hover:border-yellow-500/50'
      },
      green: {
        bg: isSelected ? 'bg-green-500/30' : 'bg-green-500/10',
        border: isSelected ? 'border-green-500' : 'border-green-500/30',
        text: 'text-green-400',
        hover: 'hover:bg-green-500/20 hover:border-green-500/50'
      },
      orange: {
        bg: isSelected ? 'bg-orange-500/30' : 'bg-orange-500/10',
        border: isSelected ? 'border-orange-500' : 'border-orange-500/30',
        text: 'text-orange-400',
        hover: 'hover:bg-orange-500/20 hover:border-orange-500/50'
      },
      purple: {
        bg: isSelected ? 'bg-purple-500/30' : 'bg-purple-500/10',
        border: isSelected ? 'border-purple-500' : 'border-purple-500/30',
        text: 'text-purple-400',
        hover: 'hover:bg-purple-500/20 hover:border-purple-500/50'
      },
      indigo: {
        bg: isSelected ? 'bg-indigo-500/30' : 'bg-indigo-500/10',
        border: isSelected ? 'border-indigo-500' : 'border-indigo-500/30',
        text: 'text-indigo-400',
        hover: 'hover:bg-indigo-500/20 hover:border-indigo-500/50'
      },
      cyan: {
        bg: isSelected ? 'bg-cyan-500/30' : 'bg-cyan-500/10',
        border: isSelected ? 'border-cyan-500' : 'border-cyan-500/30',
        text: 'text-cyan-400',
        hover: 'hover:bg-cyan-500/20 hover:border-cyan-500/50'
      },
      teal: {
        bg: isSelected ? 'bg-teal-500/30' : 'bg-teal-500/10',
        border: isSelected ? 'border-teal-500' : 'border-teal-500/30',
        text: 'text-teal-400',
        hover: 'hover:bg-teal-500/20 hover:border-teal-500/50'
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {muscleGroups.map((muscle) => {
        const isSelected = selected === muscle.id;
        const isHovered = hoveredMuscle === muscle.id;
        const colors = getColorClasses(muscle.color, isSelected, isHovered);
        const volume = volumeData[muscle.id] || 0;
        const hasImage = muscleImages[muscle.id];
        const isUploading = uploadingMuscle === muscle.id;

        return (
          <div
            key={muscle.id}
            className="relative group"
          >
            <button
              onClick={() => onSelect(muscle.id)}
              onMouseEnter={() => setHoveredMuscle(muscle.id)}
              onMouseLeave={() => setHoveredMuscle(null)}
              className={`relative w-full p-4 rounded-xl border-2 transition-all duration-300 ${colors.bg} ${colors.border} ${colors.hover} ${
                isSelected ? 'scale-105 shadow-lg' : ''
              }`}
              aria-label={`Sélectionner ${muscle.name}`}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-slate-900 z-10">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              <div className="space-y-2">
                {/* Image or Icon */}
                <div className="relative w-full aspect-square flex items-center justify-center">
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  ) : hasImage ? (
                    <img
                      src={hasImage}
                      alt={muscle.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-4xl">{muscle.icon}</div>
                  )}
                </div>

                {/* Name */}
                <div className={`text-sm font-bold ${colors.text}`}>
                  {muscle.name}
                </div>

                {/* Volume if enabled */}
                {showVolume && (
                  <div className="text-xs text-slate-400">
                    {volume > 0 ? `${volume} reps` : 'Aucun'}
                  </div>
                )}
              </div>

              {/* Hover glow */}
              {isHovered && (
                <div className="absolute inset-0 bg-white/5 rounded-xl pointer-events-none"></div>
              )}
            </button>

            {/* Image Controls - Visible on hover */}
            <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              {/* Upload button */}
              <button
                onClick={(e) => triggerFileInput(muscle.id, e)}
                className="p-1.5 bg-slate-900/90 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
                title="Uploader une image"
              >
                <Upload className="w-3.5 h-3.5 text-slate-300" />
              </button>

              {/* Remove button - only show if image exists */}
              {hasImage && (
                <button
                  onClick={(e) => handleRemoveImage(muscle.id, e)}
                  className="p-1.5 bg-red-900/90 hover:bg-red-800 rounded-lg border border-red-700 transition-colors"
                  title="Supprimer l'image"
                >
                  <X className="w-3.5 h-3.5 text-red-300" />
                </button>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={(el) => (fileInputRefs.current[muscle.id] = el)}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(muscle.id, e)}
              className="hidden"
            />
          </div>
        );
      })}
    </div>
  );
};

export default MuscleSelector;
