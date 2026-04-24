/**
 * Dashboard Tab - Onglet principal Dashboard
 * Vue d'ensemble avec modules essentiels : Surveillance, Rythme lecture, Actualités financières
 */

import { useCallback, useRef } from 'react';
import { LayoutDashboard, RefreshCw, AlertTriangle } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import NewsBlock from '../dashboard/NewsBlock';
import GlobalXPBar from '../dashboard/GlobalXPBar';
import DashboardCombinedActivityCalendar from '../dashboard/DashboardCombinedActivityCalendar';
import DashboardMomentumBlock from '../dashboard/DashboardMomentumBlock';
import DashboardQuestsModule from '../dashboard/DashboardQuestsModule';
import DashboardGarminSportRecapBlock from '../dashboard/DashboardGarminSportRecapBlock';
import DashboardBooksModule from '../dashboard/DashboardBooksModule';
import DashboardFinanceModule from '../dashboard/DashboardFinanceModule';
import DashboardLearningModule from '../dashboard/DashboardLearningModule';
import DashboardGitHubCodeModule from '../dashboard/DashboardGitHubCodeModule';

const DashboardTab = () => {
  const {
    loading,
    error,
    newsData,
    refreshAll,
    refreshNews
  } = useDashboard();
  const xpRef = useRef(null);
  const combinedCalRef = useRef(null);
  const momentumRef = useRef(null);
  const questsRef = useRef(null);
  const sportRef = useRef(null);
  const booksRef = useRef(null);
  const financeRef = useRef(null);
  const learningRef = useRef(null);
  const newsRef = useRef(null);
  const codeRef = useRef(null);

  const scrollToRef = useCallback((ref) => {
    if (!ref?.current) return;
    ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleXpCategoryClick = useCallback(
    (categoryKey) => {
      switch (categoryKey) {
        case 'quests':
          scrollToRef(questsRef);
          break;
        case 'learning':
          scrollToRef(learningRef);
          break;
        case 'nutrition':
          scrollToRef(momentumRef);
          break;
        case 'books':
          scrollToRef(booksRef);
          break;
        case 'sport':
          scrollToRef(sportRef);
          break;
        case 'addictionQuit':
          // Exception demandée: Arrêt addiction est dans "Vue du jour".
          scrollToRef(momentumRef);
          break;
        case 'code':
          scrollToRef(codeRef);
          break;
        default:
          scrollToRef(xpRef);
      }
    },
    [scrollToRef],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-slate-400">Chargement du Dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <div className="text-red-400 mb-4">Erreur: {error}</div>
          <button
            onClick={refreshNews}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Contenu avec z-index relatif */}
      <div className="relative z-10 dashboard-tab min-h-[calc(100vh-140px)]">
        <div className="max-w-[2400px] mx-auto p-4 md:p-6 space-y-6">
          {/* Header — palette alignée sur l’horloge sidebar (.time-date-block / .time-main / .date-main) */}
          <div
            className="relative overflow-hidden rounded-2xl border-2 border-[#ffd700]/55 p-6 shadow-[0_0_40px_rgba(255,215,0,0.35),0_4px_15px_rgba(255,215,0,0.18),inset_0_0_20px_rgba(255,215,0,0.08)]"
            style={{
              background:
                'linear-gradient(135deg, rgba(255, 20, 147, 0.18) 0%, rgba(255, 140, 0, 0.12) 50%, rgba(255, 215, 0, 0.18) 100%)',
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 animate-pulse opacity-90"
              style={{
                background: 'linear-gradient(90deg, rgba(255, 20, 147, 0.12) 0%, rgba(255, 140, 0, 0.1) 50%, rgba(255, 215, 0, 0.12) 100%)',
              }}
            />
            <div className="relative flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
                  <div
                    className="rounded-xl border-2 border-[#ffd700]/50 p-2"
                    style={{ background: 'rgba(255, 20, 147, 0.2)' }}
                  >
                    <LayoutDashboard className="h-7 w-7 text-[#ffd700]" />
                  </div>
                  Dashboard Global
                </h1>
                <div className="text-slate-200 text-sm flex items-center gap-2 flex-wrap">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff1493] shadow-[0_0_8px_rgba(255,20,147,0.8)]" />
                  <button type="button" onClick={() => scrollToRef(xpRef)} className="h-7 rounded-md border border-[#ffd700]/35 bg-black/25 px-2.5 text-slate-100 transition-colors hover:border-[#ff8c00]/55 hover:bg-[rgba(255,20,147,0.12)] hover:text-white">XP</button>
                  <button type="button" onClick={() => scrollToRef(combinedCalRef)} className="h-7 rounded-md border border-[#ffd700]/35 bg-black/25 px-2.5 text-slate-100 transition-colors hover:border-[#ff8c00]/55 hover:bg-[rgba(255,20,147,0.12)] hover:text-white">Cal. fusion</button>
                  <button type="button" onClick={() => scrollToRef(momentumRef)} className="h-7 rounded-md border border-[#ffd700]/35 bg-black/25 px-2.5 text-slate-100 transition-colors hover:border-[#ff8c00]/55 hover:bg-[rgba(255,20,147,0.12)] hover:text-white">Vue du jour</button>
                  <button type="button" onClick={() => scrollToRef(codeRef)} className="h-7 rounded-md border border-[#ffd700]/35 bg-black/25 px-2.5 text-slate-100 transition-colors hover:border-[#ff8c00]/55 hover:bg-[rgba(255,20,147,0.12)] hover:text-white">Code</button>
                  <button type="button" onClick={() => scrollToRef(questsRef)} className="h-7 rounded-md border border-[#ffd700]/35 bg-black/25 px-2.5 text-slate-100 transition-colors hover:border-[#ff8c00]/55 hover:bg-[rgba(255,20,147,0.12)] hover:text-white">Quêtes</button>
                  <button type="button" onClick={() => scrollToRef(sportRef)} className="h-7 rounded-md border border-[#ffd700]/35 bg-black/25 px-2.5 text-slate-100 transition-colors hover:border-[#ff8c00]/55 hover:bg-[rgba(255,20,147,0.12)] hover:text-white">Sport</button>
                  <button type="button" onClick={() => scrollToRef(booksRef)} className="h-7 rounded-md border border-[#ffd700]/35 bg-black/25 px-2.5 text-slate-100 transition-colors hover:border-[#ff8c00]/55 hover:bg-[rgba(255,20,147,0.12)] hover:text-white">Livres</button>
                  <button type="button" onClick={() => scrollToRef(financeRef)} className="h-7 rounded-md border border-[#ffd700]/35 bg-black/25 px-2.5 text-slate-100 transition-colors hover:border-[#ff8c00]/55 hover:bg-[rgba(255,20,147,0.12)] hover:text-white">Finance</button>
                  <button type="button" onClick={() => scrollToRef(learningRef)} className="h-7 rounded-md border border-[#ffd700]/35 bg-black/25 px-2.5 text-slate-100 transition-colors hover:border-[#ff8c00]/55 hover:bg-[rgba(255,20,147,0.12)] hover:text-white">Apprentissage</button>
                  <button type="button" onClick={() => scrollToRef(newsRef)} className="h-7 rounded-md border border-[#ffd700]/35 bg-black/25 px-2.5 text-slate-100 transition-colors hover:border-[#ff8c00]/55 hover:bg-[rgba(255,20,147,0.12)] hover:text-white">Actualité</button>
                </div>
              </div>
              <button
                onClick={refreshNews}
                className="group transform rounded-xl bg-gradient-to-r from-[#ff1493] via-[#ff8c00] to-[#ffd700] px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-[#ff69b4] hover:via-[#ffa040] hover:to-[#ffe44d] hover:shadow-[0_0_24px_rgba(255,215,0,0.45)]"
                aria-label="Rafraîchir les actualités"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                  Rafraîchir
                </span>
              </button>
            </div>
          </div>

          {/* Module du Dashboard */}
          <div className="space-y-6">
            {/* Barre XP Globale */}
            <div ref={xpRef} className="scroll-mt-24">
              <GlobalXPBar onCategoryClick={handleXpCategoryClick} />
            </div>

            <div ref={combinedCalRef} className="scroll-mt-24">
              <DashboardCombinedActivityCalendar />
            </div>

            <div ref={momentumRef} className="scroll-mt-24">
              <DashboardMomentumBlock />
            </div>

            <div ref={codeRef} className="scroll-mt-24">
              <DashboardGitHubCodeModule />
            </div>

            {/* Module Quêtes (au-dessus du Sport) */}
            <div ref={questsRef} className="scroll-mt-24">
              <DashboardQuestsModule />
            </div>

            {/* Récap Sport & Garmin (entre XP et News) */}
            <div ref={sportRef} className="scroll-mt-24">
              <DashboardGarminSportRecapBlock />
            </div>

            {/* Module Livres 3D (sous Sport) */}
            <div ref={booksRef} className="scroll-mt-24">
              <DashboardBooksModule />
            </div>

            {/* Module Finance (au-dessus des News) */}
            <div ref={financeRef} className="scroll-mt-24">
              <DashboardFinanceModule />
            </div>

            {/* Module Apprentissage (sous Finance) */}
            <div ref={learningRef} className="scroll-mt-24">
              <DashboardLearningModule />
            </div>
            
            {/* News - Full width */}
            <div ref={newsRef} className="scroll-mt-24">
              <NewsBlock newsData={newsData} onRefresh={refreshNews} />
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                <span>Dashboard: <span className="text-white font-semibold">9 modules actifs</span></span>
              </div>
              <div className="text-slate-500 text-xs">
                Version: 4.0.0 ✅
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
