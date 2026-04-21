/**
 * PredictionsPanel Component
 * 
 * Panneau d'affichage des prédictions et recommandations de lecture.
 * Intègre les estimations de temps, les recommandations d'objectifs
 * et l'analyse des patterns temporels.
 * 
 * @see Requirements 8.1, 8.2, 8.3
 */

import React, { useState } from 'react';
import { Clock, Target, TrendingUp, BookOpen, Calendar, Lightbulb, ChevronRight, Star, AlertCircle, CheckCircle2 } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import Button from '../../../ui/Button';
import { useTranslation } from '../../../../utils/translations';

const PredictionsPanel = ({ predictions, selectedPeriod, aggregatedData }) => {
  const t = useTranslation();
  const [activeTab, setActiveTab] = useState('completion');

  const isYearPeriod = typeof selectedPeriod === 'string' && /^\d{4}$/.test(selectedPeriod);
  const periodLabel = isYearPeriod ? `Année ${selectedPeriod}` : (selectedPeriod || 'Période');
  const periodContext = aggregatedData && typeof aggregatedData.periodDays === 'number'
    ? { daysWithReading: aggregatedData.uniqueDays || 0, totalDays: aggregatedData.periodDays }
    : null;

  if (!predictions.hasData) {
    return (
      <Card variant="books">
        <CardContent className="text-center py-8">
          <Lightbulb className="w-12 h-12 text-[#93c5fd]/60 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[#bfdbfe] mb-2">
            Prédictions en cours de calcul
          </h3>
          <p className="text-[#93c5fd]/80 text-sm">
            Continuez à enregistrer vos sessions pour obtenir des prédictions personnalisées.
          </p>
        </CardContent>
      </Card>
    );
  }

  const tabs = [
    { id: 'completion', label: 'Temps de lecture', icon: Clock },
    { id: 'goals', label: 'Objectifs', icon: Target },
    { id: 'patterns', label: 'Patterns', icon: TrendingUp }
  ];

  return (
    <div className="space-y-4">
      <Card variant="books">
        <CardHeader className="border-b border-[#3A86FF]/25">
          <CardTitle tone="books" className="flex items-center gap-3 normal-case tracking-wide">
            <Lightbulb className="w-5 h-5 text-[#93c5fd]" />
            Insights & Prédictions
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryMetric
          icon={<BookOpen className="w-4 h-4" />}
          label="Livres en cours"
          value={predictions.completionTimes?.length || 0}
          subtitle="prédictions disponibles"
        />
        <SummaryMetric
          icon={<Clock className="w-4 h-4" />}
          label="Temps estimé total"
          value={`${Math.round(predictions.stats?.totalEstimatedReadingTime || 0)}h`}
          subtitle="pour terminer tous les livres"
        />
        <SummaryMetric
          icon={<TrendingUp className="w-4 h-4" />}
          label="Régularité"
          value={`${predictions.stats?.readingConsistency || 0}%`}
          subtitle="de jours avec lecture"
        />
      </div>

      <Card variant="books" className="!p-3 md:!p-4">
        <CardContent className="!p-0 flex flex-wrap gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'books' : 'booksMuted'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 normal-case tracking-normal"
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Button>
            );
          })}
        </CardContent>
      </Card>

      {/* Contenu des onglets */}
      {activeTab === 'completion' && (
        <CompletionTimesTab predictions={predictions} />
      )}
      
      {activeTab === 'goals' && (
        <GoalRecommendationsTab
          predictions={predictions}
          periodLabel={periodLabel}
          periodContext={periodContext}
        />
      )}
      
      {activeTab === 'patterns' && (
        <PatternsTab
          predictions={predictions}
          periodLabel={periodLabel}
          periodContext={periodContext}
        />
      )}
    </div>
  );
};

/**
 * Composant pour afficher une métrique du résumé
 */
