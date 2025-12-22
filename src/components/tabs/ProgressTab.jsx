import React, { useState, useMemo } from 'react';
import { 
  User, 
  Camera, 
  Activity, 
  BarChart3, 
  Bell,
  TrendingUp,
  MessageSquare,
  Target,
  Brain,
  Zap
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { useTranslation } from '../../utils/translations';
import MetricsSection from '../BodyTracking/MetricsSection';
import PhotoGallerySection from '../BodyTracking/PhotoGallerySection';
import ImpedanceSection from '../BodyTracking/ImpedanceSection';
import SummaryTableSection from '../BodyTracking/SummaryTableSection';
import RemindersSection from '../BodyTracking/RemindersSection';
import CorrelationAnalysis from '../BodyTracking/CorrelationAnalysis';
import PredictionsModule from '../BodyTracking/PredictionsModule';
import StabilityAnalysis from '../BodyTracking/StabilityAnalysis';
import ProgressComments from '../BodyTracking/ProgressComments';
import BodyActivityInsights from '../BodyTracking/components/BodyActivityInsights';
import BodyTrackingErrorBoundary from '../BodyTracking/ErrorBoundary';
import CleanupNotification from '../BodyTracking/components/CleanupNotification';

const ProgressTab = () => {
  const [activeSection, setActiveSection] = useState('metrics');
  const t = useTranslation();

  const sections = useMemo(() => [
    { id: 'metrics', label: t('progress.sections.metrics.label'), icon: User, description: t('progress.sections.metrics.description'), category: 'basic' },
    { id: 'photos', label: t('progress.sections.photos.label'), icon: Camera, description: t('progress.sections.photos.description'), category: 'basic' },
    { id: 'impedance', label: t('progress.sections.impedance.label'), icon: Activity, description: t('progress.sections.impedance.description'), category: 'basic' },
    { id: 'summary', label: t('progress.sections.summary.label'), icon: BarChart3, description: t('progress.sections.summary.description'), category: 'basic' },
    { id: 'reminders', label: t('progress.sections.reminders.label'), icon: Bell, description: t('progress.sections.reminders.description'), category: 'basic' },
    { id: 'correlations', label: t('progress.sections.correlations.label'), icon: TrendingUp, description: t('progress.sections.correlations.description'), category: 'advanced' },
    { id: 'predictions', label: t('progress.sections.predictions.label'), icon: Target, description: t('progress.sections.predictions.description'), category: 'advanced' },
    { id: 'stability', label: t('progress.sections.stability.label'), icon: Zap, description: t('progress.sections.stability.description'), category: 'advanced' },
    { id: 'insights', label: t('progress.sections.insights.label'), icon: Brain, description: t('progress.sections.insights.description'), category: 'advanced' },
    { id: 'comments', label: t('progress.sections.comments.label'), icon: MessageSquare, description: t('progress.sections.comments.description'), category: 'advanced' }
  ], [t]);

  const basicSections = sections.filter(s => s.category === 'basic');
  const advancedSections = sections.filter(s => s.category === 'advanced');

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'metrics':
        return <MetricsSection />;
      case 'photos':
        return <PhotoGallerySection />;
      case 'impedance':
        return <ImpedanceSection />;
      case 'summary':
        return <SummaryTableSection />;
      case 'reminders':
        return <RemindersSection />;
      case 'correlations':
        return <CorrelationAnalysis />;
      case 'predictions':
        return <PredictionsModule />;
      case 'stability':
        return <StabilityAnalysis />;
      case 'insights':
        return <BodyActivityInsights />;
      case 'comments':
        return <ProgressComments />;
      default:
        return <MetricsSection />;
    }
  };

  const renderSectionGrid = (sectionList, title) => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {sectionList.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`gradient-button-premium rounded-lg p-4 text-left ${
                activeSection === section.id
                  ? 'gradient-button-premium-variant'
                  : ''
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${
                activeSection === section.id ? 'text-white' : 'text-slate-400'
              }`} />
              <div className="font-medium text-sm">{section.label}</div>
              <div className="text-xs text-slate-400 mt-1">{section.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen">
      {/* Contenu avec z-index relatif */}
      <div className="relative z-10 space-y-6 p-6">
        {/* Navigation des sections */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-orange-400" />
            {t('progress.title')}
            <span className="text-sm font-normal text-slate-400">
              - {t('progress.subtitle')}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderSectionGrid(basicSections, t('progress.categories.basic'))}
          {renderSectionGrid(advancedSections, t('progress.categories.advanced'))}
        </CardContent>
      </Card>

      {/* Notification de nettoyage (si nécessaire) */}
      <CleanupNotification />

      {/* Contenu de la section active - Protégé par Error Boundary */}
      <BodyTrackingErrorBoundary>
        {renderActiveSection()}
      </BodyTrackingErrorBoundary>
      </div>
    </div>
  );
};

export default ProgressTab;