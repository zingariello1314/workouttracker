import React from 'react';
import { useFinance } from '../../../hooks/useFinance';

const ExportCSV = () => {
  const { portfolio } = useFinance();

  const exportToCSV = () => {
    if (!portfolio || portfolio.length === 0) {
      alert('Aucune position à exporter');
      return;
    }

    const headers = [
      'Ticker',
      'Entreprise',
      'Quantité',
      'Prix Entrée (€)',
      'Prix Actuel (€)',
      'Valeur Position (€)',
      'Plus-Value (€)',
      'Plus-Value (%)',
      'Poids Portfolio (%)',
      'Date Achat'
    ];

    const rows = portfolio.map(pos => [
      pos.ticker,
      pos.entreprise || '',
      pos.quantite,
      pos.prixEntree,
      pos.yahooData?.prixActuel || pos.prixEntree,
      pos.calculs?.valeurPosition || 0,
      pos.calculs?.plusValueEuro || 0,
      pos.calculs?.plusValuePourcent || 0,
      pos.calculs?.poidsPortfolio || 0,
      pos.dateAchat
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `portfolio_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (portfolio.length === 0) return null;

  return (
    <button
      onClick={exportToCSV}
      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
    >
      <span>📥</span>
      <span>Exporter CSV</span>
    </button>
  );
};

export default ExportCSV;

