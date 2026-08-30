/**
 * 📋 COMPOSANT STRETCH LIST
 *
 * Liste les étirements du jour groupés par moment (matin / midi / soir).
 * Pour CHAQUE moment, on affiche un en-tête + UNE carte par étirement individuel
 * (cf. user requirement : "3 cartes différentes à cocher au lieu d'une seule").
 *
 * Accepte n'importe quel format d'`stretches` brut grâce à `normalizeStretchSlots`.
 *
 * @module StretchList
 */

import React, { memo, useMemo } from 'react';
import { Sun, Cloud, Moon } from 'lucide-react';
import StretchItem from './StretchItem';
import { useStretchTracking } from '../hooks/useStretchTracking';
import { normalizeStretchSlots, STRETCH_MOMENTS } from '../../../../utils/stretchUtils';
import { getDayName } from '../../../../utils/dateUtils';

const MOMENT_META = {
  matin: { label: 'Matin', Icon: Sun, color: 'text-amber-300' },
  midi: { label: 'Midi', Icon: Cloud, color: 'text-sky-300' },
  soir: { label: 'Soir', Icon: Moon, color: 'text-indigo-300' }
};

/**
 * @param {Object} props
 * @param {*} props.stretches - Source brute des étirements (string / objet / tableau)
 * @param {Date} props.date
 */
const StretchList = memo(({ stretches, date, onAfterStretchDataChange }) => {
  const slots = useMemo(() => {
    const dayName = date ? getDayName(date) : null;
    return normalizeStretchSlots(stretches, dayName);
  }, [stretches, date]);

  const isEmpty = STRETCH_MOMENTS.every((m) => slots[m].length === 0);
  if (isEmpty) return null;

  return (
    <div className="today-stretch-cols">
      {STRETCH_MOMENTS.map((moment) => {
        const items = slots[moment];
        if (!items || items.length === 0) return null;
        return (
          <MomentBlock
            key={moment}
            moment={moment}
            items={items}
            date={date}
            onAfterStretchDataChange={onAfterStretchDataChange}
          />
        );
      })}
    </div>
  );
});

StretchList.displayName = 'StretchList';

const MomentBlock = memo(({ moment, items, date, onAfterStretchDataChange }) => {
  const meta = MOMENT_META[moment] || { label: moment, Icon: Sun, color: 'text-slate-400' };
  const { Icon } = meta;
  const ids = useMemo(() => items.map((it) => it.id), [items]);
  const { getMomentSummary } = useStretchTracking({ date });
  const summary = getMomentSummary(moment, ids);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="today-stretch-col-head font-semibold text-white text-sm flex items-center gap-2">
          <Icon className={`w-4 h-4 ${meta.color}`} aria-hidden="true" />
          {meta.label}
          <span className="text-[11px] font-normal text-slate-400">
            ({summary.checked}/{summary.total})
          </span>
        </h4>
        {summary.allChecked && (
          <span className="text-[11px] text-emerald-300">Tous effectués ✓</span>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <StretchItem
            key={`${moment}_${item.id}`}
            item={item}
            date={date}
            onAfterStretchDataChange={onAfterStretchDataChange}
          />
        ))}
      </div>
    </div>
  );
});

MomentBlock.displayName = 'MomentBlock';

export default StretchList;
