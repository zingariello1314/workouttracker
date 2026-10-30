/**
 * Console de diagnostic du moteur d'analyse — DEV + admin.
 * Studio analytique premium · pipeline réel (collectDiagnostic).
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
import { buildFindingForensics } from '../../utils/sport/analysisEngineFindingForensics';
import { analysisFamilyLabel } from '../../utils/sport/recapSelectionDiagnostics';
import { getRecapDateWindow } from '../../utils/sport/recapMuscleLoadEngine';
import { useGarminData } from '../../hooks/useGarminData';
import { useRecapCrossCoachGarmin } from '../../hooks/useRecapCrossCoachGarmin';
import DateHelper from '../../utils/dateHelper';
import AnalysisEnginePipelinePanel from './AnalysisEnginePipelinePanel';
import './AnalysisEngineConsole.css';

const FORENSIC_TABS = [
  ['general', 'Général'],
  ['chain', 'Chaîne'],
  ['raw', '1 · Bruts'],
  ['groups', '2 · Groupes'],
  ['discovery', '3 · Découverte'],
  ['evidence', '4 · Preuves'],
  ['copy', '5 · Texte'],
  ['selection', '6 · Sélection'],
  ['json', 'JSON']
];

/** Couches empilées dans l’onglet Général (sans Chaîne / JSON). */
const FORENSIC_STACK = [
  ['raw', '1 · Bruts'],
  ['groups', '2 · Groupes'],
  ['discovery', '3 · Découverte'],
  ['evidence', '4 · Preuves'],
  ['copy', '5 · Texte'],
  ['selection', '6 · Sélection']
];

function ForensicEmpty({ note }) {
  return <p className="aec-for-empty">{note || 'Non instrumenté sur ce candidat.'}</p>;
}

function ForensicList({ items, empty }) {
  if (!items?.length) return <ForensicEmpty note={empty} />;
  return (
    <ul className="aec-for-list">
      {items.map((it, i) => (
        <li key={`${it.date || it.label || it.text || i}-${i}`}>
          {it.date ? <span className="aec-mono aec-for-date">{it.date}</span> : null}
          <span>{it.label || it.text || '—'}</span>
          {it.role ? <span className="aec-faint"> · {it.role}</span> : null}
          {it.present === false ? <TonePill tone="orange">absent</TonePill> : null}
        </li>
      ))}
    </ul>
  );
}

const PAGE_SIZE = 24;

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
  { id: 'shown_now', label: 'Affichées' },
  { id: 'intermediate', label: 'Intermédiaires' },
  { id: 'demoted', label: 'Déclassées' },
  { id: 'rejected', label: 'Rejetées' },
  { id: 'no_evidence', label: 'Sans preuve' },
  { id: 'dupes', label: 'Redondances' },
  { id: 'cross', label: 'Transversales' },
  { id: 'unknown', label: 'Non traçables' }
];

const LIMIT_GROUPS = [
  { id: 'données', match: /donn|coverage|inventaire|consommé/i },
  { id: 'traçabilité', match: /trac|lineage|preuve|instrument/i },
  { id: 'logique', match: /relation|matrice|implément|sélection/i },
  { id: 'fiabilité', match: /heuristique|score|statistique|historique/i },
  { id: 'performance', match: /perf|durée|perte|pipeline/i }
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
    return { tone: 'orange', text: 'partiel' };
  }
  if (partial?.status === 'ready') return { tone: 'orange', text: 'sans signal' };
  return { tone: 'gray', text: 'off' };
}

function sortRows(rows, key, dir) {
  if (!key) return rows;
  const mul = dir === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * mul;
    return String(va).localeCompare(String(vb), 'fr') * mul;
  });
}

function SortTh({ col, label, sortKey, sortDir, onSort, className }) {
  const active = sortKey === col;
  return (
    <th
      className={`is-sortable${active ? ' is-sorted' : ''} ${className || ''}`}
      onClick={() => onSort(col)}
    >
      {label}
      <span className="aec-sort">{active ? (sortDir === 'asc' ? '▲' : '▼') : '◇'}</span>
    </th>
  );
}

