import { useEffect, useMemo, useRef, useCallback } from 'react';
import { isBrowser } from '../../../../utils/isBrowser';

const isFocusableElement = (element) => {
  if (!element) return false;
  const tagName = element.tagName;

  if (!tagName) {
    return false;
  }

  const normalized = tagName.toLowerCase();
  const type = element.getAttribute?.('type');

  if (element.isContentEditable) {
    return true;
  }

  return (
    normalized === 'input' ||
    normalized === 'textarea' ||
    normalized === 'select' ||
    normalized === 'button' ||
    normalized === 'label' ||
    normalized === 'summary' ||
    (normalized === 'div' && element.getAttribute?.('role') === 'textbox') ||
    (normalized === 'input' && type === 'text')
  );
};

const normalizeKey = (value) => {
  if (!value) return null;
  return String(value).toLowerCase();
};

/**
 * Déclare un ou plusieurs raccourcis clavier accessibles.
 * @param {Array<Object>} shortcuts - Liste de raccourcis
 * @param {Object} options
 * @param {boolean} options.enabled - Active/désactive tous les raccourcis
 * @param {boolean} options.allowInInputs - Autorise l’exécution même dans les champs de saisie
 */
const useKeyboardShortcut = (shortcuts = [], { enabled = true, allowInInputs = false } = {}) => {
  const shortcutsRef = useRef(shortcuts);
  const optionsRef = useRef({ allowInInputs });

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    optionsRef.current = { allowInInputs };
  }, [allowInInputs]);

  const normalizedShortcuts = useMemo(
    () =>
      shortcuts.map((shortcut) => ({
        key: normalizeKey(shortcut.key),
        code: shortcut.code ? String(shortcut.code) : null,
        ctrlKey: Boolean(shortcut.ctrlKey),
        shiftKey: Boolean(shortcut.shiftKey),
        altKey: Boolean(shortcut.altKey),
        metaKey: Boolean(shortcut.metaKey),
        preventDefault: shortcut.preventDefault !== false,
        stopPropagation: Boolean(shortcut.stopPropagation),
        handler: shortcut.handler,
        description: shortcut.description ?? null
      })),
    [shortcuts]
  );

  // ✅ Optimisation : Mémoïser handleKeyDown avec useCallback pour éviter recréation
  const handleKeyDown = useCallback((event) => {
    const { allowInInputs: allow } = optionsRef.current;
    if (!allow && isFocusableElement(event.target)) {
      return;
    }

    const key = normalizeKey(event.key);
    const code = event.code ? String(event.code) : null;

    // Utiliser shortcutsRef.current pour toujours avoir la dernière version
    const currentShortcuts = shortcutsRef.current;
    
    for (const shortcut of currentShortcuts) {
      const normalized = {
        key: normalizeKey(shortcut.key),
        code: shortcut.code ? String(shortcut.code) : null,
        ctrlKey: Boolean(shortcut.ctrlKey),
        shiftKey: Boolean(shortcut.shiftKey),
        altKey: Boolean(shortcut.altKey),
        metaKey: Boolean(shortcut.metaKey)
      };

      // Vérifier correspondance touche
      if (normalized.key && normalized.key !== key) {
        continue;
      }
      if (normalized.code && normalized.code !== code) {
        continue;
      }
      if (!normalized.key && !normalized.code) {
        continue;
      }

      // Vérifier correspondance modificateurs
      const matchesModifiers =
        normalized.ctrlKey === Boolean(event.ctrlKey) &&
        normalized.shiftKey === Boolean(event.shiftKey) &&
        normalized.altKey === Boolean(event.altKey) &&
        normalized.metaKey === Boolean(event.metaKey);

      if (!matchesModifiers) {
        continue;
      }

      // Appliquer preventDefault/stopPropagation
      const preventDefault = shortcut.preventDefault !== false;
      const stopPropagation = Boolean(shortcut.stopPropagation);

      if (preventDefault) {
        event.preventDefault();
      }
      if (stopPropagation) {
        event.stopPropagation();
      }

      // Exécuter le handler
      if (typeof shortcut.handler === 'function') {
        try {
          shortcut.handler(event);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[useKeyboardShortcut] handler error:', error);
        }
      }
      break;
    }
  }, []); // Pas de dépendances : utilise refs pour toujours avoir les dernières valeurs

  useEffect(() => {
    if (!enabled || normalizedShortcuts.length === 0) {
      return undefined;
    }

    // ✅ Tâche 16 : Utiliser isBrowser() pour vérifications centralisées
    if (!isBrowser()) {
      return undefined;
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, normalizedShortcuts, handleKeyDown]);
};

export { useKeyboardShortcut };
export default useKeyboardShortcut;


