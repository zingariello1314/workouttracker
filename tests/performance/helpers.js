/**
 * Helpers pour les tests de performance
 * 
 * Gère le chargement et la sauvegarde des baselines de performance.
 */

import fs from 'fs';
import path from 'path';

const BASELINE_DIR = path.join(process.cwd(), 'logs', 'garmin');
const BASELINE_FILE = path.join(BASELINE_DIR, 'perf-baseline.json');

/**
 * Charge la baseline de performance depuis le fichier
 * 
 * @param {string} metric - Nom de la métrique (tti, chartRender, indexedDBWrite)
 * @returns {number|null} Valeur de la baseline ou null si absente
 */
export async function loadBaseline(metric) {
  try {
    if (!fs.existsSync(BASELINE_FILE)) {
      return null;
    }

    const content = fs.readFileSync(BASELINE_FILE, 'utf-8');
    const baseline = JSON.parse(content);

    return baseline[metric] || null;
  } catch (error) {
    console.warn(`[loadBaseline] Failed to load baseline for ${metric}:`, error.message);
    return null;
  }
}

/**
 * Sauvegarde une baseline de performance
 * 
 * @param {Object} metrics - Objet avec les métriques (tti, chartRender, indexedDBWrite)
 */
export async function saveBaseline(metrics) {
  try {
    // Créer le répertoire si nécessaire
    if (!fs.existsSync(BASELINE_DIR)) {
      fs.mkdirSync(BASELINE_DIR, { recursive: true });
    }

    // Charger la baseline existante ou créer un nouvel objet
    let baseline = {};
    if (fs.existsSync(BASELINE_FILE)) {
      try {
        const content = fs.readFileSync(BASELINE_FILE, 'utf-8');
        baseline = JSON.parse(content);
      } catch (error) {
        console.warn('[saveBaseline] Failed to parse existing baseline, creating new one');
      }
    }

    // Mettre à jour avec les nouvelles métriques
    baseline = {
      ...baseline,
      ...metrics,
      lastUpdated: new Date().toISOString()
    };

    // Sauvegarder
    fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2), 'utf-8');
    console.log(`[saveBaseline] Baseline saved to ${BASELINE_FILE}`);
  } catch (error) {
    console.error('[saveBaseline] Failed to save baseline:', error);
    throw error;
  }
}

/**
 * Calcule le percentile P95 d'un tableau de valeurs
 * 
 * @param {number[]} values - Tableau de valeurs
 * @param {number} percentile - Percentile à calculer (défaut: 95)
 * @returns {number} Valeur du percentile
 */
export function calculatePercentile(values, percentile = 95) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('Values must be a non-empty array');
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Compare une valeur avec la baseline et retourne le résultat
 * 
 * @param {number} value - Valeur actuelle
 * @param {number|null} baseline - Valeur de baseline (null si absente)
 * @param {number} threshold - Seuil de régression en pourcentage (défaut: 10%)
 * @returns {{isRegression: boolean, percentChange: number, message: string}}
 */
export function compareWithBaseline(value, baseline, threshold = 10) {
  if (baseline === null) {
    return {
      isRegression: false,
      percentChange: 0,
      message: 'No baseline available for comparison'
    };
  }

  const percentChange = ((value - baseline) / baseline) * 100;
  const isRegression = percentChange > threshold;

  return {
    isRegression,
    percentChange,
    message: isRegression
      ? `Regression detected: ${percentChange.toFixed(1)}% slower than baseline (${baseline}ms → ${value}ms)`
      : `Performance acceptable: ${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}% vs baseline`
  };
}

