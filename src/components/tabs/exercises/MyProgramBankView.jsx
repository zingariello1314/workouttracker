/**
 * 📋 MY PROGRAM BANK VIEW — Vue "Mon programme" dans l'onglet Banque
 *
 * Affiche TOUS les exercices et TOUS les étirements du programme actif de l'utilisateur,
 * regroupés par jour (vue synthèse). L’édition complète se fait via le bouton « Modifier le programme »
 * dans l’onglet Banque → Mon programme (même écran que l’onglet Programme).
 *
 * Utilise :
 *   • `activeProgram.schedule` (programme custom de l'utilisateur si présent)
 *   • `workoutProgram` par défaut pour l'admin si pas de programme custom actif
 *   • `normalizeStretchSlots` pour résoudre les étirements vers la banque
 *
 * @module MyProgramBankView
 */

import React, { useMemo, useState } from 'react';
import {
  Dumbbell,
  Sparkles,
  Sunrise,
  Sun,
  Sunset,
  Target,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { workoutProgram } from '../../../data/workoutProgram';
import { normalizeStretchSlots, STRETCH_MOMENTS } from '../../../utils/stretchUtils';

const PROGRAM_WEEK_DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const DAY_LABEL = {
  lundi: 'Lundi',
  mardi: 'Mardi',
  mercredi: 'Mercredi',
  jeudi: 'Jeudi',
  vendredi: 'Vendredi',
  samedi: 'Samedi',
  dimanche: 'Dimanche'
};

const MOMENT_META = {
  matin: { label: 'Matin', Icon: Sunrise, color: 'text-amber-300' },
  midi: { label: 'Midi', Icon: Sun, color: 'text-sky-300' },
  soir: { label: 'Soir', Icon: Sunset, color: 'text-indigo-300' }
};

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const r = seconds % 60;
  return r === 0 ? `${m} min` : `${m}m${r}s`;
}

