/**
 * Porte éditoriale du Récap.
 * Une statistique brute ne passe pas.
 * Un écart, une concentration, une relation, une évolution ou une tendance peut passer.
 * 8 % est la bande déjà utilisée pour « proche du mois précédent ».
 */

const CLOSE_PCT = 8;

const GUARD = [
  /Une présence dans la fenêtre n'est pas une habitude installée\.?\s*/gi,
  /Le volume de la séance est [\d\s\u00a0]+, ce n'est pas la série\.?\s*/gi,
  /L'écart décrit la composition du volume, pas un déséquilibre à corriger\.?\s*/gi,
  /Une seule nuit ne suffit pas à décrire un rythme\.?\s*/gi,
  /La moyenne ne dit pas si une séance porte le total\.?\s*/gi,
  /Cette part décrit la fenêtre, pas une charge identique d'un exercice à l'autre\.?\s*/gi,
  /Le record déclaré reste [\d\s\u00a0]+\.?\s*La série observée ne le remplace pas\.?\s*/gi,
  /Ce repère ne dit pas que c'est un problème\.?\s*/gi,
  /Ce n'est pas une preuve que le sommeil provoque[\s\S]*?\.\s*/gi,
  /Ce volume mesure l'ampleur de la reprise, pas à lui seul une progression\.?\s*/gi
];

function blob(card) {
  return `${card?.title || ''} ${card?.body || ''}`;
}

function stripGuards(text) {
  let out = String(text || '');
  GUARD.forEach((re) => {
    out = out.replace(re, '');
  });
  return out.replace(/\s+/g, ' ').trim();
}

function weekWords(text, voiceKey) {
  if (voiceKey !== 'week') return text;
  return String(text || '')
    .replace(/Cette semaine/g, 'Ces 7 jours')
    .replace(/cette semaine/g, 'ces 7 jours')
    .replace(/de la semaine/g, 'de ces 7 jours')
    .replace(/\bces 7 jours est\b/g, 'ces 7 jours sont')
    .replace(/\bCes 7 jours est\b/g, 'Ces 7 jours sont');
}

function thin(text) {
  const t = String(text || '').trim();
  return t.length < 40;
}

function factKey(card) {
  const stamped = String(card?.metrics?.factId || '');
  if (stamped.startsWith('peak|')) return `peak|${stamped.split('|')[1] || ''}`;
  if (stamped) return stamped;
  const kind = card?.kind || '';
  const text = blob(card).toLowerCase();
  if (/disc_sleep_assoc|disc_sleep_quarter|disc_sleep_intensity/.test(kind) || /journées les plus denses|autour de 7 h 30/.test(text)) {
    return 'sleep|volume|association';
  }
  if (kind === 'disc_sleep_family') return 'sleep|volume|association';
  if (kind === 'disc_ms_return' || kind === 'disc_ms_event_combo' || /tu reprends|reprise et niveau/.test(text)) {
    const name = (card.title || '').replace(/^tu reprends\s+/i, '').replace(/\s+après[\s\S]*$/i, '').trim().toLowerCase();
    return `return|${name || kind}`;
  }
  if (kind === 'disc_peak_day' || /porte une grande part|concentre/.test(text)) {
    const day = (text.match(/\d{2}\/\d{2}\/\d{4}/) || [])[0] || '';
    if (day) return `peak|${day}`;
  }
  if (kind === 'disc_muscle_reorient') return 'muscle|month-share';
  if (kind === 'disc_exercise_progress') return `progress|${card.metrics?.name || card.title || ''}`;
  if (kind === 'disc_structural_memory') return `structure|${card.metrics?.name || ''}`;
  return '';
}

