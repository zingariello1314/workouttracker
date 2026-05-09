/**
 * Saisie impédance minimale depuis l’onglet Nutrition (programme généré).
 * Enregistre une entrée progress `type: impedance` comme le formulaire complet.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Scale, Calendar } from 'lucide-react';
import Button from '../../../ui/Button';
import Input from '../../../ui/Input';
import { validateImpedanceForm } from '../../../BodyTracking/utils/validation';

const defaultDate = () => new Date().toISOString().slice(0, 10);

export default function ImpedanceQuickCapture({ addProgressEntry, onSuccess }) {
  const [form, setForm] = useState({
    date: defaultDate(),
    weight: '',
    heightCm: '',
    chronologicalAge: '',
    bodyFatPercentage: ''
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const formPayload = useMemo(
    () => ({
      ...form,
      bmi: '',
      muscleMass: '',
      bodyFatMass: '',
      bodyFatIndex: '',
      obesityLevel: '',
      visceralFatIndex: '',
      fatFreeWeight: '',
      bodyWater: '',
      boneMass: '',
      proteinPercentage: '',
      basalMetabolism: '',
      metabolicAge: '',
      bodyType: '',
      notes: 'Saisie rapide depuis Nutrition (programme généré)'
    }),
    [form]
  );

  const submit = useCallback(async () => {
    const v = validateImpedanceForm(formPayload, [], { skipDuplicateCheck: true, skipConsistencyCheck: false });
    setErrors(v.errors);
    if (!v.isValid || !addProgressEntry) return;

    setSaving(true);
    try {
      const entry = {
        ...formPayload,
        timestamp: new Date(form.date).getTime(),
        type: 'impedance'
      };
      const stringKeys = new Set(['date', 'notes', 'bodyType', 'timestamp', 'basalMetabolismSource', 'type']);
      Object.keys(entry).forEach((key) => {
        if (stringKeys.has(key) || entry[key] === '' || entry[key] == null) return;
        if (key === 'chronologicalAge') {
          entry[key] = Math.round(parseFloat(entry[key]));
          return;
        }
        if (key === 'heightCm' || key === 'weight' || key === 'bmi') {
          entry[key] = parseFloat(entry[key]);
          return;
        }
        if (key === 'bodyFatPercentage' && entry[key] !== '') {
          entry[key] = parseFloat(entry[key]);
        }
      });

      await addProgressEntry(entry);
      onSuccess?.(entry);
      setForm((prev) => ({
        ...prev,
        weight: '',
        bodyFatPercentage: ''
      }));
      setErrors({});
    } finally {
      setSaving(false);
    }
  }, [addProgressEntry, formPayload, onSuccess]);

  return (
    <div className="rounded-lg border border-teal-700/50 bg-slate-900/70 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-teal-100">
        <Scale className="h-4 w-4 text-sky-400" />
        Mesure impédance (minimale)
      </div>
      <p className="text-[11px] text-slate-400">
        Pour un programme généré par l’app, enregistre au moins une mesure avec poids, taille et âge réel — les
        lignes détaillées de l’impédancemètre restent optionnelles ici.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div>
          <label className="text-[10px] text-slate-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Date
          </label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="mt-0.5 bg-slate-800 border-slate-600 text-white text-sm"
          />
          {errors.date && <p className="text-red-400 text-[10px] mt-0.5">{errors.date}</p>}
        </div>
        <div>
          <label className="text-[10px] text-slate-500">Poids (kg)</label>
          <Input
            type="number"
            step="0.05"
            value={form.weight}
            onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
            className="mt-0.5 bg-slate-800 border-slate-600 text-white text-sm"
          />
          {errors.weight && <p className="text-red-400 text-[10px] mt-0.5">{errors.weight}</p>}
        </div>
        <div>
          <label className="text-[10px] text-slate-500">Taille (cm)</label>
          <Input
            type="number"
            value={form.heightCm}
            onChange={(e) => setForm((f) => ({ ...f, heightCm: e.target.value }))}
            className="mt-0.5 bg-slate-800 border-slate-600 text-white text-sm"
          />
          {errors.heightCm && <p className="text-red-400 text-[10px] mt-0.5">{errors.heightCm}</p>}
        </div>
        <div>
          <label className="text-[10px] text-slate-500">Âge réel</label>
          <Input
            type="number"
            step="1"
            value={form.chronologicalAge}
            onChange={(e) => setForm((f) => ({ ...f, chronologicalAge: e.target.value }))}
            className="mt-0.5 bg-slate-800 border-slate-600 text-white text-sm"
          />
          {errors.chronologicalAge && <p className="text-red-400 text-[10px] mt-0.5">{errors.chronologicalAge}</p>}
        </div>
        <div>
          <label className="text-[10px] text-slate-500">% graisse (opt.)</label>
          <Input
            type="number"
            step="0.1"
            value={form.bodyFatPercentage}
            onChange={(e) => setForm((f) => ({ ...f, bodyFatPercentage: e.target.value }))}
            className="mt-0.5 bg-slate-800 border-slate-600 text-white text-sm"
          />
          {errors.bodyFatPercentage && <p className="text-red-400 text-[10px] mt-0.5">{errors.bodyFatPercentage}</p>}
        </div>
      </div>
      <Button type="button" disabled={saving} className="text-sm bg-teal-600 hover:bg-teal-700 text-white" onClick={submit}>
        {saving ? 'Enregistrement…' : 'Enregistrer la mesure'}
      </Button>
    </div>
  );
}
