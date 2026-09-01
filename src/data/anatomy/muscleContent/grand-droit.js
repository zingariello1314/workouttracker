import presentationBlocks from './grand-droit/presentationBlocks.js';
import anatomieBlocks from './grand-droit/anatomieBlocks.js';
import fonctionsBlocks from './grand-droit/fonctionsBlocks.js';
import recrutementBlocks from './grand-droit/recrutementBlocks.js';
import erreursBlocks from './grand-droit/erreursBlocks.js';
import faqBlocks from './grand-droit/faqBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const grandDroit = {
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
      title: 'Crunchs : utiles mais mal compris',
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
          items: [
            'Relevés de genoux suspendus (bassin en rétroversion)',
            'Reverse crunch',
            'Dragon flag (progression)',
            'Hollow body → relevés jambes'
          ]
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: ['Crunch poulie', 'Relevé de jambes lesté', 'Machine abdominale avec progression']
        }
      ]
    },
    {
      id: 'recrutement',
      title: 'Visibilité et développement',
      blocks: recrutementBlocks
    },
    {
      id: 'erreurs',
      title: 'Erreurs fréquentes',
      blocks: erreursBlocks
    },
    {
      id: 'faq',
      title: 'Questions fréquentes',
      blocks: faqBlocks
    }
  ]
};

export default grandDroit;