function dropReason(card, voiceKey) {
  const kind = card?.kind || '';
  const text = blob(card);
  if (/une seule nuit ne suffit|observation\s*:/i.test(text) && !/nuits/i.test(text)) return 'one-night';
  if (/les familles identifiées portent/i.test(text)) return 'family-list';
  if (/^la poussée compte/i.test(String(card.title || '')) && !/nuit/i.test(text)) return 'push-pull-bare';
  if (/meilleure série/i.test(text) && !/avant|précéd|était à|puis/i.test(text)) return 'series-without-before';
  if (/pic relativisé/i.test(text) && !/au-dessus|en dessous|journées de renforcement/i.test(text)) return 'peak-label';
  if (kind === 'disc_volume_shape' && (voiceKey === 'week' || voiceKey === 'today')) return 'bare-portrait';
  if (kind === 'disc_ratio_structure' || kind === 'disc_push_pull') return 'bare-portrait';
  if (kind === 'disc_exercise_base' || kind === 'disc_stimulus_mix' || kind === 'disc_no_running') return 'inventory';
  if (kind === 'disc_sleep_quarter' || kind === 'disc_sleep_family') return 'same-sleep-relation';
  if (kind === 'disc_ms_event_combo' && /reprise et niveau/i.test(text)) return 'duplicate-return';
  if ((kind === 'exercise_return' || /revient après \d+ jours$/i.test(String(card.title || ''))) && !/reps/i.test(card.body || '')) return 'thin-return';
  if (kind === 'disc_density') {
    const vs = card.metrics?.vs30 ?? card.metrics?.vs7;
    if (vs == null || Math.abs(Number(vs)) < CLOSE_PCT) return 'close-habit';
  }
  if (/^disc_th_(series|pushPull|composition|sleepPlacement)_/.test(kind)) return 'thread-stat';
  return '';
}

function rewrite(card, voiceKey) {
  let title = weekWords(stripGuards(card.title), voiceKey);
  let body = weekWords(stripGuards(card.body), voiceKey);
  let nature = card.nature;
  const kind = card.kind || '';

  if (kind === 'disc_muscle_reorient') {
    title = 'Ce groupe égale son volume du mois, sans devenir le stimulus de la fenêtre';
    if (!/stimulus de la fenêtre/i.test(body)) {
      body = `${body} Cela décrit ce groupe sur le mois, pas le stimulus de toute la fenêtre.`;
    }
    body = body.replace(/cette asymétrie n'est pas seulement descriptive[\s\S]*$/i, '').replace(/\s+/g, ' ').trim();
    nature = 'journey';
  }

  if (kind === 'disc_exercise_progress') {
    const up = /progressé/i.test(card.title || '');
    const name = card.metrics?.name || (card.title || '').split(' a ')[0];
    title = up
      ? `${name} a un niveau plus haut qu'au début`
      : `${name} a un niveau plus bas qu'au début`;
    nature = 'journey';
  }

  if (kind === 'disc_structural_memory') {
    const name = card.metrics?.name || (card.title || '').split(' entre ')[0].split(' devient ')[0];
    title = `${name} prend une place qui n'était pas là avant`;
    body = body.replace(/la fréquence des prochaines semaines dira[\s\S]*?(?=\.|$)/i, 'Le nombre de séances reste trop court pour parler d\'une habitude installée.');
    nature = 'journey';
  }

  if (kind === 'disc_ms_return') {
    const name = String(card.title || '').replace(/^Tu reprends\s+/i, '').replace(/\s+après[\s\S]*$/i, '').trim();
    if (name) title = `${name} revient après un long silence`;
    nature = 'now';
  }

  if (kind === 'disc_sleep_assoc' && /7 h 30/.test(body) && /reps|séances/.test(body)) {
    title = 'Les journées lourdes suivent plus souvent une nuit longue';
    nature = 'trajectory';
  }

  if (kind === 'disc_peak_day') {
    nature = 'now';
  }

  if (kind === 'disc_volume_shape') {
    body = body
      .replace(/Répartition identifiée\s*:[\s\S]*?\./i, '')
      .replace(/pic relativisé\.?/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  title = title.replace(/\.$/, '').trim();
  body = body.trim();
  if (thin(body) || !title) return null;
  if (title.length > 110) title = `${title.slice(0, 107)}…`;
  return { ...card, title, body, nature };
}

export function applyEditorialGate(cards, { voiceKey = '' } = {}) {
  const kept = [];
  const seen = new Set();
  (cards || []).forEach((card) => {
    if (!card?.title && !card?.body) return;
    if (dropReason(card, voiceKey)) return;
    const next = rewrite(card, voiceKey);
    if (!next) return;
    const key = factKey(next);
    if (key && seen.has(key)) return;
    if (key) seen.add(key);
    kept.push(next);
  });
  return kept;
}
