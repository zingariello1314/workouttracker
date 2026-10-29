/* Module « Semaine » : sélecteurs préfixés .wk pour éviter tout conflit. Couleurs identiques à la version validée (vert / bleu). Version compacte. */
.wk {
  --wk-card: #08110f;
  --wk-line: #14231f;
  --wk-text: #f2f6f4;
  --wk-text-2: #9aa8a3;
  --wk-text-3: #6f7d78;
  --wk-green: #34e0a8;
  --wk-green-bg: #0b2a21;
  --wk-green-line: #1f8f6c;
  --wk-blue: #4a9eff;
  --wk-blue-bg: #0e2038;
  --wk-blue-line: #1c4a7e;
  --wk-amber: #f5b53d;
  --wk-field: #0b1514;
  --wk-field-line: #1b2a27;
  --wk-head: 'Space Grotesk', system-ui, sans-serif;
  --wk-body: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --wk-mono: 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace;

  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(0, 1fr); /* empêche la longue liste de semaines d'élargir la carte */
  gap: 10px;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  padding: 12px 16px 14px;
  border-radius: 14px;
  background: var(--wk-card);
  border: 1px solid var(--wk-line);
  color: var(--wk-text);
  font: 13px var(--wk-body);
}
.wk *, .wk *::before, .wk *::after { box-sizing: border-box; }
.wk > * { min-width: 0; }
.wk button { font-family: inherit; }
.wk :focus-visible { outline: 2px solid var(--wk-green); outline-offset: 2px; }

.wk-eyebrow { flex: none; font: 400 10px var(--wk-mono); letter-spacing: .16em; text-transform: uppercase; color: var(--wk-text-3); }
.wk-eyebrow::before { content: '— '; }

