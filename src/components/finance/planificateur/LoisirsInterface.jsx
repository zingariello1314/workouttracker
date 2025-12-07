/**
 * Interface avancée pour la planification loisirs
 * Drag & drop, timeline interactive, visualisation enrichie
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { format, addMonths, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  formatCurrency as formatCurrencyUtil, 
  getStatutColor, 
  getPrioriteColor 
} from '../../../utils/planificateurUtils';

const LoisirsInterface = ({ 
  achats, 
  budgetMensuel,
  onReorder,
  onEdit,
  onDelete,
  formatCurrency = formatCurrencyUtil // Utiliser util par défaut
}) => {
  const [viewMode, setViewMode] = useState('timeline'); // timeline, grid
  const [filterStatut, setFilterStatut] = useState('all');
  const [filterPriorite, setFilterPriorite] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // date, prix, priorite
  const [hoveredAchat, setHoveredAchat] = useState(null);

  // Filtrage et tri optimisé en une seule passe
  const filteredAchats = useMemo(() => {
    if (!achats.length) return [];
    
    return achats
      .filter(a => {
        if (filterStatut !== 'all' && a.statut !== filterStatut) return false;
        if (filterPriorite !== 'all' && a.priorite !== filterPriorite) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(a.moisCible) - new Date(b.moisCible);
          case 'prix':
            return b.prix - a.prix;
          case 'priorite':
            const prioriteOrder = { 'urgent': 0, 'normal': 1, 'peut-attendre': 2 };
            return prioriteOrder[a.priorite] - prioriteOrder[b.priorite];
          default:
            return 0;
        }
      });
  }, [achats, filterStatut, filterPriorite, sortBy]);

  // Calcul budget cumulé par mois
  const budgetTimeline = useMemo(() => {
    const now = new Date();
    const timeline = [];
    
    for (let i = 0; i < 36; i++) {
      const mois = addMonths(now, i);
      const moisKey = format(mois, 'yyyy-MM');
      const budgetCumule = budgetMensuel * (i + 1);
      
      // Achats prévus ce mois
      const achatsCeMois = achats.filter(a => a.moisCible === moisKey);
      
      timeline.push({
        mois: moisKey,
        date: mois,
        budgetCumule,
        achats: achatsCeMois,
        totalAchats: achatsCeMois.reduce((sum, a) => sum + a.prix, 0)
      });
    }
    
    return timeline;
  }, [achats, budgetMensuel]);

  // Statistiques
  const stats = useMemo(() => {
    const total = achats.length;
    const planifies = achats.filter(a => a.statut === 'planifie').length;
    const realises = achats.filter(a => a.statut === 'realise').length;
    const totalPrix = achats.reduce((sum, a) => sum + a.prix, 0);
    const totalRealise = achats.filter(a => a.statut === 'realise').reduce((sum, a) => sum + (a.montantReel || a.prix), 0);

    return {
      total,
      planifies,
      realises,
      tauxRealisation: total > 0 ? (realises / total) * 100 : 0,
      totalPrix,
      totalRealise,
      economie: totalPrix - totalRealise
    };
  }, [achats]);



  // Rendu Timeline
  const renderTimeline = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="text-sm text-slate-400">
          Budget mensuel: <span className="text-white font-semibold">{formatCurrency(budgetMensuel)}</span>
        </div>
        <div className="text-sm text-slate-400">
          Achats planifiés: <span className="text-white font-semibold">{filteredAchats.length}</span>
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {budgetTimeline.slice(0, 12).map((mois, index) => {
          const isCurrentMonth = index === 0;
          const hasBudget = mois.budgetCumule >= mois.totalAchats;

          return (
            <motion.div
              key={mois.mois}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-lg border-2 transition-all ${
                isCurrentMonth 
                  ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500' 
                  : 'bg-slate-800/50 border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-lg font-semibold text-white">
                    {format(mois.date, 'MMMM yyyy', { locale: fr })}
                  </div>
                  {isCurrentMonth && (
                    <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                      Mois actuel
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400">Budget cumulé</div>
                  <div className={`text-lg font-bold ${hasBudget ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(mois.budgetCumule)}
                  </div>
                </div>
              </div>

              {mois.achats.length > 0 && (
                <div className="space-y-2">
                  {mois.achats.map((achat) => {
                    const statutColor = getStatutColor(achat.statut);
                    const prioriteColor = getPrioriteColor(achat.priorite);

                    return (
                      <motion.div
                        key={achat.id}
                        whileHover={{ scale: 1.02, x: 5 }}
                        onMouseEnter={() => setHoveredAchat(achat.id)}
                        onMouseLeave={() => setHoveredAchat(null)}
                        className={`p-3 rounded-lg border ${statutColor.border} ${statutColor.bg} cursor-pointer`}
                        onClick={() => onEdit(achat)}
                      >
                        <div className="flex items-center gap-3">
                          {achat.photo && (
                            <img 
                              src={achat.photo} 
                              alt={achat.nom}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-xs ${prioriteColor.bg} ${prioriteColor.text}`}>
                                {prioriteColor.icon} {achat.priorite}
                              </span>
                              <span className={`text-xs ${statutColor.text}`}>
                                {statutColor.icon} {achat.statut}
                              </span>
                            </div>
                            <div className="text-white font-medium">{achat.nom}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">
                              {formatCurrency(achat.prix)}
                            </div>
                            {achat.faisabilite && (
                              <div className={`text-xs ${achat.faisabilite.possible ? 'text-green-400' : 'text-red-400'}`}>
                                {achat.faisabilite.possible ? '✅ Possible' : '❌ Impossible'}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {mois.achats.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-2">
                  Aucun achat prévu
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  // Rendu Grid
  const renderGrid = () => (
    <Reorder.Group 
      axis="y" 
      values={filteredAchats} 
      onReorder={onReorder}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <AnimatePresence>
        {filteredAchats.map((achat) => {
          const statutColor = getStatutColor(achat.statut);
          const prioriteColor = getPrioriteColor(achat.priorite);

          return (
            <Reorder.Item
              key={achat.id}
              value={achat}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileDrag={{ scale: 1.1, rotate: 5 }}
              className={`p-4 rounded-xl border-2 ${statutColor.border} ${statutColor.bg} cursor-move`}
            >
              <div className="space-y-3">
                {achat.photo && (
                  <img 
                    src={achat.photo} 
                    alt={achat.nom}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                )}
                
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${prioriteColor.bg} ${prioriteColor.text}`}>
                    {prioriteColor.icon} {achat.priorite}
                  </span>
                  <span className={`text-xs ${statutColor.text}`}>
                    {statutColor.icon} {achat.statut}
                  </span>
                </div>

                <div className="text-white font-semibold text-lg">{achat.nom}</div>

                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(achat.prix)}
                  </div>
                  <div className="text-sm text-slate-400">
                    {format(parseISO(achat.moisCible + '-01'), 'MMM yyyy', { locale: fr })}
                  </div>
                </div>

                {achat.faisabilite && (
                  <div className={`text-sm ${achat.faisabilite.possible ? 'text-green-400' : 'text-red-400'}`}>
                    {achat.faisabilite.possible ? '✅ Budget suffisant' : `❌ Manque ${formatCurrency(achat.faisabilite.manque)}`}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(achat)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={() => onDelete(achat.id)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </Reorder.Item>
          );
        })}
      </AnimatePresence>
    </Reorder.Group>
  );

  return (
    <div className="loisirs-interface space-y-6">
      {/* Statistiques */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500 rounded-xl p-4">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-slate-300">Total achats</div>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500 rounded-xl p-4">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold text-white">{stats.tauxRealisation.toFixed(0)}%</div>
          <div className="text-sm text-slate-300">Taux réalisation</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500 rounded-xl p-4">
          <div className="text-3xl mb-2">💰</div>
          <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalPrix)}</div>
          <div className="text-sm text-slate-300">Budget total</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500 rounded-xl p-4">
          <div className="text-3xl mb-2">💎</div>
          <div className="text-2xl font-bold text-white">{formatCurrency(Math.abs(stats.economie))}</div>
          <div className="text-sm text-slate-300">{stats.economie >= 0 ? 'Économie' : 'Dépassement'}</div>
        </div>
      </motion.div>

      {/* Contrôles */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        {/* Mode d'affichage */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Vue:</span>
          <div className="flex gap-1">
            {[
              { mode: 'timeline', icon: '📅', label: 'Timeline' },
              { mode: 'grid', icon: '📦', label: 'Grille' }
            ].map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Statut:</span>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
          >
            <option value="all">Tous</option>
            <option value="planifie">Planifié</option>
            <option value="a-venir">À venir</option>
            <option value="realise">Réalisé</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Priorité:</span>
          <select
            value={filterPriorite}
            onChange={(e) => setFilterPriorite(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
          >
            <option value="all">Toutes</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
            <option value="peut-attendre">Peut attendre</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Trier par:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
          >
            <option value="date">Date</option>
            <option value="prix">Prix</option>
            <option value="priorite">Priorité</option>
          </select>
        </div>
      </div>

      {/* Contenu */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {viewMode === 'timeline' ? renderTimeline() : renderGrid()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LoisirsInterface;
