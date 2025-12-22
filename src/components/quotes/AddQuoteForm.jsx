/**
 * AddQuoteForm Component
 * Form to add new quotes with 6 fields (3 FR + 3 EN)
 */

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from '../ui/Input';

export function AddQuoteForm({ onAdd, onCancel }) {
  const [formData, setFormData] = useState({
    line1Fr: '',
    line2Fr: '',
    line3Fr: '',
    line1En: '',
    line2En: '',
    line3En: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    // Check all fields are filled
    Object.keys(formData).forEach((key) => {
      if (!formData[key].trim()) {
        newErrors[key] = 'Ce champ est requis';
      }
    });

    // Check length limits
    Object.keys(formData).forEach((key) => {
      if (formData[key].length > 100) {
        newErrors[key] = 'Maximum 100 caractères';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    const result = await onAdd(formData);
    
    if (result.success) {
      // Reset form
      setFormData({
        line1Fr: '',
        line2Fr: '',
        line3Fr: '',
        line1En: '',
        line2En: '',
        line3En: '',
      });
      setErrors({});
    } else {
      setErrors({ submit: result.error });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-slate-700/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Ajouter une citation</h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* French Fields */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-300">Français</label>
        
        <div>
          <Input
            placeholder="Ligne 1 (ex: N'attends rien,)"
            value={formData.line1Fr}
            onChange={(e) => handleChange('line1Fr', e.target.value)}
            className={errors.line1Fr ? 'border-red-500' : ''}
          />
          {errors.line1Fr && <p className="text-xs text-red-400 mt-1">{errors.line1Fr}</p>}
        </div>

        <div>
          <Input
            placeholder="Ligne 2 - Mise en valeur (ex: Apprécie)"
            value={formData.line2Fr}
            onChange={(e) => handleChange('line2Fr', e.target.value)}
            className={errors.line2Fr ? 'border-red-500' : ''}
          />
          {errors.line2Fr && <p className="text-xs text-red-400 mt-1">{errors.line2Fr}</p>}
        </div>

        <div>
          <Input
            placeholder="Ligne 3 (ex: tout.)"
            value={formData.line3Fr}
            onChange={(e) => handleChange('line3Fr', e.target.value)}
            className={errors.line3Fr ? 'border-red-500' : ''}
          />
          {errors.line3Fr && <p className="text-xs text-red-400 mt-1">{errors.line3Fr}</p>}
        </div>
      </div>

      {/* English Fields */}
      <div className="space-y-3 pt-4 border-t border-slate-600">
        <label className="text-sm font-medium text-slate-300">English</label>
        
        <div>
          <Input
            placeholder="Line 1 (ex: Expect nothing,)"
            value={formData.line1En}
            onChange={(e) => handleChange('line1En', e.target.value)}
            className={errors.line1En ? 'border-red-500' : ''}
          />
          {errors.line1En && <p className="text-xs text-red-400 mt-1">{errors.line1En}</p>}
        </div>

        <div>
          <Input
            placeholder="Line 2 - Emphasized (ex: Appreciate)"
            value={formData.line2En}
            onChange={(e) => handleChange('line2En', e.target.value)}
            className={errors.line2En ? 'border-red-500' : ''}
          />
          {errors.line2En && <p className="text-xs text-red-400 mt-1">{errors.line2En}</p>}
        </div>

        <div>
          <Input
            placeholder="Line 3 (ex: everything.)"
            value={formData.line3En}
            onChange={(e) => handleChange('line3En', e.target.value)}
            className={errors.line3En ? 'border-red-500' : ''}
          />
          {errors.line3En && <p className="text-xs text-red-400 mt-1">{errors.line3En}</p>}
        </div>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded p-3">
          {errors.submit}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="gradient-button-premium gradient-button-premium-md rounded-lg flex-1 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex-1"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
