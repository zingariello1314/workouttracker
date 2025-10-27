import React from 'react';
import { Activity } from 'lucide-react';

const EtirementsZoneChart = ({ data, colors }) => {
  // Calculer les données réelles des étirements par zone
  const calculateEtirementsData = () => {
    const workoutHistory = data.workoutHistory || [];
    
    // Zones d'étirement avec leurs valeurs par défaut
    const zones = [
      { name: 'Cou/Nuque', value: 0, max: 100 },
      { name: 'Épaules', value: 0, max: 100 },
      { name: 'Bras', value: 0, max: 100 },
      { name: 'Dos', value: 0, max: 100 },
      { name: 'Torse', value: 0, max: 100 },
      { name: 'Hanches', value: 0, max: 100 },
      { name: 'Jambes', value: 0, max: 100 },
      { name: 'Chevilles', value: 0, max: 100 }
    ];
    
    // Calculer les valeurs réelles basées sur les étirements complétés
    const stretchSessions = workoutHistory.filter(session => 
      session.stretches && session.completedStretches > 0
    );
    
    // Compter les étirements par zone basé sur les vraies données
    const zoneStats = {};
    stretchSessions.forEach(session => {
      session.stretches?.forEach(stretch => {
        // Déterminer la zone basée sur le type d'étirement
        const stretchType = stretch.type || stretch.stretchType || '';
        let zone = 'Dos'; // Zone par défaut
        
        if (stretchType.includes('cou') || stretchType.includes('nuque')) {
          zone = 'Cou/Nuque';
        } else if (stretchType.includes('épaule') || stretchType.includes('épaule')) {
          zone = 'Épaules';
        } else if (stretchType.includes('bras') || stretchType.includes('biceps') || stretchType.includes('triceps')) {
          zone = 'Bras';
        } else if (stretchType.includes('dos') || stretchType.includes('lombaire')) {
          zone = 'Dos';
        } else if (stretchType.includes('torse') || stretchType.includes('pectoral')) {
          zone = 'Torse';
        } else if (stretchType.includes('hanche') || stretchType.includes('bassin')) {
          zone = 'Hanches';
        } else if (stretchType.includes('jambe') || stretchType.includes('cuisse') || stretchType.includes('mollet')) {
          zone = 'Jambes';
        } else if (stretchType.includes('cheville') || stretchType.includes('pied')) {
          zone = 'Chevilles';
        }
        
        zoneStats[zone] = (zoneStats[zone] || 0) + 1;
      });
    });
    
    // Calculer les pourcentages basés sur les vraies données
    const totalStretches = Object.values(zoneStats).reduce((sum, count) => sum + count, 0);
    const maxStretches = Math.max(...Object.values(zoneStats), 1);
    
    zones.forEach(zone => {
      const count = zoneStats[zone.name] || 0;
      // Convertir le nombre d'étirements en pourcentage (0-100)
      zone.value = totalStretches > 0 ? Math.min((count / maxStretches) * 100, 100) : 0;
    });
    
    return zones;
  };

  const etirementsData = calculateEtirementsData();

  // Fonction utilitaire pour calculer les coordonnées SVG de manière sécurisée
  const getSafeCoordinates = (zone, index, zones) => {
    const angle = (index / zones.length) * 2 * Math.PI - Math.PI / 2;
    const radius = (zone.value / zone.max) * 85;
    const x = 120 + Math.cos(angle) * radius;
    const y = 120 + Math.sin(angle) * radius;
    
    return {
      x: isNaN(x) ? 120 : x,
      y: isNaN(y) ? 120 : y,
      angle: isNaN(angle) ? 0 : angle
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-72 h-72">
          <svg className="w-full h-full" viewBox="0 0 240 240">
            {/* Grid circles */}
            {[20, 40, 60, 80, 100].map((r) => (
              <circle
                key={r}
                cx="120"
                cy="120"
                r={r * 0.85}
                fill="none"
                stroke="#334155"
                strokeWidth="0.5"
                opacity="0.3"
              />
            ))}
            
            {/* Axes */}
            {etirementsData.map((zone, idx) => {
              const coords = getSafeCoordinates(zone, idx, etirementsData);
              const x2 = 120 + Math.cos(coords.angle) * 85;
              const y2 = 120 + Math.sin(coords.angle) * 85;
              
              return (
                <line
                  key={idx}
                  x1="120"
                  y1="120"
                  x2={x2}
                  y2={y2}
                  stroke="#475569"
                  strokeWidth="1"
                  opacity="0.5"
                />
              );
            })}
            
            {/* Data polygon */}
            <polygon
              points={etirementsData
                .map((zone, idx) => {
                  const coords = getSafeCoordinates(zone, idx, etirementsData);
                  return `${coords.x},${coords.y}`;
                })
                .join(' ')}
              fill="url(#gradient-purple)"
              opacity="0.5"
              stroke="#a855f7"
              strokeWidth="2"
              style={{ filter: 'drop-shadow(0 0 8px #a855f780)' }}
            />
            
            {/* Data points */}
            {etirementsData.map((zone, idx) => {
              const coords = getSafeCoordinates(zone, idx, etirementsData);
              return (
                <circle
                  key={idx}
                  cx={coords.x}
                  cy={coords.y}
                  r="4"
                  fill="#a855f7"
                  className="hover:r-6 transition-all cursor-pointer"
                />
              );
            })}
            
            {/* Labels */}
            {etirementsData.map((zone, idx) => {
              const coords = getSafeCoordinates(zone, idx, etirementsData);
              const labelRadius = 105;
              const x = 120 + Math.cos(coords.angle) * labelRadius;
              const y = 120 + Math.sin(coords.angle) * labelRadius;
              
              let textAnchor = 'middle';
              let dx = 0;
              let dy = 0;
              
              const normalizedAngle = ((coords.angle + Math.PI / 2) % (2 * Math.PI)) * (180 / Math.PI);
              
              if (normalizedAngle > 15 && normalizedAngle < 165) {
                textAnchor = 'start';
                dx = 5;
              } else if (normalizedAngle > 195 && normalizedAngle < 345) {
                textAnchor = 'end';
                dx = -5;
              }
              
              if (normalizedAngle > 75 && normalizedAngle < 105) {
                dy = 12;
              } else if (normalizedAngle > 255 && normalizedAngle < 285) {
                dy = -8;
              }
              
              const shortName = zone.name.includes('/') ? zone.name.split('/')[0] : zone.name;
              
              return (
                <text
                  key={idx}
                  x={x + dx}
                  y={y + dy}
                  fill="#94a3b8"
                  fontSize="10"
                  fontWeight="500"
                  textAnchor={textAnchor}
                  dominantBaseline="middle"
                  className="select-none"
                >
                  {shortName}
                </text>
              );
            })}
            
            <defs>
              <radialGradient id="gradient-purple">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.3" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-700/50 space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {etirementsData.map((zone, idx) => (
            <div key={idx} className="flex items-center justify-between bg-slate-800/30 rounded px-2 py-1">
              <span className="text-slate-400">{zone.name}</span>
              <span className={`font-semibold ${
                zone.value >= 80 ? 'text-emerald-400' :
                zone.value >= 50 ? 'text-cyan-400' :
                zone.value >= 30 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {zone.value}%
              </span>
            </div>
          ))}
        </div>
        
        <div className="bg-gradient-to-r from-amber-500/10 to-red-500/10 rounded-lg p-3 border border-amber-500/20 mt-3">
          <div className="text-xs text-amber-400 flex items-center gap-1">
            ⚠️ Zones à améliorer: Chevilles ({etirementsData.find(z => z.name === 'Chevilles')?.value}%), Bras ({etirementsData.find(z => z.name === 'Bras')?.value}%)
          </div>
        </div>
      </div>
    </div>
  );
};

export default EtirementsZoneChart;
