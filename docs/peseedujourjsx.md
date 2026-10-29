import { useMemo, useState } from 'react';
import './PeseeDuJour.css';
 
/**
 * Module « Pesée du jour ».
 *
 * Props
 * - entries   : { 'YYYY-MM-DD': { kg: number, cond?: 'jeun' | 'repas' | '' } }
 * - profile   : { taille?: string|number, age?: string|number, fat?: string|number }  (préremplit « Plus de détails »)
 * - today     : Date (défaut : maintenant)
 * - onSave    : ({ date, kg, cond, taille, age, fat }) => void   (à brancher sur ton store / Dexie / localStorage)
 */
 
const DN = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DL = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const MS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
 
const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const mondayOf = (d) => addDays(d, -((d.getDay() + 6) % 7));
const weekdayIdx = (d) => (d.getDay() + 6) % 7;
const fmt = (x) => (Math.round(x * 10) / 10).toFixed(1).replace('.', ',');
const sgn = (x) => {
  const r = Math.round(x * 10) / 10;
  return (r > 0 ? '+' : r < 0 ? '−' : '±') + fmt(Math.abs(r));
};
const trendCls = (delta) => (delta < -0.05 ? 'ps-dn' : delta > 0.05 ? 'ps-up' : 'ps-eq');
 
function avgRange(entries, from, to) {
  let sum = 0;
  let n = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const e = entries[keyOf(d)];
    if (e && Number.isFinite(e.kg)) { sum += e.kg; n++; }
  }
  return n ? { v: sum / n, n } : null;
}
const rolling = (entries, d) => avgRange(entries, addDays(d, -6), d);
function prevEntry(entries, d) {
  for (let i = 1; i < 60; i++) {
    const day = addDays(d, -i);
    const e = entries[keyOf(day)];
    if (e) return { e, d: day };
  }
  return null;
}
 
function Sparkline({ entries, sel }) {
  const N = 14, W = 640, H = 110, pl = 8, pr = 36, pt = 10, pb = 18;
  const days = [], raw = [], avg = [];
  for (let i = N - 1; i >= 0; i--) {
    const d = addDays(sel, -i);
    const e = entries[keyOf(d)];
    const r = rolling(entries, d);
    days.push(d);
    raw.push(e ? e.kg : null);
    avg.push(r ? r.v : null);
  }
  const vals = [...raw, ...avg].filter((x) => x != null);
  if (!vals.length) return null;
  const lo = Math.floor(Math.min(...vals) * 2) / 2 - 0.25;
  const hi = Math.ceil(Math.max(...vals) * 2) / 2 + 0.25;
  const X = (i) => pl + ((W - pl - pr) * i) / (N - 1);
  const Y = (v) => pt + (H - pt - pb) * (1 - (v - lo) / (hi - lo));
  const pts = (arr) => arr.map((v, i) => (v == null ? null : [X(i), Y(v)])).filter(Boolean);
  const line = (p) => p.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('');
  const rawPts = pts(raw);
  const avgPts = pts(avg);
  const last = avgPts[avgPts.length - 1];
  const grid = [lo + 0.25, (lo + hi) / 2, hi - 0.25];
 
  return (
    <svg className="ps-spark" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Courbe du poids sur 14 jours avec moyenne glissante">
      {grid.map((g) => (
        <g key={g}>
          <line className="ps-grid" x1={pl} x2={W - pr} y1={Y(g)} y2={Y(g)} />
          <text x={W - pr + 6} y={Y(g) + 3}>{fmt(g)}</text>
        </g>
      ))}
      <path className="ps-raw" d={line(rawPts)} />
      {rawPts.map((p, i) => <circle key={i} className="ps-pt" cx={p[0]} cy={p[1]} r="2.6" />)}
      <path className="ps-avg" d={line(avgPts)} />
      {last && <circle className="ps-end" cx={last[0]} cy={last[1]} r="4.5" />}
      {[0, N - 1].map((i) => (
        <text key={i} x={X(i)} y={H - 3} textAnchor={i ? 'end' : 'start'}>
          {days[i].getDate()} {MS[days[i].getMonth()]}
        </text>
      ))}
    </svg>
  );
}
 
