/**
 * Deux totaux peuvent différer. Chacun garde sa population et,
 * quand on les connaît, les enregistrements qui expliquent l'écart.
 */

export function reconcilePopulations(populations) {
  const rows = (populations || []).filter((row) => Number.isFinite(Number(row.value)));
  if (!rows.length) return { gap: null, populations: [], explained: false };
  const values = rows.map((row) => Number(row.value));
  const high = Math.max(...values);
  const low = Math.min(...values);
  const explained = rows
    .filter((row) => Array.isArray(row.records) && row.records.length)
    .flatMap((row) => row.records);
  return {
    gap: high - low,
    populations: rows.map((row) => ({
      id: row.id,
      value: Number(row.value),
      definition: row.definition
    })),
    records: explained,
    explained: high === low || explained.length > 0
  };
}

export function endurancePushupsOutsideReps(snapshot, start, end) {
  const bucket = snapshot?.enduranceData?.sessions?.pushups;
  const rows = Array.isArray(bucket) ? bucket : Object.values(bucket || {});
  const records = [];
  rows.forEach((row) => {
    const date = row?.date;
    if (!date || date < start || date > end) return;
    const reps = Number(row.reps ?? row.count) || 0;
    if (reps <= 0) return;
    const key = `${date}_complementary_endurance_pushups`;
    const already = snapshot?.checkedExercises?.[key] === true;
    if (already) return;
    records.push({ date, reps, source: 'enduranceData.sessions.pushups' });
  });
  return {
    reps: records.reduce((sum, row) => sum + row.reps, 0),
    records
  };
}

export function checkedRepsBetween(snapshot, start, end) {
  let total = 0;
  Object.entries(snapshot?.reps || {}).forEach(([key, value]) => {
    const date = key.slice(0, 10);
    if (date < start || date > end) return;
    if (snapshot?.checkedExercises?.[key] !== true) return;
    const count = parseInt(value, 10);
    if (count > 0) total += count;
  });
  return total;
}
