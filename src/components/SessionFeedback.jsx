import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquare, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { getDateStr } from '../utils/dateUtils';
import {
  ANSWER_STATES,
  RAPID_QUESTION_IDS,
  getQuestion,
  makeAnswer
} from '../utils/sessionFeedbackCatalog';
import {
  catalogAnswersFromStored
} from '../utils/sessionFeedbackSchema';
import { hasSignificantCatalogAnswers } from '../utils/sessionFeedbackValidate';
import { selectConditionalQuestions } from '../utils/sessionFeedbackConditional';
import { useTranslation } from '../utils/translations';
import FeedbackScaleControl from './sessionFeedback/FeedbackScaleControl';
import FeedbackSegmentControl from './sessionFeedback/FeedbackSegmentControl';
import FeedbackMultiSelect from './sessionFeedback/FeedbackMultiSelect';
import FeedbackCollapsibleSection from './sessionFeedback/FeedbackCollapsibleSection';
import SessionFeedbackSummaryBar from './sessionFeedback/SessionFeedbackSummaryBar';

const EMPTY_CELL = makeAnswer(ANSWER_STATES.NOT_ANSWERED, null);

function cellOrEmpty(answers, id) {
  return answers?.[id] || EMPTY_CELL;
}

function countAnswered(answers, ids) {
  return ids.filter((id) => {
    const c = answers?.[id];
    return (
      c &&
      (c.state === ANSWER_STATES.ANSWERED ||
        c.state === ANSWER_STATES.ABSENT ||
        c.state === ANSWER_STATES.DECLINED)
    );
  }).length;
}

/**
 * Feedback de séance — rapide + détaillé.
 * Logique métier hors React : catalogue + commitCatalogFeedback (via onSave).
 */
