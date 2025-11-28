/**
 * 🔔 NOTIFICATION DE NETTOYAGE - BODY TRACKING
 * 
 * Affiche une notification pour proposer le nettoyage des données anciennes
 * après 90 jours, avec possibilité de décliner et replanifier.
 */
import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  Calendar, 
  AlertCircle, 
  X, 
  CheckCircle,
  Clock,
  Info
} from 'lucide-react';
import { useWorkout } from '../../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import { getCleanupPreview, cleanupBodyTrackingData, shouldShowCleanupNotification } from '../utils/dataCleanup';
import { useToast } from '../hooks/useToast';
import logger from '../../../utils/logger';
import { useTranslation } from '../../../utils/translations';

const log = logger.component('CleanupNotification');

const CleanupNotification = () => {
  const t = useTranslation();
  const { data, updateData } = useWorkout();
  const { showSuccess, showInfo, ToastContainer } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Vérifier si notification doit être affichée (90 jours depuis dernière vérification)
  useEffect(() => {
    const checkCleanupNeeded = () => {
      try {
        if (shouldShowCleanupNotification(data, 90)) {
          const preview = getCleanupPreview(data);
          
          // Afficher seulement si des données peuvent être nettoyées
          if (preview.photos.toRemove > 0 || preview.progressEntries.toRemove > 0) {
            setPreview(preview);
            setIsVisible(true);
            log.info('Notification de nettoyage affichée', preview);
          }
        }
      } catch (error) {
        log.error('Erreur lors de la vérification du nettoyage:', error);
      }
    };

    checkCleanupNeeded();
  }, [data]);

  const handleCleanup = async () => {
    setIsProcessing(true);
    
    try {
      const cleaned = cleanupBodyTrackingData(data, {
        photos: { maxAgeDays: 90, keepMinimum: 5, enabled: true },
        progressEntries: { maxAgeDays: 365, keepMinimum: 30, enabled: true }
      });

      if (cleaned.stats.photos.removed > 0 || cleaned.stats.progressEntries.removed > 0) {
        await updateData(cleaned.cleaned);
        
        showSuccess(
          `Nettoyage effectué : ${cleaned.stats.photos.removed} photo(s), ` +
          `${cleaned.stats.progressEntries.removed} entrée(s) supprimée(s) ` +
          `(${cleaned.stats.totalRemovedSizeKB.toFixed(2)}KB libérés)`
        );
        
        setIsVisible(false);
        log.info('Nettoyage effectué avec succès', cleaned.stats);
      }
    } catch (error) {
      log.error('Erreur lors du nettoyage:', error);
      showInfo(t('messages.errors.cleanupGeneric'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    try {
      // Replanifier la notification dans 30 jours
      const nextCheckDate = new Date();
      nextCheckDate.setDate(nextCheckDate.getDate() + 30);
      
      const updatedData = {
        ...data,
        cleanupNotification: {
          lastShown: new Date().toISOString(),
          nextCheck: nextCheckDate.toISOString(),
          declined: true
        }
      };
      
      await updateData(updatedData);
      setIsVisible(false);
      showInfo('Notification replanifiée dans 30 jours');
      log.info('Nettoyage décliné, replanifié dans 30 jours');
    } catch (error) {
      log.error('Erreur lors de la replanification:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible || !preview) {
    return <ToastContainer />;
  }

  return (
    <>
      <ToastContainer />
      <Card className="bg-yellow-900/20 border-yellow-700 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-300">
            <AlertCircle className="w-6 h-6" />
            Nettoyage des données anciennes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-300 mb-4">
              Vos données de suivi corporel contiennent des éléments anciens qui peuvent être nettoyés pour optimiser l'espace de stockage.
            </p>
            
            <div className="space-y-2 text-sm">
              {preview.photos.toRemove > 0 && (
                <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300">Photos anciennes (&gt; 90 jours)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-yellow-400 font-semibold">{preview.photos.toRemove}</span>
                    <span className="text-slate-400 ml-1">photo(s)</span>
                    <div className="text-xs text-slate-500">
                      {preview.photos.sizeToFreeKB > 0 && `~${preview.photos.sizeToFreeKB.toFixed(0)}KB`}
                    </div>
                  </div>
                </div>
              )}
              
              {preview.progressEntries.toRemove > 0 && (
                <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-purple-400" />
                    <span className="text-slate-300">Entrées anciennes (&gt; 365 jours)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-yellow-400 font-semibold">{preview.progressEntries.toRemove}</span>
                    <span className="text-slate-400 ml-1">entrée(s)</span>
                  </div>
                </div>
              )}
              
              {preview.totalSizeToFreeKB > 0 && (
                <div className="mt-3 p-2 bg-blue-600/20 border border-blue-500/30 rounded">
                  <div className="flex items-center gap-2 text-blue-300">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Espace libéré estimé : ~{preview.totalSizeToFreeKB.toFixed(0)}KB
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-200">
                <strong>Note :</strong> Les 5 photos et 30 entrées les plus récentes seront toujours conservées, même si elles dépassent la limite d'âge.
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleCleanup}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isProcessing ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Nettoyage en cours...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Nettoyer maintenant
                </>
              )}
            </Button>
            
            <Button
              onClick={handleDecline}
              disabled={isProcessing}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Rappeler dans 30 jours
            </Button>
            
            <Button
              onClick={handleDismiss}
              disabled={isProcessing}
              variant="ghost"
              className="text-slate-400 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default CleanupNotification;