.wk-main { display: flex; align-items: center; gap: 12px; }
.wk-strip { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; }
.wk-sq {
  display: grid; place-items: center; flex: none; width: 30px; height: 30px; cursor: pointer;
  font-size: 16px; color: var(--wk-text); background: var(--wk-field); border: 1px solid var(--wk-field-line); border-radius: 9px;
}
.wk-sq:hover:not(:disabled) { border-color: #2f4540; }
.wk-sq:disabled { opacity: .4; cursor: default; color: var(--wk-text-3); }

.wk-pills {
  display: flex; gap: 5px; flex: 1; min-width: 0; position: relative; overflow-x: auto; padding-block: 2px; scrollbar-width: none;
  -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 18px, #000 calc(100% - 18px), transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0, #000 18px, #000 calc(100% - 18px), transparent 100%);
}
.wk-pills::-webkit-scrollbar { display: none; }
.wk-pill {
  position: relative; flex: none; white-space: nowrap; cursor: pointer; padding: 5px 10px 9px;
  color: var(--wk-text-2); background: transparent; border: 1px solid var(--wk-field-line); border-radius: 8px; font: 500 12.5px var(--wk-body);
}
.wk-pill:hover { color: var(--wk-text); border-color: #2f4540; }
.wk-lbl { display: inline-flex; align-items: baseline; gap: 7px; }
.wk-lbl b { font-weight: 600; }
.wk-rg { font-size: 11px; color: var(--wk-text-3); }
.wk-live, .wk-chg { align-self: center; width: 6px; height: 6px; border-radius: 50%; }
.wk-live { background: var(--wk-green); }
.wk-chg { background: var(--wk-blue); }
.wk-pg { position: absolute; left: 9px; right: 9px; bottom: 3px; height: 2px; border-radius: 2px; background: #15231f; overflow: hidden; }
.wk-pg i { display: block; height: 100%; border-radius: 2px; background: var(--wk-text-3); }
.wk-pg i.full { background: var(--wk-green); }
.wk-pg i.mid { background: var(--wk-amber); }
.wk-pill.on { color: var(--wk-green); background: var(--wk-green-bg); border-color: var(--wk-green-line); font-weight: 600; }
.wk-pill.on .wk-rg { color: var(--wk-green); opacity: .75; }

.wk-btn {
  flex: none; padding: 7px 14px; cursor: pointer; white-space: nowrap; font: 600 12.5px var(--wk-body);
  color: var(--wk-blue); background: var(--wk-blue-bg); border: 1px solid var(--wk-blue-line); border-radius: 9px;
}
.wk-btn:hover:not(:disabled) { background: #132b4b; }
.wk-btn:disabled { opacity: .4; cursor: default; }
.wk-btn-s { padding: 5px 12px; }

.wk-info { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 18px; font-size: 12.5px; color: var(--wk-text-2); }
.wk-info b { color: var(--wk-text); font-weight: 600; font-variant-numeric: tabular-nums; }
.wk-ttl { font: 600 14px var(--wk-head); color: var(--wk-text); }
.wk-dn { color: var(--wk-green); }
.wk-up { color: var(--wk-amber); }
.wk-blue { color: var(--wk-blue); }
.wk-past {
  padding: 7px 12px; border-radius: 9px; font-size: 12px; font-weight: 500;
  color: var(--wk-amber); background: rgba(245, 181, 61, .07); border: 1px solid rgba(245, 181, 61, .4);
}

.wk-days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 5px; }
.wk-d {
  display: grid; gap: 2px; min-width: 0; padding: 6px 2px 6px; text-align: center; cursor: pointer;
  color: var(--wk-text); background: transparent; border: 1px solid var(--wk-field-line); border-radius: 9px;
}
.wk-d:hover:not(:disabled) { border-color: #2f4540; }
.wk-n { font-size: 11px; color: var(--wk-text-3); white-space: nowrap; }
.wk-v { min-height: 16px; font: 500 12px var(--wk-mono); font-variant-numeric: tabular-nums; color: var(--wk-text-3); }
.wk-bar { height: 2px; margin-inline: 10px; border-radius: 2px; background: #15231f; overflow: hidden; }
.wk-bar i { display: block; height: 100%; border-radius: 2px; }
.wk-d.done .wk-v { color: var(--wk-green); } .wk-d.done .wk-bar i { background: var(--wk-green); }
.wk-d.part .wk-v { color: var(--wk-amber); } .wk-d.part .wk-bar i { background: var(--wk-amber); }
.wk-d.rest .wk-v { font-family: var(--wk-body); font-size: 11px; }
.wk-d.is-today .wk-n { color: var(--wk-amber); font-weight: 600; }
.wk-d.sel { background: var(--wk-green-bg); border-color: var(--wk-green-line); }
.wk-d.sel .wk-n { color: var(--wk-green); }
.wk-d:disabled { opacity: .4; cursor: default; }

.wk-tools { display: flex; flex-wrap: wrap; gap: 6px 16px; align-items: center; padding-top: 9px; border-top: 1px solid var(--wk-line); }
.wk-lnk { padding: 0 0 1px; cursor: pointer; background: none; border: 0; border-bottom: 1px dotted var(--wk-blue-line); color: var(--wk-blue); font: 500 12px var(--wk-body); }
.wk-input { height: 30px; min-width: 0; padding: 0 9px; border-radius: 8px; background: #12161f; border: 1px solid #232c3a; color: var(--wk-text); font: 500 12.5px var(--wk-body); }
.wk-input:focus { outline: none; border-color: var(--wk-green-line); }
.wk-note { flex: 1 1 200px; }
.wk-legend { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-left: auto; font-size: 11px; color: var(--wk-text-3); }
.wk-legend span { display: inline-flex; align-items: center; gap: 5px; }
.wk-legend i { display: inline-block; width: 7px; height: 7px; border-radius: 50%; }

@media (max-width: 720px) {
  .wk-main { flex-wrap: wrap; }
  .wk-strip { order: 2; flex: 1 1 100%; }
  .wk-eyebrow { order: 1; }
  .wk-main > .wk-btn { order: 1; margin-left: auto; }
  .wk-v { font-size: 10.5px; }
  .wk-n { font-size: 10px; }
  .wk-legend { margin-left: 0; }
}
@media (prefers-reduced-motion: no-preference) {
  .wk-pill, .wk-sq, .wk-btn, .wk-d { transition: border-color .15s, background .15s, color .15s; }
}
