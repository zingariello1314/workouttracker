import React from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ 
  rating = 0, 
  onRatingChange, 
  maxRating = 5, 
  size = 'md',
  disabled = false,
  label = '',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleStarClick = (starRating) => {
    if (!disabled && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {label && (
        <span className="text-sm text-slate-300 mr-2">{label}:</span>
      )}
      <div className="flex gap-1">
        {[...Array(maxRating)].map((_, index) => {
          const starRating = index + 1;
          const isFilled = starRating <= rating;
          
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleStarClick(starRating)}
              disabled={disabled}
              className={`transition-colors duration-200 ${
                disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'
              }`}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  isFilled 
                    ? 'text-yellow-400 fill-yellow-400' 
                    : 'text-slate-500 hover:text-yellow-300'
                } transition-colors duration-200`}
              />
            </button>
          );
        })}
      </div>
      {rating > 0 && (
        <span className="text-sm text-slate-400 ml-2">
          {rating}/{maxRating}
        </span>
      )}
    </div>
  );
};

export default StarRating;
