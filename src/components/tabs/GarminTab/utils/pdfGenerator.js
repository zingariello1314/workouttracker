/**
 * 🔴 FIX #81-87: Utilitaires pour génération PDF PROFESSIONNEL PREMIUM
 * Génère des rapports PDF avec mise en page moderne, visuels avancés et informations complètes
 */

import logger from '../../../../utils/logger';

const log = logger.component('PDFGenerator');

// Import dynamique pour éviter erreur si jspdf pas installé
let jsPDF = null;

/**
 * Charge jsPDF dynamiquement
 */
async function loadJsPDF() {
  try {
    if (!jsPDF) {
      const module = await import('jspdf');
      
      if (module.jsPDF) {
        jsPDF = module.jsPDF;
      } else if (module.default && module.default.jsPDF) {
        jsPDF = module.default.jsPDF;
      } else if (module.default) {
        jsPDF = module.default;
      } else if (typeof module === 'function') {
        jsPDF = module;
      } else {
        const keys = Object.keys(module);
        for (const key of keys) {
          if (typeof module[key] === 'function' && key.toLowerCase().includes('pdf')) {
            jsPDF = module[key];
            break;
          }
        }
      }
      
      if (!jsPDF || typeof jsPDF !== 'function') {
        throw new Error(`jsPDF non trouvé. Clés: ${Object.keys(module).join(', ')}`);
      }
    }
    return jsPDF;
  } catch (e) {
    log.error('Erreur chargement jsPDF:', e);
    throw new Error(`Impossible de charger jsPDF: ${e.message}`);
  }
}

/**
 * Formate un nombre avec séparateur de milliers (espace pour format français)
 */
function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Math.round(num).toLocaleString('fr-FR');
}

/**
 * Formate un nombre décimal avec 2 décimales
 */
function formatDecimal(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  return parseFloat(num).toFixed(decimals).replace('.', ',');
}

/**
 * Extraire calories avec tous les fallbacks possibles
 */
function extractCalories(metrics) {
  if (!metrics) return { total: 0, active: 0, resting: 0 };
  
  if (typeof metrics.calories === 'number') {
    return { total: metrics.calories, active: 0, resting: metrics.calories };
  }
  
  if (metrics.calories && typeof metrics.calories === 'object') {
    const total = metrics.calories.total ?? 
                  metrics.calories.totalKilocalories ?? 
                  metrics.calories.totalCalories ?? 0;
    const active = metrics.calories.active ?? 
                   metrics.calories.activeKilocalories ?? 
                   metrics.calories.activeCalories ?? 0;
    const resting = metrics.calories.resting ?? 
                    metrics.calories.restingKilocalories ?? 
                    metrics.calories.bmrKilocalories ??
                    (total > 0 && active > 0 ? total - active : 0);
    
    return { total, active, resting };
  }
  
  const total = metrics.totalKilocalories ?? 
                metrics.totalCalories ?? 
                metrics.kilocalories ?? 0;
  
  return { total, active: 0, resting: total };
}

/**
 * Extraire FC avec tous les fallbacks possibles
 */
function extractHeartRate(metrics) {
  if (!metrics || !metrics.heartRate) {
    const resting = metrics?.restingHeartRate ?? metrics?.restingHR ?? 0;
    const max = metrics?.maxHeartRate ?? metrics?.maxHR ?? 0;
    const avg = metrics?.averageHeartRate ?? metrics?.avgHeartRate ?? metrics?.avgHR ?? 0;
    
    if (resting > 0 || max > 0 || avg > 0) {
      return { resting, max, avg };
    }
    return { resting: 0, max: 0, avg: 0 };
  }
  
  const hr = metrics.heartRate;
  return {
    resting: hr.resting ?? hr.restingHeartRate ?? hr.restingHR ?? 0,
    max: hr.max ?? hr.maxHeartRate ?? hr.maxHR ?? 0,
    avg: hr.avg ?? hr.average ?? hr.averageHeartRate ?? hr.avgHeartRate ?? 0
  };
}

/**
 * Dessine une ligne de séparation stylée
 */
function drawDivider(doc, x, y, width, color = [200, 200, 200]) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.line(x, y, x + width, y);
}

