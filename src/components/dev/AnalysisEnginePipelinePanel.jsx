/**
 * Onglet Pipeline — observabilité professionnelle (Flux / Tableau / Performance).
 * Partage le même stagesDetailed / pipelineSummary du rapport diagnostic.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  buildPipelineSummary,
  comparePipelineRuns,
  loadPipelineRunHistory,
  pushPipelineRunHistory,
  buildPipelineRunSnapshot
} from '../../utils/sport/analysisEnginePipelineModel';

function StagePill({ status, meta }) {
  const tone = meta?.tone || 'gray';
  return <span className={`aec-pill aec-tone-${tone}`}>{meta?.label || status || '—'}</span>;
}

function fmtMs(ms) {
  if (ms == null || Number.isNaN(ms)) return '—';
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
  return `${Math.round(ms)} ms`;
}

function fmtDelta(n, unit = '') {
  if (n == null) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n}${unit}`;
}

function ioLabel(st) {
  const unit = st.countUnitMeta?.short || '';
  const inn = st.inCount != null ? st.inCount : '—';
  const out = st.outCount != null ? st.outCount : '—';
  return `${inn} → ${out}${unit ? ` ${unit}` : ''}`;
}

export default function AnalysisEnginePipelinePanel({
  report,
  pipelineStep,
  setPipelineStep,
  StagePill: ExternalStagePill
}) {
  const Pill = ExternalStagePill || StagePill;
  const [mode, setMode] = useState('flow');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState('order');
  const [sortDir, setSortDir] = useState('asc');
  const [history, setHistory] = useState(() => loadPipelineRunHistory());
  const [compareId, setCompareId] = useState('');

  const stages = report?.stagesDetailed || [];
  const summary = useMemo(
    () => report?.pipelineSummary || buildPipelineSummary(stages),
    [report?.pipelineSummary, stages]
  );

  useEffect(() => {
    const snap = buildPipelineRunSnapshot(report);
    if (!snap) return;
    const next = pushPipelineRunHistory(snap);
    setHistory(next);
  }, [report?.meta?.generatedAt, report?.meta?.period]);

  const previous = useMemo(() => {
    if (!compareId) return history[1] || null;
    return history.find((h) => h.id === compareId) || null;
  }, [history, compareId]);

  const comparison = useMemo(() => {
    const current = buildPipelineRunSnapshot(report);
    return comparePipelineRuns(current, previous);
  }, [report, previous]);

  const filtered = useMemo(() => {
    let rows = [...stages];
    if (statusFilter !== 'all') {
      rows = rows.filter((s) => s.stageStatus === statusFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (s) =>
          String(s.label || '')
            .toLowerCase()
            .includes(q) ||
          String(s.module || '')
            .toLowerCase()
            .includes(q) ||
          String(s.id || '')
            .toLowerCase()
            .includes(q)
      );
    }
    const dir = sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return rows;
  }, [stages, statusFilter, query, sortKey, sortDir]);

  const maxMs = useMemo(
    () => Math.max(1, ...stages.map((s) => (s.ms != null ? s.ms : 0))),
    [stages]
  );

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'order' || key === 'label' ? 'asc' : 'desc');
    }
  };

  return (
    <div className="aec-panel aec-pipe-panel">
      <div className="aec-panel-head aec-pipe-head">
        <div>
          <h2>Pipeline d’exécution</h2>
          <p>
            Flux réel du moteur — les compteurs n’ont pas tous la même unité (agrégats ≠ candidats).
            Pertes = in−out seulement quand les deux sont typés et comparables.
          </p>
        </div>
        <div className="aec-seg aec-pipe-modes">
          {[
            ['flow', 'Flux'],
            ['table', 'Tableau'],
            ['perf', 'Performance']
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={mode === id ? 'is-on' : ''}
              onClick={() => setMode(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="aec-panel-body">
        <div className="aec-pipe-kpis">
          <div className="aec-pipe-kpi">
            <span className="aec-pipe-kpi-label">Étapes</span>
            <strong>
              {summary.executedCount}/{summary.stageCount}
            </strong>
            <span className="aec-faint">exécutées</span>
          </div>
          <div className="aec-pipe-kpi">
            <span className="aec-pipe-kpi-label">Durée chronométrée</span>
            <strong>{fmtMs(summary.totalMs)}</strong>
            <span className="aec-faint">
              {summary.untimedCount
                ? `${summary.untimedCount} sans ms`
                : `${summary.timedCount} étapes`}
            </span>
          </div>
          <div className="aec-pipe-kpi">
            <span className="aec-pipe-kpi-label">Plus coûteuse</span>
            <strong>{summary.slowest ? fmtMs(summary.slowest.ms) : '—'}</strong>
            <span className="aec-faint">{summary.slowest?.label || '—'}</span>
          </div>
          <div className="aec-pipe-kpi">
            <span className="aec-pipe-kpi-label">Pertes mesurables</span>
            <strong>{summary.totalDropped}</strong>
            <span className="aec-faint">
              sur {summary.lossSteps} étape{summary.lossSteps > 1 ? 's' : ''}
            </span>
          </div>
          <div className="aec-pipe-kpi">
            <span className="aec-pipe-kpi-label">Statuts</span>
            <strong>{summary.byStatus?.ok || 0} OK</strong>
            <span className="aec-faint">
              {(summary.byStatus?.warn || 0) + (summary.byStatus?.error || 0) + (summary.byStatus?.untraceable || 0)}{' '}
              à surveiller
            </span>
          </div>
        </div>

        {mode === 'flow' ? (
          <div className="aec-pipe-flow-layout">
            <div className="aec-pipe-flow">
              {stages.map((st, i) => (
                <React.Fragment key={st.id}>
                  {i > 0 ? (
                    <div
                      className={`aec-pipe-connector${
                        st.droppedApprox > 0 ? ' has-loss' : ''
                      }`}
                      aria-hidden
                    >
                      <span>
                        {st.droppedApprox != null && st.droppedApprox > 0
                          ? `−${st.droppedApprox}`
                          : '›'}
                      </span>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className={`aec-pipe-card aec-pipe-st-${st.stageStatus}${
                      pipelineStep?.id === st.id ? ' is-on' : ''
                    }`}
                    onClick={() => setPipelineStep(st)}
                  >
                    <div className="aec-pipe-card-top">
                      <span className="aec-pipe-ord">#{st.order}</span>
                      <Pill status={st.stageStatus} meta={st.stageMeta} />
                    </div>
                    <div className="aec-pipe-card-name" title={st.label}>
                      {st.label}
                    </div>
                    <div className="aec-pipe-card-module aec-mono" title={st.module}>
                      {st.module}
                    </div>
                    <div className="aec-pipe-card-stats">
                      <span title={st.countSemantics || ''}>{ioLabel(st)}</span>
                      <span>{fmtMs(st.ms)}</span>
                    </div>
                    {st.msShare != null ? (
                      <div className="aec-pipe-bar" title={`${st.msShare} % du temps chronométré`}>
                        <i style={{ width: `${Math.min(100, st.msShare)}%` }} />
                      </div>
                    ) : (
                      <div className="aec-pipe-bar is-empty" title="Durée non instrumentée" />
                    )}
                    {!st.countsComparable && st.hasIO ? (
                      <div className="aec-pipe-unit-warn">unités non comparables</div>
                    ) : null}
                  </button>
                </React.Fragment>
              ))}
            </div>

            <aside className="aec-pipe-inspector">
              {pipelineStep ? (
                <>
                  <div className="aec-pipe-insp-head">
                    <Pill status={pipelineStep.stageStatus} meta={pipelineStep.stageMeta} />
                    <span className="aec-mono">#{pipelineStep.order}</span>
                  </div>
                  <h3>{pipelineStep.label}</h3>
                  <p className="aec-mono aec-faint">{pipelineStep.module}</p>
                  <dl className="aec-pipe-insp-dl">
                    <div>
                      <dt>Id stable</dt>
                      <dd className="aec-mono">{pipelineStep.id}</dd>
                    </div>
                    <div>
                      <dt>Exécution technique</dt>
                      <dd>{pipelineStep.technicallyExecuted ? 'oui' : 'non'}</dd>
                    </div>
                    <div>
                      <dt>Résultat fonctionnel</dt>
                      <dd>{pipelineStep.functionallyOk ? 'OK' : 'à vérifier'}</dd>
                    </div>
                    <div>
                      <dt>Durée</dt>
                      <dd>
                        {fmtMs(pipelineStep.ms)}
                        {pipelineStep.msShare != null ? ` · ${pipelineStep.msShare} %` : ''}
                      </dd>
                    </div>
                    <div>
                      <dt>Début / fin</dt>
                      <dd className="aec-mono" style={{ fontSize: 10 }}>
                        {pipelineStep.startedAt || '—'}
                        <br />
                        {pipelineStep.endedAt || '—'}
                      </dd>
                    </div>
                    <div>
                      <dt>Entrée → sortie</dt>
                      <dd>{ioLabel(pipelineStep)}</dd>
                    </div>
                    <div>
                      <dt>Produits / filtrés / fusionnés</dt>
                      <dd>
                        {pipelineStep.produced ?? '—'} / {pipelineStep.filtered ?? '—'} /{' '}
                        {pipelineStep.merged ?? '—'}
                      </dd>
                    </div>
                    <div>
                      <dt>Pertes</dt>
                      <dd>
                        {pipelineStep.droppedApprox != null
                          ? pipelineStep.droppedApprox
                          : 'non mesurable'}
                      </dd>
                    </div>
                    <div>
                      <dt>Unité</dt>
                      <dd>
                        {pipelineStep.countUnitMeta?.label || pipelineStep.countUnit || '—'}
                      </dd>
                    </div>
                  </dl>
                  {pipelineStep.countSemantics ? (
                    <p className="aec-pipe-semantics">{pipelineStep.countSemantics}</p>
                  ) : null}
                  {pipelineStep.skippedReason ? (
                    <p className="aec-pipe-note">Ignorée : {pipelineStep.skippedReason}</p>
                  ) : null}
                  {(pipelineStep.errors || []).length ? (
                    <p className="aec-pipe-err">{pipelineStep.errors.join(' · ')}</p>
                  ) : null}
                  {(pipelineStep.warnings || []).length ? (
                    <p className="aec-pipe-warn">{pipelineStep.warnings.join(' · ')}</p>
                  ) : null}
                  {pipelineStep.detail ? (
                    <pre className="aec-for-pre">{JSON.stringify(pipelineStep.detail, null, 2)}</pre>
                  ) : null}
                </>
              ) : (
                <div className="aec-detail-empty">
                  Sélectionne une étape pour inspecter durée, I/O, sémantique des compteurs et
                  détail.
                </div>
              )}
            </aside>
          </div>
        ) : null}

        {mode === 'table' ? (
          <>
            <div className="aec-pipe-table-tools">
              <input
                className="aec-input"
                placeholder="Rechercher étape / module / id…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                className="aec-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tous statuts</option>
                <option value="ok">OK</option>
                <option value="warn">Avertissement</option>
                <option value="error">Erreur</option>
                <option value="skipped">Ignorée</option>
                <option value="untraceable">Non traçable</option>
                <option value="not_run">Non exécutée</option>
              </select>
            </div>
            <div className="aec-table-wrap aec-pipe-table-wrap">
              <table className="aec-table aec-pipe-table">
                <thead>
                  <tr>
                    {[
                      ['order', '#'],
                      ['label', 'Étape'],
                      ['module', 'Module'],
                      ['stageStatus', 'Statut'],
                      ['inCount', 'in'],
                      ['outCount', 'out'],
                      ['droppedApprox', 'Pertes'],
                      ['countUnit', 'Unité'],
                      ['ms', 'ms'],
                      ['msShare', '%']
                    ].map(([key, lab]) => (
                      <th key={key}>
                        <button type="button" className="aec-th-btn" onClick={() => toggleSort(key)}>
                          {lab}
                          {sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                        </button>
                      </th>
                    ))}
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((st) => (
                    <tr
                      key={st.id}
                      className={pipelineStep?.id === st.id ? 'is-selected' : ''}
                      onClick={() => setPipelineStep(st)}
                    >
                      <td>{st.order}</td>
                      <td className="aec-pipe-td-label">{st.label}</td>
                      <td className="aec-mono">{st.module}</td>
                      <td>
                        <Pill status={st.stageStatus} meta={st.stageMeta} />
                      </td>
                      <td className="aec-num">{st.inCount ?? '—'}</td>
                      <td className="aec-num">{st.outCount ?? '—'}</td>
                      <td className="aec-num">
                        {st.droppedApprox != null ? st.droppedApprox : 'n/m'}
                      </td>
                      <td className="aec-mono">{st.countUnitMeta?.short || st.countUnit || '—'}</td>
                      <td className="aec-num">{st.ms ?? '—'}</td>
                      <td className="aec-num">{st.msShare != null ? st.msShare : '—'}</td>
                      <td className="aec-pipe-td-notes">
                        {(st.errors || []).join('; ') ||
                          (st.warnings || []).join('; ') ||
                          st.skippedReason ||
                          (!st.hasTiming ? 'sans durée' : '') ||
                          ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pipelineStep ? (
              <div className="aec-pipe-table-detail">
                <strong>{pipelineStep.label}</strong>
                <span className="aec-mono"> · {pipelineStep.id}</span>
                {pipelineStep.countSemantics ? (
                  <p className="aec-pipe-semantics">{pipelineStep.countSemantics}</p>
                ) : null}
                {pipelineStep.detail ? (
                  <pre className="aec-for-pre">{JSON.stringify(pipelineStep.detail, null, 2)}</pre>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}

        {mode === 'perf' ? (
          <div className="aec-pipe-perf">
            <div className="aec-pipe-perf-toolbar">
              <label>
                Comparer à{' '}
                <select
                  className="aec-select"
                  value={compareId}
                  onChange={(e) => setCompareId(e.target.value)}
                >
                  <option value="">Run précédent (auto)</option>
                  {history.slice(1).map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.period} · {h.generatedAt?.slice(11, 19) || h.id} · {fmtMs(h.totalMs)}
                    </option>
                  ))}
                </select>
              </label>
              <span className="aec-faint">
                Historique session : {history.length} run{history.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="aec-pipe-perf-bars">
              {[...stages]
                .filter((s) => s.ms != null)
                .sort((a, b) => b.ms - a.ms)
                .map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    className={`aec-pipe-perf-row${pipelineStep?.id === st.id ? ' is-on' : ''}`}
                    onClick={() => setPipelineStep(st)}
                  >
                    <span className="aec-pipe-perf-name" title={st.label}>
                      {st.label}
                    </span>
                    <span className="aec-pipe-perf-track">
                      <i style={{ width: `${Math.round((st.ms / maxMs) * 100)}%` }} />
                    </span>
                    <span className="aec-mono aec-pipe-perf-ms">
                      {fmtMs(st.ms)}
                      {st.msShare != null ? ` (${st.msShare}%)` : ''}
                    </span>
                  </button>
                ))}
              {!stages.some((s) => s.ms != null) ? (
                <p className="aec-muted">Aucune durée instrumentée sur ce run.</p>
              ) : null}
            </div>

            {comparison ? (
              <div className="aec-pipe-compare">
                <h3>
                  Delta vs run précédent
                  {comparison.totalMsDelta != null ? (
                    <span className="aec-faint">
                      {' '}
                      · total {fmtDelta(comparison.totalMsDelta, ' ms')}
                    </span>
                  ) : null}
                </h3>
                <div className="aec-table-wrap">
                  <table className="aec-table aec-pipe-table">
                    <thead>
                      <tr>
                        <th>Étape</th>
                        <th>ms</th>
                        <th>Δ ms</th>
                        <th>out</th>
                        <th>Δ out</th>
                        <th>pertes</th>
                        <th>Δ pertes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.rows.map((r) => (
                        <tr key={r.id}>
                          <td>{r.label}</td>
                          <td className="aec-num">{r.ms ?? '—'}</td>
                          <td
                            className="aec-num"
                            style={{
                              color:
                                r.msDelta > 0
                                  ? 'var(--aec-orange)'
                                  : r.msDelta < 0
                                    ? 'var(--aec-green)'
                                    : undefined
                            }}
                          >
                            {fmtDelta(r.msDelta)}
                          </td>
                          <td className="aec-num">{r.outCount ?? '—'}</td>
                          <td className="aec-num">{fmtDelta(r.outDelta)}</td>
                          <td className="aec-num">{r.dropped ?? '—'}</td>
                          <td className="aec-num">{fmtDelta(r.dropDelta)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="aec-muted" style={{ marginTop: 12 }}>
                Relance l’analyse pour constituer un historique de comparaison temporelle.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
