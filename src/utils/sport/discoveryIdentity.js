/**
 * Identité des découvertes P6 (Mission 6).
 *
 * Distingue :
 * - detectorKind        — type de détecteur (ex. disc_ms_return)
 * - subjectKey          — sujet analysé (exercice, groupe, période…)
 * - episodeKey          — épisode temporel pertinent (sans date de consultation)
 * - occurrenceId        — occurrence de découverte déterministe
 * - semanticPhenomenonKey — phénomène sémantique (peut unifier plusieurs détecteurs)
 * - stablePublicationId — identité de publication (jamais le détecteur seul)
 * - fusion lineage      — sources d’une conclusion fusionnée
 */

function clean(value) {
  if (value == null || value === '') return '';
  return String(value).trim();
}

function metricBag(metrics = {}) {
  return metrics || {};
}

/** Identifiant du type de détecteur (jamais une identité d’occurrence). */
export function detectorKind(row) {
  return clean(row?.kind || row?.discovery?.kind || row?.claim?.producer || 'unknown');
}

export function subjectKey(row) {
  const m = metricBag(row?.metrics || row?.discovery?.metrics);
  const claimSubject = row?.claim?.subject?.key || row?.discovery?.claim?.subject?.key;
  if (m.exerciseId != null && m.exerciseId !== '') return `ex:${m.exerciseId}`;
  if (m.storageId != null && m.storageId !== '') return `ex:${m.storageId}`;
  if (m.matchKey) return `match:${m.matchKey}`;
  if (m.group) return `grp:${m.group}`;
  if (m.name) return `name:${String(m.name).toLowerCase().trim()}`;
  // Carte publiée sans metrics : récupérer le sujet depuis l’occurrence / titre
  const occ = String(row?.occurrenceId || row?.id || row?.phenomenonId || '');
  const exFromOcc = occ.match(/ex:([^|]+)/);
  if (exFromOcc) return `ex:${exFromOcc[1]}`;
  const nameFromOcc = occ.match(/name:([^|]+)/);
  if (nameFromOcc) return `name:${nameFromOcc[1]}`;
  if (claimSubject && claimSubject !== 'period_activity' && claimSubject !== 'period') {
    return `claim:${claimSubject}`;
  }
  const title = clean(row?.title || row?.discovery?.title);
  // « Face pull: format repris » / « Tu reprends Élévations… »
  const titled =
    title.match(/^tu reprends\s+(.+?)\s+après/i) ||
    title.match(/^([^:]+):/i) ||
    title.match(/^(.+?)\s+(revient|s'efface|s’efface|prend une place)/i);
  if (titled?.[1] && /disc_ms_return|disc_emergence|disc_structural|disc_format|disc_exercise/i.test(detectorKind(row))) {
    return `name:${titled[1].toLowerCase().trim()}`;
  }
  if (m.population) return `pop:${m.population}`;
  if (Array.isArray(m.dates) && m.dates.length) return `dates:${m.dates.slice(0, 3).join(',')}`;
  if (/pushPull|push_pull|stimulus_mix|volume_shape|near_equal|th_concentration|th_rhythm/i.test(detectorKind(row))) {
    return 'period:activity';
  }
  return 'period:global';
}

/**
 * Épisode temporel du phénomène — pas la date de consultation / fin de fenêtre.
 * Une nouvelle consultation le lendemain ne doit pas créer un nouvel id.
 */
export function episodeKey(row) {
  const m = metricBag(row?.metrics || row?.discovery?.metrics);
  if (m.conclusionKey) return `ck:${m.conclusionKey}`;
  if (m.factId) return `fact:${m.factId}`;
  if (m.eventDate) return `ev:${m.eventDate}`;
  if (m.date && m.prevDate) return `ret:${m.prevDate}>${m.date}`;
  if (m.date && Number.isFinite(Number(m.gapDays))) return `gap:${m.date}|${m.gapDays}`;
  if (m.date) return `d:${m.date}`;
  if (m.lastDate && m.prevDate) return `span:${m.prevDate}>${m.lastDate}`;
  if (Array.isArray(m.dates) && m.dates.length) {
    return `dates:${[...m.dates].map(String).sort().join(',')}`;
  }
  if (m.phenomenonPeriod) return `pp:${m.phenomenonPeriod}`;
  if (m.windowStart && m.windowEnd) return `win:${m.windowStart}:${m.windowEnd}`;
  if (Number.isFinite(Number(m.gapDays))) {
    const g = Number(m.gapDays);
    const bucket = g >= 60 ? 'long' : g >= 21 ? 'med' : g >= 7 ? 'short' : 'tiny';
    return `gapBucket:${bucket}`;
  }
  return 'ep:na';
}

function metricAspect(row) {
  const m = metricBag(row?.metrics || row?.discovery?.metrics);
  return (
    clean(m.metricId) ||
    clean(m.mechanism) ||
    clean(m.trajectorySetMechanism) ||
    clean(m.comparisonMethod) ||
    clean(m.progressionDimension) ||
    'aspect:default'
  );
}

/**
 * Clé sémantique : même thèse / même population / même métrique / même preuve
 * peut unifier plusieurs détecteurs (ex. pushPull_now vs _trajectory vs _journey).
 */
export function semanticPhenomenonKey(row) {
  const m = metricBag(row?.metrics || row?.discovery?.metrics);
  const kind = detectorKind(row);
  const family = clean(row?.family || row?.discovery?.family);
  // Familles temporelles d’un même constat (now/trajectory/journey)
  const stem = kind
    .replace(/_now$|_trajectory$|_journey$/, '')
    .replace(/disc_th_/, 'th_')
    .replace(/disc_/, '');
  const proofSig = proofSignature(row);
  if (proofSig) return `${subjectKey(row)}|${stem}|${proofSig}`;
  if (/pushPull|push_pull/i.test(kind)) {
    const push = m.pushReps ?? m.push ?? m.repsPush;
    const pull = m.pullReps ?? m.pull ?? m.repsPull;
    if (push != null && pull != null) return `${subjectKey(row)}|pushPull|${push}:${pull}`;
  }
  return `${subjectKey(row)}|${stem || family || kind}|${metricAspect(row)}|${episodeKey(row)}`;
}

function proofSignature(row) {
  const claim = row?.claim || row?.discovery?.claim || null;
  const assertion = claim?.assertions?.[0] || null;
  const values = claim?.proof?.observedValues || assertion?.observedValues || [];
  if (Array.isArray(values) && values.length) {
    return values
      .map((v) => `${v.id}:${v.value}`)
      .sort()
      .join(',');
  }
  const m = metricBag(row?.metrics || row?.discovery?.metrics);
  const nums = [
    m.repsNow,
    m.repsThen,
    m.pushReps,
    m.pullReps,
    m.returnReps,
    m.priorAvg,
    m.gapDays,
    m.value,
    m.level,
    m.sharePct,
    m.totalReps
  ].filter((n) => n != null && n !== '');
  if (nums.length) return nums.join(',');
  const title = clean(row?.title || row?.discovery?.title).toLowerCase();
  const body = clean(row?.body || row?.discovery?.body).toLowerCase().slice(0, 120);
  if (title && body) return `text:${title}|${body}`;
  return '';
}

/**
 * Identifiant d’occurrence déterministe.
 * N’utilise jamais le détecteur seul.
 */
export function occurrenceId(row) {
  const m = metricBag(row?.metrics || row?.discovery?.metrics);
  if (m.occurrenceId && !looksLikeLegacyPhenomenonTextId(m.occurrenceId)) {
    return String(m.occurrenceId);
  }
  if (m.conclusionKey) return String(m.conclusionKey);
  if (row?.occurrenceId && !looksLikeLegacyPhenomenonTextId(row.occurrenceId)) {
    return String(row.occurrenceId);
  }
  // phenomenonId riche OK seulement s’il n’est pas le legacy texte
  const phen = row?.phenomenonId || row?.claim?.phenomenonId || row?.discovery?.phenomenonId;
  if (
    phen &&
    String(phen).includes('|') &&
    String(phen) !== detectorKind(row) &&
    !looksLikeLegacyPhenomenonTextId(phen) &&
    String(phen).startsWith('disc_')
  ) {
    return String(phen);
  }
  const kind = detectorKind(row);
  const subject = subjectKey(row);
  const episode = episodeKey(row);
  const aspect = metricAspect(row);
  const id = `${kind}|${subject}|${episode}|${aspect}`;
  // Garde-fou : si tout est générique, suffixer un hash court du titre
  if (subject === 'period:global' && episode === 'ep:na') {
    const title = clean(row?.title || row?.discovery?.title).toLowerCase().slice(0, 48);
    const evidence = clean(row?.evidence || row?.discovery?.evidence).slice(0, 32);
    return `${id}|t:${title}|e:${evidence}`;
  }
  return id;
}

/**
 * Identité de publication : occurrence, jamais `id === kind`.
 */
function looksLikeLegacyPhenomenonTextId(id) {
  const s = String(id || '');
  // Ancien format éditorial : ex:123|emergence|text:… — ce n’est pas une identité de publication
  return /\|text:/i.test(s) || /^ex:\d+\|(emergence|return|gap)/i.test(s);
}

export function stablePublicationId(row) {
  if (!row) return 'unknown';
  const kind = detectorKind(row);
  // Préférer une occurrence déjà stampée (jamais le phenomenonId texte legacy)
  if (row.occurrenceId && !looksLikeLegacyPhenomenonTextId(row.occurrenceId)) {
    return String(row.occurrenceId);
  }
  if (row.metrics?.occurrenceId && !looksLikeLegacyPhenomenonTextId(row.metrics.occurrenceId)) {
    return String(row.metrics.occurrenceId);
  }
  const rawId = row.id != null ? String(row.id) : '';
  // id brut = détecteur → collision technique ; ignorer
  // id brut = phenomenon texte legacy → ignorer (sinon jeu C croit à une perte)
  if (rawId && rawId !== kind && rawId.includes('|') && !looksLikeLegacyPhenomenonTextId(rawId)) {
    return rawId;
  }
  if (rawId && rawId !== kind && rawId.includes(':') && /ex:|grp:|disc_/.test(rawId) === false) {
    // ids artificiels de tests (x1, a, …) conservés s’ils ne sont pas le kind
    if (!/^[a-z_]+$/i.test(rawId) || rawId.length <= 4) return rawId;
  }
  if (rawId && rawId !== kind && !rawId.startsWith('disc_') && !looksLikeLegacyPhenomenonTextId(rawId)) {
    return rawId;
  }
  if (row.publicationId && String(row.publicationId) !== kind) {
    const pub = String(row.publicationId).replace(/^pub:/, '');
    if (!looksLikeLegacyPhenomenonTextId(pub)) return pub;
  }
  return occurrenceId(row);
}

export function phenomenonIdOf(row) {
  if (row?.phenomenonId && String(row.phenomenonId).includes('|')) return String(row.phenomenonId);
  if (row?.claim?.phenomenonId && String(row.claim.phenomenonId).includes('|')) {
    return String(row.claim.phenomenonId);
  }
  return semanticPhenomenonKey(row);
}

function isConcreteSubject(sub) {
  return (
    sub.startsWith('ex:') ||
    sub.startsWith('name:') ||
    sub.startsWith('match:') ||
    sub.startsWith('grp:') ||
    sub.startsWith('dates:')
  );
}

/**
 * Équivalence substantielle : même sujet + population + métrique/preuves + conclusion,
 * indépendamment du producteur. Titre seul ≠ preuve d’équivalence.
 * Des exercices distincts ne sont JAMAIS équivalents via une clé sémantique générique.
 */
export function substantiveEquivalence(left, right) {
  if (!left || !right) return { equivalent: false, reason: 'missing' };
  const leftKind = detectorKind(left);
  const rightKind = detectorKind(right);
  const leftSub = subjectKey(left);
  const rightSub = subjectKey(right);

  // Sujets concrets distincts → conclusions distinctes (homonymes / reprises parallèles)
  if (leftSub !== rightSub && isConcreteSubject(leftSub) && isConcreteSubject(rightSub)) {
    return { equivalent: false, reason: 'distinct_subjects', proof: { leftSub, rightSub } };
  }

  const leftSem = semanticPhenomenonKey(left);
  const rightSem = semanticPhenomenonKey(right);
  // Même clé sémantique uniquement si le sujet est compatible (évite period:global collapse)
  if (
    leftSem &&
    leftSem === rightSem &&
    leftSub === rightSub &&
    !(leftSub === 'period:global' && !isConcreteSubject(leftSub))
  ) {
    return {
      equivalent: true,
      reason: 'same_semantic_phenomenon',
      proof: { leftSem, rightSem, leftKind, rightKind, leftSub }
    };
  }

  const leftTitle = clean(left.title || left.discovery?.title).toLowerCase();
  const rightTitle = clean(right.title || right.discovery?.title).toLowerCase();
  const leftBody = clean(left.body || left.discovery?.body).toLowerCase().slice(0, 160);
  const rightBody = clean(right.body || right.discovery?.body).toLowerCase().slice(0, 160);
  const leftProof = proofSignature(left);
  const rightProof = proofSignature(right);

  if (leftTitle && leftTitle === rightTitle && leftBody && leftBody === rightBody) {
    // Titre+corps identiques + sujets concrets distincts → examiner, ne pas fusionner
    if (leftSub !== rightSub && isConcreteSubject(leftSub) && isConcreteSubject(rightSub)) {
      return { equivalent: false, reason: 'same_title_distinct_subjects', proof: { leftSub, rightSub } };
    }
    if (leftProof && rightProof && leftProof === rightProof && leftSub === rightSub) {
      return {
        equivalent: true,
        reason: 'same_text_and_proof',
        proof: { leftProof, leftKind, rightKind, leftTitle, leftSub }
      };
    }
    if (leftSub === rightSub && (leftSub === 'period:activity' || leftSub.startsWith('period:'))) {
      if (!leftProof || !rightProof || leftProof === rightProof) {
        return {
          equivalent: true,
          reason: 'same_text_shared_population',
          proof: { leftTitle, leftKind, rightKind }
        };
      }
      return { equivalent: false, reason: 'same_title_different_proof', proof: { leftProof, rightProof } };
    }
    return { equivalent: false, reason: 'same_title_unresolved_subjects', proof: { leftSub, rightSub } };
  }

  return { equivalent: false, reason: 'independent' };
}

export function buildFusionLineage(survivor, sources = []) {
  const survivorId = stablePublicationId(survivor);
  const sourceIds = (sources || []).map((s) => ({
    occurrenceId: occurrenceId(s),
    publicationId: stablePublicationId(s),
    phenomenonId: phenomenonIdOf(s),
    detectorKind: detectorKind(s),
    subjectKey: subjectKey(s),
    title: s?.title || s?.discovery?.title || null
  }));
  return {
    survivorId,
    sources: sourceIds,
    sourceCount: sourceIds.length
  };
}

/**
 * Enrichit une découverte avec occurrenceId / phenomenonId stables.
 * N’écrase pas une identité déjà riche.
 */
export function stampDiscoveryIdentity(discovery) {
  if (!discovery || typeof discovery !== 'object') return discovery;
  const occ = occurrenceId(discovery);
  const phen = phenomenonIdOf(discovery);
  const nextMetrics = {
    ...(discovery.metrics || {}),
    occurrenceId: discovery.metrics?.occurrenceId || occ
  };
  return {
    ...discovery,
    id: discovery.id && discovery.id !== discovery.kind ? discovery.id : occ,
    occurrenceId: discovery.occurrenceId || occ,
    phenomenonId: discovery.phenomenonId && String(discovery.phenomenonId).includes('|')
      ? discovery.phenomenonId
      : phen,
    metrics: nextMetrics
  };
}
