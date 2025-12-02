import React, { useMemo } from 'react';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const PortfolioChart = ({ portfolio }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Évolution valeur totale portfolio (simulation basée sur dates achat)
  const evolutionData = useMemo(() => {
    if (!portfolio || portfolio.length === 0) return [];

    // Trier positions par date achat
    const sorted = [...portfolio].sort((a, b) => 
      new Date(a.dateAchat) - new Date(b.dateAchat)
    );

    const data = [];
    let cumulativeValue = 0;
    const dates = new Set();

    sorted.forEach((pos, index) => {
      const date = pos.dateAchat;
      if (!dates.has(date)) {
        dates.add(date);
        cumulativeValue += pos.calculs?.valeurPosition || (pos.quantite * pos.prixEntree);
        
        data.push({
          date,
          valeur: cumulativeValue,
          investi: cumulativeValue // Simplification
        });
      } else {
        // Si même date, additionner
        const existing = data.find(d => d.date === date);
        if (existing) {
          existing.valeur += pos.calculs?.valeurPosition || (pos.quantite * pos.prixEntree);
          existing.investi += pos.quantite * pos.prixEntree;
        }
      }
    });

    // Ajouter point actuel
    const totalValorise = portfolio.reduce((sum, pos) => 
      sum + (pos.calculs?.valeurPosition || 0), 0
    );
    const totalInvesti = portfolio.reduce((sum, pos) => 
      sum + (pos.quantite * pos.prixEntree), 0
    );

    data.push({
      date: new Date().toISOString().split('T')[0],
      valeur: totalValorise,
      investi: totalInvesti
    });

    return data;
  }, [portfolio]);

  // Répartition sectorielle (simulation - secteur non encore implémenté)
  const sectorData = useMemo(() => {
    if (!portfolio || portfolio.length === 0) return [];

    // Pour l'instant, regrouper par ticker (secteur sera ajouté plus tard)
    const grouped = portfolio.reduce((acc, pos) => {
      const secteur = pos.secteur || 'Divers';
      if (!acc[secteur]) {
        acc[secteur] = 0;
      }
      acc[secteur] += pos.calculs?.valeurPosition || 0;
      return acc;
    }, {});

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value: Math.round(value)
    }));
  }, [portfolio]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-white mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (portfolio.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <div className="portfolio-chart space-y-6">
      {/* Évolution valeur totale */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Évolution du Portfolio</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={evolutionData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af"
              tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#9ca3af"
              tickFormatter={formatCurrency}
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="investi" 
              stroke="#6b7280" 
              strokeWidth={2}
              name="Investi"
              strokeDasharray="5 5"
            />
            <Line 
              type="monotone" 
              dataKey="valeur" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Valorisation"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Répartition sectorielle */}
      {sectorData.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Répartition par Secteur</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sectorData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {sectorData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default PortfolioChart;

