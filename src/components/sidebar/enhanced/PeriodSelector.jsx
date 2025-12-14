import React, { memo } from 'react';

/**
 * PeriodSelector - Sélecteur de période enrichi
 * Corrige le problème des "carrés blancs" mentionné par l'utilisateur
 */
const PeriodSelector = memo(({ 
  value, 
  onChange, 
  options = [
    { value: '7d', label: '7j' },
    { value: '30d', label: '30j' },
    { value: '3m', label: '3m' },
    { value: '6m', label: '6m' },
    { value: '1a', label: '1an' }
  ],
  label = 'Période',
  icon = '📅'
}) => {
  return (
    <div className="sidebar-info-box">
      <span className="sidebar-info-icon">{icon}</span>
      <span className="sidebar-text-secondary">{label}:</span>
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sidebar-period-selector"
        aria-label={`Sélectionner la ${label.toLowerCase()}`}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
});

PeriodSelector.displayName = 'PeriodSelector';

export default PeriodSelector;