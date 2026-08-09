import React, { useMemo, useState, useCallback } from 'react';

import { useTranslation } from '../../../../utils/translations';

import BodyMap from '../BodyMap';

import RecapIntensityLegend from '../RecapIntensityLegend';

import RecapMuscleZonesPanel from '../RecapMuscleZonesPanel';

import RecapEnduranceTrophiesCompact from '../RecapEnduranceTrophiesCompact';

import { CARDIO_BLEND, DECAY_LAMBDA_PER_DAY } from '../../../../utils/sport/recapMuscleLoadEngine';

import { RecapSection, RecapDonutChart, RecapHorizontalBars } from '../components/RecapUiBlocks';

import { visualGroupFromMesh } from '../../../../services/anatomy/resolveMeshToAnatomy';

import { recapDisplayRecoveryBand } from '../../../../utils/sport/recapIntensityColors';



const ZONE_COLORS = {

  dos: '#38bdf8',

  lombaires: '#22d3ee',

  hanches: '#a78bfa',

  ischios: '#f472b6',

  quadriceps: '#facc15',

  mollets: '#34d399',

  poitrine: '#fb7185',

  épaules: '#818cf8',

  cou: '#94a3b8',

  thoracique: '#2dd4bf',

  respiration: '#6366f1',

  full: '#64748b'

};



