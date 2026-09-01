import presentationBlocks from './oblique-externe/presentationBlocks.js';
import anatomieBlocks from './oblique-externe/anatomieBlocks.js';
import fonctionsBlocks from './oblique-externe/fonctionsBlocks.js';
import erreursBlocks from './oblique-externe/erreursBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const obliqueExterne = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation générale',
      blocks: presentationBlocks
    },
    {
      id: 'anatomie',
      title: 'Origines et insertions',
      blocks: anatomieBlocks
    },
    {
      id: 'fonctions',
      title: 'Rotation, inclinaison et anti-rotation',
      blocks: fonctionsBlocks
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Stabilité anti-rotation',
          stars: 5,
          items: ['Pallof press', 'Side plank', 'Farmer carry unilatéral', 'Suitcase carry']
        },
        {
          type: 'exerciseBlock',
          category: 'Dynamique contrôlée',
          stars: 4,
          items: [
            'Relevés de genoux avec rotation contrôlée',
            'Woodchoppers poulie',
            'Russian twist contrôlé (modéré en volume)'
          ]
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Erreurs fréquentes',
      blocks: erreursBlocks
    }
  ]
};

export default obliqueExterne;
