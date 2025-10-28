import React, { useState, useMemo } from 'react';
import { 
  MessageSquare, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Heart,
  Brain,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Star,
  Calendar,
  BarChart3,
  Activity,
  Flame,
  Shield,
  ArrowRight,
  RefreshCw,
  Settings,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { formatDate } from '../../utils/dateUtils';

const ProgressComments = () => {
  const { data } = useWorkout();
  const [selectedPeriod, setSelectedPeriod] = useState('4weeks');
  const [commentTypes, setCommentTypes] = useState(['achievements', 'trends', 'recommendations', 'motivational']);
  const [showSettings, setShowSettings] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const commentCategories = [
    { value: 'achievements', label: 'Réussites', icon: Award, color: 'text-yellow-400' },
    { value: 'trends', label: 'Tendances', icon: TrendingUp, color: 'text-blue-400' },
    { value: 'recommendations', label: 'Recommandations', icon: Target, color: 'text-orange-400' },
    { value: 'motivational', label: 'Motivation', icon: Zap, color: 'text-purple-400' },
    { value: 'warnings', label: 'Alertes', icon: AlertCircle, color: 'text-red-400' },
    { value: 'insights', label: 'Insights', icon: Brain, color: 'text-green-400' }
  ];

  const analysisPeriods = [
    { value: '1week', label: '1 semaine' },
    { value: '2weeks', label: '2 semaines' },
    { value: '4weeks', label: '4 semaines' },
    { value: '8weeks', label: '8 semaines' },
    { value: '12weeks', label: '12 semaines' }
  ];

  // Génération automatique des commentaires
  const generatedComments = useMemo(() => {
    const comments = [];
    const periodWeeks = parseInt(selectedPeriod.replace('weeks', '')) || 1;
    
    // Données simulées pour la génération de commentaires
    const metricsData = {
      weight: { current: 75.2, previous: 76.8, target: 72.0, trend: 'decreasing' },
      bodyFat: { current: 18.5, previous: 19.8, target: 15.0, trend: 'decreasing' },
      muscleMass: { current: 32.8, previous: 32.1, target: 35.0, trend: 'increasing' },
      waist: { current: 82, previous: 85, target: 78, trend: 'decreasing' },
      workoutFrequency: { current: 4.2, previous: 3.8, target: 5.0, trend: 'increasing' }
    };

    // Calculs communs
    const weightLoss = metricsData.weight.previous - metricsData.weight.current;
    const muscleMassGain = metricsData.muscleMass.current - metricsData.muscleMass.previous;
    const bodyFatReduction = metricsData.bodyFat.previous - metricsData.bodyFat.current;

    // Commentaires de réussites
    if (commentTypes.includes('achievements')) {
      if (weightLoss > 0) {
        comments.push({
          id: 'achievement_weight',
          type: 'achievements',
          priority: 'high',
          title: '🎉 Excellente perte de poids !',
          content: `Félicitations ! Vous avez perdu ${weightLoss.toFixed(1)} kg en ${periodWeeks} semaine${periodWeeks > 1 ? 's' : ''}. C'est un rythme parfait et sain pour atteindre vos objectifs.`,
          timestamp: new Date(),
          metrics: ['weight'],
          sentiment: 'positive',
          actionable: false
        });
      }

      if (muscleMassGain > 0) {
        comments.push({
          id: 'achievement_muscle',
          type: 'achievements',
          priority: 'high',
          title: '💪 Gain de masse musculaire',
          content: `Superbe progression ! Vous avez gagné ${muscleMassGain.toFixed(1)} kg de masse musculaire. Votre programme d'entraînement porte ses fruits.`,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          metrics: ['muscleMass'],
          sentiment: 'positive',
          actionable: false
        });
      }

      const waistReduction = metricsData.waist.previous - metricsData.waist.current;
      if (waistReduction > 0) {
        comments.push({
          id: 'achievement_waist',
          type: 'achievements',
          priority: 'medium',
          title: '📏 Tour de taille réduit',
          content: `Excellent travail ! Votre tour de taille a diminué de ${waistReduction} cm. Cela indique une perte de graisse abdominale efficace.`,
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          metrics: ['waist'],
          sentiment: 'positive',
          actionable: false
        });
      }
    }

    // Commentaires de tendances
    if (commentTypes.includes('trends')) {
      comments.push({
        id: 'trend_composition',
        type: 'trends',
        priority: 'medium',
        title: '📊 Amélioration de la composition corporelle',
        content: `Tendance positive détectée : votre ratio masse musculaire/masse graisseuse s'améliore constamment depuis ${periodWeeks} semaines. Continuez sur cette lancée !`,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        metrics: ['bodyFat', 'muscleMass'],
        sentiment: 'positive',
        actionable: false
      });

      comments.push({
        id: 'trend_consistency',
        type: 'trends',
        priority: 'medium',
        title: '🔄 Régularité en progression',
        content: `Votre fréquence d'entraînement est passée de ${metricsData.workoutFrequency.previous} à ${metricsData.workoutFrequency.current} séances par semaine. Cette régularité accrue explique vos excellents résultats.`,
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        metrics: ['workoutFrequency'],
        sentiment: 'positive',
        actionable: false
      });
    }

    // Recommandations
    if (commentTypes.includes('recommendations')) {
      const progressToTarget = (metricsData.weight.previous - metricsData.weight.current) / (metricsData.weight.previous - metricsData.weight.target);
      
      comments.push({
        id: 'recommendation_nutrition',
        type: 'recommendations',
        priority: 'high',
        title: '🥗 Optimisation nutritionnelle',
        content: `Basé sur vos progrès actuels, vous atteindrez votre objectif de poids dans environ ${Math.ceil((metricsData.weight.current - metricsData.weight.target) / (weightLoss / periodWeeks))} semaines. Maintenez votre déficit calorique actuel.`,
        timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
        metrics: ['weight'],
        sentiment: 'neutral',
        actionable: true,
        actions: ['Continuer le déficit calorique', 'Surveiller les protéines', 'Maintenir l\'hydratation']
      });

      comments.push({
        id: 'recommendation_training',
        type: 'recommendations',
        priority: 'medium',
        title: '🏋️ Progression d\'entraînement',
        content: `Pour maximiser votre gain de masse musculaire, envisagez d'augmenter progressivement l'intensité de vos séances de musculation. Votre corps s'adapte bien au stress actuel.`,
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        metrics: ['muscleMass'],
        sentiment: 'neutral',
        actionable: true,
        actions: ['Augmenter les charges', 'Ajouter des exercices composés', 'Planifier une semaine de décharge']
      });
    }

    // Messages motivationnels
    if (commentTypes.includes('motivational')) {
      comments.push({
        id: 'motivational_progress',
        type: 'motivational',
        priority: 'medium',
        title: '🌟 Vous êtes sur la bonne voie !',
        content: `Vos efforts constants portent leurs fruits ! En ${periodWeeks} semaines, vous avez fait des progrès remarquables sur tous les fronts. Gardez cette motivation intacte !`,
        timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000),
        metrics: ['overall'],
        sentiment: 'positive',
        actionable: false
      });

      comments.push({
        id: 'motivational_consistency',
        type: 'motivational',
        priority: 'low',
        title: '🔥 La régularité paie !',
        content: `Chaque séance compte, chaque mesure compte. Votre discipline et votre persévérance sont exemplaires. Continuez à vous dépasser !`,
        timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000),
        metrics: ['consistency'],
        sentiment: 'positive',
        actionable: false
      });
    }

    // Alertes et avertissements
    if (commentTypes.includes('warnings')) {
      // Simulation d'une alerte si nécessaire
      if (Math.random() > 0.7) {
        comments.push({
          id: 'warning_plateau',
          type: 'warnings',
          priority: 'high',
          title: '⚠️ Attention au plateau',
          content: `Votre perte de poids ralentit depuis quelques jours. C'est normal ! Votre corps s'adapte. Il est peut-être temps de varier votre routine.`,
          timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000),
          metrics: ['weight'],
          sentiment: 'warning',
          actionable: true,
          actions: ['Varier l\'entraînement', 'Revoir les calories', 'Planifier un refeed']
        });
      }
    }

    // Insights et analyses
    if (commentTypes.includes('insights')) {
      comments.push({
        id: 'insight_correlation',
        type: 'insights',
        priority: 'medium',
        title: '🧠 Corrélation intéressante',
        content: `Analyse détectée : vos meilleures performances en perte de graisse coïncident avec vos semaines à 4+ entraînements. La fréquence semble être votre clé du succès.`,
        timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000),
        metrics: ['bodyFat', 'workoutFrequency'],
        sentiment: 'neutral',
        actionable: true,
        actions: ['Maintenir 4+ séances/semaine', 'Planifier les séances à l\'avance']
      });

      comments.push({
        id: 'insight_timing',
        type: 'insights',
        priority: 'low',
        title: '⏰ Pattern temporel',
        content: `Vos mesures du matin sont 15% plus stables que celles du soir. Pour une meilleure précision, privilégiez les pesées matinales à jeun.`,
        timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000),
        metrics: ['measurement_timing'],
        sentiment: 'neutral',
        actionable: true,
        actions: ['Mesures matinales', 'Conditions standardisées']
      });
    }

    return comments.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority] || b.timestamp - a.timestamp;
    });
  }, [selectedPeriod, commentTypes]);

  const commentStats = useMemo(() => {
    const total = generatedComments.length;
    const byType = commentTypes.reduce((acc, type) => {
      acc[type] = generatedComments.filter(c => c.type === type).length;
      return acc;
    }, {});
    
    const byPriority = {
      high: generatedComments.filter(c => c.priority === 'high').length,
      medium: generatedComments.filter(c => c.priority === 'medium').length,
      low: generatedComments.filter(c => c.priority === 'low').length
    };

    const bySentiment = {
      positive: generatedComments.filter(c => c.sentiment === 'positive').length,
      neutral: generatedComments.filter(c => c.sentiment === 'neutral').length,
      warning: generatedComments.filter(c => c.sentiment === 'warning').length
    };

    return { total, byType, byPriority, bySentiment };
  }, [generatedComments, commentTypes]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-400 bg-red-600/10';
      case 'medium': return 'border-l-yellow-400 bg-yellow-600/10';
      case 'low': return 'border-l-blue-400 bg-blue-600/10';
      default: return 'border-l-gray-400 bg-gray-600/10';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="w-4 h-4 text-green-400" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default: return <MessageSquare className="w-4 h-4 text-blue-400" />;
    }
  };

  const getCategoryIcon = (type) => {
    const category = commentCategories.find(c => c.value === type);
    if (!category) return <MessageSquare className="w-4 h-4" />;
    const Icon = category.icon;
    return <Icon className={`w-4 h-4 ${category.color}`} />;
  };

  const handleTypeToggle = (type) => {
    setCommentTypes(prev => 
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const refreshComments = () => {
    // Force re-render by updating a dependency
    setSelectedPeriod(prev => prev);
  };

  return (
    <div className="space-y-6">
      {/* Contrôles et statistiques */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              Commentaires automatiques
              <span className="text-sm font-normal text-slate-400">
                ({commentStats.total} commentaires générés)
              </span>
            </CardTitle>
            
            <div className="flex gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
              >
                {analysisPeriods.map(period => (
                  <option key={period.value} value={period.value}>{period.label}</option>
                ))}
              </select>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshComments}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {showSettings && (
          <CardContent className="border-t border-slate-600">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Types de commentaires
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {commentCategories.map(category => (
                    <label
                      key={category.value}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        commentTypes.includes(category.value)
                          ? 'border-purple-500 bg-purple-600/20'
                          : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={commentTypes.includes(category.value)}
                        onChange={() => handleTypeToggle(category.value)}
                        className="sr-only"
                      />
                      <category.icon className={`w-4 h-4 ${category.color}`} />
                      <span className="text-sm text-white">{category.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-700 text-purple-500"
                />
                <label htmlFor="autoRefresh" className="text-sm text-slate-300">
                  Actualisation automatique des commentaires
                </label>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-600/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {commentStats.bySentiment.positive || 0}
            </div>
            <div className="text-sm text-slate-400">Positifs</div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-600/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400 mb-1">
              {commentStats.byPriority.high || 0}
            </div>
            <div className="text-sm text-slate-400">Priorité haute</div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-600/10 border-orange-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-400 mb-1">
              {generatedComments.filter(c => c.actionable).length}
            </div>
            <div className="text-sm text-slate-400">Actionnables</div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-600/10 border-purple-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {commentStats.byType.insights || 0}
            </div>
            <div className="text-sm text-slate-400">Insights</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des commentaires */}
      <div className="space-y-4">
        {generatedComments.map((comment) => (
          <Card key={comment.id} className={`border-l-4 ${getPriorityColor(comment.priority)}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  {getSentimentIcon(comment.sentiment)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white">{comment.title}</h3>
                      {getCategoryIcon(comment.type)}
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        comment.priority === 'high' ? 'bg-red-600/20 text-red-400' :
                        comment.priority === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-blue-600/20 text-blue-400'
                      }`}>
                        {comment.priority === 'high' ? 'Haute' : 
                         comment.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{comment.content}</p>
                  </div>
                </div>
                
                <div className="text-right text-sm text-slate-400">
                  {formatDate(comment.timestamp)}
                </div>
              </div>

              {comment.actions && comment.actions.length > 0 && (
                <div className="bg-slate-700/50 rounded-lg p-4 mt-4">
                  <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-400" />
                    Actions recommandées
                  </h4>
                  <ul className="space-y-2">
                    {comment.actions.map((action, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-slate-300">
                        <ArrowRight className="w-3 h-3 text-orange-400 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {comment.metrics && comment.metrics.length > 0 && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-600">
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-400">
                    Métriques liées: {comment.metrics.join(', ')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {generatedComments.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <h4 className="text-xl font-semibold mb-2 text-white">Aucun commentaire généré</h4>
            <p className="text-slate-400 mb-4">
              Sélectionnez des types de commentaires et une période d'analyse pour commencer.
            </p>
            <Button onClick={() => setCommentTypes(['achievements', 'trends', 'recommendations'])}>
              <Sparkles className="w-4 h-4 mr-2" />
              Générer des commentaires
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Informations sur le système */}
      <Card className="bg-blue-600/10 border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-400" />
            Comment ça fonctionne
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-slate-300">
            <div>
              <h4 className="font-medium text-white mb-2">Génération automatique</h4>
              <p>Les commentaires sont générés automatiquement en analysant vos données de progression, tendances et performances sur la période sélectionnée.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-2">Types de commentaires</h4>
              <ul className="space-y-1 ml-4">
                <li>• <strong>Réussites</strong> : Célèbre vos accomplissements et progrès</li>
                <li>• <strong>Tendances</strong> : Analyse les patterns dans vos données</li>
                <li>• <strong>Recommandations</strong> : Suggère des actions pour optimiser vos résultats</li>
                <li>• <strong>Motivation</strong> : Messages d'encouragement personnalisés</li>
                <li>• <strong>Alertes</strong> : Signale les points d'attention</li>
                <li>• <strong>Insights</strong> : Révèle des corrélations et patterns cachés</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-2">Personnalisation</h4>
              <p>Vous pouvez personnaliser les types de commentaires affichés et la période d'analyse selon vos préférences.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressComments;