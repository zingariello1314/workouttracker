import React, { useState } from 'react';
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

  const sections = [
    { id: 'metrics', label: 'Métriques', icon: User, description: 'Poids, taille, mensurations', category: 'basic' },
    { id: 'photos', label: 'Photos', icon: Camera, description: 'Galerie de progression', category: 'basic' },
    { id: 'impedance', label: 'Impédancemètre', icon: Activity, description: 'Données détaillées', category: 'basic' },
    { id: 'summary', label: 'Récapitulatif', icon: BarChart3, description: 'Tableau de bord', category: 'basic' },
    { id: 'reminders', label: 'Rappels', icon: Bell, description: 'Notifications automatiques', category: 'basic' },
    { id: 'correlations', label: 'Corrélations', icon: TrendingUp, description: 'Analyse des relations', category: 'advanced' },
    { id: 'predictions', label: 'Prévisions', icon: Target, description: 'Projections futures', category: 'advanced' },
    { id: 'stability', label: 'Stabilité', icon: Zap, description: 'Détection de stagnations', category: 'advanced' },
    { id: 'insights', label: 'Analyses Intelligentes', icon: Brain, description: 'Pourquoi j\'ai changé ?', category: 'advanced' },
    { id: 'comments', label: 'Commentaires', icon: MessageSquare, description: 'Analyse automatique', category: 'advanced' }
  ];

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
              onClick={() => setActiveSection(section.id)}
              className={`p-4 rounded-lg border transition-all text-left ${
                activeSection === section.id
                  ? 'border-orange-500 bg-orange-600/20 text-white'
                  : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${
                activeSection === section.id ? 'text-orange-400' : 'text-slate-400'
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
    <div className="space-y-6">
      {/* Navigation des sections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-orange-400" />
            Suivi Corporel Complet
            <span className="text-sm font-normal text-slate-400">
              - Système intégré de progression
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderSectionGrid(basicSections, 'Fonctionnalités de base')}
          {renderSectionGrid(advancedSections, 'Analyses avancées')}
        </CardContent>
      </Card>

      {/* Notification de nettoyage (si nécessaire) */}
      <CleanupNotification />

      {/* Contenu de la section active - Protégé par Error Boundary */}
      <BodyTrackingErrorBoundary>
        {renderActiveSection()}
      </BodyTrackingErrorBoundary>
    </div>
  );
};

export default ProgressTab;