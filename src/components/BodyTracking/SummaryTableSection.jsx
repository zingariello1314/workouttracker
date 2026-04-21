import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar, 
  AlertTriangle,
  Filter,
  ArrowUpDown,
  Info,
  Edit,
  Trash2,
  Save,
  X,
  Eye
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { formatDate } from '../../utils/dateUtils';
import { 
  formatWeight, 
  formatHeight, 
  formatBMI, 
  formatPercentage,
  formatMeasurement,
  formatChange,
  formatChangeWithPercentage,
  formatValue
} from './utils/formatting';
import logger from '../../utils/logger';

const log = logger.component('SummaryTableSection');

const SummaryTableSection = () => {
  const { data, updateProgressEntry, deleteProgressEntry, deleteProgressEntryField } = useWorkout();
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');
  const [editMode, setEditMode] = useState(false);
  const [editedEntries, setEditedEntries] = useState({});
  const [entriesToDelete, setEntriesToDelete] = useState(new Set());
  const [fieldsToDelete, setFieldsToDelete] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // 🔍 Calculer les dates de référence pour variations 7j et 30j
  const calculateReferenceDates = () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return { now, sevenDaysAgo, thirtyDaysAgo };
  };

  // 📊 Générer les données réelles basées sur les entrées de progression (MEMOIZED)
  const bodyData = useMemo(() => {
    if (!data?.progressEntries || data.progressEntries.length === 0) {
      return [];
    }

    const { sevenDaysAgo, thirtyDaysAgo } = calculateReferenceDates();

    // Filtrer et trier entrées métriques (type 'metrics')
    const metricsEntries = data.progressEntries
      .filter(entry => entry.type === 'metrics')
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : (a.timestamp ? new Date(a.timestamp) : new Date(0));
        const dateB = b.date ? new Date(b.date) : (b.timestamp ? new Date(b.timestamp) : new Date(0));
        return dateB - dateA; // Plus récent en premier
      });

    // Filtrer et trier entrées impédance (type 'impedance')
    const impedanceEntries = data.progressEntries
      .filter(entry => entry.type === 'impedance')
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : (a.timestamp ? new Date(a.timestamp) : new Date(0));
        const dateB = b.date ? new Date(b.date) : (b.timestamp ? new Date(b.timestamp) : new Date(0));
        return dateB - dateA;
      });

    if (metricsEntries.length === 0 && impedanceEntries.length === 0) {
      return [];
    }

    const latestMetricsEntry = metricsEntries[0] || null;
    const latestImpedanceEntry = impedanceEntries[0] || null;

    // Trouver entrées de référence pour variations
    const findReferenceEntry = (entries, referenceDate) => {
      return entries.find(entry => {
        const entryDate = entry.date ? new Date(entry.date) : (entry.timestamp ? new Date(entry.timestamp) : new Date(0));
        return entryDate <= referenceDate;
      }) || null;
    };

    const sevenDaysAgoMetricsEntry = findReferenceEntry(metricsEntries, sevenDaysAgo);
    const thirtyDaysAgoMetricsEntry = findReferenceEntry(metricsEntries, thirtyDaysAgo);
    const sevenDaysAgoImpedanceEntry = findReferenceEntry(impedanceEntries, sevenDaysAgo);
    const thirtyDaysAgoImpedanceEntry = findReferenceEntry(impedanceEntries, thirtyDaysAgo);

    const bodyData = [];

    // === MÉTRIQUES DE BASE (type 'metrics') ===
    
    // Poids
    if (latestMetricsEntry?.weight != null && !isNaN(latestMetricsEntry.weight)) {
      const currentWeight = latestMetricsEntry.weight;
      const sevenDaysWeight = sevenDaysAgoMetricsEntry?.weight;
      const thirtyDaysWeight = thirtyDaysAgoMetricsEntry?.weight;
      
      const weekChange = sevenDaysWeight != null && !isNaN(sevenDaysWeight) ? currentWeight - sevenDaysWeight : 0;
      const monthChange = thirtyDaysWeight != null && !isNaN(thirtyDaysWeight) ? currentWeight - thirtyDaysWeight : 0;
      
      const entryDate = latestMetricsEntry.date ? new Date(latestMetricsEntry.date) : (latestMetricsEntry.timestamp ? new Date(latestMetricsEntry.timestamp) : new Date());
      
      bodyData.push({
        name: 'Poids',
        value: formatWeight(currentWeight),
        numericValue: currentWeight,
        date: entryDate,
        weekChange: weekChange,
        monthChange: monthChange,
        category: 'basic',
        trend: weekChange < -0.1 ? 'down' : weekChange > 0.1 ? 'up' : 'stable',
        isGood: weekChange < 0 || weekChange === 0
      });
    }

    // Taille (rarement change, donc pas de calcul variation)
    if (latestMetricsEntry?.height != null && !isNaN(latestMetricsEntry.height)) {
      const entryDate = latestMetricsEntry.date ? new Date(latestMetricsEntry.date) : (latestMetricsEntry.timestamp ? new Date(latestMetricsEntry.timestamp) : new Date());
      
      bodyData.push({
        name: 'Taille',
        value: formatHeight(latestMetricsEntry.height),
        numericValue: latestMetricsEntry.height,
        date: entryDate,
        weekChange: 0,
        monthChange: 0,
        category: 'basic',
        trend: 'stable',
        isGood: true
      });
    }

    // IMC (calculé depuis weight + height)
    if (latestMetricsEntry?.weight != null && latestMetricsEntry?.height != null && 
        !isNaN(latestMetricsEntry.weight) && !isNaN(latestMetricsEntry.height)) {
      const currentBMI = latestMetricsEntry.weight / Math.pow(latestMetricsEntry.height / 100, 2);
      
      let weekChange = 0;
      let monthChange = 0;
      
      if (sevenDaysAgoMetricsEntry?.weight && sevenDaysAgoMetricsEntry?.height &&
          !isNaN(sevenDaysAgoMetricsEntry.weight) && !isNaN(sevenDaysAgoMetricsEntry.height)) {
        const sevenDaysBMI = sevenDaysAgoMetricsEntry.weight / Math.pow(sevenDaysAgoMetricsEntry.height / 100, 2);
        weekChange = currentBMI - sevenDaysBMI;
      }
      
      if (thirtyDaysAgoMetricsEntry?.weight && thirtyDaysAgoMetricsEntry?.height &&
          !isNaN(thirtyDaysAgoMetricsEntry.weight) && !isNaN(thirtyDaysAgoMetricsEntry.height)) {
        const thirtyDaysBMI = thirtyDaysAgoMetricsEntry.weight / Math.pow(thirtyDaysAgoMetricsEntry.height / 100, 2);
        monthChange = currentBMI - thirtyDaysBMI;
      }
      
      const entryDate = latestMetricsEntry.date ? new Date(latestMetricsEntry.date) : (latestMetricsEntry.timestamp ? new Date(latestMetricsEntry.timestamp) : new Date());
      
      bodyData.push({
        name: 'IMC',
        value: formatBMI(currentBMI),
        numericValue: currentBMI,
        date: entryDate,
        weekChange: weekChange,
        monthChange: monthChange,
        category: 'calculated',
        trend: weekChange < -0.1 ? 'down' : weekChange > 0.1 ? 'up' : 'stable',
        isGood: currentBMI >= 18.5 && currentBMI < 25
      });
    }

    // Mensurations
    const measurements = [
      { key: 'waist', name: 'Tour de taille', unit: 'cm', isGoodDown: true },
      { key: 'chest', name: 'Tour de poitrine', unit: 'cm', isGoodDown: false },
      { key: 'arms', name: 'Tour de bras', unit: 'cm', isGoodDown: false },
      { key: 'thighs', name: 'Tour de cuisses', unit: 'cm', isGoodDown: false },
      { key: 'neck', name: 'Tour de cou', unit: 'cm', isGoodDown: true },
      { key: 'hips', name: 'Tour de hanches', unit: 'cm', isGoodDown: true }
    ];

    measurements.forEach(measurement => {
      if (latestMetricsEntry?.[measurement.key] != null && !isNaN(latestMetricsEntry[measurement.key])) {
        const currentValue = latestMetricsEntry[measurement.key];
        const sevenDaysValue = sevenDaysAgoMetricsEntry?.[measurement.key];
        const thirtyDaysValue = thirtyDaysAgoMetricsEntry?.[measurement.key];
        
        const weekChange = sevenDaysValue != null && !isNaN(sevenDaysValue) ? currentValue - sevenDaysValue : 0;
        const monthChange = thirtyDaysValue != null && !isNaN(thirtyDaysValue) ? currentValue - thirtyDaysValue : 0;
        
        const entryDate = latestMetricsEntry.date ? new Date(latestMetricsEntry.date) : (latestMetricsEntry.timestamp ? new Date(latestMetricsEntry.timestamp) : new Date());
        
        bodyData.push({
          name: measurement.name,
          value: formatMeasurement(currentValue),
          numericValue: currentValue,
          date: entryDate,
          weekChange: weekChange,
          monthChange: monthChange,
          category: 'measurements',
          trend: weekChange < -0.1 ? 'down' : weekChange > 0.1 ? 'up' : 'stable',
          isGood: measurement.isGoodDown ? (weekChange <= 0) : true // Tour de taille/cou : baisse = bon
        });
      }
    });

    // === MÉTRIQUES D'IMPÉDANCEMÉTRIE (type 'impedance') ===
    
    if (latestImpedanceEntry) {
      const impedanceMetrics = [
        { key: 'weight', name: 'Poids', unit: 'kg', isGoodDown: true },
        { key: 'bmi', name: 'IMC', unit: '', isGoodDown: false },
        { key: 'bodyFatPercentage', name: 'Taux de graisse corporel', unit: '%', isGoodDown: true },
        { key: 'muscleMass', name: 'Masse musculaire', unit: 'kg', isGoodDown: false },
        { key: 'bodyFatMass', name: 'Graisses corporelles', unit: 'kg', isGoodDown: true },
        { key: 'bodyFatIndex', name: 'Indice de masse grasse', unit: '/8', isGoodDown: true },
        { key: 'obesityLevel', name: 'Niveau d\'obésité', unit: '/5', isGoodDown: true },
        { key: 'visceralFatIndex', name: 'Indice de graisse viscérale', unit: '/20', isGoodDown: true },
        { key: 'fatFreeWeight', name: 'Poids sans graisse', unit: 'kg', isGoodDown: false },
        { key: 'bodyWater', name: 'Eau du corps', unit: '%', isGoodDown: false },
        { key: 'boneMass', name: 'Masse osseuse', unit: 'kg', isGoodDown: false },
        { key: 'proteinPercentage', name: 'Taux de protéines', unit: '%', isGoodDown: false },
        { key: 'basalMetabolism', name: 'Taux métabolique basal', unit: 'kcal', isGoodDown: false },
        { key: 'metabolicAge', name: 'Âge métabolique', unit: 'ans', isGoodDown: true },
        // Compatibilité avec ancien format (uniquement si nouveau format n'existe pas)
        { key: 'visceralFat', name: 'Graisse viscérale', unit: '', isGoodDown: true, onlyIfMissing: 'visceralFatIndex' },
        { key: 'skeletalMuscle', name: 'Muscle squelettique', unit: 'kg', isGoodDown: false, onlyIfMissing: 'muscleMass' }
      ];

      impedanceMetrics.forEach(metric => {
        // Vérifier compatibilité : si onlyIfMissing est défini, ne pas afficher si le champ préféré existe
        if (metric.onlyIfMissing && latestImpedanceEntry[metric.onlyIfMissing] != null) {
          return; // Skip ce champ car le nouveau format existe
        }
        
        if (latestImpedanceEntry[metric.key] != null && !isNaN(latestImpedanceEntry[metric.key])) {
          const currentValue = latestImpedanceEntry[metric.key];
          // Gérer compatibilité pour calcul des variations (utiliser ancien nom si nouveau n'existe pas)
          const getValueForComparison = (entry, key) => {
            if (!entry) return null;
            // Si le champ principal existe, l'utiliser
            if (entry[key] != null) return entry[key];
            // Sinon, chercher le champ de compatibilité
            if (key === 'visceralFatIndex' && entry.visceralFat != null) return entry.visceralFat;
            if (key === 'muscleMass' && entry.skeletalMuscle != null) return entry.skeletalMuscle;
            return null;
          };
          const sevenDaysValue = getValueForComparison(sevenDaysAgoImpedanceEntry, metric.key);
          const thirtyDaysValue = getValueForComparison(thirtyDaysAgoImpedanceEntry, metric.key);
          
          const weekChange = sevenDaysValue != null && !isNaN(sevenDaysValue) ? currentValue - sevenDaysValue : 0;
          const monthChange = thirtyDaysValue != null && !isNaN(thirtyDaysValue) ? currentValue - thirtyDaysValue : 0;
          
          const entryDate = latestImpedanceEntry.date ? new Date(latestImpedanceEntry.date) : (latestImpedanceEntry.timestamp ? new Date(latestImpedanceEntry.timestamp) : new Date());
          
          // Formater selon type
          const formattedValue = metric.unit === '%'
            ? formatPercentage(currentValue)
            : metric.unit === 'kg'
            ? formatWeight(currentValue)
            : metric.unit === 'ans'
            ? formatValue(currentValue, 'age')
            : metric.unit === 'kcal'
            ? `${currentValue} kcal`
            : metric.unit === '/8' || metric.unit === '/5' || metric.unit === '/20'
            ? `${currentValue}${metric.unit}`
            : `${currentValue}${metric.unit ? ` ${metric.unit}` : ''}`;
          
          bodyData.push({
            name: metric.name,
            value: formattedValue,
            numericValue: currentValue,
            date: entryDate,
            weekChange: weekChange,
            monthChange: monthChange,
            category: 'impedance',
            trend: weekChange < -0.1 ? 'down' : weekChange > 0.1 ? 'up' : 'stable',
            isGood: metric.isGoodDown ? (weekChange <= 0) : (weekChange >= 0)
          });
        }
      });
    }

    return bodyData;
  }, [data?.progressEntries]);

  const getTrendIcon = (trend, isGood) => {
    if (trend === 'stable') return <Minus className="w-4 h-4 text-teal-800" />;
    
    const isPositiveTrend = (trend === 'up' && isGood) || (trend === 'down' && !isGood);
    
    if (trend === 'up') {
      return <TrendingUp className={`w-4 h-4 ${isPositiveTrend ? 'text-green-400' : 'text-red-400'}`} />;
    } else {
      return <TrendingDown className={`w-4 h-4 ${isPositiveTrend ? 'text-red-400' : 'text-green-400'}`} />;
    }
  };

  const getChangeColor = (change, isGood, trend) => {
    if (change === 0) return 'text-teal-800';
    
    const isPositiveChange = change > 0;
    const shouldBePositive = (trend === 'up' && isGood) || (trend === 'down' && !isGood);
    
    return (isPositiveChange === shouldBePositive) ? 'text-green-400' : 'text-red-400';
  };

  const getDaysAgo = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // 🔍 Filtrer et trier données (MEMOIZED)
  const filteredData = useMemo(() => {
    return bodyData.filter(item => {
      if (filterBy === 'all') return true;
      return item.category === filterBy;
    });
  }, [bodyData, filterBy]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return new Date(b.date) - new Date(a.date);
        case 'weekChange':
          return Math.abs(b.weekChange) - Math.abs(a.weekChange);
        case 'monthChange':
          return Math.abs(b.monthChange) - Math.abs(a.monthChange);
        default:
          return 0;
      }
    });
  }, [filteredData, sortBy]);

  // 📝 Générer résumé dynamique depuis vraies données (MEMOIZED)
  const summaryText = useMemo(() => {
    if (bodyData.length === 0) {
      return "Aucune donnée disponible pour générer un résumé. Commencez par saisir vos métriques corporelles.";
    }

    // Filtrer changements significatifs (> 0.1 pour éviter bruit)
    const significantChanges = bodyData.filter(item => 
      item.numericValue != null && Math.abs(item.monthChange) > 0.1
    );

    // Calculer améliorations positives
    const positiveChanges = significantChanges.filter(item => 
      (item.trend === 'up' && item.isGood) || (item.trend === 'down' && !item.isGood)
    );

    // Trouver les métriques clés avec changements réels
    const weightChange = bodyData.find(item => item.name === 'Poids');
    const bodyFatChange = bodyData.find(item => item.name === 'Masse graisseuse');
    const bodyWaterChange = bodyData.find(item => item.name === 'Eau du corps');

    // Construire résumé dynamique
    const parts = [];
    
    if (positiveChanges.length > 0) {
      parts.push(`${positiveChanges.length} amélioration${positiveChanges.length > 1 ? 's' : ''} significative${positiveChanges.length > 1 ? 's' : ''} détectée${positiveChanges.length > 1 ? 's' : ''}`);
    }

    const details = [];
    if (weightChange && Math.abs(weightChange.monthChange) > 0.1) {
      const changeFormatted = formatChange(weightChange.monthChange, { type: 'weight' });
      details.push(`Poids ${changeFormatted.formatted}`);
    }
    
    if (bodyFatChange && Math.abs(bodyFatChange.monthChange) > 0.1) {
      const changeFormatted = formatChange(bodyFatChange.monthChange, { type: 'percentage' });
      details.push(`masse graisseuse ${changeFormatted.formatted}`);
    }
    
    if (bodyWaterChange && Math.abs(bodyWaterChange.monthChange) > 0.1) {
      const changeFormatted = formatChange(bodyWaterChange.monthChange, { type: 'percentage' });
      details.push(`eau du corps ${changeFormatted.formatted}`);
    }

    if (details.length > 0) {
      parts.push(details.join(', '));
    }

    if (parts.length === 0) {
      return "Vos métriques sont stables depuis 30 jours. Continuez votre suivi pour observer des changements significatifs.";
    }

    return `Depuis 30 jours : ${parts.join('. ')}.`;
  }, [bodyData]);

  // 📝 Préparer les entrées pour l'édition (toutes les sessions)
  const allEntriesForEdit = useMemo(() => {
    if (!data?.progressEntries || data.progressEntries.length === 0) {
      return [];
    }

    return [...data.progressEntries].sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : (a.timestamp ? new Date(a.timestamp) : new Date(0));
      const dateB = b.date ? new Date(b.date) : (b.timestamp ? new Date(b.timestamp) : new Date(0));
      return dateB - dateA; // Plus récent en premier
    });
  }, [data?.progressEntries]);

  // Gérer les modifications des champs
  const handleFieldChange = (entryId, fieldName, value) => {
    setEditedEntries(prev => {
      const entryKey = `${entryId}_${fieldName}`;
      const newEdited = { ...prev };
      if (value === '' || value === null) {
        delete newEdited[entryKey];
      } else {
        newEdited[entryKey] = { entryId, fieldName, value };
      }
      return newEdited;
    });
  };

  // Gérer la suppression d'une session
  const handleDeleteSession = (entryId) => {
    setEntriesToDelete(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  // Gérer la suppression d'un champ spécifique
  const handleDeleteField = (entryId, fieldName) => {
    const fieldKey = `${entryId}_${fieldName}`;
    setFieldsToDelete(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldKey)) {
        newSet.delete(fieldKey);
      } else {
        newSet.add(fieldKey);
      }
      return newSet;
    });
  };

  // Sauvegarder toutes les modifications
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Supprimer les sessions entières
      for (const entryId of entriesToDelete) {
        await deleteProgressEntry(entryId);
      }

      // Supprimer les champs spécifiques
      for (const fieldKey of fieldsToDelete) {
        const [entryId, fieldName] = fieldKey.split('_');
        await deleteProgressEntryField(entryId, fieldName);
      }

      // Mettre à jour les entrées modifiées
      const updatesByEntry = {};
      Object.values(editedEntries).forEach(({ entryId, fieldName, value }) => {
        if (!updatesByEntry[entryId]) {
          updatesByEntry[entryId] = {};
        }
        // Gérer les types selon le champ
        if (fieldName === 'date') {
          // La date est gérée séparément par updateProgressEntry
          updatesByEntry[entryId][fieldName] = value;
        } else if (fieldName === 'bodyType' || fieldName === 'notes') {
          // bodyType et notes sont des strings, pas des nombres
          updatesByEntry[entryId][fieldName] = value === '' ? null : value;
        } else if (value === '' || value === null) {
          updatesByEntry[entryId][fieldName] = null;
        } else {
          // Essayer de parser en nombre pour les champs numériques
          const numValue = parseFloat(value);
          updatesByEntry[entryId][fieldName] = !isNaN(numValue) && isFinite(numValue) ? numValue : value;
        }
      });

      for (const [entryId, updates] of Object.entries(updatesByEntry)) {
        await updateProgressEntry(entryId, updates);
      }

      // Réinitialiser les états
      setEditedEntries({});
      setEntriesToDelete(new Set());
      setFieldsToDelete(new Set());
      setEditMode(false);

      log.info('Modifications enregistrées avec succès');
    } catch (error) {
      log.error('Erreur lors de la sauvegarde des modifications', error);
      alert('Erreur lors de la sauvegarde des modifications. Veuillez réessayer.');
    } finally {
      setIsSaving(false);
    }
  };

  // Annuler les modifications
  const handleCancelEdit = () => {
    setEditedEntries({});
    setEntriesToDelete(new Set());
    setFieldsToDelete(new Set());
    setEditMode(false);
  };

  // Obtenir la valeur d'un champ (éditée ou originale)
  const getFieldValue = (entry, fieldName) => {
    const entryKey = `${entry.id}_${fieldName}`;
    if (editedEntries[entryKey]) {
      return editedEntries[entryKey].value;
    }
    if (fieldName === 'date') {
      return entry.date ? new Date(entry.date).toISOString().split('T')[0] : '';
    }
    const value = entry[fieldName];
    if (value == null || value === '') {
      return '';
    }
    // Pour les valeurs numériques, retourner le nombre (sera converti en string par React)
    return typeof value === 'number' ? value : value;
  };

  // Vérifier si une entrée est marquée pour suppression
  const isEntryMarkedForDeletion = (entryId) => {
    return entriesToDelete.has(entryId);
  };

  // Vérifier si un champ est marqué pour suppression
  const isFieldMarkedForDeletion = (entryId, fieldName) => {
    return fieldsToDelete.has(`${entryId}_${fieldName}`);
  };

  // Définir les champs éditables selon le type d'entrée
  const getEditableFields = (entry) => {
    if (entry.type === 'metrics') {
      return [
        { key: 'weight', label: 'Poids (kg)', type: 'number', step: '0.1' },
        { key: 'height', label: 'Taille (cm)', type: 'number', step: '0.1' },
        { key: 'waist', label: 'Tour de taille (cm)', type: 'number', step: '0.1' },
        { key: 'chest', label: 'Tour de poitrine (cm)', type: 'number', step: '0.1' },
        { key: 'arms', label: 'Tour de bras (cm)', type: 'number', step: '0.1' },
        { key: 'thighs', label: 'Tour de cuisses (cm)', type: 'number', step: '0.1' },
        { key: 'neck', label: 'Tour de cou (cm)', type: 'number', step: '0.1' },
        { key: 'hips', label: 'Tour de hanches (cm)', type: 'number', step: '0.1' }
      ];
    } else if (entry.type === 'impedance') {
      return [
        { key: 'weight', label: 'Poids (kg)', type: 'number', step: '0.1' },
        { key: 'bmi', label: 'IMC', type: 'number', step: '0.1' },
        { key: 'bodyFatPercentage', label: 'Taux de graisse corporel (%)', type: 'number', step: '0.1' },
        { key: 'muscleMass', label: 'Masse musculaire (kg)', type: 'number', step: '0.1' },
        { key: 'bodyFatMass', label: 'Graisses corporelles (kg)', type: 'number', step: '0.1' },
        { key: 'bodyFatIndex', label: 'Indice de masse grasse (/8)', type: 'number', step: '0.1', max: 8 },
        { key: 'obesityLevel', label: 'Niveau d\'obésité (/5)', type: 'number', step: '0.1', max: 5 },
        { key: 'visceralFatIndex', label: 'Indice de graisse viscérale (/20)', type: 'number', step: '0.1', max: 20 },
        { key: 'fatFreeWeight', label: 'Poids sans graisse (kg)', type: 'number', step: '0.1' },
        { key: 'bodyWater', label: 'Eau du corps (%)', type: 'number', step: '0.1' },
        { key: 'boneMass', label: 'Masse osseuse (kg)', type: 'number', step: '0.1' },
        { key: 'proteinPercentage', label: 'Taux de protéines (%)', type: 'number', step: '0.1' },
        { key: 'basalMetabolism', label: 'Taux métabolique basal (kcal)', type: 'number', step: '1' },
        { key: 'metabolicAge', label: 'Âge métabolique (ans)', type: 'number', step: '1' },
        // Compatibilité avec ancien format
        { key: 'visceralFat', label: 'Graisse viscérale', type: 'number', step: '0.1' },
        { key: 'skeletalMuscle', label: 'Muscle squelettique (kg)', type: 'number', step: '0.1' }
      ];
    }
    return [];
  };

  // Obtenir les options pour le type de corps
  const getBodyTypeOptions = () => [
    { value: 'mince', label: 'Mince' },
    { value: 'fin_mince', label: 'Fin mince' },
    { value: 'standard', label: 'Standard' },
    { value: 'obese', label: 'Obèse' },
    { value: 'surpoids', label: 'Surpoids' },
    { value: 'athletique', label: 'Athlétique' },
    { value: 'surpoids_cache', label: 'Surpoids caché' }
  ];

  const hasChanges = editedEntries && Object.keys(editedEntries).length > 0 || 
                     entriesToDelete && entriesToDelete.size > 0 ||
                     fieldsToDelete && fieldsToDelete.size > 0;

  return (
    <div className="space-y-6">
      {/* Bouton pour basculer entre vue normale et édition */}
      <Card variant="sport">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="mb-1 font-semibold text-teal-100">
                {editMode ? 'Mode Édition' : 'Vue Récapitulatif'}
              </h3>
              <p className="text-sm text-teal-700">
                {editMode 
                  ? 'Modifiez vos sessions d\'enregistrement. N\'oubliez pas de sauvegarder vos modifications.'
                  : 'Vue d\'ensemble de vos métriques corporelles'}
              </p>
            </div>
            <Button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center gap-2 border-2 ${
                editMode
                  ? 'border-[#0F4C5C]/60 bg-black text-teal-100 hover:bg-[#0F4C5C]/15'
                  : 'border-[#0F5C45]/55 bg-[#0F5C45]/30 text-teal-100 hover:bg-[#0F5C45]/45'
              }`}
            >
              {editMode ? (
                <>
                  <Eye className="w-4 h-4" />
                  Vue normale
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  Modifier les saisies
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {!editMode ? (
        <>
          {/* Résumé automatique */}
          <Card variant="sport">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg border border-[#0F4C5C]/50 bg-[#0F4C5C]/20 p-3">
                  <Info className="h-6 w-6 text-sky-400" />
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-teal-100">Résumé de progression (30 jours)</h3>
                  <p className="text-teal-100">{summaryText}</p>
                </div>
              </div>
            </CardContent>
          </Card>

      {/* Contrôles de tri et filtrage */}
      <Card variant="sport">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-teal-600" />
              <span className="text-sm text-teal-200">Trier par :</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded border border-[#0F4C5C]/55 bg-black px-3 py-1 text-sm text-teal-100 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40"
              >
                <option value="name">Nom</option>
                <option value="date">Date</option>
                <option value="weekChange">Variation semaine</option>
                <option value="monthChange">Variation mois</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-teal-600" />
              <span className="text-sm text-teal-200">Filtrer :</span>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="rounded border border-[#0F4C5C]/55 bg-black px-3 py-1 text-sm text-teal-100 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40"
              >
                <option value="all">Toutes les métriques</option>
                <option value="basic">Métriques de base</option>
                <option value="measurements">Mensurations</option>
                <option value="impedance">Impédancemétrie</option>
                <option value="calculated">Calculs automatiques</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau récapitulatif */}
      <Card variant="sport">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-teal-100">
            📊 Tableau récapitulatif - Vue d'ensemble
            <span className="text-sm font-normal text-teal-700">
              ({sortedData.length} métriques)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#0F4C5C]/50">
                  <th className="px-4 py-3 text-left font-semibold text-teal-200">Métrique</th>
                  <th className="px-4 py-3 text-left font-semibold text-teal-200">Valeur actuelle</th>
                  <th className="px-4 py-3 text-left font-semibold text-teal-200">Dernière mesure</th>
                  <th className="px-4 py-3 text-left font-semibold text-teal-200">7 jours</th>
                  <th className="px-4 py-3 text-left font-semibold text-teal-200">30 jours</th>
                  <th className="px-4 py-3 text-left font-semibold text-teal-200">Tendance</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((item, index) => {
                  const daysAgo = getDaysAgo(item.date);
                  const isStale = daysAgo > 7;
                  
                  return (
                    <tr key={index} className="border-b border-[#0F4C5C]/35 hover:bg-[#0F4C5C]/10">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-teal-100">{item.name}</span>
                          {isStale && (
                            <AlertTriangle
                              className="h-4 w-4 text-amber-400"
                              title={`Pas de mise à jour depuis ${daysAgo} jours`}
                            />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-teal-100">{item.value}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-sm text-teal-700">
                          <Calendar className="w-3 h-3" />
                          {daysAgo === 0 ? "Aujourd'hui" : `Il y a ${daysAgo} jour${daysAgo > 1 ? 's' : ''}`}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          {item.weekChange !== 0 ? (
                            <>
                              {(() => {
                                // Déterminer type selon nom métrique
                                let changeType = 'weight';
                                if (item.name.includes('%') || item.name.includes('graisseuse') || item.name.includes('eau')) {
                                  changeType = 'percentage';
                                } else if (item.name.includes('cm') || item.name.includes('Tour')) {
                                  changeType = 'measurements';
                                }
                                
                                const changeFormatted = formatChange(item.weekChange, { type: changeType });
                                const changeWithPct = formatChangeWithPercentage(
                                  item.weekChange,
                                  item.numericValue,
                                  { type: changeType }
                                );
                                
                                return (
                                  <>
                                    <span className={`font-medium ${getChangeColor(item.weekChange, item.isGood, item.trend)}`}>
                                      {changeFormatted.formatted}
                                    </span>
                                    {changeWithPct.percentage && (
                                      <span className="text-xs text-teal-700">
                                        ({changeWithPct.percentage})
                                      </span>
                                    )}
                                  </>
                                );
                              })()}
                            </>
                          ) : (
                            <span className="text-teal-800">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          {item.monthChange !== 0 ? (
                            <>
                              {(() => {
                                // Déterminer type selon nom métrique
                                let changeType = 'weight';
                                if (item.name.includes('%') || item.name.includes('graisseuse') || item.name.includes('eau')) {
                                  changeType = 'percentage';
                                } else if (item.name.includes('cm') || item.name.includes('Tour')) {
                                  changeType = 'measurements';
                                }
                                
                                const changeFormatted = formatChange(item.monthChange, { type: changeType });
                                const changeWithPct = formatChangeWithPercentage(
                                  item.monthChange,
                                  item.numericValue,
                                  { type: changeType }
                                );
                                
                                return (
                                  <>
                                    <span className={`font-medium ${getChangeColor(item.monthChange, item.isGood, item.trend)}`}>
                                      {changeFormatted.formatted}
                                    </span>
                                    {changeWithPct.percentage && (
                                      <span className="text-xs text-teal-700">
                                        ({changeWithPct.percentage})
                                      </span>
                                    )}
                                  </>
                                );
                              })()}
                            </>
                          ) : (
                            <span className="text-teal-800">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getTrendIcon(item.trend, item.isGood)}
                          <span className="text-sm capitalize text-teal-700">
                            {item.trend === 'up' ? 'Hausse' : item.trend === 'down' ? 'Baisse' : 'Stable'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {sortedData.length === 0 && (
            <div className="py-12 text-center">
              <div className="text-teal-700">
                <Info className="mx-auto mb-4 h-16 w-16 text-teal-600" />
                <h4 className="mb-2 text-xl font-semibold text-teal-100">Aucune donnée disponible</h4>
                <p>Commencez par saisir vos premières métriques corporelles.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

          {/* Indicateurs de fraîcheur - Afficher seulement si données obsolètes */}
          {sortedData.some(item => {
            const daysAgo = getDaysAgo(item.date);
            return daysAgo > 7;
          }) && (
            <Card variant="sport" className="border-amber-500/40">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  <div>
                    <h4 className="font-semibold text-amber-200">Données à actualiser</h4>
                    <p className="text-sm text-teal-100">
                      Certaines métriques n'ont pas été mises à jour récemment. 
                      Pensez à effectuer de nouvelles mesures pour maintenir un suivi précis.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
          {/* Vue d'édition */}
          <Card variant="sport">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 text-teal-100">
                <Edit className="h-5 w-5 text-sky-400" />
                Édition des sessions d'enregistrement
                <span className="text-sm font-normal text-teal-700">
                  ({allEntriesForEdit.length} session{allEntriesForEdit.length > 1 ? 's' : ''})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allEntriesForEdit.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="text-teal-700">
                    <Info className="mx-auto mb-4 h-16 w-16 text-teal-600" />
                    <h4 className="mb-2 text-xl font-semibold text-teal-100">Aucune session disponible</h4>
                    <p>Commencez par saisir vos premières métriques corporelles.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {allEntriesForEdit.map((entry) => {
                    const entryDate = entry.date ? new Date(entry.date) : (entry.timestamp ? new Date(entry.timestamp) : new Date());
                    const dateStr = formatDate(entryDate);
                    const isMarkedForDeletion = isEntryMarkedForDeletion(entry.id);
                    const editableFields = getEditableFields(entry);

                    return (
                      <Card
                        key={entry.id}
                        variant="sport"
                        className={
                          isMarkedForDeletion ? '!border-red-500/60 bg-red-950/30' : ''
                        }
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                {entry.type === 'metrics' ? '📏 Métriques corporelles' : '⚡ Impédancemétrie'}
                              </CardTitle>
                              <p className="mt-1 text-sm text-teal-700">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                {dateStr}
                              </p>
                            </div>
                            <Button
                              onClick={() => handleDeleteSession(entry.id)}
                              className={`flex items-center gap-2 ${
                                isMarkedForDeletion 
                                  ? 'bg-green-600 hover:bg-green-700' 
                                  : 'bg-red-600 hover:bg-red-700'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                              {isMarkedForDeletion ? 'Annuler suppression' : 'Supprimer session'}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {isMarkedForDeletion ? (
                            <div className="py-4 text-center text-red-400">
                              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                              <p className="font-semibold">Cette session sera supprimée lors de la sauvegarde</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Édition de la date */}
                              <div className="rounded-lg border border-[#0F4C5C]/50 bg-black p-3">
                                <label className="mb-2 block text-sm font-medium text-teal-100">
                                  Date de la session
                                </label>
                                <input
                                  type="date"
                                  value={getFieldValue(entry, 'date')}
                                  onChange={(e) => handleFieldChange(entry.id, 'date', e.target.value)}
                                  className="w-full rounded border border-[#0F4C5C]/55 bg-black px-3 py-2 text-teal-100 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40"
                                />
                              </div>
                              {/* Champs éditables */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {editableFields.map((field) => {
                                const fieldValue = getFieldValue(entry, field.key);
                                const isFieldDeleted = isFieldMarkedForDeletion(entry.id, field.key);
                                const hasValue = entry[field.key] != null && entry[field.key] !== '';

                                return (
                                  <div 
                                    key={field.key}
                                    className={`rounded-lg border p-3 ${
                                      isFieldDeleted
                                        ? 'border-red-500/50 bg-red-900/20'
                                        : 'border-[#0F4C5C]/50 bg-black'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="text-sm font-medium text-teal-100">
                                        {field.label}
                                      </label>
                                      {hasValue && (
                                        <Button
                                          onClick={() => handleDeleteField(entry.id, field.key)}
                                          className={`p-1 h-6 w-6 ${
                                            isFieldDeleted 
                                              ? 'bg-green-600 hover:bg-green-700' 
                                              : 'bg-red-600 hover:bg-red-700'
                                          }`}
                                          title={isFieldDeleted ? 'Annuler suppression' : 'Supprimer cette donnée'}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </div>
                                    {isFieldDeleted ? (
                                      <div className="text-red-400 text-sm py-2">
                                        Cette donnée sera supprimée
                                      </div>
                                    ) : (
                                      <input
                                        type={field.type}
                                        step={field.step}
                                        max={field.max}
                                        min={field.min || 0}
                                        value={fieldValue}
                                        onChange={(e) => handleFieldChange(entry.id, field.key, e.target.value)}
                                        className="w-full rounded border border-[#0F4C5C]/55 bg-black px-3 py-2 text-teal-100 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40"
                                        placeholder="—"
                                      />
                                    )}
                                  </div>
                                );
                              })}
                              </div>
                              {/* Type de corps et Notes (pour impédance) */}
                              {entry.type === 'impedance' && (
                                <>
                                  <div className="rounded-lg border border-[#0F4C5C]/50 bg-black p-3">
                                    <label className="mb-2 block text-sm font-medium text-teal-100">
                                      Type de corps
                                    </label>
                                    <select
                                      value={getFieldValue(entry, 'bodyType')}
                                      onChange={(e) => handleFieldChange(entry.id, 'bodyType', e.target.value)}
                                      className="w-full rounded border border-[#0F4C5C]/55 bg-black px-3 py-2 text-teal-100 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40"
                                    >
                                      <option value="">Sélectionner...</option>
                                      {getBodyTypeOptions().map(option => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="rounded-lg border border-[#0F4C5C]/50 bg-black p-3">
                                    <label className="mb-2 block text-sm font-medium text-teal-100">
                                      Notes (optionnel)
                                    </label>
                                    <textarea
                                      value={getFieldValue(entry, 'notes')}
                                      onChange={(e) => handleFieldChange(entry.id, 'notes', e.target.value)}
                                      className="w-full rounded border border-[#0F4C5C]/55 bg-black px-3 py-2 text-teal-100 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40"
                                      rows="3"
                                      placeholder="Conditions de mesure, observations..."
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bouton d'enregistrement en bas */}
          {hasChanges && (
            <Card variant="sport" className="sticky bottom-0 z-10 border-[#0F5C45]/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-sky-400" />
                    <div>
                      <h4 className="font-semibold text-teal-100">Modifications non sauvegardées</h4>
                      <p className="text-sm text-teal-200">
                        {entriesToDelete.size > 0 && `${entriesToDelete.size} session${entriesToDelete.size > 1 ? 's' : ''} à supprimer`}
                        {entriesToDelete.size > 0 && fieldsToDelete.size > 0 && ', '}
                        {fieldsToDelete.size > 0 && `${fieldsToDelete.size} donnée${fieldsToDelete.size > 1 ? 's' : ''} à supprimer`}
                        {Object.keys(editedEntries).length > 0 && (entriesToDelete.size > 0 || fieldsToDelete.size > 0) && ', '}
                        {Object.keys(editedEntries).length > 0 && `${Object.keys(editedEntries).length} modification${Object.keys(editedEntries).length > 1 ? 's' : ''} en attente`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 border-2 border-[#0F4C5C]/55 bg-black text-teal-100 hover:bg-[#0F4C5C]/15"
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                      Annuler
                    </Button>
                    <Button
                      onClick={handleSaveChanges}
                      className="flex items-center gap-2 border-2 border-[#0F5C45]/55 bg-[#0F5C45]/35 text-teal-100 hover:bg-[#0F5C45]/50"
                      disabled={isSaving}
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default SummaryTableSection;