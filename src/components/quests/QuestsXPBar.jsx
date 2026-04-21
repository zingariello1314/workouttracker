/**
 * Barre XP dédiée aux quêtes (QuietQuest)
 */

import React, { useMemo, useRef } from 'react';
import { Target, TrendingUp } from 'lucide-react';
import { calculateQuestsXP } from '../../services/xp/xpCalculations';

let questsXpCache = {
  signature: null,
  totalXP: 0,
  percent: 0,
  display: { level: 1, currentXP: 0, xpForNextLevel: 2500 }
};

const QuestsXPBar = ({ userData, validations, allQuests, isLoading = false }) => {
  const cacheRef = useRef({
    total: { signature: null, totalXP: 0 },
    percent: { signature: null, percent: 0 },
    display: { signature: null, value: { level: 1, currentXP: 0, xpForNextLevel: 2500 } }
  });
  const totalXP = useMemo(
    () => {
      const validationsCount = Array.isArray(validations) ? validations.length : 0;
      const validationsXP = Array.isArray(validations)
        ? validations.reduce((sum, v) => sum + (v?.xpGagne || 0), 0)
        : 0;
      const signature = [
        validationsCount,
        validationsXP,
        Array.isArray(allQuests) ? allQuests.length : 0
      ].join('|');

      if (validationsCount === 0 && isLoading && questsXpCache.signature) {
        return questsXpCache.totalXP;
      }
      if (cacheRef.current.total.signature === signature) {
        return cacheRef.current.total.totalXP;
      }
      if (questsXpCache.signature === signature) {
        cacheRef.current.total = { signature, totalXP: questsXpCache.totalXP };
        return questsXpCache.totalXP;
      }

      const value = calculateQuestsXP(validations, allQuests);
      cacheRef.current.total = { signature, totalXP: value };
      questsXpCache = { ...questsXpCache, signature, totalXP: value };
      return value;
    },
    [validations, allQuests, isLoading]
  );

  const display = useMemo(() => {
    const value = {
      level: userData?.level || 1,
      currentXP: userData?.currentXP || 0,
      xpForNextLevel: userData?.xpForNextLevel || 2500
    };
    const signature = `${value.level}|${value.currentXP}|${value.xpForNextLevel}`;

    if (isLoading && questsXpCache.display) {
      return questsXpCache.display;
    }
    if (cacheRef.current.display.signature === signature) {
      return cacheRef.current.display.value;
    }
    cacheRef.current.display = { signature, value };
    questsXpCache = { ...questsXpCache, display: value };
    return value;
  }, [userData, isLoading]);

  const { level, currentXP, xpForNextLevel } = display;
  const percent = useMemo(() => {
    const signature = [currentXP, xpForNextLevel].join('|');
    if (cacheRef.current.percent.signature === signature) {
      return cacheRef.current.percent.percent;
    }
    if (questsXpCache.signature === signature && questsXpCache.percent !== undefined) {
      cacheRef.current.percent = { signature, percent: questsXpCache.percent };
      return questsXpCache.percent;
    }
    const value = xpForNextLevel > 0 ? (currentXP / xpForNextLevel) * 100 : 0;
    cacheRef.current.percent = { signature, percent: value };
    questsXpCache = { ...questsXpCache, signature, percent: value };
    return value;
  }, [currentXP, xpForNextLevel]);

  return (
    <div className="rounded-2xl border-2 border-amber-400/75 bg-black px-6 py-4 shadow-lg shadow-black/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-400" />
          <span className="font-semibold text-amber-50">Niveau {level}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-amber-200/85">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <span>{currentXP.toLocaleString('fr-FR')} XP actuel</span>
        </div>
      </div>

      <div className="w-full h-3 rounded-full bg-black border border-amber-800/45 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 transition-all duration-300 shadow-[0_0_12px_rgba(251,191,36,0.35)]"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-amber-200/75 mt-2">
        <span>{currentXP.toLocaleString('fr-FR')} / {xpForNextLevel.toLocaleString('fr-FR')} XP</span>
        <span>Prochain niveau</span>
      </div>
    </div>
  );
};

export default QuestsXPBar;
