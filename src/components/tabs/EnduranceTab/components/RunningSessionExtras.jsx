import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

const parseDurationToSeconds = (duration) => {
  if (!duration || typeof duration !== 'string') return 0;
  const parts = duration.split(':').map(part => parseInt(part, 10) || 0);
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return 0;
};

const RunningSessionExtras = ({ distance, duration }) => {
  const metrics = useMemo(() => {
    const distanceNum = parseFloat(distance);
    const totalSeconds = parseDurationToSeconds(duration);

    if (!distanceNum || distanceNum <= 0 || totalSeconds <= 0) {
      return null;
    }

    const paceMinutes = (totalSeconds / 60) / distanceNum;
    const paceMinutesInt = Math.floor(paceMinutes);
    const paceSeconds = Math.round((paceMinutes - paceMinutesInt) * 60);
    const paceFormatted = `${paceMinutesInt}:${paceSeconds.toString().padStart(2, '0')} min/km`;

    const speed = (distanceNum / (totalSeconds / 3600)).toFixed(2);

    return {
      pace: paceFormatted,
      speed: `${speed} km/h`,
      duration: duration
    };
  }, [distance, duration]);

  if (!metrics) {
    return null;
  }

  return (
    <div className="mt-6 p-4 bg-slate-900/30 border border-slate-600/50 rounded-xl">
      <h4 className="text-white font-semibold mb-3">Calculs automatiques</h4>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-slate-400">Allure:</span>
          <span className="text-white font-bold ml-2">{metrics.pace}</span>
        </div>
        <div>
          <span className="text-slate-400">Vitesse:</span>
          <span className="text-white font-bold ml-2">{metrics.speed}</span>
        </div>
        <div>
          <span className="text-slate-400">Durée totale:</span>
          <span className="text-white font-bold ml-2">{metrics.duration}</span>
        </div>
      </div>
    </div>
  );
};

RunningSessionExtras.propTypes = {
  distance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  duration: PropTypes.string
};

export default RunningSessionExtras;
