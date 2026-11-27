import React, { memo, useEffect, useRef, useState } from 'react';

/**
 * Horloge isolée : le tick 1s ne doit JAMAIS remonter jusqu’à SidebarPremium.
 * Avant P0.4, currentTime vivait dans useSidebar → re-render de tout le sous-arbre
 * (~2,3 s) toutes les ~1 s, saturant le thread principal.
 */
function formatTime(date) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function formatDayMonth(date) {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

function formatYear(date) {
  return date.getFullYear().toString();
}

const SidebarClock = memo(function SidebarClock() {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const intervalRef = useRef(null);

  useEffect(() => {
    setCurrentTime(new Date());
    intervalRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const time = formatTime(currentTime);
  const dayMonth = formatDayMonth(currentTime).toUpperCase();
  const year = formatYear(currentTime);

  return (
    <div className="time-date-block" data-sidebar-clock="isolated">
      <div className="time-display">
        <div className="time-main">{time}</div>
        <div className="time-shadow" aria-hidden="true">{time}</div>
        <div className="time-glow" aria-hidden="true">{time}</div>
      </div>

      <div className="date-display">
        <div className="date-day-month">
          <div className="date-main">{dayMonth}</div>
          <div className="date-shadow" aria-hidden="true">{dayMonth}</div>
          <div className="date-glow" aria-hidden="true">{dayMonth}</div>
        </div>

        <div className="date-year">
          <div className="year-main">{year}</div>
          <div className="year-shadow" aria-hidden="true">{year}</div>
          <div className="year-glow" aria-hidden="true">{year}</div>
        </div>
      </div>
    </div>
  );
});

SidebarClock.displayName = 'SidebarClock';

/** Helpers exportés pour tests de parité d’affichage (pas de règles métier). */
export const sidebarClockFormatters = {
  formatTime,
  formatDayMonth,
  formatYear
};

export default SidebarClock;
