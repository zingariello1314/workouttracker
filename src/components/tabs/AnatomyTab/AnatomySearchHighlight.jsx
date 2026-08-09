import React from 'react';

/** Surligne la première occurrence (insensible aux accents). */
export function HighlightMatch({ text, highlightFrom, highlightTo, className = '' }) {
  if (!text) return null;
  const from = Math.max(0, Number(highlightFrom) || 0);
  const to = Math.max(from, Number(highlightTo) || from);
  if (to <= from) {
    return <span className={className}>{text}</span>;
  }
  const before = text.slice(0, from);
  const match = text.slice(from, to);
  const after = text.slice(to);
  return (
    <span className={className}>
      {before}
      <mark className="rounded-sm bg-amber-400/35 text-amber-50 px-0.5 not-italic">{match}</mark>
      {after}
    </span>
  );
}

/** Surligne toutes les occurrences du query dans label (muscle chips). */
export function HighlightQueryInLabel({ label, query, className = '' }) {
  const q = String(query || '').trim();
  if (!label || !q) return <span className={className}>{label}</span>;

  const normLabel = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const normQ = q
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  if (!normQ) return <span className={className}>{label}</span>;

  const parts = [];
  let cursor = 0;
  let searchFrom = 0;
  while (searchFrom < normLabel.length) {
    const idx = normLabel.indexOf(normQ, searchFrom);
    if (idx < 0) break;
    if (idx > cursor) parts.push({ t: label.slice(cursor, idx), hi: false });
    parts.push({ t: label.slice(idx, idx + normQ.length), hi: true });
    cursor = idx + normQ.length;
    searchFrom = cursor;
  }
  if (cursor < label.length) parts.push({ t: label.slice(cursor), hi: false });
  if (parts.length === 0) return <span className={className}>{label}</span>;

  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.hi ? (
          <mark key={i} className="rounded-sm bg-red-500/40 text-white px-0.5">
            {p.t}
          </mark>
        ) : (
          <span key={i}>{p.t}</span>
        )
      )}
    </span>
  );
}
