import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';

/**
 * MuscleCreateForm Component - Modal form for creating new muscle groups
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Function} props.onSubmit - Callback when form is submitted
 */
const MuscleCreateForm = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    name: '',
    target: '',
    current: '0'
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const fileInputRef = useRef(null);

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.target || formData.target <= 0) {
      newErrors.target = 'L\'objectif doit être supérieur à 0';
    }

    if (formData.current < 0) {
      newErrors.current = 'La valeur actuelle ne peut pas être négative';
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

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        image: 'Veuillez sélectionner une image PNG, JPG ou JPEG'
      }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        image: 'L\'image doit faire moins de 5MB'
      }));
      return;
    }

    // Clear image error
    setErrors(prev => ({ ...prev, image: null }));

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      setImageFile(file);
    };
    reader.readAsDataURL(file);
  };

  // Remove image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
        target: parseInt(formData.target),
        current: parseInt(formData.current),
        imageData: imagePreview // Base64 image data
      });

      // Reset form
      setFormData({ name: '', target: '', current: '0' });
      setImageFile(null);
      setImagePreview(null);
      setErrors({});
      onClose();
    } catch (error) {
      setSubmitError(error.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="muscle-form-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="relative bg-slate-800/95 backdrop-blur-md border-2 border-emerald-500/50 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-800/95 backdrop-blur-md flex items-center justify-between p-6 border-b border-slate-700/50">
          <h2 id="muscle-form-title" className="text-xl font-bold text-emerald-400">
            Créer un nouveau muscle/exercice
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 rounded"
            aria-label="Fermer"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Name Field */}
        <div className="form-group">
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Nom du muscle/exercice
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ex: Pectoraux, Squats..."
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

        {/* Target Field */}
        <div className="form-group">
          <label htmlFor="target" className="block text-sm font-medium text-gray-300 mb-2">
            Objectif (répétitions)
          </label>
          <input
            type="number"
            id="target"
            name="target"
            value={formData.target}
            onChange={handleChange}
            placeholder="Ex: 100"
            min="1"
            className={`w-full px-4 py-2 bg-gray-800 border ${
              errors.target ? 'border-red-500' : 'border-gray-700'
            } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors`}
            aria-invalid={!!errors.target}
            aria-describedby={errors.target ? 'target-error' : undefined}
          />
          {errors.target && (
            <p id="target-error" className="mt-1 text-sm text-red-400">
              {errors.target}
            </p>
          )}
        </div>

        {/* Current Field */}
        <div className="form-group">
          <label htmlFor="current" className="block text-sm font-medium text-gray-300 mb-2">
            Valeur actuelle (répétitions)
          </label>
          <input
            type="number"
            id="current"
            name="current"
            value={formData.current}
            onChange={handleChange}
            placeholder="Ex: 0"
            min="0"
            className={`w-full px-4 py-2 bg-gray-800 border ${
              errors.current ? 'border-red-500' : 'border-gray-700'
            } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors`}
            aria-invalid={!!errors.current}
            aria-describedby={errors.current ? 'current-error' : undefined}
          />
          {errors.current && (
            <p id="current-error" className="mt-1 text-sm text-red-400">
              {errors.current}
            </p>
          )}
        </div>

        {/* Image Upload */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Image (optionnel)
          </label>
          
          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-orange-500 transition-colors"
            >
              <Upload className="text-gray-400 mb-2" size={32} />
              <p className="text-sm text-gray-400 mb-1">
                Cliquez pour télécharger une image
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG ou JPEG (max 5MB)
              </p>
            </div>
          ) : (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                aria-label="Supprimer l'image"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleImageUpload}
            className="hidden"
            aria-label="Sélectionner une image"
          />

          {errors.image && (
            <p className="mt-2 text-sm text-red-400">
              {errors.image}
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
                Création...
              </>
            ) : (
              'Créer'
            )}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default MuscleCreateForm;
