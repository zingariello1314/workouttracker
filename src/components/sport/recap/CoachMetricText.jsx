import React from 'react';

/**
 * Met en évidence les métriques clés dans la prose coach (%, kg, h/j, reps).
 * variant "hl" = pastille or (vision) · "v" = emphase teintée (signaux / synthèse).
 */
export function CoachMetricText({ text, className = '', variant = 'hl' }) {
  if (!text) return null;

  const parts = String(text).split(
    /(~?\d+[,.]?\d*\s*(?:%|km|h\/j|h\/|reps|j\.|j\b|kg|pas\/j|sorties?))|(\+\d+[,.]?\d*\s*%|−\d+[,.]?\d*\s*%)/gi
  );

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (!part) return null;
        const isMetric = /^~?\d|^[+−-]\d/i.test(part.trim());
        if (!isMetric) return <span key={i}>{part}</span>;
        return (
          <span key={i} className={variant}>
            {part}
          </span>
        );
      })}
    </span>
  );
}

export default CoachMetricText;
