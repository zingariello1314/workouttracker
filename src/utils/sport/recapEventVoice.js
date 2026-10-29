/**
 * Voix temporelle des jalons / cartes Analyse :
 * « Tu viens de… » seulement si l'événement est vraiment aujourd'hui ;
 * sinon ancre sur la date réelle (hier / il y a N jours / le DATE).
 */

import DateHelper from '../dateHelper';
import { daysBetweenYmd, formatDayFr } from './recapTrainingTimeline';

export function resolveVoiceRefYmd(refYmd) {
  return refYmd && /^\d{4}-\d{2}-\d{2}$/.test(refYmd) ? refYmd : DateHelper.getTodayLocal();
}

/**
 * @returns {{ kind: 'today'|'yesterday'|'days'|'dated'|'undated', ago: number|null, prefix: string, presentPerfect: boolean }}
 */
export function voicePastEvent(eventYmd, refYmd) {
  const ref = resolveVoiceRefYmd(refYmd);
  if (!eventYmd || !/^\d{4}-\d{2}-\d{2}$/.test(eventYmd)) {
    return { kind: 'undated', ago: null, prefix: '', presentPerfect: true };
  }
  const ago = daysBetweenYmd(eventYmd, ref);
  if (ago == null) {
    return { kind: 'undated', ago: null, prefix: '', presentPerfect: true };
  }
  if (ago <= 0) {
    return { kind: 'today', ago: 0, prefix: '', presentPerfect: true };
  }
  if (ago === 1) {
    return { kind: 'yesterday', ago: 1, prefix: 'Hier, ', presentPerfect: false };
  }
  if (ago <= 6) {
    return {
      kind: 'days',
      ago,
      prefix: `Il y a ${ago} jours, `,
      presentPerfect: false
    };
  }
  return {
    kind: 'dated',
    ago,
    prefix: `Le ${formatDayFr(eventYmd, true)}, `,
    presentPerfect: false
  };
}

/**
 * Assemble une phrase d'action passée.
 * @param {object} opts
 * @param {string} opts.eventYmd
 * @param {string} [opts.refYmd]
 * @param {string} opts.perfect — ex. "Tu viens d'enregistrer ta première séance depuis 77 jours sur X."
 * @param {string} opts.simple — ex. "tu as enregistré ta première séance depuis 77 jours sur X."
 *   (sans majuscule initiale : le prefix l'apporte, sauf si undated/today)
 */
export function phrasePastAction({ eventYmd, refYmd, perfect, simple }) {
  const v = voicePastEvent(eventYmd, refYmd);
  if (v.presentPerfect) return perfect;
  const body = simple.replace(/^\s*[Tt]u as\s+/, 'tu as ');
  return `${v.prefix}${body}`;
}

/** Formules courantes « Tu viens de + infinitif passé composé ». */
export function phraseTuViensDe({ eventYmd, refYmd, perfectCore, simpleCore }) {
  // perfectCore: "d'enregistrer ta première séance…" / "de battre un record…"
  // simpleCore: "enregistré ta première séance…" / "battu un record…"
  return phrasePastAction({
    eventYmd,
    refYmd,
    perfect: `Tu viens ${perfectCore}`,
    simple: `tu as ${simpleCore}`
  });
}
