import React, { useMemo } from 'react';
import moment from 'moment';

const OrCalendar = ({ objectifMensuel, stockActuel, prixOr }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculer prochain achat recommandé
  const prochainAchat = useMemo(() => {
    if (!prixOr || !objectifMensuel) return null;

    // Planificateur adaptatif : 5g → 10g → 20g → 1oz (31.1g)
    const tailles = [5, 10, 20, 31.1];
    const tailleRecommandee = tailles.find(t => t >= objectifMensuel / prixOr) || tailles[tailles.length - 1];
    const montant = tailleRecommandee * prixOr;

    // Calculer date prochaine acquisition (basé sur objectif mensuel)
    const joursRestants = 30 - new Date().getDate();
    const dateProchaine = moment().add(joursRestants, 'days');

    return {
      taille: tailleRecommandee,
      montant,
      date: dateProchaine.format('DD/MM/YYYY'),
      joursRestants
    };
  }, [objectifMensuel, prixOr]);

  // Dépenses planifiées pour les 3 prochains mois
  const depensesPlanifiees = useMemo(() => {
    if (!objectifMensuel) return [];

    const depenses = [];
    for (let i = 0; i < 3; i++) {
      const date = moment().add(i, 'months');
      depenses.push({
        mois: date.format('MMMM YYYY'),
        montant: objectifMensuel,
        date: date.format('YYYY-MM')
      });
    }
    return depenses;
  }, [objectifMensuel]);

  return (
    <div className="or-calendar bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
      <h4 className="text-lg font-semibold text-white mb-4">Calendrier Acquisition Intelligent</h4>

      {/* Prochain achat */}
      {prochainAchat && (
        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300">Prochain achat recommandé</span>
            <span className="text-xs text-blue-300">Dans {prochainAchat.joursRestants} jours</span>
          </div>
          <div className="text-xl font-bold text-white mb-1">
            {prochainAchat.taille.toFixed(1)}g - {formatCurrency(prochainAchat.montant)}
          </div>
          <div className="text-xs text-slate-400">
            Date prévue : {prochainAchat.date}
          </div>
        </div>
      )}

      {/* Objectif mensuel */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-300">Objectif mensuel</span>
          <span className="text-sm font-semibold text-white">{formatCurrency(objectifMensuel)}</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className="bg-yellow-500 h-2 rounded-full"
            style={{
              width: `${objectifMensuel > 0 ? Math.min((stockActuel * prixOr / objectifMensuel) * 100, 100) : 0}%`
            }}
          />
        </div>
      </div>

      {/* Dépenses planifiées */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-slate-300 mb-2">Dépenses planifiées (3 mois)</div>
        {depensesPlanifiees.map((depense, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
            <span className="text-sm text-slate-400">{depense.mois}</span>
            <span className="text-sm font-semibold text-white">{formatCurrency(depense.montant)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrCalendar;



