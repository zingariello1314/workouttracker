import React, { useMemo } from 'react';
import { Code2, Github } from 'lucide-react';
import { useGlobalXP } from '../../hooks/useGlobalXP';
import { levelProgressFromXpAmount } from '../../utils/xpLevelFromAmount';

/**
 * Niveau et jauge calculés uniquement sur l’XP Code (GitHub + journal + trophées), charte noir / framboise.
 */
const CodeXPBar = () => {
  const { totalXP: globalTotalXp, xpByCategory, details } = useGlobalXP();
  const codeXp = Math.round(xpByCategory?.code ?? 0);
  const br = details?.code?.breakdown;
  const { level: codeLevel, progress: codeProgress } = useMemo(() => levelProgressFromXpAmount(codeXp), [codeXp]);

  return (
    <div className="rounded-xl border-2 border-rose-500/50 bg-black p-4 shadow-lg shadow-rose-950/30">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-rose-400" />
          <span className="font-semibold text-rose-50">Niveau Code {codeLevel}</span>
          <Github className="h-4 w-4 text-rose-300/70" aria-hidden />
        </div>
        <span className="text-sm text-rose-200/90">{codeXp.toLocaleString('fr-FR')} XP Code</span>
      </div>

      <div className="mb-3 h-2.5 w-full overflow-hidden rounded-full border border-rose-500/40 bg-black">
        <div
          className="h-full bg-gradient-to-r from-rose-950 via-rose-600 to-fuchsia-500 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, codeProgress.percent))}%` }}
        />
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
              Contributions (tout profil) :{' '}
              <span className="font-medium text-white">
                {(br.totalContributions ?? 0).toLocaleString('fr-FR')}
              </span>
            </span>
            <span>
              Jours actifs :{' '}
              <span className="font-medium text-white">{(br.activeCodingDays ?? 0).toLocaleString('fr-FR')}</span>
            </span>
          </>
        ) : null}
        <span className="text-rose-200/70">
          Prochain palier Code : <span className="text-white">{codeProgress.xpNeeded.toLocaleString('fr-FR')}</span> XP
        </span>
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
