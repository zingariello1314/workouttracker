import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, 
  Zap, 
  Droplets, 
  Heart, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Save,
  Calendar,
  Info,
  AlertTriangle,
  Target,
  BarChart3,
  Scale
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useGarminData } from '../../hooks/useGarminData'; // ✅ Pour métabolisme de base Garmin
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { formatDate } from '../../utils/dateUtils';
import { validateImpedanceForm } from './utils/validation'; // ✅ Déjà importé
import { useToast } from './hooks/useToast';
import logger from '../../utils/logger';

const log = logger.component('ImpedanceSection');

const ImpedanceSection = () => {
  const { data, addProgressEntry } = useWorkout();
  const { showSuccess, showError, showInfo, ToastContainer } = useToast();
  const { loadAllData, dbReady } = useGarminData();
  const [garminBasalMetabolism, setGarminBasalMetabolism] = useState(null);

  // ✅ Charger métabolisme de base Garmin (préféré si disponible)
  useEffect(() => {
    const loadGarminData = async () => {
      try {
        if (dbReady) {
          const garminData = await loadAllData();
          // Chercher le métabolisme de base le plus récent dans dailyMetrics
          if (garminData?.dailyMetrics) {
            const dates = Object.keys(garminData.dailyMetrics).sort().reverse();
            for (const dateStr of dates) {
              const dayData = garminData.dailyMetrics[dateStr];
              // Chercher basalMetabolicRate ou restingMetabolicRate
              const bmr = dayData?.basalMetabolicRate || dayData?.restingMetabolicRate || dayData?.bmr;
              if (bmr) {
                setGarminBasalMetabolism({
                  value: bmr,
                  date: dateStr,
                  source: 'Garmin'
                });
                log.debug('Métabolisme de base Garmin chargé', { value: bmr, date: dateStr });
                break;
              }
            }
          }
        }
      } catch (error) {
        log.warn('Erreur chargement métabolisme Garmin (non bloquant)', error);
      }
    };
    
    loadGarminData();
  }, [dbReady, loadAllData]);

  // ✅ FormData avec exactement les champs demandés
  const [formData, setFormData] = useState({
    weight: '',                    // Poids en kg
    bmi: '',                       // IMC
    bodyFatPercentage: '',         // Taux de graisse corporel en pourcent
    muscleMass: '',                // Masse musculaire en kg
    bodyFatMass: '',               // Graisses corporelles en kg
    bodyFatIndex: '',              // Indice de masse grasse sur 8
    obesityLevel: '',             // Niveau d'obésité sur 5
    visceralFatIndex: '',         // Indice de graisse viscérale sur 20
    fatFreeWeight: '',            // Poids sans graisse en kg
    bodyWater: '',                // Eau du corps en pourcentage
    boneMass: '',                 // Masse osseuse en kilogrammes
    proteinPercentage: '',        // Taux de protéines en pourcent
    basalMetabolism: '',          // Taux métabolique basal (préférer Garmin)
    metabolicAge: '',             // Âge métabolique
    bodyType: '',                 // Type de corps
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // 🔍 CHARGER LA DERNIÈRE MESURE D'IMPÉDANCE DEPUIS INDEXEDDB
  const lastMeasurement = useMemo(() => {
    if (!data?.progressEntries || data.progressEntries.length === 0) {
      return null;
    }

    // Filtrer les entrées de type 'impedance' et trier par date décroissante
    const impedanceEntries = data.progressEntries
      .filter(entry => entry.type === 'impedance')
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : (a.timestamp ? new Date(a.timestamp) : new Date(0));
        const dateB = b.date ? new Date(b.date) : (b.timestamp ? new Date(b.timestamp) : new Date(0));
        return dateB - dateA; // Plus récent en premier
      });

    if (impedanceEntries.length === 0) {
      return null;
    }

    const lastEntry = impedanceEntries[0];
    
    // Normaliser la date
    const entryDate = lastEntry.date 
      ? new Date(lastEntry.date) 
      : (lastEntry.timestamp ? new Date(lastEntry.timestamp) : new Date());

    // Retourner avec mapping des anciens champs vers nouveaux si nécessaire
    return {
      weight: lastEntry.weight || null,
      bmi: lastEntry.bmi || null,
      bodyFatPercentage: lastEntry.bodyFatPercentage || null,
      muscleMass: lastEntry.muscleMass || lastEntry.skeletalMuscle || null, // Compatibilité
      bodyFatMass: lastEntry.bodyFatMass || null,
      bodyFatIndex: lastEntry.bodyFatIndex || null,
      obesityLevel: lastEntry.obesityLevel || null,
      visceralFatIndex: lastEntry.visceralFatIndex || lastEntry.visceralFat || null, // Compatibilité
      fatFreeWeight: lastEntry.fatFreeWeight || null,
      bodyWater: lastEntry.bodyWater || null,
      boneMass: lastEntry.boneMass || null,
      proteinPercentage: lastEntry.proteinPercentage || lastEntry.protein || null, // Compatibilité
      basalMetabolism: lastEntry.basalMetabolism || null,
      metabolicAge: lastEntry.metabolicAge || null,
      bodyType: lastEntry.bodyType || null,
      date: entryDate
    };
  }, [data?.progressEntries]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // ✅ Calcul automatique IMC si poids disponible
  useEffect(() => {
    if (formData.weight && data?.userProfile?.height) {
      const heightInMeters = parseFloat(data.userProfile.height) / 100;
      const weightInKg = parseFloat(formData.weight);
      if (heightInMeters > 0 && weightInKg > 0) {
        const calculatedBMI = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1);
        if (formData.bmi !== calculatedBMI) {
          setFormData(prev => ({ ...prev, bmi: calculatedBMI }));
        }
      }
    }
  }, [formData.weight, data?.userProfile?.height]);

  // ✅ Préremplir métabolisme de base avec valeur Garmin si disponible et champ vide
  useEffect(() => {
    if (garminBasalMetabolism && !formData.basalMetabolism) {
      setFormData(prev => ({ ...prev, basalMetabolism: String(garminBasalMetabolism.value) }));
      log.debug('Métabolisme Garmin prérempli dans formulaire', { value: garminBasalMetabolism.value });
    }
  }, [garminBasalMetabolism]);

  // 🔍 Validation complète avec module centralisé
  const validateForm = () => {
    const validation = validateImpedanceForm(
      formData,
      data?.progressEntries || [],
      { skipDuplicateCheck: false, skipConsistencyCheck: false }
    );
    
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ Valider et afficher erreurs détaillées si présentes
    const validationResult = validateImpedanceForm(
      formData,
      data?.progressEntries || [],
      { skipDuplicateCheck: false, skipConsistencyCheck: false }
    );
    
    setErrors(validationResult.errors);
    
    if (!validationResult.isValid) {
      // ✅ Afficher erreurs détaillées pour debugging
      const errorFields = Object.keys(validationResult.errors);
      log.warn('Erreurs validation formulaire', { 
        errors: validationResult.errors,
        errorFields,
        formData: Object.keys(formData).reduce((acc, key) => {
          if (formData[key]) acc[key] = formData[key];
          return acc;
        }, {})
      });
      
      if (errorFields.length > 0) {
        showError(`Erreurs dans les champs: ${errorFields.join(', ')}`);
      } else {
        showError('Veuillez corriger les erreurs dans le formulaire');
      }
      return;
    }
    
    try {
      const entry = {
        ...formData,
        timestamp: new Date(formData.date).getTime()
      };
      
      // ✅ PRÉFÉRER métabolisme de base Garmin si disponible (plus juste selon utilisateur)
      // Si Garmin disponible, l'utiliser même si utilisateur a saisi une valeur
      if (garminBasalMetabolism) {
        if (entry.basalMetabolism && entry.basalMetabolism !== garminBasalMetabolism.value) {
          // Utilisateur a saisi une valeur différente -> utiliser Garmin et informer
          showInfo(`Métabolisme Garmin préféré: ${garminBasalMetabolism.value} kcal (au lieu de ${entry.basalMetabolism} kcal saisie)`);
        }
        entry.basalMetabolism = garminBasalMetabolism.value;
        entry.basalMetabolismSource = 'Garmin';
      } else if (entry.basalMetabolism) {
        // Pas de Garmin mais valeur saisie -> OK
        entry.basalMetabolismSource = 'Manual';
      }
      
      // Convertir les valeurs numériques
      Object.keys(entry).forEach(key => {
        if (key !== 'date' && key !== 'notes' && key !== 'bodyType' && key !== 'timestamp' && key !== 'basalMetabolismSource' && entry[key]) {
          entry[key] = parseFloat(entry[key]);
        }
      });
      
      // Ajouter le type requis
      const entryWithType = {
        ...entry,
        type: 'impedance'
      };
      
      // Sauvegarder
      const result = await addProgressEntry(entryWithType);
      
      if (result?.action === 'replaced') {
        showInfo('Mesure d\'impédancemétrie mise à jour (remplacement de l\'entrée existante)');
      } else if (result?.action === 'merged') {
        showInfo('Données fusionnées avec entrée existante');
      } else {
        showSuccess('Mesure d\'impédancemétrie enregistrée avec succès');
      }
      
      // Réinitialiser le formulaire
      setFormData({
        weight: '',
        bmi: '',
        bodyFatPercentage: '',
        muscleMass: '',
        bodyFatMass: '',
        bodyFatIndex: '',
        obesityLevel: '',
        visceralFatIndex: '',
        fatFreeWeight: '',
        bodyWater: '',
        boneMass: '',
        proteinPercentage: '',
        basalMetabolism: '',
        metabolicAge: '',
        bodyType: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      
      setErrors({});
    } catch (error) {
      log.error('Erreur lors de la sauvegarde des données d\'impédance', error);
      showError(
        error.message || 'Une erreur s\'est produite lors de l\'enregistrement. Veuillez réessayer.'
      );
    }
  };

  // ✅ Métriques avec exactement les champs demandés
  const metrics = [
    {
      category: 'Métriques de base',
      items: [
        {
          key: 'weight',
          label: 'Poids',
          unit: 'kg',
          icon: <Scale className="w-4 h-4" />,
          description: 'Poids corporel total'
        },
        {
          key: 'bmi',
          label: 'IMC',
          unit: '',
          icon: <Activity className="w-4 h-4" />,
          description: 'Indice de masse corporelle (calculé automatiquement si taille disponible)'
        },
        {
          key: 'bodyFatPercentage',
          label: 'Taux de graisse corporel',
          unit: '%',
          icon: <Target className="w-4 h-4" />,
          description: 'Pourcentage de graisse par rapport au poids total'
        },
        {
          key: 'muscleMass',
          label: 'Masse musculaire',
          unit: 'kg',
          icon: <Activity className="w-4 h-4" />,
          description: 'Masse des muscles'
        },
        {
          key: 'bodyFatMass',
          label: 'Graisses corporelles',
          unit: 'kg',
          icon: <Activity className="w-4 h-4" />,
          description: 'Poids total de la graisse corporelle'
        }
      ]
    },
    {
      category: 'Indices et niveaux',
      items: [
        {
          key: 'bodyFatIndex',
          label: 'Indice de masse grasse',
          unit: '/8',
          icon: <Target className="w-4 h-4" />,
          description: 'Indice de masse grasse sur une échelle de 8'
        },
        {
          key: 'obesityLevel',
          label: 'Niveau d\'obésité',
          unit: '/5',
          icon: <AlertTriangle className="w-4 h-4" />,
          description: 'Niveau d\'obésité sur une échelle de 5'
        },
        {
          key: 'visceralFatIndex',
          label: 'Indice de graisse viscérale',
          unit: '/20',
          icon: <AlertTriangle className="w-4 h-4" />,
          description: 'Indice de graisse viscérale sur une échelle de 20'
        }
      ]
    },
    {
      category: 'Composition corporelle',
      items: [
        {
          key: 'fatFreeWeight',
          label: 'Poids sans graisse',
          unit: 'kg',
          icon: <Activity className="w-4 h-4" />,
          description: 'Poids total moins la masse graisseuse'
        },
        {
          key: 'bodyWater',
          label: 'Eau du corps',
          unit: '%',
          icon: <Droplets className="w-4 h-4" />,
          description: 'Pourcentage d\'eau dans le corps'
        },
        {
          key: 'boneMass',
          label: 'Masse osseuse',
          unit: 'kg',
          icon: <Activity className="w-4 h-4" />,
          description: 'Poids estimé des os'
        },
        {
          key: 'proteinPercentage',
          label: 'Taux de protéines',
          unit: '%',
          icon: <Activity className="w-4 h-4" />,
          description: 'Pourcentage de protéines dans le corps'
        }
      ]
    },
    {
      category: 'Métabolisme',
      items: [
        {
          key: 'basalMetabolism',
          label: 'Taux métabolique basal',
          unit: 'kcal',
          icon: <Zap className="w-4 h-4" />,
          description: garminBasalMetabolism 
            ? `Préférer valeur Garmin: ${garminBasalMetabolism.value} kcal (${formatDate(garminBasalMetabolism.date)})`
            : 'Calories brûlées au repos (Garmin disponible si connecté)'
        },
        {
          key: 'metabolicAge',
          label: 'Âge métabolique',
          unit: 'ans',
          icon: <Heart className="w-4 h-4" />,
          description: 'Âge métabolique estimé'
        }
      ]
    }
  ];

  // ✅ Types de corps exacts demandés
  const bodyTypes = [
    { value: 'mince', label: 'Mince' },
    { value: 'fin_mince', label: 'Fin mince' },
    { value: 'standard', label: 'Standard' },
    { value: 'obese', label: 'Obèse' },
    { value: 'surpoids', label: 'Surpoids' },
    { value: 'athletique', label: 'Athlétique' },
    { value: 'surpoids_cache', label: 'Surpoids caché' }
  ];

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
      {/* Formulaire de saisie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            Données d'impédancemétrie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date de mesure
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
            </div>

            {/* Métriques par catégorie */}
            {metrics.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  {category.category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.items.map((metric) => (
                    <div key={metric.key}>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {metric.icon}
                        <span className="ml-2">{metric.label}</span>
                        {metric.unit && <span className="text-slate-400"> ({metric.unit})</span>}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min={metric.unit?.includes('/') ? 0 : undefined}
                        max={metric.unit === '/8' ? 8 : metric.unit === '/5' ? 5 : metric.unit === '/20' ? 20 : undefined}
                        value={formData[metric.key]}
                        onChange={(e) => handleInputChange(metric.key, e.target.value)}
                        className={`w-full bg-slate-700 border rounded-lg px-3 py-2 text-white ${
                          errors[metric.key] ? 'border-red-500' : 'border-slate-600'
                        }`}
                        placeholder={
                          metric.key === 'basalMetabolism' && garminBasalMetabolism
                            ? `${garminBasalMetabolism.value} (Garmin recommandé)`
                            : lastMeasurement?.[metric.key] 
                            ? `Ex: ${lastMeasurement[metric.key]}${metric.unit || ''}` 
                            : `Entrer ${metric.label.toLowerCase()}...`
                        }
                      />
                      {errors[metric.key] && (
                        <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errors[metric.key]}
                        </p>
                      )}
                      {lastMeasurement?.[metric.key] != null && (
                        <p className="text-slate-400 text-sm mt-1">
                          Dernière: {(() => {
                            const value = lastMeasurement[metric.key];
                            let formatted;
                            if (metric.unit === '%') {
                              formatted = `${value}%`;
                            } else if (metric.unit === 'kg') {
                              formatted = `${value} kg`;
                            } else if (metric.unit === 'kcal') {
                              formatted = `${value} kcal`;
                            } else if (metric.unit) {
                              formatted = `${value}${metric.unit}`;
                            } else {
                              formatted = String(value);
                            }
                            return `${formatted} (${formatDate(lastMeasurement.date)})`;
                          })()}
                        </p>
                      )}
                      {metric.key === 'basalMetabolism' && garminBasalMetabolism && (
                        <p className="text-blue-400 text-sm mt-1 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          Garmin disponible: {garminBasalMetabolism.value} kcal ({formatDate(garminBasalMetabolism.date)})
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">{metric.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Type de corps */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Type de corps
              </label>
              <select
                value={formData.bodyType}
                onChange={(e) => handleInputChange('bodyType', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Sélectionner...</option>
                {bodyTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Notes (optionnel)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                rows="3"
                placeholder="Conditions de mesure, observations..."
              />
            </div>

            <Button type="submit" className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Enregistrer les mesures
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Analyse des dernières mesures */}
      {lastMeasurement ? (
        <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Analyse des dernières mesures
              <span className="text-sm font-normal text-slate-400">
                ({formatDate(lastMeasurement.date)})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Affichage des métriques principales */}
              {lastMeasurement.weight != null && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-blue-400" />
                    Poids
                  </h4>
                  <div className="text-2xl font-bold text-white mb-1">
                    {lastMeasurement.weight} kg
                  </div>
                </div>
              )}
              
              {lastMeasurement.bmi != null && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    IMC
                  </h4>
                  <div className="text-2xl font-bold text-white mb-1">
                    {lastMeasurement.bmi}
                  </div>
                </div>
              )}

              {lastMeasurement.bodyFatPercentage != null && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    Graisse corporelle
                  </h4>
                  <div className="text-2xl font-bold text-white mb-1">
                    {lastMeasurement.bodyFatPercentage}%
                  </div>
                </div>
              )}

              {lastMeasurement.muscleMass != null && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-400" />
                    Masse musculaire
                  </h4>
                  <div className="text-2xl font-bold text-white mb-1">
                    {lastMeasurement.muscleMass} kg
                  </div>
                </div>
              )}

              {lastMeasurement.bodyWater != null && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    Hydratation
                  </h4>
                  <div className="text-2xl font-bold text-white mb-1">
                    {lastMeasurement.bodyWater}%
                  </div>
                </div>
              )}

              {lastMeasurement.visceralFatIndex != null && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    Graisse viscérale
                  </h4>
                  <div className="text-2xl font-bold text-white mb-1">
                    {lastMeasurement.visceralFatIndex}/20
                  </div>
                </div>
              )}

              {lastMeasurement.basalMetabolism != null && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    Métabolisme
                  </h4>
                  <div className="text-2xl font-bold text-white mb-1">
                    {lastMeasurement.basalMetabolism}
                  </div>
                  <div className="text-sm text-slate-400">kcal/jour</div>
                </div>
              )}

              {lastMeasurement.metabolicAge != null && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-400" />
                    Âge métabolique
                  </h4>
                  <div className="text-2xl font-bold text-white mb-1">
                    {lastMeasurement.metabolicAge}
                  </div>
                  <div className="text-sm text-slate-400">ans</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30">
          <CardContent className="p-6 text-center">
            <Zap className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <h4 className="text-lg font-semibold text-white mb-2">Aucune mesure d'impédance enregistrée</h4>
            <p className="text-slate-400">
              Enregistrez votre première mesure d'impédancemétrie pour voir les analyses et tendances.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Conseils d'utilisation */}
      <Card className="bg-blue-600/10 border-blue-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-200 mb-2">Conseils pour des mesures précises</h4>
              <ul className="text-sm text-blue-100 space-y-1">
                <li>• Effectuez les mesures le matin à jeun, après être allé aux toilettes</li>
                <li>• Évitez l'exercice intense 12h avant la mesure</li>
                <li>• Maintenez une hydratation normale (pas de déshydratation ni de surhydratation)</li>
                <li>• Retirez bijoux et objets métalliques</li>
                <li>• Restez immobile pendant la mesure</li>
                <li>• Effectuez les mesures dans les mêmes conditions pour un suivi cohérent</li>
                {garminBasalMetabolism && (
                  <li className="text-blue-300">• ⚡ Métabolisme de base Garmin disponible: {garminBasalMetabolism.value} kcal (recommandé)</li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default ImpedanceSection;
