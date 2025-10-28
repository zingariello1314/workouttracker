import React, { useState } from 'react';
import { 
  Scale, 
  Ruler, 
  Calculator, 
  Save, 
  Plus, 
  Calendar,
  TrendingUp,
  Target,
  AlertCircle,
  Info
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { formatDate } from '../../utils/dateUtils';

const MetricsSection = () => {
  const { data, addProgressEntry } = useWorkout();
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    waist: '',
    chest: '',
    arms: '',
    thighs: '',
    neck: '',
    hips: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [showCalculations, setShowCalculations] = useState(true);
  const [errors, setErrors] = useState({});

  // Récupérer la dernière entrée réelle des données
  const getLastEntry = () => {
    if (!data?.progressEntries || data.progressEntries.length === 0) {
      return null;
    }
    
    // Trouver la dernière entrée de type 'metrics'
    const metricsEntries = data.progressEntries
      .filter(entry => entry.type === 'metrics')
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return metricsEntries.length > 0 ? metricsEntries[0] : null;
  };

  const lastEntry = getLastEntry();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur si elle existe
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.weight || isNaN(formData.weight) || formData.weight <= 0) {
      newErrors.weight = 'Le poids doit être un nombre positif';
    }
    
    if (formData.height && (isNaN(formData.height) || formData.height <= 0)) {
      newErrors.height = 'La taille doit être un nombre positif';
    }
    
    // Validation des mensurations
    const measurements = ['waist', 'chest', 'arms', 'thighs', 'neck', 'hips'];
    measurements.forEach(field => {
      if (formData[field] && (isNaN(formData[field]) || formData[field] <= 0)) {
        newErrors[field] = 'La mesure doit être un nombre positif';
      }
    });
    
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
      weight: parseFloat(formData.weight),
      height: formData.height ? parseFloat(formData.height) : null,
      waist: formData.waist ? parseFloat(formData.waist) : null,
      chest: formData.chest ? parseFloat(formData.chest) : null,
      arms: formData.arms ? parseFloat(formData.arms) : null,
      thighs: formData.thighs ? parseFloat(formData.thighs) : null,
      neck: formData.neck ? parseFloat(formData.neck) : null,
      hips: formData.hips ? parseFloat(formData.hips) : null,
      timestamp: new Date(formData.date).getTime(),
      type: 'metrics'
    };
    
    // Sauvegarder l'entrée via le contexte (IndexedDB)
    addProgressEntry(entry);
    
    // Réinitialiser le formulaire
    setFormData({
      weight: '',
      height: '',
      waist: '',
      chest: '',
      arms: '',
      thighs: '',
      neck: '',
      hips: '',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const calculateBMI = () => {
    const weight = parseFloat(formData.weight) || (lastEntry?.weight || null);
    const height = parseFloat(formData.height) || (lastEntry?.height || null);
    
    if (weight && height) {
      const heightInM = height / 100;
      return (weight / (heightInM * heightInM)).toFixed(1);
    }
    return null;
  };

  const calculateIdealWeight = () => {
    const height = parseFloat(formData.height) || (lastEntry?.height || null);
    
    if (height) {
      // Formule de Lorentz (approximative)
      const idealWeight = height - 100 - ((height - 150) / 4);
      return Math.max(idealWeight, 45).toFixed(1);
    }
    return null;
  };

  const getWeightDifference = () => {
    if (formData.weight && lastEntry?.weight) {
      const diff = parseFloat(formData.weight) - lastEntry.weight;
      return diff.toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return null;
    const bmiValue = parseFloat(bmi);
    
    if (bmiValue < 18.5) return { category: 'Insuffisance pondérale', color: 'text-blue-400' };
    if (bmiValue < 25) return { category: 'Poids normal', color: 'text-green-400' };
    if (bmiValue < 30) return { category: 'Surpoids', color: 'text-yellow-400' };
    return { category: 'Obésité', color: 'text-red-400' };
  };

  const bmi = calculateBMI();
  const idealWeight = calculateIdealWeight();
  const weightDiff = getWeightDifference();
  const bmiCategory = getBMICategory(bmi);

  return (
    <div className="space-y-6">
      {/* Formulaire de saisie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-400" />
            Saisie des métriques corporelles
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

            {/* Métriques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Scale className="w-4 h-4 inline mr-2" />
                  Poids (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className={`w-full bg-slate-700 border rounded-lg px-3 py-2 text-white ${
                    errors.weight ? 'border-red-500' : 'border-slate-600'
                  }`}
                  placeholder="Ex: 75.2"
                />
                {errors.weight && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.weight}
                  </p>
                )}
                {lastEntry?.weight && (
                  <p className="text-slate-400 text-sm mt-1">
                    Dernière mesure: {lastEntry.weight} kg ({formatDate(lastEntry.date)})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Ruler className="w-4 h-4 inline mr-2" />
                  Taille (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  className={`w-full bg-slate-700 border rounded-lg px-3 py-2 text-white ${
                    errors.height ? 'border-red-500' : 'border-slate-600'
                  }`}
                  placeholder="Ex: 175"
                />
                {errors.height && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.height}
                  </p>
                )}
                {lastEntry?.height && (
                  <p className="text-slate-400 text-sm mt-1">
                    Dernière mesure: {lastEntry.height} cm
                  </p>
                )}
              </div>
            </div>

            {/* Mensurations */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                📏 Mensurations corporelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { key: 'waist', label: 'Tour de taille', last: lastEntry?.waist },
                  { key: 'chest', label: 'Tour de poitrine', last: lastEntry?.chest },
                  { key: 'arms', label: 'Tour de bras', last: lastEntry?.arms },
                  { key: 'thighs', label: 'Tour de cuisse', last: lastEntry?.thighs },
                  { key: 'neck', label: 'Tour de cou', last: lastEntry?.neck },
                  { key: 'hips', label: 'Tour de hanches', last: lastEntry?.hips }
                ].map(({ key, label, last }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {label} (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData[key]}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className={`w-full bg-slate-700 border rounded-lg px-3 py-2 text-white ${
                        errors[key] ? 'border-red-500' : 'border-slate-600'
                      }`}
                      placeholder={`Ex: ${last || '80'}`}
                    />
                    {errors[key] && (
                      <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors[key]}
                      </p>
                    )}
                    {last && (
                      <p className="text-slate-400 text-sm mt-1">
                        Dernier: {last} cm
                      </p>
                    )}
                  </div>
                ))}
              </div>
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
                placeholder="Commentaires, conditions de mesure, objectifs..."
              />
            </div>

            <Button type="submit" className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Enregistrer les mesures
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Calculs automatiques */}
      {showCalculations && (
        <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-purple-400" />
              Calculs automatiques
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCalculations(!showCalculations)}
                className="ml-auto"
              >
                {showCalculations ? 'Masquer' : 'Afficher'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* IMC */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-400" />
                  Indice de Masse Corporelle
                </h4>
                {bmi ? (
                  <div>
                    <div className="text-2xl font-bold text-white mb-1">{bmi}</div>
                    {bmiCategory && (
                      <div className={`text-sm ${bmiCategory.color}`}>
                        {bmiCategory.category}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-400 text-sm">
                    Saisissez poids et taille
                  </div>
                )}
              </div>

              {/* Poids idéal */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-400" />
                  Poids idéal estimé
                </h4>
                {idealWeight ? (
                  <div>
                    <div className="text-2xl font-bold text-white mb-1">{idealWeight} kg</div>
                    <div className="text-sm text-slate-400">
                      Formule de Lorentz
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 text-sm">
                    Saisissez la taille
                  </div>
                )}
              </div>

              {/* Évolution */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-yellow-400" />
                  Évolution du poids
                </h4>
                {weightDiff ? (
                  <div>
                    <div className={`text-2xl font-bold mb-1 ${
                      parseFloat(weightDiff) > 0 ? 'text-red-400' : 
                      parseFloat(weightDiff) < 0 ? 'text-green-400' : 'text-slate-400'
                    }`}>
                      {parseFloat(weightDiff) > 0 ? '+' : ''}{weightDiff} kg
                    </div>
                    <div className="text-sm text-slate-400">
                      Depuis 7 jours
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 text-sm">
                    Saisissez le poids
                  </div>
                )}
              </div>
            </div>

            {/* Conseils automatiques */}
            {bmi && (
              <div className="mt-6 p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-blue-200 mb-1">Conseil personnalisé</h5>
                    <p className="text-blue-100 text-sm">
                      {parseFloat(bmi) < 18.5 && "Votre IMC indique une insuffisance pondérale. Consultez un professionnel de santé pour un plan nutritionnel adapté."}
                      {parseFloat(bmi) >= 18.5 && parseFloat(bmi) < 25 && "Excellent ! Votre IMC est dans la zone normale. Maintenez vos bonnes habitudes."}
                      {parseFloat(bmi) >= 25 && parseFloat(bmi) < 30 && "Votre IMC indique un léger surpoids. Une activité physique régulière peut vous aider."}
                      {parseFloat(bmi) >= 30 && "Votre IMC indique une obésité. Il est recommandé de consulter un professionnel de santé."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MetricsSection;