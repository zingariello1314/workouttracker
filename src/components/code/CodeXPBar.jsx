import React, { useMemo } from 'react';
import { Code2, Github } from 'lucide-react';
import { useGlobalXP } from '../../hooks/useGlobalXP';
import { levelProgressFromXpAmount } from '../../utils/xpLevelFromAmount';

/**
 * Niveau et jauge calculés uniquement sur l'XP Code (GitHub + journal + trophées), charte noir / framboise.
 */
const CodeXPBar = () => {
  const { totalXP: globalTotalXp, xpByCategory, details } = useGlobalXP();
  const codeXp = Math.round(xpByCategory?.code ?? 0);
  const br = details?.code?.breakdown;
  const { level: codeLevel, progress: codeProgress } = useMemo(() => levelProgressFromXpAmount(codeXp), [codeXp]);

  const xpOnLevel = codeProgress.xpOnLevel ?? 0;
  const xpForLevel = codeProgress.xpForLevel ?? 1000;
  const xpNeeded = codeProgress.xpNeeded ?? 0;
  const pct = Math.min(100, Math.max(0, codeProgress.percent ?? 0));

  return (
    <div className="rounded-xl border-2 border-rose-500/50 bg-black p-4 shadow-lg shadow-rose-950/30">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <Code2 className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-rose-50">Niveau Code {codeLevel}</span>
              <Github className="h-4 w-4 text-rose-300/70" aria-hidden />
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              XP sur le palier niveau Code {codeLevel} :{' '}
              <span className="font-semibold tabular-nums text-rose-300">
                {xpOnLevel.toLocaleString('fr-FR')}
              </span>
              <span className="text-slate-500"> / </span>
              <span className="tabular-nums text-slate-300">
                {xpForLevel.toLocaleString('fr-FR')}
              </span>{' '}
              <span className="text-slate-500">XP</span>
            </p>
            <p className="mt-1 text-xs text-rose-100/90">
              Encore{' '}
              <span className="font-semibold tabular-nums text-rose-200">
                {xpNeeded.toLocaleString('fr-FR')}
              </span>{' '}
              XP à gagner pour le niveau Code{' '}
              <span className="font-semibold text-rose-50">{codeLevel + 1}</span>.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-start">
          <span className="text-sm text-rose-200/90">
            {codeXp.toLocaleString('fr-FR')} XP Code
          </span>
          <div className="min-w-[9.5rem] rounded-lg border border-rose-500/35 bg-rose-950/25 px-3 py-2 text-right">
            <div className="text-[10px] font-medium uppercase tracking-wide text-rose-200/70">
              Reste jusqu&apos;au niveau Code {codeLevel + 1}
            </div>
            <div className="text-xl font-bold tabular-nums text-rose-200 drop-shadow-[0_0_10px_rgba(251,113,133,0.3)]">
              {xpNeeded.toLocaleString('fr-FR')}{' '}
              <span className="text-sm font-semibold text-rose-100/90">XP</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full border border-rose-500/40 bg-black">
        <div
          className="h-full bg-gradient-to-r from-rose-950 via-rose-600 to-fuchsia-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-rose-200/80">
        <span className="tabular-nums">
          Encore <span className="font-semibold text-rose-100">{xpNeeded.toLocaleString('fr-FR')} XP</span> jusqu&apos;au
          niveau Code {codeLevel + 1}
        </span>
        <span className="text-rose-300/55">{Math.round(pct)} %</span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-rose-100/90">
        <span>
          <span className="text-rose-300/90">Code (total) :</span>{' '}
          <span className="font-medium text-white">{codeXp.toLocaleString('fr-FR')}</span> XP
        </span>
        {br?.githubDerivedXp != null && br.githubDerivedXp > 0 ? (
          <span>
            <span className="text-rose-300/80">dont GitHub :</span>{' '}
            <span className="font-medium text-white">{Number(br.githubDerivedXp).toLocaleString('fr-FR')}</span> XP
          </span>
        ) : null}
        {br?.journalXpBonus != null && br.journalXpBonus > 0 ? (
          <span>
            <span className="text-rose-300/80">dont journal :</span>{' '}
            <span className="font-medium text-white">{Number(br.journalXpBonus).toLocaleString('fr-FR')}</span> XP
          </span>
        ) : null}
        {br?.trophyXpBonus != null && br.trophyXpBonus > 0 ? (
          <span>
            <span className="text-rose-300/80">dont trophées GitHub :</span>{' '}
            <span className="font-medium text-white">{Number(br.trophyXpBonus).toLocaleString('fr-FR')}</span> XP
          </span>
        ) : null}
        {br ? (
          <>
            <span>
              XP des contributions :{' '}
              <span className="font-medium text-white">
                {(Number(br.contributionXpAwarded) || 0).toLocaleString('fr-FR')}
              </span>{' '}
              XP
            </span>
            <span>
              Contributions (tout profil) :{' '}
              <span className="font-medium text-white">
                {(br.totalContributions ?? 0).toLocaleString('fr-FR')}
              </span>
            </span>
            <span>
              Jours actifs :{' '}
              <span className="font-medium text-white">{(br.activeCodingDays ?? 0).toLocaleString('fr-FR')}</span>
            </span>
            <span>
              Streak actuel :{' '}
              <span className="font-medium text-white">{(br.currentStreakDays ?? 0).toLocaleString('fr-FR')}</span> j
              (x{Number(br.streakMultiplier || 1).toFixed(1)})
            </span>
          </>
        ) : null}
        {globalTotalXp > 0 ? (
          <span className="text-rose-400/60">
            (Total Momentum : {globalTotalXp.toLocaleString('fr-FR')} XP)
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default CodeXPBar;
