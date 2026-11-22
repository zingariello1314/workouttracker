/**
 * Validateur / correcteur éditorial final (Mission 11).
 * Commun à toutes les cartes — ne modifie pas les noms d’exercices personnalisés.
 */

const TECHNICAL_LEAKS = [
  /\bnet rise\b/gi,
  /\bnet decline\b/gi,
  /\bsocle_commun_avec_variantes\b/gi,
  /\bstreak\b/gi,
  /\bpushPull\b/gi,
  /\bprimary\/secondary\b/gi,
  /\bsnapshots?\b/gi,
  /\bmultiShare\b/gi,
  /\bjournal_absent\b/gi,
  /\bassociation_not_causation\b/gi,
  /\bligne vue jusqu['’]au\b/gi,
  /\bstockage distinct\b/gi
];

const AGREEMENT_FIXES = [
  { re: /\bCes 7 jours pèse\b/gi, to: 'Ces 7 jours pèsent' },
  { re: /\bCes 7 jours sert\b/gi, to: 'Ces 7 jours servent' },
  { re: /\bproche à ton\b/gi, to: 'proche de ton' },
  { re: /\battribuées? à les\b/gi, to: 'attribuées aux' },
  { re: /\bla jambes\b/gi, to: 'les jambes' },
  { re: /\b1 séances\b/gi, to: '1 séance' },
  { re: /\b1 reps\b/gi, to: '1 rep' },
  { re: /\bcréneaux fortement apparentées\b/gi, to: 'créneaux fortement apparentés' },
  { re: /\breps de élévations\b/gi, to: "reps d'élévations" },
  { re: /\bde élévations\b/gi, to: "d'élévations" },
  { re: /\bun niveau plus haut s\b/gi, to: 'un niveau plus haut' },
  { re: /\brendement 0 reps\/h\b/gi, to: 'densité non calculable' }
];

const OVERCLAIM_PATTERNS = [
  {
    id: 'personal_threshold_overclaim',
    re: /seuil (?:de sommeil )?personnel/i,
    note: 'Un petit échantillon asymétrique ne démontre pas un seuil individuel fiable'
  },
  {
    id: 'reproducible_without_replication',
    re: /séparation reproductible/i,
    note: '« Reproductible » exige une reproduction sur des observations indépendantes'
  },
  {
    id: 'density_vs_volume',
    re: /journées? les plus denses/i,
    note: 'Un seuil de répétitions décrit un volume, pas une densité temporelle'
  },
  {
    id: 'zero_as_unknown',
    re: /rendement 0 reps\/h|0 reps\/h/,
    note: 'Inconnu ≠ zéro pour une densité non appariée'
  }
];

/**
 * Audit lexical d’un texte de carte.
 */
export function auditCardProse(card = {}) {
  const title = String(card.title || '');
  const body = String(card.body || card.text || '');
  const evidence = String(card.evidence || '');
  const full = `${title}\n${body}\n${evidence}`;
  const issues = [];

  TECHNICAL_LEAKS.forEach((re) => {
    const m = full.match(re);
    if (m) {
      issues.push({
        type: 'technical_leak',
        match: m[0],
        kind: card.kind || null,
        id: card.id || null
      });
    }
  });

  AGREEMENT_FIXES.forEach(({ re }) => {
    if (re.test(full)) {
      issues.push({
        type: 'agreement_or_syntax',
        match: re.source,
        kind: card.kind || null,
        id: card.id || null
      });
    }
  });

  OVERCLAIM_PATTERNS.forEach((row) => {
    if (row.re.test(full)) {
      issues.push({
        type: 'overclaim',
        id: row.id,
        note: row.note,
        kind: card.kind || null
      });
    }
  });

  if (/^\s*[a-z0-9_]+\s*$/i.test(body.trim()) && body.includes('_')) {
    issues.push({ type: 'technical_body', kind: card.kind || null, body: body.trim() });
  }

  return {
    schema: 'momentum.editorialProseAudit.v1',
    ok: issues.length === 0,
    issues
  };
}

/**
 * Corrections sûres (accords / fuites techniques génériques).
 * Ne touche pas aux noms d’exercices personnalisés.
 */
export function polishCardProse(card = {}) {
  if (!card) return card;
  let title = String(card.title || '');
  let body = String(card.body || card.text || '');
  let evidence = String(card.evidence || '');

  AGREEMENT_FIXES.forEach(({ re, to }) => {
    title = title.replace(re, to);
    body = body.replace(re, to);
    evidence = evidence.replace(re, to);
  });

  // Remplacer les fuites techniques visibles par une formulation neutre
  const leakMap = [
    [/socle_commun_avec_variantes/gi, 'socle commun avec variantes'],
    [/association_not_causation/gi, 'association descriptive, pas une causalité'],
    [/\bnet rise\b/gi, 'hausse nette'],
    [/\bnet decline\b/gi, 'baisse nette'],
    [/\bmultiShare\b/gi, 'part multi-principale'],
    [/\bjournal_absent\b/gi, 'journal absent'],
    [/ligne vue jusqu['’]au/gi, 'dernière apparition le'],
    [/stockage distinct/gi, 'enregistrement distinct']
  ];
  leakMap.forEach(([re, to]) => {
    title = title.replace(re, to);
    body = body.replace(re, to);
    evidence = evidence.replace(re, to);
  });

  const soften = (text) =>
    String(text || '')
      .replace(/seuil de sommeil personnel/gi, 'écart de durée de sommeil observé')
      .replace(/seuil de sommeil observé(?: dans ton historique)?/gi, 'écart de durée de sommeil observé')
      .replace(/seuil observé dans ton historique/gi, 'écart observé dans ton historique')
      .replace(/séparation reproductible/gi, 'séparation observée')
      .replace(/facteur discriminant/gi, 'écart observé')
      .replace(/Le lien est net/gi, 'L’association est visible')
      .replace(/\brendement\s+0\s*reps\/h\b/gi, 'densité non calculable')
      .replace(/\b0\s*reps\/h\b/gi, 'densité non calculable')
      .replace(/Les journées les plus denses/gi, 'Les journées à fort volume')
      .replace(/seuil de sommeil/gi, 'durée de sommeil');

  title = soften(title);
  body = soften(body);
  evidence = soften(evidence);

  return {
    ...card,
    title,
    body,
    text: body,
    evidence,
    editorialGuard: {
      applied: true,
      audit: auditCardProse({ ...card, title, body, evidence })
    }
  };
}

/**
 * Applique le garde-fou sur une liste de cartes (publication).
 */
export function polishPublishedInsights(insights = {}) {
  if (!insights) return insights;
  const mapList = (rows) => (Array.isArray(rows) ? rows.map(polishCardProse) : rows);
  return {
    ...insights,
    shortTerm: mapList(insights.shortTerm),
    mediumTerm: mapList(insights.mediumTerm),
    longTerm: mapList(insights.longTerm),
    accessibleReserve: mapList(insights.accessibleReserve)
  };
}

/**
 * Audit lexical agrégé pour l’export AUDIT_IA.
 */
export function auditInsightsProse(insights = {}) {
  const cards = [
    ...(insights.shortTerm || []),
    ...(insights.mediumTerm || []),
    ...(insights.longTerm || []),
    ...(insights.accessibleReserve || [])
  ];
  const findings = cards.flatMap((card) => {
    const a = auditCardProse(card);
    return a.issues.map((issue) => ({
      ...issue,
      title: card.title || null,
      period: card.period || null
    }));
  });
  return {
    schema: 'momentum.editorialProseBatchAudit.v1',
    cardCount: cards.length,
    issueCount: findings.length,
    findings
  };
}
