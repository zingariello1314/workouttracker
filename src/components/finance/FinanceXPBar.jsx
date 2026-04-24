/**
 * Barre XP Finance — charte verte #339C5A, même structure que Quêtes / Apprentissage / Code.
 */

import React from 'react';
import { Landmark } from 'lucide-react';
import { useFinanceXP } from '../../hooks/useFinanceXP';
import { FINANCE_XP_PER_LEVEL } from '../../services/xp/financeXpRules';

const fmt = (n) => Math.round(Number(n) || 0).toLocaleString('fr-FR');

const FinanceXPBar = () => {
  const { totalXP, level, breakdown, progress, isLoading } = useFinanceXP();
  const xpOnLevel = progress.xpOnLevel ?? 0;
  const xpForLevel = progress.xpForLevel ?? FINANCE_XP_PER_LEVEL;
  const xpNeeded = progress.xpNeeded ?? 0;
  const pct = Math.min(100, Math.max(0, progress.percent ?? 0));

  const bourseSum =
    (breakdown.bourseBase || 0) +
    (breakdown.bourseInvested || 0) +
    (breakdown.bourseLive || 0);
  const planSum =
    (breakdown.planRepartition || 0) +
    (breakdown.planObjectifs || 0) +
    (breakdown.planSalaire || 0) +
    (breakdown.planLoisirs || 0);
  const investSum = (breakdown.investPatrimoine || 0) + (breakdown.investPositions || 0);
  const budgetSum = (breakdown.budgetDepenses || 0) + (breakdown.budgetCategories || 0);
  const shopSum =
    (breakdown.shoppingLists || 0) +
    (breakdown.shoppingArticles || 0) +
    (breakdown.shoppingDone || 0);

  return (
    <div className="mb-6 rounded-xl border-2 border-[#339C5A]/70 bg-black p-4 shadow-lg shadow-[#0a1812]/80">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-[#7ecfae]" />
          <div className="min-w-0">
            <div className="font-semibold text-[#e8faf0]">Niveau Finance {level}</div>
            <p className="mt-0.5 text-xs text-[#8fbfa3]">
              XP sur le palier niveau {level} :{' '}
              <span className="font-semibold tabular-nums text-[#7ecfae]">
                {fmt(xpOnLevel)}
              </span>
              <span className="text-[#5a8f73]"> / </span>
              <span className="tabular-nums text-[#c8efd9]">{fmt(xpForLevel)}</span>{' '}
              <span className="text-[#5a8f73]">XP</span>
            </p>
            <p className="mt-1 text-xs text-[#c8efd9]/95">
              Encore <span className="font-semibold tabular-nums text-[#d4f5e6]">{fmt(xpNeeded)}</span> XP pour le
              niveau Finance <span className="font-semibold text-white">{level + 1}</span>.
            </p>
            {isLoading ? (
              <p className="mt-1 text-[11px] text-[#6a9e86]">Mise à jour des sources…</p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-start">
          <span className="text-sm text-[#c8efd9]/95">{fmt(totalXP)} XP Finance</span>
          <div className="min-w-[9.5rem] rounded-lg border border-[#339C5A]/40 bg-[#0a1812]/90 px-3 py-2 text-right">
            <div className="text-[10px] font-medium uppercase tracking-wide text-[#7ecfae]/80">
              Reste jusqu&apos;au niveau {level + 1}
            </div>
            <div className="text-xl font-bold tabular-nums text-[#d4f5e6] drop-shadow-[0_0_10px_rgba(51,156,90,0.35)]">
              {fmt(xpNeeded)} <span className="text-sm font-semibold text-[#e8faf0]/90">XP</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full border border-[#1e6b47]/70 bg-black">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#1e6b47] via-[#339C5A] to-[#7ecfae] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-[#8fbfa3]">
        <span className="tabular-nums">
          Encore <span className="font-semibold text-[#d4f5e6]">{fmt(xpNeeded)} XP</span> jusqu&apos;au niveau{' '}
          {level + 1}
        </span>
        <span className="text-[#6a9e86]">{Math.round(pct)} %</span>
      </div>

      <p className="mb-2 text-[11px] leading-snug text-[#6a9e86]">
        L&apos;XP récompense les actions sur tous les sous-onglets (bourse, budget, investissements, planificateur,
        courses, calendrier via le budget). Courbes en √ et log pour rester motivant au début sans exploser sur les
        gros montants.
      </p>

      <div className="grid grid-cols-1 gap-2 text-[11px] text-[#c8efd9]/90 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-[#1e6b47]/55 bg-black/80 px-2 py-1.5">
          <div className="font-semibold text-[#7ecfae]">Bourse</div>
          <div className="tabular-nums text-[#8fbfa3]">
            +{fmt(breakdown.bourseBase)} positions · +{fmt(breakdown.bourseInvested)} encours · +{fmt(breakdown.bourseLive)}{' '}
            cours live
          </div>
          <div className="text-[#d4f5e6]">Σ {fmt(bourseSum)} XP</div>
        </div>
        <div className="rounded-lg border border-[#1e6b47]/55 bg-black/80 px-2 py-1.5">
          <div className="font-semibold text-[#7ecfae]">Planificateur</div>
          <div className="tabular-nums text-[#8fbfa3]">
            +{fmt(breakdown.planRepartition)} répartition · +{fmt(breakdown.planObjectifs)} objectifs · +{fmt(breakdown.planSalaire)} salaire · +{fmt(breakdown.planLoisirs)} loisirs
          </div>
          <div className="text-[#d4f5e6]">Σ {fmt(planSum)} XP</div>
        </div>
        <div className="rounded-lg border border-[#1e6b47]/55 bg-black/80 px-2 py-1.5">
          <div className="font-semibold text-[#7ecfae]">Investissements</div>
          <div className="tabular-nums text-[#8fbfa3]">
            +{fmt(breakdown.investPatrimoine)} valorisation · +{fmt(breakdown.investPositions)} lignes
          </div>
          <div className="text-[#d4f5e6]">Σ {fmt(investSum)} XP</div>
        </div>
        <div className="rounded-lg border border-[#1e6b47]/55 bg-black/80 px-2 py-1.5">
          <div className="font-semibold text-[#7ecfae]">Budget</div>
          <div className="tabular-nums text-[#8fbfa3]">
            +{fmt(breakdown.budgetDepenses)} dépenses · +{fmt(breakdown.budgetCategories)} catégories
          </div>
          <div className="text-[#d4f5e6]">Σ {fmt(budgetSum)} XP</div>
        </div>
        <div className="rounded-lg border border-[#1e6b47]/55 bg-black/80 px-2 py-1.5 sm:col-span-2 lg:col-span-1">
          <div className="font-semibold text-[#7ecfae]">Smart Shopping</div>
          <div className="tabular-nums text-[#8fbfa3]">
            +{fmt(breakdown.shoppingLists)} listes · +{fmt(breakdown.shoppingArticles)} articles · +{fmt(breakdown.shoppingDone)} terminées
          </div>
          <div className="text-[#d4f5e6]">Σ {fmt(shopSum)} XP</div>
        </div>
      </div>
    </div>
  );
};

export default FinanceXPBar;
