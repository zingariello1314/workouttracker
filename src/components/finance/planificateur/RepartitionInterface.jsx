/**
 * Interface révolutionnaire pour le contrôle de la répartition salaire
 * Animations, transitions, et contrôles avancés
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { REPARTITION_ITEMS, formatCurrency as formatCurrencyUtil } from '../../../utils/planificateurUtils';

const RepartitionInterface = ({ 
  salaire, 
  repartition, 
  onRepartitionChange,
  formatCurrency = formatCurrencyUtil // Utiliser util par défaut
}) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calcul total et écart
  const totalAlloue = useMemo(() => {
    return Object.values(repartition).reduce((sum, val) => sum + (val || 0), 0);
  }, [repartition]);

  const ecart = useMemo(() => {
    return salaire - totalAlloue;
  }, [salaire, totalAlloue]);

  // Données pour le graphique
  const chartData = useMemo(() => {
    return REPARTITION_ITEMS
      .filter(item => (repartition[item.key] || 0) > 0)
      .map(item => ({
        name: item.label,
        value: repartition[item.key] || 0,
        color: item.color,
        icon: item.icon
      }));
  }, [repartition]);

  // Gestion du slider avec animations
  const handleSliderChange = useCallback((key, value) => {
    const valueNum = parseFloat(value) || 0;
    if (valueNum < 0) return;

    const newRepartition = {
      ...repartition,
      [key]: valueNum
    };
    
    const newTotal = Object.values(newRepartition).reduce((sum, val) => sum + (val || 0), 0);
    
    // Validation : ne pas dépasser salaire
    if (newTotal <= salaire) {
      onRepartitionChange(key, valueNum);
    }
  }, [repartition, salaire, onRepartitionChange]);

  // Custom tooltip pour le graphique
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{data.payload.icon}</span>
            <span className="text-white font-semibold">{data.name}</span>
          </div>
          <div className="text-lg font-bold" style={{ color: data.payload.color }}>
            {formatCurrency(data.value)}
          </div>
          <div className="text-xs text-slate-400">
            {((data.value / salaire) * 100).toFixed(1)}% du salaire
          </div>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div 
      className="repartition-interface space-y-6"
      role="region"
      aria-label="Interface de répartition du salaire"
    >
      {/* Indicateur Équilibre avec Animation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={`p-6 rounded-xl border-2 transition-all duration-300 ${
          ecart === 0 
            ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500' 
            : ecart > 0 
            ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500'
            : 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              style={{ willChange: 'transform' }} // GPU acceleration
              animate={{ 
                scale: ecart === 0 ? [1, 1.05, 1] : 1, // Réduire amplitude
                rotate: ecart === 0 ? [0, 360] : 0
              }}
              transition={{ 
                duration: 3, // Plus lent = moins de CPU
                repeat: ecart === 0 ? 3 : 0, // Limiter à 3 au lieu de Infinity
                repeatDelay: 5
              }}
              className="text-4xl"
              aria-hidden="true"
            >
              {ecart === 0 ? '✅' : ecart > 0 ? '💰' : '⚠️'}
            </motion.div>
            <div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(Math.abs(ecart))}
              </div>
              <div className="text-sm text-slate-300">
                {ecart === 0 
                  ? 'Répartition équilibrée' 
                  : ecart > 0 
                  ? 'Budget disponible'
                  : 'Sur-allocation'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Total alloué</div>
            <div className="text-xl font-bold text-white">
              {formatCurrency(totalAlloue)}
            </div>
            <div className="text-xs text-slate-500">
              sur {formatCurrency(salaire)}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders Interactifs avec Animations */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
          role="group"
          aria-labelledby="repartition-controls-title"
        >
          <h4 
            id="repartition-controls-title"
            className="text-lg font-semibold text-white mb-6 flex items-center gap-2"
          >
            <span aria-hidden="true">🎛️</span>
            <span>Contrôles Répartition</span>
          </h4>
          
          <div className="space-y-6">
            <AnimatePresence>
              {REPARTITION_ITEMS.map((item, index) => {
                const value = repartition[item.key] || 0;
                const pourcent = salaire > 0 ? (value / salaire) * 100 : 0;
                const isHovered = hoveredItem === item.key;

                return (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onMouseEnter={() => setHoveredItem(item.key)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`space-y-2 p-4 rounded-lg transition-all duration-300 ${
                      isHovered ? 'bg-slate-700/50 scale-105' : 'bg-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <motion.span 
                          className="text-2xl"
                          style={{ willChange: 'transform' }} // GPU acceleration
                          animate={{ 
                            scale: isHovered ? 1.15 : 1, // Réduire de 1.2 à 1.15
                            rotate: isHovered ? [0, 8, -8, 0] : 0 // Réduire de 10 à 8
                          }}
                          transition={{ duration: 0.4 }} // Réduire de 0.5 à 0.4
                          aria-hidden="true"
                        >
                          {item.icon}
                        </motion.span>
                        <span 
                          className="text-sm font-medium text-slate-300"
                          id={`${item.key}-label`}
                        >
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <motion.span 
                          className="text-sm font-semibold px-2 py-1 rounded"
                          style={{ 
                            backgroundColor: `${item.color}20`,
                            color: item.color
                          }}
                          animate={{ 
                            scale: isHovered ? 1.1 : 1
                          }}
                        >
                          {pourcent.toFixed(1)}%
                        </motion.span>
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => handleSliderChange(item.key, e.target.value)}
                          className="px-3 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm font-semibold w-28 text-right focus:ring-2 focus:ring-offset-0 transition-all"
                          style={{ 
                            focusRingColor: item.color
                          }}
                          min="0"
                          step="10"
                          aria-label={`Montant pour ${item.label}`}
                          aria-describedby={`${item.key}-label ${item.key}-description`}
                          aria-required="false"
                        />
                        <span className="text-slate-400 text-sm">€</span>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <input
                        type="range"
                        value={value}
                        min="0"
                        max={salaire}
                        step="10"
                        onChange={(e) => handleSliderChange(item.key, e.target.value)}
                        onMouseDown={() => setIsDragging(true)}
                        onMouseUp={() => setIsDragging(false)}
                        className="w-full h-3 rounded-lg appearance-none cursor-pointer transition-all duration-200"
                        style={{
                          background: `linear-gradient(to right, ${item.color} 0%, ${item.color} ${pourcent}%, #1e293b ${pourcent}%, #1e293b 100%)`,
                          boxShadow: isHovered ? `0 0 10px ${item.color}40` : 'none'
                        }}
                        aria-label={`Slider ${item.label}`}
                        aria-valuemin="0"
                        aria-valuemax={salaire}
                        aria-valuenow={value}
                        aria-valuetext={`${formatCurrency(value)} (${pourcent.toFixed(1)}%)`}
                        id={`${item.key}-description`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Graphique Interactif */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
          role="img"
          aria-labelledby="chart-title"
        >
          <h4 
            id="chart-title"
            className="text-lg font-semibold text-white mb-4 flex items-center gap-2"
          >
            <span aria-hidden="true">📊</span>
            <span>Visualisation de la répartition</span>
          </h4>
          
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke={hoveredItem === REPARTITION_ITEMS.find(i => i.label === entry.name)?.key ? '#fff' : 'none'}
                      strokeWidth={hoveredItem === REPARTITION_ITEMS.find(i => i.label === entry.name)?.key ? 3 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <div>Aucune répartition définie</div>
              </div>
            </div>
          )}

          {/* Légende Interactive */}
          <div 
            className="mt-6 grid grid-cols-2 gap-3"
            role="list"
            aria-label="Légende du graphique"
          >
            {REPARTITION_ITEMS.map((item) => {
              const value = repartition[item.key] || 0;
              if (value === 0) return null;
              
              return (
                <motion.div
                  key={item.key}
                  role="listitem"
                  whileHover={{ scale: 1.05 }}
                  onMouseEnter={() => setHoveredItem(item.key)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                    hoveredItem === item.key ? 'bg-slate-700' : 'bg-slate-800/50'
                  }`}
                  tabIndex={0}
                  aria-label={`${item.label}: ${formatCurrency(value)}`}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-slate-300">{item.label}</span>
                  <span className="text-xs font-semibold ml-auto" style={{ color: item.color }}>
                    {formatCurrency(value)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RepartitionInterface;
