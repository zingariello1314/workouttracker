import { Fragment, useMemo, useState } from 'react';
import { contributionLevelToTier, tierToHeatClass } from '../../utils/githubContributions';

export const TIER_CLASS = {
  gh0: 'bg-[#161b22] border border-slate-800/70',
  gh1: 'bg-[#0e4429]',
  gh2: 'bg-[#006d32]',
  gh3: 'bg-[#26a641]',
  gh4: 'bg-[#39d353]',
};

const ROW_LABELS = ['', 'Lun', '', 'Mer', '', 'Ven', ''];

const MONTH_ABBR_3 = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function monthLabel3(utcMonthIndex) {
  if (utcMonthIndex < 0 || utcMonthIndex > 11) return '';
  return MONTH_ABBR_3[utcMonthIndex];
}

function formatContributionDayFr(isoYmd) {
  const parts = String(isoYmd || '').split('-');
  if (parts.length !== 3) return isoYmd || '';
  const y = Number(parts[0]);
  const mo = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return isoYmd;
  return new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function contributionsLineFr(count) {
  const n = Number(count) || 0;
  if (n === 0) return 'Aucune contribution';
  if (n === 1) return '1 contribution';
  return `${n} contributions`;
}

export default function GitHubHeatmapGrid({ weeks, accent = 'emerald' }) {
  const tipBorder = accent === 'rose' ? 'border-rose-500/30' : 'border-emerald-500/25';
  const tipCount = accent === 'rose' ? 'text-rose-200/95' : 'text-emerald-200/95';
  const [hoverTip, setHoverTip] = useState(null);

  const monthRow = useMemo(() => {
    return (weeks || []).map((week, wi) => {
      const first = week?.contributionDays?.[0];
      if (!first?.date) return { key: wi, label: '', title: '' };
      const m = new Date(`${first.date}T12:00:00Z`).getUTCMonth();
      const prev = wi > 0 ? weeks[wi - 1]?.contributionDays?.[0]?.date : null;
      let label = '';
      if (!prev) label = monthLabel3(m);
      else {
        const pm = new Date(`${prev}T12:00:00Z`).getUTCMonth();
        if (pm !== m) label = monthLabel3(m);
      }
      const title =
        label && first?.date
          ? `${label} ${new Date(`${first.date}T12:00:00Z`).getUTCFullYear()}`
          : '';
      return { key: wi, label, title };
    });
  }, [weeks]);

  if (!weeks?.length) {
    return <div className="py-8 text-center text-sm text-slate-500">Aucune donnée pour cette période.</div>;
  }

  const n = weeks.length;
  const gap = '0.1875rem';

  const showTip = (e, day) => {
    setHoverTip({
      x: e.clientX,
      y: e.clientY,
      date: day.date,
      count: day.contributionCount ?? 0,
    });
  };

  const moveTip = (e) => {
    setHoverTip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : null));
  };

  const hideTip = () => setHoverTip(null);

  const tipStyle =
    hoverTip &&
    (() => {
      const pad = 10;
      const estW = 260;
      const estH = 52;
      const vw = typeof window !== 'undefined' ? window.innerWidth : 800;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 600;
      const rawLeft = hoverTip.x + 12;
      const rawTop = hoverTip.y + 12;
      const left = Math.max(pad, Math.min(rawLeft, vw - estW - pad));
      const top = Math.max(pad, Math.min(rawTop, vh - estH - pad));
      return { left, top };
    })();

  return (
    <div className="relative w-full pb-1">
      {hoverTip && tipStyle ? (
        <div
          className={`pointer-events-none fixed z-[100] max-w-[min(18rem,calc(100vw-1.5rem))] rounded-md border ${tipBorder} bg-slate-950/98 px-3 py-2 text-left shadow-xl shadow-black/50 ring-1 ring-slate-700/80 backdrop-blur-sm`}
          style={{ left: tipStyle.left, top: tipStyle.top }}
          role="tooltip"
        >
          <div className="text-xs font-medium text-white">{formatContributionDayFr(hoverTip.date)}</div>
          <div className={`mt-0.5 text-[11px] ${tipCount}`}>{contributionsLineFr(hoverTip.count)}</div>
        </div>
      ) : null}

      <div
        className="grid w-full"
        style={{
          gridTemplateColumns: `minmax(2rem, 2.75rem) repeat(${n}, minmax(0, 1fr))`,
          gap,
        }}
      >
        <div className="min-h-[1.25rem]" />
        {monthRow.map((c) => (
          <div
            key={`m-${c.key}`}
            title={c.title || c.label || undefined}
            className="min-w-0 overflow-hidden px-0.5 text-center text-[10px] font-medium leading-none text-slate-400 sm:text-[11px]"
          >
            <span className="inline-block whitespace-nowrap">{c.label}</span>
          </div>
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((di) => (
          <Fragment key={di}>
            <div className="flex items-center justify-end pr-1 text-[10px] leading-none text-slate-500 sm:text-[11px]">
              {ROW_LABELS[di]}
            </div>
            {weeks.map((week, wi) => {
              const day = week.contributionDays?.[di];
              if (!day?.date) {
                return <div key={`e-${wi}-${di}`} className="min-w-0" />;
              }
              const tier = contributionLevelToTier(day.contributionLevel);
              const cls = tierToHeatClass(tier);
              const bg = TIER_CLASS[cls] || TIER_CLASS.gh0;
              return (
                <div
                  key={day.date}
                  role="presentation"
                  onPointerEnter={(e) => showTip(e, day)}
                  onPointerMove={moveTip}
                  onPointerLeave={hideTip}
                  className={`aspect-square w-full min-w-0 cursor-default rounded-sm ${bg}`}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2 text-xs text-slate-500">
        <span>Moins</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((t) => (
            <div key={t} className={`h-3 w-3 rounded-sm sm:h-3.5 sm:w-3.5 ${TIER_CLASS[`gh${t}`]}`} />
          ))}
        </div>
        <span>Plus</span>
      </div>
    </div>
  );
}
