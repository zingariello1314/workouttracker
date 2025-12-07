/**
 * PlanificateurAnalytics - Analytics et insights du planificateur
 */

import { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award,
  DollarSign,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

const PlanificateurAnalytics = ({ 
  repartition,
  objectifs = [],
  historique = []
}) => {

  // Statistiques générales
  const stats = useMemo(() => {
    const totalObjectifs = objectifs.length;
    const objectifsRealises = objectifs.filter(o => o.workflow?.realisation).length;
    const objectifsAnalyses = objectifs.filter(o => o.workflow?.analyse).length;
    const tauxReussite = totalObjectifs > 0 
      ? ((objectifsRealises / totalObjectifs) * 100).toFixed(1)
      : 0;

    // Calcul écarts moyens
    const objectifsAvecAnalyse = objectifs.filter(o => o.workflow?.analyse);
    const ecartMoyen = objectifsAvecAnalyse.length > 0
      ? objectifsAvecAnalyse.reduce((sum, o) => sum + (o.workflow.analyse.ecart || 0), 0) / objectifsAvecAnalyse.length
      : 0;

    const respecteBudget = objectifsAvecAnalyse.filter(o => o.workflow.analyse.respecteBudget).length;
    const tauxRespect = objectifsAvecAnalyse.length > 0
      ? ((respecteBudget / objectifsAvecAnalyse.length) * 100).toFixed(1)
      : 0;

    return {
      totalObjectifs,
      objectifsRealises,
      objectifsAnalyses,
      tauxReussite,
      ecartMoyen,
      tauxRespect
    };
  }, [objectifs]);

  // Évolution répartition (simulée avec historique)
  const evolutionRepartition = useMemo(() => {
    if (historique.length === 0) {
      // Données simulées pour démonstration
      const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
      return mois.map((mois, index) => ({
        mois,
        loisirs: repartition?.loisirs || 0,
        investissements: (repartition?.investissementOr || 0) + (repartition?.investissementBourse || 0),
        epargne: repartition?.cashAccumulation || 0
      }));
    }
    return historique;
  }, [historique, repartition]);

  // Répartition actuelle pour pie chart
  const repartitionData = useMemo(() => {
    if (!repartition) return [];

    return [
      { name: 'Loyer', value: repartition.loyer || 0, color: '#a855f7' },
      { name: 'Or', value: repartition.investissementOr || 0, color: '#eab308' },
      { name: 'Bourse', value: repartition.investissementBourse || 0, color: '#3b82f6' },
      { name: 'Cash', value: repartition.cashAccumulation || 0, color: '#10b981' },
      { name: 'Loisirs', value: repartition.loisirs || 0, color: '#ec4899' },
      { name: 'Surplus', value: repartition.surplus || 0, color: '#64748b' }
    ].filter(item => item.value > 0);
  }, [repartition]);

  // Performance objectifs par mois
  const performanceParMois = useMemo(() => {
    const moisMap = new Map();

    objectifs.forEach(obj => {
      if (!obj.workflow?.realisation) return;

      const mois = new Date(obj.workflow.realisation).toLocaleDateString('fr-FR', { 
        month: 'short', 
        year: 'numeric' 
      });

      if (!moisMap.has(mois)) {
        moisMap.set(mois, { mois, realises: 0, respectes: 0 });
      }

      const data = moisMap.get(mois);
      data.realises++;
      if (obj.workflow.analyse?.respecteBudget) {
        data.respectes++;
      }
    });

    return Array.from(moisMap.values()).slice(-6); // 6 derniers mois
  }, [objectifs]);

  // Insights intelligents
  const insights = useMemo(() => {
    const insights = [];

    // Insight sur taux de réussite
    if (stats.tauxReussite >= 80) {
      insights.push({
        type: 'success',
        icon: Award,
        title: 'Excellente discipline !',
        message: `${stats.tauxReussite}% de vos objectifs sont réalisés`
      });
    } else if (stats.tauxReussite < 50 && stats.totalObjectifs > 0) {
      insights.push({
        type: 'warning',
        icon: Target,
        title: 'Objectifs à revoir',
        message: `Seulement ${stats.tauxReussite}% réalisés. Ajustez vos prévisions.`
      });
    }

    // Insight sur respect budget
    if (stats.tauxRespect >= 90 && stats.objectifsAnalyses > 0) {
      insights.push({
        type: 'success',
        icon: DollarSign,
        title: 'Budget maîtrisé',
        message: `${stats.tauxRespect}% de vos achats respectent le budget prévu`
      });
    } else if (stats.tauxRespect < 60 && stats.objectifsAnalyses > 3) {
      insights.push({
        type: 'warning',
        icon: TrendingDown,
        title: 'Dépassements fréquents',
        message: `${100 - stats.tauxRespect}% de dépassements. Revoyez vos estimations.`
      });
    }

    // Insight sur écart moyen
    if (Math.abs(stats.ecartMoyen) > 50 && stats.objectifsAnalyses > 0) {
      insights.push({
        type: 'info',
        icon: BarChart3,
        title: 'Écart moyen significatif',
        message: `${stats.ecartMoyen > 0 ? '+' : ''}${stats.ecartMoyen.toFixed(0)}€ en moyenne par achat`
      });
    }

    // Insight sur surplus
    if (repartition?.surplus > 200) {
      insights.push({
        type: 'info',
        icon: TrendingUp,
        title: 'Surplus disponible',
        message: `${repartition.surplus}€ non alloués. Optimisez votre répartition.`
      });
    }

    return insights;
  }, [stats, repartition]);

  return (
    <div className="planificateur-analytics space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart3 size={24} className="text-purple-400" />
        <h3 className="text-xl font-bold text-white">Analytics & Insights</h3>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card bg-blue-900/20 border-2 border-blue-500/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={20} className="text-blue-400" />
            <span className="text-sm text-slate-300">Objectifs</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalObjectifs}</div>
          <div className="text-xs text-slate-400 mt-1">
            {stats.objectifsRealises} réalisés
          </div>
        </div>

        <div className="kpi-card bg-emerald-900/20 border-2 border-emerald-500/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={20} className="text-emerald-400" />
            <span className="text-sm text-slate-300">Taux réussite</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.tauxReussite}%</div>
          <div className="text-xs text-slate-400 mt-1">
            {stats.objectifsRealises}/{stats.totalObjectifs}
          </div>
        </div>

        <div className="kpi-card bg-purple-900/20 border-2 border-purple-500/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={20} className="text-purple-400" />
            <span className="text-sm text-slate-300">Respect budget</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.tauxRespect}%</div>
          <div className="text-xs text-slate-400 mt-1">
            {stats.objectifsAnalyses} analysés
          </div>
        </div>

        <div className="kpi-card bg-yellow-900/20 border-2 border-yellow-500/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={20} className="text-yellow-400" />
            <span className="text-sm text-slate-300">Écart moyen</span>
          </div>
          <div className={`text-3xl font-bold ${stats.ecartMoyen > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {stats.ecartMoyen > 0 ? '+' : ''}{stats.ecartMoyen.toFixed(0)}€
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Prévu vs Réel
          </div>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="insights-section bg-slate-800/50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award size={20} className="text-yellow-400" />
            Insights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight, index) => {
              const Icon = insight.icon;
              const colors = {
                success: 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400',
                warning: 'bg-yellow-900/20 border-yellow-500/50 text-yellow-400',
                info: 'bg-blue-900/20 border-blue-500/50 text-blue-400'
              };

              return (
                <div
                  key={index}
                  className={`insight-card ${colors[insight.type]} border-2 rounded-lg p-3`}
                >
                  <div className="flex items-start gap-3">
                    <Icon size={20} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-white mb-1">{insight.title}</div>
                      <div className="text-sm text-slate-300">{insight.message}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition actuelle */}
        <div className="chart-card bg-slate-800/50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart size={20} className="text-blue-400" />
            Répartition actuelle
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPieChart>
              <Pie
                data={repartitionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {repartitionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => `${value.toLocaleString('fr-FR')}€`}
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569',
                  borderRadius: '8px'
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Performance par mois */}
        {performanceParMois.length > 0 && (
          <div className="chart-card bg-slate-800/50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-emerald-400" />
              Performance mensuelle
            </h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={performanceParMois}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="mois" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #475569',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="realises" fill="#3b82f6" name="Réalisés" />
                <Bar dataKey="respectes" fill="#10b981" name="Budget respecté" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanificateurAnalytics;
