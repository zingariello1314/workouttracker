import React, { useState, useMemo } from 'react';
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
  BarChart3
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { formatDate } from '../../utils/dateUtils';
import { validateImpedanceForm } from './utils/validation';
import { useToast } from './hooks/useToast';
import logger from '../../utils/logger';

const log = logger.component('ImpedanceSection');

const ImpedanceSection = () => {
  const { data, addProgressEntry } = useWorkout();
  const { showSuccess, showError, showInfo, ToastContainer } = useToast();
  const [formData, setFormData] = useState({
    bodyFatMass: '',
    bodyFatPercentage: '',
    fatFreeWeight: '',
    skeletalMuscle: '',
    bodyWater: '',
    protein: '',
    minerals: '',
    visceralFat: '',
    subcutaneousFat: '',
    metabolicAge: '',
    basalMetabolism: '',
    muscleQuality: '',
    boneMass: '',
    bodyType: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    
    // Normaliser la date (peut être ISO string ou timestamp)
    const entryDate = lastEntry.date 
      ? new Date(lastEntry.date) 
      : (lastEntry.timestamp ? new Date(lastEntry.timestamp) : new Date());

    // Retourner la dernière mesure avec toutes ses propriétés
    return {
      bodyFatMass: lastEntry.bodyFatMass || null,
      bodyFatPercentage: lastEntry.bodyFatPercentage || null,
      fatFreeWeight: lastEntry.fatFreeWeight || null,
      skeletalMuscle: lastEntry.skeletalMuscle || null,
      bodyWater: lastEntry.bodyWater || null,
      protein: lastEntry.protein || null,
      minerals: lastEntry.minerals || null,
      visceralFat: lastEntry.visceralFat || null,
      subcutaneousFat: lastEntry.subcutaneousFat || null,
      metabolicAge: lastEntry.metabolicAge || null,
      basalMetabolism: lastEntry.basalMetabolism || null,
      muscleQuality: lastEntry.muscleQuality || null,
      boneMass: lastEntry.boneMass || null,
      bodyType: lastEntry.bodyType || null,
      date: entryDate
    };
  }, [data?.progressEntries]);

  const referenceRanges = {
    bodyFatPercentage: { 
      male: { excellent: [6, 13], good: [14, 17], fair: [18, 24], poor: [25, 100] },
      female: { excellent: [14, 20], good: [21, 24], fair: [25, 31], poor: [32, 100] }
    },
    bodyWater: {
      male: { excellent: [63, 100], good: [57, 62], fair: [50, 56], poor: [0, 49] },
      female: { excellent: [58, 100], good: [52, 57], fair: [45, 51], poor: [0, 44] }
    },
    visceralFat: {
      excellent: [1, 9], good: [10, 14], fair: [15, 19], poor: [20, 100]
    }
  };

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
    
    if (!validateForm()) {
      showError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    
    try {
      const entry = {
        ...formData,
        timestamp: new Date(formData.date).getTime()
      };
      
      // Convertir les valeurs numériques
      Object.keys(entry).forEach(key => {
        if (key !== 'date' && key !== 'notes' && key !== 'bodyType' && key !== 'timestamp' && entry[key]) {
          entry[key] = parseFloat(entry[key]);
        }
      });
      
      // Ajouter le type requis pour addProgressEntry
      const entryWithType = {
        ...entry,
        type: 'impedance'
      };
      
      // Sauvegarder l'entrée via le contexte (IndexedDB)
      // La déduplication est gérée automatiquement dans addProgressEntry
      const result = await addProgressEntry(entryWithType);
      
      // Afficher un message selon l'action effectuée (added, replaced, merged)
      if (result?.action === 'replaced') {
        showInfo('Mesure d\'impédancemétrie mise à jour (remplacement de l\'entrée existante)');
      } else if (result?.action === 'merged') {
        showInfo('Données fusionnées avec entrée existante');
      } else {
        showSuccess('Mesure d\'impédancemétrie enregistrée avec succès');
      }
      
      // Réinitialiser le formulaire uniquement si succès
      setFormData({
        bodyFatMass: '',
        bodyFatPercentage: '',
        fatFreeWeight: '',
        skeletalMuscle: '',
        bodyWater: '',
        protein: '',
        minerals: '',
        visceralFat: '',
        subcutaneousFat: '',
        metabolicAge: '',
        basalMetabolism: '',
        muscleQuality: '',
        boneMass: '',
        bodyType: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      
      // Réinitialiser les erreurs
      setErrors({});
    } catch (error) {
      log.error('Erreur lors de la sauvegarde des données d\'impédance', error);
      showError(
        error.message || 'Une erreur s\'est produite lors de l\'enregistrement. Veuillez réessayer.'
      );
      // Ne pas réinitialiser le formulaire si erreur
      // L'utilisateur peut corriger et réessayer
    }
  };

  const getHealthStatus = (value, field, gender = 'male') => {
    if (!value || !referenceRanges[field]) return null;
    
    const ranges = referenceRanges[field][gender] || referenceRanges[field];
    
    if (value >= ranges.excellent[0] && value <= ranges.excellent[1]) {
      return { status: 'Excellent', color: 'text-green-400', bg: 'bg-green-600/20' };
    } else if (value >= ranges.good[0] && value <= ranges.good[1]) {
      return { status: 'Bon', color: 'text-blue-400', bg: 'bg-blue-600/20' };
    } else if (value >= ranges.fair[0] && value <= ranges.fair[1]) {
      return { status: 'Moyen', color: 'text-yellow-400', bg: 'bg-yellow-600/20' };
    } else {
      return { status: 'À améliorer', color: 'text-red-400', bg: 'bg-red-600/20' };
    }
  };

  const getChangeIndicator = (current, previous, type = 'weight') => {
    if (!current || !previous) return null;
    
    const change = current - previous;
    const changeFormatted = formatChange(change, { type });
    const changeWithPct = formatChangeWithPercentage(change, previous, { type });
    
    if (changeFormatted.isStable || Math.abs(change) < 0.1) {
      return { icon: <Minus className="w-4 h-4 text-gray-400" />, text: 'Stable', color: 'text-gray-400' };
    } else if (change > 0) {
      return { 
        icon: <TrendingUp className="w-4 h-4 text-red-400" />, 
        text: `${changeFormatted.formatted} (${changeWithPct.percentage})`, 
        color: 'text-red-400' 
      };
    } else {
      return { 
        icon: <TrendingDown className="w-4 h-4 text-green-400" />, 
        text: `${changeFormatted.formatted} (${changeWithPct.percentage})`, 
        color: 'text-green-400' 
      };
    }
  };

  const metrics = [
    {
      category: 'Composition corporelle de base',
      items: [
        {
          key: 'bodyFatMass',
          label: 'Masse graisseuse',
          unit: 'kg',
          icon: <Activity className="w-4 h-4" />,
          description: 'Poids total de la graisse corporelle'
        },
        {
          key: 'bodyFatPercentage',
          label: 'Indice de masse grasse',
          unit: '%',
          icon: <Target className="w-4 h-4" />,
          description: 'Pourcentage de graisse par rapport au poids total',
          hasHealthStatus: true
        },
        {
          key: 'fatFreeWeight',
          label: 'Poids sans graisse',
          unit: 'kg',
          icon: <Activity className="w-4 h-4" />,
          description: 'Poids total moins la masse graisseuse'
        },
        {
          key: 'skeletalMuscle',
          label: 'Muscle squelettique',
          unit: 'kg',
          icon: <Activity className="w-4 h-4" />,
          description: 'Masse des muscles squelettiques'
        }
      ]
    },
    {
      category: 'Hydratation et composition',
      items: [
        {
          key: 'bodyWater',
          label: 'Eau du corps',
          unit: '%',
          icon: <Droplets className="w-4 h-4" />,
          description: 'Pourcentage d\'eau dans le corps',
          hasHealthStatus: true
        },
        {
          key: 'protein',
          label: 'Protéines',
          unit: '%',
          icon: <Activity className="w-4 h-4" />,
          description: 'Pourcentage de protéines dans le corps'
        },
        {
          key: 'minerals',
          label: 'Minéraux',
          unit: '%',
          icon: <Activity className="w-4 h-4" />,
          description: 'Pourcentage de minéraux dans le corps'
        }
      ]
    },
    {
      category: 'Répartition des graisses',
      items: [
        {
          key: 'visceralFat',
          label: 'Graisse viscérale',
          unit: '',
          icon: <AlertTriangle className="w-4 h-4" />,
          description: 'Niveau de graisse autour des organes internes',
          hasHealthStatus: true
        },
        {
          key: 'subcutaneousFat',
          label: 'Graisse sous-cutanée',
          unit: '%',
          icon: <Activity className="w-4 h-4" />,
          description: 'Graisse située sous la peau'
        }
      ]
    },
    {
      category: 'Métriques avancées',
      items: [
        {
          key: 'metabolicAge',
          label: 'Âge métabolique',
          unit: 'ans',
          icon: <Heart className="w-4 h-4" />,
          description: 'Âge métabolique estimé'
        },
        {
          key: 'basalMetabolism',
          label: 'Métabolisme de base',
          unit: 'kcal',
          icon: <Zap className="w-4 h-4" />,
          description: 'Calories brûlées au repos'
        },
        {
          key: 'muscleQuality',
          label: 'Qualité musculaire',
          unit: '',
          icon: <BarChart3 className="w-4 h-4" />,
          description: 'Score de qualité musculaire'
        },
        {
          key: 'boneMass',
          label: 'Masse osseuse',
          unit: 'kg',
          icon: <Activity className="w-4 h-4" />,
          description: 'Poids estimé des os'
        }
      ]
    }
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
                        value={formData[metric.key]}
                        onChange={(e) => handleInputChange(metric.key, e.target.value)}
                        className={`w-full bg-slate-700 border rounded-lg px-3 py-2 text-white ${
                          errors[metric.key] ? 'border-red-500' : 'border-slate-600'
                        }`}
                        placeholder={lastMeasurement?.[metric.key] ? `Ex: ${lastMeasurement[metric.key]}${metric.unit || ''}` : `Entrer ${metric.label.toLowerCase()}...`}
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
                            const formatted = metric.unit === '%' 
                              ? formatPercentage(value)
                              : metric.unit === 'kg'
                              ? formatWeight(value)
                              : metric.unit === 'kcal'
                              ? formatCalories(value)
                              : `${value}${metric.unit || ''}`;
                            return `${formatted} (${formatDate(lastMeasurement.date)})`;
                          })()}
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
                <option value="Underweight">Insuffisance pondérale</option>
                <option value="Normal">Normal</option>
                <option value="Overweight">Surpoids</option>
                <option value="Obese">Obèse</option>
                <option value="Athletic">Athlétique</option>
                <option value="Muscular">Musclé</option>
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
              {/* Indice de masse grasse */}
              {lastMeasurement.bodyFatPercentage != null && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    Masse grasse
                  </h4>
                  <div className="text-2xl font-bold text-white mb-1">
                    {lastMeasurement.bodyFatPercentage}%
                  </div>
                  {(() => {
                    const status = getHealthStatus(lastMeasurement.bodyFatPercentage, 'bodyFatPercentage');
                    return status && (
                      <div className={`text-sm px-2 py-1 rounded ${status.bg} ${status.color}`}>
                        {status.status}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Eau corporelle */}
              {lastMeasurement.bodyWater != null && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    Hydratation
                  </h4>
                  <div className="text-2xl font-bold text-white mb-1">
                    {lastMeasurement.bodyWater}%
                  </div>
                  {(() => {
                    const status = getHealthStatus(lastMeasurement.bodyWater, 'bodyWater');
                    return status && (
                      <div className={`text-sm px-2 py-1 rounded ${status.bg} ${status.color}`}>
                        {status.status}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Graisse viscérale */}
              {lastMeasurement.visceralFat != null && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    Graisse viscérale
                  </h4>
                  <div className="text-2xl font-bold text-white mb-1">
                    {lastMeasurement.visceralFat}
                  </div>
                  {(() => {
                    const status = getHealthStatus(lastMeasurement.visceralFat, 'visceralFat');
                    return status && (
                      <div className={`text-sm px-2 py-1 rounded ${status.bg} ${status.color}`}>
                        {status.status}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Métabolisme de base */}
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

              {/* Âge métabolique */}
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

              {/* Qualité musculaire */}
              {lastMeasurement.muscleQuality != null && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-green-400" />
                    Qualité musculaire
                  </h4>
                  <div className="text-2xl font-bold text-white mb-1">
                    {lastMeasurement.muscleQuality}
                  </div>
                  <div className="text-sm text-slate-400">score</div>
                </div>
              )}

              {/* Masse musculaire squelettique */}
              {lastMeasurement.skeletalMuscle != null && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-400" />
                    Muscle squelettique
                  </h4>
                  <div className="text-2xl font-bold text-white mb-1">
                    {lastMeasurement.skeletalMuscle} kg
                  </div>
                  <div className="text-sm text-slate-400">masse musculaire</div>
                </div>
              )}

              {/* Masse graisseuse */}
              {lastMeasurement.bodyFatMass != null && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-orange-400" />
                    Masse graisseuse
                  </h4>
                  <div className="text-2xl font-bold text-white mb-1">
                    {lastMeasurement.bodyFatMass} kg
                  </div>
                  <div className="text-sm text-slate-400">poids total graisse</div>
                </div>
              )}

              {/* Poids sans graisse */}
              {lastMeasurement.fatFreeWeight != null && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    Poids sans graisse
                  </h4>
                  <div className="text-2xl font-bold text-white mb-1">
                    {lastMeasurement.fatFreeWeight} kg
                  </div>
                  <div className="text-sm text-slate-400">masse maigre</div>
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