/**
 * Affiche une métrique dans une carte stylée améliorée
 */
function drawMetricCard(doc, x, y, label, value, unit = '', color = [59, 130, 246]) {
  const cardWidth = 55;
  const cardHeight = 28;
  
  // Fond clair
  const lightColor = color.map(c => Math.min(255, c + 210));
  doc.setFillColor(...lightColor);
  doc.roundedRect(x, y, cardWidth, cardHeight, 4, 4, 'F');
  
  // Bordure
  doc.setDrawColor(...color);
  doc.setLineWidth(0.8);
  doc.roundedRect(x, y, cardWidth, cardHeight, 4, 4);
  
  // Label
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  doc.text(label, x + 3, y + 7);
  
  // Valeur (mise en forme améliorée)
  doc.setFontSize(13);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...color);
  const valueText = `${formatNumber(value)}${unit ? ' ' + unit : ''}`;
  doc.text(valueText, x + 3, y + 18);
  
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0, 0, 0);
}

/**
 * Génère un graphique en barres amélioré avec axes et labels
 */
function drawEnhancedBarChart(doc, x, y, width, height, data, labels, color = [59, 130, 246], title = '') {
  if (!data || data.length === 0) return;
  
  const maxValue = Math.max(...data);
  if (maxValue === 0) return;
  
  const chartPadding = 25;
  const barWidth = (width - (data.length - 1) * 3 - chartPadding * 2) / data.length;
  const chartHeight = height - chartPadding - 15;
  const chartX = x + chartPadding;
  const chartY = y + 15;
  
  // Titre si fourni
  if (title) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(title, x, y);
    y += 8;
  }
  
  // Fond de la zone de graphique
  doc.setFillColor(250, 250, 250);
  doc.rect(chartX, chartY, width - chartPadding * 2, chartHeight, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.rect(chartX, chartY, width - chartPadding * 2, chartHeight);
  
  // Axe Y (échelle)
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  const steps = 5;
  const stepValue = maxValue / steps;
  for (let i = 0; i <= steps; i++) {
    const value = Math.round(stepValue * i);
    const yPos = chartY + chartHeight - (i / steps) * chartHeight;
    doc.text(formatNumber(value), chartX - 10, yPos + 2, { align: 'right' });
    // Ligne de grille
    if (i > 0 && i < steps) {
      doc.setDrawColor(240, 240, 240);
      doc.setLineWidth(0.2);
      doc.line(chartX, yPos, chartX + width - chartPadding * 2, yPos);
    }
  }
  
  // Axe X (ligne de base)
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  const baselineY = chartY + chartHeight;
  doc.line(chartX, baselineY, chartX + width - chartPadding * 2, baselineY);
  
  // Barres
  data.forEach((value, index) => {
    const barHeight = maxValue > 0 ? (value / maxValue) * chartHeight : 0;
    const barX = chartX + index * (barWidth + 3);
    const barY = baselineY - barHeight;
    
    // Barre avec gradient simulé (barre principale + barre plus claire)
    doc.setFillColor(...color);
    doc.rect(barX, barY, barWidth, barHeight, 'F');
    
    // Ligne de séparation entre barres
    if (index < data.length - 1) {
      doc.setDrawColor(240, 240, 240);
      doc.setLineWidth(0.2);
      doc.line(barX + barWidth + 1.5, chartY, barX + barWidth + 1.5, baselineY);
    }
    
    // Valeur au-dessus de la barre
    if (barHeight > 8) {
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(
        formatNumber(value),
        barX + barWidth / 2,
        barY - 3,
        { align: 'center' }
      );
    }
    
    // Label en dessous
    if (labels && labels[index]) {
      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(
        labels[index],
        barX + barWidth / 2,
        baselineY + 8,
        { align: 'center' }
      );
    }
  });
}

/**
 * Dessine un tableau amélioré avec bordures et style
 */
