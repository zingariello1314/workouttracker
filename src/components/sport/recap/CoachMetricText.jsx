import React from 'react';

const POSITIVE = /(?:\+|\~)\s*\d+[,.]?\d*\s*%|\+\d+\s*%|record|solide|exemplaire|hausse|accélère|meilleur mois/i;
const NEGATIVE = /(?:−|-)\s*\d+[,.]?\d*\s*%|sous|faible|fragile|retrait|baisse|~0|0\s*%/i;
const WARN = /légère|modéré|attention|déséquilibre|domine|priorité/i;

/**
 * Met en couleur les métriques clés dans la prose coach (%, kg, h/j, reps).
 */
export function CoachMetricText({ text, className = '' }) {
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

        let cls = 'font-semibold text-teal-300';
        if (POSITIVE.test(part)) cls = 'font-semibold text-emerald-400';
        else if (NEGATIVE.test(part)) cls = 'font-semibold text-rose-400';
        else if (WARN.test(text.slice(Math.max(0, text.indexOf(part) - 20), text.indexOf(part) + part.length + 20))) {
          cls = 'font-semibold text-amber-300';
        }

        return (
          <span key={i} className={cls}>
            {part}
          </span>
        );
      })}
    </span>
  );
}

export default CoachMetricText;
