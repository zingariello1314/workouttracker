/**
 * F4 — Polish éditorial déterministe (dates FR, accords, ISO → long français).
 * Ne déduit jamais de mécanismes d’entraînement depuis le texte.
 */

import { formatDayFr } from './recapTrainingTimeline';
import { expandSlashDatesInProse } from './recapProseMarks';

const ISO_DATE_RE = /\b(20\d{2})-(\d{2})-(\d{2})\b/g;

export function expandIsoDatesInProse(text) {
  return String(text || '').replace(ISO_DATE_RE, (full, y, m, d) => {
    const fr = formatDayFr(`${y}-${m}-${d}`, true);
    return fr || full;
  });
}

/** Accords / formulations connues (corrections locales, pas un correcteur général). */
export function fixKnownGrammarInProse(text) {
  let s = String(text || '');
  // « Ces 7 jours devient » → deviennent
  s = s.replace(/\b(Ces|ces)\s+(\d+)\s+jours?\s+devient\b/g, (_, ces, n) => {
    const N = Number(n);
    const subj = N <= 1 ? 'jour' : 'jours';
    const verb = N <= 1 ? 'devient' : 'deviennent';
    return `${ces} ${n} ${subj} ${verb}`;
  });
  // Accords pluriel période
  s = s.replace(/\b(Ces|ces)\s+(\d+)\s+jours?\s+répartit\b/g, '$1 $2 jours répartissent');
  s = s.replace(/\b(Ces|ces)\s+(\d+)\s+jours?\s+représente\b/g, '$1 $2 jours représentent');
  s = s.replace(/\b(Ces|ces)\s+(\d+)\s+jours?\s+porte\b/g, '$1 $2 jours portent');
  s = s.replace(/\b(Ces|ces)\s+(\d+)\s+jours?\s+confirme\b/g, '$1 $2 jours confirment');
  s = s.replace(/\b(Ces|ces)\s+(\d+)\s+jours?\s+concentre\b/g, '$1 $2 jours concentrent');
  s = s.replace(/\b(Ces|ces)\s+(\d+)\s+jours?\s+totalise\b/g, '$1 $2 jours totalisent');
  s = s.replace(
    /\b(Ces|ces)\s+(\d+)\s+jours?\s+(sont|étaient)\s+plus\s+dense\b/g,
    '$1 $2 jours $3 plus denses'
  );
  s = s.replace(
    /\b(Ces|ces)\s+(\d+)\s+jours?\s+(sont|étaient)\s+moins\s+dense\b/g,
    '$1 $2 jours $3 moins denses'
  );
  s = s.replace(/\b(Ces|ces)\s+(\d+)\s+jours?\s+plus\s+dense\b/g, '$1 $2 jours plus denses');
  s = s.replace(/\b(Ces|ces)\s+(\d+)\s+jours?\s+moins\s+dense\b/g, '$1 $2 jours moins denses');
  // « ces 30 jours mêlent » OK ; « cette période mêlent » → mêle
  s = s.replace(/\b(Cette|cette)\s+(période|séance|semaine|année)\s+mêlent\b/g, '$1 $2 mêle');
  s = s.replace(/\b(Ces|ces)\s+(\d+)\s+jours?\s+mêle\b/g, '$1 $2 jours mêlent');
  // Genre : tronc / gainage
  s = s.replace(/\bde ta tronc\b/gi, 'de ton tronc');
  s = s.replace(/\bde ta gainage\b/gi, 'de ton gainage');
  s = s.replace(/\bde ta gainage\/tronc\b/gi, 'de ton gainage/tronc');
  s = s.replace(/\b% de ta (tronc|gainage)\b/gi, '% de ton $1');
  s = s.replace(/\bpour Les\b/g, 'pour les');
  s = s.replace(/\.\s*,\s*/g, '. ');
  s = s.replace(/:\s+(\d+)\s+\./g, ': $1.');
  // Articles contractés
  s = s.replace(/\bde le (coucher|lever)\b/gi, 'du $1');
  s = s.replace(/\bLes pectoraux porte\b/g, 'Les pectoraux portent');
  s = s.replace(/\bLes épaules porte\b/g, 'Les épaules portent');
  s = s.replace(/\bLes triceps porte\b/g, 'Les triceps portent');
  s = s.replace(/\bLes jambes porte\b/g, 'Les jambes portent');
  // Sujet manquant
  s = s.replace(/\bTes séances de\s+se situent\b/gi, 'Tes séances se situent');
  // « 1 séance … n’ont » → n’a
  s = s.replace(/\b(1|une)\s+séance([^.]{0,80}?)\bn[’']ont\b/gi, (_, one, mid) => {
    return `${one} séance${mid}n’a`;
  });
  // Pluriel séances + a → ont (prudence : seulement pattern explicite)
  s = s.replace(/\b(\d+)\s+séances([^.]{0,60}?)\bn[’']a\b/gi, (full, n, mid) => {
    if (Number(n) <= 1) return full;
    return `${n} séances${mid}n’ont`;
  });
  // Exercices pluriels + revient → reviennent (noms composés inclus, jusqu’à ~80 car.)
  s = s.replace(
    /\b((?:[Pp]ompes|[Dd]ips|[Tt]ractions|[Rr]elevés|[Hh]yperextensions|[Ee]xtensions|[Oo]iseaux|[Dd]éveloppés)[^:.]{0,80}?)\s+revient\b/g,
    '$1 reviennent'
  );
  // Décimales ASCII dans contextes volume (53.3 → 53,3) — pas les versions/ids
  s = s.replace(
    /\b(\d+)\.(\d+)\s*(répétitions|reps|%|à\s+\d)/gi,
    (_, a, b, rest) => `${a},${b} ${rest}`
  );
  s = s.replace(/\bd’environ (\d+)\.(\d+)\b/gi, 'd’environ $1,$2');
  s = s.replace(/\bà (\d+)\.(\d+)\s+répétitions/gi, 'à $1,$2 répétitions');
  s = s.replace(/≈(\d+)\.(\d+)/g, '≈$1,$2');
  // Jargon de fenêtre → formulation naturelle
  s = s.replace(
    /dont (\d+) avant la fenêtre sélectionnée, (\d+) dedans/gi,
    'dont $1 avant la période affichée, $2 dedans'
  );
  s = s.replace(/avant la fenêtre sélectionnée/gi, 'avant la période affichée');
  s = s.replace(/fenêtre sélectionnée/gi, 'période affichée');
  return s;
}

