/**
 * Sous-onglet Dashboard - Vue d'ensemble du budget
 */

import React, { useState } from 'react';
import { useTranslation } from '../../../utils/translations';
import { useBudget } from '../../../hooks/useBudget';
import DashboardMetrics from './DashboardMetrics';
import BudgetCharts from './BudgetCharts';
import PredictiveAnalysis from './PredictiveAnalysis';
import DisciplineScore from './DisciplineScore';
import GamificationScore from './GamificationScore';
import LevelSystem from './LevelSystem';
import Achievements from './Achievements';
import AIRecommendations from './AIRecommendations';
import BehavioralMetrics from './BehavioralMetrics';

const DashboardSubTab = () => {
  const t = useTranslation();
  const { budget, categories, depensesMoisActuel } = useBudget();
  const [activeSection, setActiveSection] = useState('overview'); // 'overview', 'gamification', 'ai', 'behavioral'

  // Calcul XP basé sur le score de discipline (simulation)
  const totalXP = 750; // À calculer réellement basé sur l'historique

  return (
    <div className="dashboard-sub-tab space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {t('budget.subTabs.dashboard')}
          </h2>
          <p className="text-slate-400">
            Vue d'ensemble de votre budget personnel
          </p>
        </div>
        
        {/* Navigation sections */}
        <div className="flex gap-2">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
            { id: 'gamification', label: 'Gamification', icon: '🎮' },
            { id: 'ai', label: 'IA', icon: '🤖' },
            { id: 'behavioral', label: 'Comportement', icon: '🧠' }
          ].map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-3 py-1 rounded text-sm transition-all ${
                activeSection === section.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="mr-1">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vue d'ensemble */}
      {activeSection === 'overview' && (
        <>
          <DashboardMetrics />
          <BudgetCharts />
          <PredictiveAnalysis />
          <DisciplineScore />
        </>
      )}

      {/* Gamification */}
      {activeSection === 'gamification' && (
        <>
          <GamificationScore />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LevelSystem totalXP={totalXP} />
            <Achievements />
          </div>
        </>
      )}

      {/* IA */}
      {activeSection === 'ai' && (
        <>
          <AIRecommendations />
        </>
      )}

      {/* Comportemental */}
      {activeSection === 'behavioral' && (
        <>
          <BehavioralMetrics />
        </>
      )}
    </div>
  );
};

export default DashboardSubTab;