function drawTable(doc, x, y, headers, rows, columnWidths) {
  const rowHeight = 8;
  const headerHeight = 10;
  
  // En-tête avec style
  doc.setFillColor(245, 245, 245);
  doc.rect(x, y, columnWidths.reduce((a, b) => a + b, 0), headerHeight, 'F');
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(x, y, columnWidths.reduce((a, b) => a + b, 0), headerHeight);
  
  // Lignes verticales
  let currentX = x;
  columnWidths.forEach((width, idx) => {
    if (idx < columnWidths.length - 1) {
      doc.line(currentX + width, y, currentX + width, y + headerHeight);
      currentX += width;
    }
  });
  
  // Texte en-tête
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(40, 40, 40);
  currentX = x + 3;
  headers.forEach((header, idx) => {
    doc.text(header, currentX, y + 7);
    currentX += columnWidths[idx];
  });
  
  // Ligne de séparation
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(x, y + headerHeight, x + columnWidths.reduce((a, b) => a + b, 0), y + headerHeight);
  
  // Rows
  let currentY = y + headerHeight;
  rows.forEach((row, rowIdx) => {
    // Ligne alternée
    if (rowIdx % 2 === 0) {
      doc.setFillColor(252, 252, 252);
      doc.rect(x, currentY, columnWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
    }
    
    // Lignes verticales
    currentX = x;
    columnWidths.forEach((width, idx) => {
      if (idx < columnWidths.length - 1) {
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.3);
        doc.line(currentX + width, currentY, currentX + width, currentY + rowHeight);
        currentX += width;
      }
    });
    
    // Texte des cellules
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(50, 50, 50);
    currentX = x + 3;
    row.forEach((cell, idx) => {
      // Alignement à droite pour les nombres (sauf première colonne)
      if (idx === 0) {
        doc.text(cell, currentX, currentY + 6);
      } else {
        doc.text(cell, currentX + columnWidths[idx] - 3, currentY + 6, { align: 'right' });
      }
      currentX += columnWidths[idx];
    });
    
    // Ligne horizontale
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.3);
    doc.line(x, currentY + rowHeight, x + columnWidths.reduce((a, b) => a + b, 0), currentY + rowHeight);
    
    currentY += rowHeight;
  });
  
  return currentY;
}

/**
 * Génère un rapport PDF quotidien PREMIUM
 */