export default function RecapCorpsView({

  recapState,

  period,

  enduranceSessions,

  enrichment,

  onOpenEnduranceCategory

}) {

  const t = useTranslation();

  const [hoverGroupId, setHoverGroupId] = useState(null);

  const onRecapMuscleHover = useCallback((meshName) => {
    if (!meshName) {
      setHoverGroupId(null);
      return;
    }
    setHoverGroupId(visualGroupFromMesh(meshName));
  }, []);

  const onRecapMuscleClick = useCallback((meshName) => {
    const groupId = visualGroupFromMesh(meshName);
    if (!groupId) return;
    document.getElementById(`recap-zone-${groupId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const recapHoverOverlay = useMemo(() => {
    if (!hoverGroupId || !recapState?.byGroup) return null;
    const label = t(`recap.muscleGroup.${hoverGroupId}`, hoverGroupId);
    const reps = Math.round(Number(recapState.repShareByGroup?.[hoverGroupId]) || 0);
    const score = Number(recapState.byGroup[hoverGroupId]?.displayScore) || 0;
    const band = recapDisplayRecoveryBand(score);
    const recovery = t(`recap.zones.recovery.${band}`, band);
    return t('recap.bodyMapHoverLine', {
      label,
      reps: String(reps),
      recovery,
      defaultValue: `${label} — ${reps} reps cochées · ${recovery}`
    });
  }, [hoverGroupId, recapState, t]);

  const vt = recapState?.volumeTotals || {

    strengthReps: 0,

    isoSeconds: 0,

    enduranceMinutes: 0,

    totalExerciseMinutes: 0

  };

  const totalMinRounded = Math.round(Number(vt.totalExerciseMinutes) || 0);

  const cardioPct = Math.round(CARDIO_BLEND * 100);

  const dominantLabel = t(`recap.muscleGroup.${recapState?.dominantGroup}`, recapState?.dominantGroup);



  const pushPull = enrichment?.pushPull;

  const stretchRows = useMemo(() => {

    return (enrichment?.stretchZones?.rows || []).slice(0, 8).map((r) => ({

      key: r.zone,

      label: r.zone,

      value: r.count,

      display: `${r.count} (${r.pct}%)`,

      color: ZONE_COLORS[r.zone] || '#94a3b8'

    }));

  }, [enrichment?.stretchZones]);



  const muscleDonut = useMemo(() => {

    const rows = enrichment?.muscleShareRows?.slice(0, 6) || [];

    const colors = ['#f472b6', '#38bdf8', '#a78bfa', '#34d399', '#fb923c', '#facc15'];

    return rows.map((r, i) => ({

      key: r.groupId,

      label: t(`recap.muscleGroup.${r.groupId}`, r.groupId),

      value: r.reps,

      display: `${r.reps} reps`,

      color: colors[i % colors.length]

    }));

  }, [enrichment?.muscleShareRows, t]);



  return (

    <div className="space-y-5">

      <p className="text-xs text-teal-200/70 leading-relaxed max-w-3xl">

        {t('recap.loadSummary', {

          lambda: String(DECAY_LAMBDA_PER_DAY),

          cardioPct: String(cardioPct)

        })}

      </p>

      <p className="text-xs text-amber-200/90 font-medium">{t('recap.dominant', { label: dominantLabel })}</p>



      <div className="grid gap-4 lg:grid-cols-2 items-start">

        <section className="rounded-xl border border-[#0F4C5C]/70 bg-black p-4">

          <div className="flex flex-wrap items-end justify-between gap-3 mb-3">

            <h2 className="text-sm font-semibold text-teal-100">{t('recap.bodyMapHeading')}</h2>

            <div className="text-right text-[11px] leading-tight text-teal-200/60">

              <div className="font-semibold text-emerald-300/95 tabular-nums">

                {t('recap.bodyMapStats.reps', { n: Math.round(vt.strengthReps || 0) })}

              </div>

              <div className="text-teal-700 mt-0.5">

                {t('recap.bodyMapStats.iso', { s: Math.round(vt.isoSeconds || 0) })}

              </div>

              <div className="text-teal-200/90 tabular-nums mt-0.5">

                {t('recap.bodyMapStats.minutes', { m: totalMinRounded })}

              </div>

            </div>

          </div>

          <BodyMap
            muscleColors={recapState?.meshColors}
            uniformBodyColor={recapState?.uniformBodyColor}
            onMuscleHover={onRecapMuscleHover}
            onMuscleClick={onRecapMuscleClick}
            showHoverOverlay
            defaultViewPreset="frontLow"
            hoverOverlayLabel={recapHoverOverlay}
            hoverOverlayHint={t('recap.bodyMapClickHint', 'Cliquer pour voir les exercices de la zone')}
          />

        </section>



        <section className="rounded-xl border border-[#0F4C5C]/70 bg-black p-4">

          <h2 className="text-sm font-semibold text-teal-100 mb-3">{t('recap.legendHeading')}</h2>

          <RecapIntensityLegend compact />

          <p className="text-xs text-teal-700 mt-4 pt-3 border-t border-[#0F4C5C]/40">

            {t('recap.periodNote', { label: t(`recap.period.${period}`) })}

          </p>

        </section>

      </div>



      {(pushPull?.pushPct != null || muscleDonut.length > 0 || stretchRows.length > 0) && (

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

          {pushPull?.pushPct != null ? (

            <RecapSection title={t('recap.enrichment.pushPull', 'Push / Pull')}>

              <RecapDonutChart

                segments={[

                  { key: 'push', label: 'Push', value: pushPull.push, color: '#f472b6', display: `${pushPull.pushPct}%` },

                  { key: 'pull', label: 'Pull', value: pushPull.pull, color: '#38bdf8', display: `${pushPull.pullPct}%` }

                ]}

                centerLabel={pushPull.ratio != null ? String(pushPull.ratio) : null}

                centerSub="P/P"

              />

            </RecapSection>

          ) : null}

          {muscleDonut.length > 0 ? (

            <RecapSection title={t('recap.enrichment.muscleShare', 'Répartition musculaire')}>

              <RecapDonutChart segments={muscleDonut} centerSub={t('recap.enrichment.reps', 'reps')} />

            </RecapSection>

          ) : null}

          {stretchRows.length > 0 ? (

            <RecapSection

              title={t('recap.enrichment.stretchZones', 'Étirements par zone')}

              subtitle={t('recap.enrichment.stretchTotal', {

                n: enrichment.stretchZones.total,

                defaultValue: `${enrichment.stretchZones.total} coches`

              })}

            >

              <RecapHorizontalBars rows={stretchRows} />

            </RecapSection>

          ) : null}

        </div>

      )}



      <RecapMuscleZonesPanel recapState={recapState} t={t} accordionDefaultClosed={false} hideTechnicalMetrics />



      <RecapEnduranceTrophiesCompact sessions={enduranceSessions} onOpenCategory={onOpenEnduranceCategory} />

    </div>

  );

}

