import { useEffect, useMemo, useRef, useState } from 'react';
import './SemaineModule.css';
import { getWeekNumber, getDateStr, addDays } from '../../../../utils/dateUtils';
import {
  startOfIsoWeek,
  endOfIsoWeek,
  jumpToSameWeekdayInWeek
} from '../../../../utils/sport/todayWeekNav';

const DN = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startDay = (d) => {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
};
const fmtShort = (d) => `${d.getDate()} ${MS[d.getMonth()]}`;
const fmtRange = (mon, sun) =>
  mon.getMonth() === sun.getMonth()
    ? `${mon.getDate()}–${sun.getDate()} ${MS[mon.getMonth()]}`
    : `${fmtShort(mon)} – ${fmtShort(sun)}`;

function weekProgress(sessions, mon, plannedPerWeek) {
  let done = 0;
  let part = 0;
  for (let i = 0; i < 7; i++) {
    const s = sessions[keyOf(addDays(mon, i))];
    if (s?.status === 'done') done += 1;
    else if (s?.status === 'part') part += 1;
  }
  const score = (done + 0.5 * part) / Math.max(1, plannedPerWeek);
  return { done, part, score: Math.min(1, score) };
}

function weekAvgLoad(sessions, mon, sun, todayYmd) {
  let sum = 0;
  let n = 0;
  for (let d = new Date(mon); d <= sun; d = addDays(d, 1)) {
    const ymd = keyOf(d);
    if (ymd > todayYmd) continue;
    const s = sessions[ymd];
    if (!s || s.status === 'rest') continue;
    if (s.status === 'miss') {
      sum += 0;
      n += 1;
    } else if (typeof s.load === 'number') {
      sum += s.load;
      n += 1;
    }
  }
  return n ? Math.round(sum / n) : null;
}

function resolveDayView(sessions, restDays, d, todayYmd) {
  const ymd = keyOf(d);
  const s = sessions[ymd];
  const isoWd = (d.getDay() + 6) % 7;
  if (s?.status === 'rest' || (!s && restDays.includes(isoWd))) {
    return { kind: 'rest', label: 'repos', pct: 0 };
  }
  if (ymd > todayYmd) return { kind: 'future', label: '', pct: 0 };
  if (!s) {
    if (ymd === todayYmd) return { kind: 'empty', label: '', pct: 0 };
    return { kind: 'miss', label: '–', pct: 0 };
  }
  if (s.status === 'done') return { kind: 'done', label: `${Math.round(s.load ?? 100)}%`, pct: Math.min(100, s.load ?? 100) };
  if (s.status === 'part') return { kind: 'part', label: `${Math.round(s.load ?? 0)}%`, pct: Math.min(100, s.load ?? 0) };
  if (s.status === 'miss') return { kind: 'miss', label: '–', pct: 0 };
  return { kind: 'empty', label: '', pct: 0 };
}

/**
 * Module Semaine — navigation + bilan + 7 jours.
 */
export default function SemaineModule({
  today,
  selectedDate,
  onSelectDate,
  onBeforeNavigate,
  sessions = {},
  weighIns = {},
  programNotes = {},
  onSaveProgramNote,
  plannedPerWeek = 6,
  restDays = [6],
  weeksBack = 52
}) {
  const todayD = useMemo(() => startDay(today || new Date()), [today ? keyOf(startDay(today)) : 'now']); // eslint-disable-line react-hooks/exhaustive-deps
  const todayYmd = keyOf(todayD);
  const sel = useMemo(
    () => startDay(selectedDate || todayD),
    [selectedDate ? keyOf(startDay(selectedDate)) : todayYmd] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const selMon = startOfIsoWeek(sel);
  const selSun = endOfIsoWeek(sel);
  const selMonKey = keyOf(selMon);
  const thisMon = startOfIsoWeek(todayD);
  const isCurrentWeek = keyOf(selMon) === keyOf(thisMon);
  const weekNo = getWeekNumber(selMon);

  const [showJump, setShowJump] = useState(false);
  const [jumpVal, setJumpVal] = useState('');
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const pillsRef = useRef(null);
  const pillRefs = useRef({});

  const weeks = useMemo(() => {
    const list = [];
    for (let i = weeksBack; i >= 0; i--) {
      const mon = addDays(thisMon, -i * 7);
      mon.setHours(12, 0, 0, 0);
      const sun = addDays(mon, 6);
      const prog = weekProgress(sessions, mon, plannedPerWeek);
      const mk = keyOf(mon);
      list.push({
        mon,
        sun,
        key: mk,
        weekNo: getWeekNumber(mon),
        range: fmtRange(mon, sun),
        isLive: mk === keyOf(thisMon),
        hasNote: Boolean(programNotes[mk]),
        prog
      });
    }
    return list;
  }, [thisMon, weeksBack, sessions, plannedPerWeek, programNotes]);

  useEffect(() => {
    const el = pillRefs.current[selMonKey];
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
  }, [selMonKey]);

  const note = programNotes[selMonKey] || '';

  const stats = useMemo(() => {
    const { done, part } = weekProgress(sessions, selMon, plannedPerWeek);
    let weigh = 0;
    for (let i = 0; i < 7; i++) {
      if (weighIns[keyOf(addDays(selMon, i))]) weigh += 1;
    }
    const avg = weekAvgLoad(sessions, selMon, selSun, todayYmd);
    const prevMon = addDays(selMon, -7);
    const prevSun = addDays(selMon, -1);
    const prevAvg = weekAvgLoad(sessions, prevMon, prevSun, todayYmd);
    const delta = avg != null && prevAvg != null ? avg - prevAvg : null;
    return { done, part, weigh, avg, delta };
  }, [sessions, selMon, selSun, plannedPerWeek, weighIns, todayYmd]);

  const guard = () => (typeof onBeforeNavigate === 'function' ? onBeforeNavigate() !== false : true);

  const selectDate = (d) => {
    if (!guard()) return;
    let next = startDay(d);
    if (keyOf(next) > todayYmd) next = todayD;
    onSelectDate?.(next);
  };

  const goWeek = (delta) => {
    if (!guard()) return;
    const targetMon = addDays(selMon, delta * 7);
    if (delta > 0 && keyOf(targetMon) > keyOf(thisMon)) return;
    const oldest = addDays(thisMon, -weeksBack * 7);
    if (keyOf(targetMon) < keyOf(oldest)) return;
    const next = jumpToSameWeekdayInWeek(sel, targetMon, todayD);
    onSelectDate?.(next);
  };

  const goCurrentWeek = () => {
    if (!guard()) return;
    onSelectDate?.(todayD);
  };

  const pickWeek = (mon) => {
    if (!guard()) return;
    const next = jumpToSameWeekdayInWeek(sel, mon, todayD);
    onSelectDate?.(next);
  };

  const onJumpDate = (value) => {
    if (!value) return;
    const d = startDay(new Date(`${value}T12:00:00`));
    if (Number.isNaN(d.getTime())) return;
    const oldest = addDays(thisMon, -weeksBack * 7);
    if (keyOf(d) < keyOf(oldest) || keyOf(d) > todayYmd) return;
    if (!guard()) return;
    onSelectDate?.(d);
    setShowJump(false);
  };

  const openNote = () => {
    setNoteDraft(note);
    setEditingNote(true);
  };

  const saveNote = () => {
    const trimmed = String(noteDraft || '').trim();
    onSaveProgramNote?.(selMonKey, trimmed || null);
    setEditingNote(false);
  };

  const removeNote = () => {
    onSaveProgramNote?.(selMonKey, null);
    setEditingNote(false);
    setNoteDraft('');
  };

  const canNext = keyOf(selMon) < keyOf(thisMon);
  const canPrev = keyOf(selMon) > keyOf(addDays(thisMon, -weeksBack * 7));

  return (
    <section className="wk" aria-label="Navigation semaine">
      <div className="wk-main">
        <span className="wk-eyebrow">Semaine</span>
        <div className="wk-strip">
          <button type="button" className="wk-sq" disabled={!canPrev} onClick={() => goWeek(-1)} aria-label="Semaine précédente">
            ‹
          </button>
          <div className="wk-pills" ref={pillsRef} role="list">
            {weeks.map((w) => {
              const pct = Math.round(w.prog.score * 100);
              const barCls = pct >= 90 ? 'full' : pct >= 40 ? 'mid' : '';
              return (
                <button
                  key={w.key}
                  type="button"
                  role="listitem"
                  ref={(el) => {
                    pillRefs.current[w.key] = el;
                  }}
                  className={`wk-pill${w.key === selMonKey ? ' on' : ''}`}
                  onClick={() => pickWeek(w.mon)}
                  aria-pressed={w.key === selMonKey}
                >
                  <span className="wk-lbl">
                    <b>S{w.weekNo}</b>
                    <span className="wk-rg">{w.range}</span>
                    {w.isLive ? <i className="wk-live" title="Semaine en cours" /> : null}
                    {w.hasNote ? <i className="wk-chg" title="Programme modifié" /> : null}
                  </span>
                  <span className="wk-pg" aria-hidden="true">
                    <i className={barCls} style={{ width: `${pct}%` }} />
                  </span>
                </button>
              );
            })}
          </div>
          <button type="button" className="wk-sq" disabled={!canNext} onClick={() => goWeek(1)} aria-label="Semaine suivante">
            ›
          </button>
        </div>
        <button type="button" className="wk-btn" disabled={isCurrentWeek} onClick={goCurrentWeek}>
          Cette semaine
        </button>
      </div>

      <div className="wk-info">
        <span className="wk-ttl">
          Semaine {weekNo}
          {isCurrentWeek ? ' · en cours' : ''}
        </span>
        <span>
          {fmtShort(selMon)} – {fmtShort(selSun)} {selSun.getFullYear()}
        </span>
        <span>
          <b>
            {stats.done} / {plannedPerWeek}
          </b>{' '}
          séances {isCurrentWeek ? 'faites' : 'complètes'}
          {stats.part > 0 ? ` · ${stats.part} partielle${stats.part > 1 ? 's' : ''}` : ''}
        </span>
        {stats.avg != null ? (
          <span>
            Charge moyenne <b>{stats.avg}%</b>
            {stats.delta != null ? (
              <span className={stats.delta >= 0 ? 'wk-dn' : 'wk-up'}>
                {' '}
                ({stats.delta >= 0 ? '+' : ''}
                {stats.delta} pts vs S{getWeekNumber(addDays(selMon, -7))})
              </span>
            ) : null}
          </span>
        ) : null}
        <span>
          <b>{stats.weigh} / 7</b> pesées
        </span>
      </div>

      {note ? (
        <button type="button" className="wk-lnk wk-blue" onClick={openNote} style={{ justifySelf: 'start' }}>
          Programme modifié : {note}
        </button>
      ) : null}

      {!isCurrentWeek ? (
        <div className="wk-past">
          Semaine passée : tu peux ajouter ou corriger une séance. Elle garde sa vraie date et met à jour les analyses de
          cette semaine.
        </div>
      ) : null}

      <div className="wk-days" role="group" aria-label="Jours de la semaine">
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(selMon, i);
          const ymd = keyOf(d);
          const view = resolveDayView(sessions, restDays, d, todayYmd);
          const future = ymd > todayYmd;
          const cls = [
            'wk-d',
            view.kind === 'done' && 'done',
            view.kind === 'part' && 'part',
            view.kind === 'rest' && 'rest',
            ymd === todayYmd && 'is-today',
            ymd === keyOf(sel) && 'sel'
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={ymd}
              type="button"
              className={cls}
              disabled={future}
              onClick={() => selectDate(d)}
              aria-pressed={ymd === keyOf(sel)}
            >
              <span className="wk-n">
                {DN[i]} {d.getDate()}
              </span>
              <span className="wk-v">{view.label}</span>
              <span className="wk-bar" aria-hidden="true">
                <i style={{ width: `${view.pct}%` }} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="wk-tools">
        <button type="button" className="wk-lnk" onClick={() => setShowJump((v) => !v)}>
          Aller à une date
        </button>
        {showJump ? (
          <input
            type="date"
            className="wk-input"
            max={todayYmd}
            min={getDateStr(addDays(thisMon, -weeksBack * 7))}
            value={jumpVal}
            onChange={(e) => {
              setJumpVal(e.target.value);
              onJumpDate(e.target.value);
            }}
          />
        ) : null}

        {!editingNote ? (
          <button type="button" className="wk-lnk" onClick={openNote}>
            {note ? 'Modifier la note de programme' : 'Noter un changement de programme'}
          </button>
        ) : (
          <>
            <input
              className="wk-input wk-note"
              value={noteDraft}
              placeholder="Ex. Nouvelle répartition pousser / tirer"
              onChange={(e) => setNoteDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveNote();
              }}
            />
            <button type="button" className="wk-btn wk-btn-s" onClick={saveNote}>
              Enregistrer
            </button>
            {note ? (
              <button type="button" className="wk-lnk" onClick={removeNote}>
                Retirer
              </button>
            ) : (
              <button type="button" className="wk-lnk" onClick={() => setEditingNote(false)}>
                Annuler
              </button>
            )}
          </>
        )}

        <div className="wk-legend">
          <span>
            <i className="wk-live" /> Semaine en cours
          </span>
          <span>
            <i className="wk-chg" /> Programme modifié
          </span>
        </div>
      </div>
    </section>
  );
}
