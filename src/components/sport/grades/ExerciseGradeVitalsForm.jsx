import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../../../utils/translations';
import {
  resolveExerciseGradeVitals,
  writeExerciseGradeVitalsOverride
} from '../../../services/xp/exerciseGradeVitals';

const SOURCE_LABEL = {
  manual: 'saisie locale',
  impedance: 'impédancemètre (suivi corporel)',
  questionnaire: 'questionnaire profil',
  body_tracking: 'pesée (suivi corporel)',
  default: 'valeurs par défaut'
};

export default function ExerciseGradeVitalsForm({ vitals, onSaved }) {
  const t = useTranslation();
  const [weightKg, setWeightKg] = useState(String(vitals?.weightKg ?? ''));
  const [heightCm, setHeightCm] = useState(String(vitals?.heightCm ?? ''));
  const [age, setAge] = useState(String(vitals?.age ?? ''));

  useEffect(() => {
    setWeightKg(String(vitals?.weightKg ?? ''));
    setHeightCm(String(vitals?.heightCm ?? ''));
    setAge(String(vitals?.age ?? ''));
  }, [vitals?.weightKg, vitals?.heightCm, vitals?.age, vitals?.source]);

  const handleSave = useCallback(() => {
    writeExerciseGradeVitalsOverride({
      weightKg: Number(String(weightKg).replace(',', '.')),
      heightCm: Number(String(heightCm).replace(',', '.')),
      age: Number(String(age).replace(',', '.'))
    });
    onSaved?.();
  }, [weightKg, heightCm, age, onSaved]);

  const sourceLabel = SOURCE_LABEL[vitals?.source] || SOURCE_LABEL.default;

  return (
    <section className="rounded-xl border border-[#0F4C5C]/45 bg-black/70 p-4">
      <h3 className="text-sm font-semibold text-white">
        {t('recap.exerciseGrades.vitalsTitle', 'Profil physique')}
      </h3>
      <p className="mt-1 text-[11px] text-slate-500 max-w-2xl">
        {t(
          'recap.exerciseGrades.vitalsIntro',
          'Poids, taille et âge ajustent les seuils (reps, charges, maintiens). Priorité : saisie ci-dessous, puis dernière mesure impédance du suivi corporel, puis le questionnaire profil.'
        )}
      </p>
      <p className="mt-1 text-[10px] text-teal-600/90">
        {t('recap.exerciseGrades.vitalsSource', `Source actuelle : ${sourceLabel}`, { source: sourceLabel })}
        {vitals?.sex
          ? ` · ${t('recap.exerciseGrades.vitalsSex', 'Sexe')}: ${vitals.sex === 'female' ? 'Femme' : vitals.sex === 'male' ? 'Homme' : vitals.sex}`
          : ` · ${t('recap.exerciseGrades.vitalsSexMissing', 'Sexe : questionnaire profil (homme par défaut pour les seuils pompes)')}`}
        {vitals?.usedDefaults
          ? ` · ${t('recap.exerciseGrades.vitalsDefaults', 'complète les champs pour un calcul précis')}`
          : null}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="block text-[11px]">
          <span className="text-slate-400">{t('recap.exerciseGrades.weight', 'Poids (kg)')}</span>
          <input
            type="text"
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-[#0F4C5C]/50 bg-black px-2.5 py-2 text-sm text-white tabular-nums"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
          />
        </label>
        <label className="block text-[11px]">
          <span className="text-slate-400">{t('recap.exerciseGrades.height', 'Taille (cm)')}</span>
          <input
            type="text"
            inputMode="numeric"
            className="mt-1 w-full rounded-lg border border-[#0F4C5C]/50 bg-black px-2.5 py-2 text-sm text-white tabular-nums"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
          />
        </label>
        <label className="block text-[11px]">
          <span className="text-slate-400">{t('recap.exerciseGrades.age', 'Âge')}</span>
          <input
            type="text"
            inputMode="numeric"
            className="mt-1 w-full rounded-lg border border-[#0F4C5C]/50 bg-black px-2.5 py-2 text-sm text-white tabular-nums"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </label>
      </div>
      <button
        type="button"
        onClick={handleSave}
        className="mt-3 rounded-lg bg-[#0F4C5C] px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
      >
        {t('recap.exerciseGrades.vitalsSave', 'Enregistrer pour les grades')}
      </button>
    </section>
  );
}

/** Force re-read vitals after save (parent bump). */
export function useExerciseGradeVitalsRefresh() {
  const [tick, setTick] = useState(0);
  const bump = useCallback(() => setTick((n) => n + 1), []);
  return { tick, bump };
}

export { resolveExerciseGradeVitals };
