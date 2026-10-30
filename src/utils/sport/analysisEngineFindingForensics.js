/**
 * Chaîne forensique d’un candidat d’analyse.
 * Objectif : localiser le défaut (données / calcul / découverte / rédaction / sélection)
 * sans confondre un mauvais vocabulaire avec une mauvaise interprétation de l’événement.
 */

import { buildCopyProvenance } from './analysisEngineCopyProvenance.js';

const YMD_RE = /\d{4}-\d{2}-\d{2}/g;

function uniq(list) {
  return [...new Set((list || []).filter(Boolean))];
}

function asArray(v) {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  return [v];
}

function collectYmidsDeep(node, out = [], depth = 0) {
  if (node == null || depth > 6) return out;
  if (typeof node === 'string') {
    const m = node.match(YMD_RE);
    if (m) m.forEach((d) => out.push(d));
    return out;
  }
  if (typeof node === 'number' || typeof node === 'boolean') return out;
  if (Array.isArray(node)) {
    node.forEach((x) => collectYmidsDeep(x, out, depth + 1));
    return out;
  }
  if (typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (/date|day|ymd|night|session/i.test(k) && typeof v === 'string' && YMD_RE.test(v)) {
        out.push(v.match(YMD_RE)[0]);
      }
      collectYmidsDeep(v, out, depth + 1);
    }
  }
  return out;
}

function pickList(metrics, keys) {
  for (const key of keys) {
    const v = metrics?.[key];
    if (Array.isArray(v) && v.length) return { key, items: v };
  }
  return null;
}

function summarizeRecord(item, index) {
  if (item == null) return { index, label: '(vide)' };
  if (typeof item === 'string' || typeof item === 'number') {
    return { index, label: String(item), date: String(item).match(YMD_RE)?.[0] || null };
  }
  if (typeof item !== 'object') return { index, label: String(item) };
  const date =
    item.date ||
    item.dateStr ||
    item.day ||
    item.ymd ||
    (typeof item.id === 'string' && item.id.match(YMD_RE)?.[0]) ||
    null;
  const labelParts = [
    date,
    item.name || item.exerciseName || item.label || item.kind || item.role || null,
    item.reps != null ? `${item.reps} reps` : null,
    item.sets != null ? `${item.sets} sets` : null,
    item.hours != null ? `${item.hours} h` : null,
    item.score != null ? `score ${item.score}` : null,
    item.distance != null ? `${item.distance}` : null
  ].filter(Boolean);
  return {
    index,
    date: date ? String(date).slice(0, 10) : null,
    label: labelParts.join(' · ') || JSON.stringify(item).slice(0, 120),
    role: item.role || null,
    raw: item
  };
}

function layerCoverage(items, noteMissing) {
  const n = items?.length || 0;
  return {
    present: n > 0,
    count: n,
    note: n > 0 ? null : noteMissing
  };
}

function hasAggregateCalcSignal(metrics) {
  if (!metrics || typeof metrics !== 'object') return false;
  const keys = [
    'vsInitialPct',
    'vsHabitPct',
    'volPct',
    'historicalMean',
    'currentMean',
    'totalReps',
    'trainingDays',
    'sessionCount',
    'peakReps',
    'share',
    'sharePct',
    'gapDays',
    'returnReps',
    'priorAvg',
    'vsPriorPct',
    'habitMedianGap',
    'habitIntervalRatio'
  ];
  return keys.some((k) => metrics[k] != null);
}

function discoveryFactKey(d) {
  const m = d?.metrics || {};
  return (
    m.factId ||
    m.exerciseId ||
    (d?.kind && m.date ? `${d.kind}|${m.date}|${m.exerciseId || m.name || ''}` : null) ||
    null
  );
}