function ForensicLayerBody({ layer, f, row, setTab }) {
  if (!f) return null;

  if (layer === 'chain') {
    return (
      <div className="aec-for-chain">
        {[
          ['1. Enregistrements bruts', f.rawRecords, 'raw'],
          ['2. Séries / séances / jours', f.grouping, 'groups'],
          ['3. Découverte', f.discovery, 'discovery'],
          ['4. Preuves', f.evidence, 'evidence'],
          ['5. Titre & texte', { coverage: { present: Boolean(f.copy.title || f.copy.body) } }, 'copy'],
          [
            '6. Validation & sélection',
            { coverage: { present: Boolean(f.selection.diagStatus || f.selection.reason) } },
            'selection'
          ]
        ].map(([label, layerData, tabId]) => (
          <button
            key={label}
            type="button"
            className={`aec-for-step ${layerData.coverage?.present ? 'is-ok' : 'is-gap'}`}
            onClick={() => setTab?.(tabId)}
          >
            <strong>{label}</strong>
            <span>{layerData.coverage?.present ? 'instrumenté' : 'trou / faible'}</span>
          </button>
        ))}
        <div className="aec-for-preview">
          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{row.body}</p>
          {row.evidence ? (
            <p className="aec-muted" style={{ marginTop: 8 }}>
              Preuve affichée : {row.evidence}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (layer === 'raw') {
    return (
      <>
        <p className="aec-for-lead">
          Dates et enregistrements bruts attachés au candidat — ceux que le producteur a exposés
          pour vérifier l’événement.
        </p>
        {f.rawRecords.coverage.note ? <ForensicEmpty note={f.rawRecords.coverage.note} /> : null}
        <dl className="aec-for-dl">
          <div>
            <dt>Dates distinctes</dt>
            <dd>{f.rawRecords.dates?.length || 0}</dd>
          </div>
          <div>
            <dt>Enregistrements listés</dt>
            <dd>{f.rawRecords.items?.length || 0}</dd>
          </div>
          {f.metrics?.prevDate || f.metrics?.date ? (
            <div>
              <dt>Événement (prev → date)</dt>
              <dd className="aec-mono">
                {f.metrics.prevDate || '—'} → {f.metrics.date || '—'}
              </dd>
            </div>
          ) : null}
          {f.metrics?.gapDays != null || f.metrics?.gap != null ? (
            <div>
              <dt>Gap / médiane habituelle</dt>
              <dd>
                {f.metrics.gapDays ?? f.metrics.gap} j
                {f.metrics.habitMedianGap != null ? ` · médiane ${f.metrics.habitMedianGap} j` : ''}
                {f.metrics.habitIntervalRatio != null
                  ? ` · ×${Number(f.metrics.habitIntervalRatio).toFixed(1)}`
                  : ''}
              </dd>
            </div>
          ) : null}
        </dl>
        {f.rawRecords.dates?.length ? (
          <p className="aec-mono" style={{ fontSize: 11, lineHeight: 1.5 }}>
            {f.rawRecords.dates.join(' · ')}
          </p>
        ) : null}
        <ForensicList items={f.rawRecords.items} empty="Aucun enregistrement daté sur metrics." />
      </>
    );
  }

  if (layer === 'groups') {
    return (
      <>
        <p className="aec-for-lead">
          Comment le moteur regroupe les bruts : séries, séances, journées — et les agrégats
          calculés dessus.
        </p>
        {f.grouping.coverage.note ? <ForensicEmpty note={f.grouping.coverage.note} /> : null}
        <div className="aec-for-grid3">
          <section>
            <h4>
              Séries{' '}
              <span className="aec-faint">
                {f.grouping.series.key || '—'} · {f.grouping.series.count ?? '—'}
              </span>
            </h4>
            <ForensicList items={f.grouping.series.items} empty="Pas de liste séries." />
          </section>
          <section>
            <h4>
              Séances{' '}
              <span className="aec-faint">
                {f.grouping.sessions.key || '—'} · {f.grouping.sessions.count ?? '—'}
              </span>
            </h4>
            <ForensicList items={f.grouping.sessions.items} empty="Pas de liste séances." />
          </section>
          <section>
            <h4>
              Jours{' '}
              <span className="aec-faint">
                {f.grouping.days.key || '—'} · {f.grouping.days.count ?? '—'}
              </span>
            </h4>
            <ForensicList items={f.grouping.days.items} empty="Pas de liste jours." />
          </section>
        </div>
        {Object.keys(f.grouping.aggregates || {}).length ? (
          <>
            <h4>Agrégats numériques (entrée du calcul)</h4>
            <div className="aec-for-kv">
              {Object.entries(f.grouping.aggregates).map(([k, v]) => (
                <div key={k}>
                  <span className="aec-mono">{k}</span>
                  <strong>{String(v)}</strong>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </>
    );
  }

  if (layer === 'discovery') {
    return (
      <>
        <p className="aec-for-lead">
          Qui a produit le candidat, avec quel jugement — avant / autour de la porte éditoriale.
        </p>
        <dl className="aec-for-dl">
          <div>
            <dt>Kind</dt>
            <dd className="aec-mono">{f.discovery.kind || '—'}</dd>
          </div>
          <div>
            <dt>Type / factId</dt>
            <dd className="aec-mono">
              {f.discovery.type || '—'}
              {f.discovery.factId ? ` · ${f.discovery.factId}` : ''}
            </dd>
          </div>
          <div>
            <dt>Nature</dt>
            <dd>{f.discovery.nature || '—'}</dd>
          </div>
          <div>
            <dt>Étape</dt>
            <dd className="aec-mono">{f.discovery.stage || '—'}</dd>
          </div>
          <div>
            <dt>Producteur</dt>
            <dd className="aec-mono">{f.discovery.producer || '—'}</dd>
          </div>
          <div>
            <dt>Score / poids / pertinence</dt>
            <dd>
              {f.discovery.score ?? '—'} / {f.discovery.weight ?? '—'} / {f.discovery.relevance ?? '—'}
            </dd>
          </div>
          <div>
            <dt>Match discoveries</dt>
            <dd className="aec-mono">
              {f.discovery.matchedId || '—'}
              {f.discovery.matchStatus ? ` (${f.discovery.matchStatus})` : ''}
            </dd>
          </div>
          <div>
            <dt>Exercice</dt>
            <dd>
              {f.metrics?.exerciseName || f.metrics?.name || '—'}
              {f.metrics?.exerciseId ? (
                <span className="aec-mono"> · id {f.metrics.exerciseId}</span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt>Brouillon titre</dt>
            <dd>{f.discovery.draftTitle || f.copy?.draftTitle || '—'}</dd>
          </div>
        </dl>
        {f.metrics?.trajectoryOk ? (
          <>
            <h4>Trajectoire (couche analytique)</h4>
            <div className="aec-for-kv">
              <div>
                <span>Bilan (primaryStory)</span>
                <strong className="aec-mono">
                  {f.metrics.trajectoryPrimaryStory || f.trajectoryReasoning?.primaryStory || '—'}
                </strong>
              </div>
              <div>
                <span>Chemin (path)</span>
                <strong className="aec-mono">
                  {f.metrics.trajectoryPath || f.trajectoryReasoning?.path || '—'}
                </strong>
              </div>
              <div>
                <span>Forme</span>
                <strong className="aec-mono">{f.metrics.trajectoryShape || '—'}</strong>
              </div>
              <div>
                <span>Installation / statut</span>
                <strong className="aec-mono">{f.metrics.trajectoryInstallation || '—'}</strong>
              </div>
              <div>
                <span>Mécanisme séries</span>
                <strong className="aec-mono">
                  {f.metrics.trajectorySetAvailable
                    ? f.metrics.trajectorySetMechanism || '—'
                    : 'non disponible'}
                </strong>
              </div>
              <div>
                <span>Témoins</span>
                <strong className="aec-mono">{f.metrics.trajectoryPeers || '—'}</strong>
              </div>
              <div>
                <span>Règle d’implication</span>
                <strong className="aec-mono">{f.metrics.trajectoryImplicationRule || '—'}</strong>
              </div>
              <div>
                <span>Richesse / info</span>
                <strong className="aec-mono">
                  {f.metrics.trajectoryRichness ?? '—'}
                  {f.selection?.informativeValue != null
                    ? ` · sel ${f.selection.informativeValue}`
                    : ''}
                </strong>
              </div>
            </div>
            {f.metrics.temporalScope?.interpretingWithHistory ? (
              <p className="aec-faint" style={{ marginTop: 6 }}>
                Contexte hors fenêtre : {f.metrics.temporalScope.contextSessionCountBeforeWindow} séance(s)
                avant · arc {f.metrics.temporalScope.arcSessionCount} · dans la fenêtre{' '}
                {f.metrics.temporalScope.windowSessionCount} (
                {(f.metrics.temporalScope.windowDates || []).join(', ') || '—'})
              </p>
            ) : null}
            {(f.metrics.trajectoryPositions || []).length ? (
              <ul className="aec-for-list">
                {f.metrics.trajectoryPositions.map((p) => (
                  <li key={`${p.claim}-${p.stance}`}>
                    <TonePill tone={p.stance === 'established' ? 'green' : p.stance === 'probable' ? 'blue' : 'orange'}>
                      {p.stance}
                    </TonePill>
                    <span className="aec-mono">{p.claim}</span> — {p.text}
                  </li>
                ))}
              </ul>
            ) : null}
            {f.metrics.legacyBody ? (
              <>
                <h4>Ancien texte (legacy)</h4>
                <div className="aec-for-draft">
                  <p>
                    <span className="aec-faint">Titre · </span>
                    {f.metrics.legacyTitle || '—'}
                  </p>
                  <p style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{f.metrics.legacyBody}</p>
                </div>
              </>
            ) : null}
          </>
        ) : null}
        {(f.selection?.displaceLog || []).length || f.selection?.droppedBy ? (
          <>
            <h4>Sélection — doublons / déclassements</h4>
            {f.selection?.droppedBy ? (
              <p className="aec-mono aec-faint">
                droppedBy · {Object.entries(f.selection.droppedBy)
                  .map(([k, n]) => `${k}:${n}`)
                  .join(' · ')}
              </p>
            ) : null}
            {(f.selection?.displaceLog || []).length ? (
              <ul className="aec-for-list">
                {f.selection.displaceLog.map((row) => (
                  <li key={`${row.kept}-${row.dropped}`}>
                    <span className="aec-mono">{row.reason}</span> — gardé {row.kept} (val{' '}
                    {row.keptValue}) vs déposé {row.dropped} (val {row.droppedValue})
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}
        {(f.discovery.path || []).length ? (
          <>
            <h4>Parcours producteur</h4>
            <ol className="aec-for-steps">
              {f.discovery.path.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </>
        ) : null}
        {f.copy?.draftBody || f.discovery.draftTitle ? (
          <>
            <h4>Sortie producteur (pré-gate)</h4>
            <div className="aec-for-draft">
              {f.copy?.draftTitle || f.discovery.draftTitle ? (
                <p>
                  <span className="aec-faint">Titre · </span>
                  {f.copy?.draftTitle || f.discovery.draftTitle}
                </p>
              ) : null}
              {f.copy?.draftBody ? (
                <p style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{f.copy.draftBody}</p>
              ) : null}
            </div>
          </>
        ) : null}
        {f.discovery.scope ? (
          <>
            <h4>Scope</h4>
            <pre className="aec-for-pre">{JSON.stringify(f.discovery.scope, null, 2)}</pre>
          </>
        ) : null}
        {f.discovery.matchReason ? (
          <p style={{ color: 'var(--aec-orange)' }}>Raison drop : {f.discovery.matchReason}</p>
        ) : null}
      </>
    );
  }

  if (layer === 'evidence') {
    return (
      <>
        <p className="aec-for-lead">
          Preuves attachées + chiffres metrics qui étayent (ou non) le texte.
        </p>
        <p className="aec-faint" style={{ fontSize: 11 }}>
          {f.evidence.items?.length || 0} preuve(s) · {f.evidence.linkedSlots?.length || 0} slot(s)
          numériques présents dans le texte
        </p>
        <ForensicList
          items={f.evidence.items.map((e) => ({
            label: e.text,
            role: e.role,
            present: e.present
          }))}
          empty={f.evidence.coverage.note}
        />
        {(f.evidence.linkedSlots || []).length ? (
          <>
            <h4>Chiffres metrics visibles dans le texte</h4>
            <ul className="aec-for-list">
              {f.evidence.linkedSlots.map((s) => (
                <li key={s.slot}>
                  <span className="aec-mono">{s.slot}</span> = <strong>{String(s.value)}</strong>
                  <span className="aec-faint"> — {s.why}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </>
    );
  }

  if (layer === 'copy') {
    return (
      <>
        <p className="aec-for-lead">
          Comment ce texte a été construit : producteur → brouillon → porte éditoriale → titre/body
          finals → phrases et slots metrics. Ne corrige le wording que si les couches 1–4 valident
          l’événement.
        </p>

        <div className="aec-for-kv">
          <div>
            <span>Producteur</span>
            <strong className="aec-mono" style={{ fontSize: 11 }}>
              {f.copy.producer || '—'}
            </strong>
          </div>
          <div>
            <span>Kind rédactionnel</span>
            <strong className="aec-mono">{f.copy.kind || row.kind || '—'}</strong>
          </div>
          <div>
            <span>Étape génération</span>
            <strong className="aec-mono">{f.copy.generationStage || row.stage || '—'}</strong>
          </div>
          <div>
            <span>Tone</span>
            <strong>{f.copy.rewardTone || row.rewardTone || '—'}</strong>
          </div>
          <div>
            <span>Nature</span>
            <strong>{f.copy.nature || row.nature || '—'}</strong>
          </div>
          <div>
            <span>Horizon</span>
            <strong>{f.copy.horizon || row.horizon || '—'}</strong>
          </div>
        </div>

        <h4>Texte final (affiché)</h4>
        <div className="aec-for-final-copy">
          <strong>{f.copy.title || '(sans titre)'}</strong>
          <p style={{ whiteSpace: 'pre-wrap', margin: '8px 0 0' }}>{f.copy.body}</p>
        </div>

        {(f.copy.qualityFlags || []).length ? (
          <p>
            Flags :{' '}
            {f.copy.qualityFlags.map((flag) => (
              <TonePill key={flag} tone="orange">
                {flag}
              </TonePill>
            ))}
          </p>
        ) : (
          <p className="aec-muted">Aucun flag qualité.</p>
        )}

        <h4>Parcours producteur</h4>
        {(f.copy.path || []).length ? (
          <ol className="aec-for-steps">
            {f.copy.path.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        ) : (
          <p className="aec-muted">Parcours générique.</p>
        )}

        <h4>Chaîne de rédaction (ce run)</h4>
        <ol className="aec-for-steps">
          {(f.copy.steps || []).map((s) => (
            <li key={s.id}>
              <strong>{s.label}</strong>
              <span className="aec-faint"> — {s.detail}</span>
            </li>
          ))}
        </ol>

        {f.copy.draftTitle || f.copy.draftBody ? (
          <>
            <h4>Brouillon producteur (avant porte éditoriale)</h4>
            <div className="aec-for-draft">
              {f.copy.draftTitle ? (
                <p>
                  <span className="aec-faint">Titre · </span>
                  {f.copy.draftTitle}
                </p>
              ) : null}
              {f.copy.draftBody ? (
                <p style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{f.copy.draftBody}</p>
              ) : null}
            </div>
          </>
        ) : (
          <p className="aec-muted">
            Brouillon non séparé : le titre final peut déjà être le rewrite immédiat.
          </p>
        )}

        {f.copy.titleTransform ? (
          <>
            <h4>Transformation du titre</h4>
            {f.copy.titleTransform.changed ? (
              <div className="aec-for-transform">
                <div>
                  <span className="aec-faint">Avant (brouillon)</span>
                  <p>{f.copy.titleTransform.from}</p>
                </div>
                <div>
                  <span className="aec-faint">Après (final)</span>
                  <p>{f.copy.titleTransform.to}</p>
                </div>
              </div>
            ) : (
              <p className="aec-muted">Titre inchangé entre brouillon et final.</p>
            )}
            {f.copy.titleTransform.likelyRule ? (
              <p className="aec-mono" style={{ fontSize: 11, marginTop: 6 }}>
                Règle probable : {f.copy.titleTransform.likelyRule}
              </p>
            ) : null}
          </>
        ) : null}

        {f.copy.bodyChanged === true ? (
          <p className="aec-muted" style={{ fontSize: 12 }}>
            Corps modifié entre brouillon et final (guards / polish / rewrite).
          </p>
        ) : f.copy.bodyChanged === false ? (
          <p className="aec-muted" style={{ fontSize: 12 }}>
            Corps identique au brouillon producteur.
          </p>
        ) : null}

        {(f.copy.editorialRules || []).length ? (
          <>
            <h4>Règles éditoriales applicables</h4>
            <ul className="aec-for-list">
              {f.copy.editorialRules.map((r) => (
                <li key={r.id}>
                  <span className="aec-mono">{r.module}</span>
                  <span> — {r.effect}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {(f.copy.mates || []).length ? (
          <>
            <h4>Companions même jour (alimentent la phrase fatigue)</h4>
            <ul className="aec-for-list">
              {f.copy.mates.map((m, i) => (
                <li key={`${m.id || m.name || i}`}>
                  <strong>{m.name || m.id || '—'}</strong>
                  <span className="aec-faint">
                    {' '}
                    · {m.reps ?? '—'} reps
                    {m.date ? ` · ${m.date}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <h4>Slots metrics ↔ texte</h4>
        <p className="aec-faint" style={{ fontSize: 11, marginTop: -4 }}>
          {(f.copy.slotsBound || []).length} dans le texte · {(f.copy.slotsUnbound || []).length}{' '}
          calcul seul
        </p>
        {(f.copy.slots || []).length ? (
          <ul className="aec-for-list">
            {f.copy.slots.map((s) => (
              <li key={s.slot}>
                <TonePill tone={s.inText ? 'green' : 'orange'}>
                  {s.inText ? 'dans le texte' : 'calcul seul'}
                </TonePill>
                <span className="aec-mono">{s.slot}</span> = <strong>{String(s.value)}</strong>
                <span className="aec-faint"> — {s.why}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="aec-muted">Aucun slot numérique reconnu sur ce candidat.</p>
        )}

        {(f.copy.claims || []).length ? (
          <>
            <h4>Phrases du corps (affirmations)</h4>
            <ol className="aec-for-steps">
              {f.copy.claims.map((c) => (
                <li key={c.index}>
                  <TonePill
                    tone={
                      c.hedges === 'prudent' ? 'blue' : c.hedges === 'assertif' ? 'orange' : 'gray'
                    }
                  >
                    {c.hedges}
                  </TonePill>
                  {c.hasNumber ? <TonePill tone="green">chiffre</TonePill> : null}
                  <span> {c.sentence}</span>
                </li>
              ))}
            </ol>
          </>
        ) : null}

        <p className="aec-faint" style={{ fontSize: 11 }}>
          {f.copy.note}
        </p>
      </>
    );
  }

  if (layer === 'selection') {
    return (
      <>
        <p className="aec-for-lead">
          Pourquoi cette analyse est (ou n’est pas) dans le pack final de ce run.
        </p>
        <p className="aec-pipe-semantics">{f.selection.pipelineHint}</p>
        <dl className="aec-for-dl">
          <div>
            <dt>Statut registre</dt>
            <dd>
              <StatusPill status={f.selection.diagStatus} />
            </dd>
          </div>
          <div>
            <dt>Statut pipeline</dt>
            <dd className="aec-mono">{f.selection.status || '—'}</dd>
          </div>
          <div>
            <dt>Raison</dt>
            <dd style={{ color: f.selection.reason ? 'var(--aec-orange)' : undefined }}>
              {f.selection.reason || '—'}
            </dd>
          </div>
          <div>
            <dt>Horizon</dt>
            <dd>{f.selection.horizon || '—'}</dd>
          </div>
          <div>
            <dt>Poids / score</dt>
            <dd>
              {f.selection.weight ?? '—'} / {f.selection.score ?? '—'}
            </dd>
          </div>
          <div>
            <dt>Pack de ce run</dt>
            <dd>{f.selection.displayScope === 'current_run' ? 'oui' : 'non'}</dd>
          </div>
          <div>
            <dt>Novelty / evidence family</dt>
            <dd className="aec-mono" style={{ fontSize: 10 }}>
              {f.selection.noveltyKey || '—'}
              <br />
              {f.selection.evidenceFamilyId || '—'}
            </dd>
          </div>
          <div>
            <dt>Étape finale</dt>
            <dd className="aec-mono">{f.selection.finalStage || '—'}</dd>
          </div>
        </dl>
        {f.selection.meaning ? <p className="aec-muted">{f.selection.meaning}</p> : null}
        {f.selection.familyBucket ? (
          <>
            <h4>Bucket famille (ce run)</h4>
            <div className="aec-for-kv">
              {Object.entries(f.selection.familyBucket)
                .filter(([, v]) => typeof v === 'number')
                .map(([k, v]) => (
                  <div key={k}>
                    <span className="aec-mono">{k}</span>
                    <strong>{v}</strong>
                  </div>
                ))}
            </div>
            {(f.selection.familyBucket.kindsShown || []).length ? (
              <p className="aec-mono" style={{ fontSize: 10 }}>
                Kinds affichés : {f.selection.familyBucket.kindsShown.join(' · ')}
              </p>
            ) : null}
          </>
        ) : null}
        {f.selection.caps ? (
          <>
            <h4>Caps du run</h4>
            <pre className="aec-for-pre">{JSON.stringify(f.selection.caps, null, 2)}</pre>
          </>
        ) : null}
      </>
    );
  }

  if (layer === 'json') {
    return <pre className="aec-for-pre">{JSON.stringify({ row, forensics: f }, null, 2)}</pre>;
  }

  return null;
}

function DetailInspector({ row, report, onJumpFamily, onBack }) {
  const [tab, setTab] = useState('general');
  useEffect(() => {
    setTab('general');
  }, [row?.registryKey]);

  const forensics = useMemo(
    () => (row ? buildFindingForensics(row, report) : null),
    [row, report]
  );

  if (!row) {
    return (
      <div className="aec-detail">
        <div className="aec-detail-empty">
          Clique une analyse pour remonter : enregistrements → groupes → découverte → preuves →
          texte → sélection.
        </div>
      </div>
    );
  }

  const f = forensics;

  return (
    <div className="aec-detail aec-detail-forensic">
      <div className="aec-detail-head">
        <div className="aec-detail-head-row">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <StatusPill status={row.diagStatus} />
            {row.isCrossFamily ? <TonePill tone="violet">transversale</TonePill> : null}
            <button type="button" className="aec-linkish" onClick={() => onJumpFamily?.(row.family)}>
              {row.familyLabel || row.family || '—'}
            </button>
            <span className="aec-mono">{row.kind || row.id}</span>
          </div>
          {onBack ? (
            <button type="button" className="aec-btn aec-btn-ghost aec-detail-back" onClick={onBack}>
              ← Retour aux analyses
            </button>
          ) : null}
        </div>
        <h3 className="aec-detail-title">{row.title || '(sans titre)'}</h3>
        <p className="aec-faint" style={{ margin: 0, fontSize: 11 }}>
          Objectif : localiser le défaut (données / calcul / découverte / rédaction / sélection)
          avant de retoucher le vocabulaire.
        </p>
        {(f?.defectHints || []).map((h) => (
          <div key={h.layer} className="aec-defect-hint">
            <TonePill tone={h.layer === 'copy' ? 'orange' : 'violet'}>{h.label}</TonePill>
            <span>{h.why}</span>
          </div>
        ))}
      </div>

      <div className="aec-tabs-mini aec-tabs-forensic">
        {FORENSIC_TABS.map(([id, label]) => (
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

      <div className="aec-detail-body">
        {tab === 'general' && f ? (
          <div className="aec-for-general">
            <p className="aec-for-lead">
              Vue complète : toutes les couches à la suite. Utilise les onglets isolés pour zoomer
              sur une seule étape.
            </p>
            {FORENSIC_STACK.map(([id, label]) => (
              <section key={id} className="aec-for-general-block" id={`aec-for-${id}`}>
                <div className="aec-for-general-head">
                  <h3>{label}</h3>
                  <button type="button" className="aec-linkish" onClick={() => setTab(id)}>
                    Isoler →
                  </button>
                </div>
                <ForensicLayerBody layer={id} f={f} row={row} setTab={setTab} />
              </section>
            ))}
          </div>
        ) : null}

        {tab !== 'general' && tab !== 'json' && f ? (
          <ForensicLayerBody layer={tab} f={f} row={row} setTab={setTab} />
        ) : null}

        {tab === 'json' ? <ForensicLayerBody layer="json" f={f} row={row} /> : null}

      </div>
    </div>
  );
}

function CorrelationMatrix({ correlations }) {
  const families = useMemo(() => {
    const s = new Set();
    (correlations || []).forEach((c) => {
      s.add(c.left);
      s.add(c.right);
    });
    return [...s];
  }, [correlations]);

  if (!families.length) return null;

  const cell = (a, b) => {
    if (a === b) return { cls: 'is-head', text: '·' };
    const hit = (correlations || []).find(
      (c) => (c.left === a && c.right === b) || (c.left === b && c.right === a)
    );
    if (!hit) return { cls: 'is-na', text: '—' };
    if (hit.status === 'calculated') return { cls: 'is-calc', text: '✓' };
    if (hit.status === 'not_triggered') return { cls: 'is-gap', text: '~' };
    if (hit.status === 'impossible_with_data') return { cls: 'is-na', text: '∅' };
    if (hit.status === 'not_implemented') return { cls: 'is-miss', text: '×' };
    return { cls: 'is-na', text: '?' };
  };

  return (
    <div
      className="aec-matrix"
      style={{ gridTemplateColumns: `72px repeat(${families.length}, minmax(36px, 1fr))` }}
    >
      <div className="aec-matrix-cell is-head" />
      {families.map((f) => (
        <div key={`h-${f}`} className="aec-matrix-cell is-head">
          {f.slice(0, 6)}
        </div>
      ))}
      {families.map((row) => (
        <React.Fragment key={`r-${row}`}>
          <div className="aec-matrix-cell is-head">{row.slice(0, 8)}</div>
          {families.map((col) => {
            const c = cell(row, col);
            return (
              <div key={`${row}-${col}`} className={`aec-matrix-cell ${c.cls}`} title={`${row}×${col}`}>
                {c.text}
              </div>
            );
          })}
        </React.Fragment>
      ))}
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
  const [sortKey, setSortKey] = useState('diagStatus');
  const [sortDir, setSortDir] = useState('asc');
  const [detailWide, setDetailWide] = useState(false);
  const [detailHidden, setDetailHidden] = useState(false);
  /** cards = digestible par famille ; table = dense */
  const [registryLayout, setRegistryLayout] = useState('cards');
  const [collapsedFamilies, setCollapsedFamilies] = useState(() => new Set());

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
        profileQuestionnaireRaw: currentUser?.profileQuestionnaire ?? null,
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
    currentUser?.profileQuestionnaire,
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
    const base = registryRows.filter((r) => {
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
    return sortRows(base, sortKey, sortDir);
  }, [registryRows, query, activeQuick, familyFilter, sortKey, sortDir]);

  const rowsByFamily = useMemo(() => {
    const map = new Map();
    filteredRows.forEach((r) => {
      const key = r.family || 'misc';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    });
    return [...map.entries()].sort((a, b) => {
      const shownA = a[1].filter((x) => x.diagStatus === DIAG_STATUS.SHOWN_NOW).length;
      const shownB = b[1].filter((x) => x.diagStatus === DIAG_STATUS.SHOWN_NOW).length;
      return shownB - shownA || b[1].length - a[1].length;
    });
  }, [filteredRows]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pageRows = filteredRows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const toggleFamilyCollapse = (fam) => {
    setCollapsedFamilies((prev) => {
      const next = new Set(prev);
      if (next.has(fam)) next.delete(fam);
      else next.add(fam);
      return next;
    });
  };

  useEffect(() => {
    setPage(0);
  }, [quickFilter, familyFilter, query, section, sortKey, sortDir]);

  const navCounts = useMemo(() => {
    if (!report) return {};
    return {
      overview: report.registry?.counts?.shown_now ?? 0,
      registry: report.registry?.counts?.total ?? 0,
      pipeline: report.stagesDetailed?.length ?? 0,
      data: report.dataCatalog?.items?.length ?? report.dataInventory?.length ?? 0,
      families: report.families?.length ?? 0,
      correlations: report.correlations?.length ?? 0,
      gaps: report.opportunities?.length ?? 0,
      prose: report.registry?.counts?.shown_now ?? 0,
      limits: report.limits?.length ?? 0
    };
  }, [report]);

  const garminUi = garminStatusLabel(garminPartial, garminBundle);
  const counts = report?.registry?.counts;

  const costlyStages = useMemo(() => {
    return [...(report?.stagesDetailed || [])]
      .filter((s) => s.ms != null)
      .sort((a, b) => (b.ms || 0) - (a.ms || 0))
      .slice(0, 5);
  }, [report]);

  const familyMax = useMemo(() => {
    const list = report?.families || [];
    return Math.max(1, ...list.map((f) => f.produced || 0));
  }, [report]);

  const groupedLimits = useMemo(() => {
    const limits = report?.limits || [];
    const buckets = LIMIT_GROUPS.map((g) => ({
      id: g.id,
      items: limits.filter((l) => g.match.test(l.text || l.id || ''))
    }));
    const used = new Set(buckets.flatMap((b) => b.items.map((i) => i.id)));
    const other = limits.filter((l) => !used.has(l.id));
    if (other.length) buckets.push({ id: 'autres', items: other });
    return buckets.filter((b) => b.items.length);
  }, [report]);

  const gapsByKind = useMemo(() => {
    const map = {};
    (report?.opportunities || []).forEach((o) => {
      if (!map[o.kind]) map[o.kind] = [];
      map[o.kind].push(o);
    });
    return map;
  }, [report]);

  const onSort = (col) => {
    if (sortKey === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(col);
      setSortDir('asc');
    }
  };

  const jumpFamily = (fam) => {
    if (!fam) return;
    setFamilyFilter(fam);
    setQuickFilter('all');
    setSection('registry');
  };

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
      `- Durée : ${report.overview?.totalMs} ms`,
      '',
      '## Limites',
      ...(report.limits || []).map((l) => `- ${l.text}`)
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

  const splitClass = [
    'aec-split',
    detailWide ? 'is-detail-wide' : '',
    detailHidden ? 'is-detail-hidden' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="aec">
      <div className="aec-shell">
        <header className="aec-topbar">
          <div className="aec-brand">
            <div className="aec-brand-mark" aria-hidden />
            <div>
              <h1>Console diagnostic · moteur d’analyse</h1>
              <p>
                Observabilité pipeline réel · vert = pack de <em>ce</em> run ·{' '}
                {import.meta.env.DEV ? 'DEV' : 'admin'}
              </p>
            </div>
          </div>
          <div className="aec-topbar-controls">
            <div className="aec-ctrl-group">
              <span
                className={`aec-run-dot${busy ? ' is-busy' : report ? '' : ' is-idle'}`}
                title={busy ? 'Exécution' : report ? 'Run prêt' : 'Idle'}
              />
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
                vs
                <select value={comparePeriod} onChange={(e) => setComparePeriod(e.target.value)}>
                  <option value="">—</option>
                  {DIAGNOSTIC_PERIODS.map((p) => (
                    <option key={p} value={p}>
                      {PERIOD_LABELS[p] || p}
                    </option>
                  ))}
                </select>
              </label>
            </div>
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
              MD
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
          <nav className="aec-nav" aria-label="Modules">
            <div className="aec-nav-label">Modules</div>
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
                  <div className="aec-kpi-strip" aria-label="Synthèse run">
                    <div className="aec-kpi">
                      <div className="aec-kpi-label">Période</div>
                      <div className="aec-kpi-value" style={{ fontSize: '0.95rem' }}>
                        {PERIOD_LABELS[report.overview.period] || report.overview.period}
                      </div>
                      <div className="aec-kpi-hint">
                        {report.overview.window
                          ? `${report.overview.window.start} → ${report.overview.window.end}`
                          : '—'}
                      </div>
                    </div>
                    <div className="aec-kpi is-accent">
                      <div className="aec-kpi-label">Affichées</div>
                      <div className="aec-kpi-value">{counts?.shown_now ?? 0}</div>
                      <div className="aec-kpi-hint">ce run · pack final</div>
                    </div>
                    <div className="aec-kpi">
                      <div className="aec-kpi-label">Interméd.</div>
                      <div className="aec-kpi-value">{counts?.intermediate ?? 0}</div>
                      <div className="aec-kpi-hint">retenues hors écran</div>
                    </div>
                    <div className="aec-kpi is-warn">
                      <div className="aec-kpi-label">Déclassées</div>
                      <div className="aec-kpi-value">{counts?.demoted ?? 0}</div>
                      <div className="aec-kpi-hint">caps / rivaux</div>
                    </div>
                    <div className="aec-kpi is-bad">
                      <div className="aec-kpi-label">Rejetées</div>
                      <div className="aec-kpi-value">{counts?.rejected ?? 0}</div>
                      <div className="aec-kpi-hint">validation</div>
                    </div>
                    <div className="aec-kpi">
                      <div className="aec-kpi-label">Garmin</div>
                      <div className="aec-kpi-value" style={{ fontSize: '0.9rem' }}>
                        <TonePill tone={garminUi.tone}>{garminUi.text}</TonePill>
                      </div>
                      <div className="aec-kpi-hint">
                        {garminPartial?.daysWithStepsData != null
                          ? `${garminPartial.daysWithStepsData} j.`
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
                    <div className="aec-stack-2">
                      <div className="aec-panel">
                        <div className="aec-panel-head">
                          <h2>Supervision du run</h2>
                          <p>
                            {counts?.total ?? 0} candidats uniques ·{' '}
                            {report.overview.signalsDetected} signaux détectés
                          </p>
                        </div>
                        <div className="aec-panel-body">
                          <div className="aec-legend">
                            {Object.values(DIAG_STATUS_META).map((m) => (
                              <TonePill key={m.label} tone={m.tone}>
                                {m.label}
                              </TonePill>
                            ))}
                          </div>
                          <p style={{ margin: '0 0 4px', fontSize: 13 }}>
                            Pack affiché <strong>{counts?.shown_now}</strong> · hors écran{' '}
                            <strong>
                              {(counts?.intermediate || 0) +
                                (counts?.demoted || 0) +
                                (counts?.rejected || 0) +
                                (counts?.unknown || 0)}
                            </strong>
                            .
                          </p>
                          {comparison ? (
                            <p className="aec-muted" style={{ fontSize: 12 }}>
                              Comparaison {comparison.periodA} → {comparison.periodB} : Δ affichés{' '}
                              {comparison.shownDelta} · Δ rejetés {comparison.rejectedDelta} · Δ
                              signaux {comparison.signalsDelta}.
                            </p>
                          ) : (
                            <p className="aec-faint" style={{ fontSize: 11 }}>
                              Choisis une période « vs » pour comparer deux fenêtres sur les mêmes
                              données.
                            </p>
                          )}
                          <h3 style={{ fontSize: 12, margin: '14px 0 6px', color: 'var(--aec-muted)' }}>
                            Pipeline (cliquable)
                          </h3>
                          <div className="aec-pipeline-track">
                            {(report.stagesDetailed || []).slice(0, 8).map((st) => (
                              <button
                                key={st.id}
                                type="button"
                                className={`aec-pipe-node${pipelineStep?.id === st.id ? ' is-on' : ''}`}
                                onClick={() => {
                                  setPipelineStep(st);
                                  setSection('pipeline');
                                }}
                              >
                                <div className="aec-pipe-ord">#{st.order}</div>
                                <div className="aec-pipe-name" title={st.label}>
                                  {st.label}
                                </div>
                                <div className="aec-pipe-meta">
                                  <StagePill status={st.stageStatus} />
                                  <span>{st.ms != null ? `${st.ms} ms` : 'sans ms'}</span>
                                  <span>
                                    {st.inCount ?? '—'}→{st.outCount ?? '—'}
                                    {st.countUnitMeta?.short
                                      ? ` ${st.countUnitMeta.short}`
                                      : ''}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                          {report.overview.warnings?.length ? (
                            <ul className="aec-list" style={{ color: 'var(--aec-orange)' }}>
                              {report.overview.warnings.slice(0, 8).map((w) => (
                                <li key={w}>{w}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="aec-muted">Aucun warning global.</p>
                          )}
                        </div>
                      </div>
                      <div className="aec-panel">
                        <div className="aec-panel-head">
                          <div>
                            <h2>Sources de données</h2>
                            <p>
                              Version courte ·{' '}
                              {report.dataCatalog?.totals
                                ? `${report.dataCatalog.totals.ok} ok · ${report.dataCatalog.totals.sparse} faibles · ${report.dataCatalog.totals.missing} manquantes`
                                : '—'}{' '}
                              ·{' '}
                              <button
                                type="button"
                                className="aec-linkish"
                                onClick={() => setSection('data')}
                              >
                                détail complet
                              </button>
                            </p>
                          </div>
                        </div>
                        <div className="aec-panel-body">
                          <ul className="aec-data-short">
                            {(report.dataCatalogShort || report.dataCatalog?.short || []).map((d) => (
                              <li key={d.id}>
                                <DataPill status={d.status} />
                                <span className="aec-data-short-label">{d.label}</span>
                                <span className="aec-data-short-origin">{d.origin}</span>
                                <span className="aec-num aec-faint">{d.n ?? '—'}</span>
                              </li>
                            ))}
                          </ul>
                          {costlyStages.length ? (
                            <>
                              <h3
                                style={{
                                  fontSize: 12,
                                  margin: '14px 0 6px',
                                  color: 'var(--aec-muted)'
                                }}
                              >
                                Étapes les plus lentes
                              </h3>
                              {costlyStages.slice(0, 4).map((s) => (
                                <div key={s.id} className="aec-bar-row">
                                  <span className="aec-mono" title={s.label}>
                                    {(s.label || s.id || '').slice(0, 14)}
                                  </span>
                                  <div className="aec-bar-track">
                                    <div
                                      className="aec-bar-fill"
                                      style={{
                                        width: `${Math.min(100, ((s.ms || 0) / (costlyStages[0]?.ms || 1)) * 100)}%`
                                      }}
                                    />
                                  </div>
                                  <span className="aec-num">{s.ms}</span>
                                </div>
                              ))}
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {section === 'registry' || section === 'prose' ? (
                    <div className="aec-panel">
                      <div className="aec-panel-head">
                        <div>
                          <h2>
                            {section === 'prose' ? 'Texte final' : 'Registre des analyses'}
                          </h2>
                          <p>
                            Vert = affichée dans l’exécution courante. Titre complet dans
                            l’inspecteur.
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {section === 'registry' ? (
                            <>
                              <button
                                type="button"
                                className={`aec-btn aec-btn-ghost${registryLayout === 'cards' ? ' is-on' : ''}`}
                                onClick={() => setRegistryLayout('cards')}
                              >
                                Par famille
                              </button>
                              <button
                                type="button"
                                className={`aec-btn aec-btn-ghost${registryLayout === 'table' ? ' is-on' : ''}`}
                                onClick={() => setRegistryLayout('table')}
                              >
                                Table dense
                              </button>
                            </>
                          ) : null}
                          <button
                            type="button"
                            className="aec-btn aec-btn-ghost"
                            onClick={() => setDetailHidden((v) => !v)}
                          >
                            {detailHidden ? 'Montrer détail' : 'Masquer détail'}
                          </button>
                          {!detailHidden ? (
                            <button
                              type="button"
                              className="aec-btn aec-btn-ghost"
                              onClick={() => setDetailWide((v) => !v)}
                            >
                              {detailWide ? 'Détail normal' : 'Détail large'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="aec-panel-body is-flush">
                        <div style={{ padding: '10px 14px 0' }}>
                          <div className="aec-legend">
                            <span>
                              {filteredRows.length} visibles · {counts?.shown_now} affichées ce run ·{' '}
                              {counts?.intermediate} intermédiaires · {counts?.demoted} déclassées
                            </span>
                          </div>
                          <div className="aec-toolbar-row">
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
                          </div>
                          <div className="aec-toolbar-row">
                            <input
                              className="aec-search"
                              value={query}
                              onChange={(e) => setQuery(e.target.value)}
                              placeholder="Chercher un titre, un kind, une raison…"
                            />
                            <select
                              className="aec-select"
                              value={familyFilter}
                              onChange={(e) => setFamilyFilter(e.target.value)}
                            >
                              {families.map((f) => (
                                <option key={f} value={f}>
                                  {f === 'all' ? 'Toutes les familles' : analysisFamilyLabel(f)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {section === 'prose' ? (
                          <div style={{ padding: 14 }}>
                            <div className="aec-prose-grid">
                              {filteredRows.map((row) => (
                                <button
                                  key={row.registryKey}
                                  type="button"
                                  className={`aec-prose-card${selected?.registryKey === row.registryKey ? ' is-on' : ''}`}
                                  onClick={() => {
                                    setSelected(row);
                                    setDetailHidden(false);
                                  }}
                                >
                                  <StatusPill status={row.diagStatus} />
                                  <h3>{row.title || row.kind}</h3>
                                  <p>{row.body}</p>
                                  {(row.quality?.flags || []).length ? (
                                    <div style={{ marginTop: 8 }}>
                                      {row.quality.flags.map((f) => (
                                        <TonePill key={f} tone="orange">
                                          {f}
                                        </TonePill>
                                      ))}
                                    </div>
                                  ) : null}
                                </button>
                              ))}
                            </div>
                            {!detailHidden && selected ? (
                              <div style={{ marginTop: 12 }}>
                                <DetailInspector
                                  row={selected}
                                  report={report}
                                  onJumpFamily={jumpFamily}
                                  onBack={() => setSelected(null)}
                                />
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div className={splitClass}>
                            <div className="aec-split-main">
                              {registryLayout === 'cards' ? (
                                <div className="aec-reg-groups">
                                  {rowsByFamily.length === 0 ? (
                                    <p className="aec-muted" style={{ padding: 16 }}>
                                      Aucune analyse pour ces filtres.
                                    </p>
                                  ) : null}
                                  {rowsByFamily.map(([fam, rows]) => {
                                    const collapsed = collapsedFamilies.has(fam);
                                    const shownN = rows.filter(
                                      (r) => r.diagStatus === DIAG_STATUS.SHOWN_NOW
                                    ).length;
                                    const label = analysisFamilyLabel(fam);
                                    return (
                                      <section key={fam} className="aec-reg-group">
                                        <button
                                          type="button"
                                          className="aec-reg-group-head"
                                          onClick={() => toggleFamilyCollapse(fam)}
                                        >
                                          <span className="aec-reg-group-title">
                                            <span className="aec-reg-chevron">
                                              {collapsed ? '▸' : '▾'}
                                            </span>
                                            {label}
                                          </span>
                                          <span className="aec-reg-group-meta">
                                            <TonePill tone="green">{shownN} affichée{shownN > 1 ? 's' : ''}</TonePill>
                                            <span className="aec-faint">{rows.length} au total</span>
                                          </span>
                                        </button>
                                        {!collapsed ? (
                                          <div className="aec-reg-cards">
                                            {rows.slice(0, 40).map((row) => (
                                              <button
                                                key={row.registryKey}
                                                type="button"
                                                className={`aec-reg-card${selected?.registryKey === row.registryKey ? ' is-on' : ''}`}
                                                onClick={() => {
                                                  setSelected(row);
                                                  setDetailHidden(false);
                                                }}
                                              >
                                                <div className="aec-reg-card-top">
                                                  <StatusPill status={row.diagStatus} />
                                                  {row.decisionReason ? (
                                                    <span className="aec-reg-reason" title={row.decisionReason}>
                                                      {row.decisionReason}
                                                    </span>
                                                  ) : null}
                                                </div>
                                                <h3>{row.title || row.kind || '(sans titre)'}</h3>
                                                <p>{row.body || '—'}</p>
                                                <div className="aec-reg-card-foot">
                                                  <span className="aec-mono">{row.kind}</span>
                                                  {row.evidenceCount > 0 ? (
                                                    <span className="aec-faint">
                                                      {row.evidenceCount} preuve
                                                      {row.evidenceCount > 1 ? 's' : ''}
                                                    </span>
                                                  ) : (
                                                    <span className="aec-faint">sans preuve exposée</span>
                                                  )}
                                                </div>
                                              </button>
                                            ))}
                                            {rows.length > 40 ? (
                                              <p className="aec-faint" style={{ padding: '4px 2px' }}>
                                                +{rows.length - 40} autres — affine les filtres ou passe
                                                en table dense.
                                              </p>
                                            ) : null}
                                          </div>
                                        ) : null}
                                      </section>
                                    );
                                  })}
                                </div>
                              ) : (
                                <>
                                  <div className="aec-resize-hint">
                                    <span>
                                      {filteredRows.length} lignes · page {page + 1}/{pageCount}
                                    </span>
                                    <span>Clic colonne = tri</span>
                                  </div>
                                  <div className="aec-table-wrap">
                                    <table className="aec-table">
                                      <thead>
                                        <tr>
                                          <SortTh
                                            col="diagStatus"
                                            label="Statut"
                                            sortKey={sortKey}
                                            sortDir={sortDir}
                                            onSort={onSort}
                                            className="aec-col-status"
                                          />
                                          <SortTh
                                            col="family"
                                            label="Famille"
                                            sortKey={sortKey}
                                            sortDir={sortDir}
                                            onSort={onSort}
                                            className="aec-col-family"
                                          />
                                          <SortTh
                                            col="title"
                                            label="Titre"
                                            sortKey={sortKey}
                                            sortDir={sortDir}
                                            onSort={onSort}
                                            className="aec-col-title"
                                          />
                                          <SortTh
                                            col="kind"
                                            label="Kind"
                                            sortKey={sortKey}
                                            sortDir={sortDir}
                                            onSort={onSort}
                                            className="aec-col-kind"
                                          />
                                          <th className="aec-col-reason">Raison</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {pageRows.map((row) => (
                                          <tr
                                            key={row.registryKey}
                                            className={
                                              selected?.registryKey === row.registryKey
                                                ? 'is-selected'
                                                : ''
                                            }
                                            onClick={() => {
                                              setSelected(row);
                                              setDetailHidden(false);
                                            }}
                                          >
                                            <td className="aec-col-status">
                                              <StatusPill status={row.diagStatus} />
                                            </td>
                                            <td className="aec-col-family">
                                              {row.familyLabel || analysisFamilyLabel(row.family)}
                                            </td>
                                            <td className="aec-col-title" title={row.title || row.body}>
                                              {row.title || row.body || '—'}
                                            </td>
                                            <td className="aec-col-kind aec-mono" title={row.kind}>
                                              {row.kind}
                                            </td>
                                            <td
                                              className="aec-col-reason"
                                              style={{ color: 'var(--aec-orange)' }}
                                              title={row.decisionReason || ''}
                                            >
                                              {row.decisionReason || ''}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
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
                                      {page + 1} / {pageCount}
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
                                </>
                              )}
                            </div>
                            {!detailHidden ? (
                              <DetailInspector
                                row={selected}
                                report={report}
                                onJumpFamily={jumpFamily}
                                onBack={() => setSelected(null)}
                              />
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {section === 'pipeline' ? (
                    <AnalysisEnginePipelinePanel
                      report={report}
                      pipelineStep={pipelineStep}
                      setPipelineStep={setPipelineStep}
                      StagePill={StagePill}
                    />
                  ) : null}

                  {section === 'data' ? (
                    <div className="aec-panel">
                      <div className="aec-panel-head">
                        <div>
                          <h2>Catalogue des données du moteur</h2>
                          <p>
                            Toutes les sources prises en compte pour les analyses, avec l’onglet /
                            sous-onglet d’origine. Compteurs = disponibilité réelle sur ce run.
                          </p>
                        </div>
                      </div>
                      <div className="aec-panel-body">
                        <div className="aec-legend">
                          {report.dataCatalog?.totals ? (
                            <span>
                              {report.dataCatalog.totals.sources} sources ·{' '}
                              {report.dataCatalog.totals.ok} ok · {report.dataCatalog.totals.sparse}{' '}
                              couverture faible · {report.dataCatalog.totals.missing} manquantes
                            </span>
                          ) : null}
                          <DataPill status="ok" />
                          <DataPill status="sparse" />
                          <DataPill status="missing" />
                        </div>
                        {(report.dataCatalog?.absences || []).length ? (
                          <section className="aec-data-absences">
                            <h3 className="aec-data-tab-title">
                              État des absences
                              <span className="aec-faint">
                                {' '}
                                · {report.dataCatalog.absences.length} à traiter ou à ignorer
                              </span>
                            </h3>
                            <div className="aec-abs-list">
                              {report.dataCatalog.absences.map((a) => (
                                <article
                                  key={a.id}
                                  className={`aec-abs-card aec-abs-${a.severity || 'info'}`}
                                >
                                  <div className="aec-abs-head">
                                    <DataPill status={a.status} />
                                    <span className="aec-abs-kind">{a.kindLabel}</span>
                                  </div>
                                  <h4>{a.label}</h4>
                                  <p className="aec-data-origin">
                                    {a.origin} · <span className="aec-mono">{a.originPath}</span>
                                  </p>
                                  {a.fixHint ? (
                                    <p className="aec-abs-fix">
                                      <strong>Que faire</strong> — {a.fixHint}
                                    </p>
                                  ) : (
                                    <p className="aec-muted">Pas d’action automatique suggérée.</p>
                                  )}
                                </article>
                              ))}
                            </div>
                          </section>
                        ) : null}
                        {(report.dataCatalog?.byTab || []).map((group) => (
                          <section key={group.tab} className="aec-data-tab-block">
                            <h3 className="aec-data-tab-title">
                              Onglet <strong>{group.tab}</strong>
                              <span className="aec-faint">
                                {' '}
                                · {group.ok} ok · {group.sparse} faibles · {group.missing} manquantes
                              </span>
                            </h3>
                            <div className="aec-data-cards">
                              {group.items.map((d) => (
                                <article key={d.id} className="aec-data-card">
                                  <div className="aec-data-card-top">
                                    <DataPill status={d.status} />
                                    <span className="aec-num">{d.n ?? '—'}</span>
                                  </div>
                                  <h4>{d.label}</h4>
                                  <p className="aec-data-origin">
                                    <strong>Provenance</strong> {d.tab} › {d.subtab}
                                  </p>
                                  <p className="aec-mono aec-faint">{d.originPath}</p>
                                  {d.detail ? <p className="aec-muted">{d.detail}</p> : null}
                                  {d.nInPeriod != null ? (
                                    <p className="aec-faint" style={{ fontSize: 11 }}>
                                      Dans la période : {d.nInPeriod}
                                    </p>
                                  ) : null}
                                  <p className="aec-faint" style={{ fontSize: 11 }}>
                                    Utilisé par : {d.usedBy?.join(' · ') || '—'}
                                  </p>
                                  {(d.fields || []).length ? (
                                    <p className="aec-mono" style={{ fontSize: 10 }}>
                                      Champs : {d.fields.join(', ')}
                                    </p>
                                  ) : null}
                                  {d.fixHint && (d.status === 'missing' || d.status === 'sparse') ? (
                                    <p className="aec-abs-fix" style={{ marginTop: 8 }}>
                                      <strong>Que faire</strong> — {d.fixHint}
                                    </p>
                                  ) : null}
                                </article>
                              ))}
                            </div>
                          </section>
                        ))}
                        {!report.dataCatalog?.byTab?.length ? (
                          <div className="aec-table-wrap">
                            <table className="aec-table" style={{ tableLayout: 'auto' }}>
                              <thead>
                                <tr>
                                  <th>Donnée</th>
                                  <th>Statut</th>
                                  <th>n</th>
                                  <th>Source</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(report.dataInventory || []).map((d) => (
                                  <tr key={d.id} className="is-static">
                                    <td>{d.label}</td>
                                    <td>
                                      <DataPill status={d.status} />
                                    </td>
                                    <td className="aec-num">{d.n ?? '—'}</td>
                                    <td className="aec-mono">{d.source}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {section === 'families' ? (
                    <div className="aec-panel">
                      <div className="aec-panel-head">
                        <h2>Familles analytiques</h2>
                        <p>
                          Clique une famille → ouvre le registre filtré. « % du pack » = part des
                          textes <em>affichés ce run</em>, pas des candidats produits.
                        </p>
                      </div>
                      <div className="aec-panel-body">
                        <div className="aec-fam-list">
                          {(report.families || []).map((f) => {
                            const label = f.familyLabel || analysisFamilyLabel(f.family);
                            const pct = Math.round((f.shareOfShown || 0) * 100);
                            return (
                              <button
                                key={f.family}
                                type="button"
                                className="aec-fam-card"
                                onClick={() => jumpFamily(f.family)}
                              >
                                <div className="aec-fam-card-head">
                                  <strong>{label}</strong>
                                  <span className="aec-mono aec-faint">{f.family}</span>
                                </div>
                                <div className="aec-bar-track" style={{ margin: '8px 0' }}>
                                  <div
                                    className="aec-bar-fill is-shown"
                                    style={{
                                      width: `${Math.min(100, ((f.shown || 0) / familyMax) * 100)}%`
                                    }}
                                  />
                                </div>
                                <div className="aec-fam-stats">
                                  <span>
                                    <strong>{f.shown}</strong> affichées
                                  </span>
                                  <span>
                                    <strong>{f.produced}</strong> produites
                                  </span>
                                  <span>
                                    <strong>{f.intermediate}</strong> interm.
                                  </span>
                                  <span>
                                    <strong>{f.demoted ?? f.rejected}</strong> filtrées
                                  </span>
                                  <span className="aec-faint">{pct}% du pack</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {section === 'correlations' ? (
                    <div className="aec-panel">
                      <div className="aec-panel-head">
                        <h2>Corrélations</h2>
                        <p>
                          ✓ calculée · ~ non déclenchée · × absente du run · ∅ données
                          insuffisantes. Jamais une coexistence seule.
                        </p>
                      </div>
                      <div className="aec-panel-body">
                        <CorrelationMatrix correlations={report.correlations} />
                        <div className="aec-table-wrap" style={{ marginTop: 12, maxHeight: 400 }}>
                          <table className="aec-table" style={{ tableLayout: 'auto' }}>
                            <thead>
                              <tr>
                                <th>Relation</th>
                                <th>Statut</th>
                                <th>Cert.</th>
                                <th>G / D</th>
                                <th>Kinds</th>
                                <th>Note</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(report.correlations || []).map((c) => (
                                <tr key={c.id} className="is-static">
                                  <td style={{ whiteSpace: 'normal' }}>{c.label}</td>
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
                                    {(c.matchedKinds || []).slice(0, 2).join(', ') || '—'}
                                  </td>
                                  <td className="aec-muted" style={{ whiteSpace: 'normal' }}>
                                    {c.note}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <h3 style={{ fontSize: 12, margin: '14px 0 6px', color: 'var(--aec-muted)' }}>
                          Sommeil publié
                        </h3>
                        <ul className="aec-list">
                          {(report.signals?.correlations || []).length ? (
                            report.signals.correlations.map((c) => (
                              <li key={c.type}>
                                <TonePill tone="violet">calculée</TonePill> {c.type} · nH={c.nHigh}{' '}
                                nL={c.nLow}
                              </li>
                            ))
                          ) : (
                            <li className="aec-muted">Aucune corrélation sommeil sur ce run.</li>
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
                          Opportunités / écarts dérivés de signaux — jamais présentés comme analyses
                          générées.
                        </p>
                      </div>
                      <div className="aec-panel-body">
                        {Object.keys(gapsByKind).length === 0 ? (
                          <p className="aec-muted">Aucune absence détectable.</p>
                        ) : (
                          Object.entries(gapsByKind).map(([kind, items]) => (
                            <div key={kind} style={{ marginBottom: 14 }}>
                              <h3 style={{ fontSize: 12, margin: '0 0 8px' }}>
                                <TonePill tone="orange">{kind}</TonePill>{' '}
                                <span className="aec-faint">{items.length}</span>
                              </h3>
                              <div className="aec-table-wrap" style={{ maxHeight: 240 }}>
                                <table className="aec-table" style={{ tableLayout: 'auto' }}>
                                  <thead>
                                    <tr>
                                      <th>Libellé</th>
                                      <th>Signal</th>
                                      <th>Raison</th>
                                      <th>Cert.</th>
                                      <th />
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {items.map((o) => (
                                      <tr key={o.id} className="is-static">
                                        <td style={{ whiteSpace: 'normal' }}>{o.label}</td>
                                        <td className="aec-muted">{o.signal}</td>
                                        <td className="aec-mono">{o.reason}</td>
                                        <td>{o.certainty}</td>
                                        <td>
                                          <button
                                            type="button"
                                            className="aec-linkish"
                                            onClick={() => setSection('correlations')}
                                          >
                                            Corrélations
                                          </button>
                                          {' · '}
                                          <button
                                            type="button"
                                            className="aec-linkish"
                                            onClick={() => setSection('registry')}
                                          >
                                            Registre
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))
                        )}
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
                        {groupedLimits.map((g) => (
                          <div key={g.id} style={{ marginBottom: 14 }}>
                            <h3
                              style={{
                                fontSize: 11,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                color: 'var(--aec-faint)',
                                margin: '0 0 6px'
                              }}
                            >
                              {g.id}
                            </h3>
                            <ul className="aec-list">
                              {g.items.map((l) => (
                                <li key={l.id}>{l.text}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>

            <footer className="aec-statusline">
              <span>
                <strong>{busy ? 'Exécution' : report ? 'Prêt' : 'Idle'}</strong>
              </span>
              <span>{report?.meta?.generatedAt || '—'}</span>
              <span>{report?.overview?.totalMs != null ? `${report.overview.totalMs} ms` : '—'}</span>
              <span>
                warn {report?.overview?.warnings?.length ?? 0} · err étapes{' '}
                {(report?.stagesDetailed || []).filter((s) => s.stageStatus === 'error').length}
              </span>
              {selected ? (
                <span>
                  sel. {selected.kind} · {selected.diagStatus}
                </span>
              ) : null}
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
