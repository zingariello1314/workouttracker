import React, { useId, useRef, useEffect } from 'react';
import { AlertTriangle, X, Check, Info } from 'lucide-react';
import useFocusTrap from '../../hooks/useFocusTrap';

/**
 * Composant de dialogue de confirmation accessible
 * Remplace window.confirm avec support ARIA, focus trap, et instrumentation
 * 
 * @param {Object} props
 * @param {string} props.title - Titre du dialogue
 * @param {string|React.ReactNode} props.message - Message de confirmation
 * @param {string} props.variant - 'warning' | 'danger' | 'info' (défaut: 'warning')
 * @param {string} props.confirmLabel - Label du bouton de confirmation (défaut: 'Confirmer')
 * @param {string} props.cancelLabel - Label du bouton d'annulation (défaut: 'Annuler')
 * @param {Function} props.onConfirm - Callback appelé lors de la confirmation
 * @param {Function} props.onCancel - Callback appelé lors de l'annulation
 * @param {boolean} props.isOpen - Contrôle l'affichage du dialogue
 */
export default function ConfirmDialog({
  title = 'Confirmation',
  message,
  variant = 'warning',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
  isOpen = false
}) {
  const headingId = useId();
  const descriptionId = useId();
  const confirmRef = useRef(null);
  const cancelRef = useRef(null);

  const dialogRef = useFocusTrap({
    active: isOpen,
    initialFocusRef: variant === 'danger' ? confirmRef : cancelRef,
    onEscape: onCancel,
    returnFocus: true
  });

  // Gestion clavier : Enter sur confirm, Escape déjà géré par useFocusTrap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        if (variant === 'danger') {
          // Pour danger, Enter confirme (focus sur confirm)
          confirmRef.current?.click();
        } else {
          // Pour warning/info, Enter annule (focus sur cancel)
          cancelRef.current?.click();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, variant]);

  if (!isOpen) return null;

  const variantStyles = {
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-400',
      borderColor: 'border-yellow-600/50',
      confirmBg: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      confirmText: 'text-white'
    },
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-red-400',
      borderColor: 'border-red-600/50',
      confirmBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      confirmText: 'text-white'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-600/50',
      confirmBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      confirmText: 'text-white'
    }
  };

  const style = variantStyles[variant] || variantStyles.warning;
  const Icon = style.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
    >
      <div
        ref={dialogRef}
        className={`w-[90vw] max-w-md bg-slate-900 border ${style.borderColor} rounded-xl shadow-2xl focus:outline-none`}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-slate-700">
          <div className={`flex-shrink-0 ${style.iconColor}`}>
            <Icon className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              id={headingId}
              className="text-lg font-semibold text-slate-100 mb-2"
            >
              {title}
            </h2>
            <div
              id={descriptionId}
              className="text-sm text-slate-300 whitespace-pre-line"
            >
              {typeof message === 'string' ? <p>{message}</p> : message}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium ${style.confirmText} ${style.confirmBg} rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${style.confirmBg.replace('hover:', 'focus:ring-')}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook pour gérer les dialogues de confirmation
 * Simplifie l'usage dans les composants
 */
export function useConfirmDialog() {
  const [dialogState, setDialogState] = React.useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'warning',
    confirmLabel: 'Confirmer',
    cancelLabel: 'Annuler',
    onConfirm: null,
    onCancel: null
  });

  const showConfirm = React.useCallback(({
    title,
    message,
    variant = 'warning',
    confirmLabel = 'Confirmer',
    cancelLabel = 'Annuler'
  }) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        variant,
        confirmLabel,
        cancelLabel,
        onConfirm: () => {
          setDialogState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setDialogState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  }, []);

  const ConfirmDialogComponent = React.useCallback(() => (
    <ConfirmDialog
      isOpen={dialogState.isOpen}
      title={dialogState.title}
      message={dialogState.message}
      variant={dialogState.variant}
      confirmLabel={dialogState.confirmLabel}
      cancelLabel={dialogState.cancelLabel}
      onConfirm={dialogState.onConfirm}
      onCancel={dialogState.onCancel}
    />
  ), [dialogState]);

  return { showConfirm, ConfirmDialogComponent };
}



