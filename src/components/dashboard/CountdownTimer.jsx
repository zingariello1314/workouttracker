/**
 * CountdownTimer - Compte à rebours réutilisable
 * Affiche le temps restant jusqu'à une date cible
 */

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const CountdownTimer = ({ 
  targetDate, 
  onComplete,
  showIcon = true,
  size = 'normal', // 'small', 'normal', 'large'
  urgent = false,
  className = ''
}) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = new Date(targetDate) - new Date();
    
    if (difference <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    return {
      hours: Math.floor(difference / (1000 * 60 * 60)),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.total <= 0 && onComplete) {
        onComplete();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  const sizeClasses = {
    small: 'text-sm',
    normal: 'text-lg',
    large: 'text-2xl'
  };

  const isCritical = timeLeft.hours < 3;
  const shouldBlink = urgent && isCritical;

  return (
    <div className={`countdown-timer flex items-center gap-2 ${className} ${shouldBlink ? 'animate-pulse' : ''}`}>
      {showIcon && (
        <Clock className={`${size === 'small' ? 'w-4 h-4' : size === 'large' ? 'w-6 h-6' : 'w-5 h-5'} ${
          isCritical ? 'text-red-400' : 'text-slate-400'
        }`} />
      )}
      <div className={`font-mono font-bold ${sizeClasses[size]} ${
        isCritical ? 'text-red-400' : 'text-white'
      }`}>
        {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </div>
    </div>
  );
};

export default CountdownTimer;
