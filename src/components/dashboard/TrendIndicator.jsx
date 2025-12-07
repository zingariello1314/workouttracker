/**
 * TrendIndicator Component
 * Indicateur de tendance avec flèche et pourcentage
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const TrendIndicator = ({ value, size = 'md', showValue = true }) => {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const getColor = () => {
    if (isPositive) return 'text-green-400';
    if (isNegative) return 'text-red-400';
    return 'text-slate-400';
  };

  const getIcon = () => {
    if (isPositive) return <TrendingUp className={sizeClasses[size]} />;
    if (isNegative) return <TrendingDown className={sizeClasses[size]} />;
    return <Minus className={sizeClasses[size]} />;
  };

  const formatValue = () => {
    const absValue = Math.abs(value);
    if (absValue >= 1000) {
      return `${(absValue / 1000).toFixed(1)}k`;
    }
    return absValue.toFixed(1);
  };

  return (
    <div className={`flex items-center gap-1 ${getColor()}`}>
      {getIcon()}
      {showValue && (
        <span className={`font-medium ${textSizeClasses[size]}`}>
          {isPositive && '+'}{formatValue()}%
        </span>
      )}
    </div>
  );
};

export default TrendIndicator;
