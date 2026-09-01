import presentationBlocks from './ischio-jambiers/presentationBlocks.js';
import anatomieBlocks from './ischio-jambiers/anatomieBlocks.js';
import portionsBlocks from './ischio-jambiers/portionsBlocks.js';
import fonctionsBlocks from './ischio-jambiers/fonctionsBlocks.js';
import erreursBlocks from './ischio-jambiers/erreursBlocks.js';
import blessuresBlocks from './ischio-jambiers/blessuresBlocks.js';
import faqBlocks from './ischio-jambiers/faqBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const ischioJambiers = {
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
      id: 'portions',
      title: 'Les trois muscles',
      blocks: portionsBlocks
    },
    {
      id: 'fonctions',
      title: 'Pourquoi sont-ils souvent blessés ?',
      blocks: fonctionsBlocks
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Poids du corps',
          stars: 5,
          items: ['Nordic curl (progression)', 'Glute ham raise', 'Sliding leg curl', 'Single-leg RDL au poids du corps']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: [
            'Soulevé de terre jambes tendues / RDL',
            'Leg curl couché ou assis',
            'Good morning',
            'Soulevé de terre classique (chaîne complète)'
          ]
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Erreurs fréquentes',
      blocks: erreursBlocks
    },
    {
      id: 'blessures',
      title: 'Blessures fréquentes',
      blocks: blessuresBlocks
    },
    {
      id: 'faq',
      title: 'Questions fréquentes',
      blocks: faqBlocks
    }
  ]
};

export default ischioJambiers;
