/**
 * Triathlon v6 — blocs natation / vélo en plus de la course (SPEC §6.3).
 */

export const TRIATHLON_MULTISPORT_BLOCKS = new Set([
  'swim_easy',
  'swim_technique',
  'bike_endurance',
  'bike_tempo'
]);

function refreshDayPlan(dayPlan) {
  if (!dayPlan?.blocks?.length) return;
  dayPlan.primaryBlock = dayPlan.blocks[0];
  const groups = new Set();
  dayPlan.blocks.forEach((b) => {
    if (b.startsWith('run_') || b === 'cardio_general' || TRIATHLON_MULTISPORT_BLOCKS.has(b)) {
      groups.add('cardio');
    } else if (b === 'force_legs' || b === 'force_lower') groups.add('lower');
    else if (b === 'force_core') groups.add('core');
    else groups.add('upper');
  });
  dayPlan.groups = [...groups];
  dayPlan.modality = 'cardio';
}

/**
 * @param {string} missionId
 * @param {string|null} weakLeg — swim | bike | run
 */
function cardioBlockPattern(missionId, weakLeg) {
  const base =
    missionId === 'triathlon_sprint'
      ? ['swim_easy', 'bike_endurance', 'run_easy']
      : missionId === 'triathlon_iron' || missionId === 'triathlon_half_iron'
        ? ['swim_technique', 'bike_endurance', 'run_easy', 'run_tempo']
        : ['swim_easy', 'bike_endurance', 'run_easy', 'run_tempo'];

  if (weakLeg === 'swim') return ['swim_technique', 'swim_easy', ...base.filter((b) => !b.startsWith('swim'))];
  if (weakLeg === 'bike') return ['bike_tempo', 'bike_endurance', ...base.filter((b) => !b.startsWith('bike'))];
  return base;
}

/**
 * @param {object} placement
 * @param {string} missionId
 * @param {object} [answers]
 */
export function applyTriathlonMultisportPlacement(placement, missionId, answers = null) {
  if (!placement?.days || !String(missionId || '').startsWith('triathlon_')) return placement;

  const pattern = cardioBlockPattern(missionId, answers?.triathlonWeakLeg || null);
  const dayKeys = Object.keys(placement.days).sort(
    (a, b) => (placement.days[a].dayIndex ?? 0) - (placement.days[b].dayIndex ?? 0)
  );
  const cardioDays = dayKeys.filter((k) => placement.days[k]?.modality === 'cardio');
  let swimCount = 0;
  let bikeCount = 0;

  cardioDays.forEach((dayKey, i) => {
    const plan = placement.days[dayKey];
    if (!plan) return;
    const block = pattern[i % pattern.length];
    plan.blocks = [block];
    plan.primaryBlock = block;
    refreshDayPlan(plan);
    if (block.startsWith('swim')) swimCount += 1;
    if (block.startsWith('bike')) bikeCount += 1;
  });

  const suffix = ` · multi-sport : ${swimCount} nat., ${bikeCount} vélo, ${cardioDays.length - swimCount - bikeCount} course`;
  return {
    ...placement,
    triathlonMultisport: true,
    placementSummaryFr: `${placement.placementSummaryFr || ''}${suffix}`.trim()
  };
}
