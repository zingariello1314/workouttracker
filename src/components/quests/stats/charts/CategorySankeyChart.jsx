/**
 * Composant CategorySankeyChart - Flux XP entre catégories
 * Visualise le flux d'XP entre les différentes catégories dans le temps
 */

import React, { useMemo } from 'react';
import LazyChart from '../../../BodyTracking/components/LazyChart';

const CategorySankeyChart = ({ validations, allQuests, selectedPeriod }) => {
  const sankeyData = useMemo(() => {
    if (!validations || !allQuests || validations.length === 0) return { nodes: [], links: [] };

    // Grouper par semaine et catégorie
    const weekMap = new Map();
    
    validations.forEach(v => {
      const quest = allQuests.find(q => q.id === v.queteId);
      if (!quest) return;

      // Calculer la semaine à partir de la date
      const date = new Date(v.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Dimanche
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, new Map());
      }
      
      const categoryMap = weekMap.get(weekKey);
      const currentXP = categoryMap.get(quest.categorie) || 0;
      categoryMap.set(quest.categorie, currentXP + (v.xpGagne || 0));
    });

    // Créer les nœuds (sources = semaines, cibles = catégories)
    const nodes = [];
    const links = [];
    const nodeIndexMap = new Map();
    let nodeIndex = 0;

    // Trier les semaines
    const sortedWeeks = Array.from(weekMap.keys()).sort();

    // Ajouter les nœuds sources (semaines)
    sortedWeeks.forEach(week => {
      const weekLabel = `Sem. ${sortedWeeks.indexOf(week) + 1}`;
      nodes.push({
        id: week,
        name: weekLabel,
        type: 'source',
        value: 0, // Sera calculé depuis les liens
      });
      nodeIndexMap.set(week, nodeIndex++);
    });

    // Calculer les totaux par catégorie
    const categoryTotals = new Map();
    weekMap.forEach((categoryMap, week) => {
      categoryMap.forEach((xp, category) => {
        const total = categoryTotals.get(category) || 0;
        categoryTotals.set(category, total + xp);
      });
    });

    // Ajouter les nœuds cibles (catégories)
    const sortedCategories = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category]) => category);

    sortedCategories.forEach(category => {
      nodes.push({
        id: category,
        name: category,
        type: 'target',
        value: categoryTotals.get(category),
      });
      nodeIndexMap.set(category, nodeIndex++);
    });

    // Créer les liens
    weekMap.forEach((categoryMap, week) => {
      const sourceIndex = nodeIndexMap.get(week);
      
      categoryMap.forEach((xp, category) => {
        const targetIndex = nodeIndexMap.get(category);
        if (targetIndex !== undefined && xp > 0) {
          links.push({
            source: sourceIndex,
            target: targetIndex,
            value: xp,
            category,
          });
        }
      });
    });

    return { nodes, links };
  }, [validations, allQuests, selectedPeriod]);

  if (sankeyData.nodes.length === 0 || sankeyData.links.length === 0) return null;

  // Couleurs par catégorie
  const categoryColors = {
    'Santé': '#10b981',
    'Travail': '#3b82f6',
    'Apprentissage': '#8b5cf6',
    'Lecture': '#ec4899',
    'Sport': '#f59e0b',
    'Ménage': '#06b6d4',
    'Spirituel': '#6366f1',
  };

  // Calculer les positions et largeurs
  const sourceNodes = sankeyData.nodes.filter(n => n.type === 'source');
  const targetNodes = sankeyData.nodes.filter(n => n.type === 'target');
  
  // Calculer les totaux pour normaliser
  const maxSourceValue = Math.max(...sourceNodes.map(n => {
    const linksFrom = sankeyData.links.filter(l => l.source === sankeyData.nodes.indexOf(n));
    return linksFrom.reduce((sum, l) => sum + l.value, 0);
  }), 1);
  
  const maxTargetValue = Math.max(...targetNodes.map(n => n.value), 1);

  // Calculer les positions Y pour éviter les chevauchements avec meilleures proportions
  // Utiliser toute la hauteur disponible de manière proportionnelle
  const svgHeight = 400;
  const topMargin = 15;
  const bottomMargin = 15;
  const totalHeight = svgHeight - topMargin - bottomMargin; // Hauteur utilisable
  const minNodeHeight = 30; // Hauteur minimale pour lisibilité
  const spacing = 6; // Espacement entre nœuds
  
  // Calculer la hauteur totale nécessaire pour les sources
  const sourceTotalValue = sourceNodes.reduce((sum, node) => {
    const linksFrom = sankeyData.links.filter(l => l.source === sankeyData.nodes.indexOf(node));
    return sum + linksFrom.reduce((s, l) => s + l.value, 0);
  }, 0);
  
  // Calculer les hauteurs proportionnelles d'abord
  const sourceHeights = sourceNodes.map((node) => {
    const linksFrom = sankeyData.links.filter(l => l.source === sankeyData.nodes.indexOf(node));
    const nodeValue = linksFrom.reduce((sum, l) => sum + l.value, 0);
    return sourceTotalValue > 0 
      ? (nodeValue / sourceTotalValue) * totalHeight
      : totalHeight / sourceNodes.length;
  });
  
  // Normaliser pour s'assurer que tout rentre
  const sourceTotalHeight = sourceHeights.reduce((sum, h) => sum + h, 0) + (sourceNodes.length - 1) * spacing;
  const sourceScale = sourceTotalHeight > totalHeight ? totalHeight / sourceTotalHeight : 1;
  
  const sourcePositions = [];
  let currentY = topMargin;
  sourceNodes.forEach((node, index) => {
    const linksFrom = sankeyData.links.filter(l => l.source === sankeyData.nodes.indexOf(node));
    const nodeValue = linksFrom.reduce((sum, l) => sum + l.value, 0);
    let nodeHeight = Math.max(minNodeHeight, sourceHeights[index] * sourceScale);
    
    // Ajuster pour le dernier élément si nécessaire
    if (index === sourceNodes.length - 1) {
      const maxY = svgHeight - bottomMargin;
      if (currentY + nodeHeight > maxY) {
        nodeHeight = Math.max(minNodeHeight, maxY - currentY);
      }
    } else {
      // S'assurer qu'on ne dépasse pas
      const remainingHeight = svgHeight - bottomMargin - currentY;
      const remainingNodes = sourceNodes.length - index;
      const maxHeightForThis = remainingHeight / remainingNodes - spacing;
      nodeHeight = Math.min(nodeHeight, maxHeightForThis);
    }
    
    sourcePositions.push({ y: currentY, height: nodeHeight, value: nodeValue });
    currentY += nodeHeight + spacing;
  });

  // Calculer la hauteur totale nécessaire pour les cibles
  const targetTotalValue = targetNodes.reduce((sum, node) => sum + node.value, 0);
  
  // Calculer les hauteurs proportionnelles d'abord
  const targetHeights = targetNodes.map((node) => {
    return targetTotalValue > 0
      ? (node.value / targetTotalValue) * totalHeight
      : totalHeight / targetNodes.length;
  });
  
  // Normaliser pour s'assurer que tout rentre
  const targetTotalHeight = targetHeights.reduce((sum, h) => sum + h, 0) + (targetNodes.length - 1) * spacing;
  const targetScale = targetTotalHeight > totalHeight ? totalHeight / targetTotalHeight : 1;
  
  const targetPositions = [];
  currentY = topMargin;
  targetNodes.forEach((node, index) => {
    let nodeHeight = Math.max(minNodeHeight, targetHeights[index] * targetScale);
    
    // Ajuster pour le dernier élément si nécessaire
    if (index === targetNodes.length - 1) {
      const maxY = svgHeight - bottomMargin;
      if (currentY + nodeHeight > maxY) {
        nodeHeight = Math.max(minNodeHeight, maxY - currentY);
      }
    } else {
      // S'assurer qu'on ne dépasse pas
      const remainingHeight = svgHeight - bottomMargin - currentY;
      const remainingNodes = targetNodes.length - index;
      const maxHeightForThis = remainingHeight / remainingNodes - spacing;
      nodeHeight = Math.min(nodeHeight, maxHeightForThis);
    }
    
    targetPositions.push({ y: currentY, height: nodeHeight });
    currentY += nodeHeight + spacing;
  });

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 px-4 py-3 shadow-xl shadow-indigo-500/10 backdrop-blur-sm">
      <div className="text-xs text-indigo-300 mb-3 font-semibold tracking-wide flex items-center gap-2">
        <div className="w-1 h-4 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-full"></div>
        Flux XP entre catégories (par semaine)
      </div>
      <LazyChart height={400}>
        <div className="relative w-full" style={{ minHeight: '400px', maxHeight: '400px', overflow: 'hidden' }}>
          <svg width="100%" height="400" viewBox="0 0 500 400" className="overflow-hidden" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
            <defs>
              {/* Gradients pour les catégories */}
              {Object.entries(categoryColors).map(([category, color]) => (
                <linearGradient key={`grad-${category}`} id={`linkGrad-${category}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                  <stop offset="50%" stopColor={color} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.4} />
                </linearGradient>
              ))}
              <linearGradient id="sourceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            
            {/* Liens (flux) - avec courbes plus fluides */}
            {sankeyData.links.map((link, index) => {
              const sourceNode = sankeyData.nodes[link.source];
              const targetNode = sankeyData.nodes[link.target];
              
              if (!sourceNode || !targetNode) return null;

              const sourceIndex = sankeyData.nodes.filter(n => n.type === 'source').indexOf(sourceNode);
              const targetIndex = sankeyData.nodes.filter(n => n.type === 'target').indexOf(targetNode);
              const sourcePos = sourcePositions[sourceIndex];
              const targetPos = targetPositions[targetIndex];
              
              if (!sourcePos || !targetPos) return null;

              const sourceX = 80;
              const targetX = 420;
              // S'assurer que les Y restent dans les limites du SVG
              const sourceY = Math.max(
                topMargin + 5,
                Math.min(svgHeight - bottomMargin - 5, sourcePos.y + sourcePos.height / 2)
              );
              const targetY = Math.max(
                topMargin + 5,
                Math.min(svgHeight - bottomMargin - 5, targetPos.y + targetPos.height / 2)
              );
              
              const linkWidth = Math.max(3, Math.min(20, (link.value / maxSourceValue) * 18));
              const color = categoryColors[link.category] || '#9ca3af';

              // Path courbé plus fluide avec contrôle points mieux positionnés
              const controlPoint1X = sourceX + (targetX - sourceX) * 0.4;
              const controlPoint2X = sourceX + (targetX - sourceX) * 0.6;
              const path = `M ${sourceX} ${sourceY} C ${controlPoint1X} ${sourceY}, ${controlPoint2X} ${targetY}, ${targetX} ${targetY}`;

              return (
                <path
                  key={index}
                  d={path}
                  fill="none"
                  stroke={`url(#linkGrad-${link.category})`}
                  strokeWidth={linkWidth}
                  opacity={0.75}
                  style={{
                    filter: `drop-shadow(0 0 6px ${color}80)`,
                    transition: 'opacity 0.2s ease',
                  }}
                />
              );
            })}

            {/* Nœuds sources (semaines) - améliorés */}
            {sourceNodes.map((node, index) => {
              const pos = sourcePositions[index];
              if (!pos) return null;

              // S'assurer que le rectangle ne dépasse pas
              const rectY = Math.max(topMargin, Math.min(pos.y, svgHeight - bottomMargin - pos.height));
              const rectHeight = Math.min(pos.height, svgHeight - bottomMargin - rectY);

              return (
                <g key={node.id}>
                  {/* Ombre portée */}
                  <rect
                    x={50}
                    y={rectY + 2}
                    width={60}
                    height={rectHeight}
                    rx={6}
                    fill="rgba(0, 0, 0, 0.3)"
                    opacity={0.5}
                  />
                  {/* Rectangle principal avec gradient */}
                  <rect
                    x={50}
                    y={rectY}
                    width={60}
                    height={rectHeight}
                    fill="url(#sourceGradient)"
                    rx={6}
                    stroke="#60a5fa"
                    strokeWidth="1.5"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))',
                    }}
                  />
                  {/* Label */}
                  <text
                    x={80}
                    y={rectY + rectHeight / 2 - 4}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="12"
                    fontWeight="600"
                    dominantBaseline="middle"
                  >
                    {node.name}
                  </text>
                  {/* Valeur XP si disponible */}
                  {pos.value > 0 && rectHeight > 25 && (
                    <text
                      x={80}
                      y={rectY + rectHeight / 2 + 10}
                      textAnchor="middle"
                      fill="#bfdbfe"
                      fontSize="9"
                      fontWeight="500"
                      dominantBaseline="middle"
                    >
                      {Math.round(pos.value).toLocaleString('fr-FR')} XP
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nœuds cibles (catégories) - améliorés */}
            {targetNodes.map((node, index) => {
              const pos = targetPositions[index];
              if (!pos) return null;
              const color = categoryColors[node.name] || '#9ca3af';
              
              // S'assurer que le rectangle ne dépasse pas
              const rectY = Math.max(topMargin, Math.min(pos.y, svgHeight - bottomMargin - pos.height));
              const rectHeight = Math.min(pos.height, svgHeight - bottomMargin - rectY);
              
              // Créer gradient pour chaque catégorie
              const gradientId = `targetGrad-${node.name}`;

              return (
                <g key={node.id}>
                  <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.75} />
                    </linearGradient>
                  </defs>
                  
                  {/* Ombre portée */}
                  <rect
                    x={370}
                    y={rectY + 2}
                    width={80}
                    height={rectHeight}
                    rx={6}
                    fill="rgba(0, 0, 0, 0.3)"
                    opacity={0.5}
                  />
                  
                  {/* Rectangle principal avec gradient */}
                  <rect
                    x={370}
                    y={rectY}
                    width={80}
                    height={rectHeight}
                    fill={`url(#${gradientId})`}
                    rx={6}
                    stroke={color}
                    strokeWidth="1.5"
                    style={{
                      filter: `drop-shadow(0 0 10px ${color}80)`,
                    }}
                  />
                  
                  {/* Label catégorie */}
                  <text
                    x={410}
                    y={rectY + rectHeight / 2 - 5}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="12"
                    fontWeight="600"
                    dominantBaseline="middle"
                  >
                    {node.name}
                  </text>
                  
                  {/* Valeur XP */}
                  {rectHeight > 30 && (
                    <text
                      x={410}
                      y={rectY + rectHeight / 2 + 10}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize="10"
                      fontWeight="500"
                      opacity={0.95}
                      dominantBaseline="middle"
                    >
                      {Math.round(node.value).toLocaleString('fr-FR')} XP
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </LazyChart>
    </div>
  );
};

export default CategorySankeyChart;

