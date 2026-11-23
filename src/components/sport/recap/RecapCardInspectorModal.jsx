import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy } from 'lucide-react';
import { safeJsonStringify, downloadTextFile } from '../../../utils/sport/analysisExportDownload';
import { serializeConclusion } from '../../../utils/sport/analysisPeriodExport';

function Section({ title, children }) {
  return (
    <section className="mb-4">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-300/90">{title}</h4>
      <div className="space-y-2 text-sm leading-relaxed text-slate-200">{children}</div>
    </section>
  );
}

function Line({ label, value }) {
  if (value == null || value === '') {
    return (
      <p className="text-xs text-slate-500">
        <span className="text-slate-400">{label} :</span> preuve indisponible
      </p>
    );
  }
  return (
    <p className="text-xs text-slate-300">
      <span className="text-slate-400">{label} :</span> {typeof value === 'string' ? value : safeJsonStringify(value, 0)}
    </p>
  );
}

export default function RecapCardInspectorModal({
  card,
  onClose,
  edition = null,
  fingerprint = null,
  packId = null
}) {
  const payload = useMemo(() => {
    if (!card) return null;
    // Parité export / inspecteur : même sérialiseur que les dossiers 8 périodes
    const serialized = serializeConclusion(card, card?.disposition === 'reserve' ? 'reserve' : 'priority');
    return {
      ...serialized,
      id: serialized.id || card.id || null,
      phenomenonId: serialized.phenomenonId || card.phenomenonId || null,
      publicationId: serialized.publicationId || card.publicationId || null,
      title: serialized.title || card.title || null,
      body: serialized.body || card.body || card.text || null,
      evidence: serialized.evidence || card.evidence || null,
      kind: serialized.kind || card.kind || null,
      category: serialized.category || card.analyticalCategory || card.category || null,
      disposition: serialized.disposition || card.disposition || card.p6Disposition || null,
      reason: serialized.reason || card.reason || null,
      claim: serialized.claim || card.claim || null,
      metrics: serialized.metrics || card.metrics || null,
      inspection: card.inspection || serialized.inspector?.inspection || null,
      exploration: serialized.exploration || card.exploration || null,
      marginal: serialized.marginal || card.marginal || null,
      horizon: serialized.horizon || card.horizonFit || null,
      drafting: serialized.drafting || card.drafting || null,
      edition,
      fingerprint,
      packId,
      serializer: 'serializeConclusion',
      note: 'Identique à ANALYTICAL_REASONING_TRACE / dossiers 8 périodes pour le même run'
    };
  }, [card, edition, fingerprint, packId]);

  useEffect(() => {
    if (!card) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [card, onClose]);

  if (!card || !payload || typeof document === 'undefined') return null;

  const claim = payload.claim || {};
  const inspection = payload.inspection || {};
  const hypotheses = inspection.competingHypotheses || payload.exploration?.hypotheses || [];

  const copyAll = async () => {
    const text = safeJsonStringify(payload, 2);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      downloadTextFile(`momentum-card-inspect-${payload.id || 'card'}.json`, text, 'application/json');
    }
  };

  const exportDetail = () => {
    downloadTextFile(
      `momentum-card-inspect-${String(payload.id || 'card').replace(/[^\w.-]+/g, '_')}.json`,
      safeJsonStringify(payload, 2),
      'application/json'
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recap-card-inspector-title"
      data-analyse-inspector="true"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-teal-500/40 bg-slate-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 px-4 py-3">
          <div className="min-w-0">
            <h3 id="recap-card-inspector-title" className="text-base font-semibold text-sky-50">
              Inspecteur de carte
            </h3>
            <p className="mt-1 truncate text-sm text-teal-100/90">{card.title || 'Sans titre'}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={copyAll}
              title="Copier le détail"
            >
              <Copy size={16} />
            </button>
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
              onClick={exportDetail}
            >
              Exporter
            </button>
            <button
              type="button"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              onClick={onClose}
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-4 py-4">
          <Section title="Synthèse">
            <p>{card.body || card.text || 'Texte indisponible.'}</p>
            <Line label="Phénomène" value={payload.phenomenonId} />
            <Line label="Pourquoi c’est retenu" value={payload.reason || payload.marginal} />
            <Line label="Catégorie" value={payload.category} />
          </Section>

          <Section title="Preuves">
            <Line label="Evidence" value={card.evidence} />
            <Line label="Assertions" value={claim.assertions || inspection.metrics} />
            <Line label="Sources / dates" value={inspection.sourceRecords || card.lineage} />
            <Line label="Métriques" value={card.metrics} />
            <Line label="Comparateurs" value={card.metrics?.referenceValue ?? claim.assertions} />
          </Section>

          <Section title="Raisonnement">
            <Line label="Méthode" value={inspection.method || claim.producer || card.metrics?.producer} />
            <Line
              label="Hypothèses"
              value={
                Array.isArray(hypotheses) && hypotheses.length
                  ? hypotheses.map((row) => `${row.id}: ${row.status} — ${row.detail}`).join(' | ')
                  : null
              }
            />
            <Line label="Conclusion claim" value={claim.statement || card.title} />
            <Line label="Limites" value={claim.limitations || card.metrics?.limits} />
            <Line label="Couverture exploration" value={payload.exploration?.coverage || inspection.coverage} />
          </Section>

          <Section title="Décision éditoriale">
            <Line label="Disposition" value={payload.disposition} />
            <Line label="Admissibilité" value={inspection.admissibility || card.admission} />
            <Line label="Valeur marginale" value={payload.marginal} />
            <Line label="Relations" value={inspection.relations || card.relations} />
            <Line label="Fusionné dans" value={card.collapsedInto || inspection.collapsedInto} />
          </Section>

          <Section title="Provenance technique">
            <Line label="Identifiant" value={payload.id} />
            <Line label="Publication" value={payload.publicationId} />
            <Line label="Édition" value={edition} />
            <Line label="Fingerprint" value={fingerprint} />
            <Line label="Paquet" value={packId} />
            <Line label="Sérialiseur" value={payload.serializer} />
            <p className="text-[11px] text-slate-500">
              Pour la trace complète (8 horizons) : Récap → Analyse → « Exporter la trace de raisonnement ».
            </p>
            <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-black/50 p-2 text-[10px] text-slate-400">
              {safeJsonStringify(payload, 2)}
            </pre>
          </Section>
        </div>
      </div>
    </div>,
    document.body
  );
}
