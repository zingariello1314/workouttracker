/**
 * ProjectionMatrix Component
 * Matrice de projections avec 3 scénarios (optimiste/réaliste/pessimiste)
 */

import { TrendingUp, Target, TrendingDown } from 'lucide-react';

const ProjectionMatrix = ({ projections, currentValue, unit = '' }) => {
  const scenarios = [
    { key: 'optimiste', label: 'Optimiste', icon: TrendingUp, color: 'green' },
    { key: 'realiste', label: 'Réaliste', icon: Target, color: 'blue' },
    { key: 'pessimiste', label: 'Pessimiste', icon: TrendingDown, color: 'red' }
  ];

  const periods = Object.keys(projections);

  const getColorClasses = (color) => {
    const colors = {
      green: {
        bg: 'bg-green-500/20',
        border: 'border-green-500/50',
        text: 'text-green-400',
        glow: 'shadow-green-500/20'
      },
      blue: {
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/50',
        text: 'text-blue-400',
        glow: 'shadow-blue-500/20'
      },
      red: {
        bg: 'bg-red-500/20',
        border: 'border-red-500/50',
        text: 'text-red-400',
        glow: 'shadow-red-500/20'
      }
    };
    return colors[color];
  };

  const calculateGrowth = (value) => {
    if (!currentValue) return 0;
    return ((value - currentValue) / currentValue) * 100;
  };

  return (
    <div className="space-y-4">
      {/* Current Value */}
      {currentValue && (
        <div className="text-center p-4 bg-slate-700/30 rounded-lg border border-slate-600">
          <p className="text-sm text-slate-400 mb-1">Valeur Actuelle</p>
          <p className="text-2xl font-bold text-white">
            {currentValue.toLocaleString()}{unit}
          </p>
        </div>
      )}

      {/* Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-left text-sm font-medium text-slate-400 border-b border-slate-700">
                Scénario
              </th>
              {periods.map(period => (
                <th key={period} className="p-3 text-center text-sm font-medium text-slate-400 border-b border-slate-700">
                  {period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scenarios.map(scenario => {
              const colors = getColorClasses(scenario.color);
              const Icon = scenario.icon;

              return (
                <tr key={scenario.key} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 ${colors.bg} rounded-lg border ${colors.border}`}>
                        <Icon className={`w-4 h-4 ${colors.text}`} />
                      </div>
                      <span className={`font-medium ${colors.text}`}>
                        {scenario.label}
                      </span>
                    </div>
                  </td>
                  {periods.map(period => {
                    const value = projections[period][scenario.key];
                    const growth = calculateGrowth(value);

                    return (
                      <td key={period} className="p-3 text-center">
                        <div className="space-y-1">
                          <p className="text-lg font-bold text-white">
                            {value.toLocaleString()}{unit}
                          </p>
                          {currentValue && (
                            <p className={`text-xs ${colors.text}`}>
                              {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                            </p>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Visual Chart - Aggrandi et amélioré */}
      <div className="relative h-80 bg-slate-800/30 rounded-lg p-6 border border-slate-700/50">
        <svg className="w-full h-full" viewBox="0 0 400 280" preserveAspectRatio="xMidYMid meet">
          {/* Defs pour les gradients et effets */}
          <defs>
            {/* Gradient vert (optimiste) */}
            <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0.05" />
            </linearGradient>
            
            {/* Gradient bleu (réaliste) */}
            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.05" />
            </linearGradient>
            
            {/* Gradient rouge (pessimiste) */}
            <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(239, 68, 68)" stopOpacity="0.05" />
            </linearGradient>
            
            {/* Filtre glow */}
            <filter id="chartGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Grid horizontal */}
          {[0, 20, 40, 60, 80, 100].map(y => (
            <line
              key={y}
              x1="30"
              y1={260 - (y * 2.2)}
              x2="390"
              y2={260 - (y * 2.2)}
              stroke="rgb(71, 85, 105)"
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.3"
            />
          ))}

          {/* Grid vertical */}
          {periods.map((period, index) => {
            const x = 30 + (index / (periods.length - 1)) * 360;
            return (
              <line
                key={period}
                x1={x}
                y1="40"
                x2={x}
                y2="260"
                stroke="rgb(71, 85, 105)"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.2"
              />
            );
          })}

          {/* Labels des périodes */}
          {periods.map((period, index) => {
            const x = 30 + (index / (periods.length - 1)) * 360;
            return (
              <text
                key={period}
                x={x}
                y="275"
                textAnchor="middle"
                fill="rgb(148, 163, 184)"
                fontSize="12"
                fontWeight="500"
              >
                {period}
              </text>
            );
          })}

          {/* Lines et aires pour chaque scénario */}
          {scenarios.map(scenario => {
            const colors = {
              green: { line: 'rgb(34, 197, 94)', gradient: 'url(#greenGradient)' },
              blue: { line: 'rgb(59, 130, 246)', gradient: 'url(#blueGradient)' },
              red: { line: 'rgb(239, 68, 68)', gradient: 'url(#redGradient)' }
            };

            const values = periods.map(period => projections[period][scenario.key]);
            const maxValue = Math.max(...Object.values(projections).flatMap(p => Object.values(p)));

            const points = periods.map((period, index) => {
              const x = 30 + (index / (periods.length - 1)) * 360;
              const value = projections[period][scenario.key];
              const y = 260 - ((value / maxValue) * 200);
              return { x, y, value };
            });

            const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');
            const areaPoints = `${points[0].x},260 ${linePoints} ${points[points.length - 1].x},260`;

            return (
              <g key={scenario.key}>
                {/* Aire sous la courbe */}
                <polygon
                  points={areaPoints}
                  fill={colors[scenario.color].gradient}
                  opacity="0.4"
                />
                
                {/* Ligne principale */}
                <polyline
                  points={linePoints}
                  fill="none"
                  stroke={colors[scenario.color].line}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#chartGlow)"
                  opacity="0.9"
                />

                {/* Points sur la courbe */}
                {points.map((point, index) => (
                  <g key={index}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="5"
                      fill={colors[scenario.color].line}
                      stroke="rgb(15, 23, 42)"
                      strokeWidth="2"
                      filter="url(#chartGlow)"
                      className="cursor-pointer hover:r-6 transition-all"
                    />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="3"
                      fill="white"
                      opacity="0.8"
                    />
                  </g>
                ))}
              </g>
            );
          })}

          {/* Axe Y (labels) */}
          {[0, 25, 50, 75, 100].map(percent => {
            const y = 260 - (percent * 2.2);
            return (
              <text
                key={percent}
                x="20"
                y={y + 4}
                textAnchor="end"
                fill="rgb(148, 163, 184)"
                fontSize="11"
              >
                {percent}%
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs">
        {scenarios.map(scenario => {
          const colors = getColorClasses(scenario.color);
          return (
            <div key={scenario.key} className="flex items-center gap-2">
              <div className={`w-3 h-3 ${colors.bg} border ${colors.border} rounded`}></div>
              <span className="text-slate-400">{scenario.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectionMatrix;
