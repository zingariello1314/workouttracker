/**
 * Tests pour useFocusTrap
 * 
 * Couvre :
 * - Focus trap (Tab/Shift+Tab)
 * - Focus initial (initialFocusRef, autoFocusSelector)
 * - Gestion Escape
 * - Return focus
 * - Désactivation conditionnelle
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRef, createRef } from 'react';
import { useFocusTrap } from '../useFocusTrap';

describe('useFocusTrap', () => {
  let container;
  let button1;
  let button2;
  let button3;

  beforeEach(() => {
    // Créer un conteneur avec des éléments focusables
    container = document.createElement('div');
    container.setAttribute('tabindex', '-1');
    
    button1 = document.createElement('button');
    button1.textContent = 'Button 1';
    button1.setAttribute('tabindex', '0');
    
    button2 = document.createElement('button');
    button2.textContent = 'Button 2';
    button2.setAttribute('tabindex', '0');
    
    button3 = document.createElement('button');
    button3.textContent = 'Button 3';
    button3.setAttribute('tabindex', '0');
    
    container.appendChild(button1);
    container.appendChild(button2);
    container.appendChild(button3);
    
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  describe('Focus trap actif', () => {
    it('retourne une ref interne si aucune ref externe fournie', () => {
      const { result } = renderHook(() => useFocusTrap({ active: true }));
      
      expect(result.current).toBeDefined();
      expect(result.current.current).toBeNull(); // Pas encore attaché
    });

    it('utilise la ref externe si fournie', () => {
      const containerRef = createRef();
      containerRef.current = container;
      
      const { result } = renderHook(() =>
        useFocusTrap({
          active: true,
          containerRef
        })
      );
      
      expect(result.current).toBe(containerRef);
    });

    it('place le focus sur le premier élément focusable par défaut', () => {
      const containerRef = createRef();
      containerRef.current = container;
      
      renderHook(() =>
        useFocusTrap({
          active: true,
          containerRef
        })
      );
      
      expect(document.activeElement).toBe(button1);
    });

    it('place le focus sur initialFocusRef si fourni', () => {
      const containerRef = createRef();
      containerRef.current = container;
      const initialFocusRef = createRef();
      initialFocusRef.current = button2;
      
      renderHook(() =>
        useFocusTrap({
          active: true,
          containerRef,
          initialFocusRef
        })
      );
      
      expect(document.activeElement).toBe(button2);
    });

    it('place le focus sur autoFocusSelector si fourni', () => {
      const containerRef = createRef();
      containerRef.current = container;
      button2.setAttribute('data-autofocus', 'true');
      
      renderHook(() =>
        useFocusTrap({
          active: true,
          containerRef,
          autoFocusSelector: '[data-autofocus="true"]'
        })
      );
      
      expect(document.activeElement).toBe(button2);
    });
  });

  describe('Navigation Tab', () => {
    it('boucle le focus avec Tab depuis le dernier élément', async () => {
      const containerRef = createRef();
      containerRef.current = container;
      
      renderHook(() =>
        useFocusTrap({
          active: true,
          containerRef
        })
      );
      
      // Focus sur le dernier élément
      button3.focus();
      expect(document.activeElement).toBe(button3);
      
      // Tab doit revenir au premier
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true
      });
      
      act(() => {
        container.dispatchEvent(tabEvent);
      });
      
      expect(document.activeElement).toBe(button1);
    });

    it('boucle le focus avec Shift+Tab depuis le premier élément', async () => {
      const containerRef = createRef();
      containerRef.current = container;
      
      renderHook(() =>
        useFocusTrap({
          active: true,
          containerRef
        })
      );
      
      // Focus sur le premier élément
      button1.focus();
      expect(document.activeElement).toBe(button1);
      
      // Shift+Tab doit aller au dernier
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true
      });
      
      act(() => {
        container.dispatchEvent(shiftTabEvent);
      });
      
      expect(document.activeElement).toBe(button3);
    });

    it('navigue normalement entre les éléments avec Tab', async () => {
      const containerRef = createRef();
      containerRef.current = container;
      
      renderHook(() =>
        useFocusTrap({
          active: true,
          containerRef
        })
      );
      
      button1.focus();
      
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true
      });
      
      act(() => {
        container.dispatchEvent(tabEvent);
      });
      
      expect(document.activeElement).toBe(button2);
    });
  });

  describe('Gestion Escape', () => {
    it('appelle onEscape quand Escape est pressé', () => {
      const containerRef = createRef();
      containerRef.current = container;
      const onEscape = vi.fn();
      
      renderHook(() =>
        useFocusTrap({
          active: true,
          containerRef,
          onEscape
        })
      );
      
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true
      });
      
      act(() => {
        container.dispatchEvent(escapeEvent);
      });
      
      expect(onEscape).toHaveBeenCalledTimes(1);
    });

    it('prévient le comportement par défaut pour Escape', () => {
      const containerRef = createRef();
      containerRef.current = container;
      const onEscape = vi.fn();
      
      renderHook(() =>
        useFocusTrap({
          active: true,
          containerRef,
          onEscape
        })
      );
      
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true
      });
      
      act(() => {
        container.dispatchEvent(escapeEvent);
      });
      
      expect(escapeEvent.defaultPrevented).toBe(true);
    });
  });

  describe('Return focus', () => {
    it('retourne le focus à l\'élément précédent si returnFocus est true', () => {
      const containerRef = createRef();
      containerRef.current = container;
      const previousElement = document.createElement('button');
      previousElement.textContent = 'Previous';
      document.body.appendChild(previousElement);
      previousElement.focus();
      
      const { unmount } = renderHook(() =>
        useFocusTrap({
          active: true,
          containerRef,
          returnFocus: true
        })
      );
      
      expect(document.activeElement).toBe(button1);
      
      unmount();
      
      expect(document.activeElement).toBe(previousElement);
      
      document.body.removeChild(previousElement);
    });

    it('ne retourne pas le focus si returnFocus est false', () => {
      const containerRef = createRef();
      containerRef.current = container;
      const previousElement = document.createElement('button');
      previousElement.textContent = 'Previous';
      document.body.appendChild(previousElement);
      previousElement.focus();
      
      const { unmount } = renderHook(() =>
        useFocusTrap({
          active: true,
          containerRef,
          returnFocus: false
        })
      );
      
      expect(document.activeElement).toBe(button1);
      
      unmount();
      
      // Le focus ne doit pas revenir à previousElement
      expect(document.activeElement).not.toBe(previousElement);
      
      document.body.removeChild(previousElement);
    });
  });

  describe('Désactivation', () => {
    it('ne fait rien si active est false', () => {
      const containerRef = createRef();
      containerRef.current = container;
      
      renderHook(() =>
        useFocusTrap({
          active: false,
          containerRef
        })
      );
      
      // Le focus ne doit pas être changé
      expect(document.activeElement).not.toBe(button1);
    });

    it('nettoie les event listeners lors du démontage', () => {
      const containerRef = createRef();
      containerRef.current = container;
      const addEventListenerSpy = vi.spyOn(container, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(container, 'removeEventListener');
      
      const { unmount } = renderHook(() =>
        useFocusTrap({
          active: true,
          containerRef
        })
      );
      
      expect(addEventListenerSpy).toHaveBeenCalled();
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });

  describe('Cas limites', () => {
    it('gère un conteneur sans éléments focusables', () => {
      const emptyContainer = document.createElement('div');
      emptyContainer.setAttribute('tabindex', '-1');
      document.body.appendChild(emptyContainer);
      
      const containerRef = createRef();
      containerRef.current = emptyContainer;
      
      renderHook(() =>
        useFocusTrap({
          active: true,
          containerRef
        })
      );
      
      // Ne doit pas planter, juste ne rien faire
      expect(document.activeElement).toBeDefined();
      
      document.body.removeChild(emptyContainer);
    });

    it('gère un conteneur null', () => {
      const containerRef = createRef();
      containerRef.current = null;
      
      // Ne doit pas planter
      renderHook(() =>
        useFocusTrap({
          active: true,
          containerRef
        })
      );
    });
  });
});

