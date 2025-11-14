/**
 * NutritionTab - Onglet Nutrition
 * 
 * Composant principal pour la gestion de la nutrition.
 * Structure modulaire avec sections :
 * - Journal Nutritionnel (saisie rapide, totaux, liste repas)
 * - Programmes Nutritionnels (CRUD, activation, conformité)
 * - Analyses Avancées (programme vs réalité, bilan calorique, tendances)
 * 
 * @module components/tabs/NutritionTab
 * @see ../../../nouvelongletnutritionplan.md
 */

import React, { useState, useEffect } from 'react';
import { useNutritionData } from '../../hooks/useNutritionData';
import { useGarminData } from '../../hooks/useGarminData';
import { useNutritionTheme } from '../../hooks/useNutritionTheme';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Calendar, Plus, Target, TrendingUp, BarChart3, Trophy, Share2, Camera } from 'lucide-react';
import { typography } from '../../styles/typography';
import NutritionJournal from './nutrition/components/NutritionJournal';
import NutritionPrograms from './nutrition/components/NutritionPrograms';
import NutritionAnalyses from './nutrition/components/NutritionAnalyses';
import NutritionGamification from './nutrition/components/NutritionGamification';
import NutritionSharing from './nutrition/components/NutritionSharing';
import NutritionProgressPhotos from './nutrition/components/NutritionProgressPhotos';
import { registerNutritionServiceWorker } from '../../utils/nutritionServiceWorkerManager';

const NutritionTab = () => {
  const [activeSection, setActiveSection] = useState('journal'); // 'journal' | 'programs' | 'analyses' | 'gamification' | 'sharing' | 'progress'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const nutritionData = useNutritionData();
  const garminData = useGarminData();

  // Thème dynamique (activé automatiquement)
  const {
    theme: dynamicTheme,
    loading: themeLoading,
    enabled: themeEnabled
  } = useNutritionTheme({
    enabled: true,
    autoApply: true,
    animate: true,
    updateInterval: 5 * 60 * 1000 // 5 minutes
  });

  // Format date pour affichage
  const formatDateDisplay = (date) => {
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Navigation entre sections
  const sections = [
    { id: 'journal', label: 'Journal', icon: Calendar },
    { id: 'programs', label: 'Programmes', icon: Target },
    { id: 'analyses', label: 'Analyses', icon: BarChart3 },
    { id: 'gamification', label: 'Gamification', icon: Trophy },
    { id: 'progress', label: 'Progression', icon: Camera },
    { id: 'sharing', label: 'Partage', icon: Share2 }
  ];

  // Enregistrer Service Worker pour cache API offline (après 2s, non bloquant)
  useEffect(() => {
    const timer = setTimeout(() => {
      registerNutritionServiceWorker().catch(err => {
        console.warn('[NutritionTab] Erreur enregistrement Service Worker (non bloquant):', err);
      });
    }, 2000); // Délai pour ne pas bloquer le rendu initial

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className={`${typography.presets.h1} text-white mb-2 flex items-center gap-3`}>
          <span className="text-5xl">🥗</span>
          Nutrition
        </h1>
        <p className={`${typography.presets.bodyLarge} text-slate-400`}>
          Suivez votre alimentation, créez des programmes nutritionnels et analysez vos habitudes
        </p>
      </div>

      {/* Navigation sections */}
      <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-xl rounded-xl p-2 border border-slate-700/50">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <Button
              key={section.id}
              variant={isActive ? 'default' : 'ghost'}
              onClick={() => setActiveSection(section.id)}
              className={`flex-1 flex items-center justify-center gap-2 transition-all ${
                isActive 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon size={18} />
              <span>{section.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Contenu section active */}
      <div className="mt-6">
        {activeSection === 'journal' && (
          <NutritionJournal
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            nutritionData={nutritionData}
            garminData={garminData}
          />
        )}
        
        {activeSection === 'programs' && (
          <NutritionPrograms
            nutritionData={nutritionData}
          />
        )}
        
        {activeSection === 'analyses' && (
          <NutritionAnalyses
            nutritionData={nutritionData}
            garminData={garminData}
          />
        )}
        
        {activeSection === 'gamification' && (
          <NutritionGamification />
        )}
        
        {activeSection === 'progress' && (
          <NutritionProgressPhotos />
        )}
        
        {activeSection === 'sharing' && (
          <NutritionSharing />
        )}
      </div>
    </div>
  );
};

export default NutritionTab;
