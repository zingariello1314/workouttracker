/**
 * Console de diagnostic du moteur d'analyse — DEV + admin.
 * Fenêtre sur le pipeline réel (collectDiagnostic), pas un moteur parallèle.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useAuth } from '../../context/AuthContext';
import { isAdminUser } from '../../utils/accessControl';
import {
  buildAnalysisEngineDiagnosticReport,
  compareDiagnosticOverviews,
  DIAGNOSTIC_PERIODS
} from '../../utils/sport/analysisEngineDiagnostic';
import {
  DIAG_STATUS,
  DIAG_STATUS_META,
  DATA_STATUS_META,
  STAGE_STATUS_META
} from '../../utils/sport/analysisEngineDiagnosticModel';
import { getRecapDateWindow } from '../../utils/sport/recapMuscleLoadEngine';
import { useGarminData } from '../../hooks/useGarminData';
import { useRecapCrossCoachGarmin } from '../../hooks/useRecapCrossCoachGarmin';
import DateHelper from '../../utils/dateHelper';
import './AnalysisEngineConsole.css';

const PAGE_SIZE = 40;

const SECTIONS = [
  { id: 'overview', label: 'Vue d’ensemble' },
  { id: 'registry', label: 'Registre' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'data', label: 'Données' },
  { id: 'families', label: 'Familles' },
  { id: 'correlations', label: 'Corrélations' },
  { id: 'gaps', label: 'Absences' },
  { id: 'prose', label: 'Texte final' },
  { id: 'limits', label: 'Limites' }
];

const PERIOD_LABELS = {
  today: 'Aujourd’hui',
  '7d': '7 jours',
  '30d': '30 jours',
  '3m': '3 mois',
  '6m': '6 mois',
  '1y': '1 an',
  all: 'Tout'
};

const QUICK_FILTERS = [
  { id: 'all', label: 'Toutes' },
  { id: 'shown_now', label: 'Affichées (run)' },
  { id: 'intermediate', label: 'Intermédiaires' },
  { id: 'demoted', label: 'Déclassées' },
  { id: 'rejected', label: 'Rejetées' },
  { id: 'no_evidence', label: 'Sans preuve' },
  { id: 'dupes', label: 'Redondances suspectes' },
  { id: 'cross', label: 'Transversales' },
  { id: 'unknown', label: 'Non traçables' }
];

function TonePill({ tone, children }) {
  return <span className={`aec-pill aec-tone-${tone || 'gray'}`}>{children}</span>;
}

function StatusPill({ status }) {
  const meta = DIAG_STATUS_META[status] || DIAG_STATUS_META[DIAG_STATUS.UNKNOWN];
  return <TonePill tone={meta.tone}>{meta.label}</TonePill>;
}

function DataPill({ status }) {
  const meta = DATA_STATUS_META[status] || DATA_STATUS_META.not_instrumented;
  return <TonePill tone={meta.tone}>{meta.label}</TonePill>;
}

function StagePill({ status }) {
  const meta = STAGE_STATUS_META[status] || STAGE_STATUS_META.untraceable;
  return <TonePill tone={meta.tone}>{meta.label}</TonePill>;
}

function garminStatusLabel(partial, bundle) {
  if (partial?.status === 'loading') return { tone: 'orange', text: 'chargement' };
  if (partial?.status === 'ready' && partial?.hasAnyGarminSignal) {
    return { tone: 'green', text: 'branché' };
  }
  if (bundle && typeof bundle === 'object' && Object.keys(bundle).length) {
    return { tone: 'orange', text: 'bundle partiel' };
  }
  if (partial?.status === 'ready') return { tone: 'orange', text: 'sans signal' };
  return { tone: 'gray', text: 'non chargé' };
}

function DetailInspector({ row }) {
  const [tab, setTab] = useState('text');
  if (!row) {
    return (
      <div className="aec-detail aec-muted">
        Sélectionne une ligne du registre pour inspecter texte, preuves, étapes et raisons.
      </div>
    );
  }
  return (
    <div className="aec-detail">
      <div className="aec-tabs-mini">
        {[
          ['text', 'Texte'],
          ['decision', 'Décision'],
          ['evidence', 'Preuves'],
          ['raw', 'Brut']
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? 'is-on' : ''}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <StatusPill status={row.diagStatus} />
        {row.isCrossFamily ? <TonePill tone="violet">transversale</TonePill> : null}
        <span className="aec-mono">{row.id}</span>
      </div>
      <p className="aec-muted" style={{ margin: '6px 0 0', fontSize: 11 }}>
        Portée affichage :{' '}
        <strong style={{ color: 'var(--aec-text)' }}>
          {row.displayScope === 'current_run'
            ? 'pack final de CE run'
            : 'non affichée dans ce run'}
        </strong>
      </p>
      {tab === 'text' ? (
        <>
          <h3>{row.title || '(sans titre)'}</h3>
          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{row.body}</p>
          {row.evidence ? <p className="aec-muted">Preuve : {row.evidence}</p> : null}
        </>
      ) : null}
      {tab === 'decision' ? (
        <>
          <p>
            Famille <strong>{row.family || '—'}</strong> · nature {row.nature || '—'} · horizon{' '}
            {row.horizon || '—'}
          </p>
          <p>
            Génération : <span className="aec-mono">{row.generationStage || '—'}</span>
          </p>
          <p>
            Étape finale : <span className="aec-mono">{row.finalStageReached || '—'}</span>
          </p>
          <p>
            Module : <span className="aec-mono">{row.moduleHint || '—'}</span>
          </p>
          <p>
            Raison :{' '}
            <span style={{ color: row.decisionReason ? 'var(--aec-orange)' : 'var(--aec-muted)' }}>
              {row.decisionReason || '—'}
            </span>
          </p>
          <p className="aec-muted" style={{ fontSize: 11 }}>
            {row.diagMeta?.meaning}
          </p>
          <p>
            Qualité :{' '}
            {(row.quality?.flags || []).length
              ? row.quality.flags.map((f) => (
                  <TonePill key={f} tone="orange">
                    {f}
                  </TonePill>
                ))
              : 'ok'}{' '}
            · niveau {row.quality?.levelHint ?? '—'}
          </p>
        </>
      ) : null}
      {tab === 'evidence' ? (
        <>
          <p>
            Preuves estimées : <strong>{row.evidenceCount}</strong> · sources estimées :{' '}
            <strong>{row.sourceCount}</strong> · familles croisées :{' '}
            <strong>{row.crossedFamilies}</strong>
          </p>
          <p className="aec-muted" style={{ fontSize: 11 }}>
            Compteurs heuristiques (voir Limites) — pas un lineage record→insight officiel.
          </p>
          <pre>{JSON.stringify(row.metrics || {}, null, 2)}</pre>
        </>
      ) : null}
      {tab === 'raw' ? <pre>{JSON.stringify(row, null, 2)}</pre> : null}
    </div>
  );
}

export default function AnalysisEngineConsole() {
  const {
    getCurrentData,
    getExerciseNameById,
    activeProgram,
    programs,
    getTodayWorkout = null
  } = useWorkout();
  const { currentUser, isAuthenticated } = useAuth();
  const isAdmin = isAdminUser(currentUser);
  const canAccess = import.meta.env.DEV || isAdmin;

  const [period, setPeriod] = useState('30d');
  const [comparePeriod, setComparePeriod] = useState('');
  const [section, setSection] = useState('registry');
  const [report, setReport] = useState(null);
  const [compareReport, setCompareReport] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [familyFilter, setFamilyFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(0);
  const [garminBundle, setGarminBundle] = useState(null);
  const [autoGarminPass, setAutoGarminPass] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(null);

  const periodWindow = useMemo(() => getRecapDateWindow(period, new Date()), [period]);
  const garminRange = useMemo(() => {
    const end = periodWindow?.end;
    if (!end) return { startYmd: null, endYmd: null };
    const lookback90 = DateHelper.addDays(end, -89);
    if (!periodWindow.start) {
      return { startYmd: DateHelper.addDays(end, -365), endYmd: end };
    }
    return {
      startYmd: periodWindow.start <= lookback90 ? periodWindow.start : lookback90,
      endYmd: end
    };
  }, [periodWindow.start, periodWindow.end]);

  const snapshotPreview = useMemo(
    () => (canAccess ? getCurrentData() || {} : {}),
    [canAccess, getCurrentData]
  );

  const garminPartial = useRecapCrossCoachGarmin({
    startYmd: garminRange.startYmd,
    endYmd: garminRange.endYmd,
    enabled: canAccess && isAuthenticated,
    manualWalkByDate: snapshotPreview?.enduranceData?.manualDailyWalkByDate ?? null,
    manualSleepByDate: snapshotPreview?.manualSleepByDate ?? null
  });

  const { loadAllData, dbReady } = useGarminData();

  useEffect(() => {
    if (!canAccess || !isAuthenticated || !dbReady) return undefined;
    let cancelled = false;
    loadAllData()
      .then((bundle) => {
        if (!cancelled && bundle) setGarminBundle(bundle);
      })
      .catch(() => {
        if (!cancelled) setGarminBundle(null);
      });
    return () => {
      cancelled = true;
    };
  }, [canAccess, isAuthenticated, dbReady, loadAllData]);

  const run = useCallback(async () => {
    if (!canAccess) return;
    setBusy(true);
    setError(null);
    setSelected(null);
    setPage(0);
    try {
      const snapshot = getCurrentData() || {};
      const window = getRecapDateWindow(period, new Date());
      const base = {
        snapshot,
        period,
        window,
        garminData: garminBundle,
        garminPartial,
        getExerciseNameById,
        activeProgram,
        programs: Array.isArray(programs) ? programs : [],
        isAdmin,
        isAuthenticated,
        getTodayWorkout
      };
      const next = buildAnalysisEngineDiagnosticReport(base);
      setReport(next);
      if (comparePeriod && comparePeriod !== period) {
        const w2 = getRecapDateWindow(comparePeriod, new Date());
        setCompareReport(
          buildAnalysisEngineDiagnosticReport({ ...base, period: comparePeriod, window: w2 })
        );
      } else {
        setCompareReport(null);
      }
    } catch (e) {
      setError(String(e?.message || e));
      setReport(null);
    } finally {
      setBusy(false);
    }
  }, [
    canAccess,
    getCurrentData,
    period,
    comparePeriod,
    garminBundle,
    garminPartial,
    getExerciseNameById,
    activeProgram,
    programs,
    isAdmin,
    isAuthenticated,
    getTodayWorkout
  ]);

  useEffect(() => {
    if (!canAccess) return;
    if (garminPartial?.status === 'loading') return;
    if (!report) {
      void run();
      if (garminPartial?.status === 'ready') setAutoGarminPass(true);
      return;
    }
    if (!autoGarminPass && garminPartial?.status === 'ready') {
      setAutoGarminPass(true);
      void run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess, garminPartial?.status, garminBundle]);

  const comparison = useMemo(
    () => (report && compareReport ? compareDiagnosticOverviews(report, compareReport) : null),
    [report, compareReport]
  );

  const registryRows = report?.registry?.rows || [];
  const families = useMemo(() => {
    const set = new Set(registryRows.map((r) => r.family).filter(Boolean));
    return ['all', ...[...set].sort()];
  }, [registryRows]);

  const activeQuick = section === 'prose' ? 'shown_now' : quickFilter;

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return registryRows.filter((r) => {
      if (familyFilter !== 'all' && r.family !== familyFilter) return false;
      if (activeQuick === 'shown_now' && r.diagStatus !== DIAG_STATUS.SHOWN_NOW) return false;
      if (activeQuick === 'intermediate' && r.diagStatus !== DIAG_STATUS.INTERMEDIATE) return false;
      if (activeQuick === 'demoted' && r.diagStatus !== DIAG_STATUS.DEMOTED) return false;
      if (activeQuick === 'rejected' && r.diagStatus !== DIAG_STATUS.REJECTED) return false;
      if (activeQuick === 'unknown' && r.diagStatus !== DIAG_STATUS.UNKNOWN) return false;
      if (activeQuick === 'cross' && !r.isCrossFamily) return false;
      if (activeQuick === 'no_evidence' && r.evidenceCount > 0) return false;
      if (activeQuick === 'dupes') {
        const t = String(r.title || r.body || '')
          .slice(0, 48)
          .toLowerCase();
        const dup =
          registryRows.filter(
            (x) =>
              String(x.title || x.body || '')
                .slice(0, 48)
                .toLowerCase() === t
          ).length > 1;
        if (!dup) return false;
      }
      if (!q) return true;
      return `${r.id} ${r.kind} ${r.family} ${r.title} ${r.body} ${r.decisionReason || ''}`
        .toLowerCase()
        .includes(q);
    });
  }, [registryRows, query, activeQuick, familyFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pageRows = filteredRows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [quickFilter, familyFilter, query, section]);

  const navCounts = useMemo(() => {
    if (!report) return {};
    return {
      overview: report.registry?.counts?.shown_now ?? 0,
      registry: report.registry?.counts?.total ?? 0,
      pipeline: report.stagesDetailed?.length ?? report.stages?.length ?? 0,
      data: report.dataInventory?.length ?? 0,
      families: report.families?.length ?? 0,
      correlations: report.correlations?.length ?? 0,
      gaps: report.opportunities?.length ?? 0,
      prose: report.registry?.counts?.shown_now ?? 0,
      limits: report.limits?.length ?? 0
    };
  }, [report]);

  const garminUi = garminStatusLabel(garminPartial, garminBundle);
  const counts = report?.registry?.counts;

  const exportJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-engine-diag-${period}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportMarkdown = () => {
    if (!report) return;
    const c = report.registry?.counts || {};
    const lines = [
      `# Diagnostic moteur — ${period}`,
      '',
      `- Généré : ${report.meta?.generatedAt}`,
      `- Affichées (run) : ${c.shown_now}`,
      `- Intermédiaires : ${c.intermediate}`,
      `- Déclassées : ${c.demoted}`,
      `- Rejetées : ${c.rejected}`,
      `- Signaux : ${report.overview?.signalsDetected}`,
      `- Durée : ${report.overview?.totalMs} ms`,
      '',
      '## Limites',
      ...(report.limits || []).map((l) => `- ${l.text}`),
      '',
      '## Top rejets',
      ...filteredRows
        .filter((r) => r.diagStatus === DIAG_STATUS.REJECTED || r.diagStatus === DIAG_STATUS.DEMOTED)
        .slice(0, 20)
        .map((r) => `- \`${r.kind}\` — ${r.decisionReason || r.diagStatus}`)
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-engine-diag-${period}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copySelected = async () => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(selected, null, 2));
    } catch {
      /* ignore */
    }
  };

  if (!canAccess) {
    return (
      <div className="aec">
        <div className="aec-banner aec-banner-empty">
          Console réservée au mode développement ou au compte admin.
        </div>
      </div>
    );
  }

  return (
    <div className="aec">
      <div className="aec-shell">
        <header className="aec-topbar">
          <div className="aec-topbar-title">
            <strong>Console diagnostic — moteur d’analyse</strong>
            <span>
              Pipeline réel · {import.meta.env.DEV ? 'DEV' : 'admin'} · vert = pack de{' '}
              <em>ce</em> run · pas de LLM
            </span>
          </div>
          <div className="aec-topbar-controls">
            <label className="aec-field">
              Période
              <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                {DIAGNOSTIC_PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {PERIOD_LABELS[p] || p}
                  </option>
                ))}
              </select>
            </label>
            <label className="aec-field">
              Comparer
              <select value={comparePeriod} onChange={(e) => setComparePeriod(e.target.value)}>
                <option value="">—</option>
                {DIAGNOSTIC_PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {PERIOD_LABELS[p] || p}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="aec-btn aec-btn-primary" onClick={run} disabled={busy}>
              {busy ? 'Analyse…' : 'Relancer'}
            </button>
            <button type="button" className="aec-btn aec-btn-ghost" onClick={exportJson} disabled={!report}>
              JSON
            </button>
            <button
              type="button"
              className="aec-btn aec-btn-ghost"
              onClick={exportMarkdown}
              disabled={!report}
            >
              Markdown
            </button>
            <button
              type="button"
              className="aec-btn aec-btn-ghost"
              onClick={copySelected}
              disabled={!selected}
            >
              Copier
            </button>
          </div>
        </header>

        <div className="aec-body">
          <nav className="aec-nav" aria-label="Modules diagnostic">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`aec-nav-btn${section === s.id ? ' is-active' : ''}`}
                onClick={() => setSection(s.id)}
              >
                <span>{s.label}</span>
                <span className="aec-nav-count">{navCounts[s.id] ?? '—'}</span>
              </button>
            ))}
          </nav>

          <div className="aec-main">
            <div className="aec-main-scroll">
              {error ? <div className="aec-banner aec-banner-error">{error}</div> : null}
              {!report && !busy ? (
                <div className="aec-banner aec-banner-empty">En attente du premier run…</div>
              ) : null}
              {busy && !report ? (
                <div className="aec-banner aec-banner-empty">Exécution du pipeline…</div>
              ) : null}

              {report ? (
                <>
                  <div className="aec-kpi-row">
                    <div className="aec-kpi">
                      <div className="aec-kpi-label">Période</div>
                      <div className="aec-kpi-value" style={{ fontSize: '1rem' }}>
                        {PERIOD_LABELS[report.overview.period] || report.overview.period}
                      </div>
                      <div className="aec-kpi-hint">
                        {report.overview.window
                          ? `${report.overview.window.start} → ${report.overview.window.end}`
                          : '—'}
                      </div>
                    </div>
                    <div className="aec-kpi">
                      <div className="aec-kpi-label">Affichées (run)</div>
                      <div className="aec-kpi-value">{counts?.shown_now ?? 0}</div>
                      <div className="aec-kpi-hint">vert = ce run seulement</div>
                    </div>
                    <div className="aec-kpi">
                      <div className="aec-kpi-label">Intermédiaires</div>
                      <div className="aec-kpi-value">{counts?.intermediate ?? 0}</div>
                      <div className="aec-kpi-hint">retenues non affichées</div>
                    </div>
                    <div className="aec-kpi">
                      <div className="aec-kpi-label">Déclassées</div>
                      <div className="aec-kpi-value">{counts?.demoted ?? 0}</div>
                      <div className="aec-kpi-hint">caps / dédup / rivaux</div>
                    </div>
                    <div className="aec-kpi">
                      <div className="aec-kpi-label">Rejetées</div>
                      <div className="aec-kpi-value">{counts?.rejected ?? 0}</div>
                      <div className="aec-kpi-hint">validation / data</div>
                    </div>
                    <div className="aec-kpi">
                      <div className="aec-kpi-label">Garmin</div>
                      <div className="aec-kpi-value" style={{ fontSize: '0.95rem' }}>
                        <TonePill tone={garminUi.tone}>{garminUi.text}</TonePill>
                      </div>
                      <div className="aec-kpi-hint">
                        {garminPartial?.daysWithStepsData != null
                          ? `${garminPartial.daysWithStepsData} j. pas`
                          : '—'}
                      </div>
                    </div>
                    <div className="aec-kpi">
                      <div className="aec-kpi-label">Durée</div>
                      <div className="aec-kpi-value">{report.overview.totalMs}</div>
                      <div className="aec-kpi-hint">ms</div>
                    </div>
                  </div>

                  {section === 'overview' ? (
                    <div className="aec-panel">
                      <div className="aec-panel-head">
                        <h2>Vue d’ensemble</h2>
                        <p>
                          Compteurs exclusifs du registre · {counts?.total ?? 0} candidats uniques
                          sur ce run.
                        </p>
                      </div>
                      <div className="aec-panel-body">
                        <div className="aec-legend">
                          {Object.values(DIAG_STATUS_META).map((m) => (
                            <span key={m.label}>
                              <TonePill tone={m.tone}>{m.label}</TonePill>
                            </span>
                          ))}
                        </div>
                        <p style={{ fontSize: 13, margin: '0 0 8px' }}>
                          Signaux détectés <strong>{report.overview.signalsDetected}</strong> · pack
                          affiché <strong>{counts?.shown_now}</strong> · hors écran{' '}
                          <strong>
                            {(counts?.intermediate || 0) +
                              (counts?.demoted || 0) +
                              (counts?.rejected || 0) +
                              (counts?.unknown || 0)}
                          </strong>
                          .
                        </p>
                        <div className="aec-flow">
                          {(report.stagesDetailed || []).slice(0, 8).map((st, i) => (
                            <React.Fragment key={st.id || i}>
                              {i > 0 ? <span className="aec-flow-arrow">→</span> : null}
                              <span className="aec-flow-step">
                                {st.label}{' '}
                                <StagePill status={st.stageStatus} />
                              </span>
                            </React.Fragment>
                          ))}
                        </div>
                        {report.overview.warnings?.length ? (
                          <ul className="aec-list" style={{ color: 'var(--aec-orange)' }}>
                            {report.overview.warnings.map((w) => (
                              <li key={w}>{w}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="aec-muted">Aucun warning global.</p>
                        )}
                        {comparison ? (
                          <p className="aec-muted" style={{ marginTop: 8 }}>
                            Comparaison {comparison.periodA} vs {comparison.periodB} : Δ affichés{' '}
                            {comparison.shownDelta} · Δ rejetés {comparison.rejectedDelta} · Δ
                            signaux {comparison.signalsDelta}.
                          </p>
                        ) : null}
                        {report.coverageInsights?.length ? (
                          <>
                            <h3 style={{ fontSize: 13, margin: '12px 0 6px' }}>Couverture</h3>
                            <ul className="aec-list">
                              {report.coverageInsights.map((c) => (
                                <li key={c.id}>
                                  <TonePill tone={c.kind === 'absence' ? 'gray' : 'orange'}>
                                    {c.kind}
                                  </TonePill>{' '}
                                  {c.text}
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {section === 'registry' || section === 'prose' ? (
                    <div className="aec-panel">
                      <div className="aec-panel-head">
                        <h2>{section === 'prose' ? 'Texte final (affichées)' : 'Registre des analyses'}</h2>
                        <p>
                          Une ligne = un candidat réel de l’exécution. Vert = présent dans le
                          résultat actuel de ce run.
                        </p>
                      </div>
                      <div className="aec-panel-body">
                        <div className="aec-legend">
                          <span>
                            Total {counts?.total} · aff. {counts?.shown_now} · inter.{' '}
                            {counts?.intermediate} · décl. {counts?.demoted} · rej. {counts?.rejected}{' '}
                            · ? {counts?.unknown}
                          </span>
                          <span className="aec-muted">
                            chevauchements : sans preuve {report.registry?.overlapping?.withoutEvidence}{' '}
                            · thin {report.registry?.overlapping?.thinCopy} · deferred{' '}
                            {report.registry?.overlapping?.deferred} · titres proches{' '}
                            {report.registry?.overlapping?.possibleDupes}
                          </span>
                        </div>
                        <div className="aec-filters">
                          {(section === 'prose'
                            ? QUICK_FILTERS.filter((f) => f.id === 'shown_now')
                            : QUICK_FILTERS
                          ).map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              className={`aec-chip${activeQuick === f.id ? ' is-on' : ''}`}
                              onClick={() => setQuickFilter(f.id)}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                        <div className="aec-filters">
                          <input
                            className="aec-search"
                            style={{ minWidth: 200, flex: 1 }}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Recherche id / kind / texte / raison…"
                          />
                          <select
                            className="aec-select"
                            value={familyFilter}
                            onChange={(e) => setFamilyFilter(e.target.value)}
                          >
                            {families.map((f) => (
                              <option key={f} value={f}>
                                {f === 'all' ? 'Toutes familles' : f}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="aec-split">
                          <div>
                            <div className="aec-table-wrap">
                              <table className="aec-table">
                                <thead>
                                  <tr>
                                    <th>Statut</th>
                                    <th>Id</th>
                                    <th>Famille</th>
                                    <th>Kind</th>
                                    <th>Titre</th>
                                    <th>Preuves</th>
                                    <th>Étape</th>
                                    <th>Raison</th>
                                    <th>Module</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(section === 'prose'
                                    ? filteredRows.filter((r) => r.diagStatus === DIAG_STATUS.SHOWN_NOW)
                                    : pageRows
                                  ).map((row) => (
                                    <tr
                                      key={row.registryKey}
                                      className={
                                        selected?.registryKey === row.registryKey ? 'is-selected' : ''
                                      }
                                      onClick={() => setSelected(row)}
                                    >
                                      <td>
                                        <StatusPill status={row.diagStatus} />
                                      </td>
                                      <td className="aec-mono">{String(row.id || '').slice(0, 28)}</td>
                                      <td className="aec-muted">{row.family}</td>
                                      <td className="aec-mono">{row.kind}</td>
                                      <td>
                                        {(row.title || row.body || '').slice(0, 72)}
                                        {(row.title || row.body || '').length > 72 ? '…' : ''}
                                      </td>
                                      <td>{row.evidenceCount}</td>
                                      <td className="aec-mono">{row.generationStage || '—'}</td>
                                      <td style={{ color: 'var(--aec-orange)', maxWidth: 140 }}>
                                        {(row.decisionReason || '').slice(0, 40)}
                                      </td>
                                      <td className="aec-mono">{(row.moduleHint || '').slice(0, 24)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {section !== 'prose' ? (
                              <div className="aec-pager">
                                <button
                                  type="button"
                                  className="aec-btn aec-btn-ghost"
                                  disabled={page <= 0}
                                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                                >
                                  Préc.
                                </button>
                                <span>
                                  {page + 1} / {pageCount} · {filteredRows.length} lignes
                                </span>
                                <button
                                  type="button"
                                  className="aec-btn aec-btn-ghost"
                                  disabled={page >= pageCount - 1}
                                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                                >
                                  Suiv.
                                </button>
                              </div>
                            ) : null}
                          </div>
                          <DetailInspector row={selected} />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {section === 'pipeline' ? (
                    <div className="aec-panel">
                      <div className="aec-panel-head">
                        <h2>Pipeline</h2>
                        <p>
                          Étapes réellement poussées dans le rapport. Pertes = in−out seulement si
                          les deux compteurs existent.
                        </p>
                      </div>
                      <div className="aec-panel-body">
                        <div className="aec-table-wrap">
                          <table className="aec-table">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Étape</th>
                                <th>Module</th>
                                <th>Statut</th>
                                <th>in→out</th>
                                <th>Pertes</th>
                                <th>ms</th>
                                <th>Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(report.stagesDetailed || []).map((st) => (
                                <tr
                                  key={st.id}
                                  className={pipelineStep?.id === st.id ? 'is-selected' : ''}
                                  onClick={() => setPipelineStep(st)}
                                >
                                  <td>{st.order}</td>
                                  <td>{st.label}</td>
                                  <td className="aec-mono">{st.module}</td>
                                  <td>
                                    <StagePill status={st.stageStatus} />
                                  </td>
                                  <td>
                                    {st.inCount ?? '—'}→{st.outCount ?? '—'}
                                  </td>
                                  <td>
                                    {st.droppedApprox != null ? st.droppedApprox : 'non mesurable'}
                                  </td>
                                  <td>{st.ms ?? '—'}</td>
                                  <td style={{ color: 'var(--aec-red)', fontSize: 11 }}>
                                    {(st.errors || []).join('; ') ||
                                      (st.warnings || []).join('; ') ||
                                      st.skippedReason ||
                                      ''}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {report.raw?.candidateStages ? (
                          <pre className="aec-pre">
                            Volumes sélection : {JSON.stringify(report.raw.candidateStages, null, 2)}
                          </pre>
                        ) : null}
                        {pipelineStep ? (
                          <div className="aec-detail" style={{ marginTop: 10, maxHeight: 240 }}>
                            <h3 style={{ marginTop: 0 }}>{pipelineStep.label}</h3>
                            <pre>{JSON.stringify(pipelineStep.detail || pipelineStep, null, 2)}</pre>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {section === 'data' ? (
                    <div className="aec-panel">
                      <div className="aec-panel-head">
                        <h2>Inventaire des données</h2>
                        <p>
                          Disponibilité réelle sur le snapshot / enrichissement. « Non instrumenté »
                          = pas de compteur consommé dans le moteur.
                        </p>
                      </div>
                      <div className="aec-panel-body">
                        <div className="aec-legend">
                          {Object.values(DATA_STATUS_META).map((m) => (
                            <TonePill key={m.label} tone={m.tone}>
                              {m.label}
                            </TonePill>
                          ))}
                        </div>
                        <div className="aec-table-wrap">
                          <table className="aec-table">
                            <thead>
                              <tr>
                                <th>Famille</th>
                                <th>Donnée</th>
                                <th>Statut</th>
                                <th>n</th>
                                <th>Consommés</th>
                                <th>Source</th>
                                <th>Champs</th>
                                <th>Détail</th>
                              </tr>
                            </thead>
                            <tbody>
                              {report.dataInventory.map((d) => (
                                <tr key={d.id} style={{ cursor: 'default' }}>
                                  <td className="aec-muted">{d.family || '—'}</td>
                                  <td>{d.label}</td>
                                  <td>
                                    <DataPill status={d.status} />
                                  </td>
                                  <td>{d.n ?? '—'}</td>
                                  <td className="aec-mono">{d.nConsumed ?? 'non instrumenté'}</td>
                                  <td className="aec-mono">{d.source}</td>
                                  <td className="aec-mono">
                                    {(d.fields || []).join(', ') || '—'}
                                  </td>
                                  <td className="aec-muted">{d.detail || d.coverage || ''}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {report.coverageInsights?.length ? (
                          <ul className="aec-list" style={{ marginTop: 10 }}>
                            {report.coverageInsights.map((c) => (
                              <li key={c.id}>{c.text}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {section === 'families' ? (
                    <div className="aec-panel">
                      <div className="aec-panel-head">
                        <h2>Familles analytiques</h2>
                        <p>Répartition production / affichage issue de selectionDiagnostics + registre.</p>
                      </div>
                      <div className="aec-panel-body">
                        <div className="aec-table-wrap">
                          <table className="aec-table">
                            <thead>
                              <tr>
                                <th>Famille</th>
                                <th>Produits</th>
                                <th>Affichés</th>
                                <th>Interméd.</th>
                                <th>Rejets sel.</th>
                                <th>Sans preuve</th>
                                <th>% pack</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(report.families || []).map((f) => (
                                <tr
                                  key={f.family}
                                  onClick={() => {
                                    setFamilyFilter(f.family);
                                    setSection('registry');
                                  }}
                                >
                                  <td>{f.family}</td>
                                  <td>{f.produced}</td>
                                  <td>{f.shown}</td>
                                  <td>{f.intermediate}</td>
                                  <td>{f.rejected}</td>
                                  <td>{f.withoutEvidence}</td>
                                  <td>{Math.round((f.shareOfShown || 0) * 100)}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {section === 'correlations' ? (
                    <div className="aec-panel">
                      <div className="aec-panel-head">
                        <h2>Laboratoire de corrélations</h2>
                        <p>
                          Relations d’architecture × kinds réellement produits. Ne marque pas « non
                          implémenté » uniquement faute de résultat si les données manquent.
                        </p>
                      </div>
                      <div className="aec-panel-body">
                        <div className="aec-table-wrap">
                          <table className="aec-table">
                            <thead>
                              <tr>
                                <th>Relation</th>
                                <th>Statut</th>
                                <th>Certitude</th>
                                <th>Données G/D</th>
                                <th>Kinds match</th>
                                <th>Note</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(report.correlations || []).map((c) => (
                                <tr key={c.id} style={{ cursor: 'default' }}>
                                  <td>{c.label}</td>
                                  <td>
                                    <TonePill
                                      tone={
                                        c.status === 'calculated'
                                          ? 'green'
                                          : c.status === 'not_triggered'
                                            ? 'orange'
                                            : c.status === 'impossible_with_data'
                                              ? 'gray'
                                              : c.status === 'not_implemented'
                                                ? 'red'
                                                : 'gray'
                                      }
                                    >
                                      {c.status}
                                    </TonePill>
                                  </td>
                                  <td>{c.certainty}</td>
                                  <td className="aec-muted">
                                    {c.leftData?.status}/{c.rightData?.status}
                                  </td>
                                  <td className="aec-mono">
                                    {(c.matchedKinds || []).slice(0, 3).join(', ') || '—'}
                                  </td>
                                  <td className="aec-muted">{c.note}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <h3 style={{ fontSize: 13, margin: '12px 0 6px' }}>
                          Corrélations sommeil publiées
                        </h3>
                        <ul className="aec-list">
                          {(report.signals?.correlations || []).length ? (
                            report.signals.correlations.map((c) => (
                              <li key={c.type}>
                                <TonePill tone="violet">calculée</TonePill> {c.type} · nH=
                                {c.nHigh} nL={c.nLow} · {c.confidence || '—'}
                              </li>
                            ))
                          ) : (
                            <li className="aec-muted">Aucune corrélation sommeil publiée sur ce run.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  ) : null}

                  {section === 'gaps' ? (
                    <div className="aec-panel">
                      <div className="aec-panel-head">
                        <h2>Absences de traitement</h2>
                        <p>
                          Opportunités dérivées de signaux / données présents — jamais présentées
                          comme analyses générées.
                        </p>
                      </div>
                      <div className="aec-panel-body">
                        <div className="aec-table-wrap">
                          <table className="aec-table">
                            <thead>
                              <tr>
                                <th>Type</th>
                                <th>Libellé</th>
                                <th>Signal</th>
                                <th>Raison</th>
                                <th>Certitude</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(report.opportunities || []).length ? (
                                report.opportunities.map((o) => (
                                  <tr key={o.id} style={{ cursor: 'default' }}>
                                    <td>
                                      <TonePill tone="orange">{o.kind}</TonePill>
                                    </td>
                                    <td>{o.label}</td>
                                    <td className="aec-muted">{o.signal}</td>
                                    <td className="aec-mono">{o.reason}</td>
                                    <td>{o.certainty}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={5} className="aec-muted">
                                    Aucune absence détectable avec l’instrumentation actuelle.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {section === 'limits' ? (
                    <div className="aec-panel">
                      <div className="aec-panel-head">
                        <h2>Limites techniques</h2>
                        <p>{report.meta?.displayScopeNote}</p>
                      </div>
                      <div className="aec-panel-body">
                        <ul className="aec-list">
                          {(report.limits || []).map((l) => (
                            <li key={l.id}>{l.text}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>

            <footer className="aec-statusline">
              <span>{busy ? 'Exécution…' : report ? 'Run prêt' : 'Idle'}</span>
              <span>{report?.meta?.generatedAt || '—'}</span>
              <span>{report?.overview?.totalMs != null ? `${report.overview.totalMs} ms` : '—'}</span>
              <span>
                warnings {report?.overview?.warnings?.length ?? 0} · erreurs étapes{' '}
                {(report?.stagesDetailed || []).filter((s) => s.stageStatus === 'error').length}
              </span>
              {selected ? (
                <span>
                  sélection {selected.kind} · {selected.diagStatus}
                </span>
              ) : null}
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