export async function generateDailyPDF(data, date, options = {}) {
  try {
    const jsPDFModule = await loadJsPDF();
    if (!jsPDFModule || typeof jsPDFModule !== 'function') {
      throw new Error(`Classe jsPDF invalide`);
    }
    
    const doc = new jsPDFModule();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    
    const derived = options?.derived || null;
    
    let yPos = margin;

    // === EN-TÊTE PREMIUM ===
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 55, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont(undefined, 'bold');
    doc.text('RAPPORT GARMIN', pageWidth / 2, 22, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    const dateFormatted = formatDateForPDF(date);
    doc.text(`Quotidien • ${dateFormatted}`, pageWidth / 2, 38, { align: 'center' });
    
    // Jour de la semaine
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayName = dayNames[new Date(date).getDay()];
    doc.setFontSize(10);
    doc.text(dayName, pageWidth / 2, 47, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    yPos = 70;

    // === RECHERCHE DES DONNÉES ===
    let metrics = null;
    if (data.dailyMetrics && data.dailyMetrics[date]) {
      metrics = data.dailyMetrics[date];
    } else {
      const dates = Object.keys(data.dailyMetrics || {}).sort();
      if (dates.length > 0) {
        metrics = data.dailyMetrics[dates[dates.length - 1]];
        date = dates[dates.length - 1];
      }
    }

    if (!metrics && derived) {
      metrics = {};
    }

    const derivedHeartRateStats = derived?.heartRateTimeSeries?.stats || null;
    const derivedBodyBatteryEntry = derived?.bodyBatteryTrend?.data?.find((entry) => entry.date === date) || derived?.bodyBatteryTrend?.data?.[0] || null;
    const derivedStressEntry = derived?.stressTrend?.data?.find((entry) => entry.date === date) || derived?.stressTrend?.data?.[0] || null;
    const derivedSleepEntry = derived?.sleepTrend?.data?.find((entry) => entry.date === date) || derived?.sleepTrend?.data?.[0] || null;
    const derivedRespEntry = derived?.respirationTrend?.data?.find((entry) => entry.date === date) || derived?.respirationTrend?.data?.[0] || null;

    // === MÉTRIQUES PRINCIPALES (Cartes premium) ===
    if (metrics) {
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text('METRIQUES DU JOUR', margin, yPos);
      yPos += 12;
      
      // Extraire toutes les métriques
      const steps = metrics.steps ?? metrics.totalSteps ?? 0;
      const distance = metrics.distance ?? (metrics.totalDistanceMeters ? metrics.totalDistanceMeters / 1000 : 0);
      const calories = extractCalories(metrics);
      const heartRate = extractHeartRate(metrics);

      if (derivedHeartRateStats) {
        heartRate.resting = heartRate.resting || derivedHeartRateStats.resting || 0;
        heartRate.max = heartRate.max || derivedHeartRateStats.max || 0;
        heartRate.avg = heartRate.avg || derivedHeartRateStats.avg || 0;
      }

      if (!metrics.bodyBattery && derivedBodyBatteryEntry && derivedBodyBatteryEntry.bodyBattery !== undefined && derivedBodyBatteryEntry.bodyBattery !== null) {
        metrics.bodyBattery = { current: derivedBodyBatteryEntry.bodyBattery };
      }

      if ((!metrics.stress || metrics.stress.average === undefined) && derivedStressEntry && derivedStressEntry.stress !== null && derivedStressEntry.stress !== undefined) {
        metrics.stress = { average: derivedStressEntry.stress };
      }

      if (!metrics.sleep && derivedSleepEntry) {
        metrics.sleep = {
          duration: derivedSleepEntry.duration ? derivedSleepEntry.duration / 60 : null,
          deepSleep: derivedSleepEntry.deepSleep ? derivedSleepEntry.deepSleep / 60 : null,
          lightSleep: derivedSleepEntry.lightSleep ? derivedSleepEntry.lightSleep / 60 : null,
          remSleep: derivedSleepEntry.remSleep ? derivedSleepEntry.remSleep / 60 : null,
          quality: derivedSleepEntry.quality ?? null
        };
      }

      if (!metrics.respiration && derivedRespEntry) {
        metrics.respiration = {
          awake: {
            min: derivedRespEntry.awakeMin,
            avg: derivedRespEntry.awakeAvg,
            max: derivedRespEntry.awakeMax
          },
          sleep: {
            min: derivedRespEntry.sleepMin,
            avg: derivedRespEntry.sleepAvg,
            max: derivedRespEntry.sleepMax
          }
        };
      }
      
      // Cartes métriques
      const cardSpacing = 8;
      const cardWidth = (contentWidth - 3 * cardSpacing) / 4;
      let cardX = margin;
      
      if (steps > 0) {
        drawMetricCard(doc, cardX, yPos, 'Pas', steps, '', [59, 130, 246]);
        cardX += cardWidth + cardSpacing;
      }
      
      if (distance > 0) {
        drawMetricCard(doc, cardX, yPos, 'Distance', distance, 'km', [16, 185, 129]);
        cardX += cardWidth + cardSpacing;
      }
      
      if (calories.total > 0) {
        drawMetricCard(doc, cardX, yPos, 'Calories', calories.total, 'kcal', [249, 115, 22]);
        cardX += cardWidth + cardSpacing;
      }
      
      if (heartRate.resting > 0) {
        drawMetricCard(doc, cardX, yPos, 'FC Repos', heartRate.resting, 'bpm', [239, 68, 68]);
      }
      
      yPos += 35;
      
      // === SECTION DÉTAILLÉE AMÉLIORÉE ===
      drawDivider(doc, margin, yPos, contentWidth, [180, 180, 180]);
      yPos += 12;
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('DETAILS', margin, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      // Calories détaillées avec style
      if (calories.total > 0 || calories.active > 0) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(249, 115, 22);
        doc.text('CALORIES', margin + 5, yPos);
        yPos += 8;
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text(`Total: ${formatNumber(calories.total)} kcal`, margin + 10, yPos);
        yPos += 7;
        if (calories.active > 0) {
          doc.text(`Actives: ${formatNumber(calories.active)} kcal`, margin + 10, yPos);
          yPos += 7;
        }
        if (calories.resting > 0) {
          doc.text(`Repos: ${formatNumber(calories.resting)} kcal`, margin + 10, yPos);
          yPos += 7;
        }
        yPos += 8;
      }
      
      // Fréquence cardiaque détaillée
      if (heartRate.resting > 0 || heartRate.max > 0 || heartRate.avg > 0) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(239, 68, 68);
        doc.text('FREQUENCE CARDIAQUE', margin + 5, yPos);
        yPos += 8;
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(60, 60, 60);
        
        if (heartRate.resting > 0) {
          doc.text(`Repos: ${heartRate.resting} bpm`, margin + 10, yPos);
          yPos += 7;
        }
        if (heartRate.max > 0) {
          doc.text(`Maximum: ${heartRate.max} bpm`, margin + 10, yPos);
          yPos += 7;
        }
        if (heartRate.avg > 0) {
          doc.text(`Moyenne: ${heartRate.avg} bpm`, margin + 10, yPos);
          yPos += 7;
        }
        yPos += 8;
      }
      
      // Body Battery avec barre visuelle
      if (metrics.bodyBattery) {
        const bbValue = metrics.bodyBattery?.current ?? (typeof metrics.bodyBattery === 'number' ? metrics.bodyBattery : null);
        if (bbValue !== null && bbValue !== undefined && bbValue > 0) {
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(16, 185, 129);
          doc.text('BODY BATTERY', margin + 5, yPos);
          yPos += 8;
          
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(60, 60, 60);
          doc.text(`${bbValue}%`, margin + 10, yPos);
          
          // Barre de progression large
          const barWidth = 60;
          const barHeight = 6;
          const barX = margin + 10;
          const barY = yPos + 3;
          
          // Fond gris
          doc.setFillColor(230, 230, 230);
          doc.rect(barX, barY, barWidth, barHeight, 'F');
          
          // Barre colorée selon niveau
          const color = bbValue >= 70 ? [16, 185, 129] : bbValue >= 50 ? [250, 204, 21] : bbValue >= 30 ? [249, 115, 22] : [239, 68, 68];
          doc.setFillColor(...color);
          doc.rect(barX, barY, (bbValue / 100) * barWidth, barHeight, 'F');
          
          // Bordure
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.3);
          doc.rect(barX, barY, barWidth, barHeight);
          
          yPos += 15;
        }
      }
      
      // Stress
      if (metrics.stress) {
        const stressValue = metrics.stress?.average ?? metrics.stress?.avgStressLevel ?? (typeof metrics.stress === 'number' ? metrics.stress : null);
        if (stressValue !== null && stressValue !== undefined && stressValue > 0) {
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(139, 92, 246);
          doc.text('STRESS', margin + 5, yPos);
          yPos += 8;
          
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(60, 60, 60);
          doc.text(`Moyen: ${stressValue}`, margin + 10, yPos);
          
          // Barre de stress
          const barWidth = 60;
          const barHeight = 6;
          const barX = margin + 10;
          const barY = yPos + 3;
          
          doc.setFillColor(230, 230, 230);
          doc.rect(barX, barY, barWidth, barHeight, 'F');
          
          const color = stressValue <= 25 ? [16, 185, 129] : stressValue <= 50 ? [250, 204, 21] : stressValue <= 75 ? [249, 115, 22] : [239, 68, 68];
          doc.setFillColor(...color);
          doc.rect(barX, barY, (Math.min(stressValue * 2, 100) / 100) * barWidth, barHeight, 'F');
          
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.3);
          doc.rect(barX, barY, barWidth, barHeight);
          
          yPos += 15;
        }
      }
      
      // Sommeil détaillé
      if (metrics.sleep && metrics.sleep.duration) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(99, 102, 241);
        doc.text('SOMMEIL', margin + 5, yPos);
        yPos += 8;
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text(`Duree: ${formatDecimal(metrics.sleep.duration)} h`, margin + 10, yPos);
        yPos += 7;
        if (metrics.sleep.deepSleep) {
          doc.text(`Sommeil profond: ${formatDecimal(metrics.sleep.deepSleep)} h`, margin + 10, yPos);
          yPos += 7;
        }
        if (metrics.sleep.remSleep) {
          doc.text(`REM: ${formatDecimal(metrics.sleep.remSleep)} h`, margin + 10, yPos);
          yPos += 7;
        }
        if (metrics.sleep.lightSleep) {
          doc.text(`Sommeil leger: ${formatDecimal(metrics.sleep.lightSleep)} h`, margin + 10, yPos);
          yPos += 7;
        }
        if (metrics.sleep.quality > 0) {
          doc.text(`Qualite: ${metrics.sleep.quality}/100`, margin + 10, yPos);
          yPos += 7;
        }
        if (metrics.sleep.bedTime) {
          doc.text(`Coucher: ${metrics.sleep.bedTime}`, margin + 10, yPos);
          yPos += 7;
        }
        if (metrics.sleep.wakeTime) {
          doc.text(`Reveil: ${metrics.sleep.wakeTime}`, margin + 10, yPos);
          yPos += 7;
        }
        yPos += 8;
      }
      
      // Activité physique
      if (steps > 0 || distance > 0 || metrics.intensityMinutes) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(59, 130, 246);
        doc.text('ACTIVITE PHYSIQUE', margin + 5, yPos);
        yPos += 8;
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(60, 60, 60);
        
        if (steps > 0) {
          doc.text(`Pas: ${formatNumber(steps)}`, margin + 10, yPos);
          yPos += 7;
        }
        if (distance > 0) {
          doc.text(`Distance: ${formatDecimal(distance)} km`, margin + 10, yPos);
          yPos += 7;
        }
        if (metrics.floors && metrics.floors > 0) {
          doc.text(`Etages: ${formatNumber(metrics.floors)}`, margin + 10, yPos);
          yPos += 7;
        }
        if (metrics.intensityMinutes && metrics.intensityMinutes.total > 0) {
          const intensity = metrics.intensityMinutes;
          doc.text(`Intensite: ${intensity.total} min (moderee: ${intensity.moderate || 0}, soutenue: ${intensity.vigorous || 0})`, margin + 10, yPos);
          yPos += 7;
        }
        yPos += 8;
      }
    } else {
      doc.setFontSize(12);
      doc.setTextColor(150, 150, 150);
      doc.text('Aucune donnee disponible pour cette date', margin, yPos);
      yPos += 20;
    }

    // === ACTIVITÉS ===
    const allActivities = [
      ...(data.activities?.swimming || []),
      ...(data.activities?.jumpRope || []),
      ...(data.activities?.cardio || [])
    ].filter(act => {
      if (!act || !act.date) return false;
      const actDate = act.date.split(' ')[0].split('T')[0];
      return actDate === date || actDate.startsWith(date);
    });

    if (allActivities.length > 0) {
      if (yPos > pageHeight - 100) {
        doc.addPage();
        yPos = margin;
      }
      
      drawDivider(doc, margin, yPos, contentWidth, [180, 180, 180]);
      yPos += 12;
      
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text(`ACTIVITES (${allActivities.length})`, margin, yPos);
      yPos += 15;
      
      // Tableau d'activités amélioré
      const headers = ['Activite', 'Distance', 'Duree', 'Calories', 'FC Moy'];
      const rows = allActivities.map(act => {
        const distance = act.distance ? formatDecimal(act.distance) + ' km' : '-';
        const duration = act.duration ? `${Math.floor(act.duration / 60)} min` : '-';
        const calories = act.calories ? 
          formatNumber(typeof act.calories === 'object' ? (act.calories.total || act.calories.active || 0) : act.calories) : '-';
        const hr = act.avgHR ? `${act.avgHR} bpm` : '-';
        return [
          act.activityName || act.type || 'Activite',
          distance,
          duration,
          calories,
          hr
        ];
      });
      
      const colWidths = [80, 35, 30, 35, 30];
      yPos = drawTable(doc, margin, yPos, headers, rows, colWidths);
      yPos += 10;
    }

    // === PIED DE PAGE ===
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Page ${i}/${pageCount} • Genere le ${formatDateForPDF(new Date().toISOString().split('T')[0])} • Garmin Workout Tracker`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
    }

    return doc.output('blob');
  } catch (error) {
    log.error('Erreur génération PDF quotidien:', error);
    throw error;
  }
}

/**
 * Génère un rapport PDF hebdomadaire PREMIUM
 */
export async function generateWeeklyPDF(data, startDate, endDate, options = {}) {
  try {
    const jsPDFModule = await loadJsPDF();
    if (!jsPDFModule || typeof jsPDFModule !== 'function') {
      throw new Error(`Classe jsPDF invalide`);
    }
    
    const doc = new jsPDFModule();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    
    let yPos = margin;

    const derived = options?.derived || null;

    // === EN-TÊTE PREMIUM ===
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 55, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont(undefined, 'bold');
    doc.text('RAPPORT GARMIN', pageWidth / 2, 22, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(
      `Hebdomadaire • ${formatDateForPDF(startDate)} - ${formatDateForPDF(endDate)}`,
      pageWidth / 2,
      38,
      { align: 'center' }
    );
    
    // Nombre de jours
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    doc.setFontSize(10);
    doc.text(`Periode de ${daysDiff} jours`, pageWidth / 2, 47, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    yPos = 70;

    // === STATISTIQUES GLOBALES ===
    if (data.dailyMetrics) {
      const dates = Object.keys(data.dailyMetrics)
        .filter(d => d >= startDate && d <= endDate)
        .sort();

      if (dates.length > 0) {
        // Calculs avec extraction améliorée
        const metricsArray = dates.map(d => data.dailyMetrics[d]);
        
        const totalSteps = metricsArray.reduce((sum, m) => sum + (m?.steps ?? m?.totalSteps ?? 0), 0);
        const totalDistance = metricsArray.reduce((sum, m) => {
          return sum + (m?.distance ?? (m?.totalDistanceMeters ? m.totalDistanceMeters / 1000 : 0));
        }, 0);
        
        let totalCalories = 0;
        metricsArray.forEach(m => {
          const cal = extractCalories(m);
          totalCalories += cal.total;
        });
        
        const avgSteps = Math.round(totalSteps / dates.length);
        const avgDistance = totalDistance / dates.length;
        const avgCalories = Math.round(totalCalories / dates.length);
        
        // Calcul des moyennes FC
        let totalRestingHR = 0;
        let hrCount = 0;
        metricsArray.forEach(m => {
          const hr = extractHeartRate(m);
          if (hr.resting > 0) {
            totalRestingHR += hr.resting;
            hrCount++;
          }
        });
        const avgRestingHR = hrCount > 0 ? Math.round(totalRestingHR / hrCount) : 0;
        
        // Titre section
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text('RESUME DE LA PERIODE', margin, yPos);
        yPos += 15;
        
        // Cartes de résumé améliorées
        const cardWidth = (contentWidth - 15) / 4;
        const cardSpacing = 5;
        let cardX = margin;
        
        drawMetricCard(doc, cardX, yPos, 'Total Pas', totalSteps, '', [59, 130, 246]);
        cardX += cardWidth + cardSpacing;
        
        drawMetricCard(doc, cardX, yPos, 'Total Distance', totalDistance, 'km', [16, 185, 129]);
        cardX += cardWidth + cardSpacing;
        
        drawMetricCard(doc, cardX, yPos, 'Total Calories', totalCalories, 'kcal', [249, 115, 22]);
        cardX += cardWidth + cardSpacing;
        
        drawMetricCard(doc, cardX, yPos, 'Jours', dates.length, '', [139, 92, 246]);
        
        yPos += 40;
        
        // Moyennes avec style
        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text('Moyennes Quotidiennes', margin, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text(`Pas: ${formatNumber(avgSteps)} / jour`, margin + 5, yPos);
        yPos += 8;
        doc.text(`Distance: ${formatDecimal(avgDistance)} km / jour`, margin + 5, yPos);
        yPos += 8;
        doc.text(`Calories: ${formatNumber(avgCalories)} kcal / jour`, margin + 5, yPos);
        if (avgRestingHR > 0) {
          yPos += 8;
          doc.text(`FC Repos moyenne: ${avgRestingHR} bpm`, margin + 5, yPos);
        }
        yPos += 15;
        
        // Graphique de progression amélioré
        if (dates.length > 1) {
          const stepsData = dates.map(d => {
            const m = data.dailyMetrics[d];
            return m?.steps ?? m?.totalSteps ?? 0;
          });
          
          // Labels de dates courtes
          const dateLabels = dates.map(d => {
            const date = new Date(d);
            return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
          });
          
          // Vérifier si on a assez de place
          if (yPos < pageHeight - 80) {
            drawEnhancedBarChart(
              doc, 
              margin, 
              yPos, 
              contentWidth, 
              60, 
              stepsData, 
              dateLabels, 
              [59, 130, 246],
              'PROGRESSION - PAS QUOTIDIENS'
            );
            yPos += 75;
          }
        }
        
        // Tableau détaillé amélioré
        if (yPos > pageHeight - 120) {
          doc.addPage();
          yPos = margin;
        }
        
        drawDivider(doc, margin, yPos, contentWidth, [180, 180, 180]);
        yPos += 12;
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text('DETAILS QUOTIDIENS', margin, yPos);
        yPos += 15;
        
        // Tableau avec toutes les colonnes
        const headers = ['Date', 'Pas', 'Distance (km)', 'Calories', 'FC Repos'];
        const rows = dates.map(d => {
          const m = data.dailyMetrics[d];
          const steps = m?.steps ?? m?.totalSteps ?? 0;
          const distance = m?.distance ?? (m?.totalDistanceMeters ? m.totalDistanceMeters / 1000 : 0);
          const calories = extractCalories(m);
          const heartRate = extractHeartRate(m);
          const derivedTrendEntry = derived?.heartRateTrend?.data?.find((entry) => entry.date === d);
          const restingValue = heartRate.resting || derivedTrendEntry?.resting || 0;
          
          return [
            formatDateForPDF(d),
            formatNumber(steps),
            formatDecimal(distance),
            formatNumber(calories.total),
            restingValue > 0 ? restingValue.toString() : '-'
          ];
        });
        
        const colWidths = [45, 35, 40, 35, 35];
        yPos = drawTable(doc, margin, yPos, headers, rows, colWidths);
        yPos += 10;
        
        // Statistiques supplémentaires
        if (yPos < pageHeight - 60) {
          drawDivider(doc, margin, yPos, contentWidth, [180, 180, 180]);
          yPos += 12;
          
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text('Statistiques Supplementaires', margin, yPos);
          yPos += 10;
          
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          
          // Meilleur jour
          const bestDay = dates.reduce((best, d) => {
            const m = data.dailyMetrics[d];
            const steps = m?.steps ?? m?.totalSteps ?? 0;
            return steps > (data.dailyMetrics[best]?.steps ?? data.dailyMetrics[best]?.totalSteps ?? 0) ? d : best;
          }, dates[0]);
          const bestSteps = data.dailyMetrics[bestDay]?.steps ?? data.dailyMetrics[bestDay]?.totalSteps ?? 0;
          
          doc.text(`Meilleur jour (pas): ${formatDateForPDF(bestDay)} avec ${formatNumber(bestSteps)} pas`, margin + 5, yPos);
          yPos += 8;
          
          // Jour le plus actif (calories)
          const mostActiveDay = dates.reduce((best, d) => {
            const m = data.dailyMetrics[d];
            const cal = extractCalories(m);
            return cal.total > extractCalories(data.dailyMetrics[best]).total ? d : best;
          }, dates[0]);
          const mostActiveCal = extractCalories(data.dailyMetrics[mostActiveDay]).total;
          doc.text(`Jour le plus actif: ${formatDateForPDF(mostActiveDay)} avec ${formatNumber(mostActiveCal)} kcal`, margin + 5, yPos);
        }
      } else {
        doc.setFontSize(12);
        doc.setTextColor(150, 150, 150);
        doc.text('Aucune donnee disponible pour cette periode', margin, yPos);
        yPos += 20;
      }
    }

    // === PIED DE PAGE ===
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Page ${i}/${pageCount} • Genere le ${formatDateForPDF(new Date().toISOString().split('T')[0])} • Garmin Workout Tracker`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
    }

    return doc.output('blob');
  } catch (error) {
    log.error('Erreur génération PDF hebdomadaire:', error);
    throw error;
  }
}

/**
 * Formatage de date pour PDF (format français simple)
 */
function formatDateForPDF(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
