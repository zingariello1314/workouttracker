import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Zap, 
  Droplets, 
  Heart, 
  TrendingUp, 
  TrendingDown,
  Ruler,
  Minus,
  Save,
  Calendar,
  Info,
  AlertTriangle,
  Target,
  BarChart3,
  Scale,
  Calculator,
  Pencil,
  Trash2,
  X,
  History
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useAuth } from '../../context/AuthContext';
import {
  canComputeMifflinStJeor,
  mifflinFormulaHintFr,
  mifflinStJeorBmr,
  normalizeSexForBmr
} from '../../utils/metabolicBmr';
import { useGarminData } from '../../hooks/useGarminData'; // ✅ Pour métabolisme de base Garmin
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { formatDate } from '../../utils/dateUtils';
import { validateImpedanceForm } from './utils/validation'; // ✅ Déjà importé
import { useToast } from './hooks/useToast';
import logger from '../../utils/logger';
import {
  WEEKDAY_LABELS_FR,
  defaultWeighInWeekdays,
  normalizeWeighInPrefs
} from '../../utils/bodyTracking/weeklyWeighInReminder';

const log = logger.component('ImpedanceSection');

const EMPTY_IMPEDANCE_FORM = {
  weight: '',
  heightCm: '',
  chronologicalAge: '',
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
  biologicalSex: '',
  basalMetabolism: '',
  basalMetabolismSource: '',
  metabolicAge: '',
  bodyType: '',
  date: '',
  notes: ''
};

function ymdFromEntry(entry) {
  if (!entry?.date) return new Date().toISOString().split('T')[0];
  const d = new Date(entry.date);
  if (Number.isNaN(d.getTime())) return String(entry.date).slice(0, 10);
  return d.toISOString().split('T')[0];
}

function strField(v) {
  return v != null && v !== '' ? String(v) : '';
}

function entryToFormData(entry) {
  return {
    weight: strField(entry.weight),
    heightCm: strField(entry.heightCm),
    chronologicalAge: strField(entry.chronologicalAge),
    bmi: strField(entry.bmi),
    bodyFatPercentage: strField(entry.bodyFatPercentage),
    muscleMass: strField(entry.muscleMass ?? entry.skeletalMuscle),
    bodyFatMass: strField(entry.bodyFatMass),
    bodyFatIndex: strField(entry.bodyFatIndex),
    obesityLevel: strField(entry.obesityLevel),
    visceralFatIndex: strField(entry.visceralFatIndex ?? entry.visceralFat),
    fatFreeWeight: strField(entry.fatFreeWeight),
    bodyWater: strField(entry.bodyWater),
    boneMass: strField(entry.boneMass),
    proteinPercentage: strField(entry.proteinPercentage ?? entry.protein),
    biologicalSex: strField(entry.biologicalSex),
    basalMetabolism: strField(entry.basalMetabolism),
    basalMetabolismSource: strField(entry.basalMetabolismSource),
    metabolicAge: strField(entry.metabolicAge),
    bodyType: strField(entry.bodyType),
    date: ymdFromEntry(entry),
    notes: strField(entry.notes)
  };
}

function buildParsedImpedanceEntry(formData, { garminBasalMetabolism } = {}) {
  const entry = {
    ...formData,
    timestamp: new Date(formData.date).getTime()
  };

  if (entry.basalMetabolism && !entry.basalMetabolismSource) {
    entry.basalMetabolismSource = 'manual';
  }
  if (
    garminBasalMetabolism &&
    !entry.basalMetabolism &&
    entry.basalMetabolismSource !== 'mifflin_st_jeor'
  ) {
    entry.basalMetabolism = garminBasalMetabolism.value;
    entry.basalMetabolismSource = 'garmin';
  }

  const stringKeys = new Set([
    'date',
    'notes',
    'bodyType',
    'timestamp',
    'basalMetabolismSource',
    'biologicalSex',
    'type'
  ]);
  Object.keys(entry).forEach((key) => {
    if (stringKeys.has(key) || entry[key] === '' || entry[key] == null) return;
    if (key === 'chronologicalAge') {
      entry[key] = Math.round(parseFloat(entry[key]));
      return;
    }
    if (key === 'heightCm' || key === 'weight' || key === 'bmi') {
      entry[key] = parseFloat(entry[key]);
      return;
    }
    entry[key] = parseFloat(entry[key]);
  });

  return { ...entry, type: 'impedance' };
}

