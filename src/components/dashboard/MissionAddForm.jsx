import React, { useState } from 'react';
import Modal from '../ui/Modal';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';

/**
 * MissionAddForm Component - Modal form for adding new missions
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Function} props.onSubmit - Callback when form is submitted
 */
const MissionAddForm = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    name: '',
    benefit: '',
    targetValue: '',
    unit: 'reps',
    date: new Date().toISOString().split('T')[0],
    xp: '10'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Unit options
  const unitOptions = [
    { value: 'reps', label: 'Répétitions' },
    { value: 'min', label: 'Minutes' },
    { value: 'sec', label: 'Secondes' },
    { value: 'sets', label: 'Séries' },
    { value: 'km', label: 'Kilomètres' }
  ];

  // Get day name in French from date
  const getDayName = (dateString) => {
    const date = new Date(dateString);
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[date.getDay()];
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.benefit.trim()) {
      newErrors.benefit = 'Le bénéfice est requis';
    }

    if (!formData.targetValue || formData.targetValue <= 0) {
      newErrors.targetValue = 'La valeur cible doit être supérieure à 0';
    }

    if (!formData.date) {
      newErrors.date = 'La date est requise';
    }

    if (!formData.xp || formData.xp <= 0) {
      newErrors.xp = 'Les XP doivent être supérieurs à 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setSubmitError(null);

    try {
      await onSubmit({
        name: formData.name.trim(),
        benefit: formData.benefit.trim(),
        targetValue: parseInt(formData.targetValue),
        unit: formData.unit,
        date: formData.date,
        xp: parseInt(formData.xp)
      });

      // Reset form
      setFormData({
        name: '',
        benefit: '',
        targetValue: '',
        unit: 'reps',
        date: new Date().toISOString().split('T')[0],
        xp: '10'
      });
      setErrors({});
      onClose();
    } catch (error) {
      setSubmitError(error.message || 'Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajouter une mission"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div className="form-group">
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Nom de la mission
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ex: Pompes, Course..."
            className={`w-full px-4 py-2 bg-gray-800 border ${
              errors.name ? 'border-red-500' : 'border-gray-700'
            } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors`}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="mt-1 text-sm text-red-400">
              {errors.name}
            </p>
          )}
        </div>

        {/* Benefit Field */}
        <div className="form-group">
          <label htmlFor="benefit" className="block text-sm font-medium text-gray-300 mb-2">
            Bénéfice
          </label>
          <input
            type="text"
            id="benefit"
            name="benefit"
            value={formData.benefit}
            onChange={handleChange}
            placeholder="Ex: Force, Endurance..."
            className={`w-full px-4 py-2 bg-gray-800 border ${
              errors.benefit ? 'border-red-500' : 'border-gray-700'
            } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors`}
            aria-invalid={!!errors.benefit}
            aria-describedby={errors.benefit ? 'benefit-error' : undefined}
          />
          {errors.benefit && (
            <p id="benefit-error" className="mt-1 text-sm text-red-400">
              {errors.benefit}
            </p>
          )}
        </div>

        {/* Target Value and Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label htmlFor="targetValue" className="block text-sm font-medium text-gray-300 mb-2">
              Valeur cible
            </label>
            <input
              type="number"
              id="targetValue"
              name="targetValue"
              value={formData.targetValue}
              onChange={handleChange}
              placeholder="Ex: 50"
              min="1"
              className={`w-full px-4 py-2 bg-gray-800 border ${
                errors.targetValue ? 'border-red-500' : 'border-gray-700'
              } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors`}
              aria-invalid={!!errors.targetValue}
              aria-describedby={errors.targetValue ? 'targetValue-error' : undefined}
            />
            {errors.targetValue && (
              <p id="targetValue-error" className="mt-1 text-sm text-red-400">
                {errors.targetValue}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="unit" className="block text-sm font-medium text-gray-300 mb-2">
              Unité
            </label>
            <select
              id="unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors"
            >
              {unitOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Field */}
        <div className="form-group">
          <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className={`w-full px-4 py-2 bg-gray-800 border ${
              errors.date ? 'border-red-500' : 'border-gray-700'
            } rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors`}
            aria-invalid={!!errors.date}
            aria-describedby={errors.date ? 'date-error' : undefined}
          />
          {formData.date && (
            <p className="mt-1 text-sm text-gray-400">
              {getDayName(formData.date)}
            </p>
          )}
          {errors.date && (
            <p id="date-error" className="mt-1 text-sm text-red-400">
              {errors.date}
            </p>
          )}
        </div>

        {/* XP Field */}
        <div className="form-group">
          <label htmlFor="xp" className="block text-sm font-medium text-gray-300 mb-2">
            Points d'expérience (XP)
          </label>
          <input
            type="number"
            id="xp"
            name="xp"
            value={formData.xp}
            onChange={handleChange}
            placeholder="Ex: 10"
            min="1"
            className={`w-full px-4 py-2 bg-gray-800 border ${
              errors.xp ? 'border-red-500' : 'border-gray-700'
            } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors`}
            aria-invalid={!!errors.xp}
            aria-describedby={errors.xp ? 'xp-error' : undefined}
          />
          {errors.xp && (
            <p id="xp-error" className="mt-1 text-sm text-red-400">
              {errors.xp}
            </p>
          )}
        </div>

        {/* Submit Error */}
        {submitError && (
          <ErrorMessage message={submitError} type="error" />
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Ajout...
              </>
            ) : (
              'Ajouter'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default MissionAddForm;
