/**
 * Composant Modal - Modale élégante et accessible
 * Remplace window.confirm et window.alert
 */

import React, { useEffect, useRef } from 'react';

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-4xl',
};

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
  /** largeur max du panneau (défaut xl = max-w-4xl, comme avant) */
  size = 'xl',
  /** 'center' | 'bottom' — bottom : modale plus basse sur l’écran */
  placement = 'center',
  /** classes additionnelles sur le wrapper du contenu (sous le titre) */
  contentClassName = '',
  /** si true, pas de padding sur le wrapper du contenu (le contenu gère son propre padding) */
  noContentPadding = false,
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
    /** Charte sport (justification, etc.) */
    glass: {
      border: 'border-[#0F4C5C]/75',
      title: 'text-teal-200',
      confirm: 'bg-[#0F5C45]/30 border-[#0F5C45] text-teal-100 hover:bg-[#0F5C45]/45',
    },
  };

  const styles = variantStyles[variant] || variantStyles.default;
  const maxW = SIZE_CLASSES[size] || SIZE_CLASSES.xl;
  const overlayLayout =
    placement === 'bottom'
      ? 'items-end justify-center px-3 pt-16 pb-6 sm:pb-10 sm:pt-24'
      : 'items-center justify-center p-4';

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
      className={`fixed inset-0 z-50 flex ${overlayLayout}`}
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
        className={`relative flex w-full max-h-[min(90vh,760px)] flex-col overflow-hidden rounded-xl border-2 bg-slate-800/95 shadow-2xl backdrop-blur-md ${styles.border} ${maxW} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-700/50 p-4 sm:p-6">
          <h2 id="modal-title" className={`text-lg font-bold sm:text-xl ${styles.title}`}>
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
        <div
          className={`min-h-0 flex-1 overflow-y-auto text-slate-200 ${noContentPadding ? '' : 'p-4 sm:p-6'} ${contentClassName}`}
        >
          {children}
        </div>

        {/* Footer */}
        {(onConfirm || onCancel) && (
          <div className="flex shrink-0 gap-3 justify-end border-t border-slate-700/50 p-6">
            {onCancel && (
              <button
                type="button"
                onClick={handleCancel}
                className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg"
              >
                {cancelLabel}
              </button>
            )}
            {onConfirm && (
              <button
                type="button"
                onClick={handleConfirm}
                className="gradient-button-premium gradient-button-premium-md rounded-lg"
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