const ImpedanceSection = () => {
  const { data, addProgressEntry, updateProgressEntry, deleteProgressEntry, updateData } = useWorkout();
  const { currentUser } = useAuth();
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
    heightCm: '',                  // Taille (cm) — obligatoire avec l’âge pour l’historique & nutrition
    chronologicalAge: '',          // Âge réel (années) — obligatoire
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
    biologicalSex: '',              // Homme / femme (quiz ou saisie) — Mifflin–St Jeor
    basalMetabolism: '',          // Taux métabolique basal (kcal)
    basalMetabolismSource: '',    // mifflin_st_jeor | garmin | manual | scale
    metabolicAge: '',             // Âge métabolique
    bodyType: '',                 // Type de corps
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [editingEntryId, setEditingEntryId] = useState(null);

  const impedanceHistory = useMemo(() => {
    if (!data?.progressEntries?.length) return [];
    return data.progressEntries
      .filter((entry) => entry.type === 'impedance')
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(a.timestamp || 0);
        const dateB = b.date ? new Date(b.date) : new Date(b.timestamp || 0);
        return dateB - dateA;
      });
  }, [data?.progressEntries]);

  const lastMeasurement = useMemo(() => {
    const lastEntry = impedanceHistory[0];
    if (!lastEntry) return null;

    const entryDate = lastEntry.date
      ? new Date(lastEntry.date)
      : new Date(lastEntry.timestamp || Date.now());

    return {
      id: lastEntry.id,
      weight: lastEntry.weight ?? null,
      bmi: lastEntry.bmi ?? null,
      bodyFatPercentage: lastEntry.bodyFatPercentage ?? null,
      muscleMass: lastEntry.muscleMass ?? lastEntry.skeletalMuscle ?? null,
      bodyFatMass: lastEntry.bodyFatMass ?? null,
      bodyFatIndex: lastEntry.bodyFatIndex ?? null,
      obesityLevel: lastEntry.obesityLevel ?? null,
      visceralFatIndex: lastEntry.visceralFatIndex ?? lastEntry.visceralFat ?? null,
      fatFreeWeight: lastEntry.fatFreeWeight ?? null,
      bodyWater: lastEntry.bodyWater ?? null,
      boneMass: lastEntry.boneMass ?? null,
      proteinPercentage: lastEntry.proteinPercentage ?? lastEntry.protein ?? null,
      basalMetabolism: lastEntry.basalMetabolism ?? null,
      metabolicAge: lastEntry.metabolicAge ?? null,
      bodyType: lastEntry.bodyType ?? null,
      heightCm: lastEntry.heightCm ?? null,
      chronologicalAge: lastEntry.chronologicalAge ?? null,
      biologicalSex: lastEntry.biologicalSex ?? null,
      date: entryDate
    };
  }, [impedanceHistory]);

  const quizSex = currentUser?.profileQuestionnaire?.answers?.vitalsSelfReport?.sex;

  const resetFormForNewEntry = useCallback(() => {
    setEditingEntryId(null);
    setFormData((prev) => ({
      ...EMPTY_IMPEDANCE_FORM,
      date: new Date().toISOString().split('T')[0],
      biologicalSex: prev.biologicalSex || quizSex || ''
    }));
    setErrors({});
  }, [quizSex]);

  const startEditEntry = useCallback((entry) => {
    if (!entry?.id) return;
    setEditingEntryId(entry.id);
    setFormData(entryToFormData(entry));
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleDeleteEntry = useCallback(
    async (entry) => {
      if (!entry?.id) return;
      const label = formatDate(entry.date ? new Date(entry.date) : new Date(entry.timestamp || Date.now()));
      if (!window.confirm(`Supprimer la mesure du ${label} ? Cette action est irréversible.`)) {
        return;
      }
      try {
        await deleteProgressEntry(entry.id);
        if (editingEntryId === entry.id) {
          resetFormForNewEntry();
        }
        showSuccess('Mesure supprimée');
      } catch (err) {
        log.error('Suppression impédance', err);
        showError('Impossible de supprimer cette mesure.');
      }
    },
    [deleteProgressEntry, editingEntryId, resetFormForNewEntry, showSuccess, showError]
  );

  useEffect(() => {
    if (formData.biologicalSex !== '') return;
    if (quizSex === 'male' || quizSex === 'female') {
      setFormData((prev) => ({ ...prev, biologicalSex: quizSex }));
    }
  }, [quizSex, formData.biologicalSex]);

  const mifflinInputs = useMemo(
    () => ({
      weightKg: formData.weight,
      heightCm: formData.heightCm || data?.userProfile?.height,
      ageYears: formData.chronologicalAge,
      sex: formData.biologicalSex || quizSex
    }),
    [
      formData.weight,
      formData.heightCm,
      formData.chronologicalAge,
      formData.biologicalSex,
      quizSex,
      data?.userProfile?.height
    ]
  );

  const mifflinPreviewBmr = useMemo(() => {
    if (!canComputeMifflinStJeor(mifflinInputs)) return null;
    return mifflinStJeorBmr(mifflinInputs);
  }, [mifflinInputs]);

  const handleCalculateMifflinBmr = () => {
    const bmr = mifflinStJeorBmr(mifflinInputs);
    if (bmr == null) {
      showError('Renseigne d’abord le poids, la taille et l’âge réel (et le sexe si possible).');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      basalMetabolism: String(bmr),
      basalMetabolismSource: 'mifflin_st_jeor'
    }));
    showSuccess(`Taux métabolique basal estimé : ${bmr} kcal/j (Mifflin–St Jeor)`);
  };

  // Profil utilisateur : proposer la taille enregistrée si le champ est encore vide
  useEffect(() => {
    const h = data?.userProfile?.height;
    if (h == null || h === '') return;
    setFormData((prev) => {
      if (prev.heightCm !== '') return prev;
      return { ...prev, heightCm: String(h) };
    });
  }, [data?.userProfile?.height]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'basalMetabolism') {
        next.basalMetabolismSource = value ? 'manual' : prev.basalMetabolismSource;
      }
      return next;
    });

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // ✅ Calcul automatique IMC si poids + taille (formulaire ou ancien profil)
  useEffect(() => {
    const hRaw = formData.heightCm || data?.userProfile?.height;
    if (formData.weight && hRaw) {
      const heightInMeters = parseFloat(hRaw) / 100;
      const weightInKg = parseFloat(formData.weight);
      if (heightInMeters > 0 && weightInKg > 0) {
        const calculatedBMI = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1);
        if (formData.bmi !== calculatedBMI) {
          setFormData(prev => ({ ...prev, bmi: calculatedBMI }));
        }
      }
    }
  }, [formData.weight, formData.heightCm, formData.bmi, data?.userProfile?.height]);

  // Préremplir métabolisme Garmin seulement si champ vide (ne pas écraser un calcul Mifflin)
  useEffect(() => {
    if (editingEntryId) return;
    if (!garminBasalMetabolism || formData.basalMetabolism) return;
    if (formData.basalMetabolismSource === 'mifflin_st_jeor' || formData.basalMetabolismSource === 'manual') {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      basalMetabolism: String(garminBasalMetabolism.value),
      basalMetabolismSource: 'garmin'
    }));
    log.debug('Métabolisme Garmin prérempli dans formulaire', { value: garminBasalMetabolism.value });
  }, [editingEntryId, garminBasalMetabolism, formData.basalMetabolism, formData.basalMetabolismSource]);

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
    const validationResult = validateImpedanceForm(formData, data?.progressEntries || [], {
      skipDuplicateCheck: false,
      skipConsistencyCheck: false,
      excludeEntryId: editingEntryId
    });
    
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
      const entryWithType = buildParsedImpedanceEntry(formData, { garminBasalMetabolism });

      if (editingEntryId) {
        await updateProgressEntry(editingEntryId, entryWithType);
        showSuccess('Mesure mise à jour');
        resetFormForNewEntry();
        return;
      }

      const result = await addProgressEntry(entryWithType);

      if (result?.action === 'replaced') {
        showInfo("Mesure d'impédancemétrie mise à jour (remplacement de l'entrée existante)");
      } else if (result?.action === 'merged') {
        showInfo('Données fusionnées avec entrée existante');
      } else {
        showSuccess("Mesure d'impédancemétrie enregistrée avec succès");
      }

      resetFormForNewEntry();
    } catch (error) {
      log.error('Erreur lors de la sauvegarde des données d\'impédance', error);
      showError(
        error.message || 'Une erreur s\'est produite lors de l\'enregistrement. Veuillez réessayer.'
      );
    }
  };

  // ✅ Métriques — minimum requis par séance puis détail impédancemètre
  const metrics = [
    {
      category: 'Minimum requis (chaque enregistrement)',
      items: [
        {
          key: 'weight',
          label: 'Poids',
          unit: 'kg',
          icon: <Scale className="w-4 h-4" />,
          description: 'Poids du jour — ancrage du suivi corporel sur la durée',
          inputStep: '0.05'
        },
        {
          key: 'heightCm',
          label: 'Taille',
          unit: 'cm',
          icon: <Activity className="w-4 h-4" />,
          description: 'Ta taille actuelle (utilisée avec le poids pour l’IMC et les programmes nutrition)',
          inputStep: '0.1'
        },
        {
          key: 'chronologicalAge',
          label: 'Âge réel',
          unit: 'ans',
          icon: <Heart className="w-4 h-4" />,
          description: 'Âge chronologique (différent de l’âge métabolique affiché plus bas)',
          inputStep: '1'
        },
        {
          key: 'biologicalSex',
          label: 'Sexe (formule BMR)',
          unit: '',
          icon: <Heart className="w-4 h-4" />,
          description:
            quizSex === 'male' || quizSex === 'female'
              ? `Prérempli depuis ton profil quiz (${quizSex === 'male' ? 'homme' : 'femme'})`
              : 'Requis pour un calcul Mifflin–St Jeor précis',
          inputKind: 'sex'
        },
        {
          key: 'bmi',
          label: 'IMC',
          unit: '',
          icon: <BarChart3 className="w-4 h-4" />,
          description: 'Indice calculé automatiquement (poids + taille)',
          readOnly: true,
          inputStep: 'any'
        }
      ]
    },
    {
      category: 'Mesures détaillées (optionnel)',
      items: [
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
            ? `Garmin : ${garminBasalMetabolism.value} kcal (${formatDate(garminBasalMetabolism.date)}) — ou calcule avec Mifflin–St Jeor`
            : 'Calories au repos — utilise le bouton de calcul ou saisis la valeur de ta balance',
          calculateMifflin: true
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
      <Card variant="sport">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-teal-100">
            <Zap className="h-5 w-5 text-sky-400" />
            Données d'impédancemétrie
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editingEntryId ? (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-500/40 bg-cyan-950/30 px-3 py-2">
              <p className="text-sm text-cyan-100">
                <Pencil className="mr-1 inline h-4 w-4" />
                Modification de la mesure du{' '}
                <span className="font-medium">{formatDate(new Date(`${formData.date}T12:00:00`))}</span>
              </p>
              <Button type="button" variant="secondary" className="text-xs" onClick={resetFormForNewEntry}>
                <X className="mr-1 h-3 w-3" />
                Annuler
              </Button>
            </div>
          ) : null}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-teal-100">
                <Calendar className="mr-2 inline h-4 w-4" />
                Date de mesure
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-3 py-2 text-teal-100 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40"
              />
            </div>

            <div className="rounded-lg border border-[#0F4C5C]/45 bg-black/50 p-3 space-y-3">
              <label className="block text-sm font-medium text-teal-100">
                Régime de pesée (rappel sur Aujourd’hui)
              </label>
              <p className="text-xs text-teal-700">
                Choisis une date de début et combien de mesures tu vises par semaine. L’alerte reste jusqu’à ce que le
                quota de la semaine (lundi–dimanche) soit atteint. Tu peux peser depuis Aujourd’hui.
              </p>
              {(() => {
                const prefs = normalizeWeighInPrefs(data?.bodyTrackingPrefs || {});
                const savePrefs = async (patch) => {
                  const next = normalizeWeighInPrefs({
                    ...(data.bodyTrackingPrefs || {}),
                    ...patch
                  });
                  try {
                    await updateData({
                      ...data,
                      bodyTrackingPrefs: next
                    });
                    showSuccess('Régime de pesée enregistré');
                  } catch (err) {
                    log.error('bodyTrackingPrefs', err);
                    showError('Impossible d’enregistrer le régime de pesée.');
                  }
                };
                const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];
                return (
                  <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs text-teal-500">Date de début du régime</label>
                        <input
                          type="date"
                          value={prefs.weighInAnchorDate || ''}
                          onChange={(e) => {
                            const ymd = e.target.value || null;
                            const n = prefs.weighInsPerWeek || 1;
                            savePrefs({
                              weighInAnchorDate: ymd,
                              weighInsPerWeek: n || 1,
                              weighInWeekdays:
                                prefs.weighInWeekdays.length > 0
                                  ? prefs.weighInWeekdays
                                  : ymd
                                    ? defaultWeighInWeekdays(ymd, n || 1)
                                    : prefs.weighInWeekdays
                            });
                          }}
                          className="w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-3 py-2 text-teal-100 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-teal-500">Pesées par semaine</label>
                        <select
                          value={String(prefs.weighInsPerWeek || (prefs.weeklyWeighInDay != null ? 1 : 0))}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            if (!n) {
                              savePrefs({
                                weighInAnchorDate: null,
                                weighInsPerWeek: 0,
                                weighInWeekdays: [],
                                weeklyWeighInDay: null
                              });
                              return;
                            }
                            const anchor =
                              prefs.weighInAnchorDate || new Date().toISOString().slice(0, 10);
                            savePrefs({
                              weighInAnchorDate: anchor,
                              weighInsPerWeek: n,
                              weighInWeekdays: defaultWeighInWeekdays(anchor, n),
                              weeklyWeighInDay: defaultWeighInWeekdays(anchor, n)[0]
                            });
                          }}
                          className="w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-3 py-2 text-teal-100 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40"
                        >
                          <option value="0">— Pas de rappel —</option>
                          <option value="1">1 fois / semaine</option>
                          <option value="2">2 fois / semaine</option>
                          <option value="3">3 fois / semaine</option>
                          <option value="4">4 fois / semaine</option>
                          <option value="5">5 fois / semaine</option>
                          <option value="6">6 fois / semaine</option>
                          <option value="7">Tous les jours</option>
                        </select>
                      </div>
                    </div>
                    {prefs.weighInsPerWeek > 0 ? (
                      <div>
                        <p className="mb-2 text-xs text-teal-500">Jours visés</p>
                        <div className="flex flex-wrap gap-2">
                          {weekdayOrder.map((wd) => {
                            const on = prefs.weighInWeekdays.includes(wd);
                            return (
                              <button
                                key={wd}
                                type="button"
                                onClick={() => {
                                  let nextDays = on
                                    ? prefs.weighInWeekdays.filter((d) => d !== wd)
                                    : [...prefs.weighInWeekdays, wd].sort((a, b) => a - b);
                                  if (nextDays.length === 0) nextDays = [wd];
                                  savePrefs({
                                    weighInWeekdays: nextDays,
                                    weeklyWeighInDay: nextDays[0]
                                  });
                                }}
                                className={`rounded-lg border px-2 py-1 text-xs ${
                                  on
                                    ? 'border-emerald-400 bg-emerald-500/20 text-white'
                                    : 'border-slate-700 text-teal-400'
                                }`}
                              >
                                {WEEKDAY_LABELS_FR[wd].slice(0, 3)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </>
                );
              })()}
            </div>

            {/* Métriques par catégorie */}
            {metrics.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-teal-100">
                  {category.category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.items.map((metric) => (
                    <div key={metric.key}>
                      <label className="mb-2 block text-sm font-medium text-teal-100">
                        {metric.icon}
                        <span className="ml-2">{metric.label}</span>
                        {metric.unit && <span className="text-teal-600"> ({metric.unit})</span>}
                      </label>
                      {metric.inputKind === 'sex' ? (
                        <select
                          value={formData.biologicalSex || ''}
                          onChange={(e) => handleInputChange('biologicalSex', e.target.value)}
                          className={`w-full rounded-lg border bg-black px-3 py-2 text-teal-100 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40 ${
                            errors.biologicalSex ? 'border-red-500' : 'border-[#0F4C5C]/55'
                          }`}
                        >
                          <option value="">— Choisir —</option>
                          <option value="male">Homme</option>
                          <option value="female">Femme</option>
                        </select>
                      ) : (
                        <input
                          type="number"
                          step={metric.inputStep === 'any' ? 'any' : metric.inputStep || '0.1'}
                          readOnly={Boolean(metric.readOnly)}
                          aria-readonly={metric.readOnly ? 'true' : undefined}
                          min={metric.unit?.includes('/') ? 0 : undefined}
                          max={
                            metric.unit === '/8'
                              ? 8
                              : metric.unit === '/5'
                                ? 5
                                : metric.unit === '/20'
                                  ? 20
                                  : undefined
                          }
                          value={formData[metric.key]}
                          onChange={(e) => {
                            if (metric.readOnly) return;
                            handleInputChange(metric.key, e.target.value);
                          }}
                          className={`w-full rounded-lg border bg-black px-3 py-2 text-teal-100 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40 ${
                            metric.readOnly ? 'cursor-not-allowed opacity-90' : ''
                          } ${errors[metric.key] ? 'border-red-500' : 'border-[#0F4C5C]/55'}`}
                          placeholder={
                            metric.key === 'basalMetabolism' && garminBasalMetabolism
                              ? `${garminBasalMetabolism.value} (Garmin)`
                              : metric.key === 'basalMetabolism' && mifflinPreviewBmr
                                ? `≈ ${mifflinPreviewBmr} kcal (Mifflin)`
                                : lastMeasurement?.[metric.key]
                                  ? `Ex: ${lastMeasurement[metric.key]}${metric.unit || ''}`
                                  : `Entrer ${metric.label.toLowerCase()}...`
                          }
                        />
                      )}
                      {metric.calculateMifflin ? (
                        <div className="mt-2 space-y-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="w-full text-xs sm:w-auto"
                            disabled={!mifflinPreviewBmr}
                            onClick={handleCalculateMifflinBmr}
                          >
                            <Calculator className="mr-2 inline h-4 w-4" />
                            Calculer (Mifflin–St Jeor)
                          </Button>
                          {mifflinPreviewBmr ? (
                            <p className="text-xs text-teal-600">
                              Estimation : <span className="text-teal-300">{mifflinPreviewBmr} kcal/j</span>
                              {' · '}
                              {mifflinFormulaHintFr(formData.biologicalSex || quizSex)}
                            </p>
                          ) : (
                            <p className="text-xs text-amber-500/90">
                              Complète poids, taille et âge réel
                              {!(formData.biologicalSex || quizSex) ? ' (et sexe pour plus de précision)' : ''}.
                            </p>
                          )}
                          {formData.basalMetabolismSource === 'mifflin_st_jeor' && formData.basalMetabolism ? (
                            <p className="text-xs text-sky-400">Valeur issue du calcul Mifflin–St Jeor.</p>
                          ) : null}
                        </div>
                      ) : null}
                      {errors[metric.key] && (
                        <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errors[metric.key]}
                        </p>
                      )}
                      {lastMeasurement?.[metric.key] != null && (
                        <p className="mt-1 text-sm text-teal-700">
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
                        <p className="mt-1 flex items-center gap-1 text-sm text-sky-400">
                          <Info className="w-3 h-3" />
                          Garmin disponible: {garminBasalMetabolism.value} kcal ({formatDate(garminBasalMetabolism.date)})
                        </p>
                      )}
                      <p className="mt-1 text-xs text-teal-800">{metric.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Type de corps */}
            <div>
              <label className="mb-2 block text-sm font-medium text-teal-100">
                Type de corps
              </label>
              <select
                value={formData.bodyType}
                onChange={(e) => handleInputChange('bodyType', e.target.value)}
                className="w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-3 py-2 text-teal-100 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40"
              >
                <option value="">Sélectionner...</option>
                {bodyTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-2 block text-sm font-medium text-teal-100">
                Notes (optionnel)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-3 py-2 text-teal-100 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40"
                rows="3"
                placeholder="Conditions de mesure, observations..."
              />
            </div>

            <Button
              type="submit"
              className="w-full border-2 border-[#0F5C45]/55 bg-[#0F5C45]/30 text-teal-100 hover:bg-[#0F5C45]/45"
            >
              <Save className="mr-2 h-4 w-4" />
              {editingEntryId ? 'Enregistrer les modifications' : 'Enregistrer les mesures'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {impedanceHistory.length > 0 ? (
        <Card variant="sport">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-100">
              <History className="h-5 w-5 text-sky-400" />
              Historique des mesures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-teal-700">
              Modifie une ancienne saisie (date, poids, métabolisme, etc.) ou supprime une entrée erronée.
            </p>
            <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {impedanceHistory.map((entry) => {
                const d = entry.date ? new Date(entry.date) : new Date(entry.timestamp || Date.now());
                const isEditing = editingEntryId === entry.id;
                return (
                  <li
                    key={entry.id}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
                      isEditing
                        ? 'border-cyan-500/50 bg-cyan-950/25'
                        : 'border-[#0F4C5C]/50 bg-black/40'
                    }`}
                  >
                    <div className="min-w-0 text-sm text-teal-100">
                      <span className="font-medium">{formatDate(d)}</span>
                      {entry.weight != null ? (
                        <span className="text-teal-600"> · {entry.weight} kg</span>
                      ) : null}
                      {entry.bodyFatPercentage != null ? (
                        <span className="text-teal-700"> · {entry.bodyFatPercentage}% MG</span>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="text-xs"
                        onClick={() => startEditEntry(entry)}
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="text-xs text-red-300 hover:text-red-200"
                        onClick={() => handleDeleteEntry(entry)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Supprimer
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/* Analyse des dernières mesures */}
      {lastMeasurement ? (
        <Card variant="sport">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-teal-100">
              <span className="flex flex-wrap items-center gap-2">
                <BarChart3 className="h-5 w-5 text-sky-400" />
                Analyse des dernières mesures
                <span className="text-sm font-normal text-teal-700">
                  ({formatDate(lastMeasurement.date)})
                </span>
              </span>
              {lastMeasurement.id ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="text-xs"
                  onClick={() => {
                    const raw = impedanceHistory.find((e) => e.id === lastMeasurement.id);
                    if (raw) startEditEntry(raw);
                  }}
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  Modifier cette mesure
                </Button>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Affichage des métriques principales */}
              {lastMeasurement.weight != null && (
                <div className="rounded-lg border border-[#0F4C5C]/50 bg-black p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-teal-100">
                    <Scale className="h-4 w-4 text-sky-400" />
                    Poids
                  </h4>
                  <div className="text-2xl font-bold text-teal-100 mb-1">
                    {lastMeasurement.weight} kg
                  </div>
                </div>
              )}

              {lastMeasurement.heightCm != null && (
                <div className="rounded-lg border border-[#0F4C5C]/50 bg-black p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-teal-100">
                    <Ruler className="h-4 w-4 text-sky-400" />
                    Taille (séance)
                  </h4>
                  <div className="text-2xl font-bold text-teal-100 mb-1">
                    {lastMeasurement.heightCm} cm
                  </div>
                </div>
              )}

              {lastMeasurement.chronologicalAge != null && (
                <div className="rounded-lg border border-[#0F4C5C]/50 bg-black p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-teal-100">
                    <Heart className="h-4 w-4 text-sky-400" />
                    Âge réel
                  </h4>
                  <div className="text-2xl font-bold text-teal-100 mb-1">
                    {lastMeasurement.chronologicalAge}
                  </div>
                  <div className="text-sm text-teal-700">ans</div>
                </div>
              )}
              
              {lastMeasurement.bmi != null && (
                <div className="rounded-lg border border-[#0F4C5C]/50 bg-black p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-teal-100">
                    <Activity className="h-4 w-4 text-sky-400" />
                    IMC
                  </h4>
                  <div className="text-2xl font-bold text-teal-100 mb-1">
                    {lastMeasurement.bmi}
                  </div>
                </div>
              )}

              {lastMeasurement.bodyFatPercentage != null && (
                <div className="rounded-lg border border-[#0F4C5C]/50 bg-black p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-teal-100">
                    <Target className="h-4 w-4 text-sky-400" />
                    Graisse corporelle
                  </h4>
                  <div className="text-2xl font-bold text-teal-100 mb-1">
                    {lastMeasurement.bodyFatPercentage}%
                  </div>
                </div>
              )}

              {lastMeasurement.muscleMass != null && (
                <div className="rounded-lg border border-[#0F4C5C]/50 bg-black p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-teal-100">
                    <Activity className="h-4 w-4 text-emerald-400" />
                    Masse musculaire
                  </h4>
                  <div className="text-2xl font-bold text-teal-100 mb-1">
                    {lastMeasurement.muscleMass} kg
                  </div>
                </div>
              )}

              {lastMeasurement.bodyWater != null && (
                <div className="rounded-lg border border-[#0F4C5C]/50 bg-black p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-teal-100">
                    <Droplets className="h-4 w-4 text-sky-400" />
                    Hydratation
                  </h4>
                  <div className="text-2xl font-bold text-teal-100 mb-1">
                    {lastMeasurement.bodyWater}%
                  </div>
                </div>
              )}

              {lastMeasurement.visceralFatIndex != null && (
                <div className="rounded-lg border border-[#0F4C5C]/50 bg-black p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-teal-100">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    Graisse viscérale
                  </h4>
                  <div className="text-2xl font-bold text-teal-100 mb-1">
                    {lastMeasurement.visceralFatIndex}/20
                  </div>
                </div>
              )}

              {lastMeasurement.basalMetabolism != null && (
                <div className="rounded-lg border border-[#0F4C5C]/50 bg-black p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-teal-100">
                    <Zap className="h-4 w-4 text-amber-400" />
                    Métabolisme
                  </h4>
                  <div className="text-2xl font-bold text-teal-100 mb-1">
                    {lastMeasurement.basalMetabolism}
                  </div>
                  <div className="text-sm text-teal-700">kcal/jour</div>
                </div>
              )}

              {lastMeasurement.metabolicAge != null && (
                <div className="rounded-lg border border-[#0F4C5C]/50 bg-black p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-teal-100">
                    <Heart className="h-4 w-4 text-red-400" />
                    Âge métabolique
                  </h4>
                  <div className="text-2xl font-bold text-teal-100 mb-1">
                    {lastMeasurement.metabolicAge}
                  </div>
                  <div className="text-sm text-teal-700">ans</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card variant="sport">
          <CardContent className="p-6 text-center">
            <Zap className="mx-auto mb-4 h-12 w-12 text-sky-400" />
            <h4 className="mb-2 text-lg font-semibold text-teal-100">Aucune mesure d'impédance enregistrée</h4>
            <p className="text-teal-700">
              Enregistrez votre première mesure d'impédancemétrie pour voir les analyses et tendances.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Conseils d'utilisation */}
      <Card variant="sport">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
            <div>
              <h4 className="mb-2 font-semibold text-teal-100">Conseils pour des mesures précises</h4>
              <ul className="space-y-1 text-sm text-teal-200/90">
                <li>• Effectuez les mesures le matin à jeun, après être allé aux toilettes</li>
                <li>• Évitez l'exercice intense 12h avant la mesure</li>
                <li>• Maintenez une hydratation normale (pas de déshydratation ni de surhydratation)</li>
                <li>• Retirez bijoux et objets métalliques</li>
                <li>• Restez immobile pendant la mesure</li>
                <li>• Effectuez les mesures dans les mêmes conditions pour un suivi cohérent</li>
                {garminBasalMetabolism && (
                  <li className="text-sky-300">
                    • Métabolisme de base Garmin disponible : {garminBasalMetabolism.value} kcal (recommandé)
                  </li>
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