function findDiscoveryMatch(row, report) {
  const list = report?.candidates?.discoveries || [];
  if (!list.length || !row) return null;
  const byId = list.find((d) => row.id && d.id === row.id);
  if (byId) return byId;

  const kind = row.kind;
  if (!kind) return null;

  const sameKind = list.filter((d) => d.kind === kind);
  if (!sameKind.length) return null;

  const byTitle = sameKind.find((d) => row.title && d.title === row.title);
  if (byTitle) return byTitle;

  const rowFact =
    row.metrics?.factId ||
    row.metrics?.exerciseId ||
    row.interpretation?.metrics?.factId ||
    row.interpretation?.metrics?.exerciseId ||
    null;
  if (rowFact) {
    const byFact = sameKind.find((d) => {
      const k = discoveryFactKey(d);
      return k && (k === rowFact || String(k).includes(String(rowFact)) || String(rowFact).includes(String(d.metrics?.exerciseId || '')));
    });
    if (byFact) return byFact;
  }

  // Titre réécrit (ex. porte éditoriale) : un seul candidat du kind → match sûr
  if (sameKind.length === 1) return sameKind[0];

  // Préférer celui qui a draftTitle / metrics riches
  const withDraft = sameKind.find((d) => d.metrics?.draftTitle || d.metrics?.gapDays != null);
  return withDraft || sameKind[0];
}

function inferDefectLayer(forensics) {
  const hints = [];
  const rawOk = forensics.rawRecords.coverage.present;
  const groupOk = forensics.grouping.coverage.present;
  const discOk = forensics.discovery.coverage.present;
  const evOk = forensics.evidence.coverage.present;
  const copyFlags = forensics.copy.qualityFlags || [];
  const selected = forensics.selection.status === 'shown' || forensics.selection.diagStatus === 'shown_now';
  const calcWithoutTrace = forensics.calcWithoutTrace === true;

  if (!rawOk && !groupOk && calcWithoutTrace) {
    hints.push({
      layer: 'instrumentation_gap',
      label: 'Instrumentation incomplète (pas une absence de données)',
      why: 'Le moteur a calculé des agrégats (donc il a lu des séances), mais le candidat n’attache pas encore les dates/séries pour inspection. Ce n’est pas un trou de données utilisateur.'
    });
  } else if (!rawOk && !groupOk) {
    hints.push({
      layer: 'data_model',
      label: 'Modèle de données / instrumentation',
      why: 'Aucune date ni enregistrement brut attaché au candidat — impossible de vérifier l’événement décrit.'
    });
  } else if (rawOk && !evOk) {
    hints.push({
      layer: 'discovery',
      label: 'Découverte analytique',
      why: 'Des enregistrements existent mais aucune preuve structurée n’est attachée.'
    });
  } else if (evOk && copyFlags.some((f) => f === 'thin_copy' || f === 'deferred_reasoning' || f === 'overconfident')) {
    hints.push({
      layer: 'copy',
      label: 'Rédaction',
      why: `Flags éditoriaux : ${copyFlags.join(', ')}. Vérifier le texte avant de changer le calcul.`
    });
  } else if (!selected && forensics.selection.reason) {
    hints.push({
      layer: 'selection',
      label: 'Sélection / validation',
      why: `Éliminé pour : ${forensics.selection.reason}.`
    });
  } else if (rawOk && evOk) {
    hints.push({
      layer: 'calc_or_discovery',
      label: 'Calcul ou découverte',
      why: 'Preuves et dates présentes — si le sens est faux, le défaut est probablement dans le jugement (seuils, agrégats, rôle), pas dans le vocabulaire seul.'
    });
  } else {
    hints.push({
      layer: 'unknown',
      label: 'À diagnostiquer',
      why: 'Chaîne incomplète : enrichir l’instrumentation du producteur pour cette famille.'
    });
  }

  return hints;
}

/**
 * @param {object} row — ligne registre (candidat annoté)
 * @param {object} [report] — rapport diagnostic complet (optionnel)
 */
