import React, { useMemo } from 'react';

function renderInline(text) {
  const parts = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m;
  let key = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <strong key={`b${key}`} className="font-semibold text-emerald-100">
        {m[1]}
      </strong>
    );
    key += 1;
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function parseBlocks(source) {
  const lines = String(source || '')
    .replace(/\r\n/g, '\n')
    .split('\n');
  const nodes = [];
  let para = [];
  const flushPara = () => {
    const text = para.join(' ').trim();
    para = [];
    if (text) nodes.push({ type: 'p', text });
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith('### ')) {
      flushPara();
      nodes.push({ type: 'h3', text: line.slice(4).trim() });
      continue;
    }
    if (line.startsWith('## ')) {
      flushPara();
      nodes.push({ type: 'h2', text: line.slice(3).trim() });
      continue;
    }
    if (line.startsWith('# ')) {
      flushPara();
      nodes.push({ type: 'h1', text: line.slice(2).trim() });
      continue;
    }
    if (line.trim() === '') {
      flushPara();
      continue;
    }
    para.push(line.trim());
  }
  flushPara();
  return nodes;
}

export default function MethodGuideMarkdown({ source }) {
  const nodes = useMemo(() => parseBlocks(source), [source]);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-300">
      {nodes.map((n, i) => {
        if (n.type === 'h1') {
          return (
            <h3 key={i} className="pt-2 text-base font-bold text-white">
              {renderInline(n.text)}
            </h3>
          );
        }
        if (n.type === 'h2') {
          return (
            <h4
              key={i}
              className="border-t border-emerald-900/50 pt-4 text-sm font-semibold uppercase tracking-wide text-emerald-200/90"
            >
              {renderInline(n.text)}
            </h4>
          );
        }
        if (n.type === 'h3') {
          return (
            <h5 key={i} className="pt-1 text-sm font-semibold text-emerald-100">
              {renderInline(n.text)}
            </h5>
          );
        }
        return (
          <p key={i} className="text-slate-400">
            {renderInline(n.text)}
          </p>
        );
      })}
    </div>
  );
}
