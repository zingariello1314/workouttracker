import React, { useMemo } from 'react';
import { PROFILE_QUESTION_DEFS } from '../../../features/profileQuestionnaire/constants';
import { normalizeProfileQuestionnaire } from '../../../features/profileQuestionnaire/schema';

function summarizeValue(q, raw) {
  if (raw == null || (Array.isArray(raw) && raw.length === 0)) return '—';
  if (q.type === 'slider') return `${raw}%`;
  if (q.type === 'days' && Array.isArray(raw)) return raw.join(', ');
  if (q.type === 'vitals' && typeof raw === 'object' && !Array.isArray(raw)) {
    const bits = [];
    if (raw.sex === 'male') bits.push('H');
    else if (raw.sex === 'female') bits.push('F');
    else if (raw.sex === 'other') bits.push('Autre');
    if (raw.age != null) bits.push(`${raw.age} ans`);
    if (raw.weightKg != null) bits.push(`${raw.weightKg} kg`);
    if (raw.heightCm != null) bits.push(`${raw.heightCm} cm`);
    return bits.length ? bits.join(' · ') : '—';
  }
  if (Array.isArray(raw)) {
    const labels = (q.options || []).filter((o) => raw.includes(o.key)).map((o) => o.label);
    return labels.join(', ') || raw.join(', ');
  }
  const opt = (q.options || []).find((o) => o.key === raw);
  return opt?.label || String(raw);
}

/**
 * Récap des réponses quiz : dernier bilan + archives (refaire le quiz depuis Paramètres).
 */
const RecapQuizHistoryPanel = ({ profileQuestionnaireRaw }) => {
  const qq = useMemo(
    () => normalizeProfileQuestionnaire(profileQuestionnaireRaw || null),
    [profileQuestionnaireRaw]
  );

  const history = Array.isArray(qq.quizRoundHistory) ? [...qq.quizRoundHistory].reverse() : [];

  const renderSnapshot = (label, answers, whenIso) => (
    <div
      key={`${label}-${whenIso || 'na'}`}
      className="rounded-xl border border-teal-800/50 bg-black/45 p-4 text-xs text-teal-100/90"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-teal-900/40 pb-2">
        <span className="font-semibold text-teal-200">{label}</span>
        <span className="text-[10px] text-slate-500">
          {whenIso ? new Date(whenIso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
        </span>
      </div>
      <dl className="grid max-h-[320px] gap-x-4 gap-y-1.5 overflow-y-auto sm:grid-cols-2">
        {PROFILE_QUESTION_DEFS.map((q) => (
          <React.Fragment key={q.id}>
            <dt className="text-slate-500">{q.title}</dt>
            <dd className="font-medium text-slate-100">{summarizeValue(q, answers?.[q.id])}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  );

  if (!qq.onboardingWizardCompletedAt && !qq.onboardingSkippedAt && qq.completedCount === 0) {
    return null;
  }

  return (
    <section className="mt-6 rounded-2xl border border-teal-800/40 bg-gradient-to-br from-[#050a0c] via-black to-[#050a0c] p-5 shadow-inner">
      <h3 className="text-base font-bold text-white">Quiz profil — synthèse enregistrée</h3>
      <p className="mt-1 text-[11px] leading-relaxed text-teal-200/75">
        Dernière version utilisée pour les suggestions (programmes, nutrition, coach Récap). Les bilans précédents
        restent visibles ci-dessous si tu as refait le quiz depuis les paramètres.
      </p>
      <div className="mt-4 space-y-4">
        {renderSnapshot('Dernier bilan', qq.answers, qq.lastUpdatedAt)}
        {history.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Historique ({history.length})
            </h4>
            {history.map((snap, idx) =>
              renderSnapshot(`Bilan précédent ${history.length - idx}`, snap.answers, snap.completedAt)
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default RecapQuizHistoryPanel;
