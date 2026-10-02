/**
 * Le repos effectif prime sur le jour écrit dans le programme :
 * un déplacement choisi par l'utilisateur pour la semaine en cours a le dernier mot.
 */
import { flattenStretchItems, normalizeStretchSlots } from '../stretchUtils';
import { getEffectiveRestDayForDate, getRestDaySwapForWeek, getWeekStartKey } from '../restDayUtils';

const WEEK_FROM_JS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export function weekDayKeyFromYmd(ymd) {
  const [y, m, d] = String(ymd || '').split('-').map(Number);
  if (!y || !m || !d) return '';
  return WEEK_FROM_JS[new Date(y, m - 1, d).getDay()] || '';
}

function stretchNames(program, dayName) {
  if (!program || !dayName) return [];
  const raw = program.schedule?.[dayName]?.etirements;
  const slots = normalizeStretchSlots(raw, dayName);
  const names = flattenStretchItems(slots)
    .map((item) => String(item?.name || '').trim())
    .filter((name) => name && name !== 'Étirement');
  return [...new Set(names)].slice(0, 4);
}

/**
 * @returns {{ title: string, body: string, evidence: string } | null}
 */
export function describeRestDay({ program, snapshot, date } = {}) {
  if (!program || !date) return null;
  const day = weekDayKeyFromYmd(date);
  const effective = getEffectiveRestDayForDate({ program, data: snapshot, date });
  if (!day || !effective || day !== effective) return null;
  const weekKey = getWeekStartKey(date);
  const swap = getRestDaySwapForWeek(snapshot, program.id, weekKey);
  const moved = Boolean(swap && swap.toDay === day && swap.fromDay && swap.fromDay !== day);
  const onToday = stretchNames(program, day);
  const fromOrigin = moved ? stretchNames(program, swap.fromDay) : [];
  const stretches = onToday.length ? onToday : fromOrigin;
  const movedBit = moved
    ? `Tu as déplacé le repos sur ${day} pour cette semaine, à la place du ${swap.fromDay} écrit dans le programme.`
    : `${day.charAt(0).toUpperCase()}${day.slice(1)} est le jour de repos retenu.`;
  const stretchBit = stretches.length
    ? ` À côté de l'entraînement, ${stretches.length > 1 ? 'des étirements sont prévus' : 'un étirement est prévu'} : ${stretches.join(', ')}. Le repos est le moment de les faire.`
    : ` Rien d'autre n'est prévu sur ce repos : pas d'étirement à côté de l'entraînement.`;
  return {
    title: "Aujourd'hui est un jour de repos",
    body: `${movedBit}${stretchBit}`,
    evidence: moved ? `repos déplacé ${swap.fromDay} → ${day}` : `repos ${day}`
  };
}
