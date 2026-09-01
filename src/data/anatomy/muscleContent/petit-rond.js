import presentationBlocks from './petit-rond/presentationBlocks.js';
import anatomieBlocks from './petit-rond/anatomieBlocks.js';
import fonctionsBlocks from './petit-rond/fonctionsBlocks.js';
import blessuresBlocks from './petit-rond/blessuresBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const petitRond = {
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
          category: 'Coiffe & arrière d’épaule',
          stars: 5,
          items: ['Rotation externe élastique / poulie', 'Face pull', 'Cuban rotation légère']
        },
        {
          type: 'exerciseBlock',
          category: 'Tirages',
          stars: 4,
          items: ['Rowing rétraction pause', 'Tractions contrôlées']
        }
      ]
    },
    {
      id: 'blessures',
      title: 'Blessures',
      blocks: blessuresBlocks
    }
  ]
};

export default petitRond;