/** Remplace formulations anonymes sommeil si une date FR / ymd est connue via metrics. */
export function polishSleepAnonymity(discovery) {
  if (!discovery) return discovery;
  const kind = String(discovery.kind || '');
  if (!kind.includes('sleep')) return discovery;
  const ymd =
    discovery.metrics?.nightYmd ||
    discovery.metrics?.ymd ||
    discovery.metrics?.attachment?.ymd ||
    discovery.metrics?.date ||
    null;
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(String(ymd))) return discovery;
  const fr = formatDayFr(ymd, true);
  if (!fr) return discovery;
  let title = String(discovery.title || '');
  let body = String(discovery.body || '');
  const anon = /nuit associée|nuit précédente|dernière nuit|la nuit associée/i;
  if (anon.test(body) || anon.test(title)) {
    body = body
      .replace(/la nuit associée[^,.…]*/gi, `la nuit enregistrée au réveil du ${fr}`)
      .replace(/la nuit précédente(?!\s+du)/gi, `la nuit enregistrée au réveil du ${fr}`)
      .replace(/la dernière nuit(?!\s+du)/gi, `la nuit enregistrée au réveil du ${fr}`);
    title = title
      .replace(/nuit associée/gi, `nuit du ${fr}`)
      .replace(/dernière nuit/gi, `nuit du ${fr}`);
  } else if (kind === 'disc_sleep_night' && body && !body.includes(fr) && !/\d{1,2}\s+\w+\s+20\d{2}/.test(body)) {
    body = `Pour la nuit enregistrée au réveil du ${fr}, ${body.charAt(0).toLowerCase()}${body.slice(1)}`;
  }
  return { ...discovery, title, body };
}

/**
 * Polish d’une discovery (tous kinds) — dates + grammaire + sommeil.
 */
