/**
 * Composant Achievements - Système d'achievements avec déblocage automatique
 */

import React, { useMemo } from 'react';
import { useBudget } from '../../../hooks/useBudget';

const Achievements = () => {
  const { budget, categories, depenses } = useBudget();

  const achievements = useMemo(() => {
    if (!budget || !categories || !depenses) return [];

    const unlocked = [];

    // "Premier mois équilibré"
    const depensesTotal = depenses.reduce((sum, d) => sum + (d.montant || 0), 0);
    const revenus = budget.revenus || 0;
    if (revenus > 0 && depensesTotal <= revenus && depensesTotal >= revenus * 0.95) {
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
    const economies = categories.reduce((sum, cat) => {
      const depensesCat = depenses.filter(d => d.categorie === cat.id);
      const totalDepenses = depensesCat.reduce((s, d) => s + (d.montant || 0), 0);
      const budgetCat = cat.budgetMensuel || 0;
      if (totalDepenses < budgetCat) {
        return sum + (budgetCat - totalDepenses);
      }
      return sum;
    }, 0);
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
    const depensesPlanifiees = depenses.filter(d => d.datePlanifiee || d.statut === 'planifie' || d.statut === 'confirme');
    if (depensesPlanifiees.length >= 10) {
      unlocked.push({
        id: 'planificateur',
        name: 'Planificateur',
        description: '10 dépenses anticipées correctement',
        icon: '📅',
        unlocked: true
      });
    }

    // "Marathonien" (simulation - nécessite historique sur plusieurs mois)
    const moisConsecutifs = 1; // À calculer avec historique réel
    if (moisConsecutifs >= 6) {
      unlocked.push({
        id: 'marathonien',
        name: 'Marathonien',
        description: '6 mois consécutifs sans dépassement',
        icon: '🏃',
        unlocked: true
      });
    }

    // "Maître des catégories"
    if (categories.length >= 5) {
      unlocked.push({
        id: 'maitre_categories',
        name: 'Maître des catégories',
        description: '5 catégories ou plus configurées',
        icon: '🏗️',
        unlocked: true
      });
    }

    // "Discipliné"
    const categoriesRespectees = categories.filter(cat => {
      const depensesCat = depenses.filter(d => d.categorie === cat.id);
      const totalDepenses = depensesCat.reduce((sum, d) => sum + (d.montant || 0), 0);
      const budgetCat = cat.budgetMensuel || 0;
      return budgetCat > 0 && (totalDepenses / budgetCat) <= 1;
    });
    if (categoriesRespectees.length === categories.length && categories.length > 0) {
      unlocked.push({
        id: 'disciplined',
        name: 'Discipliné',
        description: 'Toutes les catégories respectées',
        icon: '⭐',
        unlocked: true
      });
    }

    return unlocked;
  }, [budget, categories, depenses]);

  return (
    <div className="achievements bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Achievements</h3>
      
      {achievements.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400 mb-2">Aucun achievement débloqué</p>
          <p className="text-sm text-slate-500">
            Continuez à gérer votre budget pour débloquer des achievements !
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map(achievement => (
            <div
              key={achievement.id}
              className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 hover:border-slate-500 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{achievement.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold text-white mb-1">{achievement.name}</div>
                  <div className="text-sm text-slate-400">{achievement.description}</div>
                  {achievement.unlockedAt && (
                    <div className="text-xs text-slate-500 mt-2">
                      Débloqué le {achievement.unlockedAt.toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
                {achievement.unlocked && (
                  <span className="text-green-400 text-sm">✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Achievements;

