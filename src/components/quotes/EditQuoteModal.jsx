/**
 * EditQuoteModal Component
 * Modal for editing existing quotes
 */

import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { Input } from '../ui/Input';

export function EditQuoteModal({ quote, onSave, onClose }) {
  const [formData, setFormData] = useState({
    line1Fr: '',
    line2Fr: '',
    line3Fr: '',
    line1En: '',
    line2En: '',
    line3En: '',
  });

  const [errors, setErrors] = useState({});

  // Initialize form with quote data
  useEffect(() => {
    if (quote) {
      setFormData({
        line1Fr: quote.line1Fr || '',
        line2Fr: quote.line2Fr || '',
        line3Fr: quote.line3Fr || '',
        line1En: quote.line1En || '',
        line2En: quote.line2En || '',
        line3En: quote.line3En || '',
      });
    }
  }, [quote]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    Object.keys(formData).forEach((key) => {
      if (!formData[key].trim()) {
        newErrors[key] = 'Ce champ est requis';
      }
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

    const result = await onSave(quote.id, formData);
    
    if (result.success) {
      onClose();
    } else {
      setErrors({ submit: result.error });
    }
  };

  if (!quote) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Modifier la citation</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* French Fields */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Français</label>
            
            <div>
              <Input
                placeholder="Ligne 1"
                value={formData.line1Fr}
                onChange={(e) => handleChange('line1Fr', e.target.value)}
                className={errors.line1Fr ? 'border-red-500' : ''}
              />
              {errors.line1Fr && <p className="text-xs text-red-400 mt-1">{errors.line1Fr}</p>}
            </div>

            <div>
              <Input
                placeholder="Ligne 2 - Mise en valeur"
                value={formData.line2Fr}
                onChange={(e) => handleChange('line2Fr', e.target.value)}
                className={errors.line2Fr ? 'border-red-500' : ''}
              />
              {errors.line2Fr && <p className="text-xs text-red-400 mt-1">{errors.line2Fr}</p>}
            </div>

            <div>
              <Input
                placeholder="Ligne 3"
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
                placeholder="Line 1"
                value={formData.line1En}
                onChange={(e) => handleChange('line1En', e.target.value)}
                className={errors.line1En ? 'border-red-500' : ''}
              />
              {errors.line1En && <p className="text-xs text-red-400 mt-1">{errors.line1En}</p>}
            </div>

            <div>
              <Input
                placeholder="Line 2 - Emphasized"
                value={formData.line2En}
                onChange={(e) => handleChange('line2En', e.target.value)}
                className={errors.line2En ? 'border-red-500' : ''}
              />
              {errors.line2En && <p className="text-xs text-red-400 mt-1">{errors.line2En}</p>}
            </div>

            <div>
              <Input
                placeholder="Line 3"
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
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="gradient-button-premium gradient-button-premium-md rounded-lg flex-1 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Enregistrer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex-1"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
