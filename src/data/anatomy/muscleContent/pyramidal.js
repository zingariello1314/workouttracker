import presentationBlocks from './pyramidal/presentationBlocks.js';
import anatomieBlocks from './pyramidal/anatomieBlocks.js';
import fonctionsBlocks from './pyramidal/fonctionsBlocks.js';
import erreursBlocks from './pyramidal/erreursBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const pyramidal = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: presentationBlocks
    },
    {
      id: 'anatomie',
      title: 'Anatomie',
      blocks: anatomieBlocks
    },
    {
      id: 'fonctions',
      title: 'Fonction',
      blocks: fonctionsBlocks
    },
    {
      id: 'erreurs',
      title: 'Erreurs fréquentes',
      blocks: erreursBlocks
    }
  ]
};

export default pyramidal;
