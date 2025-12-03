import React, { useState, useMemo } from 'react';
import { useTranslation } from '../../../utils/translations';
import { usePlanificateur } from '../../../hooks/usePlanificateur';
import { useToast } from '../../ui/Toast/ToastProvider';
import StatutsVisuels from './StatutsVisuels';

/**
 * Liste des achats loisirs avec filtres et tri
 */
const AchatsLoisirsList = ({ achats, budgetMensuel, onEdit }) => {
  const t = useTranslation();
  const { deleteAchatLoisir } = usePlanificateur();
  const { showToast } = useToast();

  const [filters, setFilters] = useState({
    statut: 'all',
    priorite: 'all',
    mois: 'all'
  });
  const [sortBy, setSortBy] = useState('date'); // date, prix, priorite

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Filtrer et trier
  const filteredAndSorted = useMemo(() => {
    let filtered = [...achats];

    // Filtres
    if (filters.statut !== 'all') {
      filtered = filtered.filter(a => a.statut === filters.statut);
    }
    if (filters.priorite !== 'all') {
      filtered = filtered.filter(a => a.priorite === filters.priorite);
    }
    if (filters.mois !== 'all') {
      filtered = filtered.filter(a => a.moisCible === filters.mois);
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'prix':
          return (b.prix || 0) - (a.prix || 0);
        case 'priorite':
          const priorityOrder = { urgent: 0, normal: 1, 'peut-attendre': 2 };
          return (priorityOrder[a.priorite] || 1) - (priorityOrder[b.priorite] || 1);
        case 'date':
        default:
          const dateA = new Date(a.moisCible || a.createdAt);
          const dateB = new Date(b.moisCible || b.createdAt);
          return dateA - dateB;
      }
    });

    return filtered;
  }, [achats, filters, sortBy]);

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet achat ?')) {
      try {
        await deleteAchatLoisir(id);
        showToast('Achat supprimé', 'success');
      } catch (error) {
        showToast('Erreur lors de la suppression', 'error');
      }
    }
  };

  // Obtenir mois uniques pour filtre
  const uniqueMonths = useMemo(() => {
    const months = new Set();
    achats.forEach(a => {
      if (a.moisCible) months.add(a.moisCible);
    });
    return Array.from(months).sort();
  }, [achats]);

  if (achats.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-12 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <p className="text-lg text-slate-400 mb-2">Aucun achat planifié</p>
        <p className="text-sm text-slate-500">Commencez par ajouter un achat</p>
      </div>
    );
  }

  return (
    <div className="achats-loisirs-list space-y-4">
      {/* Filtres et Tri */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Statut</label>
            <select
              value={filters.statut}
              onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            >
              <option value="all">Tous</option>
              <option value="planifie">Planifié</option>
              <option value="a-venir">À venir</option>
              <option value="realise">Réalisé</option>
              <option value="depassement">Dépassement</option>
              <option value="annule">Annulé</option>
              <option value="reporte">Reporté</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Priorité</label>
            <select
              value={filters.priorite}
              onChange={(e) => setFilters({ ...filters, priorite: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            >
              <option value="all">Toutes</option>
              <option value="urgent">Urgent</option>
              <option value="normal">Normal</option>
              <option value="peut-attendre">Peut attendre</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Mois</label>
            <select
              value={filters.mois}
              onChange={(e) => setFilters({ ...filters, mois: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            >
              <option value="all">Tous</option>
              {uniqueMonths.map(month => (
                <option key={month} value={month}>
                  {new Date(month + '-01').toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Trier par</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            >
              <option value="date">Date</option>
              <option value="prix">Prix</option>
              <option value="priorite">Priorité</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste Achats */}
      <div className="space-y-3">
        {filteredAndSorted.map((achat) => (
          <div
            key={achat.id}
            className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:bg-slate-700/70 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {achat.photo && (
                    <img
                      src={achat.photo}
                      alt={achat.nom}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-lg font-semibold text-white">{achat.nom}</h4>
                      <StatutsVisuels statut={achat.statut} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>{formatCurrency(achat.prix || 0)}</span>
                      <span>•</span>
                      <span>
                        {achat.moisCible
                          ? new Date(achat.moisCible + '-01').toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
                          : 'Non défini'}
                      </span>
                      <span>•</span>
                      <span className={`capitalize ${
                        achat.priorite === 'urgent' ? 'text-red-400' :
                        achat.priorite === 'normal' ? 'text-yellow-400' : 'text-slate-400'
                      }`}>
                        {achat.priorite}
                      </span>
                    </div>
                    {achat.faisabilite && (
                      <div className="mt-2 text-xs">
                        {achat.faisabilite.possible ? (
                          <span className="text-green-400">✅ Budget suffisant</span>
                        ) : (
                          <span className="text-red-400">
                            ❌ Manque {formatCurrency(achat.faisabilite.manque || 0)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {achat.notes && (
                  <p className="text-sm text-slate-400 mt-2">{achat.notes}</p>
                )}
                {achat.lien && (
                  <a
                    href={achat.lien}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 mt-2 inline-block"
                  >
                    🔗 Voir le produit
                  </a>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => onEdit(achat)}
                  className="px-3 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded text-sm transition-colors"
                >
                  ✏️ Modifier
                </button>
                <button
                  onClick={() => handleDelete(achat.id)}
                  className="px-3 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded text-sm transition-colors"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSorted.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          Aucun achat ne correspond aux filtres sélectionnés
        </div>
      )}
    </div>
  );
};

export default AchatsLoisirsList;

