import React, { useLayoutEffect } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  Activity,
  Target,
  Stethoscope,
  Dumbbell,
  Heart,
  Info
} from 'lucide-react';
import { scrollBankDetailToTop } from '../../../utils/scrollBankDetailToTop';
import {
  PATHOLOGY_BODY_ZONES,
  flattenPathologyItems,
  resolvePathologyItem
} from '../../../data/pathology';
import { useTranslation } from '../../../utils/translations';

const SPORT_SURFACE = 'bg-black ring-1 ring-[#0F5C45]/35';
const SPORT_BORDER = 'border border-[#0F4C5C]/75';

function SectionCard({ title, icon: Icon, children, tone = 'default' }) {
  const toneClass =
    tone === 'warn'
      ? 'border-amber-700/50 bg-amber-950/20'
      : tone === 'tip'
        ? 'border-sky-700/40 bg-sky-950/15'
        : `${SPORT_BORDER} ${SPORT_SURFACE}`;
  return (
    <div className={`rounded-2xl p-4 sm:p-5 space-y-3 ${toneClass}`}>
      <h3 className="text-sm font-bold uppercase tracking-wide text-teal-400/95 flex items-center gap-2">
        {Icon ? <Icon className="w-4 h-4 text-[#58d4aa]" /> : null}
        {title}
      </h3>
      {children}
    </div>
  );
}

