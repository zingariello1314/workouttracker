import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'details',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

const getFocusableElements = (container) => {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      element instanceof HTMLElement &&
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-hidden') !== 'true' &&
      element.tabIndex !== -1
  );
};

export function useFocusTrap({
  active = true,
  containerRef: externalRef,
  initialFocusRef,
  autoFocusSelector,
  returnFocus = true,
  onEscape
} = {}) {
  const internalRef = useRef(null);
  const lastFocusedElementRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;

    const container = externalRef?.current || internalRef.current;
    if (!container) return undefined;

    const focusFirstElement = () => {
      if (initialFocusRef?.current && typeof initialFocusRef.current.focus === 'function') {
        initialFocusRef.current.focus();
        return;
      }

      if (autoFocusSelector) {
        const autoFocusTarget = container.querySelector(autoFocusSelector);
        if (autoFocusTarget instanceof HTMLElement) {
          autoFocusTarget.focus();
          return;
        }
      }

      const firstFocusable = getFocusableElements(container)[0];
      firstFocusable?.focus();
    };

    lastFocusedElementRef.current =
      document && document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && typeof onEscape === 'function') {
        event.preventDefault();
        onEscape();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const currentIndex = focusable.indexOf(document.activeElement);
      let nextIndex = currentIndex;

      if (event.shiftKey) {
        nextIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
      } else {
        nextIndex = currentIndex === focusable.length - 1 ? 0 : currentIndex + 1;
      }

      event.preventDefault();
      focusable[nextIndex]?.focus();
    };

    focusFirstElement();
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (returnFocus) {
        const previous = lastFocusedElementRef.current;
        if (previous && typeof previous.focus === 'function') {
          previous.focus();
        }
      }
    };
  }, [active, externalRef, initialFocusRef, autoFocusSelector, onEscape, returnFocus]);

  return externalRef || internalRef;
}

export default useFocusTrap;

