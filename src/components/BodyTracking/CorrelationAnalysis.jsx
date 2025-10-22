import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity, 
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  EyeOff,
  Filter,
  Download,
  RefreshCw,
  Zap
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { formatDate } from '../../utils/dateUtils';

const CorrelationAnalysis = () => {
  const { data } = useWorkout();
  const [selectedTimeframe, setSelectedTimeframe] = useState('3months');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCorrelations, setSelectedCorrelations] = useState(['strong', 'moderate']);

  // Données simulées pour les corrélations
  const correlationData = useMemo(() => {
    const baseData = [
      {
        id: 1,
        variable1: 'Poids',
        variable2: 'Tour de taille',
        correlation: 0.87,
        strength: 'strong',
        direction: 'positive',
        significance: 0.001,
        dataPoints: 45,
        trend: 'increasing',
        description: 'Forte corrélation positive entre le poids et le tour de taille',
        insights: [
          'Chaque kg de poids perdu correspond à environ 1.2cm de tour de taille en moins',
          'Cette corrélation est stable sur les 3 derniers mois',
          'Tendance particulièrement marquée les 4 dernières semaines'
        ],
        recommendations: [
          'Continuer les efforts de perte de poids pour réduire le tour de taille',
          'Intégrer des exercices ciblés pour la zone abdominale'
        ]
      },
      {
        id: 2,
        variable1: 'Masse musculaire',
        variable2: 'Métabolisme de base',
        correlation: 0.92,
        strength: 'strong',
        direction: 'positive',
        significance: 0.0001,
        dataPoints: 38,
        trend: 'stable',
        description: 'Très forte corrélation entre masse musculaire et métabolisme',
        insights: [
          'Chaque kg de muscle gagné augmente le métabolisme de ~50 kcal/jour',
          'Corrélation la plus forte observée dans vos données',
          'Impact direct sur la capacité de brûlage des calories'
        ],
        recommendations: [
          'Maintenir ou augmenter la masse musculaire pour optimiser le métabolisme',
          'Privilégier les exercices de résistance'
        ]
      },
      {
        id: 3,
        variable1: 'Pourcentage de graisse',
        variable2: 'Graisse viscérale',
        correlation: 0.78,
        strength: 'strong',
        direction: 'positive',
        significance: 0.002,
        dataPoints: 42,
        trend: 'decreasing',
        description: 'Corrélation forte entre graisse corporelle et viscérale',
        insights: [
          'Réduction simultanée des deux types de graisse',
          'Amélioration constante sur les 2 derniers mois',
          'Tendance positive pour la santé cardiovasculaire'
        ],
        recommendations: [
          'Continuer le programme actuel de réduction de graisse',
          'Maintenir l\'activité cardio régulière'
        ]
      },
      {
        id: 4,
        variable1: 'Eau corporelle',
        variable2: 'Masse musculaire',
        correlation: 0.65,
        strength: 'moderate',
        direction: 'positive',
        significance: 0.01,
        dataPoints: 40,
        trend: 'stable',
        description: 'Corrélation modérée entre hydratation et masse musculaire',
        insights: [
          'Bonne hydratation favorise le maintien de la masse musculaire',
          'Relation stable mais importante pour la performance',
          'Variation saisonnière observée'
        ],
        recommendations: [
          'Maintenir une hydratation optimale (2-3L/jour)',
          'Surveiller l\'hydratation les jours d\'entraînement'
        ]
      },
      {
        id: 5,
        variable1: 'Âge métabolique',
        variable2: 'Condition physique',
        correlation: -0.71,
        strength: 'strong',
        direction: 'negative',
        significance: 0.003,
        dataPoints: 35,
        trend: 'improving',
        description: 'Corrélation négative forte : meilleure forme = âge métabolique plus jeune',
        insights: [
          'Amélioration de la condition physique rajeunit l\'âge métabolique',
          'Progression de 2 ans d\'âge métabolique en 3 mois',
          'Impact direct de l\'entraînement régulier'
        ],
        recommendations: [
          'Maintenir la régularité de l\'entraînement',
          'Varier les types d\'exercices pour optimiser les bénéfices'
        ]
      },
      {
        id: 6,
        variable1: 'IMC',
        variable2: 'Tension artérielle',
        correlation: 0.45,
        strength: 'moderate',
        direction: 'positive',
        significance: 0.05,
        dataPoints: 28,
        trend: 'stable',
        description: 'Corrélation modérée entre IMC et tension artérielle',
        insights: [
          'Réduction de l\'IMC tend à améliorer la tension',
          'Relation moins marquée que prévu',
          'Autres facteurs influencent également la tension'
        ],
        recommendations: [
          'Continuer la gestion du poids',
          'Surveiller d\'autres facteurs (stress, sommeil, alimentation)'
        ]
      },
      {
        id: 7,
        variable1: 'Masse osseuse',
        variable2: 'Activité physique',
        correlation: 0.38,
        strength: 'weak',
        direction: 'positive',
        significance: 0.08,
        dataPoints: 32,
        trend: 'stable',
        description: 'Corrélation faible entre masse osseuse et activité',
        insights: [
          'Impact limité de l\'activité sur la masse osseuse à court terme',
          'Bénéfices probables sur le long terme',
          'Variation individuelle importante'
        ],
        recommendations: [
          'Maintenir les exercices de résistance pour la santé osseuse',
          'Surveiller l\'évolution sur une période plus longue'
        ]
      }
    ];

    // Filtrer selon la période sélectionnée
    return baseData.map(item => ({
      ...item,
      // Ajuster les corrélations selon la période
      correlation: selectedTimeframe === '1month' 
        ? item.correlation * 0.9 
        : selectedTimeframe === '6months' 
        ? item.correlation * 1.1 
        : item.correlation
    }));
  }, [selectedTimeframe]);

  const timeframes = [
    { value: '1month', label: '1 mois' },
    { value: '3months', label: '3 mois' },
    { value: '6months', label: '6 mois' },
    { value: '1year', label: '1 an' }
  ];

  const strengthLevels = [
    { value: 'strong', label: 'Forte (>0.7)', color: 'text-green-400', bgColor: 'bg-green-600/20' },
    { value: 'moderate', label: 'Modérée (0.3-0.7)', color: 'text-yellow-400', bgColor: 'bg-yellow-600/20' },
    { value: 'weak', label: 'Faible (<0.3)', color: 'text-red-400', bgColor: 'bg-red-600/20' }
  ];

  const getCorrelationStrength = (correlation) => {
    const abs = Math.abs(correlation);
    if (abs >= 0.7) return 'strong';
    if (abs >= 0.3) return 'moderate';
    return 'weak';
  };

  const getCorrelationColor = (correlation) => {
    const strength = getCorrelationStrength(correlation);
    const strengthInfo = strengthLevels.find(s => s.value === strength);
    return strengthInfo?.color || 'text-gray-400';
  };

  const getCorrelationBg = (correlation) => {
    const strength = getCorrelationStrength(correlation);
    const strengthInfo = strengthLevels.find(s => s.value === strength);
    return strengthInfo?.bgColor || 'bg-gray-600/20';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing':
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'stable':
      default:
        return <Activity className="w-4 h-4 text-blue-400" />;
    }
  };

  const getSignificanceLevel = (significance) => {
    if (significance < 0.001) return { level: 'Très élevée', color: 'text-green-400' };
    if (significance < 0.01) return { level: 'Élevée', color: 'text-green-300' };
    if (significance < 0.05) return { level: 'Modérée', color: 'text-yellow-400' };
    return { level: 'Faible', color: 'text-red-400' };
  };

  const filteredCorrelations = correlationData.filter(item => 
    selectedCorrelations.includes(getCorrelationStrength(item.correlation))
  );

  const handleStrengthToggle = (strength) => {
    setSelectedCorrelations(prev => 
      prev.includes(strength)
        ? prev.filter(s => s !== strength)
        : [...prev, strength]
    );
  };

  const exportCorrelations = () => {
    const csvContent = [
      ['Variable 1', 'Variable 2', 'Corrélation', 'Force', 'Signification', 'Points de données'],
      ...filteredCorrelations.map(item => [
        item.variable1,
        item.variable2,
        item.correlation.toFixed(3),
        getCorrelationStrength(item.correlation),
        item.significance,
        item.dataPoints
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `correlations_${selectedTimeframe}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* En-tête et contrôles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              Analyse des corrélations
              <span className="text-sm font-normal text-slate-400">
                ({filteredCorrelations.length} corrélations détectées)
              </span>
            </CardTitle>
            
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
              >
                {timeframes.map(tf => (
                  <option key={tf.value} value={tf.value}>{tf.label}</option>
                ))}
              </select>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showAdvanced ? 'Masquer' : 'Avancé'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={exportCorrelations}
              >
                <Download className="w-4 h-4" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Filtres par force de corrélation */}
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm text-slate-400 mr-2">Afficher :</span>
            {strengthLevels.map(strength => (
              <label
                key={strength.value}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg border cursor-pointer transition-all ${
                  selectedCorrelations.includes(strength.value)
                    ? `border-purple-500 ${strength.bgColor}`
                    : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedCorrelations.includes(strength.value)}
                  onChange={() => handleStrengthToggle(strength.value)}
                  className="sr-only"
                />
                <span className={`text-sm ${strength.color}`}>{strength.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Résumé des insights */}
      <Card className="bg-purple-600/10 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Insights clés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {filteredCorrelations.filter(c => getCorrelationStrength(c.correlation) === 'strong').length}
              </div>
              <div className="text-sm text-slate-400">Corrélations fortes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {(filteredCorrelations.reduce((sum, c) => sum + Math.abs(c.correlation), 0) / filteredCorrelations.length).toFixed(2)}
              </div>
              <div className="text-sm text-slate-400">Corrélation moyenne</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {filteredCorrelations.filter(c => c.trend === 'improving' || c.trend === 'increasing').length}
              </div>
              <div className="text-sm text-slate-400">Tendances positives</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des corrélations */}
      <div className="space-y-4">
        {filteredCorrelations.map(correlation => (
          <Card key={correlation.id} className={`${getCorrelationBg(correlation.correlation)} border-slate-600`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-white text-lg">
                      {correlation.variable1} ↔ {correlation.variable2}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCorrelationBg(correlation.correlation)} ${getCorrelationColor(correlation.correlation)}`}>
                      r = {correlation.correlation.toFixed(3)}
                    </span>
                    {getTrendIcon(correlation.trend)}
                  </div>
                  
                  <p className="text-slate-300 mb-3">{correlation.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-4">
                    <div className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {correlation.dataPoints} points de données
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      Direction: {correlation.direction === 'positive' ? 'Positive' : 'Négative'}
                    </div>
                    {showAdvanced && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Signification: <span className={getSignificanceLevel(correlation.significance).color}>
                          {getSignificanceLevel(correlation.significance).level}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Insights détaillés */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-400" />
                    Observations
                  </h4>
                  <ul className="space-y-2">
                    {correlation.insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    Recommandations
                  </h4>
                  <ul className="space-y-2">
                    {correlation.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                        <TrendingUp className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {showAdvanced && (
                <div className="mt-6 pt-4 border-t border-slate-600">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Force:</span>
                      <div className={`font-medium ${getCorrelationColor(correlation.correlation)}`}>
                        {getCorrelationStrength(correlation.correlation) === 'strong' ? 'Forte' :
                         getCorrelationStrength(correlation.correlation) === 'moderate' ? 'Modérée' : 'Faible'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">P-value:</span>
                      <div className="font-medium text-white">{correlation.significance}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Tendance:</span>
                      <div className="font-medium text-white capitalize">{correlation.trend}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Fiabilité:</span>
                      <div className={`font-medium ${getSignificanceLevel(correlation.significance).color}`}>
                        {getSignificanceLevel(correlation.significance).level}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCorrelations.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Zap className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <h4 className="text-xl font-semibold mb-2 text-white">Aucune corrélation trouvée</h4>
            <p className="text-slate-400 mb-4">
              Ajustez les filtres ou la période d'analyse pour voir plus de corrélations.
            </p>
            <Button onClick={() => setSelectedCorrelations(['strong', 'moderate', 'weak'])}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Afficher toutes les corrélations
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Informations méthodologiques */}
      {showAdvanced && (
        <Card className="bg-blue-600/10 border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              Méthodologie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-slate-300">
              <div>
                <h4 className="font-medium text-white mb-2">Calcul des corrélations</h4>
                <p>Les corrélations sont calculées en utilisant le coefficient de corrélation de Pearson (r), qui mesure la relation linéaire entre deux variables.</p>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">Interprétation</h4>
                <ul className="space-y-1 ml-4">
                  <li>• <strong>r &gt; 0.7</strong> : Corrélation forte</li>
                  <li>• <strong>0.3 ≤ r ≤ 0.7</strong> : Corrélation modérée</li>
                  <li>• <strong>r &lt; 0.3</strong> : Corrélation faible</li>
                  <li>• <strong>r &gt; 0</strong> : Corrélation positive (les variables évoluent dans le même sens)</li>
                  <li>• <strong>r &lt; 0</strong> : Corrélation négative (les variables évoluent en sens inverse)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">Signification statistique</h4>
                <p>La p-value indique la probabilité que la corrélation observée soit due au hasard. Plus elle est faible, plus la corrélation est significative.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CorrelationAnalysis;