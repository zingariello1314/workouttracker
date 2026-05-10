import React from 'react';
import { Flame, Heart, Smile, Bone } from 'lucide-react';
import { useTranslation } from '../../../utils/translations';
import { computeGlobalDifficultyPerceived5, computeCategoryMeans } from '../../../utils/exercisePerceivedRatingsModel';

function RessentiSlider({
  label,
  lowHint,
  highHint,
  value,
  readOnly,
  onChange,
  accentClass
}) {
  const v = Number(value) || 0;
  const sliderVal = v > 0 ? v : 1;

  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <span className={`text-[11px] font-medium leading-snug text-slate-200 ${accentClass}`}>{label}</span>
        <span className="text-[10px] text-sky-300/95 tabular-nums shrink-0">{v > 0 ? `${v}/5` : '—'}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-[9px] text-slate-500 max-w-[28%] shrink-0 leading-tight">{lowHint}</span>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          disabled={readOnly}
          value={sliderVal}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`h-2 w-full flex-1 cursor-pointer appearance-none rounded-full bg-[#0F4C5C]/40 accent-sky-500 disabled:opacity-45 disabled:cursor-not-allowed ${
            v <= 0 ? 'opacity-60' : ''
          }`}
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={sliderVal}
        />
      </div>
      <div className="flex justify-between gap-2 text-[9px] text-slate-600 sm:hidden">
        <span className="leading-tight">{lowHint}</span>
        <span className="leading-tight text-right">{highHint}</span>
      </div>
      <div className="hidden sm:flex justify-end text-[9px] text-slate-600 leading-tight">{highHint}</div>
    </div>
  );
}