export function buildFindingForensics(row, report = null) {
  if (!row) return null;

  const interpretation = row.interpretation || null;
  const ctx = interpretation?.context || row.context || {};
  const scope = row.scope || interpretation?.scope || null;

  const discoveryMatch = findDiscoveryMatch(row, report);

  // Fusionner metrics du reading + de la découverte source (dates/drafts souvent sur la découverte)
  const metrics = {
    ...(discoveryMatch?.metrics || {}),
    ...(interpretation?.metrics || {}),
    ...(row.metrics || {})
  };

  const dateList =
    asArray(metrics.dates)
      .concat(asArray(metrics.days))
      .concat(asArray(metrics.dateList))
      .concat(asArray(metrics.sessionDates))
      .concat(asArray(metrics.nightDates))
      .map((d) => (typeof d === 'string' ? d.slice(0, 10) : d?.date || d?.dateStr || null))
      .filter(Boolean);

  const deepDates = uniq(collectYmidsDeep(metrics).concat(dateList)).sort();

  const seriesBag = pickList(metrics, [
    'series',
    'sets',
    'miniSets',
    'gtgSets',
    'rows',
    'records',
    'entries',
    'firstSessions',
    'lastSessions',
    'sessionsDetail'
  ]);
  const sessionsBag = pickList(metrics, [
    'sessions',
    'sessionList',
    'catalogSessions',
    'trainedSessions',
    'comparable',
    'sessionsDetail'
  ]);
  const daysBag = pickList(metrics, ['dayRows', 'daysDetail', 'nights', 'sleepNights', 'trainedDays']);

  const rawFromSeries = (seriesBag?.items || []).map(summarizeRecord);
  const rawFromSessions = (sessionsBag?.items || []).map(summarizeRecord);
  const rawFromDays = (daysBag?.items || []).map(summarizeRecord);

  const rawRecords = uniq(
    [...rawFromSeries, ...rawFromSessions, ...rawFromDays]
      .map((r) => r.date)
      .concat(deepDates)
  ).map((date, index) => ({
    index,
    date,
    label: date,
    source: 'metrics'
  }));

  // Si on a des objets riches, préférer ceux-là comme enregistrements bruts
  const richRaw = [...rawFromSeries, ...rawFromSessions, ...rawFromDays].filter(
    (r) => r.raw || (r.label && r.label !== r.date)
  );

  const evidenceItems = [];
  if (row.evidence) evidenceItems.push({ role: 'evidenceLine', text: String(row.evidence) });
  if (ctx.evidenceLine && ctx.evidenceLine !== row.evidence) {
    evidenceItems.push({ role: 'context.evidenceLine', text: String(ctx.evidenceLine) });
  }
  asArray(interpretation?.evidence || row.evidenceList || metrics.evidence).forEach((e, i) => {
    if (!e) return;
    evidenceItems.push({
      role: Array.isArray(interpretation?.evidence) ? `interpretation.evidence[${i}]` : `metrics.evidence[${i}]`,
      text: typeof e === 'string' ? e : e.summary || e.text || JSON.stringify(e).slice(0, 160)
    });
  });
  asArray(metrics.proofs || interpretation?.proofs).forEach((p, i) => {
    if (!p) return;
    evidenceItems.push({
      role: `proof[${i}]`,
      text: p.summary || p.id || JSON.stringify(p).slice(0, 160),
      present: p.present,
      strength: p.strength,
      kind: p.kind
    });
  });

  const familySel = report?.selectionDiagnostics?.byFamily?.[row.family] || null;
  const copyProvenance = buildCopyProvenance(row, discoveryMatch);

  // Preuves dérivées des metrics structurées (gap, vs, dates…)
  if (metrics.gapDays != null) {
    evidenceItems.push({
      role: 'metrics.gapDays',
      text: `Silence de ${metrics.gapDays} jour(s)${
        metrics.habitMedianGap != null ? ` (médiane habituelle ≈ ${metrics.habitMedianGap} j)` : ''
      }${
        metrics.habitIntervalRatio != null
          ? ` · ratio ×${Number(metrics.habitIntervalRatio).toFixed(1)}`
          : ''
      }`
    });
  }
  if (metrics.returnReps != null || metrics.vsPriorPct != null) {
    evidenceItems.push({
      role: 'metrics.return_volume',
      text: `Reprise ${metrics.returnReps ?? '—'} ${metrics.unit || 'reps'}${
        metrics.vsPriorPct != null
          ? ` · ${Math.round(metrics.vsPriorPct)} % de la moyenne d’avant`
          : ''
      }`
    });
  }
  if (metrics.prevDate || metrics.date) {
    evidenceItems.push({
      role: 'metrics.event_dates',
      text: `Avant ${metrics.prevDate || '—'} → reprise ${metrics.date || '—'}`
    });
  }
  if ((metrics.mates || []).length) {
    evidenceItems.push({
      role: 'metrics.same_day_companions',
      text: (metrics.mates || [])
        .map((m) => `${m.name || m.id}: ${m.reps} reps`)
        .join(' · ')
    });
  }

  const calcWithoutTrace =
    !deepDates.length &&
    !(richRaw.length || rawRecords.length) &&
    hasAggregateCalcSignal(metrics);

  const forensics = {
    id: row.id,
    kind: row.kind,
    family: row.family,
    familyLabel: row.familyLabel || row.family,
    title: row.title || ctx.title || '',
    body: row.body || ctx.body || '',
    calcWithoutTrace,
    rawRecords: {
      coverage: layerCoverage(
        richRaw.length ? richRaw : rawRecords,
        calcWithoutTrace
          ? 'Agrégats présents (le moteur a lu des séances) mais dates/séries non attachées au candidat — trou d’instrumentation, pas d’absence de données.'
          : 'Aucune date/enregistrement brut dans metrics — producteur non instrumenté ou agrégat seul.'
      ),
      dates: deepDates,
      items: (richRaw.length ? richRaw : rawRecords).slice(0, 80),
      truncated: (richRaw.length ? richRaw : rawRecords).length > 80
    },
    grouping: {
      coverage: layerCoverage(
        [...(seriesBag?.items || []), ...(sessionsBag?.items || []), ...(daysBag?.items || [])],
        calcWithoutTrace
          ? 'Groupes non attachés au candidat alors que le calcul s’appuie sur des séances historiques (baseline / repsByDate).'
          : 'Pas de listes séries/séances/journées attachées — seulement des compteurs agrégés éventuels.'
      ),
      series: {
        key: seriesBag?.key || null,
        count: seriesBag?.items?.length || metrics.sets || metrics.seriesCount || null,
        items: (seriesBag?.items || []).slice(0, 40).map(summarizeRecord)
      },
      sessions: {
        key: sessionsBag?.key || null,
        count: sessionsBag?.items?.length || metrics.sessionCount || null,
        items: (sessionsBag?.items || []).slice(0, 40).map(summarizeRecord)
      },
      days: {
        key: daysBag?.key || null,
        count: daysBag?.items?.length || metrics.days || metrics.dayCount || null,
        items: (daysBag?.items || []).slice(0, 40).map(summarizeRecord)
      },
      aggregates: Object.fromEntries(
        Object.entries(metrics || {}).filter(
          ([, v]) => typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean'
        )
      )
    },
    discovery: {
      coverage: layerCoverage(
        discoveryMatch || row.kind ? [discoveryMatch || row] : [],
        'Découverte source non retrouvée dans periodDiscoveries.'
      ),
      kind: row.kind,
      nature: row.nature || ctx.nature || null,
      stage: row.generationStage || row.stage || null,
      producer: copyProvenance.producer || row.moduleHint || row.producerHint || null,
      path: copyProvenance.path || [],
      score: row.score ?? null,
      weight: row.weight ?? null,
      confidence: row.confidence ?? null,
      relevance: row.relevance ?? null,
      scope,
      matchStatus: discoveryMatch?.status || null,
      matchReason: discoveryMatch?.reason || null,
      matchedId: discoveryMatch?.id || null,
      draftTitle: copyProvenance.draft?.title || metrics.draftTitle || null,
      type: metrics.type || null,
      factId: metrics.factId || null,
      rewardTone: copyProvenance.rewardTone || row.rewardTone || null
    },
    evidence: {
      coverage: layerCoverage(
        evidenceItems,
        'Aucune preuve textuelle/structurée attachée (evidence / proofs).'
      ),
      items: evidenceItems,
      evidenceCount: row.evidenceCount ?? evidenceItems.length,
      sourceCount: row.sourceCount ?? null,
      linkedSlots: copyProvenance.slotsBound || []
    },
    copy: {
      title: copyProvenance.final.title,
      body: copyProvenance.final.body,
      draftTitle: copyProvenance.draft.title,
      draftBody: copyProvenance.draft.body,
      titleTransform: copyProvenance.titleTransform,
      bodyChanged: copyProvenance.bodyChanged,
      steps: copyProvenance.steps,
      path: copyProvenance.path,
      editorialRules: copyProvenance.editorialRules,
      slots: copyProvenance.slots,
      slotsBound: copyProvenance.slotsBound,
      slotsUnbound: copyProvenance.slotsUnbound,
      claims: copyProvenance.claims,
      qualityFlags: copyProvenance.qualityFlags,
      quality: copyProvenance.quality,
      producer: copyProvenance.producer,
      rewardTone: copyProvenance.rewardTone,
      nature: copyProvenance.nature,
      generationStage: copyProvenance.generationStage,
      horizon: copyProvenance.horizon,
      kind: copyProvenance.kind,
      mates: copyProvenance.mates || [],
      note: copyProvenance.note
    },
    selection: {
      status: row.status,
      diagStatus: row.diagStatus,
      reason: row.decisionReason || row.reason || null,
      displayScope: row.displayScope,
      finalStage: row.finalStageReached,
      horizon: row.horizon,
      weight: row.weight ?? null,
      score: row.score ?? null,
      informativeValue: metrics.informativeValue ?? row.informativeValue ?? null,
      noveltyKey: row.noveltyKey || null,
      evidenceFamilyId: row.evidenceFamilyId || null,
      familyBucket: familySel
        ? {
            produced: familySel.produced,
            shown: familySel.shown,
            ranked_out: familySel.ranked_out,
            deduped: familySel.deduped,
            insufficient_data: familySel.insufficient_data,
            kindsProduced: familySel.kindsProduced || [],
            kindsShown: familySel.kindsShown || []
          }
        : null,
      caps: report?.raw?.caps || null,
      meaning: row.diagMeta?.meaning || null,
      displaceLog: report?.periodDiscoveriesDebug?.displaceLog || [],
      droppedBy: report?.periodDiscoveriesDebug?.droppedBy || null,
      selectedInformative: report?.periodDiscoveriesDebug?.selectedInformative || null,
      pipelineHint:
        row.diagStatus === 'shown_now'
          ? 'Retenu dans le pack final (selectNarrativeColumns / rescue éventuel).'
          : row.reason ||
            'Non affiché dans ce run — voir ranked_out, dedup, validation ou discovery_drop.'
    },
    trajectoryReasoning: metrics.trajectoryOk
      ? {
          ok: true,
          mode: metrics.trajectoryMode || null,
          primaryStory: metrics.trajectoryPrimaryStory || null,
          path: metrics.trajectoryPath || null,
          shape: metrics.trajectoryShape || null,
          setMechanism: metrics.trajectorySetMechanism || null,
          peers: metrics.trajectoryPeers || null,
          implicationRule: metrics.trajectoryImplicationRule || null,
          richness: metrics.trajectoryRichness ?? null,
          temporalScope: metrics.temporalScope || null,
          positions: metrics.trajectoryPositions || [],
          sessions: (metrics.sessions || []).slice(0, 24)
        }
      : metrics.trajectoryOk === false
        ? { ok: false, reason: metrics.trajectoryReason || null }
        : null,
    metrics
  };

  forensics.defectHints = inferDefectLayer(forensics);
  return forensics;
}
