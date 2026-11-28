import fs from 'fs';

const j = JSON.parse(
  fs.readFileSync(
    'c:/Users/zinga/Desktop/momentum/artifacts/analysis-eval/mission37-baseline/zip/eight-periods/eight-periods.json',
    'utf8'
  )
);
const blind = JSON.parse(
  fs.readFileSync(
    'c:/Users/zinga/Desktop/momentum/artifacts/analysis-eval/mission36-baseline/blind-pack.json',
    'utf8'
  )
);

const PERIOD_MAP = { today: 'today', '7d': '7d', '30d': '30d' };

function allCards(period) {
  const p = j.periods[period];
  const ua = p?.userAccessible || {};
  const out = [];
  for (const [role, arr] of [
    ['priority', ua.priority],
    ['reserve', ua.reserve],
    ['accessible', ua.accessible]
  ]) {
    for (const c of arr || []) out.push({ ...c, _role: role, _period: period });
  }
  return out;
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreMatch(b, c) {
  let s = 0;
  const bt = norm(b.title);
  const ct = norm(c.title);
  if (bt === ct) s += 50;
  else if (bt && ct && (ct.includes(bt.slice(0, 40)) || bt.includes(ct.slice(0, 40)))) s += 25;
  const bw = new Set(
    norm(b.body)
      .split(/[^a-z0-9àâäéèêëïîôùûüç]+/)
      .filter((w) => w.length > 4)
  );
  const cw = new Set(
    norm(c.body)
      .split(/[^a-z0-9àâäéèêëïîôùûüç]+/)
      .filter((w) => w.length > 4)
  );
  let n = 0;
  for (const w of bw) if (cw.has(w)) n += 1;
  s += Math.min(40, n);
  if (norm(b.evidence) && norm(c.evidence) && norm(b.evidence) === norm(c.evidence)) s += 15;
  return s;
}

const results = [];
for (const b of blind.cards) {
  const period = PERIOD_MAP[b.periodLabel] || b.periodLabel;
  const pool = allCards(period);
  const ranked = pool.map((c) => ({ c, s: scoreMatch(b, c) })).sort((a, x) => x.s - a.s);
  const best = ranked[0];
  let cross = null;
  if (!best || best.s < 30) {
    for (const per of ['today', '7d', '30d', '3m', '6m', '1y', '2y', 'all']) {
      if (per === period) continue;
      for (const c of allCards(per)) {
        const s = scoreMatch(b, c);
        if (!cross || s > cross.s) cross = { c, s, per };
      }
    }
  }
  results.push({
    blindId: b.blindId,
    histTitle: b.title,
    histPeriod: b.periodLabel,
    histEvidence: b.evidence,
    match:
      best && best.s >= 25
        ? {
            score: best.s,
            title: best.c.title,
            kind: best.c.kind,
            role: best.c._role,
            period: best.c._period,
            producer: best.c.metrics?.producer || null,
            conclusionKey: best.c.metrics?.conclusionKey || null,
            bodyPreview: String(best.c.body || '').slice(0, 220)
          }
        : null,
    cross:
      (!best || best.s < 25) && cross && cross.s >= 25
        ? {
            score: cross.s,
            title: cross.c.title,
            kind: cross.c.kind,
            role: cross.c._role,
            period: cross.per,
            producer: cross.c.metrics?.producer || null
          }
        : null
  });
}

const editorial = {};
for (const per of ['today', '7d', '30d', '3m', '6m', '1y', '2y', 'all']) {
  const pri = allCards(per).filter((c) => c._role === 'priority');
  editorial[per] = pri.map((c, i) => ({
    i: i + 1,
    kind: c.kind,
    title: c.title,
    conclusionKey: c.metrics?.conclusionKey || null,
    producer: c.metrics?.producer || null
  }));
}

const interesting = {};
for (const per of ['7d', '30d', 'today']) {
  interesting[per] = allCards(per)
    .filter((c) =>
      /volume|fréquence|concentration|sommeil|poussée|densité|famille|parallèle|reprise/i.test(
        `${c.title} ${c.kind}`
      )
    )
    .map((c) => ({
      role: c._role,
      kind: c.kind,
      title: c.title,
      conclusionKey: c.metrics?.conclusionKey || null,
      bodyPreview: String(c.body || '').slice(0, 280)
    }));
}

const out = { results, editorial, interesting };
fs.writeFileSync(
  'c:/Users/zinga/Desktop/momentum/artifacts/analysis-eval/mission37-baseline/b001-b024-map-raw.json',
  JSON.stringify(out, null, 2)
);

for (const r of results) {
  const m = r.match || r.cross;
  const label = m
    ? `${m.period}/${m.role} [${m.score}] ${m.kind || '?'} | ${String(m.title || '').slice(0, 70)}`
    : 'ABSENT';
  console.log(`${r.blindId} ${r.histPeriod} -> ${label}`);
}

console.log('\n--- priorities today/7d/30d ---');
for (const per of ['today', '7d', '30d']) {
  console.log(
    per,
    editorial[per].map((x) => `${x.i}.${String(x.title).slice(0, 55)}`).join(' || ')
  );
}
