/**
 * Relie un fait déjà mesuré au reste de la même fenêtre.
 * Chaque phrase ne sort que si le chiffre existe. Rien n'est inventé.
 */
import { inferMuscleLoadRolesForExercise } from './recapMuscleInference';

export function primaryGroup(name) {
  return primaryOf(name)[0] || null;
}

function primaryOf(name) {
  const roles = inferMuscleLoadRolesForExercise({ name });
  return (roles?.primary || []).filter((group) => group && group !== 'full_body');
}

function sharesGroup(a, b) {
  const left = primaryOf(a)[0];
  const right = primaryOf(b)[0];
  return Boolean(left && right && left === right);
}

function pct(part, whole) {
  if (!whole) return null;
  return ((part / whole) * 100).toFixed(1).replace('.', ',');
}

function oneParameter(setBit) {
  return /restent du même ordre|reste le même/.test(setBit || '');
}

export function sameDayCompanions(exercise, exercisesByDate) {
  const dates = exercise?.dates
    ? [...exercise.dates]
    : Object.keys(exercisesByDate || {}).filter((date) =>
        (exercisesByDate[date] || []).some((other) => String(other.id) === String(exercise?.id))
      );
  const found = new Map();
  dates.forEach((date) => {
    (exercisesByDate?.[date] || []).forEach((other) => {
      if (!other || String(other.id) === String(exercise.id)) return;
      if ((other.reps || 0) < 24) return;
      if (!sharesGroup(exercise.name, other.name)) return;
      const prev = found.get(String(other.id));
      if (!prev || other.reps > prev.reps) found.set(String(other.id), { ...other, date });
    });
  });
  return [...found.values()].sort((a, b) => b.reps - a.reps).slice(0, 2);
}

export function writeExerciseEvent({
  exercise,
  totalReps,
  emerging,
  gapDays,
  companions,
  setBit,
  voice = 'week',
  groupReps = null,
  groupLabel = '',
  pushReps = 0,
  backReps = 0,
  peer = null
}) {
  const reps = exercise?.reps || 0;
  const name = String(exercise?.name || 'ce mouvement');
  const shareLabel = pct(reps, totalReps);
  const shareBit = shareLabel != null && reps / (totalReps || 1) >= 0.03 ? `, soit ${shareLabel} % des répétitions de la fenêtre` : '';
  const hold =
    voice === 'today'
      ? 'la prochaine fois'
      : voice === 'week'
        ? 'sur 2 ou 3 séances'
        : voice === 'month'
          ? 'sur plusieurs séances avant de changer la dose'
          : 'avant d’en faire une base sur cette longue plage';
  const status = emerging
    ? `Premier enregistrement de ${name.toLowerCase()} : ${reps} répétitions${shareBit}. Il n'y a aucun historique avant cette fenêtre : ce chiffre fixe le point de départ, il ne dit pas si tu progresses.`
    : `${name} revient${gapDays != null ? ` après ${gapDays} jours` : ''} avec ${reps} répétitions${shareBit}. Ce n'est pas encore une nouvelle norme : c'est le volume du retour.`;
  const ofGroup =
    groupReps > reps && groupLabel
      ? ` Ces ${reps} répétitions font ${pct(reps, groupReps)} % des ${groupReps} répétitions de ${groupLabel} de la fenêtre.`
      : '';
  const pullNote =
    pushReps >= 80 && backReps > 0 && pushReps > backReps * 1.6 && /face pull|tirage|traction|rowing/i.test(name)
      ? ` La fenêtre compte ${pushReps} répétitions de poussée contre ${backReps} au dos : ce retour est l'un des tirages qui équilibrent.`
      : '';
  const together = companions?.length
    ? ` Le même jour, ${companions
        .map((other) => `${other.reps} répétitions de ${String(other.name).toLowerCase()}`)
        .join(' et ')} portent sur le même muscle principal${
        companions[0]?.date ? ` (le ${companions[0].date.split('-').reverse().join('/')})` : ''
      }. Si la séance suivante baisse sur l'un, regarde d'abord la fatigue de l'autre.`
    : '';
  const pair = peer
    ? ` ${peer.name} revient aussi dans la même fenêtre (${peer.reps} répétitions), sur le même groupe. Les deux ne se lisent pas comme deux progrès séparés.`
    : '';
  const step = oneParameter(setBit)
    ? ` Un seul paramètre a bougé, les répétitions par série ou le nombre de séries, pas les deux. Le garder ${hold} avant d'en changer un autre laisse la comparaison lisible.`
    : emerging
      ? ` La prochaine séance confirme ce départ. Monter tout de suite vers une fois et demie ce total mélangerait l'apprentissage du geste et une dose nouvelle.`
      : gapDays != null && gapDays >= 21
        ? ` Après une absence de cet ordre, répéter ce volume ${hold} dit s'il tient. Le prendre tout de suite pour la nouvelle habitude va plus vite que les données.`
        : '';
  return `${status}${ofGroup}${setBit ? ` ${setBit}` : ''}${together}${pair}${pullNote}${step}`;
}
