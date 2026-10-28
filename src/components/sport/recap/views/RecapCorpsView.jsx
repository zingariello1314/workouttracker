import React, { useMemo, useState, useCallback } from 'react';
import { useTranslation } from '../../../../utils/translations';
import BodyMap from '../BodyMap';
import RecapIntensityLegend from '../RecapIntensityLegend';
import RecapMuscleZonesPanel from '../RecapMuscleZonesPanel';
import RecapEnduranceTrophiesCompact from '../RecapEnduranceTrophiesCompact';
import { CARDIO_BLEND, DECAY_LAMBDA_PER_DAY } from '../../../../utils/sport/recapMuscleLoadEngine';
import { RecapDonutChart, RecapHorizontalBars } from '../components/RecapUiBlocks';
import { visualGroupFromMesh } from '../../../../services/anatomy/resolveMeshToAnatomy';
import { recapDisplayRecoveryBand } from '../../../../utils/sport/recapIntensityColors';

const ZONE_COLORS = {
  dos: '#38bdf8',
  lombaires: '#22d3ee',
  hanches: '#a78bfa',
  ischios: '#f472b6',
  quadriceps: '#facc15',
  mollets: '#5cc3ff',
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
  onOpenEnduranceCategory,
  sceneActive = true
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
  const dominantParts = t('recap.dominant', { label: '___' }).split('___');

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
    const colors = ['var(--a4)', 'var(--a5)', 'var(--a1)', 'var(--a2)', 'var(--a3)', 'var(--d)'];
    return rows.map((r, i) => ({
      key: r.groupId,
      label: t(`recap.muscleGroup.${r.groupId}`, r.groupId),
      value: r.reps,
      display: `${r.reps} reps`,
      color: colors[i % colors.length]
    }));
  }, [enrichment?.muscleShareRows, t]);

  return (
    <div className="rb-corps">
      <section id="c-map">
        <div className="sh">
          <h2>{t('recap.bodyMapHeading')}</h2>
          <span>{t(`recap.period.${period}`)}</span>
        </div>
        <p className="cn">
          {t('recap.loadSummary', {
            lambda: String(DECAY_LAMBDA_PER_DAY),
            cardioPct: String(cardioPct)
          })}
        </p>
        <div className="topz">
          {dominantParts[0]}
          <b>{dominantLabel}</b>
          {dominantParts[1] || null}
        </div>

        <div className="cmap rb-cmap">
          <section className="bdy rb-bdy">
            <h3>{t('recap.bodyMapHeading')}</h3>
            <div className="stt">
              <div style={{ '--c': 'var(--d)' }}>
                <b>{Math.round(vt.strengthReps || 0)}</b>
                <span>{t('recap.bodyMapStats.reps', { n: '' }).trim()}</span>
              </div>
              <div style={{ '--c': 'var(--a1)' }}>
                <b>{Math.round(vt.isoSeconds || 0)}</b>
                <span>{t('recap.bodyMapStats.iso', { s: '' }).trim()}</span>
              </div>
              <div style={{ '--c': 'var(--a5)' }}>
                <b>{totalMinRounded}</b>
                <span>{t('recap.bodyMapStats.minutes', { m: '' }).trim()}</span>
              </div>
            </div>
            <div className="rb-ph">
              <BodyMap
                muscleColors={recapState?.meshColors}
                uniformBodyColor={recapState?.uniformBodyColor}
                onMuscleHover={onRecapMuscleHover}
                onMuscleClick={onRecapMuscleClick}
                showHoverOverlay
                sceneActive={sceneActive}
                defaultViewPreset="frontLow"
                hoverOverlayLabel={recapHoverOverlay}
                hoverOverlayHint={t('recap.bodyMapClickHint', 'Cliquer pour voir les exercices de la zone')}
              />
            </div>
          </section>

          <section className="lgd">
            <h3>{t('recap.legendHeading')}</h3>
            <RecapIntensityLegend compact />
            <p className="per">{t('recap.periodNote', { label: t(`recap.period.${period}`) })}</p>
          </section>
        </div>
      </section>

      {(pushPull?.pushPct != null || muscleDonut.length > 0 || stretchRows.length > 0) && (
        <section id="c-rep">
          <div className="sh">
            <h2>{t('recap.enrichment.shareTitle', 'Répartition')}</h2>
          </div>
          <div className="dnr">
            {pushPull?.pushPct != null ? (
              <article className="dnc pp">
                <h3>{t('recap.enrichment.pushPull', 'Push / Pull')}</h3>
                <RecapDonutChart
                  size={190}
                  segments={[
                    { key: 'push', label: 'Push', value: pushPull.push, color: 'var(--a1)', display: `${pushPull.pushPct}%` },
                    { key: 'pull', label: 'Pull', value: pushPull.pull, color: 'var(--a2)', display: `${pushPull.pullPct}%` }
                  ]}
                  centerLabel={pushPull.ratio != null ? String(pushPull.ratio) : null}
                  centerSub="P/P"
                />
                <div className="split">
                  <i style={{ flex: pushPull.pushPct || 0, background: 'var(--a1)' }} />
                  <i style={{ flex: pushPull.pullPct || 0, background: 'var(--a2)' }} />
                </div>
              </article>
            ) : null}
            {muscleDonut.length > 0 ? (
              <article className="dnc mr">
                <h3>{t('recap.enrichment.muscleShare', 'Répartition musculaire')}</h3>
                <RecapDonutChart size={190} segments={muscleDonut} centerSub={t('recap.enrichment.reps', 'reps')} />
              </article>
            ) : null}
            {stretchRows.length > 0 ? (
              <article className="dnc">
                <h3>
                  {t('recap.enrichment.stretchZones', 'Étirements par zone')}
                  <span>
                    {t('recap.enrichment.stretchTotal', {
                      n: enrichment.stretchZones.total,
                      defaultValue: `${enrichment.stretchZones.total} coches`
                    })}
                  </span>
                </h3>
                <RecapHorizontalBars rows={stretchRows} />
              </article>
            ) : null}
          </div>
        </section>
      )}

      <div id="c-zones">
        <RecapMuscleZonesPanel recapState={recapState} t={t} accordionDefaultClosed={false} hideTechnicalMetrics />
      </div>

      <section id="c-trp">
        <div className="sh">
          <h2>{t('recap.trophies.heading', 'Trophées')}</h2>
        </div>
        <RecapEnduranceTrophiesCompact sessions={enduranceSessions} onOpenCategory={onOpenEnduranceCategory} />
      </section>
    </div>
  );
}