function SectionBlock({ icon: Icon, iconClass, title, children }) {
  return (
    <div className="rounded-xl border border-[#0F4C5C]/60 bg-black p-4 space-y-4 ring-1 ring-[#0F5C45]/35 shadow-[0_0_22px_-10px_rgba(15,76,92,0.55)]">
      <div className="flex items-center gap-2 border-b border-[#0F5C45]/35 pb-2">
        <Icon className={`h-5 w-5 shrink-0 ${iconClass}`} aria-hidden />
        <h4 className="text-xs font-bold uppercase tracking-wide text-teal-400/95">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function formatMean(m) {
  if (m == null || Number.isNaN(m)) return '—';
  return `${Math.round(m * 10) / 10}/5`;
}

export default function ExercisePerceivedRessentiPanel({ draft, readOnly, onDraftChange }) {
  const t = useTranslation();

  const setKey = (key, n) => {
    const clamped = Math.max(1, Math.min(5, Math.round(Number(n) || 1)));
    onDraftChange({ ...draft, [key]: clamped });
  };

  const globals = computeGlobalDifficultyPerceived5(draft);
  const means = computeCategoryMeans(draft);

  const subHint = t(
    'exercisesTab.detail.perceivedV2.subHint',
    'Glisse chaque curseur — la note globale se calcule automatiquement. Les valeurs neutres (plaisir, revanche) diminuent la difficulté perçue ; effort, fatigue, inconfort augmentent cette note.'
  );

  return (
    <div
      className="rounded-2xl border border-[#0F4C5C]/80 bg-black p-4 sm:p-5 space-y-5 shadow-[0_0_28px_-12px_rgba(15,92,69,0.45)] ring-1 ring-[#0F5C45]/40"
      data-testid="exercise-perceived-ressenti-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h3 className="text-sm font-semibold text-teal-400/95 tracking-tight">
            {t('exercisesTab.detail.perceivedV2.title', 'Mon ressenti sur cet exercice')}
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-xl">{subHint}</p>
        </div>
        <div
          className="shrink-0 rounded-full border border-[#0F4C5C]/65 bg-black px-3 py-1.5 text-[11px] font-semibold text-teal-200/95 tabular-nums shadow-md shadow-black/40 ring-1 ring-[#0F5C45]/40"
          title={t('exercisesTab.detail.perceivedV2.globalTooltip', 'Difficulté perçue (moyenne pondérée des critères renseignés)')}
        >
          {globals != null
            ? t('exercisesTab.detail.perceivedV2.globalBadge', '{{n}} / 5', {
                n: String(Math.round(globals * 10) / 10)
              })
            : t('exercisesTab.detail.perceivedV2.globalEmpty', '— / 5')}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionBlock icon={Flame} iconClass="text-orange-400" title={t('exercisesTab.detail.perceivedV2.blockIntensity', 'Intensité perçue')}>
          <RessentiSlider
            label={t('exercisesTab.detail.perceivedV2.effortGlobal', 'Effort global pendant l’exercice')}
            lowHint={t('exercisesTab.detail.perceivedV2.effortGlobalLow', 'Très facile')}
            highHint={t('exercisesTab.detail.perceivedV2.effortGlobalHigh', 'À la limite')}
            value={draft.effortGlobal}
            readOnly={readOnly}
            onChange={(n) => setKey('effortGlobal', n)}
            accentClass="text-orange-200/90"
          />
          <RessentiSlider
            label={t('exercisesTab.detail.perceivedV2.technicalDifficulty', 'Difficulté technique (coordination, équilibre…)')}
            lowHint={t('exercisesTab.detail.perceivedV2.technicalLow', 'Simple')}
            highHint={t('exercisesTab.detail.perceivedV2.technicalHigh', 'Très technique')}
            value={draft.technicalDifficulty}
            readOnly={readOnly}
            onChange={(n) => setKey('technicalDifficulty', n)}
            accentClass="text-orange-200/90"
          />
        </SectionBlock>

        <SectionBlock icon={Heart} iconClass="text-pink-400" title={t('exercisesTab.detail.perceivedV2.blockRecovery', 'Récupération')}>
          <RessentiSlider
            label={t('exercisesTab.detail.perceivedV2.fatigueAfter', 'Fatigue musculaire après la séance')}
            lowHint={t('exercisesTab.detail.perceivedV2.fatigueLow', 'Aucune')}
            highHint={t('exercisesTab.detail.perceivedV2.fatigueHigh', 'Courbatures intenses')}
            value={draft.fatigueAfter}
            readOnly={readOnly}
            onChange={(n) => setKey('fatigueAfter', n)}
            accentClass="text-pink-200/90"
          />
          <RessentiSlider
            label={t('exercisesTab.detail.perceivedV2.recoveryTime', 'Temps pour récupérer complètement')}
            lowHint={t('exercisesTab.detail.perceivedV2.recoveryTimeLow', "Moins d'un jour")}
            highHint={t('exercisesTab.detail.perceivedV2.recoveryTimeHigh', 'Plus de 3 jours')}
            value={draft.recoveryTime}
            readOnly={readOnly}
            onChange={(n) => setKey('recoveryTime', n)}
            accentClass="text-pink-200/90"
          />
        </SectionBlock>

        <SectionBlock icon={Smile} iconClass="text-emerald-400" title={t('exercisesTab.detail.perceivedV2.blockMotivation', 'Motivation & plaisir')}>
          <RessentiSlider
            label={t('exercisesTab.detail.perceivedV2.pleasure', 'Plaisir à faire cet exercice')}
            lowHint={t('exercisesTab.detail.perceivedV2.pleasureLow', 'Je le déteste')}
            highHint={t('exercisesTab.detail.perceivedV2.pleasureHigh', "J'adore")}
            value={draft.pleasure}
            readOnly={readOnly}
            onChange={(n) => setKey('pleasure', n)}
            accentClass="text-emerald-200/90"
          />
          <RessentiSlider
            label={t('exercisesTab.detail.perceivedV2.wantAgain', 'Envie de le refaire à la prochaine séance')}
            lowHint={t('exercisesTab.detail.perceivedV2.wantAgainLow', "Plutôt l'éviter")}
            highHint={t('exercisesTab.detail.perceivedV2.wantAgainHigh', "Hâte d'y être")}
            value={draft.wantAgain}
            readOnly={readOnly}
            onChange={(n) => setKey('wantAgain', n)}
            accentClass="text-emerald-200/90"
          />
        </SectionBlock>

        <SectionBlock icon={Bone} iconClass="text-amber-400" title={t('exercisesTab.detail.perceivedV2.blockBody', 'Ressenti articulaire & attention musculaire')}>
          <RessentiSlider
            label={t('exercisesTab.detail.perceivedV2.jointDiscomfort', 'Inconfort articulaire pendant l’effort')}
            lowHint={t('exercisesTab.detail.perceivedV2.jointLow', 'Aucun')}
            highHint={t('exercisesTab.detail.perceivedV2.jointHigh', 'Douleur gênante')}
            value={draft.jointDiscomfort}
            readOnly={readOnly}
            onChange={(n) => setKey('jointDiscomfort', n)}
            accentClass="text-amber-200/90"
          />
          <RessentiSlider
            label={t('exercisesTab.detail.perceivedV2.muscleConnection', 'Sensation musculaire ciblée (pump / tension)')}
            lowHint={t('exercisesTab.detail.perceivedV2.muscleConnLow', 'Rien de ressenti')}
            highHint={t('exercisesTab.detail.perceivedV2.muscleConnHigh', 'Connexion parfaite')}
            value={draft.muscleConnection}
            readOnly={readOnly}
            onChange={(n) => setKey('muscleConnection', n)}
            accentClass="text-amber-200/90"
          />
        </SectionBlock>
      </div>

      <div className="rounded-xl border border-[#0F4C5C]/50 bg-black p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
        <div className="text-teal-500/85">
          {t('exercisesTab.detail.perceivedV2.recapIntensity', 'Intensité')} :{' '}
          <span className="text-slate-100 tabular-nums">{formatMean(means.intensity)}</span>
        </div>
        <div className="text-teal-500/85">
          {t('exercisesTab.detail.perceivedV2.recapRecovery', 'Récupération')} :{' '}
          <span className="text-slate-100 tabular-nums">{formatMean(means.recovery)}</span>
        </div>
        <div className="text-teal-500/85">
          {t('exercisesTab.detail.perceivedV2.recapMotivation', 'Motivation')} :{' '}
          <span className="text-slate-100 tabular-nums">{formatMean(means.motivation)}</span>
        </div>
        <div className="text-teal-500/85">
          {t('exercisesTab.detail.perceivedV2.recapBody', 'Ressenti corpo')} :{' '}
          <span className="text-slate-100 tabular-nums">{formatMean(means.bodyFeel)}</span>
        </div>
        <div className="col-span-2 sm:col-span-2 text-teal-400/95 font-semibold pt-1 border-t border-[#0F5C45]/30 sm:border-0 sm:pt-0">
          {t('exercisesTab.detail.perceivedV2.recapGlobal', 'Note globale automatique')} :{' '}
          <span className="tabular-nums text-teal-100">
            {globals != null ? `${Math.round(globals * 10) / 10} / 5` : '—'}
          </span>
        </div>
      </div>

      <p className="text-[10px] text-slate-600">
        {t(
          'exercisesTab.detail.perceivedV2.weightsNote',
          'Chaque critère renseigné influence la note globale avec un poids propre ; plus la moyenne est haute, plus l’exercice est ressenti comme difficile ou coûteux (le plaisir élevé réduit cette difficulté perçue).'
        )}
      </p>
    </div>
  );
}
