/**
 * Hook pour gérer les dialogues de confirmation
 * 
 * ✅ PHASE 3 : Confirmations destructives
 * 
 * @module hooks/useConfirmDialog
 */

import { useState, useCallback } from 'react';

/**
 * Hook pour gérer un dialogue de confirmation
 * 
 * @returns {Object} { isOpen, openDialog, closeDialog, confirm, cancel, dialogProps }
 */
export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState(null);
  const [resolvePromise, setResolvePromise] = useState(null);

  const openDialog = useCallback((dialogConfig) => {
    setConfig(dialogConfig);
    setIsOpen(true);

    // Retourner une Promise qui se résout avec le résultat
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setConfig(null);
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  const confirm = useCallback(() => {
    setIsOpen(false);
    const currentConfig = config;
    setConfig(null);
    if (resolvePromise) {
      resolvePromise(true);
      setResolvePromise(null);
    }
    // Appeler le callback onConfirm si présent
    if (currentConfig?.onConfirm) {
      currentConfig.onConfirm();
    }
  }, [config, resolvePromise]);

  const cancel = useCallback(() => {
    closeDialog();
    // Appeler le callback onCancel si présent
    if (config?.onCancel) {
      config.onCancel();
    }
  }, [config, closeDialog]);

  return {
    isOpen,
    config: config || {},
    openDialog,
    closeDialog,
    confirm,
    cancel,
    // Props prêtes à être passées au composant ConfirmDialog
    dialogProps: {
      isOpen,
      ...config,
      onConfirm: confirm,
      onCancel: cancel,
    },
  };
};

export default useConfirmDialog;
