import { useEffect, useRef } from 'react';
import { useBudget } from '../../../hooks/useBudget';
import { planificateurStorage } from '../../../services/finance/planificateurStorage';
import { syncBudgetPersonnelFromPlanificateurData } from '../../../services/finance/budgetPlanificateurBridge';
import { sidebarEvents, SIDEBAR_EVENTS } from '../../../utils/sidebarEvents';
import logger from '../../../utils/logger';

const log = logger.module('BudgetPersonnelSyncListener');

/**
 * Écoute les changements planificateur (répartition / salaire) et rafraîchit le budget personnel.
 */
const BudgetPersonnelSyncListener = () => {
  const { forceRefresh } = useBudget();
  const timerRef = useRef(null);

  useEffect(() => {
    const runSync = async () => {
      try {
        const [repartition, salaire] = await Promise.all([
          planificateurStorage.getRepartition(),
          planificateurStorage.getSalaire()
        ]);
        if (!repartition) return;
        const net = salaire?.netMensuel ?? 0;
        const r = await syncBudgetPersonnelFromPlanificateurData(repartition, net);
        if (r.budgetUpdated || r.categoriesUpdated > 0) {
          await forceRefresh();
        }
      } catch (e) {
        log.warn('[BudgetPersonnelSyncListener] Sync:', e);
      }
    };

    const schedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(runSync, 250);
    };

    schedule();

    const unsub = sidebarEvents.on(SIDEBAR_EVENTS.FINANCE_UPDATED, (payload) => {
      if (payload?.type === 'repartition' || payload?.type === 'salaire') {
        schedule();
      }
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      unsub();
    };
  }, [forceRefresh]);

  return null;
};

export default BudgetPersonnelSyncListener;
