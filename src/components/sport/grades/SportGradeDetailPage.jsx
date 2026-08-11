import React, { useEffect, useMemo } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../../../utils/translations';
import {
  SPORT_GRADE_IDS,
  gateForGradeId,
  tierRowsForGrade,
  gradeIndex,
  SPORT_GRADE_ACCENT
} from '../../../services/xp/sportGradeCatalog';
import { cumulXpForLevel } from '../../../services/xp/sportLevelCurve';
import { evaluateGateProgress } from '../../../services/xp/sportGradeResolution';
import SportGradeEmblem from './SportGradeEmblem';
import { sportGradeLabel, sportPalierLabel } from './SportGradeIdentity';
import {
  RECAP_GRADE_DETAIL_FOCUS_ID,
  scrollToRecapGradeDetail
} from '../../../utils/sport/recapGradesScroll';

const PATH_KEYS = ['A', 'B', 'C', 'D'];

function PathRow({ pathKey, data, passedPath, t }) {
  if (!data) return null;
  const pct = Math.round(data.pct ?? 0);
  const isWinningPath = passedPath === pathKey;
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        data.met
          ? 'border-emerald-500/35 bg-emerald-950/25'
          : isWinningPath
            ? 'border-teal-500/40 bg-teal-950/20'
            : 'border-[#0F4C5C]/40 bg-black/60'
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-teal-100/90">
          <span className="text-teal-500/90 font-bold mr-1">{pathKey}</span>
          {data.label}
        </span>
        {data.met ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden />
        ) : (
          <span className="text-[10px] tabular-nums text-slate-400">{pct} %</span>
        )}
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
        <div
          className={`h-full transition-all ${data.met ? 'bg-emerald-500' : 'bg-cyan-600'}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] text-slate-500 tabular-nums">
        {Number(data.current).toLocaleString('fr-FR')} / {Number(data.target).toLocaleString('fr-FR')}
        {!data.met && pct < 100 ? (
          <span className="text-slate-600">
            {' '}
            ·{' '}
            {t('recap.grades.detailPathRemaining', '{{n}} restants', {
              n: Math.max(0, Number(data.target) - Number(data.current)).toLocaleString('fr-FR')
            })}
          </span>
        ) : null}
      </p>
    </div>
  );
}

function PathERow({ paths, passed, pathEThresholdPct = 70, pathsRequired = 1, pathsFullCount = 0, t }) {
  if (!paths) return null;
  const minPct = Math.min(...PATH_KEYS.map((k) => paths[k]?.pct ?? 0));
  const met =
    passed?.ok &&
    (passed?.path === 'E' || passed?.path === 'multi' || passed?.path === 'all')
      ? true
      : pathsRequired >= 4
        ? PATH_KEYS.every((k) => (paths[k]?.pct ?? 0) >= 100)
        : pathsRequired >= 2
          ? pathsFullCount >= 2 || minPct >= pathEThresholdPct
          : PATH_KEYS.every((k) => (paths[k]?.pct ?? 0) >= pathEThresholdPct);
  const displayPct = Math.round(Math.min(100, minPct));
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        met ? 'border-emerald-500/35 bg-emerald-950/25' : 'border-amber-600/30 bg-amber-950/15'
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-amber-100/90">
          <span className="text-amber-500/90 font-bold mr-1">E</span>
          {pathsRequired >= 4
            ? t(
                'recap.grades.detailPathEFinal',
                'Polyvalence (4 voies à 100 % ou ≥ {{pct}} % partout)',
                { pct: pathEThresholdPct }
              )
            : pathsRequired >= 2
              ? t(
                  'recap.grades.detailPathEPenultimate',
                  'Polyvalence (2 voies à 100 % ou ≥ {{pct}} % partout)',
                  { pct: pathEThresholdPct }
                )
              : t(
                  'recap.grades.detailPathE',
                  'Polyvalence (≥ {{pct}} % sur A, B, C et D)',
                  { pct: pathEThresholdPct }
                )}
        </span>
        {met ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden />
        ) : (
          <span className="text-[10px] tabular-nums text-slate-400">{displayPct} % min</span>
        )}
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
        <div
          className={`h-full transition-all ${met ? 'bg-emerald-500' : 'bg-amber-600/80'}`}
          style={{ width: `${Math.min(100, minPct)}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] text-slate-500">
        {t(
          'recap.grades.detailPathEProgress',
          'Axe le plus en retard : {{pct}} % (objectif {{target}} % sur chaque voie)',
          { pct: displayPct, target: pathEThresholdPct }
        )}
      </p>
      {pathsRequired >= 2 ? (
        <p className="mt-0.5 text-[10px] text-slate-600">
          {t('recap.grades.detailPathsFull', 'Voies complètes : {{n}} / {{required}}', {
            n: pathsFullCount,
            required: pathsRequired
          })}
        </p>
      ) : null}
    </div>
  );
}

