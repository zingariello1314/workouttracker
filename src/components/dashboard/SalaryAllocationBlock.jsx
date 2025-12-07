/**
 * SalaryAllocationBlock Component
 * Bloc Allocation Salaire - PRIORITY-LOW (Bloc 20)
 * 
 * @version 2.0.0 - Refonte Liquid Glass
 * Design Emerald avec effets glassmorphism
 */

import { DollarSign, TrendingUp, Sparkles, Settings } from 'lucide-react';
import '../../styles/salary-allocation-block.css';

const SalaryAllocationBlock = ({ allocationData, onUpdate }) => {
  if (!allocationData) {
    return (
      <div className="salary-allocation-card loading">
        <div className="card-glow"></div>
        <div className="loading-skeleton">
          <div className="loading-icon">💰</div>
          <div className="loading-text">Chargement de l'allocation...</div>
        </div>
      </div>
    );
  }

  const { salary, allocation } = allocationData;

  // Calculate recommendations
  const recommendations = [
    {
      category: 'Épargne',
      current: (allocation.epargne / salary) * 100,
      recommended: 20,
      status: (allocation.epargne / salary) * 100 >= 20 ? 'good' : 'improve'
    },
    {
      category: 'Investissement',
      current: (allocation.investissement / salary) * 100,
      recommended: 15,
      status: (allocation.investissement / salary) * 100 >= 15 ? 'good' : 'improve'
    }
  ];

  // Préparer les données des catégories
  const categories = [
    { name: 'Épargne', amount: allocation.epargne, percent: ((allocation.epargne / salary) * 100).toFixed(1), color: '#3b82f6' },
    { name: 'Investissement', amount: allocation.investissement, percent: ((allocation.investissement / salary) * 100).toFixed(1), color: '#8b5cf6' },
    { name: 'Dépenses', amount: allocation.depenses, percent: ((allocation.depenses / salary) * 100).toFixed(1), color: '#10b981' },
    { name: 'Loisirs', amount: allocation.loisirs, percent: ((allocation.loisirs / salary) * 100).toFixed(1), color: '#f59e0b' }
  ];

  return (
    <div className="salary-allocation-card">
      <div className="card-glow"></div>

      {/* Header */}
      <div className="card-header">
        <div className="header-left">
          <div className="icon-container">
            <DollarSign className="header-icon" />
          </div>
          <div className="header-text">
            <h3 className="card-title">Allocation Salaire</h3>
            <p className="card-subtitle">Répartition mensuelle optimisée</p>
          </div>
        </div>

        <div className="salary-badge">
          <div className="badge-label">Salaire mensuel</div>
          <div className="badge-value">{salary.toLocaleString()}€</div>
        </div>
      </div>

      {/* Section Allocation */}
      <div className="allocation-section">
        <div className="allocation-chart">
          {/* Graphique circulaire simplifié */}
          <div className="chart-container">
            <svg width="220" height="220" viewBox="0 0 220 220">
              {/* Background circle */}
              <circle
                cx="110"
                cy="110"
                r="88"
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="44"
              />
              
              {/* Segments colorés */}
              {(() => {
                let currentAngle = 0;
                return categories.map((cat, index) => {
                  const percentage = parseFloat(cat.percent);
                  const angle = (percentage / 100) * 360;
                  const startAngle = currentAngle;
                  currentAngle += angle;
                  
                  const start = (startAngle - 90) * (Math.PI / 180);
                  const end = (currentAngle - 90) * (Math.PI / 180);
                  
                  const x1 = 110 + 88 * Math.cos(start);
                  const y1 = 110 + 88 * Math.sin(start);
                  const x2 = 110 + 88 * Math.cos(end);
                  const y2 = 110 + 88 * Math.sin(end);
                  
                  const largeArc = angle > 180 ? 1 : 0;
                  const path = `M ${x1} ${y1} A 88 88 0 ${largeArc} 1 ${x2} ${y2}`;
                  
                  return (
                    <path
                      key={index}
                      d={path}
                      fill="none"
                      stroke={cat.color}
                      strokeWidth="44"
                      strokeLinecap="round"
                      opacity="0.9"
                    />
                  );
                });
              })()}
            </svg>
            
            {/* Center text */}
            <div className="chart-center-text">
              <div className="chart-total">{salary.toLocaleString()}€</div>
              <div className="chart-label">Total</div>
            </div>
          </div>
        </div>

        <div className="allocation-categories">
          {categories.map((category) => (
            <div key={category.name} className="category-bar">
              <div className="category-info">
                <div className="category-dot" style={{ background: category.color }} />
                <span className="category-name">{category.name}</span>
              </div>
              <div className="category-values">
                <span className="category-amount">{category.amount.toLocaleString()}€</span>
                <span className="category-percent">{category.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Recommandations */}
      <div className="recommendations-section">
        <div className="section-header">
          <TrendingUp className="section-icon" />
          <span className="section-title">Recommandations d'optimisation</span>
        </div>

        <div className="recommendations-grid">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`recommendation-card ${rec.status === 'good' ? 'optimal' : 'improve'}`}
            >
              <div className="rec-header">
                <span className="rec-category">{rec.category}</span>
                <span className="rec-badge">
                  {rec.status === 'good' ? '✓ Optimal' : '⚠ À améliorer'}
                </span>
              </div>

              <div className="rec-details">
                <div className="rec-stat">
                  <span className="rec-label">Actuel:</span>
                  <span className="rec-value">{rec.current.toFixed(1)}%</span>
                </div>
                <div className="rec-stat">
                  <span className="rec-label">Recommandé:</span>
                  <span className="rec-value">{rec.recommended}%</span>
                </div>
                {rec.status === 'improve' && (
                  <div className="rec-diff">
                    +{(rec.recommended - rec.current).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Actions */}
      <div className="actions-section">
        <button
          onClick={() => onUpdate?.('optimize')}
          className="action-btn primary"
        >
          <Sparkles className="btn-icon" />
          <span className="btn-text">Optimiser automatiquement</span>
        </button>
        <button
          onClick={() => onUpdate?.('custom')}
          className="action-btn secondary"
        >
          <Settings className="btn-icon" />
          <span className="btn-text">Personnaliser</span>
        </button>
      </div>
    </div>
  );
};

export default SalaryAllocationBlock;