export default function PeseeDuJour({ entries = {}, profile = {}, today, onSave }) {
  const todayD = useMemo(() => startOfDay(today || new Date()), [today ? keyOf(startOfDay(today)) : keyOf(new Date())]); // eslint-disable-line react-hooks/exhaustive-deps
  const todayKey = keyOf(todayD);
 
  const [sel, setSel] = useState(todayD);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [cond, setCond] = useState('jeun');
  const [showMore, setShowMore] = useState(false);
  const [warn, setWarn] = useState(null);
  const [error, setError] = useState('');
  const [prof, setProf] = useState({
    taille: profile.taille ?? '', age: profile.age ?? '', fat: profile.fat ?? '',
  });
 
  const selKey = keyOf(sel);
  const entry = entries[selKey];
  const isToday = selKey === todayKey;
  const mon = mondayOf(sel);
  const sun = addDays(mon, 6);
 
  const weekInfo = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 7; i++) if (entries[keyOf(addDays(mon, i))]) count++;
    const cur = avgRange(entries, mon, sun);
    const pre = avgRange(entries, addDays(mon, -7), addDays(mon, -1));
    return { count, cur, pre };
  }, [entries, selKey]); // eslint-disable-line react-hooks/exhaustive-deps
 
  const state = entry && !editing ? 'done' : !isToday && !entry ? 'past' : 'todo';
 
  function pickDay(d) {
    setSel(d); setEditing(false); setWarn(null); setError(''); setDraft('');
  }
 
  function save(force = false) {
    const v = parseFloat(String(draft).replace(',', '.').trim());
    if (!(v >= 30 && v <= 250)) { setError('Entre un poids entre 30 et 250 kg.'); return; }
    const p = prevEntry(entries, sel);
    if (!force && p && Math.abs(v - p.e.kg) > 2) {
      setWarn({ v, ref: p.e.kg, diff: v - p.e.kg });
      return;
    }
    onSave?.({ date: selKey, kg: Math.round(v * 10) / 10, cond, taille: prof.taille, age: prof.age, fat: prof.fat });
    setEditing(false); setWarn(null); setError(''); setDraft('');
  }
 
  const prev = prevEntry(entries, sel);
  const r7 = rolling(entries, sel);
  const r7before = rolling(entries, addDays(sel, -7));
  const placeholder = prev ? fmt(prev.e.kg) : '0,0';
 
  return (
    <section className={`ps ps--${state}`} aria-label="Pesée du jour">
      <div className="ps-top">
        <div className="ps-ttl">
          <div className="ps-ic" aria-hidden="true">⚖</div>
          <div>
            <h2>{isToday ? 'Pesée du jour' : `Pesée du ${DL[weekdayIdx(sel)]} ${sel.getDate()} ${MS[sel.getMonth()]}`}</h2>
            <small>
              Semaine du {mon.getDate()} {MS[mon.getMonth()]} au {sun.getDate()} {MS[sun.getMonth()]} · {weekInfo.count}/7 pesées
            </small>
          </div>
        </div>
        <div className="ps-weekavg">
          <div className="ps-lab">Moyenne de la semaine</div>
          {weekInfo.cur ? (
            <>
              <b>{fmt(weekInfo.cur.v)} kg</b>
              {weekInfo.pre && (
                <span className={trendCls(weekInfo.cur.v - weekInfo.pre.v)}>
                  {sgn(weekInfo.cur.v - weekInfo.pre.v)} kg vs semaine précédente
                </span>
              )}
            </>
          ) : (
            <><b>–</b><span>Pas encore de pesée</span></>
          )}
        </div>
      </div>
 
      <div className="ps-week" role="group" aria-label="Jours de la semaine">
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(mon, i);
          const e = entries[keyOf(d)];
          const future = d > todayD;
          const cls = ['ps-d', e && 'is-has', keyOf(d) === todayKey && 'is-today', keyOf(d) === selKey && 'is-sel'].filter(Boolean).join(' ');
          return (
            <button
              key={i} type="button" className={cls} disabled={future}
              aria-pressed={keyOf(d) === selKey}
              aria-label={`${DL[i]} ${d.getDate()} ${MS[d.getMonth()]}${e ? `, ${fmt(e.kg)} kilos` : future ? ', à venir' : ', pas de pesée'}`}
              onClick={() => pickDay(d)}
            >
              <span className="ps-n">{DN[i]} {d.getDate()}</span>
              <span className="ps-v">{e ? fmt(e.kg) : future ? '' : '–'}</span>
              <span className="ps-m" />
            </button>
          );
        })}
      </div>
 
      {state === 'done' ? (
        <div className="ps-sum">
          <div className="ps-big">{fmt(entry.kg)}<small>kg</small></div>
          <div className="ps-delta">
            {prev && (
              <span>
                <b className={trendCls(entry.kg - prev.e.kg)}>{sgn(entry.kg - prev.e.kg)} kg</b>{' '}
                vs {keyOf(prev.d) === keyOf(addDays(sel, -1)) ? 'la veille' : 'la dernière pesée'}
              </span>
            )}
            {r7 && <span>Moyenne 7 j : <b>{fmt(r7.v)} kg</b></span>}
          </div>
          <span className="ps-tag">
            {entry.cond === 'jeun' ? 'À jeun' : entry.cond === 'repas' ? 'Après repas' : 'Conditions non précisées'}
          </span>
          <button
            type="button" className="ps-btn"
            onClick={() => { setEditing(true); setDraft(String(entry.kg).replace('.', ',')); setCond(entry.cond || ''); }}
          >
            Modifier
          </button>
        </div>
      ) : (
        <div className="ps-entry">
          {!isToday && !entry && <div className="ps-miss">Pas de pesée ce jour-là. Tu peux l’ajouter, elle garde sa vraie date.</div>}
          <div className="ps-row">
            <div className="ps-kg">
              <input
                type="text" inputMode="decimal" autoComplete="off" aria-label="Poids en kilos"
                placeholder={placeholder} value={draft}
                onChange={(e) => { setDraft(e.target.value); setWarn(null); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') save(false); }}
              />
              <span>kg</span>
            </div>
            <button type="button" className="ps-go" onClick={() => save(false)}>Enregistrer</button>
          </div>
          <div className="ps-chips">
            <span className="ps-lab2">Conditions</span>
            {[['jeun', 'À jeun'], ['repas', 'Après repas']].map(([v, label]) => (
              <button
                key={v} type="button" className={`ps-chip${cond === v ? ' on' : ''}`}
                aria-pressed={cond === v} onClick={() => setCond(cond === v ? '' : v)}
              >
                {label}
              </button>
            ))}
          </div>
          {error && <div className="ps-err" role="alert">{error}</div>}
          {warn && (
            <div className="ps-warn" role="alert">
              <span>Valeur inhabituelle : {sgn(warn.diff)} kg vs {fmt(warn.ref)} kg. C’est bien {fmt(warn.v)} kg ?</span>
              <button type="button" className="ps-btn" onClick={() => save(true)}>Confirmer</button>
            </div>
          )}
          <button type="button" className="ps-lnk" onClick={() => setShowMore((s) => !s)} aria-expanded={showMore}>
            {showMore ? 'Masquer les détails' : 'Plus de détails (taille, âge, % graisse)'}
          </button>
          {showMore && (
            <div className="ps-more">
              <label>Taille (cm)
                <input inputMode="numeric" value={prof.taille} onChange={(e) => setProf({ ...prof, taille: e.target.value })} />
              </label>
              <label>Âge réel
                <input inputMode="numeric" value={prof.age} onChange={(e) => setProf({ ...prof, age: e.target.value })} />
              </label>
              <label>% graisse (opt.)
                <input inputMode="decimal" value={prof.fat} onChange={(e) => setProf({ ...prof, fat: e.target.value })} />
              </label>
            </div>
          )}
          {entry && editing && (
            <button type="button" className="ps-lnk" onClick={() => { setEditing(false); setDraft(''); setWarn(null); setError(''); }}>
              Annuler la modification
            </button>
          )}
        </div>
      )}
 
      <div className="ps-trend">
        <div className="ps-trhead">
          <span className="ps-lab">14 derniers jours</span>
          <span className="ps-a7">
            {r7 && (
              <>
                Moyenne 7 j : <b>{fmt(r7.v)} kg</b>
                {r7before && <> <span className={trendCls(r7.v - r7before.v)}>({sgn(r7.v - r7before.v)} sur 7 j)</span></>}
              </>
            )}
          </span>
        </div>
        <Sparkline entries={entries} sel={sel} />
        <div className="ps-legend">
          <span><i />Moyenne sur 7 jours</span>
          <span><i className="dash" />Pesées du jour</span>
        </div>
      </div>
    </section>
  );
}