import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Flame, Target, Dumbbell, Calendar, Clock, Award } from 'lucide-react';

const FitnessDashboard = () => {
  const [globalPeriod, setGlobalPeriod] = useState('30j');
  
  const periods = ['7j', '30j', '90j', '365j', 'Tout'];
  
  // Mock data
  const mockData = {
    '7j': {
      totalReps: 214,
      totalSets: 31,
      avgRepsPerSet: 6.9,
      sessions: 3,
      streak: 4,
      topExercices: [
        { name: 'Curl incliné haltères', reps: 24, percent: 11, trend: 20 },
        { name: 'Développé incliné', reps: 19, percent: 9, trend: 15 },
        { name: 'Curl poulie basse', reps: 19, percent: 9, trend: 0 },
        { name: 'Extension poulie pronation', reps: 18, percent: 8, trend: 12 },
        { name: 'Dips', reps: 12, percent: 6, trend: -5 }
      ],
      muscleGroups: [
        { name: 'Pectoraux', reps: 79, percent: 37, color: '#8b5cf6' },
        { name: 'Biceps', reps: 62, percent: 29, color: '#06b6d4' },
        { name: 'Triceps', reps: 56, percent: 26, color: '#ec4899' },
        { name: 'Quadriceps', reps: 19, percent: 9, color: '#6366f1' }
      ],
      objectives: [
        { name: 'Reps/semaine', current: 214, target: 800, unit: 'reps' },
        { name: 'Poids', current: 65, target: 65, unit: 'kg', achieved: true },
        { name: 'Tour de taille', current: 77, target: 77, unit: 'cm', achieved: true }
      ]
    },
    '30j': {
      totalReps: 859,
      totalSets: 124,
      avgRepsPerSet: 6.9,
      sessions: 12,
      streak: 4,
      topExercices: [
        { name: 'Curl incliné haltères', reps: 96, percent: 11, trend: 20 },
        { name: 'Développé incliné', reps: 76, percent: 9, trend: 15 },
        { name: 'Curl poulie basse', reps: 78, percent: 9, trend: 0 },
        { name: 'Extension poulie pronation', reps: 72, percent: 8, trend: 12 },
        { name: 'Dips', reps: 48, percent: 6, trend: -5 }
      ],
      muscleGroups: [
        { name: 'Pectoraux', reps: 315, percent: 37, color: '#8b5cf6' },
        { name: 'Biceps', reps: 246, percent: 29, color: '#06b6d4' },
        { name: 'Triceps', reps: 222, percent: 26, color: '#ec4899' },
        { name: 'Quadriceps', reps: 76, percent: 9, color: '#6366f1' }
      ],
      objectives: [
        { name: 'Reps/semaine', current: 405, target: 800, unit: 'reps' },
        { name: 'Poids', current: 65, target: 65, unit: 'kg', achieved: true },
        { name: 'Tour de taille', current: 77, target: 77, unit: 'cm', achieved: true }
      ]
    }
  };
  
  const data = mockData[globalPeriod] || mockData['30j'];
  
  // Mock data pour activités complémentaires
  const complementaryData = {
    boxe: {
      sessions: 8,
      totalTime: 360, // minutes
      avgTime: 45,
      streak: 2,
      weeklyEvolution: [40, 50, 45, 60, 50, 45, 40, 45] // minutes par session
    },
    natation: {
      sessions: 10,
      totalDistance: 12500, // mètres
      totalTime: 450, // minutes
      avgDistance: 1250,
      avgTime: 45,
      weeklyDistance: [2500, 2800, 3200, 2000, 2000], // par semaine
      temps100m: [125, 122, 120, 118, 115], // secondes - amélioration
      temps500m: [650, 640, 630, 620, 610], // secondes
      calendar: Array(30).fill(0).map(() => Math.random() > 0.7)
    },
    etirements: {
      zones: [
        { name: 'Cou/Nuque', value: 45, max: 100 },
        { name: 'Épaules', value: 82, max: 100 },
        { name: 'Bras', value: 38, max: 100 },
        { name: 'Dos', value: 75, max: 100 },
        { name: 'Torse', value: 42, max: 100 },
        { name: 'Hanches', value: 95, max: 100 },
        { name: 'Jambes', value: 88, max: 100 },
        { name: 'Chevilles', value: 25, max: 100 }
      ]
    }
  };
  
  const TrendIcon = ({ value }) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-rose-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };
  
  const getTrendColor = (value) => {
    if (value > 0) return 'text-emerald-400';
    if (value < 0) return 'text-rose-400';
    return 'text-slate-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            Graphiques & Analyses
          </h1>
          <p className="text-slate-400 mt-1">Vue d'ensemble de vos performances</p>
        </div>
        <div className="flex gap-2 bg-slate-900/50 backdrop-blur-sm rounded-lg p-1 border border-purple-500/20">
          {periods.map(period => (
            <button
              key={period}
              onClick={() => setGlobalPeriod(period)}
              className={`px-4 py-2 rounded-md transition-all duration-300 ${
                globalPeriod === period
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/50'
                  : 'hover:bg-slate-800/50 text-slate-400'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Grille 3x3 - Tous les éléments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ROW 1 - 3 Cartes KPI */}
        {/* Card 1: Volume & Répétitions */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-xl hover:shadow-purple-500/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-purple-400" />
              Volume & Répétitions
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/10">
              <div className="text-sm text-slate-400 mb-1">RÉPÉTITIONS TOTALES</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {data.totalReps}
                </span>
                <span className="text-slate-400">reps</span>
                <div className="flex items-center gap-1 ml-auto">
                  <TrendIcon value={18} />
                  <span className={getTrendColor(18)}>+18%</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-4 border border-cyan-500/10">
              <div className="text-sm text-slate-400 mb-1">SÉRIES TOTALES</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {data.totalSets}
                </span>
                <span className="text-slate-400">séries</span>
                <div className="flex items-center gap-1 ml-auto">
                  <TrendIcon value={15} />
                  <span className={getTrendColor(15)}>+15%</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-4 border border-pink-500/10">
              <div className="text-sm text-slate-400 mb-1">MOYENNE PAR SÉRIE</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                  {data.avgRepsPerSet}
                </span>
                <span className="text-slate-400">reps/série</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Activité & Régularité */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-pink-500/20 shadow-xl hover:shadow-pink-500/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Flame className="w-5 h-5 text-pink-400" />
              Activité & Régularité
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-pink-500/10">
              <div className="text-sm text-slate-400 mb-1">SÉANCES</div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                  {data.sessions}
                </span>
                <span className="text-slate-400">séances</span>
                <span className="text-sm text-cyan-400 ml-auto">75%</span>
              </div>
              <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-lg shadow-pink-500/50"
                  style={{ width: '75%' }}
                />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg p-4 border border-orange-500/20">
              <div className="text-sm text-slate-400 mb-2">STREAK</div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1">
                  {[...Array(data.streak)].map((_, i) => (
                    <Flame key={i} className="w-5 h-5 text-orange-400" fill="currentColor" />
                  ))}
                </div>
                <span className="text-2xl font-bold text-orange-400">{data.streak} jours</span>
              </div>
              <div className="text-sm text-slate-400">🏆 Meilleur: 12 jours</div>
            </div>
          </div>
        </div>

        {/* Card 3: Objectifs & Performance */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/20 shadow-xl hover:shadow-cyan-500/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              Objectifs
            </h2>
          </div>
          
          <div className="space-y-4">
            {data.objectives.map((obj, idx) => {
              const progress = (obj.current / obj.target) * 100;
              const isAchieved = obj.achieved || progress >= 100;
              
              return (
                <div 
                  key={idx}
                  className={`bg-slate-800/50 rounded-lg p-4 border ${
                    isAchieved ? 'border-emerald-500/20' : 'border-amber-500/20'
                  }`}
                >
                  <div className="text-xs text-slate-400 mb-2">{obj.name.toUpperCase()}</div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      {obj.current}
                    </span>
                    <span className="text-sm text-slate-400">/ {obj.target}</span>
                    {isAchieved && <span className="ml-auto">🎉</span>}
                  </div>
                  <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`absolute inset-y-0 left-0 rounded-full shadow-lg transition-all duration-500 ${
                        isAchieved 
                          ? 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-emerald-500/50'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/50'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ROW 2 - 3 Graphiques */}
        {/* Évolution du Volume */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Évolution du Volume
          </h3>
          <div className="h-44 flex items-end justify-around gap-3 px-2">
            {[
              { value: 620, week: 'S1' },
              { value: 780, week: 'S2' },
              { value: 920, week: 'S3' },
              { value: 750, week: 'S4' },
              { value: 859, week: 'S5' }
            ].map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-purple-600 to-pink-600 rounded-t-lg shadow-lg shadow-purple-500/50 transition-all duration-500 hover:shadow-purple-500/80 hover:from-purple-500 hover:to-pink-500 relative"
                    style={{ height: `${(item.value / 1000) * 160}px` }}
                  >
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 px-2 py-1 rounded text-xs whitespace-nowrap">
                      {item.value} reps
                    </div>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-medium">{item.week}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-700/50">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Volume total:</span>
              <span className="text-purple-400 font-semibold">12,450 kg</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-slate-400">Progression:</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">+18%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Répartition Musculaire */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-pink-500/20 shadow-xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-pink-400" />
            Répartition Musculaire
          </h3>
          <div className="flex items-center justify-center h-48">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                {data.muscleGroups.map((group, idx) => {
                  const total = data.muscleGroups.reduce((sum, g) => sum + g.percent, 0);
                  const startAngle = data.muscleGroups
                    .slice(0, idx)
                    .reduce((sum, g) => sum + (g.percent / total) * 360, 0);
                  const angle = (group.percent / total) * 360;
                  const radius = 60;
                  const cx = 80;
                  const cy = 80;
                  
                  const x1 = cx + radius * Math.cos((startAngle * Math.PI) / 180);
                  const y1 = cy + radius * Math.sin((startAngle * Math.PI) / 180);
                  const x2 = cx + radius * Math.cos(((startAngle + angle) * Math.PI) / 180);
                  const y2 = cy + radius * Math.sin(((startAngle + angle) * Math.PI) / 180);
                  
                  const largeArc = angle > 180 ? 1 : 0;
                  
                  return (
                    <path
                      key={idx}
                      d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={group.color}
                      opacity="0.8"
                      className="hover:opacity-100 transition-opacity duration-300"
                      style={{ filter: `drop-shadow(0 0 8px ${group.color}80)` }}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{data.totalReps}</div>
                  <div className="text-xs text-slate-400">reps</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
            {data.muscleGroups.map((group, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="text-slate-300">{group.name}</span>
                </div>
                <span className="text-slate-400">{group.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Exercices */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/20 shadow-xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            Top Exercices
          </h3>
          <div className="space-y-3">
            {data.topExercices.slice(0, 5).map((ex, idx) => (
              <div key={idx} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-300 truncate">{ex.name}</span>
                  <span className="text-sm font-semibold text-cyan-400">{ex.reps}</span>
                </div>
                <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg shadow-cyan-500/50"
                    style={{ width: `${ex.percent * 10}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROW 3 - 3 Graphiques */}
        {/* Calendrier d'Activité - Heatmap style GitHub */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            Calendrier d'Activité
          </h3>
          <div className="space-y-2">
            {['Oct', 'Sep', 'Aug'].map((month, monthIdx) => (
              <div key={month} className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-8">{month}</span>
                <div className="flex flex-wrap gap-1">
                  {[...Array(30)].map((_, dayIdx) => {
                    const hasSession = (monthIdx + dayIdx) % 3 !== 0;
                    const intensity = ((monthIdx * 30 + dayIdx) % 10) / 10;
                    return (
                      <div
                        key={dayIdx}
                        className={`w-2.5 h-2.5 rounded-sm transition-all duration-200 hover:scale-125 cursor-pointer ${
                          hasSession
                            ? intensity > 0.7
                              ? 'bg-purple-500 shadow-sm shadow-purple-500/50'
                              : intensity > 0.4
                              ? 'bg-purple-600/70'
                              : 'bg-purple-700/50'
                            : 'bg-slate-800 border border-slate-700/50'
                        }`}
                        title={hasSession ? `Séance - ${Math.floor(intensity * 100)} reps` : 'Repos'}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center gap-3 text-xs mb-2">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700/50" />
                <span className="text-slate-400">Repos</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-purple-700/50" />
                <span className="text-slate-400">Faible</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-purple-600/70" />
                <span className="text-slate-400">Moyen</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                <span className="text-slate-400">Intense</span>
              </div>
            </div>
            <div className="text-sm text-slate-400">
              <span className="text-purple-400 font-semibold">36 séances</span> sur 90 jours (40%)
            </div>
          </div>
        </div>

        {/* Distribution Temporelle */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/20 shadow-xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Distribution
          </h3>
          <div className="space-y-3">
            {[
              { day: 'Lundi', percent: 28 },
              { day: 'Mardi', percent: 21 },
              { day: 'Mercredi', percent: 14 },
              { day: 'Jeudi', percent: 18 },
              { day: 'Vendredi', percent: 12 }
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-300">{item.day}</span>
                  <span className="text-sm font-semibold text-cyan-400">{item.percent}%</span>
                </div>
                <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg shadow-cyan-500/50"
                    style={{ width: `${item.percent * 3}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progression par Exercice */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-pink-500/20 shadow-xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pink-400" />
            Progression Individuelle
          </h3>
          <div className="h-40 relative mb-2">
            <svg className="w-full h-full" viewBox="0 0 300 160" preserveAspectRatio="none">
              {/* Grid lines */}
              {[0, 40, 80, 120, 160].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="300"
                  y2={y}
                  stroke="#334155"
                  strokeWidth="1"
                  opacity="0.3"
                />
              ))}
              
              {/* Lines */}
              {[
                { color: '#ec4899', points: [30, 40, 55, 65, 80], name: 'Curl pronation' },
                { color: '#06b6d4', points: [25, 35, 50, 60, 80], name: 'Curl supination' },
                { color: '#8b5cf6', points: [20, 30, 40, 55, 72], name: 'Dips' }
              ].map((line, lineIdx) => {
                const pathData = line.points
                  .map((val, i) => {
                    const x = (i / (line.points.length - 1)) * 300;
                    const y = 160 - (val / 100) * 160;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ');
                
                return (
                  <g key={lineIdx}>
                    <path
                      d={pathData}
                      fill="none"
                      stroke={line.color}
                      strokeWidth="3"
                      style={{ filter: `drop-shadow(0 0 4px ${line.color}80)` }}
                    />
                    {line.points.map((val, i) => (
                      <circle
                        key={i}
                        cx={(i / (line.points.length - 1)) * 300}
                        cy={160 - (val / 100) * 160}
                        r="4"
                        fill={line.color}
                      />
                    ))}
                  </g>
                );
              })}
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-400 px-2">
              {['Jan', 'Fév', 'Mar', 'Avr', 'Mai'].map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-700/50 space-y-2">
            {[
              { name: 'Curl pronation', color: '#ec4899', change: '+33%' },
              { name: 'Curl supination', color: '#06b6d4', change: '+33%' },
              { name: 'Dips', color: '#8b5cf6', change: '+28%' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}80` }}
                  />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="text-emerald-400 font-semibold">{item.change}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-lg p-3 border border-emerald-500/20">
            <div className="text-xs text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Tendance: +18% 📈
            </div>
          </div>
        </div>

      </div>

      {/* Section Activités Complémentaires */}
      <div className="mt-12 mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
          Activités Complémentaires
        </h2>
        <div className="h-1 w-32 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full mt-2" />
      </div>

      {/* Ligne 4 - Boxe & Natation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Boxe - Activité */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-red-500/20 shadow-xl hover:shadow-red-500/20 transition-all duration-300">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🥊</span>
            Activité Boxe
          </h3>
          
          <div className="space-y-4 mb-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-red-500/10">
              <div className="text-sm text-slate-400 mb-1">SÉANCES CE MOIS</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                  {complementaryData.boxe.sessions}
                </span>
                <span className="text-slate-400">séances</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-orange-500/10">
                <div className="text-xs text-slate-400 mb-1">TEMPS TOTAL</div>
                <div className="text-xl font-bold text-orange-400">{complementaryData.boxe.totalTime}min</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-red-500/10">
                <div className="text-xs text-slate-400 mb-1">MOYENNE</div>
                <div className="text-xl font-bold text-red-400">{complementaryData.boxe.avgTime}min</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg p-3 border border-orange-500/20">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" fill="currentColor" />
                <div>
                  <div className="text-sm font-semibold text-orange-400">Streak: {complementaryData.boxe.streak} séances</div>
                  <div className="text-xs text-slate-400">Continue comme ça ! 💪</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/50">
            <div className="text-sm text-slate-400 mb-3">Évolution hebdomadaire</div>
            <div className="h-24 flex items-end gap-1.5">
              {complementaryData.boxe.weeklyEvolution.map((time, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center group relative">
                  <div 
                    className="w-full bg-gradient-to-t from-red-600 to-orange-500 rounded-t-sm transition-all hover:from-red-500 hover:to-orange-400"
                    style={{ height: `${(time / 70) * 96}px`, minHeight: '8px' }}
                  />
                  <div className="absolute -top-6 opacity-0 group-hover:opacity-100 text-xs bg-slate-800 px-2 py-1 rounded whitespace-nowrap transition-opacity z-10">
                    {time}min
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span>8 dernières séances</span>
              <span className="text-orange-400">Moy: 45min</span>
            </div>
          </div>
        </div>

        {/* Natation - Performance */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/20 shadow-xl hover:shadow-cyan-500/20 transition-all duration-300">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🏊</span>
            Performance Natation
          </h3>
          
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-cyan-500/10">
              <div className="text-sm text-slate-400 mb-1">DISTANCE TOTALE</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {(complementaryData.natation.totalDistance / 1000).toFixed(1)}
                </span>
                <span className="text-slate-400">km</span>
                <div className="flex items-center gap-1 ml-auto">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">+22%</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-blue-500/10">
                <div className="text-xs text-slate-400 mb-1">SÉANCES</div>
                <div className="text-xl font-bold text-blue-400">{complementaryData.natation.sessions}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-cyan-500/10">
                <div className="text-xs text-slate-400 mb-1">TEMPS TOTAL</div>
                <div className="text-xl font-bold text-cyan-400">{complementaryData.natation.totalTime}min</div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3 border border-blue-500/10">
              <div className="text-xs text-slate-400 mb-1">DISTANCE MOYENNE / SÉANCE</div>
              <div className="text-2xl font-bold text-blue-400">{complementaryData.natation.avgDistance}m</div>
            </div>

            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-3 border border-cyan-500/20">
              <div className="text-xs text-cyan-400 flex items-center gap-1">
                <Award className="w-4 h-4" />
                Meilleure séance: 1,850m
              </div>
            </div>
          </div>
        </div>

        {/* Natation - Évolution Distance */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 shadow-xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Évolution Distance
          </h3>
          
          <div className="h-44 relative mb-2">
            <svg className="w-full h-full" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid meet">
              {/* Padding de 10px de chaque côté */}
              {[0, 45, 90, 135, 180].map((y) => (
                <line
                  key={y}
                  x1="20"
                  y1={y}
                  x2="300"
                  y2={y}
                  stroke="#334155"
                  strokeWidth="1"
                  opacity="0.3"
                />
              ))}
              
              {(() => {
                const points = complementaryData.natation.weeklyDistance;
                const maxVal = Math.max(...points);
                const minVal = Math.min(...points);
                const range = maxVal - minVal;
                
                // Fonction pour calculer les coordonnées avec padding
                const getX = (i) => 20 + (i / (points.length - 1)) * 280;
                const getY = (val) => 170 - ((val - minVal) / (range || 1)) * 150;
                
                const pathData = points
                  .map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`)
                  .join(' ');
                
                const areaPath = pathData + ` L ${getX(points.length - 1)} 170 L 20 170 Z`;
                
                return (
                  <g>
                    <path
                      d={areaPath}
                      fill="url(#gradient-cyan)"
                      opacity="0.3"
                    />
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ filter: 'drop-shadow(0 0 4px #06b6d480)' }}
                    />
                    {points.map((val, i) => (
                      <circle
                        key={i}
                        cx={getX(i)}
                        cy={getY(val)}
                        r="5"
                        fill="#06b6d4"
                        stroke="#0e7490"
                        strokeWidth="2"
                      />
                    ))}
                  </g>
                );
              })()}
              
              <defs>
                <linearGradient id="gradient-cyan" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-400 px-3">
              {['S1', 'S2', 'S3', 'S4', 'S5'].map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Distance totale:</span>
              <span className="text-cyan-400 font-semibold">12.5 km</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Progression:</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">+28%</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Ligne 5 - Natation suite & Étirements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Natation - Temps & Allure */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 shadow-xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Temps & Allure
          </h3>
          
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-blue-500/10">
              <div className="text-sm text-slate-400 mb-3">TEMPS MOYEN AU 100M</div>
              <div className="flex items-end gap-1 h-24 mb-2">
                {complementaryData.natation.temps100m.map((time, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-full">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-600 to-cyan-500 rounded-t transition-all"
                        style={{ height: `${((130 - time) / 15) * 96}px` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs bg-slate-800 px-2 py-1 rounded whitespace-nowrap transition-opacity">
                          {time}s
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>S1</span>
                <span>→</span>
                <span>S5</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-cyan-500/10">
                <div className="text-xs text-slate-400 mb-1">MEILLEUR 100M</div>
                <div className="text-xl font-bold text-cyan-400">1'55"</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-blue-500/10">
                <div className="text-xs text-slate-400 mb-1">PROGRESSION</div>
                <div className="text-xl font-bold text-emerald-400">-8%</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-lg p-3 border border-emerald-500/20">
              <div className="text-xs text-emerald-400">
                💪 Tu t'améliores ! -10s en 5 semaines
              </div>
            </div>
          </div>
        </div>

        {/* Natation - Volume & Régularité */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/20 shadow-xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Volume & Régularité
          </h3>
          
          <div className="space-y-4 mb-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-cyan-500/10">
              <div className="text-sm text-slate-400 mb-1">FRÉQUENCE</div>
              <div className="text-2xl font-bold text-cyan-400 mb-2">2.5 séances/semaine</div>
              <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg shadow-cyan-500/50"
                  style={{ width: '83%' }}
                />
              </div>
              <div className="text-xs text-slate-400 mt-1">Objectif: 3 séances/semaine</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-slate-400 mb-2">Calendrier du mois</div>
            <div className="grid grid-cols-10 gap-1">
              {complementaryData.natation.calendar.map((hasSession, idx) => (
                <div
                  key={idx}
                  className={`w-full aspect-square rounded-sm ${
                    hasSession
                      ? 'bg-cyan-500 shadow-sm shadow-cyan-500/50'
                      : 'bg-slate-800 border border-slate-700/50'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/50">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Volume total:</span>
              <span className="text-cyan-400 font-semibold">12.5 km</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Jours préférés:</span>
              <span className="text-cyan-400 font-semibold">Mar, Jeu, Sam</span>
            </div>
          </div>
        </div>

        {/* Étirements - Radar Chart Corps */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🧘</span>
            Étirements par Zone
          </h3>
          
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
                {complementaryData.etirements.zones.map((zone, idx) => {
                  const angle = (idx / complementaryData.etirements.zones.length) * 2 * Math.PI - Math.PI / 2;
                  const x2 = 120 + Math.cos(angle) * 85;
                  const y2 = 120 + Math.sin(angle) * 85;
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
                  points={complementaryData.etirements.zones
                    .map((zone, idx) => {
                      const angle = (idx / complementaryData.etirements.zones.length) * 2 * Math.PI - Math.PI / 2;
                      const radius = (zone.value / zone.max) * 85;
                      const x = 120 + Math.cos(angle) * radius;
                      const y = 120 + Math.sin(angle) * radius;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  fill="url(#gradient-purple)"
                  opacity="0.5"
                  stroke="#a855f7"
                  strokeWidth="2"
                  style={{ filter: 'drop-shadow(0 0 8px #a855f780)' }}
                />
                
                {/* Data points */}
                {complementaryData.etirements.zones.map((zone, idx) => {
                  const angle = (idx / complementaryData.etirements.zones.length) * 2 * Math.PI - Math.PI / 2;
                  const radius = (zone.value / zone.max) * 85;
                  const x = 120 + Math.cos(angle) * radius;
                  const y = 120 + Math.sin(angle) * radius;
                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#a855f7"
                      className="hover:r-6 transition-all cursor-pointer"
                    />
                  );
                })}
                
                {/* Labels - Positionnement amélioré */}
                {complementaryData.etirements.zones.map((zone, idx) => {
                  const angle = (idx / complementaryData.etirements.zones.length) * 2 * Math.PI - Math.PI / 2;
                  const labelRadius = 105;
                  const x = 120 + Math.cos(angle) * labelRadius;
                  const y = 120 + Math.sin(angle) * labelRadius;
                  
                  // Déterminer l'alignement selon la position
                  let textAnchor = 'middle';
                  let dx = 0;
                  let dy = 0;
                  
                  const normalizedAngle = ((angle + Math.PI / 2) % (2 * Math.PI)) * (180 / Math.PI);
                  
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
                  
                  // Simplifier les noms longs
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
              {complementaryData.etirements.zones.map((zone, idx) => (
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
                ⚠️ Zones à améliorer: Chevilles (25%), Bras (38%)
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FitnessDashboard;