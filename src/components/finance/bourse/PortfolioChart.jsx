import React, { useMemo } from 'react';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
// ✅ PHASE 4 - Étape 4.10 : Import hook données historiques pour calcul réel
import { useHistoricalData } from '../../../hooks/useHistoricalData';
// ✅ PHASE 4 - Étape 4.10 : Import service devises pour conversions
import { convertCurrencySync } from '../../../services/finance/currencyService';

// ✅ PHASE 4 - Étape 4.10 : Fonction fallback pour calcul simplifié (définie en dehors du composant)
// Définie en dehors pour éviter erreur "Cannot access before initialization"
const calculateSimplifiedEvolution = (portfolio) => {
  if (!portfolio || portfolio.length === 0) return [];

  // Trier positions par date achat
  const sorted = [...portfolio].sort((a, b) => 
    new Date(a.dateAchat || a.dateAjout || 0) - new Date(b.dateAchat || b.dateAjout || 0)
  );

  const data = [];
  let cumulativeValue = 0;
  let cumulativeInvesti = 0;
  const dates = new Set();

  sorted.forEach((pos) => {
    const date = pos.dateAchat || pos.dateAjout || new Date().toISOString().split('T')[0];
    if (!dates.has(date)) {
      dates.add(date);
      cumulativeValue += pos.calculs?.valeurPosition || (pos.quantite * pos.prixEntree);
      cumulativeInvesti += pos.calculs?.investissementConverti || (pos.quantite * pos.prixEntree);
      
      data.push({
        date,
        valeur: cumulativeValue,
        investi: cumulativeInvesti
      });
    } else {
      // Si même date, additionner
      const existing = data.find(d => d.date === date);
      if (existing) {
        existing.valeur += pos.calculs?.valeurPosition || (pos.quantite * pos.prixEntree);
        existing.investi += pos.calculs?.investissementConverti || (pos.quantite * pos.prixEntree);
      }
    }
  });

  // Ajouter point actuel
  const totalValorise = portfolio.reduce((sum, pos) => 
    sum + (pos.calculs?.valeurPosition || 0), 0
  );
  const totalInvesti = portfolio.reduce((sum, pos) => {
    const investi = pos.calculs?.investissementConverti 
      || (pos.quantite * pos.prixEntree);
    return sum + investi;
  }, 0);

  data.push({
    date: new Date().toISOString().split('T')[0],
    valeur: totalValorise,
    investi: totalInvesti
  });

  return data;
};

const PortfolioChart = ({ portfolio }) => {
  // ✅ PHASE 4 - Étape 4.10 : Charger données historiques pour toutes les positions
  const tickers = useMemo(() => portfolio.map(p => p.ticker), [portfolio]);
  const { data: historicalDataMap } = useHistoricalData(
    tickers,
    '1a', // 1 an d'historique
    { enabled: portfolio.length > 0 }
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // ✅ PHASE 4 - Étape 4.10 : Calcul historique portfolio réel basé sur prix historiques
  const evolutionData = useMemo(() => {
    if (!portfolio || portfolio.length === 0) return [];
    if (!historicalDataMap || Object.keys(historicalDataMap).length === 0) {
      // Fallback : utiliser méthode simplifiée si pas de données historiques
      return calculateSimplifiedEvolution(portfolio);
    }

    // Collecter toutes les dates historiques disponibles
    const allDates = new Set();
    Object.values(historicalDataMap).forEach(historicalData => {
      if (Array.isArray(historicalData)) {
        historicalData.forEach(point => {
          if (point.date) {
            allDates.add(point.date);
          }
        });
      }
    });

    // Trier dates chronologiquement
    const sortedDates = Array.from(allDates).sort((a, b) => {
      return new Date(a) - new Date(b);
    });

    if (sortedDates.length === 0) {
      return calculateSimplifiedEvolution(portfolio);
    }

    // Calculer valeur portfolio pour chaque date historique
    const data = [];
    
    for (const date of sortedDates) {
      let totalValeur = 0;
      let totalInvesti = 0;
      const dateObj = new Date(date);

      portfolio.forEach(position => {
        const historicalData = historicalDataMap[position.ticker];
        if (!historicalData || !Array.isArray(historicalData)) {
          // Pas de données historiques pour cette position : utiliser valeur actuelle
          totalValeur += position.calculs?.valeurPosition || 0;
          totalInvesti += position.quantite * position.prixEntree;
          return;
        }

        // Trouver prix le plus proche de cette date (avant ou égal)
        let closestPrice = null;
        let closestDate = null;
        
        for (const point of historicalData) {
          const pointDate = new Date(point.date);
          if (pointDate <= dateObj) {
            if (!closestDate || pointDate > closestDate) {
              closestDate = pointDate;
              closestPrice = point.close || point.prixActuel || point.price;
            }
          }
        }

        // Si pas de prix historique trouvé, utiliser prix d'achat
        const priceAtDate = closestPrice || position.prixEntree;
        
        // Vérifier si position existait à cette date
        const dateAchat = new Date(position.dateAchat || position.dateAjout || date);
        if (dateObj >= dateAchat) {
          // Position existait : calculer valeur avec prix historique
          const positionCurrency = position.calculs?.currency || position.currency || 'EUR';
          
          // Convertir prix en EUR si nécessaire
          let priceInEUR = priceAtDate;
          if (positionCurrency !== 'EUR') {
            try {
              priceInEUR = convertCurrencySync(priceAtDate, positionCurrency, 'EUR');
              // Si conversion échoue (pas de cache), utiliser prix original
              if (priceInEUR === priceAtDate && positionCurrency !== 'EUR') {
                // Essayer avec prix actuel converti comme approximation
                priceInEUR = position.calculs?.valeurPosition 
                  ? position.calculs.valeurPosition / position.quantite 
                  : priceAtDate;
              }
            } catch (err) {
              // En cas d'erreur, utiliser approximation
              priceInEUR = position.calculs?.valeurPosition 
                ? position.calculs.valeurPosition / position.quantite 
                : priceAtDate;
            }
          }

          const valeurAtDate = position.quantite * priceInEUR;
          totalValeur += valeurAtDate;
          
          // Investissement : utiliser prix d'achat converti si disponible
          const investissement = position.calculs?.investissementConverti 
            || (position.quantite * position.prixEntree);
          totalInvesti += investissement;
        }
      });

      data.push({
        date,
        valeur: Math.round(totalValeur * 100) / 100,
        investi: Math.round(totalInvesti * 100) / 100
      });
    }

    // Ajouter point actuel (dernière valeur)
    const totalValorise = portfolio.reduce((sum, pos) => 
      sum + (pos.calculs?.valeurPosition || 0), 0
    );
    const totalInvesti = portfolio.reduce((sum, pos) => {
      const investi = pos.calculs?.investissementConverti 
        || (pos.quantite * pos.prixEntree);
      return sum + investi;
    }, 0);

    // Ajouter point actuel seulement si différent du dernier point historique
    const lastPoint = data[data.length - 1];
    const today = new Date().toISOString().split('T')[0];
    
    if (!lastPoint || lastPoint.date !== today || 
        Math.abs(lastPoint.valeur - totalValorise) > 0.01) {
      data.push({
        date: today,
        valeur: Math.round(totalValorise * 100) / 100,
        investi: Math.round(totalInvesti * 100) / 100
      });
    }

    return data;
  }, [portfolio, historicalDataMap]);

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