const SessionFeedback = ({ isOpen, onClose, onSave, sessionData }) => {
  const t = useTranslation();
  const [answers, setAnswers] = useState(() =>
    catalogAnswersFromStored(sessionData?.existingFeedback)
  );
  const [dirtyKeys, setDirtyKeys] = useState(() => new Set());
  const [showDetailed, setShowDetailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState({
    recovery: true,
    intent: false,
    pain: true,
    context: false,
    notes: false
  });

  useEffect(() => {
    if (!isOpen) return;
    setAnswers(catalogAnswersFromStored(sessionData?.existingFeedback));
    setDirtyKeys(new Set());
    setShowDetailed(false);
    setSaving(false);
    setSections({
      recovery: true,
      intent: false,
      pain: true,
      context: false,
      notes: false
    });
  }, [isOpen, sessionData]);

  const sportContext = sessionData?.sportContext || null;

  const conditionalSelection = useMemo(
    () =>
      selectConditionalQuestions({
        sportContext,
        answers,
        maxPrimary: 1
      }),
    [sportContext, answers]
  );

  const setCell = useCallback((id, cell) => {
    setAnswers((prev) => ({ ...prev, [id]: cell }));
    setDirtyKeys((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const clearCell = useCallback(
    (id) => {
      setCell(id, makeAnswer(ANSWER_STATES.NOT_ANSWERED, null));
    },
    [setCell]
  );

  const painPresence = cellOrEmpty(answers, 'pain_presence');
  const showPainDetails =
    painPresence.state === ANSWER_STATES.ANSWERED && painPresence.value === 'yes';

  const sessionIntent = cellOrEmpty(answers, 'session_intent');
  const showIntentAttained =
    sessionIntent.state === ANSWER_STATES.ANSWERED &&
    sessionIntent.value !== 'none' &&
    sessionIntent.value !== 'unknown';

  const equipmentChanged = cellOrEmpty(answers, 'equipment_changed');
  const showEquipmentNote =
    equipmentChanged.state === ANSWER_STATES.ANSWERED && equipmentChanged.value === 'yes';

  const exerciseOptions = useMemo(() => {
    const list = Array.isArray(sessionData?.exercises) ? sessionData.exercises : [];
    return list
      .filter((ex) => ex?.id != null)
      .map((ex) => ({
        value: String(ex.id),
        labelFr: ex.name || String(ex.id)
      }));
  }, [sessionData?.exercises]);

  const allowedExerciseIds = useMemo(
    () => exerciseOptions.map((o) => o.value),
    [exerciseOptions]
  );

  const canSave = useMemo(() => {
    if (dirtyKeys.size === 0) return false;
    const patch = {};
    for (const key of dirtyKeys) {
      patch[key] = answers[key] || EMPTY_CELL;
    }
    if (hasSignificantCatalogAnswers(patch)) return true;
    // Effacement seul sur un feedback déjà présent
    return Boolean(sessionData?.existingFeedback) && dirtyKeys.size > 0;
  }, [answers, dirtyKeys, sessionData?.existingFeedback]);

  const rapidAnswered = countAnswered(answers, RAPID_QUESTION_IDS);

  const handleSave = async () => {
    if (!canSave || saving) return;
    const sessionDate = sessionData?.date
      ? typeof sessionData.date === 'string'
        ? sessionData.date
        : getDateStr(new Date(sessionData.date))
      : getDateStr(new Date());

    const catalogDraft = {};
    for (const key of dirtyKeys) {
      catalogDraft[key] = answers[key] || EMPTY_CELL;
    }

    const hasLoadSnapshot =
      sessionData?.workoutLoadSnapshot && typeof sessionData.workoutLoadSnapshot === 'object';

    const payload = {
      date: sessionDate,
      catalogDraft,
      catalogContext: { allowedExerciseIds },
      useCatalogCommit: true,
      sessionPayloadVersion: hasLoadSnapshot ? 3 : 2,
      sessionId: sessionData?.id || Date.now(),
      sessionDuration: sessionData?.duration ?? null,
      totalReps:
        typeof sessionData?.totalReps === 'number'
          ? sessionData.totalReps
          : sessionData?.exercises?.reduce((sum, ex) => sum + (parseInt(ex.reps, 10) || 0), 0) ||
            0,
      totalExercises: sessionData?.exercises?.length || 0,
      exercisesSnapshot: Array.isArray(sessionData?.exercises)
        ? sessionData.exercises.map((ex) => ({
            id: ex.id,
            name: ex.name,
            reps: ex.reps,
            completed: ex.completed,
            ...(ex.storageKey ? { storageKey: ex.storageKey } : {}),
            ...(ex.weightEntered != null && String(ex.weightEntered).trim() !== ''
              ? { weightEntered: ex.weightEntered }
              : {}),
            ...(ex.perArm === true ? { perArm: true } : {}),
            ...(Array.isArray(ex.setWeights) && ex.setWeights.length
              ? { setWeights: [...ex.setWeights] }
              : {}),
            ...(Number.isFinite(Number(ex.volumeKg)) ? { volumeKg: Number(ex.volumeKg) } : {})
          }))
        : [],
      ...(hasLoadSnapshot ? { workoutLoadSnapshot: sessionData.workoutLoadSnapshot } : {})
    };

    setSaving(true);
    try {
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (key) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 px-3 pb-4 pt-16 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-feedback-title"
        className="flex w-full max-h-[min(92vh,760px)] max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#0F4C5C]/70 bg-[#05080a] shadow-2xl shadow-black/60"
      >
        <header className="flex items-center justify-between gap-3 border-b border-[#0F4C5C]/40 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <h2
              id="session-feedback-title"
              className="flex items-center gap-2 text-lg font-semibold text-white sm:text-xl"
            >
              <MessageSquare className="shrink-0 text-teal-400" size={20} />
              <span className="truncate">{t('sessionFeedback.title', 'Feedback de séance')}</span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {showDetailed ? 'Détaillé' : 'Rapide'}
              {rapidAnswered > 0 ? ` · ${rapidAnswered}/4 rapides` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#0F4C5C]/45 p-2 text-slate-300 transition hover:border-teal-500/40 hover:bg-[#0F4C5C]/20"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <SessionFeedbackSummaryBar sessionData={sessionData} />

          <div className="space-y-5">
            <section className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-teal-400/90">
                Feedback rapide
              </h3>
              <FeedbackScaleControl
                questionId="experience"
                cell={cellOrEmpty(answers, 'experience')}
                onChange={(c) => setCell('experience', c)}
                onClear={() => clearCell('experience')}
              />
              <FeedbackScaleControl
                questionId="effort"
                cell={cellOrEmpty(answers, 'effort')}
                onChange={(c) => setCell('effort', c)}
                onClear={() => clearCell('effort')}
              />
              <FeedbackScaleControl
                questionId="energy_before"
                cell={cellOrEmpty(answers, 'energy_before')}
                onChange={(c) => setCell('energy_before', c)}
                onClear={() => clearCell('energy_before')}
              />
              <FeedbackSegmentControl
                questionId="pain_presence"
                cell={cellOrEmpty(answers, 'pain_presence')}
                onChange={(c) => setCell('pain_presence', c)}
                onClear={() => clearCell('pain_presence')}
                compact
              />
            </section>

            {conditionalSelection.selected.map((q) => (
              <section
                key={q.id}
                className="space-y-2 rounded-xl border border-teal-500/25 bg-teal-500/5 px-3 py-3"
              >
                {q.justificationFr && (
                  <p className="text-[11px] text-teal-300/80">{q.justificationFr}</p>
                )}
                <FeedbackSegmentControl
                  questionId={q.id}
                  cell={cellOrEmpty(answers, q.id)}
                  promptOverride={q.promptFr}
                  onChange={(c) => setCell(q.id, c)}
                  onClear={() => clearCell(q.id)}
                />
                {Array.isArray(q.limits) && q.limits[0] && (
                  <p className="text-[11px] text-slate-500">{q.limits[0]}</p>
                )}
              </section>
            ))}

            {showPainDetails && !showDetailed && (
              <section className="space-y-3 rounded-xl border border-orange-500/20 bg-orange-500/5 px-3 py-3">
                <p className="text-[11px] text-orange-200/80">
                  Douleur déclarée — précisions facultatives
                </p>
                <FeedbackScaleControl
                  questionId="pain_intensity"
                  cell={cellOrEmpty(answers, 'pain_intensity')}
                  onChange={(c) => setCell('pain_intensity', c)}
                  onClear={() => clearCell('pain_intensity')}
                />
                <FeedbackSegmentControl
                  questionId="pain_region"
                  cell={cellOrEmpty(answers, 'pain_region')}
                  onChange={(c) => setCell('pain_region', c)}
                  onClear={() => clearCell('pain_region')}
                  compact
                />
                <FeedbackSegmentControl
                  questionId="pain_effect"
                  cell={cellOrEmpty(answers, 'pain_effect')}
                  onChange={(c) => setCell('pain_effect', c)}
                  onClear={() => clearCell('pain_effect')}
                  compact
                />
              </section>
            )}

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowDetailed((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-[#0F4C5C]/50 bg-[#0F4C5C]/10 px-4 py-3 text-sm font-medium text-teal-100 transition hover:bg-[#0F4C5C]/20"
              >
                <span>{showDetailed ? 'Masquer les détails' : 'Ajouter des détails'}</span>
                {showDetailed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {showDetailed && (
              <div className="space-y-3">
                <FeedbackCollapsibleSection
                  id="fb-recovery"
                  title="État initial et récupération"
                  open={sections.recovery}
                  onToggle={() => toggleSection('recovery')}
                >
                  <FeedbackScaleControl
                    questionId="motivation_before"
                    cell={cellOrEmpty(answers, 'motivation_before')}
                    onChange={(c) => setCell('motivation_before', c)}
                    onClear={() => clearCell('motivation_before')}
                  />
                  <FeedbackScaleControl
                    questionId="energy_after"
                    cell={cellOrEmpty(answers, 'energy_after')}
                    onChange={(c) => setCell('energy_after', c)}
                    onClear={() => clearCell('energy_after')}
                  />
                  <FeedbackScaleControl
                    questionId="sleep_prev"
                    cell={cellOrEmpty(answers, 'sleep_prev')}
                    onChange={(c) => setCell('sleep_prev', c)}
                    onClear={() => clearCell('sleep_prev')}
                  />
                  <FeedbackSegmentControl
                    questionId="fed_enough"
                    cell={cellOrEmpty(answers, 'fed_enough')}
                    onChange={(c) => setCell('fed_enough', c)}
                    onClear={() => clearCell('fed_enough')}
                  />
                  <FeedbackSegmentControl
                    questionId="hydrated_enough"
                    cell={cellOrEmpty(answers, 'hydrated_enough')}
                    onChange={(c) => setCell('hydrated_enough', c)}
                    onClear={() => clearCell('hydrated_enough')}
                  />
                </FeedbackCollapsibleSection>

                <FeedbackCollapsibleSection
                  id="fb-intent"
                  title="Objectif et déroulement"
                  open={sections.intent}
                  onToggle={() => toggleSection('intent')}
                >
                  <FeedbackSegmentControl
                    questionId="session_intent"
                    cell={cellOrEmpty(answers, 'session_intent')}
                    onChange={(c) => setCell('session_intent', c)}
                    onClear={() => clearCell('session_intent')}
                  />
                  {showIntentAttained && (
                    <FeedbackSegmentControl
                      questionId="intent_attained"
                      cell={cellOrEmpty(answers, 'intent_attained')}
                      onChange={(c) => setCell('intent_attained', c)}
                      onClear={() => clearCell('intent_attained')}
                      compact
                    />
                  )}
                </FeedbackCollapsibleSection>

                {showPainDetails && (
                  <FeedbackCollapsibleSection
                    id="fb-pain"
                    title="Douleur"
                    open={sections.pain}
                    onToggle={() => toggleSection('pain')}
                    badge="déclarée"
                  >
                    <FeedbackScaleControl
                      questionId="pain_intensity"
                      cell={cellOrEmpty(answers, 'pain_intensity')}
                      onChange={(c) => setCell('pain_intensity', c)}
                      onClear={() => clearCell('pain_intensity')}
                    />
                    <FeedbackSegmentControl
                      questionId="pain_region"
                      cell={cellOrEmpty(answers, 'pain_region')}
                      onChange={(c) => setCell('pain_region', c)}
                      onClear={() => clearCell('pain_region')}
                    />
                    <FeedbackSegmentControl
                      questionId="pain_side"
                      cell={cellOrEmpty(answers, 'pain_side')}
                      onChange={(c) => setCell('pain_side', c)}
                      onClear={() => clearCell('pain_side')}
                      compact
                    />
                    <FeedbackSegmentControl
                      questionId="pain_onset"
                      cell={cellOrEmpty(answers, 'pain_onset')}
                      onChange={(c) => setCell('pain_onset', c)}
                      onClear={() => clearCell('pain_onset')}
                    />
                    <FeedbackSegmentControl
                      questionId="pain_effect"
                      cell={cellOrEmpty(answers, 'pain_effect')}
                      onChange={(c) => setCell('pain_effect', c)}
                      onClear={() => clearCell('pain_effect')}
                    />
                    {exerciseOptions.length > 0 && (
                      <FeedbackSegmentControl
                        questionId="pain_exercise"
                        cell={cellOrEmpty(answers, 'pain_exercise')}
                        onChange={(c) => setCell('pain_exercise', c)}
                        onClear={() => clearCell('pain_exercise')}
                        optionsOverride={exerciseOptions}
                      />
                    )}
                  </FeedbackCollapsibleSection>
                )}

                <FeedbackCollapsibleSection
                  id="fb-context"
                  title="Contexte"
                  open={sections.context}
                  onToggle={() => toggleSection('context')}
                >
                  <FeedbackSegmentControl
                    questionId="place"
                    cell={cellOrEmpty(answers, 'place')}
                    onChange={(c) => setCell('place', c)}
                    onClear={() => clearCell('place')}
                    compact
                  />
                  <FeedbackSegmentControl
                    questionId="equipment_changed"
                    cell={cellOrEmpty(answers, 'equipment_changed')}
                    onChange={(c) => setCell('equipment_changed', c)}
                    onClear={() => clearCell('equipment_changed')}
                    compact
                  />
                  {showEquipmentNote && (
                    <FeedbackTextField
                      questionId="equipment_changed_note"
                      cell={cellOrEmpty(answers, 'equipment_changed_note')}
                      onChange={(c) => setCell('equipment_changed_note', c)}
                      onClear={() => clearCell('equipment_changed_note')}
                    />
                  )}
                  <FeedbackSegmentControl
                    questionId="rest_band"
                    cell={cellOrEmpty(answers, 'rest_band')}
                    onChange={(c) => setCell('rest_band', c)}
                    onClear={() => clearCell('rest_band')}
                    compact
                  />
                  <FeedbackSegmentControl
                    questionId="partner"
                    cell={cellOrEmpty(answers, 'partner')}
                    onChange={(c) => setCell('partner', c)}
                    onClear={() => clearCell('partner')}
                    compact
                  />
                  <FeedbackMultiSelect
                    questionId="context_tags"
                    cell={cellOrEmpty(answers, 'context_tags')}
                    onChange={(c) => setCell('context_tags', c)}
                    onClear={() => clearCell('context_tags')}
                  />
                </FeedbackCollapsibleSection>

                <FeedbackCollapsibleSection
                  id="fb-notes"
                  title="Notes et informations secondaires"
                  open={sections.notes}
                  onToggle={() => toggleSection('notes')}
                >
                  <FeedbackTextField
                    questionId="notes"
                    cell={cellOrEmpty(answers, 'notes')}
                    onChange={(c) => setCell('notes', c)}
                    onClear={() => clearCell('notes')}
                    rows={3}
                  />
                  <FeedbackTextField
                    questionId="music"
                    cell={cellOrEmpty(answers, 'music')}
                    onChange={(c) => setCell('music', c)}
                    onClear={() => clearCell('music')}
                  />
                  <FeedbackSegmentControl
                    questionId="weather"
                    cell={cellOrEmpty(answers, 'weather')}
                    onChange={(c) => setCell('weather', c)}
                    onClear={() => clearCell('weather')}
                    compact
                  />
                </FeedbackCollapsibleSection>

              </div>
            )}

          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-[#0F4C5C]/40 bg-black/50 px-4 py-3 sm:px-5">
          <p className="text-[11px] text-slate-500">
            {canSave
              ? 'Enregistrement dès qu’une réponse est renseignée'
              : 'Une réponse suffit pour enregistrer'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#0F4C5C]/50 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              Fermer
            </button>
            <button
              type="button"
              disabled={!canSave || saving}
              onClick={handleSave}
              className={[
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition',
                canSave && !saving
                  ? 'bg-teal-500 text-black hover:bg-teal-400'
                  : 'cursor-not-allowed bg-slate-800 text-slate-500'
              ].join(' ')}
            >
              <Save size={15} />
              {saving ? '…' : 'Enregistrer'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

function FeedbackTextField({ questionId, cell, onChange, onClear, rows = 1 }) {
  const question = getQuestion(questionId);
  if (!question) return null;
  const value =
    cell?.state === ANSWER_STATES.ANSWERED && typeof cell.value === 'string' ? cell.value : '';

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-white leading-snug">{question.promptFr}</p>
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-md px-2 py-1 text-[11px] text-slate-400 hover:bg-white/5 hover:text-white"
          >
            Effacer
          </button>
        )}
      </div>
      {rows > 1 ? (
        <textarea
          value={value}
          rows={rows}
          maxLength={question.value?.maxLength || 2000}
          onChange={(e) => {
            const text = e.target.value;
            if (!text.trim()) {
              onChange(makeAnswer(ANSWER_STATES.NOT_ANSWERED, null));
              return;
            }
            onChange(makeAnswer(ANSWER_STATES.ANSWERED, text));
          }}
          className="w-full rounded-lg border border-[#0F4C5C]/50 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:outline-none"
          placeholder="Facultatif"
        />
      ) : (
        <input
          type="text"
          value={value}
          maxLength={question.value?.maxLength || 200}
          onChange={(e) => {
            const text = e.target.value;
            if (!text.trim()) {
              onChange(makeAnswer(ANSWER_STATES.NOT_ANSWERED, null));
              return;
            }
            onChange(makeAnswer(ANSWER_STATES.ANSWERED, text));
          }}
          className="w-full rounded-lg border border-[#0F4C5C]/50 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:outline-none"
          placeholder="Facultatif"
        />
      )}
    </div>
  );
}

export default SessionFeedback;
