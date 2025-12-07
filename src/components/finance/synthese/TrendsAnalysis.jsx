/**
 * TrendsAnalysis - Analyse tendances comportementales
 * Détection patterns saisonniers + déviations + recommandations intelligentes
 */

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Lightbulb, Calendar, Target } from 'lucide-react';
import { formatCurrency } from '../../../utils/planificateurUtils';

const TrendsAnalysis = ({ patrimoine, planEpargne, historique }) => {
  // Analyse tendances par actif
  const tendances = useMemo(() => {
    if (!patrimoine) return null;

    const analyzeActif = (actif, objectif, type) => {
      const valorisation = actif?.valorisation || 0;
      const plusValue = actif?.plusValue || 0;
      const plusValuePourcent = actif?.plusValuePourcent || 0;
      
      // Direction
      let direction = 'stable';
      let confiance = 50;
      
      if (plusValuePourcent > 5) {
        direction = 'positive';
        confiance = Math.min(95, 50 + plusValuePourcent * 2);
      } else if (plusValuePourcent < -5) {
        direction = 'negative';
        confiance = Math.min(95, 50 + Math.abs(plusValuePourcent) * 2);
      } else {
        confiance = 70;
      }

      // Écart vs objectif
      const objectifAnnuel = (objectif || 0) * 12;
      const ecartPourcent = objectifAnnuel > 0 
        ? ((valorisation - objectifAnnuel) / objectifAnnuel) * 100 
        : 0;

      return {
        type,
        valorisation,
        plusValue,
        plusValuePourcent,
        direction,
        confiance,
        objectifAnnuel,
        ecartPourcent
      };
    };

    return {
      or: analyzeActif(patrimoine.or, planEpargne?.or?.dca, 'or'),
      bourse: analyzeActif(patrimoine.bourse, planEpargne?.bourse?.dca, 'bourse'),
      cash: analyzeActif(patrimoine.cash, planEpargne?.cash?.dca, 'cash')
    };
  }, [patrimoine, planEpargne]);

  // Détection déviations
  const deviations = useMemo(() => {
    if (!tendances) return [];

    const deviationsList = [];

    Object.entries(tendances).forEach(([type, data]) => {
      if (Math.abs(data.ecartPourcent) > 10) {
        const isRetard = data.ecartPourcent < 0;
        deviationsList.push({
          type,
          ecart: data.ecartPourcent,
          isRetard,
          message: isRetard
            ? `${type.toUpperCase()} en retard de ${Math.abs(data.ecartPourcent).toFixed(1)}% vs objectif annuel`
            : `${type.toUpperCase()} en avance de ${data.ecartPourcent.toFixed(1)}% vs objectif annuel`,
          cause: isRetard
            ? 'Retard dû à des reports d\'achats ou mois difficiles'
            : 'Performance supérieure aux attentes ou DCA augmenté',
          severity: Math.abs(data.ecartPourcent) > 20 ? 'high' : 'medium'
        });
      }
    });

    return deviationsList;
  }, [tendances]);

  // Recommandations intelligentes
  const recommandations = useMemo(() => {
    if (!tendances || !planEpargne) return [];

    const recs = [];

    // Recommandations par actif
    Object.entries(tendances).forEach(([type, data]) => {
      const dcaActuel = planEpargne[type]?.dca || 0;

      // Retard significatif
      if (data.ecartPourcent < -15) {
        recs.push({
          type: 'correction',
          actif: type,
          priority: 'high',
          message: `Rattrapage ${type.toUpperCase()} recommandé`,
          actions: [
            `Augmenter DCA ${type} à ${formatCurrency(dcaActuel * 1.2)}/mois pendant 6 mois`,
            `Utiliser surplus d'autres catégories pour rattrapage`,
            `Reporter objectif de 2-3 mois si nécessaire`
          ]
        });
      }

      // Performance excellente
      if (data.plusValuePourcent > 15) {
        recs.push({
          type: 'optimisation',
          actif: type,
          priority: 'low',
          message: `${type.toUpperCase()} : Excellente performance (+${data.plusValuePourcent.toFixed(1)}%)`,
          actions: [
            `Maintenir stratégie actuelle`,
            `Considérer rééquilibrage si allocation dépasse 40%`,
            `Sécuriser une partie des gains si objectif atteint`
          ]
        });
      }

      // Stagnation
      if (Math.abs(data.plusValuePourcent) < 2 && data.valorisation > 1000) {
        recs.push({
          type: 'attention',
          actif: type,
          priority: 'medium',
          message: `${type.toUpperCase()} : Performance stable (±${Math.abs(data.plusValuePourcent).toFixed(1)}%)`,
          actions: [
            `Vérifier si stratégie correspond aux objectifs`,
            `Analyser contexte marché pour ${type}`,
            `Considérer diversification si concentration élevée`
          ]
        });
      }
    });

    // Recommandation globale allocation
    if (patrimoine?.total?.valorise > 5000) {
      const orPct = ((patrimoine.or?.valorisation || 0) / patrimoine.total.valorise) * 100;
      const boursePct = ((patrimoine.bourse?.valorisation || 0) / patrimoine.total.valorise) * 100;
      const cashPct = ((patrimoine.cash?.valorisation || 0) / patrimoine.total.valorise) * 100;

      if (cashPct > 40) {
        recs.push({
          type: 'reallocation',
          actif: 'global',
          priority: 'medium',
          message: `Cash excédentaire (${cashPct.toFixed(1)}% du patrimoine)`,
          actions: [
            `Réallouer ${formatCurrency((patrimoine.cash.valorisation * 0.2))} vers investissements`,
            `Augmenter DCA Or ou Bourse de ${formatCurrency(100)}/mois`,
            `Garder 3-6 mois de dépenses en cash seulement`
          ]
        });
      }
    }

    return recs.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [tendances, planEpargne, patrimoine]);

  if (!tendances) {
    return (
      <div className="text-center text-slate-400 py-8">
        Aucune donnée disponible pour l'analyse
      </div>
    );
  }

  const getDirectionIcon = (direction) => {
    switch (direction) {
      case 'positive':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'negative':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      default:
        return <Target className="w-5 h-5 text-slate-400" />;
    }
  };

  const getDirectionColor = (direction) => {
    switch (direction) {
      case 'positive':
        return 'text-green-400';
      case 'negative':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-500/10';
      case 'medium':
        return 'border-yellow-500 bg-yellow-500/10';
      default:
        return 'border-blue-500 bg-blue-500/10';
    }
  };

  return (
    <div className="trends-analysis space-y-6">
      {/* Analyse par actif */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          Analyse Tendances par Actif
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(tendances).map(([type, data]) => (
            <div key={type} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-300 uppercase">{type}</span>
                {getDirectionIcon(data.direction)}
              </div>
              
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-slate-400">Direction</div>
                  <div className={`text-sm font-semibold ${getDirectionColor(data.direction)}`}>
                    {data.direction === 'positive' ? 'Positive' : data.direction === 'negative' ? 'Négative' : 'Stable'}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-slate-400">Confiance</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-600 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${data.confiance}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-white">{data.confiance}%</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">Performance</div>
                  <div className={`text-sm font-semibold ${data.plusValuePourcent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {data.plusValuePourcent >= 0 ? '+' : ''}{data.plusValuePourcent.toFixed(2)}%
                  </div>
                </div>

                {data.objectifAnnuel > 0 && (
                  <div>
                    <div className="text-xs text-slate-400">Écart vs Objectif</div>
                    <div className={`text-sm font-semibold ${data.ecartPourcent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {data.ecartPourcent >= 0 ? '+' : ''}{data.ecartPourcent.toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Déviations détectées */}
      {deviations.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            Déviations Détectées
          </h3>
          
          <div className="space-y-3">
            {deviations.map((deviation, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  deviation.severity === 'high' 
                    ? 'border-red-500 bg-red-500/10' 
                    : 'border-yellow-500 bg-yellow-500/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className={`w-5 h-5 mt-0.5 ${
                    deviation.severity === 'high' ? 'text-red-400' : 'text-yellow-400'
                  }`} />
                  <div className="flex-1">
                    <div className={`font-semibold mb-1 ${
                      deviation.severity === 'high' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {deviation.message}
                    </div>
                    <div className="text-sm text-slate-300">
                      <span className="font-medium">Cause probable :</span> {deviation.cause}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommandations intelligentes */}
      {recommandations.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Recommandations Intelligentes
          </h3>
          
          <div className="space-y-4">
            {recommandations.map((rec, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-2 ${getPriorityColor(rec.priority)}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <Lightbulb className="w-5 h-5 mt-0.5 text-yellow-400" />
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">
                      {rec.message}
                    </div>
                    <div className="text-xs text-slate-400 uppercase">
                      Priorité : {rec.priority === 'high' ? 'Haute' : rec.priority === 'medium' ? 'Moyenne' : 'Basse'}
                    </div>
                  </div>
                </div>
                
                <div className="ml-8 space-y-2">
                  <div className="text-sm font-medium text-slate-300">Actions suggérées :</div>
                  <ul className="space-y-1">
                    {rec.actions.map((action, i) => (
                      <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message si tout va bien */}
      {deviations.length === 0 && recommandations.length === 0 && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">✅</div>
          <div className="text-lg font-semibold text-green-400 mb-2">
            Tout est sur la bonne voie !
          </div>
          <div className="text-sm text-slate-400">
            Aucune déviation significative détectée. Continuez votre stratégie actuelle.
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendsAnalysis;
