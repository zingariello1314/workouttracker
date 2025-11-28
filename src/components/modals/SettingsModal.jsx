import React from 'react';
import { Settings, Trash2, Download, Upload, Zap, BarChart3, Calendar as CalendarIcon } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Select } from '../ui/Input';
import { typography } from '../../styles/typography';
import { useTranslation } from '../../utils/translations';
import { useToast } from '../ui/Toast';

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
  const t = useTranslation();
  const { showSuccess, showError } = useToast();

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          importData(data);
          showSuccess(t('settings.modal.backup.importSuccess'));
        } catch (error) {
          showError(t('settings.modal.backup.importError'));
        }
      };
      reader.readAsText(file);
    }
  };

  const handleReset = () => {
    if (window.confirm(t('settings.modal.dangerZone.resetConfirm'))) {
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
            <CardTitle>{t('settings.modal.trainingProgram.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className={`${typography.presets.label} block mb-2`}>
                  {t('settings.modal.trainingProgram.weekVariant')}
                </label>
                <Select
                  value={weekVariant}
                  onChange={(e) => setWeekVariant(e.target.value)}
                  className="w-full"
                >
                  <option value="A">{t('settings.modal.trainingProgram.weekA')}</option>
                  <option value="B">{t('settings.modal.trainingProgram.weekB')}</option>
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
                {t('settings.modal.trainingProgram.programEditor')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Outils avancés */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.modal.advancedTools.title')}</CardTitle>
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
                {t('settings.modal.advancedTools.advancedStats')}
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
                {t('settings.modal.advancedTools.trainingCycles')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sauvegarde et restauration */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.modal.backup.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                onClick={exportData}
                icon={Download}
                variant="outline"
                className="w-full justify-start"
              >
                {t('settings.modal.backup.export')}
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
                  {t('settings.modal.backup.import')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zone de danger */}
        <Card className="border-red-500/50 bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-400">{t('settings.modal.dangerZone.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleReset}
              icon={Trash2}
              variant="danger"
              className="w-full justify-start"
            >
              {t('settings.modal.dangerZone.reset')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Modal>
  );
};

export default SettingsModal;