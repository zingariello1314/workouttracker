/**
 * Hook principal pour le module Synthèse Financière
 * Gestion état et calculs optimisés
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import syntheseStorage from '../services/finance/syntheseStorage';
import logger from '../utils/logger';

const log = logger.module('useSynthese');

export const useSynthese = () => {
  const [patrimoine, setPatrimoine] = useState(null);
  const [projections, setProjections] = useState(null);
  const [planEpargne, setPlanEpargne] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chargement initial
  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [patrimoineData, projectionsData, planEpargneData, historiqueData] = await Promise.allSettled([
        syntheseStorage.getPatrimoine(),
        syntheseStorage.getProjections(),
        syntheseStorage.getPlanEpargne(),
        syntheseStorage.getHistorique(30)
      ]);

      if (patrimoineData.status === 'fulfilled') {
        setPatrimoine(patrimoineData.value);
      }
      if (projectionsData.status === 'fulfilled') {
        setProjections(projectionsData.value);
      }
      if (planEpargneData.status === 'fulfilled') {
        setPlanEpargne(planEpargneData.value);
      }
      if (historiqueData.status === 'fulfilled') {
        setHistorique(historiqueData.value);
      }

      log.debug('Synthèse data loaded successfully');
    } catch (err) {
      log.error('Failed to load synthèse data', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calcul Net Worth
  const calculateNetWorth = useCallback((orData, bourseData, cashData) => {
    const orTotal = orData?.valorisation || 0;
    const bourseTotal = bourseData?.valorisation || 0;
    const cashTotal = cashData?.valorisation || 0;

    const totalInvesti = (orData?.capitalInvesti || 0) + (bourseData?.capitalInvesti || 0) + (cashData?.capitalInvesti || 0);
    const totalValorise = orTotal + bourseTotal + cashTotal;
    const plusValue = totalValorise - totalInvesti;
    const plusValuePourcent = totalInvesti > 0 ? (plusValue / totalInvesti) * 100 : 0;

    return {
      investi: totalInvesti,
      valorise: totalValorise,
      plusValue,
      plusValuePourcent
    };
  }, []);

  // Mise à jour patrimoine
  const updatePatrimoine = useCallback(async (newPatrimoine) => {
    try {
      await syntheseStorage.savePatrimoine(newPatrimoine);
      setPatrimoine(newPatrimoine);
      log.debug('Patrimoine updated successfully');
      
      // Recharger historique
      const newHistorique = await syntheseStorage.getHistorique(30);
      setHistorique(newHistorique);
    } catch (err) {
      log.error('Failed to update patrimoine', err);
      throw err;
    }
  }, []);

  // Mise à jour projections
  const updateProjections = useCallback(async (newProjections) => {
    try {
      await syntheseStorage.saveProjections(newProjections);
      setProjections({ scenarios: newProjections });
      log.debug('Projections updated successfully');
    } catch (err) {
      log.error('Failed to update projections', err);
      throw err;
    }
  }, []);

  // Mise à jour plan épargne
  const updatePlanEpargne = useCallback(async (newPlanEpargne) => {
    try {
      await syntheseStorage.savePlanEpargne(newPlanEpargne);
      setPlanEpargne(newPlanEpargne);
      log.debug('Plan épargne updated successfully');
    } catch (err) {
      log.error('Failed to update plan épargne', err);
      throw err;
    }
  }, []);

  // Calcul projections avec scénarios
  const calculateProjections = useCallback((scenario, duree, dcaMensuel) => {
    const { or: tauxOr, bourse: tauxBourse } = scenario;
    const { or: dcaOr, bourse: dcaBourse, cash: dcaCash } = dcaMensuel;

    const mois = duree * 12;
    const projections = [];

    let capitalOr = patrimoine?.or?.capitalInvesti || 0;
    let capitalBourse = patrimoine?.bourse?.capitalInvesti || 0;
    let capitalCash = patrimoine?.cash?.capitalInvesti || 0;

    for (let i = 0; i <= mois; i++) {
      // Ajout DCA
      if (i > 0) {
        capitalOr += dcaOr;
        capitalBourse += dcaBourse;
        capitalCash += dcaCash;
      }

      // Calcul valorisation avec rendement
      const tauxMensuelOr = Math.pow(1 + tauxOr / 100, 1 / 12) - 1;
      const tauxMensuelBourse = Math.pow(1 + tauxBourse / 100, 1 / 12) - 1;

      const valorisationOr = capitalOr * Math.pow(1 + tauxMensuelOr, i);
      const valorisationBourse = capitalBourse * Math.pow(1 + tauxMensuelBourse, i);
      const valorisationCash = capitalCash; // Pas de rendement

      projections.push({
        mois: i,
        annee: i / 12,
        or: valorisationOr,
        bourse: valorisationBourse,
        cash: valorisationCash,
        total: valorisationOr + valorisationBourse + valorisationCash
      });
    }

    return projections;
  }, [patrimoine]);

  // Alertes intelligentes
  const alertes = useMemo(() => {
    if (!patrimoine) return [];

    const alerts = [];
    const total = patrimoine.total.valorise;

    if (total === 0) return alerts;

    // Calcul allocations
    const allocationBourse = (patrimoine.bourse.valorisation / total) * 100;
    const allocationCash = (patrimoine.cash.valorisation / total) * 100;

    // Alerte allocation bourse
    if (allocationBourse < 40) {
      alerts.push({
        type: 'allocation',
        priorite: 'warning',
        message: `Part bourse ${allocationBourse.toFixed(1)}% < 40% : Augmentez ETF`,
        icon: '⚠️'
      });
    }

    // Alerte liquidités
    if (allocationCash > 25) {
      alerts.push({
        type: 'allocation',
        priorite: 'info',
        message: `Liquidités ${allocationCash.toFixed(1)}% > 25% : Investir surplus`,
        icon: '💰'
      });
    }

    // Alerte performance
    if (patrimoine.total.plusValuePourcent < 0) {
      alerts.push({
        type: 'performance',
        priorite: 'error',
        message: `Performance négative ${patrimoine.total.plusValuePourcent.toFixed(1)}% : Revoir stratégie`,
        icon: '📉'
      });
    }

    return alerts;
  }, [patrimoine]);

  // Rafraîchir données
  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    patrimoine,
    projections,
    planEpargne,
    historique,
    alertes,
    loading,
    error,
    calculateNetWorth,
    updatePatrimoine,
    updateProjections,
    updatePlanEpargne,
    calculateProjections,
    refreshData
  };
};
