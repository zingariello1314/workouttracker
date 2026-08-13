import presentationBlocks from './multifides/presentationBlocks.js';
import anatomieBlocks from './multifides/anatomieBlocks.js';
import fonctionsBlocks from './multifides/fonctionsBlocks.js';
import recrutementBlocks from './multifides/recrutementBlocks.js';
import blessuresBlocks from './multifides/blessuresBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const multifides = {
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
      title: 'Fonctions',
      blocks: fonctionsBlocks
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Contrôle moteur',
          stars: 5,
          items: ['Bird dog', 'Dead bug', 'Gainage dynamique contrôlé']
        },
        {
          type: 'exerciseBlock',
          category: 'Prévention',
          stars: 5,
          items: ['Pallof press', 'Planche latérale', 'Marche lestée stable']
        },
        {
          type: 'exerciseBlock',
          category: 'Hypertrophie directe',
          stars: 1,
          items: ['Peu d’isolation — renforcement indirect via stabilité']
        }
      ]
    },
    {
      id: 'recrutement',
      title: 'Core & chaîne postérieure',
      blocks: recrutementBlocks
    },
    {
      id: 'blessures',
      title: 'Mobilité & santé',
      blocks: blessuresBlocks
    }
  ]
};

export default multifides;