function BulletList({ items }) {
  if (!items?.length) return null;
  return (
    <ul className="text-[13px] text-slate-300 space-y-2 list-disc pl-5 leading-relaxed">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

export default function PathologyDetailPage({
  entry,
  sportLabel,
  onBack,
  onOpenExercise,
  onOpenStretch
}) {
  const t = useTranslation();

  useLayoutEffect(() => {
    scrollBankDetailToTop();
  }, [entry?.id]);

  if (!entry) return null;

  const zoneLabel =
    PATHOLOGY_BODY_ZONES.find((z) => z.id === entry.bodyZone)?.label || entry.bodyZone;
  const resolvedItems = flattenPathologyItems(entry);
  const grouped = resolvedItems.reduce((acc, row) => {
    const g = row.group || t('exercisesTab.pathologyTab.prescription.defaultGroup', 'Exercices & soins');
    if (!acc[g]) acc[g] = [];
    acc[g].push(row);
    return acc;
  }, {});

  const isGuide = entry.type === 'guide';

  return (
    <div className="space-y-6 pb-10">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-teal-300 hover:text-teal-100"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('exercisesTab.pathologyTab.back', 'Retour à la banque pathologies')}
      </button>

      <div className={`rounded-2xl ${SPORT_BORDER} ${SPORT_SURFACE} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="rounded-full border border-sky-500/40 bg-sky-950/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-sky-200">
                {sportLabel}
              </span>
              {zoneLabel && (
                <span className="rounded-full border border-violet-500/40 bg-violet-950/30 px-2 py-0.5 text-[10px] text-violet-200">
                  {zoneLabel}
                </span>
              )}
              {entry.difficultRecovery && (
                <span className="rounded-full border border-amber-600/50 bg-amber-950/40 px-2 py-0.5 text-[10px] text-amber-200">
                  {t('exercisesTab.pathologyTab.difficultRecovery', 'Récupération souvent longue')}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">{entry.name}</h2>
            {entry.summary && (
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{entry.summary}</p>
            )}
          </div>
          <Stethoscope className="h-10 w-10 shrink-0 text-teal-600/50" />
        </div>

        {!isGuide && (entry.frequency || entry.recoveryTime) && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
            {entry.frequency && (
              <span className="inline-flex items-center gap-1">
                <Activity className="h-3.5 w-3.5 text-teal-500" />
                {entry.frequency}
              </span>
            )}
            {entry.recoveryTime && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-sky-400" />
                {t('exercisesTab.pathologyTab.recovery', 'Récupération')} : {entry.recoveryTime}
              </span>
            )}
          </div>
        )}
      </div>

      <SectionCard title={t('exercisesTab.pathologyTab.disclaimerTitle', 'Important')} icon={Info} tone="warn">
        <p className="text-[13px] leading-relaxed text-amber-100/90">
          {t(
            'exercisesTab.pathologyTab.disclaimer',
            'Contenu éducatif pour sportifs : il ne remplace pas un diagnostic ni un suivi médical. Consulte un professionnel de santé si la douleur persiste, s’aggrave la nuit ou s’accompagne de signes neurologiques.'
          )}
        </p>
      </SectionCard>

      {entry.symptoms?.length > 0 && (
        <SectionCard title={t('exercisesTab.pathologyTab.symptoms', 'Symptômes')} icon={Target}>
          <BulletList items={entry.symptoms} />
        </SectionCard>
      )}

      {entry.causes?.length > 0 && (
        <SectionCard title={t('exercisesTab.pathologyTab.causes', 'Causes fréquentes')} icon={AlertTriangle}>
          <BulletList items={entry.causes} />
        </SectionCard>
      )}

      {entry.bulletList?.length > 0 && (
        <SectionCard title={t('exercisesTab.pathologyTab.keyPoints', 'Points clés')} icon={Target}>
          <BulletList items={entry.bulletList} />
        </SectionCard>
      )}

      {entry.sections?.map((sec) => (
        <SectionCard key={sec.title} title={sec.title} icon={Dumbbell}>
          <PrescriptionRows
            rows={(sec.items || []).map(resolvePathologyItem).filter(Boolean)}
            onOpenExercise={onOpenExercise}
            onOpenStretch={onOpenStretch}
            t={t}
          />
        </SectionCard>
      ))}

      {Object.keys(grouped).length > 0 && (
        <SectionCard
          title={t('exercisesTab.pathologyTab.prescriptionTitle', 'Rééducation & exercices')}
          icon={Dumbbell}
        >
          {Object.entries(grouped).map(([group, rows]) => (
            <div key={group} className="space-y-2">
              {Object.keys(grouped).length > 1 && (
                <div className="text-[11px] font-semibold uppercase tracking-wide text-teal-500/90">
                  {group}
                </div>
              )}
              <PrescriptionRows
                rows={rows}
                onOpenExercise={onOpenExercise}
                onOpenStretch={onOpenStretch}
                t={t}
              />
            </div>
          ))}
        </SectionCard>
      )}

      {entry.prevention?.length > 0 && (
        <SectionCard title={t('exercisesTab.pathologyTab.prevention', 'Prévention')} icon={Heart} tone="tip">
          <BulletList items={entry.prevention} />
        </SectionCard>
      )}

      {entry.rehabNote && (
        <SectionCard title={t('exercisesTab.pathologyTab.rehabNote', 'À retenir')} icon={Info} tone="tip">
          <p className="text-[13px] leading-relaxed text-slate-300">{entry.rehabNote}</p>
        </SectionCard>
      )}
    </div>
  );
}

function PrescriptionRows({ rows, onOpenExercise, onOpenStretch, t }) {
  if (!rows?.length) return null;
  return (
    <ul className="space-y-2">
      {rows.map((row, i) => {
        const clickable = row.type === 'exercise' || row.type === 'stretch';
        const Tag = clickable ? 'button' : 'div';
        return (
          <li key={`${row.label}-${i}`}>
            <Tag
              type={clickable ? 'button' : undefined}
              onClick={
                clickable
                  ? () => {
                      if (row.type === 'exercise' && row.found) onOpenExercise?.(row.key);
                      if (row.type === 'stretch' && row.found) onOpenStretch?.(row.key);
                    }
                  : undefined
              }
              className={`flex w-full items-start justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-sm ${
                clickable && row.found
                  ? 'border-[#0F4C5C]/60 bg-black hover:border-teal-500/50 hover:bg-teal-950/20 cursor-pointer'
                  : 'border-slate-700/50 bg-slate-950/40'
              }`}
            >
              <div className="min-w-0">
                <div className="font-medium text-white">{row.label}</div>
                {row.description && (
                  <div className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{row.description}</div>
                )}
                {!row.found && row.type !== 'text' && (
                  <div className="mt-1 text-[10px] text-amber-400/80">
                    {t('exercisesTab.pathologyTab.notInBank', 'Non lié à la banque')}
                  </div>
                )}
              </div>
              <div className="shrink-0 text-right">
                {row.dosage && (
                  <div className="font-mono text-[11px] text-teal-300/90">{row.dosage}</div>
                )}
                {row.type === 'exercise' && (
                  <div className="text-[9px] uppercase text-slate-500">
                    {t('exercisesTab.pathologyTab.typeExercise', 'Exercice')}
                  </div>
                )}
                {row.type === 'stretch' && (
                  <div className="text-[9px] uppercase text-slate-500">
                    {t('exercisesTab.pathologyTab.typeStretch', 'Étirement / mobilité')}
                  </div>
                )}
              </div>
            </Tag>
          </li>
        );
      })}
    </ul>
  );
}