export function polishDiscoveryProse(discovery) {
  if (!discovery || typeof discovery !== 'object') return discovery;
  let d = polishSleepAnonymity(discovery);
  const polish = (t) => fixKnownGrammarInProse(expandIsoDatesInProse(expandSlashDatesInProse(t)));
  const title = polish(d.title || '');
  const body = polish(d.body || '');
  if (title === (d.title || '') && body === (d.body || '')) return d;
  return {
    ...d,
    title,
    body,
    metrics: {
      ...(d.metrics || {}),
      f4Polish: true
    }
  };
}

export function polishDiscoveriesProse(discoveries = []) {
  return (discoveries || []).map(polishDiscoveryProse);
}

/**
 * Validations éditoriales F4 (raisons rejet / warning).
 * Fondées sur preuves structurées + patterns sûrs — pas une blacklist de mots.
 */
export function editorialValidateDiscovery(discovery, ctx = {}) {
  const warnings = [];
  const rejects = [];
  if (!discovery) return { ok: false, rejects: ['empty'], warnings };

  const title = String(discovery.title || '');
  const body = String(discovery.body || '');
  const text = `${title}\n${body}`;
  const ce = discovery.metrics?.composedEvidence;

  if (/\bexercice\s+\d{4,}\b/i.test(text) || /#\d{5,}/.test(text) || /\b\d{9,}\b/.test(text)) {
    rejects.push('raw_exercise_id');
  }
  if (
    /Première apparition\s*:?\s*$/i.test(title.trim()) ||
    /Tu reprends\s+après\b/i.test(title) ||
    /^après \d+\s*jours d'absence\b/i.test(title.trim()) ||
    /depuis \d+\s*jours sur\s*[.]/i.test(body) ||
    /apparition de\s+dans ton historique/i.test(body)
  ) {
    rejects.push('incomplete_exercise_subject');
  }
  if (/Elle mêle\s+\d+(\s*,\s*\d+)+\s*[.]?/i.test(body) || /coïncide avec tu reprends/i.test(body)) {
    rejects.push('broken_number_or_combo_prose');
  }
  if (/va plus vite que les données/i.test(text)) {
    warnings.push('mechanical_coaching_close');
  }
  if (/\b20\d{2}-\d{2}-\d{2}\b/.test(text)) {
    warnings.push('iso_date_in_prose');
  }
  if (
    String(discovery.kind || '').includes('sleep') &&
    /nuit associée|nuit précédente(?!\s+du)|dernière nuit(?!\s+du)/i.test(text) &&
    (discovery.metrics?.nightYmd || discovery.metrics?.ymd)
  ) {
    warnings.push('anonymous_sleep_despite_ymd');
  }

  if (ce?.forbiddenConclusions?.length) {
    const forbidden = ce.forbiddenConclusions;
    if (forbidden.includes('adaptation_physiologique') && /adaptation physiologique|gain de force généralis/i.test(text)) {
      rejects.push('forbidden_physiological_claim');
    }
    if (
      forbidden.includes('causalite_sommeil_performance') &&
      /parce que.*(nuit|sommeil)|(nuit|sommeil).*a causé/i.test(text)
    ) {
      rejects.push('forbidden_sleep_causality');
    }
    if (
      forbidden.includes('consolidation_durable') &&
      /consolidation durable|format désormais installé durablement/i.test(text)
    ) {
      rejects.push('forbidden_consolidation');
    }
    if (
      forbidden.includes('reprise_durable') &&
      /reprise durable|réinstallation durable/i.test(text)
    ) {
      rejects.push('forbidden_durable_return');
    }
    if (
      ce.lexicon &&
      ce.lexicon.maySayPerformance === false &&
      /\btes performances (ont|sont) (baissé|progressé|augmenté)/i.test(text)
    ) {
      warnings.push('lexicon_performance_mismatch');
    }
  }

  // Répétition grossière du même mécanisme (même schéma 2×)
  const schemeHits = text.match(/\d+\s*×\s*\d+/g) || [];
  if (schemeHits.length >= 4) {
    const uniq = new Set(schemeHits.map((s) => s.replace(/\s/g, '')));
    if (uniq.size <= 2) warnings.push('repeated_scheme_phrase');
  }

  return {
    ok: rejects.length === 0,
    rejects,
    warnings,
    voiceKey: ctx.voiceKey || null
  };
}
