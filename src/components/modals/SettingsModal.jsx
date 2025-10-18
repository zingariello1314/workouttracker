import React from 'react';
import { Settings, Trash2, Download, Upload, Zap, BarChart3, Calendar as CalendarIcon } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Select } from '../ui/Input';
import { typography } from '../../styles/typography';

const SettingsModal = ({ isOpen, onClose }) => {
  const {
    weekVariant,
    setWeekVariant,
    resetAllData,
    exportData,
    importData,
    setShowProgramEditor,
    setShowAdvancedStats,
    setShowTrainingCycles
  } = useWorkout();

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          importData(data);
          alert('Données importées avec succès !');
        } catch (error) {
          alert('Erreur lors de l\'importation des données');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleReset = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser toutes les données ? Cette action est irréversible.')) {
      resetAllData();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Paramètres" size="lg" variant="glass">
      <div className="space-y-6 p-6">
        {/* Variante de semaine */}
        <Card>
          <CardHeader>
            <CardTitle>Programme d'entraînement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className={`${typography.presets.label} block mb-2`}>
                  Variante de semaine
                </label>
                <Select
                  value={weekVariant}
                  onChange={(e) => setWeekVariant(e.target.value)}
                  className="w-full"
                >
                  <option value="A">Semaine A</option>
                  <option value="B">Semaine B</option>
                </Select>
              </div>
              
              <Button
                onClick={() => {
                  setShowProgramEditor(true);
                  onClose();
                }}
                icon={Settings}
                variant="outline"
                className="w-full"
              >
                Éditeur de programmes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Outils avancés */}
        <Card>
          <CardHeader>
            <CardTitle>Outils avancés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setShowAdvancedStats(true);
                  onClose();
                }}
                icon={BarChart3}
                variant="outline"
                className="w-full justify-start"
              >
                Statistiques avancées
              </Button>
              
              <Button
                onClick={() => {
                  setShowTrainingCycles(true);
                  onClose();
                }}
                icon={CalendarIcon}
                variant="outline"
                className="w-full justify-start"
              >
                Cycles d'entraînement
              </Button>
            </div>
          </Card.Content>
        </Card>

        {/* Sauvegarde et restauration */}
        <Card>
          <CardHeader>
            <CardTitle>Sauvegarde et restauration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                onClick={exportData}
                icon={Download}
                variant="outline"
                className="w-full justify-start"
              >
                Exporter les données
              </Button>
              
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  id="import-file"
                />
                <Button
                  onClick={() => document.getElementById('import-file').click()}
                  icon={Upload}
                  variant="outline"
                  className="w-full justify-start"
                >
                  Importer les données
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zone de danger */}
        <Card className="border-red-500/50 bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-400">Zone de danger</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleReset}
              icon={Trash2}
              variant="danger"
              className="w-full justify-start"
            >
              Réinitialiser toutes les données
            </Button>
          </CardContent>
        </Card>
      </div>
    </Modal>
  );
};

export default SettingsModal;