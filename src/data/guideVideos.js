/**
 * Guides YouTube affichés sur le site.
 * La page ne charge qu’une miniature : l’iframe ne part qu’au clic sur lecture.
 *
 * @typedef {{ id: string, start?: number, title: string }} GuideVideo
 */

/** @type {Record<string, GuideVideo>} */
export const ANATOMY_FAMILY_GUIDE_VIDEOS = {
  pectoraux: { id: 'JZDUP66ydvM', title: 'Pectoraux' },
  epaules: { id: 'sH-PQoaCj44', start: 2583, title: 'Épaules' },
  biceps: { id: 'RDl1oyTm5CI', start: 337, title: 'Biceps' },
  triceps: { id: '-mVk8v3mJD8', start: 156, title: 'Triceps' },
  'avant-bras': { id: 'lnVVZAwoz3M', title: 'Avant-bras' },
  mollets: { id: 'vcCnpmMRaio', title: 'Mollets' },
  cou: { id: 'M8Eh_jeoQCE', title: 'Cou et trapèzes' }
};

/**
 * Le trapèze vit dans la famille Haut du dos : la vidéo est sur la fiche muscle,
 * pas en tête de cette famille. Une seule fiche regroupe les trois portions.
 * @type {Record<string, GuideVideo>}
 */
export const ANATOMY_MUSCLE_GUIDE_VIDEOS = {
  trapezes: { id: 'M8Eh_jeoQCE', title: 'Cou et trapèzes' }
};

/** Uniquement la fiche banque « Tractions pronation ». @type {Record<string, GuideVideo>} */
export const EXERCISE_BANK_GUIDE_VIDEOS = {
  'tractions pronation': { id: 'wVKqjs7KRuo', start: 1543, title: 'Tractions pronation' }
};
