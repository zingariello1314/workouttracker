export function effectiveMs(entry) {
  if (!entry || entry.penalty === 'DNF') return null;
  const base = Number(entry.ms) || 0;
  const extra = entry.penalty === 2000 || entry.penalty === '+2' ? 2000 : 0;
  return base + extra;
}

export function formatTimeMs(ms) {
  if (ms == null || ms === 'DNF') return 'DNF';
  const t = Math.max(0, Number(ms) || 0);
  const m = Math.floor(t / 60000);
  const s = Math.floor((t % 60000) / 1000);
  const cs = Math.floor((t % 1000) / 10);
  if (m > 0) return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  return `${s}.${String(cs).padStart(2, '0')}`;
}

export function formatEntry(entry) {
  if (!entry) return '—';
  if (entry.penalty === 'DNF') return 'DNF';
  const label = formatTimeMs(effectiveMs(entry));
  return entry.penalty === 2000 || entry.penalty === '+2' ? `${label}+` : label;
}

function meanOfValid(values) {
  const nums = values.filter((v) => typeof v === 'number');
  if (!nums.length) return 'DNF';
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

/** aoN : retire le meilleur et le pire ; 2 DNF ou plus → DNF. */
export function averageOf(entries, n) {
  const slice = (entries || []).slice(0, n);
  if (slice.length < n) return null;
  const values = slice.map(effectiveMs);
  const dnfs = values.filter((v) => v == null).length;
  if (dnfs >= 2) return 'DNF';
  const ranked = values.map((v, i) => ({ v: v == null ? Infinity : v, i }));
  ranked.sort((a, b) => a.v - b.v);
  const drop = new Set([ranked[0].i, ranked[ranked.length - 1].i]);
  const kept = values.filter((_, i) => !drop.has(i));
  if (kept.some((v) => v == null)) return 'DNF';
  return meanOfValid(kept);
}

export function personalBest(entries) {
  const vals = (entries || []).map(effectiveMs).filter((v) => typeof v === 'number');
  if (!vals.length) return null;
  return Math.min(...vals);
}