const SummaryMetric = ({ icon, label, value, subtitle }) => (
  <div className="text-center p-4 bg-black rounded-2xl border-2 border-[#3A86FF] shadow-md shadow-black/30">
    <div className="flex items-center justify-center gap-2 text-[#93c5fd] mb-2">
      {icon}
      <span className="text-sm">{label}</span>
    </div>
    <div className="text-xl font-bold text-[#bfdbfe] mb-1">{value}</div>
    <div className="text-xs text-[#93c5fd]/75">{subtitle}</div>
  </div>
);

/**
 * Onglet des temps de lecture estimés
 */
const CompletionTimesTab = ({ predictions }) => {
  const completionTimes = predictions.completionTimes || [];

  if (completionTimes.length === 0) {
    return (
      <Card variant="books">
        <CardContent className="text-center py-8">
          <BookOpen className="w-12 h-12 text-[#93c5fd]/60 mx-auto mb-3" />
          <p className="text-[#93c5fd]/85">Aucun livre en cours avec des prédictions disponibles.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="books">
      <CardHeader className="border-b border-[#3A86FF]/25">
        <CardTitle tone="books" className="normal-case tracking-wide">
          Temps de lecture estimés
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {completionTimes.map(prediction => (
          <CompletionTimeItem key={prediction.bookId} prediction={prediction} />
        ))}
      </CardContent>
    </Card>
  );
};

/**
 * Composant pour afficher une prédiction de temps de lecture
 */
const CompletionTimeItem = ({ prediction }) => {
  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high': return 'text-sky-300';
      case 'medium': return 'text-amber-300';
      case 'low': return 'text-red-400';
      default: return 'text-[#93c5fd]/70';
    }
  };

  const getConfidenceIcon = (confidence) => {
    switch (confidence) {
      case 'high': return <Star className="w-3 h-3" />;
      case 'medium': return <AlertCircle className="w-3 h-3" />;
      case 'low': return <AlertCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-black/80 rounded-xl border border-[#3A86FF]/35">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-[#bfdbfe] text-sm">{prediction.bookTitle}</h4>
          <div className={`flex items-center gap-1 ${getConfidenceColor(prediction.confidence)}`}>
            {getConfidenceIcon(prediction.confidence)}
            <span className="text-xs capitalize">{prediction.confidence}</span>
          </div>
        </div>
        <div className="text-xs text-[#93c5fd]/75 mb-2">
          {prediction.bookAuthor} • {prediction.bookGenre}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-[#93c5fd]/90">
            {prediction.progressPercent}% terminé
          </span>
          <span className="text-[#93c5fd]/70">
            {prediction.remainingPages} pages restantes
          </span>
        </div>
      </div>
      
      <div className="text-right">
        <div className="text-lg font-bold text-[#bfdbfe]">
          {prediction.estimate.hours}h
        </div>
        <div className="text-xs text-[#93c5fd]/75">
          {prediction.estimate.method === 'book_specific' ? 'Basé sur ce livre' :
           prediction.estimate.method === 'genre_specific' ? 'Basé sur le genre' :
           'Vitesse moyenne'}
        </div>
      </div>
    </div>
  );
};

/**
 * Onglet des recommandations d'objectifs
 */
const GoalRecommendationsTab = ({ predictions, periodLabel, periodContext }) => {
  const goals = predictions.goalRecommendations;

  if (!goals || (!goals.daily && !goals.weekly && !goals.monthly)) {
    return (
      <Card variant="books">
        <CardContent className="text-center py-8">
          <Target className="w-12 h-12 text-[#93c5fd]/60 mx-auto mb-3" />
          <p className="text-[#93c5fd]/85">Pas assez de données pour générer des recommandations d'objectifs.</p>
          {periodLabel && (
            <p className="text-[#93c5fd]/65 text-sm mt-2">Période : {periodLabel}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  const recent = goals.recent;

  return (
    <div className="space-y-4">
      {periodLabel && (
        <Card variant="books" className="!p-3 md:!p-4">
          <CardContent className="!py-3 !px-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-[#bfdbfe] font-medium">{periodLabel}</span>
              {periodContext && (
                <span className="text-[#93c5fd]/80">
                  {periodContext.daysWithReading} j. avec lecture / {periodContext.totalDays} j. dans la période
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {recent && (recent.todayMinutes > 0 || recent.thisWeekPages > 0) && (
        <Card variant="books" className="!p-3 md:!p-4 border-[#3A86FF]/80">
          <CardContent className="!py-3 !px-4">
            <div className="text-xs text-[#93c5fd]/75 mb-1">Données branchées à tes sessions (mise à jour en direct)</div>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-[#93c5fd]/90">
                <strong className="text-[#bfdbfe]">Aujourd'hui</strong> : {recent.todayMinutes} min
              </span>
              <span className="text-[#93c5fd]/90">
                <strong className="text-[#bfdbfe]">Cette semaine</strong> : {recent.thisWeekPages} pages
              </span>
            </div>
          </CardContent>
        </Card>
      )}
      {goals.daily && (
        <GoalRecommendationCard
          type="daily"
          goal={goals.daily}
          icon={<Calendar className="w-5 h-5" />}
          title="Objectif quotidien"
        />
      )}
      
      {goals.weekly && (
        <GoalRecommendationCard
          type="weekly"
          goal={goals.weekly}
          icon={<BookOpen className="w-5 h-5" />}
          title="Objectif hebdomadaire"
        />
      )}
      
      {goals.monthly && (
        <GoalRecommendationCard
          type="monthly"
          goal={goals.monthly}
          icon={<Target className="w-5 h-5" />}
          title="Objectif mensuel"
        />
      )}
    </div>
  );
};

/**
 * Composant pour afficher une recommandation d'objectif (3 niveaux : Facile, Moyen, Difficile)
 * Avec barre de progression pour les objectifs non atteints et indicateur visuel pour les atteints.
 */
const GoalRecommendationCard = ({ type, goal, icon, title }) => {
  const getUnitLabel = (goalType) => {
    switch (goalType) {
      case 'minutes': return 'min/jour';
      case 'pages': return 'pages/semaine';
      case 'books': return 'livres/mois';
      default: return '';
    }
  };

  const levels = goal.levels || [
    { level: 'easy', label: 'Facile', target: goal.target, fulfilled: goal.current >= goal.target }
  ];
  const unit = getUnitLabel(goal.type);

  return (
    <Card variant="books">
      <CardHeader className="border-b border-[#3A86FF]/25">
        <CardTitle tone="books" className="flex items-center gap-3 normal-case tracking-wide">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-[#93c5fd]/80">Moyenne sur la période</span>
            <span className="text-lg font-semibold text-[#bfdbfe]">{goal.current} {unit}</span>
          </div>
          <div className="text-xs text-[#93c5fd]/65 mt-0.5">Adaptatif : plus tu lis dans l’année, plus les objectifs suivent.</div>
        </div>
        <div className="space-y-3 mb-4">
          {levels.map((l) => {
            const progressPercent = l.target > 0 ? Math.min(100, Math.round((goal.current / l.target) * 100)) : 0;
            const gap = l.fulfilled ? 0 : Math.max(0, l.target - goal.current);
            return (
              <div
                key={l.level}
                className={`rounded-xl p-3 transition-colors ${l.fulfilled ? 'bg-[#3A86FF]/12 ring-1 ring-[#3A86FF]/45' : 'bg-black/60 border border-[#3A86FF]/25'}`}
              >
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <span className="font-medium text-[#bfdbfe]">{l.label}</span>
                  <span className="text-[#93c5fd]/90 text-sm tabular-nums">
                    {goal.current} / {l.target} {unit}
                  </span>
                </div>
                {l.fulfilled ? (
                  <div className="flex items-center gap-2 text-[#93c5fd] text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Objectif atteint
                  </div>
                ) : (
                  <>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#3A86FF] to-sky-300 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="text-xs text-[#93c5fd]/65 mt-1">
                      {gap > 0 && `Il te manque ${gap} ${unit === 'min/jour' ? 'min' : unit === 'pages/semaine' ? 'pages' : 'livre(s)'} pour ce palier`}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div className="text-sm text-[#93c5fd]/90 bg-black/50 p-3 rounded-lg border-l-2 border-[#3A86FF]/70">
          {goal.reasoning}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Onglet des patterns temporels
 */
const PatternsTab = ({ predictions, periodLabel, periodContext }) => {
  const patterns = predictions.temporalPatterns;

  if (!patterns || !patterns.insights) {
    return (
      <Card variant="books">
        <CardContent className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-[#93c5fd]/60 mx-auto mb-3" />
          <p className="text-[#93c5fd]/85">Pas assez de données pour analyser les patterns.</p>
          {periodLabel && (
            <p className="text-[#93c5fd]/65 text-sm mt-2">Période : {periodLabel}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Contexte de période : Année + régularité X jours / Y jours */}
      <Card variant="books" className="!p-3 md:!p-4">
        <CardContent className="!py-3 !px-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-[#bfdbfe] font-medium">{periodLabel}</span>
            {periodContext && (
              <span className="text-[#93c5fd]/80">
                {periodContext.daysWithReading} jour{periodContext.daysWithReading !== 1 ? 's' : ''} avec lecture
                {' / '}
                {periodContext.totalDays} jour{periodContext.totalDays !== 1 ? 's' : ''} dans la période
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insights principaux */}
      <Card variant="books">
        <CardHeader className="border-b border-[#3A86FF]/25">
          <CardTitle tone="books" className="normal-case tracking-wide">
            Insights de lecture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {patterns.insights.map((insight, index) => (
            <InsightItem key={index} insight={insight} />
          ))}
        </CardContent>
      </Card>

      {/* Recommandations actionables */}
      {patterns.actionableRecommendations?.length > 0 && (
        <Card variant="books">
          <CardHeader className="border-b border-[#3A86FF]/25">
            <CardTitle tone="books" className="normal-case tracking-wide">
              Recommandations prioritaires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {patterns.actionableRecommendations.map((recommendation, index) => (
              <RecommendationItem key={index} recommendation={recommendation} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/**
 * Composant pour afficher un insight
 */
const InsightItem = ({ insight }) => {
  const getInsightIcon = (type) => {
    switch (type) {
      case 'best_day': return <Calendar className="w-4 h-4 text-blue-400" />;
      case 'consistency': return <Star className="w-4 h-4 text-sky-300" />;
      case 'consistency_warning': return <AlertCircle className="w-4 h-4 text-amber-300" />;
      case 'positive_trend': return <TrendingUp className="w-4 h-4 text-sky-300" />;
      case 'negative_trend': return <TrendingUp className="w-4 h-4 text-red-400" />;
      default: return <Lightbulb className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-black/70 rounded-xl border border-[#3A86FF]/25">
      {getInsightIcon(insight.type)}
      <div className="flex-1">
        <h4 className="font-medium text-[#bfdbfe] text-sm mb-1">{insight.title}</h4>
        <p className="text-xs text-[#93c5fd]/80">{insight.description}</p>
      </div>
      {insight.actionable && (
        <ChevronRight className="w-4 h-4 text-[#93c5fd]/50" />
      )}
    </div>
  );
};

/**
 * Composant pour afficher une recommandation
 */
const RecommendationItem = ({ recommendation }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-sky-300';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-black/70 rounded-xl border border-[#3A86FF]/25">
      <div className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(recommendation.priority).replace('text-', 'bg-')}`} />
      <div className="flex-1">
        <h4 className="font-medium text-[#bfdbfe] text-sm mb-1">{recommendation.title}</h4>
        <p className="text-xs text-[#93c5fd]/80 mb-2">{recommendation.description}</p>
        <div className="text-xs text-[#93c5fd]/90 bg-black/60 border border-[#3A86FF]/30 px-2 py-1 rounded">
          Action: {recommendation.action}
        </div>
      </div>
    </div>
  );
};

export default PredictionsPanel;