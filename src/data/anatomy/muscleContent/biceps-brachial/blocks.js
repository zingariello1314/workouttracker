/** Helpers blocs fiche biceps brachial. */
export const p = (text) => ({ type: 'p', text });
export const h3 = (text) => ({ type: 'h3', text });
export const ul = (items) => ({ type: 'ul', items });
export const takeaway = (text, label = 'À retenir') => ({ type: 'takeaway', label, text });
export const pCallout = (variant, tag, text) => ({
  type: 'presentationCallout',
  variant,
  tag,
  text
});
export const callout = (title, text, tone = 'warn') => ({ type: 'callout', title, text, tone });

const BICEPS_FIG = '/anatomy/biceps';

/** @param {'landscape'|'portrait'} [layout] */
export const figure = (file, caption, alt = '', layout = 'landscape') => ({
  type: 'figure',
  src: `${BICEPS_FIG}/${file}`,
  caption,
  alt: alt || caption,
  layout
});

/** Figure hors dossier biceps (ex. planche partagée brachial). */
export const figureAt = (folder, file, caption, alt = '', layout = 'landscape') => ({
  type: 'figure',
  src: `/anatomy/${folder}/${file}`,
  caption,
  alt: alt || caption,
  layout
});
