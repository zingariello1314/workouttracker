/**
 * Budget Optimizer - Moteur de suggestions d'économies
 * Algorithmes: Substitutions, Promos, Magasins alternatifs
 */

import { useMemo, useState } from 'react';
import { TrendingDown, Tag, Store, Sparkles, Check, X } from 'lucide-react';
import { formatCurrency } from '../../../utils/planificateurUtils';

const BudgetOptimizer = ({ liste, budget, inventaire, onApplyOptimization }) => {
  const [appliedOptimizations, setAppliedOptimizations] = useState(new Set());

  // ==========================================================================
  // ALGORITHME 1: DÉTECTION SUBSTITUTIONS
  // ==========================================================================

  const findSubstitutions = useMemo(() => {
    if (!liste || !liste.articles) return [];

    const substitutions = [];

    liste.articles.forEach(article => {
      // Simuler alternatives (dans une vraie app, chercher dans DB)
      const alternatives = [
        {
          nom: `${article.nom} (MDD)`,
          prix: article.prixEstime * 0.7, // 30% moins cher
          marque: 'Marque Distributeur',
          confiance: 85
        },
        {
          nom: `${article.nom} (Promo)`,
          prix: article.prixEstime * 0.8, // 20% moins cher
          marque: article.marque?.nom || 'Autre marque',
          confiance: 75
        }
      ].filter(alt => alt.prix < article.prixEstime);

      alternatives.forEach(alt => {
        const economie = (article.prixEstime - alt.prix) * article.quantite;
        if (economie > 0.5) { // Seuil minimum 0.50€
          substitutions.push({
            id: `sub_${article.id}_${alt.nom}`,
            type: 'substitution',
            articleId: article.id,
            articleNom: article.nom,
            description: `Remplacer "${article.nom}" par "${alt.nom}"`,
            economie,
            confiance: alt.confiance,
            details: {
              avant: {
                nom: article.nom,
                prix: article.prixEstime,
                marque: article.marque?.nom
              },
              apres: {
                nom: alt.nom,
                prix: alt.prix,
                marque: alt.marque
              },
              raison: `Économie de ${formatCurrency(economie)} avec qualité similaire`
            }
          });
        }
      });
    });

    return substitutions.sort((a, b) => b.economie - a.economie);
  }, [liste]);

  // ==========================================================================
  // ALGORITHME 2: DÉTECTION PROMOS PERTINENTES
  // ==========================================================================

  const findPromos = useMemo(() => {
    if (!liste || !liste.articles) return [];

    const promos = [];

    // Simuler promos disponibles
    const promosDisponibles = [
      { produit: 'Nutella', reduction: 30, prixPromo: 3.15, magasin: 'Carrefour' },
      { produit: 'Pâtes', reduction: 25, prixPromo: 0.75, magasin: 'Leclerc' },
      { produit: 'Yaourts', reduction: 20, prixPromo: 2.40, magasin: 'Auchan' }
    ];

    liste.articles.forEach(article => {
      const promo = promosDisponibles.find(p => 
        article.nom.toLowerCase().includes(p.produit.toLowerCase())
      );

      if (promo) {
        const economie = (article.prixEstime - promo.prixPromo) * article.quantite;
        
        // Vérifier faisabilité avec inventaire
        let feasibility = { recommande: true, raison: 'Bonne affaire' };
        if (inventaire) {
          const itemInventaire = inventaire.find(i => 
            i.nom.toLowerCase().includes(promo.produit.toLowerCase())
          );
          
          if (itemInventaire) {
            const joursConsommation = itemInventaire.consommationMoyenne * article.quantite;
            const dureeVie = itemInventaire.dureeVie;
            
            if (joursConsommation > dureeVie) {
              feasibility = {
                recommande: false,
                raison: `Risque gaspillage: ${joursConsommation}j consommation vs ${dureeVie}j péremption`
              };
            }
          }
        }

        if (feasibility.recommande && economie > 0.5) {
          promos.push({
            id: `promo_${article.id}_${promo.magasin}`,
            type: 'promo',
            articleId: article.id,
            articleNom: article.nom,
            description: `Promo ${promo.produit} -${promo.reduction}% chez ${promo.magasin}`,
            economie,
            confiance: 95,
            details: {
              avant: {
                prix: article.prixEstime
              },
              apres: {
                prix: promo.prixPromo,
                reduction: promo.reduction,
                magasin: promo.magasin
              },
              raison: feasibility.raison
            }
          });
        }
      }
    });

    return promos.sort((a, b) => b.economie - a.economie);
  }, [liste, inventaire]);

  // ==========================================================================
  // ALGORITHME 3: OPTIMISATION MAGASIN
  // ==========================================================================

  const findMagasinOptimal = useMemo(() => {
    if (!liste || !liste.articles || liste.articles.length === 0) return null;

    const magasins = ['Action', 'Grand Frais', 'Auchan', 'Carrefour', 'Leclerc'];
    
    // Simuler prix par magasin (dans une vraie app, chercher dans DB)
    const comparaisons = magasins.map(magasin => {
      const total = liste.articles.reduce((sum, article) => {
        // Variation aléatoire ±15% pour simulation
        const variation = 0.85 + Math.random() * 0.3;
        const prixMagasin = article.prixEstime * variation;
        return sum + (prixMagasin * article.quantite);
      }, 0);

      return { magasin, total };
    });

    const optimal = comparaisons.sort((a, b) => a.total - b.total)[0];
    const actuel = liste.magasinCible || 'Carrefour';
    const prixActuel = comparaisons.find(c => c.magasin === actuel)?.total || optimal.total;
    const economie = prixActuel - optimal.total;

    if (economie > 5 && optimal.magasin !== actuel) { // Seuil 5€
      return {
        id: `magasin_${optimal.magasin}`,
        type: 'magasin',
        description: `Faire vos courses chez ${optimal.magasin} au lieu de ${actuel}`,
        economie,
        confiance: 85,
        details: {
          avant: {
                magasin: actuel,
            total: prixActuel
          },
          apres: {
            magasin: optimal.magasin,
            total: optimal.total
          },
          raison: `Économie globale de ${formatCurrency(economie)} sur l'ensemble de la liste`,
          comparaisons: comparaisons.map(c => ({
            magasin: c.magasin,
            total: c.total,
            economie: prixActuel - c.total
          })).sort((a, b) => a.total - b.total)
        }
      };
    }

    return null;
  }, [liste]);

  // ==========================================================================
  // TOUTES LES OPTIMISATIONS
  // ==========================================================================

  const allOptimizations = useMemo(() => {
    const optimizations = [
      ...findSubstitutions,
      ...findPromos
    ];

    if (findMagasinOptimal) {
      optimizations.push(findMagasinOptimal);
    }

    return optimizations.sort((a, b) => b.economie - a.economie);
  }, [findSubstitutions, findPromos, findMagasinOptimal]);

  const totalEconomies = useMemo(() => {
    return allOptimizations
      .filter(opt => appliedOptimizations.has(opt.id))
      .reduce((sum, opt) => sum + opt.economie, 0);
  }, [allOptimizations, appliedOptimizations]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleApply = (optimization) => {
    setAppliedOptimizations(prev => new Set([...prev, optimization.id]));
    if (onApplyOptimization) {
      onApplyOptimization(optimization);
    }
  };

  const handleReject = (optimization) => {
    setAppliedOptimizations(prev => {
      const next = new Set(prev);
      next.delete(optimization.id);
      return next;
    });
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (!liste || !liste.articles || liste.articles.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">
        Ajoutez des articles à votre liste pour voir les suggestions d'économies
      </div>
    );
  }

  return (
    <div className="budget-optimizer space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-2xl p-6">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 animate-pulse"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-xl">
                  <Sparkles className="w-6 h-6 text-green-400" />
                </div>
                Optimisations Suggérées
              </h3>
              <p className="text-slate-300 text-sm mt-2">
                {allOptimizations.length} suggestion(s) pour économiser jusqu'à{' '}
                <span className="font-bold text-green-400">
                  {formatCurrency(allOptimizations.reduce((sum, opt) => sum + opt.economie, 0))}
                </span>
              </p>
            </div>
            {totalEconomies > 0 && (
              <div className="text-right">
                <div className="text-sm text-slate-400">Économies appliquées</div>
                <div className="text-3xl font-bold text-green-400">
                  {formatCurrency(totalEconomies)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Optimizations List */}
      {allOptimizations.length === 0 ? (
        <div className="text-center text-slate-400 py-12 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p>Aucune optimisation disponible pour le moment</p>
          <p className="text-sm mt-2">Votre liste est déjà bien optimisée !</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allOptimizations.map((optimization) => {
            const isApplied = appliedOptimizations.has(optimization.id);
            
            return (
              <div
                key={optimization.id}
                className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                  isApplied
                    ? 'bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/50'
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Type Icon */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${
                          optimization.type === 'substitution' ? 'bg-blue-500/20' :
                          optimization.type === 'promo' ? 'bg-orange-500/20' :
                          'bg-purple-500/20'
                        }`}>
                          {optimization.type === 'substitution' && <TrendingDown className="w-5 h-5 text-blue-400" />}
                          {optimization.type === 'promo' && <Tag className="w-5 h-5 text-orange-400" />}
                          {optimization.type === 'magasin' && <Store className="w-5 h-5 text-purple-400" />}
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                            {optimization.type === 'substitution' && 'Substitution'}
                            {optimization.type === 'promo' && 'Promotion'}
                            {optimization.type === 'magasin' && 'Magasin Alternatif'}
                          </div>
                          <div className="text-sm text-white font-medium mt-1">
                            {optimization.description}
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="ml-11 space-y-2">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-slate-400">
                            Économie: <span className="text-green-400 font-bold">
                              {formatCurrency(optimization.economie)}
                            </span>
                          </div>
                          <div className="text-slate-400">
                            Confiance: <span className="text-blue-400 font-semibold">
                              {optimization.confiance}%
                            </span>
                          </div>
                        </div>
                        
                        {optimization.details && (
                          <div className="text-xs text-slate-400 bg-slate-900/50 rounded-lg p-3 mt-2">
                            {optimization.details.raison}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {!isApplied ? (
                        <button
                          onClick={() => handleApply(optimization)}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white rounded-lg transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-green-500/50 hover:scale-105 transform flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Appliquer
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReject(optimization)}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Applied Badge */}
                {isApplied && (
                  <div className="absolute top-4 right-4">
                    <div className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-xs text-green-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Appliquée
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BudgetOptimizer;
