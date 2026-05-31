/**
 * Placement v6.2c — sports collectif, combat, préparation militaire (blocs dédiés).
 */

export const SPECIALIZED_SPORT_MISSION_IDS = new Set([
  'sport_collective',
  'combat_sport',
  'military_prep'
]);

/**
 * @param {string} missionId
 */
export function isSpecializedSportMission(missionId) {
  return SPECIALIZED_SPORT_MISSION_IDS.has(missionId);
}

function refreshDayPlan(dayPlan) {
  if (!dayPlan?.blocks?.length) return;
  dayPlan.primaryBlock = dayPlan.blocks[0];
  const groups = new Set();
  dayPlan.blocks.forEach((b) => {
    if (b.startsWith('run_') || b === 'cardio_general' || b === 'circuit_metabolic') {
      groups.add('cardio');
    } else if (b === 'force_legs' || b === 'force_lower') groups.add('lower');
    else if (b === 'force_core') groups.add('core');
    else groups.add('upper');
  });
  dayPlan.groups = [...groups];
}

function prependBlock(dayPlan, blockId) {
  const rest = dayPlan.blocks.filter((b) => b !== blockId);
  dayPlan.blocks = [blockId, ...rest];
  refreshDayPlan(dayPlan);
}

function setCardioBlock(dayPlan, blockId) {
  dayPlan.blocks = [blockId];
  dayPlan.primaryBlock = blockId;
  dayPlan.modality = 'cardio';
  dayPlan.groups = ['cardio'];
}

/**
 * @param {object} placement
 * @param {string} missionId
 * @param {object} [answers]
 */
export function applySpecializedSportPlacement(placement, missionId, answers = null) {
  if (!placement?.days || !isSpecializedSportMission(missionId)) return placement;

  const dayKeys = Object.keys(placement.days).sort(
    (a, b) => (placement.days[a].dayIndex ?? 0) - (placement.days[b].dayIndex ?? 0)
  );
  let strengthSlot = 0;
  const focus = answers?.sportConditioningFocus || 'balanced';
  const extraCircuit =
    focus === 'conditioning_heavy' ? 1 : focus === 'strength_heavy' ? -1 : 0;

  dayKeys.forEach((dayKey) => {
    const plan = placement.days[dayKey];
    if (!plan) return;

    if (plan.modality === 'cardio') {
      if (missionId === 'sport_collective') {
        setCardioBlock(plan, plan.blocks.includes('run_interval') ? 'run_interval' : 'cardio_general');
      } else if (missionId === 'combat_sport') {
        setCardioBlock(plan, 'run_interval');
      } else if (missionId === 'military_prep') {
        const alt = plan.dayIndex % 2 === 0 ? 'run_interval' : 'run_easy';
        setCardioBlock(plan, alt);
      }
      return;
    }

    if (missionId === 'sport_collective') {
      if (strengthSlot % 2 === 0) prependBlock(plan, 'circuit_metabolic');
      if (strengthSlot % 3 === 1 && !plan.blocks.includes('force_legs')) {
        plan.blocks = [...plan.blocks, 'force_legs'];
        refreshDayPlan(plan);
      }
      strengthSlot += 1;
      return;
    }

    if (missionId === 'combat_sport') {
      if (focus !== 'strength_heavy' || strengthSlot % 2 === 0) {
        prependBlock(plan, 'circuit_metabolic');
      }
      if (strengthSlot % 2 === 1) {
        const hasPush = plan.blocks.includes('force_push');
        if (!hasPush && !plan.blocks.includes('force_pull')) {
          plan.blocks.push('force_push');
          refreshDayPlan(plan);
        }
      }
      strengthSlot += 1;
      return;
    }

    if (missionId === 'military_prep') {
      if (focus !== 'strength_heavy' || strengthSlot % 2 === 0) {
        prependBlock(plan, 'circuit_metabolic');
      }
      if (!plan.blocks.includes('force_legs')) {
        plan.blocks = [...plan.blocks.filter((b) => b !== 'force_legs'), 'force_legs'];
        refreshDayPlan(plan);
      }
      strengthSlot += 1;
    }
  });

  const circuitCount = dayKeys.reduce(
    (n, k) => n + (placement.days[k]?.blocks?.includes('circuit_metabolic') ? 1 : 0),
    0
  );
  const suffix =
    missionId === 'sport_collective'
      ? ` · ${circuitCount} séance(s) conditioning`
      : missionId === 'combat_sport'
        ? ` · ${circuitCount} circuit(s) métabolique`
        : ` · prépa fonctionnelle (${circuitCount} circuits)`;

  return {
    ...placement,
    specializedSportMission: missionId,
    placementSummaryFr: `${placement.placementSummaryFr || ''}${suffix}`.trim()
  };
}
