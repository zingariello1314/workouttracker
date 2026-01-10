/**
 * Composant de dialogue de confirmation réutilisable
 * 
 * ✅ PHASE 3 : Confirmations destructives
 * 
 * @module components/ui/ConfirmDialog
 */

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

/**
 * Composant de dialogue de confirmation
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Si le dialogue est ouvert
 * @param {string} props.title - Titre du dialogue
 * @param {string} props.message - Message de confirmation
 * @param {string} props.confirmLabel - Label du bouton de confirmation (défaut: "Confirmer")
 * @param {string} props.cancelLabel - Label du bouton d'annulation (défaut: "Annuler")
 * @param {string} props.variant - Variante du dialogue ('danger' | 'warning' | 'info')
 * @param {Function} props.onConfirm - Callback de confirmation
 * @param {Function} props.onCancel - Callback d'annulation
 * @param {boolean} props.isLoading - Si l'action est en cours
 */
const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      button: 'gradient-button-premium',
    },
    warning: {
      icon: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      button: 'gradient-button-premium',
    },
    info: {
      icon: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      button: 'gradient-button-premium',
    },
  };

  const styles = variantStyles[variant] || variantStyles.danger;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-md rounded-2xl border ${styles.border} ${styles.bg} p-6 shadow-xl`}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
          disabled={isLoading}
        >
          <X size={20} />
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className={`${styles.icon} flex-shrink-0 mt-1`}>
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            onClick={onCancel}
            disabled={isLoading}
            className="gradient-button-premium gradient-button-premium-variant"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={styles.button}
          >
            {isLoading ? 'Traitement...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
