import React from 'react';
import { Camera, Plus, Trash2, Calendar } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { formatDate } from '../../utils/dateUtils';

const ProgressTab = () => {
  const {
    data,
    progressForm,
    setProgressForm,
    addProgressPhoto,
    deleteProgressPhoto
  } = useWorkout();

  const handleAddPhoto = () => {
    if (progressForm.weight && progressForm.notes) {
      addProgressPhoto(progressForm);
      setProgressForm({ weight: '', notes: '', photo: null });
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProgressForm(prev => ({ ...prev, photo: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Formulaire d'ajout */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Ajouter une photo de progrès
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Poids (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={progressForm.weight}
                onChange={(e) => setProgressForm(prev => ({ ...prev, weight: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                placeholder="Ex: 70.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={progressForm.notes}
                onChange={(e) => setProgressForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                rows="3"
                placeholder="Comment vous sentez-vous ? Objectifs atteints ?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Photo (optionnel)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
              />
              {progressForm.photo && (
                <div className="mt-2">
                  <img
                    src={progressForm.photo}
                    alt="Aperçu"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </Card.Content>
        <Card.Footer>
          <Button
            onClick={handleAddPhoto}
            disabled={!progressForm.weight || !progressForm.notes}
            icon={Camera}
            className="w-full"
          >
            Ajouter la photo de progrès
          </Button>
        </Card.Footer>
      </Card>

      {/* Liste des photos de progrès */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-white">Historique des progrès</h3>
        
        {!data.progressPhotos || data.progressPhotos.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-gray-400">
              <Camera className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h4 className="text-xl font-semibold mb-2 text-white">Aucune photo de progrès</h4>
              <p className="text-gray-400">Ajoutez votre première photo pour suivre votre évolution.</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.progressPhotos.map((progress, index) => (
              <Card key={index} className="overflow-hidden">
                {progress.photo && (
                  <div className="aspect-square">
                    <img
                      src={progress.photo}
                      alt={`Progrès du ${formatDate(new Date(progress.date))}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <Card.Content className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center text-sm text-gray-300">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(new Date(progress.date))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteProgressPhoto(index)}
                      icon={Trash2}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    />
                  </div>
                  
                  <div className="mb-2">
                    <span className="font-semibold text-lg text-white">{progress.weight} kg</span>
                  </div>
                  
                  <p className="text-sm text-gray-300">{progress.notes}</p>
                </Card.Content>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressTab;