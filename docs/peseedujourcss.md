/* Module « Pesée du jour » : tous les sélecteurs sont préfixés .ps pour ne pas entrer en conflit avec le reste de l'app. */
.ps {
  --ps-card: #100e1f;
  --ps-card-line: #25204a;
  --ps-text: #f6f4ff;
  --ps-text-2: #bdb7e2;
  --ps-text-3: #8e88ba;
  --ps-accent: #a78bfa;
  --ps-accent-bg: #261c55;
  --ps-accent-line: #7058e0;
  --ps-blue: #4a9eff;
  --ps-blue-bg: #0e2038;
  --ps-blue-line: #1c4a7e;
  --ps-amber: #ffb36b;
  --ps-todo-bg: #17123a;
  --ps-todo-line: #3d3182;
  --ps-field: #0d0b1c;
  --ps-field-line: #2a2552;
  --ps-head: 'Space Grotesk', system-ui, sans-serif;
  --ps-body: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --ps-mono: 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace;
 
  box-sizing: border-box;
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 18px 20px;
  border-radius: 16px;
  border: 1px solid var(--ps-todo-line);
  background: var(--ps-todo-bg);
  color: var(--ps-text);
  font: 14px var(--ps-body);
}
.ps *, .ps *::before, .ps *::after { box-sizing: border-box; }
.ps--done, .ps--past { background: var(--ps-card); border-color: var(--ps-card-line); }
.ps :focus-visible { outline: 2px solid var(--ps-accent); outline-offset: 2px; }
.ps button { font-family: inherit; }
 
.ps-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px 20px; flex-wrap: wrap; }
.ps-ttl { display: flex; gap: 12px; align-items: center; min-width: 0; }
.ps-ic { font-size: 24px; line-height: 1; color: var(--ps-amber); }
.ps--done .ps-ic, .ps--past .ps-ic { color: var(--ps-accent); }
.ps-ttl h2 { margin: 0; font: 600 17px var(--ps-head); }
.ps-ttl small { display: block; margin-top: 3px; font-size: 12px; color: var(--ps-text-2); }
.ps-weekavg { text-align: right; }
.ps-lab { font: 400 10px var(--ps-mono); letter-spacing: .12em; text-transform: uppercase; color: var(--ps-text-3); }
.ps-weekavg b { font: 600 20px var(--ps-head); font-variant-numeric: tabular-nums; }
.ps-weekavg span { display: block; font-size: 12px; color: var(--ps-text-2); font-variant-numeric: tabular-nums; }
.ps .ps-dn { color: var(--ps-accent); }
.ps .ps-up { color: var(--ps-amber); }
.ps .ps-eq { color: var(--ps-text-2); }
 
/* 7 jours */
.ps-week { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
.ps-d {
  display: grid; gap: 3px; min-width: 0; padding: 8px 2px 7px; text-align: center; cursor: pointer;
  color: var(--ps-text); background: transparent; border: 1px solid var(--ps-field-line); border-radius: 10px;
}
.ps-d:hover:not(:disabled) { border-color: #4a4290; }
.ps-d .ps-n { font-size: 11px; color: var(--ps-text-3); white-space: nowrap; }
.ps-d .ps-v { min-height: 17px; font: 500 12.5px var(--ps-mono); font-variant-numeric: tabular-nums; color: var(--ps-text-3); }
.ps-d .ps-m { width: 7px; height: 7px; margin-inline: auto; border-radius: 50%; border: 1.5px solid var(--ps-text-3); }
.ps-d.is-has .ps-v { color: var(--ps-text); }
.ps-d.is-has .ps-m { background: var(--ps-accent); border-color: var(--ps-accent); }
.ps-d.is-today .ps-n { color: var(--ps-amber); font-weight: 600; }
.ps-d.is-sel { background: var(--ps-accent-bg); border-color: var(--ps-accent-line); }
.ps-d.is-sel .ps-n { color: var(--ps-accent); }
.ps-d:disabled { opacity: .35; cursor: default; }
 
/* Saisie */
.ps-entry { display: grid; gap: 12px; }
.ps-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: stretch; }
.ps-kg { position: relative; flex: 1 1 180px; min-width: 0; }
.ps-kg input {
  width: 100%; height: 52px; padding: 0 52px 0 16px; border-radius: 12px; border: 1px solid #3a3470;
  background: #0f0d22; color: var(--ps-text); font: 600 22px var(--ps-head); font-variant-numeric: tabular-nums;
}
.ps-kg input::placeholder { color: var(--ps-text-3); font-weight: 500; }
.ps-kg input:focus { border-color: var(--ps-accent-line); outline: none; box-shadow: 0 0 0 3px rgba(167, 139, 250, .22); }
.ps-kg span { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); color: var(--ps-text-3); font: 500 13px var(--ps-mono); }
.ps-go {
  flex: 0 0 auto; height: 52px; padding: 0 22px; cursor: pointer; border-radius: 12px;
  font: 700 14px var(--ps-body); letter-spacing: .03em; text-transform: uppercase;
  color: #0e0828; background: var(--ps-accent); border: 1px solid #c4b5fd;
}
.ps-go:hover { background: #b79dfc; }
.ps-chips { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.ps-lab2 { margin-right: 2px; font-size: 12px; color: var(--ps-text-2); }
.ps-chip {
  padding: 6px 13px; cursor: pointer; border-radius: 999px; background: transparent;
  color: var(--ps-text-2); border: 1px solid var(--ps-field-line); font: 500 12.5px var(--ps-body);
}
.ps-chip:hover { color: var(--ps-text); border-color: #4a4290; }
.ps-chip.on { color: var(--ps-accent); background: var(--ps-accent-bg); border-color: var(--ps-accent-line); font-weight: 600; }
.ps-lnk {
  justify-self: start; padding: 0 0 1px; cursor: pointer; background: none; border: 0;
  border-bottom: 1px dotted var(--ps-blue-line); color: var(--ps-blue); font: 500 12.5px var(--ps-body);
}
.ps-more { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.ps-more label { display: grid; gap: 6px; font-size: 11px; color: var(--ps-text-3); }
.ps-more input {
  width: 100%; min-width: 0; height: 42px; padding: 0 12px; border-radius: 10px;
  background: #12102a; border: 1px solid #2f2a5c; color: var(--ps-text); font: 500 14px var(--ps-body);
}
.ps-more input:focus { border-color: var(--ps-accent-line); outline: none; }
.ps-warn {
  display: flex; flex-wrap: wrap; gap: 12px; align-items: center; padding: 10px 14px; border-radius: 10px;
  border: 1px solid #6a4a22; background: rgba(255, 179, 107, .08); color: var(--ps-amber); font-size: 13px; font-weight: 500;
}
.ps-warn .ps-btn { margin-left: auto; }
.ps-btn {
  padding: 8px 14px; cursor: pointer; white-space: nowrap; border-radius: 10px;
  color: var(--ps-blue); background: var(--ps-blue-bg); border: 1px solid var(--ps-blue-line); font: 600 13px var(--ps-body);
}
.ps-btn:hover { background: #132b4b; }
.ps-err { color: #f27a9a; font-size: 12.5px; }
.ps-miss { color: var(--ps-text-2); font-size: 13px; }
 
/* Résumé « fait » */
.ps-sum { display: flex; flex-wrap: wrap; align-items: center; gap: 14px 22px; }
.ps-big { font: 600 38px/1 var(--ps-head); color: var(--ps-accent); font-variant-numeric: tabular-nums; }
.ps-big small { margin-left: 6px; font: 500 14px var(--ps-mono); color: var(--ps-text-3); }
.ps-delta { display: grid; gap: 3px; font-size: 13px; color: var(--ps-text-2); }
.ps-delta b { font-weight: 600; font-variant-numeric: tabular-nums; }
.ps-tag { padding: 2px 10px; border-radius: 999px; border: 1px solid var(--ps-field-line); font-size: 11.5px; color: var(--ps-text-2); }
.ps-sum .ps-btn { margin-left: auto; }
 
/* Tendance */
.ps-trend { display: grid; gap: 10px; padding-top: 14px; border-top: 1px solid var(--ps-card-line); }
.ps--todo .ps-trend { border-top-color: var(--ps-todo-line); }
.ps-trhead { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.ps-a7 { font-size: 13px; color: var(--ps-text-2); font-variant-numeric: tabular-nums; }
.ps-a7 b { color: var(--ps-text); font-weight: 600; }
.ps-spark { display: block; width: 100%; height: auto; overflow: visible; }
.ps-grid { stroke: #24204a; stroke-width: 1; }
.ps-raw { fill: none; stroke: #6a63a8; stroke-width: 1.4; stroke-dasharray: 3 3; }
.ps-pt { fill: #b3acf0; }
.ps-avg { fill: none; stroke: var(--ps-accent); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.ps-end { fill: var(--ps-accent); stroke: #07060f; stroke-width: 2; }
.ps-spark text { fill: var(--ps-text-3); font: 400 10px var(--ps-mono); }
.ps-legend { display: flex; flex-wrap: wrap; gap: 16px; font-size: 11.5px; color: var(--ps-text-3); }
.ps-legend i { display: inline-block; width: 16px; height: 0; margin-right: 6px; vertical-align: middle; border-top: 2px solid var(--ps-accent); }
.ps-legend i.dash { border-top: 2px dashed #6a63a8; }
 
@media (max-width: 520px) {
  .ps-more { grid-template-columns: 1fr; }
  .ps-go { width: 100%; }
  .ps-weekavg { text-align: left; }
  .ps-d .ps-v { font-size: 11px; }
}
@media (prefers-reduced-motion: no-preference) {
  .ps-d, .ps-chip, .ps-btn, .ps-go { transition: border-color .15s, background .15s, color .15s; }
}
 