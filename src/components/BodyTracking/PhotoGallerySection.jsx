import React, { useState, useRef } from 'react';
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
  Info
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { formatDate } from '../../utils/dateUtils';

const PhotoGallerySection = () => {
  const { data, addProgressPhoto } = useWorkout();
  const fileInputRef = useRef(null);
  
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'front', 'side', 'back'
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [compareMode, setCompareMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Récupérer les vraies photos de progression
  const getProgressPhotos = () => {
    if (!data?.progressPhotos || data.progressPhotos.length === 0) {
      return [];
    }
    
    return data.progressPhotos
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(photo => ({
        id: photo.id,
        url: photo.photo || photo.url,
        date: new Date(photo.date),
        angle: photo.angle || 'front',
        weight: photo.weight,
        notes: photo.notes,
        tags: photo.tags || ['progress'],
        filename: photo.filename,
        type: photo.type
      }));
  };

  const progressPhotos = getProgressPhotos();

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        // Simulation d'upload avec progress
        setUploadProgress(0);
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              
              // Convertir le fichier en Base64 pour la persistance
              const reader = new FileReader();
              reader.onload = (e) => {
                const base64Image = e.target.result;
                
                // Créer l'entrée photo avec Base64
                const photoEntry = {
                  id: Date.now() + Math.random(),
                  url: base64Image, // Utiliser Base64 au lieu de URL.createObjectURL
                  date: new Date(),
                  angle: 'front', // Par défaut, pourrait être sélectionnable
                  weight: null, // Pourrait être récupéré des dernières métriques
                  notes: '',
                  tags: ['progress'],
                  filename: file.name,
                  type: 'photo'
                };
                
                // Sauvegarder via le contexte (IndexedDB)
                addProgressPhoto(photoEntry);
              };
              reader.onerror = () => {
                console.error('Erreur lors de la lecture du fichier');
              };
              reader.readAsDataURL(file);
              
              return 0;
            }
            return prev + 10;
          });
        }, 100);
      }
    });
  };

  const filteredPhotos = progressPhotos.filter(photo => {
    if (filterBy === 'all') return true;
    return photo.angle === filterBy;
  });

  const sortedPhotos = [...filteredPhotos].sort((a, b) => new Date(b.date) - new Date(a.date));

  const handlePhotoSelect = (photoId) => {
    setSelectedPhotos(prev => {
      if (prev.includes(photoId)) {
        return prev.filter(id => id !== photoId);
      } else if (prev.length < 2) {
        return [...prev, photoId];
      } else {
        return [prev[1], photoId];
      }
    });
  };

  const openModal = (index) => {
    setCurrentPhotoIndex(index);
    setShowModal(true);
  };

  const navigatePhoto = (direction) => {
    if (direction === 'next') {
      setCurrentPhotoIndex((prev) => (prev + 1) % sortedPhotos.length);
    } else {
      setCurrentPhotoIndex((prev) => (prev - 1 + sortedPhotos.length) % sortedPhotos.length);
    }
  };

  const getAngleIcon = (angle) => {
    switch (angle) {
      case 'front': return '👤';
      case 'side': return '🚶';
      case 'back': return '🔄';
      default: return '📷';
    }
  };

  const getAngleLabel = (angle) => {
    switch (angle) {
      case 'front': return 'Face';
      case 'side': return 'Profil';
      case 'back': return 'Dos';
      default: return 'Autre';
    }
  };

  return (
    <div className="space-y-6">
      {/* Contrôles d'upload et de vue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-green-400" />
            Galerie de progression
            <span className="text-sm font-normal text-slate-400">
              ({sortedPhotos.length} photos)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
            {/* Upload */}
            <div className="flex gap-2">
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
            </div>

            {/* Contrôles de vue */}
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
          </div>

          {/* Barre de progression d'upload */}
          {uploadProgress > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-300">Upload en cours...</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Galerie */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedPhotos.map((photo, index) => (
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
                      src={photo.url}
                      alt={`Photo ${getAngleLabel(photo.angle)} du ${formatDate(photo.date)}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Overlay avec infos */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex justify-between items-start">
                      <span className="text-xs bg-slate-800/80 px-2 py-1 rounded text-white">
                        {getAngleIcon(photo.angle)} {getAngleLabel(photo.angle)}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(index);
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
                    </div>
                  </div>

                  {/* Indicateur de sélection */}
                  {selectedPhotos.includes(photo.id) && (
                    <div className="absolute top-2 left-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {selectedPhotos.indexOf(photo.id) + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedPhotos.map((photo, index) => (
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
                      src={photo.url}
                      alt={`Photo ${getAngleLabel(photo.angle)}`}
                      className="w-full h-full object-cover"
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
                        openModal(index);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
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
        </CardContent>
      </Card>

      {/* Conseils pour les photos */}
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

      {/* Modal de visualisation */}
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
                    src={sortedPhotos[currentPhotoIndex]?.url}
                    alt="Photo de progression"
                    className="w-full max-h-[60vh] object-contain rounded"
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
                        src={photo.url}
                        alt={`Photo ${index === 0 ? 'avant' : 'après'}`}
                        className="w-full max-h-[50vh] object-contain rounded"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallerySection;