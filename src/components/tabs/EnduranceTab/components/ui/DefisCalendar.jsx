import React from 'react';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const LEVEL_CLASS = ['', 'l1', 'l1 l1h', 'l2', 'l3'];

function dateKeyOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthCells(year, monthIdx) {
  const first = new Date(year, monthIdx, 1);
  const days = new Date(year, monthIdx + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < offset; i += 1) cells.push(null);
  for (let d = 1; d <= days; d += 1) cells.push(new Date(year, monthIdx, d));
  return cells;
}

/** Récapitulatif (3 cartes période) + Records et séries — maquette `calRecap`. */
export function DefisCalendarRecap({ title = 'Récapitulatif', hint, cards = [], factsTitle = 'Records et séries', facts = [], children }) {
  return (
    <>
      <section>
        <div className="sec-h">
          <div>
            <h2>{title}</h2>
            {hint ? <p>{hint}</p> : null}
          </div>
        </div>
        <div className="pcs">
          {cards.map((card) => (
            <article key={card.key || card.title} className="box pcard">
              <h3>{card.title}</h3>
              {card.rows.map((row) => (
                <div key={row.label} className="r">
                  <span>{row.label}</span>
                  <b className="num">{row.value}</b>
                </div>
              ))}
              {card.si ? <div className="si">{card.si}</div> : null}
            </article>
          ))}
        </div>
      </section>
      {facts.length > 0 || children ? (
        <section>
          <div className="sec-h">
            <div>
              <h2>{factsTitle}</h2>
            </div>
          </div>
          {facts.length > 0 ? (
            <div className="facts">
              {facts.map((f) => (
                <div key={f.label}>
                  <span className="lab">{f.label}</span>
                  <b className="num">
                    {f.value}
                    {f.sub ? <span> {f.sub}</span> : null}
                  </b>
                </div>
              ))}
            </div>
          ) : null}
          {children}
        </section>
      ) : null}
    </>
  );
}

/**
 * Grille calendrier (barre Mois/Année + navigation, légende, 12 mois ou grand mois, détail du jour)
 * — maquette `calBody`.
 */
export function DefisCalendarGrid({
  year,
  viewMode,
  modes = [
    { id: 'mois', label: 'Mois' },
    { id: 'annee', label: 'Année' }
  ],
  onViewMode,
  monthIndex,
  monthNames,
  onPrev,
  onNext,
  prevLabel = 'Précédent',
  nextLabel = 'Suivant',
  onMonthTitleClick,
  levelOf,
  countOf,
  unitLabel,
  legend,
  selectedDateKey,
  onDayClick,
  dayTitle,
  detail,
  toolbar = null
}) {
  const todayKey = dateKeyOf(new Date());
  const isMonth = viewMode === 'mois';

  const renderDay = (d, monthIdx, big) => {
    const key = dateKeyOf(d);
    const level = Math.max(0, Math.min(4, levelOf(key) || 0));
    const count = countOf(key) || 0;
    const cls = ['cd', LEVEL_CLASS[level], key === todayKey ? 'today' : '', selectedDateKey === key ? 'sel' : '']
      .filter(Boolean)
      .join(' ');
    return (
      <button
        key={key}
        type="button"
        className={cls}
        title={dayTitle ? dayTitle(key, count) : undefined}
        aria-label={dayTitle ? dayTitle(key, count) : key}
        onClick={() => onDayClick(key, monthIdx)}
      >
        {d.getDate()}
        {big && count > 0 ? <em>{count}×</em> : null}
      </button>
    );
  };

  const monthTotal = (monthIdx) =>
    monthCells(year, monthIdx).reduce(
      (acc, d) => {
        if (!d) return acc;
        const c = countOf(dateKeyOf(d)) || 0;
        return { tot: acc.tot + c, act: acc.act + (c > 0 ? 1 : 0) };
      },
      { tot: 0, act: 0 }
    );

  const grid = (monthIdx, big) => (
    <div className="cg">
      {WEEKDAYS.map((w, i) => (
        <span key={`wd-${i}`} className="wd">
          {w}
        </span>
      ))}
      {monthCells(year, monthIdx).map((d, i) =>
        d ? renderDay(d, monthIdx, big) : <span key={`e-${i}`} className="cd e" />
      )}
    </div>
  );

  const current = isMonth ? monthTotal(monthIndex) : null;

  return (
    <section>
      <div className="sec-h">
        <div>
          <h2>{isMonth ? modes.find((m) => m.id === 'mois')?.label || 'Mois' : modes.find((m) => m.id === viewMode)?.label || 'Année'}</h2>
        </div>
      </div>
      <div className="cbar">
        <div className="seg">
          {modes.map((m) => (
            <button key={m.id} type="button" aria-pressed={viewMode === m.id} onClick={() => onViewMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
        {toolbar}
        <div className="nv">
          <button type="button" className="ib" onClick={onPrev} aria-label={prevLabel}>
            ‹
          </button>
          <b className="num">{isMonth ? `${monthNames[monthIndex]} ${year}` : year}</b>
          <button type="button" className="ib" onClick={onNext} aria-label={nextLabel}>
            ›
          </button>
        </div>
      </div>
      <div className="cleg">
        {legend ? <span>{legend}</span> : null}
        <span>
          <i />0
        </span>
        <span>
          <i className="lv1" />
        </span>
        <span>
          <i className="lv2" />
        </span>
        <span>
          <i className="lv3" />
        </span>
        <span>
          <i className="lv4" />+
        </span>
      </div>

      {isMonth ? (
        <>
          <div className="msum">
            <span>
              <b>{current.tot}</b>
              {unitLabel(current.tot)}
            </span>
            <span>
              <b>{current.act}</b>
              {current.act > 1 ? 'jours actifs' : 'jour actif'}
            </span>
          </div>
          <div className="cm big">{grid(monthIndex, true)}</div>
        </>
      ) : (
        <div className="cmonths">
          {monthNames.map((name, monthIdx) => {
            const m = monthTotal(monthIdx);
            return (
              <div key={name} className="cm">
                <header>
                  <h4>
                    <button type="button" onClick={() => onMonthTitleClick?.(monthIdx)}>
                      {name}
                    </button>
                  </h4>
                  <span className={`ct${m.tot ? '' : ' z'}`}>
                    {m.tot} {unitLabel(m.tot)}
                  </span>
                </header>
                {grid(monthIdx, false)}
              </div>
            );
          })}
        </div>
      )}

      <div className="csel">{detail}</div>
    </section>
  );
}
