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

import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { useNutritionData } from '../../hooks/useNutritionData';
import { useGarminData } from '../../hooks/useGarminData';
import { useNutritionTheme } from '../../hooks/useNutritionTheme';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Calendar, Plus, Target, TrendingUp, BarChart3, Trophy, Share2, Camera, Zap } from 'lucide-react';
import { typography } from '../../styles/typography';
import { registerNutritionServiceWorker } from '../../utils/nutritionServiceWorkerManager';
import { getNutritionConfig } from '../../config/nutrition.config';
import { useTranslation } from '../../utils/translations';

// ✅ OPTIMISATION Phase 11.1 : Lazy loading sections (réduction bundle initial 30-40%)
const NutritionJournal = lazy(() => import('./nutrition/components/NutritionJournal'));
const NutritionPrograms = lazy(() => import('./nutrition/components/NutritionPrograms'));
const NutritionAnalyses = lazy(() => import('./nutrition/components/NutritionAnalyses'));
const NutritionGamification = lazy(() => import('./nutrition/components/NutritionGamification'));
const NutritionSharing = lazy(() => import('./nutrition/components/NutritionSharing'));
const NutritionProgressPhotos = lazy(() => import('./nutrition/components/NutritionProgressPhotos'));
const NutritionDailyChallenges = lazy(() => import('./nutrition/components/NutritionDailyChallenges'));

// Import skeleton loader
import SectionSkeleton from './nutrition/components/SectionSkeleton';

const NutritionTab = () => {
  const [activeSection, setActiveSection] = useState('journal'); // 'journal' | 'programs' | 'analyses' | 'gamification' | 'challenges' | 'sharing' | 'progress'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const nutritionData = useNutritionData();
  const garminData = useGarminData();
  const t = useTranslation();

  // Émettre un événement lors du changement de section pour la rotation des images de profil
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('tab-change', { 
      detail: { tab: activeSection, isSubTab: true } 
    }));
  }, [activeSection]);

  // ✅ OPTIMISATION Phase 15.1 : Configuration pour préservation état sections
  const config = useMemo(() => getNutritionConfig(), []);
  const preserveSectionState = config.performance.preserveSectionState ?? true;
  const maxMountedSections = config.performance.maxMountedSections ?? 7;

  // ✅ OPTIMISATION Phase 15.1 : Set pour tracker sections montées (préserve état)
  // Utilise un Set pour O(1) lookup et insertion
  const [mountedSections, setMountedSections] = useState(() => {
    // Initialiser avec section active au démarrage
    return new Set(['journal']);
  });

  // ✅ OPTIMISATION Phase 15.1 : Ajouter section aux montées quand visitée
  useEffect(() => {
    if (!preserveSectionState) return; // Si désactivé, ne rien faire

    setMountedSections(prev => {
      const next = new Set(prev);
      
      // Ajouter section active si pas déjà montée
      if (!next.has(activeSection)) {
        // ✅ OPTIMISATION Phase 15.1 : LRU-like eviction si trop de sections montées
        if (next.size >= maxMountedSections) {
          // Retirer la première section (FIFO) - on pourrait améliorer avec vrai LRU
          const firstSection = next.values().next().value;
          next.delete(firstSection);
        }
        next.add(activeSection);
      }
      
      return next;
    });
  }, [activeSection, preserveSectionState, maxMountedSections]);

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

  // Navigation entre sections
  const sections = useMemo(() => [
    { id: 'journal', label: t('nutrition.sections.journal'), icon: Calendar },
    { id: 'programs', label: t('nutrition.sections.programs'), icon: Target },
    { id: 'analyses', label: t('nutrition.sections.analyses'), icon: BarChart3 },
    { id: 'gamification', label: t('nutrition.sections.gamification'), icon: Trophy },
    { id: 'challenges', label: t('nutrition.sections.challenges'), icon: Zap },
    { id: 'progress', label: t('nutrition.sections.progress'), icon: Camera },
    { id: 'sharing', label: t('nutrition.sections.sharing'), icon: Share2 }
  ], [t]);

  // ✅ OPTIMISATION Phase 15.1 : Helper pour rendre section avec préservation état
  const renderSection = useCallback((sectionId, Component, props = {}, skeletonLabel) => {
    const isActive = activeSection === sectionId;
    const isMounted = preserveSectionState && mountedSections.has(sectionId);
    const shouldRender = isActive || isMounted;

    if (!shouldRender) return null;

    const sectionContent = (
      <Suspense fallback={<SectionSkeleton label={skeletonLabel} />}>
        <Component key={sectionId} {...props} isVisible={isActive} />
      </Suspense>
    );

    // Si préservation état activée et section montée, wrapper dans div cachée
    if (preserveSectionState && isMounted) {
      return (
        <div
          key={`${sectionId}-wrapper`}
          style={{ display: isActive ? 'block' : 'none' }}
          aria-hidden={!isActive}
        >
          {sectionContent}
        </div>
      );
    }

    // Sinon, rendre directement (comportement classique)
    return sectionContent;
  }, [activeSection, preserveSectionState, mountedSections]);

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
    <div className="relative min-h-screen">
      {/* Contenu avec z-index relatif */}
      <div className="relative z-10 space-y-6 p-6">
        {/* En-tête */}
        <div className="mb-8">
        <h1 className={`${typography.presets.h1} text-white mb-2 flex items-center gap-3`}>
          <span className="text-5xl">🥗</span>
          {t('nutrition.title')}
        </h1>
        <p className={`${typography.presets.bodyLarge} text-slate-400`}>
          {t('nutrition.subtitle')}
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

      {/* Contenu sections */}
      <div className="mt-6">
        {/* ✅ OPTIMISATION Phase 15.1 : Rendus conditionnels optimisés */}
        {/* Garder sections montées mais cachées pour préserver état */}
        
        {renderSection(
          'journal',
          NutritionJournal,
          {
            selectedDate,
            onDateChange: setSelectedDate,
            nutritionData,
            garminData
          },
          t('nutrition.skeletons.journal')
        )}
        
        {renderSection(
          'programs',
          NutritionPrograms,
          { nutritionData },
          t('nutrition.skeletons.programs')
        )}
        
        {renderSection(
          'analyses',
          NutritionAnalyses,
          { nutritionData, garminData },
          t('nutrition.skeletons.analyses')
        )}
        
        {renderSection(
          'gamification',
          NutritionGamification,
          {},
          t('nutrition.skeletons.gamification')
        )}
        
        {renderSection(
          'challenges',
          NutritionDailyChallenges,
          {},
          t('nutrition.skeletons.challenges')
        )}
        
        {renderSection(
          'progress',
          NutritionProgressPhotos,
          {},
          t('nutrition.skeletons.progress')
        )}
        
        {renderSection(
          'sharing',
          NutritionSharing,
          {},
          t('nutrition.skeletons.sharing')
        )}
      </div>
      </div>
    </div>
  );
};

export default NutritionTab;
