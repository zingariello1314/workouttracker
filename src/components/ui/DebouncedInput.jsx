/**
 * DebouncedInput Component
 * 
 * Composant d'input avec debouncing intégré pour optimiser les performances
 * lors de la saisie utilisateur.
 * 
 * Features:
 * - Debouncing automatique des changements
 * - Support de tous les types d'input
 * - Indicateur de loading pendant le debounce
 * - Optimisations mémoire
 * 
 * @see Requirements 1.2, 10.3
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input, Select, TextArea } from './Input';
import performanceOptimizationService from '../../services/statistics/performanceOptimizationService';

const DebouncedInput = ({
  value: initialValue = '',
  onChange,
  delay = 300,
  type = 'input', // 'input' | 'select' | 'textarea'
  showLoadingIndicator = false,
  className = '',
  ...props
}) => {
  const [localValue, setLocalValue] = useState(initialValue);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const timeoutRef = useRef(null);
  const mountedRef = useRef(true);

  // Synchroniser avec la valeur externe
  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  // Nettoyage lors du démontage
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Gestionnaire de changement avec debouncing
  const handleChange = useCallback((event) => {
    const newValue = event.target.value;
    setLocalValue(newValue);

    if (showLoadingIndicator) {
      setIsDebouncing(true);
    }

    // Utiliser le service de performance pour le debouncing
    const debouncedOnChange = performanceOptimizationService.debounce(
      `debouncedInput_${props.name || 'default'}`,
      (value) => {
        if (mountedRef.current) {
          if (showLoadingIndicator) {
            setIsDebouncing(false);
          }
          if (onChange) {
            onChange({ target: { value } });
          }
        }
      },
      delay
    );

    debouncedOnChange(newValue);
  }, [onChange, delay, showLoadingIndicator, props.name]);

  // Styles pour l'indicateur de loading
  const inputClassName = `${className} ${
    isDebouncing && showLoadingIndicator ? 'opacity-75' : ''
  }`;

  // Rendu selon le type
  const renderInput = () => {
    const commonProps = {
      ...props,
      value: localValue,
      onChange: handleChange,
      className: inputClassName
    };

    switch (type) {
      case 'select':
        return <Select {...commonProps} />;
      case 'textarea':
        return <TextArea {...commonProps} />;
      case 'input':
      default:
        return <Input {...commonProps} />;
    }
  };

  return (
    <div className="relative">
      {renderInput()}
      
      {/* Indicateur de loading */}
      {showLoadingIndicator && isDebouncing && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default React.memo(DebouncedInput);

// Hook personnalisé pour le debouncing de valeurs
export const useDebouncedValue = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook pour debouncer les callbacks
export const useDebouncedCallback = (callback, delay = 300, deps = []) => {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef(null);

  // Mettre à jour la référence du callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Créer le callback debouncé
  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay, ...deps]);

  // Nettoyage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};