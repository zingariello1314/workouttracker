/**
 * QuickForm Component
 * Formulaire générique réutilisable avec validation inline
 */

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import Button from '../ui/Button';

const QuickForm = ({ 
  fields, 
  onSubmit, 
  onCancel, 
  submitLabel = 'Créer',
  cancelLabel = 'Annuler',
  isLoading = false 
}) => {
  const [formData, setFormData] = useState(
    fields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue || '' }), {})
  );
  const [errors, setErrors] = useState({});

  const validateField = (field, value) => {
    if (field.required && !value) {
      return `${field.label} est requis`;
    }
    if (field.validate) {
      return field.validate(value);
    }
    return null;
  };

  const handleChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error on change
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {};
    fields.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(field => (
        <div key={field.name} className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </label>

          {field.type === 'select' ? (
            <select
              value={formData[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
              disabled={isLoading}
            >
              <option value="">Sélectionner...</option>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea
              value={formData[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={field.rows || 3}
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              disabled={isLoading}
            />
          ) : (
            <input
              type={field.type || 'text'}
              value={formData[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              disabled={isLoading}
            />
          )}

          {errors[field.name] && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <X className="w-4 h-4" />
              {errors[field.name]}
            </p>
          )}

          {field.hint && !errors[field.name] && (
            <p className="text-xs text-slate-500">{field.hint}</p>
          )}
        </div>
      ))}

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        >
          <Check className="w-4 h-4 mr-2" />
          {submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            variant="secondary"
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            {cancelLabel}
          </Button>
        )}
      </div>
    </form>
  );
};

export default QuickForm;
