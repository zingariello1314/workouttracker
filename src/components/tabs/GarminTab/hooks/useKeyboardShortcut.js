import { useEffect, useMemo, useRef } from 'react';

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

  useEffect(() => {
    if (!enabled || normalizedShortcuts.length === 0) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      const { allowInInputs: allow } = optionsRef.current;
      if (!allow && isFocusableElement(event.target)) {
        return;
      }

      const key = normalizeKey(event.key);
      const code = event.code ? String(event.code) : null;

      for (const shortcut of normalizedShortcuts) {
        if (!shortcut.handler || (shortcut.key && shortcut.key !== key)) {
          if (shortcut.code && shortcut.code !== code) {
            continue;
          }
          if (shortcut.key && shortcut.key !== key) {
            continue;
          }
          if (!shortcut.key && !shortcut.code) {
            continue;
          }
        }

        const matchesModifiers =
          shortcut.ctrlKey === Boolean(event.ctrlKey) &&
          shortcut.shiftKey === Boolean(event.shiftKey) &&
          shortcut.altKey === Boolean(event.altKey) &&
          shortcut.metaKey === Boolean(event.metaKey);

        if (!matchesModifiers) {
          continue;
        }

        if (shortcut.preventDefault) {
          event.preventDefault();
        }
        if (shortcut.stopPropagation) {
          event.stopPropagation();
        }

        try {
          shortcut.handler(event);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[useKeyboardShortcut] handler error:', error);
        }
        break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, normalizedShortcuts]);
};

export default useKeyboardShortcut;


