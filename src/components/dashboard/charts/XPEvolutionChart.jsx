/**
 * XPEvolutionChart Component
 * Graphique Canvas d'évolution XP sur 30 jours
 */

import { useEffect, useRef } from 'react';

const XPEvolutionChart = ({ data = [], labels = [], width = 800, height = 200 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D context');
      return;
    }

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const actualWidth = canvas.width;
    const actualHeight = canvas.height;

    // Margins for axes
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = actualWidth - margin.left - margin.right;
    const chartHeight = actualHeight - margin.top - margin.bottom;

    // Clear canvas
    ctx.clearRect(0, 0, actualWidth, actualHeight);

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;
    
    // Vertical grid lines
    for (let i = 0; i < chartWidth; i += 40) {
      ctx.beginPath();
      ctx.moveTo(margin.left + i, margin.top);
      ctx.lineTo(margin.left + i, margin.top + chartHeight);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let i = 0; i < chartHeight; i += 30) {
      ctx.beginPath();
      ctx.moveTo(margin.left, margin.top + i);
      ctx.lineTo(margin.left + chartWidth, margin.top + i);
      ctx.stroke();
    }

    // Draw axes
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1.5;

    // X axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.stroke();

    // Y axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartHeight);
    ctx.stroke();

    // Y axis labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'end';
    ctx.textBaseline = 'middle';

    const yLabels = ['0', '5k', '10k', '15k'];
    yLabels.forEach((label, index) => {
      const y = margin.top + chartHeight - (index * chartHeight) / (yLabels.length - 1);
      ctx.fillText(label, margin.left - 5, y);
    });

    // X axis labels
    ctx.textAlign = 'center';
    ctx.font = 'bold 9px Arial';

    const stepX = chartWidth / (labels.length - 1);
    labels.forEach((label, index) => {
      const x = margin.left + index * stepX;
      const y = margin.top + chartHeight + 20;
      ctx.fillText(label, x, y);
    });

    // Draw curve
    if (data.length > 0) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.beginPath();

      const maxValue = Math.max(...data);
      
      data.forEach((value, index) => {
        const x = margin.left + (index * chartWidth) / (data.length - 1);
        const y = margin.top + chartHeight - (value / maxValue) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw points
      data.forEach((value, index) => {
        const x = margin.left + (index * chartWidth) / (data.length - 1);
        const y = margin.top + chartHeight - (value / maxValue) * chartHeight;

        ctx.fillStyle = index === data.length - 1 ? '#ec4899' : '#06b6d4';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();

        // White border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    // Cleanup function
    return () => {
      ctx.clearRect(0, 0, actualWidth, actualHeight);
    };
  }, [data, labels]);

  return (
    <canvas 
      ref={canvasRef} 
      className="pm-chart-canvas"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default XPEvolutionChart;