/** Page détail d’un grade (Récap → Grades), illustration portrait + infos à droite. */
export default function SportGradeDetailPage({
  gradeId,
  onBack,
  level,
  totalXP,
  masteryScore,
  aggregates,
  workoutData,
  grades
}) {
  const t = useTranslation();

  useEffect(() => {
    scrollToRecapGradeDetail();
  }, [gradeId]);

  const detail = useMemo(() => {
    if (!gradeId) return null;
    const tiers = tierRowsForGrade(gradeId);
    const idx = gradeIndex(gradeId);
    const meritedId = grades?.merited?.gradeId ?? 'novice';
    const progId = grades?.progression?.gradeId ?? 'novice';
    const merIdx = gradeIndex(meritedId);
    const gate = gateForGradeId(gradeId);
    const gateHist = grades?.gateHistory?.find((h) => h.toGradeId === gradeId);
    const meritGate = gradeId === 'novice' ? gateForGradeId('adepte') : gate;
    const gateProgress = meritGate
      ? evaluateGateProgress(meritGate, masteryScore, aggregates, workoutData)
      : null;
    const nextTierInGrade = tiers.find((row) => level < row.levelMin);
    const nextTierXp = nextTierInGrade ? nextTierInGrade.cumulXp : null;

    let status = 'future';
    if (level < (tiers[0]?.levelMin ?? 1)) {
      status = 'future';
    } else if (gradeId === progId && gradeId === meritedId) {
      status = 'both';
    } else if (gradeId === progId) {
      status = 'progression';
    } else if (idx <= merIdx && (gateHist?.passed || idx === 0)) {
      status = 'merited';
    } else if (idx === merIdx + 1 && level >= (gate?.levelMin ?? 0)) {
      status = 'blocked';
    } else if (idx <= merIdx) {
      status = 'merited';
    }

    return {
      tiers,
      gate,
      gateHist,
      meritGate,
      gateProgress,
      nextTierInGrade,
      nextTierXp,
      status,
      idx
    };
  }, [gradeId, level, totalXP, masteryScore, aggregates, workoutData, grades]);

  if (!gradeId || !detail) return null;

  const accent = SPORT_GRADE_ACCENT[gradeId] || '#2dd4bf';
  const statusLabel = {
    merited: t('recap.grades.detailStatusMerited', 'Grade mérité obtenu'),
    progression: t('recap.grades.detailStatusProgression', 'Grade de progression (niveau)'),
    both: t('recap.grades.detailStatusBoth', 'Progression & grade mérité'),
    blocked: t('recap.grades.detailStatusBlocked', 'Niveau OK — preuve d’activité manquante'),
    future: t('recap.grades.detailStatusFuture', 'Grade à venir')
  }[detail.status] || '';

  const meritGate = detail.meritGate;
  const gateProgress = detail.gateProgress;
  const passedPath = detail.gateHist?.passed ? detail.gateHist.path : gateProgress?.passed?.path;
  const meritGateTitle =
    gradeId === 'novice'
      ? t('recap.grades.detailGateNextTitle', 'Frontière suivante : {{grade}}', {
          grade: sportGradeLabel('adepte', t)
        })
      : t('recap.grades.detailGateTitle', 'Accès au grade (grade mérité)');

  return (
    <div className="space-y-4 pb-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-lg border border-[#0F4C5C]/50 bg-black/60 px-3 py-2 text-sm font-medium text-teal-100 hover:bg-[#0F4C5C]/25 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" />
        {t('recap.grades.detailBack', 'Retour au parcours des grades')}
      </button>

      <div
        id={RECAP_GRADE_DETAIL_FOCUS_ID}
        className="flex flex-col gap-5 scroll-mt-28 lg:flex-row lg:items-start lg:gap-6"
      >
        <div className="mx-auto w-full max-w-[300px] shrink-0 lg:mx-0 lg:sticky lg:top-4">
          <div
            className="overflow-hidden rounded-2xl border border-[#0F4C5C]/55 bg-black/90 shadow-lg"
            style={{ boxShadow: `0 12px 40px -16px ${accent}55` }}
          >
            <SportGradeEmblem gradeId={gradeId} layout="detail" className="border-0 !max-w-none w-full" />
          </div>
          <div className="mt-3 text-center lg:text-left">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {sportGradeLabel(gradeId, t)}
            </h1>
            <p className="mt-0.5 text-sm text-teal-400/90">{statusLabel}</p>
            <p className="mt-1 text-[11px] text-slate-500 tabular-nums">
              {t('recap.grades.detailXpLine', '{{xp}} XP cumulés · Niveau {{level}}', {
                xp: (totalXP ?? 0).toLocaleString('fr-FR'),
                level
              })}
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <section className="rounded-xl border border-[#0F4C5C]/45 bg-black/70 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-teal-600 mb-2">
              {t('recap.grades.detailTiersTitle', 'Paliers (niveau & XP)')}
            </h2>
            <ul className="space-y-1.5">
              {detail.tiers.map((row) => {
                const reached = level >= row.levelMin;
                const isProg =
                  grades?.progression?.gradeId === gradeId && grades?.progression?.tier === row.tier;
                return (
                  <li
                    key={row.tier}
                    className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                      isProg
                        ? 'border-emerald-500/40 bg-emerald-950/20'
                        : reached
                          ? 'border-[#0F4C5C]/40 bg-black/40'
                          : 'border-slate-800/80 bg-black/20 text-slate-500'
                    }`}
                  >
                    <span className="font-medium text-teal-100/90">{sportPalierLabel(row.tier, t)}</span>
                    <span className="tabular-nums text-slate-400 text-xs">
                      {t('recap.grades.detailTierReq', 'Niv. {{n}} · {{xp}} XP', {
                        n: row.levelMin,
                        xp: row.cumulXp.toLocaleString('fr-FR')
                      })}
                    </span>
                    {reached ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden />
                    ) : null}
                  </li>
                );
              })}
            </ul>
            {detail.nextTierInGrade ? (
              <p className="mt-2 text-xs text-amber-200/85">
                {t('recap.grades.detailNextTier', 'Prochain palier ici : niveau {{n}} ({{xp}} XP cumulés)', {
                  n: detail.nextTierInGrade.levelMin,
                  xp: detail.nextTierXp?.toLocaleString('fr-FR')
                })}
                {' — '}
                {t('recap.grades.detailXpRemaining', '{{left}} XP restants', {
                  left: Math.max(0, (detail.nextTierXp ?? 0) - (totalXP ?? 0)).toLocaleString('fr-FR')
                })}
              </p>
            ) : (
              <p className="mt-2 text-xs text-emerald-400/90">
                {t('recap.grades.detailTiersMax', 'Tous les paliers de ce grade sont débloqués par le niveau.')}
              </p>
            )}
          </section>

          {meritGate && gateProgress ? (
            <section className="rounded-xl border border-amber-600/25 bg-amber-950/10 p-4 space-y-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-600/90">
                  {meritGateTitle}
                </h2>
                <p className="mt-1 text-[11px] text-slate-500">
                  {t(
                    'recap.grades.detailGateHint',
                    'En plus du niveau minimum, une voie A, B, C, D ou E (70 % partout) valide le passage.'
                  )}
                </p>
              </div>
              <p className="text-sm text-slate-300">
                {t('recap.grades.nextGateLevel', 'Niveau minimum : {{n}} (actuel : {{level}})', {
                  n: meritGate.levelMin,
                  level
                })}
                {level >= meritGate.levelMin ? (
                  <span className="text-emerald-400 ml-1">✓</span>
                ) : (
                  <span className="text-slate-500 ml-1">
                    —{' '}
                    {t('recap.grades.detailLevelXp', '{{xp}} XP cumulés requis', {
                      xp: cumulXpForLevel(meritGate.levelMin).toLocaleString('fr-FR')
                    })}
                  </span>
                )}
              </p>
              {detail.gateHist?.passed && gradeId !== 'novice' ? (
                <p className="text-sm text-emerald-400">
                  {t('recap.grades.gateOk', 'Validé (voie {{path}})', { path: detail.gateHist.path })}
                </p>
              ) : null}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {t('recap.grades.detailPathsTitle', 'Tes voies — où tu en es')}
                </p>
                {PATH_KEYS.map((key) => (
                  <PathRow
                    key={key}
                    pathKey={key}
                    data={gateProgress.paths[key]}
                    passedPath={passedPath}
                    t={t}
                  />
                ))}
                <PathERow
                  paths={gateProgress.paths}
                  passed={gateProgress.passed}
                  pathEThresholdPct={gateProgress.pathEThresholdPct ?? 70}
                  pathsRequired={gateProgress.pathsRequired ?? 1}
                  pathsFullCount={gateProgress.pathsFullCount ?? 0}
                  t={t}
                />
              </div>
            </section>
          ) : null}

          {detail.idx < SPORT_GRADE_IDS.length - 1 ? (
            <p className="text-xs text-slate-500 px-1">
              {t('recap.grades.detailNextGrade', 'Grade suivant')} :{' '}
              <span className="text-teal-200/90 font-medium">
                {sportGradeLabel(SPORT_GRADE_IDS[detail.idx + 1], t)}
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
