import React, { useMemo } from 'react';
import { useBudget } from '../../../hooks/useBudget';
import { gamificationEngine } from '../../../services/finance/gamificationEngine';

const Achievements = ({ budget, depenses }) => {
  const { depensesPlanifiees } = useBudget();

  const achievements = useMemo(() => {
    if (!budget || !depenses) return [];

    const unlocked = [];

    // "Premier mois équilibré"
    const moisActuel = new Date().toISOString().slice(0, 7);
    const score = gamificationEngine.calculateScore(budget, depenses, moisActuel);
    if (score.global >= 100) {
      unlocked.push({
        id: 'premier_mois_equilibre',
        name: 'Premier mois équilibré',
        description: 'Budget respecté à 100%',
        icon: '✅',
        unlocked: true,
        unlockedAt: new Date()
      });
    }

    // "Économe"
    const economies = gamificationEngine.calculateEconomies(budget, depenses, moisActuel);
    if (economies >= 50) {
      unlocked.push({
        id: 'econome',
        name: 'Économe',
        description: `${Math.round(economies)}€ économisés vs budget`,
        icon: '💰',
        unlocked: true
      });
    }

    // "Planificateur"
    const depensesPlanifieesCount = depensesPlanifiees.filter(d => 
      d.statut === 'planifie' || d.statut === 'confirme'
    ).length;
    if (depensesPlanifieesCount >= 10) {
      unlocked.push({
        id: 'planificateur',
        name: 'Planificateur',
        description: '10 dépenses anticipées correctement',
        icon: '📅',
        unlocked: true
      });
    }

    // "Marathonien" - 3 mois consécutifs sans dépassement
    let moisConsecutifs = 0;
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const moisKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const scoreMois = gamificationEngine.calculateScore(budget, depenses, moisKey);
      if (scoreMois.global >= 80) {
        moisConsecutifs++;
      } else {
        break;
      }
    }
    if (moisConsecutifs >= 3) {
      unlocked.push({
        id: 'marathonien',
        name: 'Marathonien',
        description: `${moisConsecutifs} mois consécutifs sans dépassement`,
        icon: '🏃',
        unlocked: true
      });
    }

    // "Discipliné" - Score discipline > 90
    if (score.dimensions.discipline >= 90) {
      unlocked.push({
        id: 'discipline',
        name: 'Discipliné',
        description: 'Score discipline excellent',
        icon: '🎯',
        unlocked: true
      });
    }

    // "Optimisateur" - Économies significatives
    if (economies >= 100) {
      unlocked.push({
        id: 'optimisateur',
        name: 'Optimisateur',
        description: `${Math.round(economies)}€ économisés`,
        icon: '✨',
        unlocked: true
      });
    }

    return unlocked;
  }, [budget, depenses, depensesPlanifiees]);

  if (achievements.length === 0) {
    return (
      <div className="achievements bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h5 className="text-md font-semibold text-white mb-4">Achievements</h5>
        <div className="text-center py-8 text-slate-400">
          Aucun achievement débloqué pour le moment
        </div>
      </div>
    );
  }

  return (
    <div className="achievements bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
      <h5 className="text-md font-semibold text-white mb-4">
        Achievements ({achievements.length})
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map(achievement => (
          <div
            key={achievement.id}
            className="bg-green-900/20 border border-green-500/50 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{achievement.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-green-300 mb-1">
                  {achievement.name}
                </div>
                <div className="text-sm text-slate-400">
                  {achievement.description}
                </div>
                {achievement.unlockedAt && (
                  <div className="text-xs text-slate-500 mt-1">
                    Débloqué le {new Date(achievement.unlockedAt).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Achievements;