const DayBlock = ({ dayKey, dayData, defaultOpen }) => {
  const [open, setOpen] = useState(defaultOpen);

  const exercises = useMemo(() => {
    const direct = dayData?.exercices || dayData?.exercises || [];
    const variants = [];
    if (dayData?.salleVariants) {
      Object.entries(dayData.salleVariants).forEach(([variantKey, variant]) => {
        const list = variant?.exercises || variant?.exercices || [];
        list.forEach((ex) => variants.push({ ...ex, _variant: variantKey }));
      });
    }
    return { direct, variants };
  }, [dayData]);

  const stretchSlots = useMemo(
    () => normalizeStretchSlots(dayData?.etirements, dayKey),
    [dayData?.etirements, dayKey]
  );

  const totalExos = exercises.direct.length + exercises.variants.length;
  const totalStretches = STRETCH_MOMENTS.reduce(
    (acc, m) => acc + (stretchSlots[m]?.length || 0),
    0
  );
  const isEmpty = totalExos === 0 && totalStretches === 0;

  return (
    <Card variant="sport" className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-4 py-3 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold text-white">{DAY_LABEL[dayKey] || dayKey}</div>
            {dayData?.name && (
              <div className="text-xs text-slate-400 truncate">{dayData.name}</div>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
            <span className="inline-flex items-center gap-1">
              <Dumbbell className="w-3.5 h-3.5 text-blue-400" />
              {totalExos}
            </span>
            <span className="inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              {totalStretches}
            </span>
            {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </div>
      </button>

      {open && (
        <CardContent className="border-t border-slate-800 pt-4 space-y-5">
          {isEmpty && (
            <p className="text-sm text-slate-500 italic">Aucun exercice ni étirement planifié pour ce jour.</p>
          )}

          {totalExos > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-2">
                <Dumbbell className="w-3.5 h-3.5 text-blue-400" />
                Exercices ({totalExos})
              </h4>
              <ul className="space-y-1.5">
                {exercises.direct.map((ex) => (
                  <li
                    key={`direct-${ex.id}`}
                    className="flex items-start justify-between gap-2 px-2.5 py-1.5 rounded bg-slate-900/40 border border-slate-800"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-white truncate">{ex.name || ex.nom}</div>
                      {ex.materiel && (
                        <div className="text-[10px] text-slate-500 truncate">{ex.materiel}</div>
                      )}
                    </div>
                    {ex.series && (
                      <span className="shrink-0 text-[11px] text-teal-300 font-medium tabular-nums">
                        {ex.series}
                      </span>
                    )}
                  </li>
                ))}
                {exercises.variants.map((ex) => (
                  <li
                    key={`var-${ex._variant}-${ex.id}`}
                    className="flex items-start justify-between gap-2 px-2.5 py-1.5 rounded bg-slate-900/30 border border-slate-800/60"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-slate-200 truncate">
                        {ex.name || ex.nom}
                        <span className="ml-1 text-[10px] text-slate-500">[{ex._variant}]</span>
                      </div>
                      {(ex.notes || ex.materiel) && (
                        <div className="text-[10px] text-slate-500 truncate">
                          {ex.materiel || ex.notes}
                        </div>
                      )}
                    </div>
                    {ex.series && (
                      <span className="shrink-0 text-[11px] text-sky-300 font-medium tabular-nums">
                        {ex.series}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {totalStretches > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                Étirements ({totalStretches})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {STRETCH_MOMENTS.map((moment) => {
                  const items = stretchSlots[moment] || [];
                  if (items.length === 0) return null;
                  const meta = MOMENT_META[moment];
                  const { Icon } = meta;
                  return (
                    <div key={moment} className="rounded border border-slate-800 bg-slate-900/30 p-2.5">
                      <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-white">
                        <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                        {meta.label}
                        <span className="text-slate-500 font-normal">({items.length})</span>
                      </div>
                      <ul className="space-y-1">
                        {items.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-center justify-between gap-2 text-[11px] text-slate-300"
                          >
                            <span className="truncate">{item.name}</span>
                            <span className="shrink-0 inline-flex items-center gap-1 text-slate-500">
                              <Clock className="w-3 h-3" />
                              {formatDuration(item.duration)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

const MyProgramBankView = ({ activeProgram, isAdmin }) => {
  // Source : programme custom actif si présent, sinon programme par défaut admin
  const source = useMemo(() => {
    if (activeProgram?.schedule) {
      // Normaliser le programme custom au format unifié
      const out = {};
      PROGRAM_WEEK_DAYS.forEach((day) => {
        const d = activeProgram.schedule[day] || {};
        out[day] = {
          name: d.name,
          focus: d.focus,
          exercices: d.exercices || d.exercises || [],
          etirements: d.etirements,
          salleVariants: d.salleVariants,
          complementaryActivity: d.complementaryActivity
        };
      });
      return { kind: 'active', name: activeProgram.name, days: out };
    }
    if (isAdmin) {
      return { kind: 'default', name: 'Programme par défaut (Cycle 3+1)', days: workoutProgram };
    }
    return { kind: 'none', name: null, days: null };
  }, [activeProgram, isAdmin]);

  if (!source.days) {
    return (
      <Card variant="sport">
        <CardContent className="py-10 text-center space-y-2">
          <Dumbbell className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-slate-400">Aucun programme actif pour le moment.</p>
          <p className="text-xs text-slate-500">
            Active un programme dans l'onglet « Programme » pour voir ici tous ses exercices et étirements regroupés.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Ordre chronologique des jours
  const dayList = PROGRAM_WEEK_DAYS.filter((day) => source.days[day]);

  // Synthèse globale
  const totals = useMemo(() => {
    let exos = 0;
    let stretches = 0;
    dayList.forEach((day) => {
      const d = source.days[day];
      const exList = (d?.exercices || d?.exercises || []).length;
      const variantsList = d?.salleVariants
        ? Object.values(d.salleVariants).reduce((acc, v) => acc + ((v?.exercises || v?.exercices || []).length), 0)
        : 0;
      exos += exList + variantsList;
      const slots = normalizeStretchSlots(d?.etirements, day);
      stretches += STRETCH_MOMENTS.reduce((s, m) => s + (slots[m]?.length || 0), 0);
    });
    return { exos, stretches };
  }, [dayList, source]);

  return (
    <div className="space-y-5">
      <Card variant="sport">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-teal-400" />
            {source.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="rounded bg-slate-900/40 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Source</div>
              <div className="text-sm text-white">
                {source.kind === 'active' ? 'Programme actif' : 'Programme par défaut'}
              </div>
            </div>
            <div className="rounded bg-slate-900/40 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Exercices total</div>
              <div className="text-sm text-blue-300 tabular-nums">{totals.exos}</div>
            </div>
            <div className="rounded bg-slate-900/40 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Étirements total</div>
              <div className="text-sm text-teal-300 tabular-nums">{totals.stretches}</div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Vue synthèse par jour. Pour modifier séries, exos et étirements comme dans l’onglet Programme, utilise le
            bouton « Modifier le programme » au-dessus de cette liste (Banque → Mon programme).
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3">
        {dayList.map((day, idx) => (
          <DayBlock
            key={day}
            dayKey={day}
            dayData={source.days[day]}
            defaultOpen={idx === 0}
          />
        ))}
      </div>
    </div>
  );
};

export default MyProgramBankView;
