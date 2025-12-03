import React, { useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import moment from 'moment';

const LiquiditesAnalytics = ({ liquidites }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Courbe accumulation pure (target vs réalisation)
  const accumulationData = useMemo(() => {
    if (!liquidites?.progression || liquidites.progression.length === 0) return [];

    const objectifMensuel = liquidites.objectifMensuel || 200;
    let stockCumule = 0;
    const now = new Date();
    const mois = [];

    // Générer données pour 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const moisKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const depensesMois = liquidites.progression
        .filter(entry => {
          const entryDate = new Date(entry.date);
          const entryMois = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
          return entryMois === moisKey;
        })
        .reduce((sum, entry) => sum + (entry.montant || 0), 0);

      stockCumule += depensesMois;
      const target = objectifMensuel * (6 - i);

      mois.push({
        mois: date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' }),
        realisation: stockCumule,
        target: target,
        ecart: stockCumule - target
      });
    }

    return mois;
  }, [liquidites]);

  // Velocity tracking (accélération/ralentissement)
  const velocity = useMemo(() => {
    if (!liquidites?.progression || liquidites.progression.length < 2) return null;

    const sorted = [...liquidites.progression]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-3); // 3 derniers mois

    if (sorted.length < 2) return null;

    const velocities = [];
    for (let i = 1; i < sorted.length; i++) {
      const mois1 = sorted[i - 1];
      const mois2 = sorted[i];
      const date1 = new Date(mois1.date);
      const date2 = new Date(mois2.date);
      const jours = (date2 - date1) / (1000 * 60 * 60 * 24);
      const velocity = (mois2.montant || 0) / jours;
      velocities.push(velocity);
    }

    const avgVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
    const trend = velocities[velocities.length - 1] > velocities[0] ? 'acceleration' : 'deceleration';

    return {
      moyenne: avgVelocity,
      tendance: trend,
      message: trend === 'acceleration' 
        ? 'Accélération détectée' 
        : 'Ralentissement détecté'
    };
  }, [liquidites]);

  // Records personnels
  const records = useMemo(() => {
    if (!liquidites?.progression || liquidites.progression.length === 0) return null;

    const maintenant = new Date();
    const moisActuel = `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}`;
    const anneeActuelle = maintenant.getFullYear();

    // Meilleur mois
    const parMois = {};
    liquidites.progression.forEach(entry => {
      const entryDate = new Date(entry.date);
      const moisKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
      if (!parMois[moisKey]) parMois[moisKey] = 0;
      parMois[moisKey] += entry.montant || 0;
    });

    const meilleurMois = Object.entries(parMois)
      .map(([mois, montant]) => ({ mois, montant }))
      .sort((a, b) => b.montant - a.montant)[0];

    // Meilleur trimestre
    const parTrimestre = {};
    liquidites.progression.forEach(entry => {
      const entryDate = new Date(entry.date);
      const trimestre = Math.floor(entryDate.getMonth() / 3) + 1;
      const trimestreKey = `${entryDate.getFullYear()}-T${trimestre}`;
      if (!parTrimestre[trimestreKey]) parTrimestre[trimestreKey] = 0;
      parTrimestre[trimestreKey] += entry.montant || 0;
    });

    const meilleurTrimestre = Object.entries(parTrimestre)
      .map(([trimestre, montant]) => ({ trimestre, montant }))
      .sort((a, b) => b.montant - a.montant)[0];

    return {
      meilleurMois,
      meilleurTrimestre
    };
  }, [liquidites]);

  if (!liquidites || !liquidites.progression || liquidites.progression.length === 0) {
    return (
      <div className="liquidites-analytics bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Analytics Performance Accumulation</h4>
        <div className="text-center py-8 text-slate-400">
          Aucune donnée disponible
        </div>
      </div>
    );
  }

  return (
    <div className="liquidites-analytics space-y-6">
      <h4 className="text-lg font-semibold text-white">Analytics Performance Accumulation</h4>

      {/* Courbe accumulation */}
      {accumulationData.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h5 className="text-md font-semibold text-white mb-4">Courbe Accumulation (Target vs Réalisation)</h5>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={accumulationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="mois" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" tickFormatter={formatCurrency} style={{ fontSize: '12px' }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Area
                type="monotone"
                dataKey="target"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                name="Objectif"
              />
              <Area
                type="monotone"
                dataKey="realisation"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.3}
                name="Réalisation"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Velocity tracking */}
      {velocity && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h5 className="text-md font-semibold text-white mb-4">Velocity Tracking</h5>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-white">
              {formatCurrency(velocity.moyenne * 30)}/mois
            </div>
            <div className="flex-1">
              <div className={`text-sm ${
                velocity.tendance === 'acceleration' ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {velocity.message}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Tendance sur les 3 derniers mois
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Records personnels */}
      {records && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h5 className="text-md font-semibold text-white mb-4">Records Personnels</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {records.meilleurMois && (
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Meilleur mois</div>
                <div className="text-xl font-bold text-white">
                  {formatCurrency(records.meilleurMois.montant)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {records.meilleurMois.mois}
                </div>
              </div>
            )}
            {records.meilleurTrimestre && (
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Meilleur trimestre</div>
                <div className="text-xl font-bold text-white">
                  {formatCurrency(records.meilleurTrimestre.montant)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {records.meilleurTrimestre.trimestre}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Projections motivantes */}
      {liquidites.objectifMensuel > 0 && (
        <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-500/50 rounded-lg p-6">
          <h5 className="text-md font-semibold text-white mb-2">Projections Motivantes</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>À ce rythme (1 an) :</span>
              <span className="font-semibold text-white">
                {formatCurrency(liquidites.objectifMensuel * 12)}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Objectif 10k€ dans :</span>
              <span className="font-semibold text-white">
                {liquidites.objectifMensuel > 0 
                  ? `${Math.ceil((10000 - (liquidites.stockTotal || 0)) / liquidites.objectifMensuel)} mois`
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiquiditesAnalytics;

