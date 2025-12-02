/**
 * Composant Modal - Modale élégante et accessible
 * Remplace window.confirm et window.alert
 */

import React, { useEffect, useRef } from 'react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
  variant = 'default', // 'default', 'danger', 'warning', 'info'
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Gérer le focus et la fermeture avec Escape
  useEffect(() => {
    if (!isOpen) return;

    // Sauvegarder l'élément qui avait le focus
    previousFocusRef.current = document.activeElement;

    // Focus sur la modale
    if (modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }

    // Fermer avec Escape
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden'; // Empêcher scroll

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
      
      // Restaurer le focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const variantStyles = {
    default: {
      border: 'border-emerald-500/50',
      title: 'text-emerald-400',
      confirm: 'bg-emerald-500/20 border-emerald-500 text-emerald-400 hover:bg-emerald-500/30',
    },
    danger: {
      border: 'border-red-500/50',
      title: 'text-red-400',
      confirm: 'bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30',
    },
    warning: {
      border: 'border-amber-500/50',
      title: 'text-amber-400',
      confirm: 'bg-amber-500/20 border-amber-500 text-amber-400 hover:bg-amber-500/30',
    },
    info: {
      border: 'border-cyan-500/50',
      title: 'text-cyan-400',
      confirm: 'bg-cyan-500/20 border-cyan-500 text-cyan-400 hover:bg-cyan-500/30',
    },
  };

  const styles = variantStyles[variant] || variantStyles.default;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={handleOverlayClick}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`relative bg-slate-800/95 backdrop-blur-md border-2 ${styles.border} rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <h2 id="modal-title" className={`text-xl font-bold ${styles.title}`}>
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 rounded"
              aria-label="Fermer la modale"
            >
              <span className="text-2xl" aria-hidden="true">×</span>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 text-slate-200">
          {children}
        </div>

        {/* Footer */}
        {(onConfirm || onCancel) && (
          <div className="flex gap-3 justify-end p-6 border-t border-slate-700/50">
            {onCancel && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
              >
                {cancelLabel}
              </button>
            )}
            {onConfirm && (
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 border-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${styles.confirm}`}
              >
                {confirmLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
