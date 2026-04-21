import React, { useState, useMemo } from 'react';
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
import { validateMetricsForm } from './utils/validation';
import { useToast } from './hooks/useToast';
import logger from '../../utils/logger';
import { useTranslation } from '../../utils/translations';
import { useFormatters } from '../../utils/translations/formatters-hook';

const log = logger.component('MetricsSection');

const MetricsSection = () => {
  const { data, addProgressEntry } = useWorkout();
  const { showSuccess, showError, showInfo, ToastContainer } = useToast();
  const t = useTranslation();
  const { formatDate: formatLocaleDate } = useFormatters();
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

  // 🔍 Récupérer la dernière entrée réelle des données (MEMOIZED)
  const lastEntry = useMemo(() => {
    if (!data?.progressEntries || data.progressEntries.length === 0) {
      return null;
    }
    
    // Trouver la dernière entrée de type 'metrics'
    const metricsEntries = data.progressEntries
      .filter(entry => entry.type === 'metrics')
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : (a.timestamp ? new Date(a.timestamp) : new Date(0));
        const dateB = b.date ? new Date(b.date) : (b.timestamp ? new Date(b.timestamp) : new Date(0));
        return dateB - dateA; // Plus récent en premier
      });
    
    return metricsEntries.length > 0 ? metricsEntries[0] : null;
  }, [data?.progressEntries]);

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

  // 🔍 Validation complète avec module centralisé
  const validateForm = () => {
    const validation = validateMetricsForm(
      formData,
      data?.progressEntries || [],
      { skipDuplicateCheck: false, skipBMICheck: false }
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
      const result = await addProgressEntry(entry);
      
      // Afficher message selon action (added, replaced, merged)
      if (result?.action === 'replaced') {
        showInfo('Mesure mise à jour (remplacement de l\'entrée existante)');
      } else if (result?.action === 'merged') {
        showInfo('Mesure fusionnée avec données existantes');
      } else {
        showSuccess('Mesure enregistrée avec succès');
      }
      
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
      
      // Réinitialiser les erreurs
      setErrors({});
    } catch (error) {
      log.error('Erreur lors de la sauvegarde des métriques', error);
      showError(
        error.message || 'Une erreur s\'est produite lors de l\'enregistrement. Veuillez réessayer.'
      );
    }
  };

  // 📊 Calculs automatiques memoizés pour performance optimale
  
  // Calcul IMC (MEMOIZED)
  const bmi = useMemo(() => {
    const weight = parseFloat(formData.weight) || (lastEntry?.weight || null);
    const height = parseFloat(formData.height) || (lastEntry?.height || null);
    
    if (weight != null && height != null && !isNaN(weight) && !isNaN(height) && weight > 0 && height > 0) {
      const heightInM = height / 100;
      const bmiValue = weight / (heightInM * heightInM);
      return isFinite(bmiValue) ? bmiValue.toFixed(1) : null;
    }
    return null;
  }, [formData.weight, formData.height, lastEntry?.weight, lastEntry?.height]);

  // Calcul poids idéal (MEMOIZED)
  const idealWeight = useMemo(() => {
    const height = parseFloat(formData.height) || (lastEntry?.height || null);
    
    if (height != null && !isNaN(height) && height > 0) {
      // Formule de Lorentz (approximative)
      const idealWeightValue = height - 100 - ((height - 150) / 4);
      const clampedWeight = Math.max(idealWeightValue, 45);
      return isFinite(clampedWeight) ? clampedWeight.toFixed(1) : null;
    }
    return null;
  }, [formData.height, lastEntry?.height]);

  // Calcul différence poids (MEMOIZED)
  const weightDiff = useMemo(() => {
    const currentWeight = parseFloat(formData.weight);
    const lastWeight = lastEntry?.weight;
    
    if (!isNaN(currentWeight) && currentWeight > 0 && lastWeight != null && !isNaN(lastWeight) && lastWeight > 0) {
      const diff = currentWeight - lastWeight;
      return isFinite(diff) ? diff.toFixed(1) : null;
    }
    return null;
  }, [formData.weight, lastEntry?.weight]);

  // Catégorie IMC (MEMOIZED)
  const bmiCategory = useMemo(() => {
    if (!bmi) return null;
    const bmiValue = parseFloat(bmi);
    
    if (isNaN(bmiValue) || !isFinite(bmiValue)) return null;
    
    if (bmiValue < 18.5) return { category: 'Insuffisance pondérale', color: 'text-sky-300/90' };
    if (bmiValue < 25) return { category: 'Poids normal', color: 'text-green-400' };
    if (bmiValue < 30) return { category: 'Surpoids', color: 'text-yellow-400' };
    return { category: 'Obésité', color: 'text-red-400' };
  }, [bmi]);

  // Conseils personnalisés (MEMOIZED)
  const personalizedAdvice = useMemo(() => {
    if (!bmi) return null;
    const bmiValue = parseFloat(bmi);
    if (isNaN(bmiValue) || !isFinite(bmiValue)) return null;
    
    if (bmiValue < 18.5) {
      return "Votre IMC indique une insuffisance pondérale. Consultez un professionnel de santé pour un plan nutritionnel adapté.";
    } else if (bmiValue >= 18.5 && bmiValue < 25) {
      return "Excellent ! Votre IMC est dans la zone normale. Maintenez vos bonnes habitudes.";
    } else if (bmiValue >= 25 && bmiValue < 30) {
      return "Votre IMC indique un léger surpoids. Une activité physique régulière peut vous aider.";
    } else {
      return "Votre IMC indique une obésité. Il est recommandé de consulter un professionnel de santé.";
    }
  }, [bmi]);

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
      {/* Formulaire de saisie */}
      <Card variant="sport">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-teal-100">
            <Scale className="h-5 w-5 text-sky-400" />
            {t('bodyTracking.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-teal-100 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                {t('bodyTracking.form.date.label')}
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full rounded-lg border border-[#0F4C5C]/50 bg-black px-3 py-2 text-teal-100"
              />
            </div>

            {/* Métriques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-teal-100 mb-2">
                  <Scale className="w-4 h-4 inline mr-2" />
                  {t('bodyTracking.form.weight.label')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className={`w-full rounded-lg border bg-black px-3 py-2 text-teal-100 ${
                    errors.weight ? 'border-red-500' : 'border-[#0F4C5C]/50'
                  }`}
                  placeholder={t('bodyTracking.form.weight.placeholder')}
                />
                {errors.weight && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.weight}
                  </p>
                )}
                {lastEntry?.weight && (
                  <p className="text-teal-700 text-sm mt-1">
                    {t('bodyTracking.form.weight.lastMeasurement', { weight: lastEntry.weight, date: formatLocaleDate(new Date(lastEntry.date)) })}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-teal-100 mb-2">
                  <Ruler className="w-4 h-4 inline mr-2" />
                  {t('bodyTracking.form.height.label')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  className={`w-full rounded-lg border bg-black px-3 py-2 text-teal-100 ${
                    errors.height ? 'border-red-500' : 'border-[#0F4C5C]/50'
                  }`}
                  placeholder={t('bodyTracking.form.height.placeholder')}
                />
                {errors.height && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.height}
                  </p>
                )}
                {lastEntry?.height && (
                  <p className="text-teal-700 text-sm mt-1">
                    {t('bodyTracking.form.height.lastMeasurement', { height: lastEntry.height })}
                  </p>
                )}
              </div>
            </div>

            {/* Mensurations */}
            <div>
              <h3 className="text-lg font-semibold text-teal-100 mb-4 flex items-center gap-2">
                📏 {t('bodyTracking.form.measurements.title')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { key: 'waist', translationKey: 'waist', last: lastEntry?.waist },
                  { key: 'chest', translationKey: 'chest', last: lastEntry?.chest },
                  { key: 'arms', translationKey: 'arms', last: lastEntry?.arms },
                  { key: 'thighs', translationKey: 'thighs', last: lastEntry?.thighs },
                  { key: 'neck', translationKey: 'neck', last: lastEntry?.neck },
                  { key: 'hips', translationKey: 'hips', last: lastEntry?.hips }
                ].map(({ key, translationKey, last }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-teal-100 mb-2">
                      {t(`bodyTracking.form.measurements.${translationKey}`)} {t('bodyTracking.form.measurements.unit')}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData[key]}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className={`w-full rounded-lg border bg-black px-3 py-2 text-teal-100 ${
                        errors[key] ? 'border-red-500' : 'border-[#0F4C5C]/50'
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
                      <p className="text-teal-700 text-sm mt-1">
                        {t('bodyTracking.form.measurements.last', { value: last })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-teal-100 mb-2">
                {t('bodyTracking.form.notes.label')}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full rounded-lg border border-[#0F4C5C]/50 bg-black px-3 py-2 text-teal-100"
                rows="3"
                placeholder={t('bodyTracking.form.notes.placeholder')}
              />
            </div>

            <Button type="submit" className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {t('bodyTracking.form.save')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Calculs automatiques */}
      {showCalculations && (
        <Card variant="sport">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-100">
              <Calculator className="h-5 w-5 text-sky-400" />
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
              <div className="rounded-lg border border-[#0F4C5C]/45 bg-black p-4">
                <h4 className="font-semibold text-teal-100 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-sky-300/90" />
                  Indice de Masse Corporelle
                </h4>
                {bmi ? (
                  <div>
                    <div className="text-2xl font-bold text-teal-100 mb-1">{bmi}</div>
                    {bmiCategory && (
                      <div className={`text-sm ${bmiCategory.color}`}>
                        {bmiCategory.category}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-teal-700 text-sm">
                    Saisissez poids et taille
                  </div>
                )}
              </div>

              {/* Poids idéal */}
              <div className="rounded-lg border border-[#0F4C5C]/45 bg-black p-4">
                <h4 className="font-semibold text-teal-100 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-400" />
                  Poids idéal estimé
                </h4>
                {idealWeight ? (
                  <div>
                    <div className="text-2xl font-bold text-teal-100 mb-1">{idealWeight} kg</div>
                    <div className="text-sm text-teal-700">
                      Formule de Lorentz
                    </div>
                  </div>
                ) : (
                  <div className="text-teal-700 text-sm">
                    Saisissez la taille
                  </div>
                )}
              </div>

              {/* Évolution */}
              <div className="rounded-lg border border-[#0F4C5C]/45 bg-black p-4">
                <h4 className="font-semibold text-teal-100 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-yellow-400" />
                  Évolution du poids
                </h4>
                {weightDiff ? (
                  <div>
                    <div className={`text-2xl font-bold mb-1 ${
                      parseFloat(weightDiff) > 0 ? 'text-red-400' : 
                      parseFloat(weightDiff) < 0 ? 'text-green-400' : 'text-teal-700'
                    }`}>
                      {parseFloat(weightDiff) > 0 ? '+' : ''}{weightDiff} kg
                    </div>
                    <div className="text-sm text-teal-700">
                      Depuis 7 jours
                    </div>
                  </div>
                ) : (
                  <div className="text-teal-700 text-sm">
                    Saisissez le poids
                  </div>
                )}
              </div>
            </div>

            {/* Conseils automatiques */}
            {bmi && (
              <div className="mt-6 p-4 bg-black border border-[#0F4C5C]/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-sky-300/90 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-sky-200/90 mb-1">Conseil personnalisé</h5>
                    <p className="text-sky-100/90 text-sm">
                      {personalizedAdvice || "Saisissez votre poids et votre taille pour obtenir des conseils personnalisés."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
    </>
  );
};

export default MetricsSection;