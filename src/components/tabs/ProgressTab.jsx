import React, { useMemo, useEffect } from 'react';
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
import { useNavigationCache } from '../../hooks/useNavigationCache';

const PENDING_PROGRESS_SECTION_KEY = 'momentum.pendingProgressSection';

const ProgressTab = () => {
  const [activeSection, setActiveSection] = useNavigationCache('progress.activeSection', 'metrics');
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

  useEffect(() => {
    if (!sections.find(section => section.id === activeSection)) {
      setActiveSection('metrics');
    }
  }, [activeSection, sections, setActiveSection]);

  // Navigation depuis Nutrition (ou autre) : ouvrir une sous-section (ex. impédance)
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem(PENDING_PROGRESS_SECTION_KEY);
      if (pending && sections.some((s) => s.id === pending)) {
        setActiveSection(pending);
        sessionStorage.removeItem(PENDING_PROGRESS_SECTION_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [sections, setActiveSection]);

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

  const handleSectionKeyDown = (sectionList, currentId, event) => {
    const currentIndex = sectionList.findIndex(section => section.id === currentId);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % sectionList.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + sectionList.length) % sectionList.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = sectionList.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextSection = sectionList[nextIndex];
    setActiveSection(nextSection.id);
  };

  const renderSectionGrid = (sectionList, title, listId) => (
    <div className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-teal-700">{title}</h3>
      <div
        className="grid grid-cols-2 md:grid-cols-5 gap-3"
        role="tablist"
        aria-label={title}
        id={listId}
      >
        {sectionList.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          const hasActiveInList = sectionList.some(item => item.id === activeSection);
          const shouldTabFocus = isActive || (!hasActiveInList && sectionList[0]?.id === section.id);
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              onKeyDown={(event) => handleSectionKeyDown(sectionList, section.id, event)}
              role="tab"
              id={`progress-tab-${section.id}`}
              aria-selected={isActive}
              aria-controls={`progress-section-${section.id}`}
              tabIndex={shouldTabFocus ? 0 : -1}
              className={`rounded-lg border p-4 text-left transition ${
                isActive
                  ? 'border-[#0F5C45] bg-[#0F5C45]/25 text-teal-100 shadow-md shadow-black/30'
                  : 'border-[#0F4C5C]/50 bg-black text-teal-100 hover:border-[#0F5C45]/50 hover:bg-[#0F4C5C]/10'
              }`}
            >
              <Icon className={`mb-2 h-5 w-5 ${
                isActive ? 'text-sky-300' : 'text-teal-600'
              }`} />
              <div className="text-sm font-medium">{section.label}</div>
              <div className="mt-1 text-xs text-teal-800">{section.description}</div>
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
        <Card variant="sport">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-teal-100">
            <Brain className="h-6 w-6 text-sky-400" />
            {t('progress.title')}
            <span className="text-sm font-normal text-teal-700">
              - {t('progress.subtitle')}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderSectionGrid(basicSections, t('progress.categories.basic'), 'progress-basic-tabs')}
          {renderSectionGrid(advancedSections, t('progress.categories.advanced'), 'progress-advanced-tabs')}
        </CardContent>
      </Card>

      {/* Notification de nettoyage (si nécessaire) */}
      <CleanupNotification />

      {/* Contenu de la section active - Protégé par Error Boundary */}
      <BodyTrackingErrorBoundary>
        <div
          role="tabpanel"
          id={`progress-section-${activeSection}`}
          aria-labelledby={`progress-tab-${activeSection}`}
        >
          {renderActiveSection()}
        </div>
      </BodyTrackingErrorBoundary>
      </div>
    </div>
  );
};

export default ProgressTab;