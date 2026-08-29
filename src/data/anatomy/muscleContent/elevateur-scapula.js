import presentationBlocks from './elevateur-scapula/presentationBlocks.js';
import fonctionsBlocks from './elevateur-scapula/fonctionsBlocks.js';
import entretienBlocks from './elevateur-scapula/entretienBlocks.js';
import familleBlocks from './elevateur-scapula/familleBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const elevateurScapula = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: presentationBlocks
    },
    {
      id: 'fonctions',
      title: 'Fonctions',
      blocks: fonctionsBlocks
    },
    {
      id: 'recrutement',
      title: 'Entretien et équilibre',
      blocks: entretienBlocks
    },
    {
      id: 'mobilite',
      title: 'Liens avec la famille épaule',
      blocks: familleBlocks
    }
  ]
};

export default elevateurScapula;
