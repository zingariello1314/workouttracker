import React, { useState } from 'react';
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

const ImpedanceSection = () => {
  const { data, addProgressEntry } = useWorkout();
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

  // Données simulées pour l'historique et les références
  const lastMeasurement = {
    bodyFatMass: 12.8,
    bodyFatPercentage: 17.0,
    fatFreeWeight: 62.4,
    skeletalMuscle: 35.2,
    bodyWater: 58.2,
    protein: 18.5,
    minerals: 4.2,
    visceralFat: 8,
    subcutaneousFat: 15.8,
    metabolicAge: 28,
    basalMetabolism: 1680,
    muscleQuality: 85,
    boneMass: 3.1,
    bodyType: 'Athletic',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  };

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

  const validateForm = () => {
    const newErrors = {};
    
    // Validation des champs numériques
    const numericFields = [
      'bodyFatMass', 'bodyFatPercentage', 'fatFreeWeight', 'skeletalMuscle',
      'bodyWater', 'protein', 'minerals', 'visceralFat', 'subcutaneousFat',
      'metabolicAge', 'basalMetabolism', 'muscleQuality', 'boneMass'
    ];
    
    numericFields.forEach(field => {
      if (formData[field] && (isNaN(formData[field]) || formData[field] <= 0)) {
        newErrors[field] = 'Doit être un nombre positif';
      }
    });
    
    // Validations spécifiques
    if (formData.bodyFatPercentage && (formData.bodyFatPercentage < 3 || formData.bodyFatPercentage > 50)) {
      newErrors.bodyFatPercentage = 'Pourcentage de graisse corporelle invalide (3-50%)';
    }
    
    if (formData.bodyWater && (formData.bodyWater < 30 || formData.bodyWater > 80)) {
      newErrors.bodyWater = 'Pourcentage d\'eau corporelle invalide (30-80%)';
    }
    
    if (formData.visceralFat && formData.visceralFat > 30) {
      newErrors.visceralFat = 'Niveau de graisse viscérale trop élevé (max 30)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
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
    
    console.log('Nouvelle mesure d\'impédancemétrie:', entry);
    
    // Sauvegarder l'entrée via le contexte (IndexedDB)
    addProgressEntry(entry);
    
    // Réinitialiser le formulaire
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

  const getChangeIndicator = (current, previous) => {
    if (!current || !previous) return null;
    
    const change = current - previous;
    const percentage = ((change / previous) * 100).toFixed(1);
    
    if (Math.abs(change) < 0.1) {
      return { icon: <Minus className="w-4 h-4 text-gray-400" />, text: 'Stable', color: 'text-gray-400' };
    } else if (change > 0) {
      return { 
        icon: <TrendingUp className="w-4 h-4 text-red-400" />, 
        text: `+${change.toFixed(1)} (+${percentage}%)`, 
        color: 'text-red-400' 
      };
    } else {
      return { 
        icon: <TrendingDown className="w-4 h-4 text-green-400" />, 
        text: `${change.toFixed(1)} (${percentage}%)`, 
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
                        placeholder={`Ex: ${lastMeasurement[metric.key] || '0'}`}
                      />
                      {errors[metric.key] && (
                        <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errors[metric.key]}
                        </p>
                      )}
                      {lastMeasurement[metric.key] && (
                        <p className="text-slate-400 text-sm mt-1">
                          Dernière: {lastMeasurement[metric.key]}{metric.unit} ({formatDate(lastMeasurement.date)})
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
      <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Analyse des mesures actuelles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Indice de masse grasse */}
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

            {/* Eau corporelle */}
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

            {/* Graisse viscérale */}
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

            {/* Métabolisme de base */}
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

            {/* Âge métabolique */}
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

            {/* Qualité musculaire */}
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
          </div>
        </CardContent>
      </Card>

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
  );
};

export default ImpedanceSection;