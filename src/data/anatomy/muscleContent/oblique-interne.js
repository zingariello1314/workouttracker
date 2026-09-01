import presentationBlocks from './oblique-interne/presentationBlocks.js';
import anatomieBlocks from './oblique-interne/anatomieBlocks.js';
import fonctionsBlocks from './oblique-interne/fonctionsBlocks.js';
import recrutementBlocks from './oblique-interne/recrutementBlocks.js';
import erreursBlocks from './oblique-interne/erreursBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const obliqueInterne = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation générale',
      blocks: presentationBlocks
    },
    {
      id: 'anatomie',
      title: 'Anatomie',
      blocks: anatomieBlocks
    },
    {
      id: 'fonctions',
      title: 'Fonctions',
      blocks: fonctionsBlocks
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Anti-rotation & gainage',
          stars: 5,
          items: ['Pallof press', 'Side plank (statique et dynamique)', 'Farmer walk unilatéral', 'Dead bug']
        }
      ]
    },
    {
      id: 'recrutement',
      title: 'Développement',
      blocks: recrutementBlocks
    },
    {
      id: 'erreurs',
      title: 'Erreurs fréquentes',
      blocks: erreursBlocks
    }
  ]
};

export default obliqueInterne;
