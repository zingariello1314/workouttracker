import presentationBlocks from './psoas-iliaque/presentationBlocks.js';
import anatomieBlocks from './psoas-iliaque/anatomieBlocks.js';
import fonctionsBlocks from './psoas-iliaque/fonctionsBlocks.js';
import erreursBlocks from './psoas-iliaque/erreursBlocks.js';
import faqBlocks from './psoas-iliaque/faqBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const psoasIliaque = {
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
      title: 'Relevés de jambes : abdos ou psoas ?',
      blocks: fonctionsBlocks
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Street workout',
          stars: 5,
          items: [
            'Hanging knee raise (bassin contrôlé)',
            'Hanging leg raise / toes to bar',
            'Tuck sit → L-sit → V-sit',
            'Compression drills',
            'Mountain climber contrôlé'
          ]
        },
        {
          type: 'exerciseBlock',
          category: 'Mobilité + force',
          stars: 5,
          items: ['Étirement psoas en fente', 'Couch stretch', 'Cable hip flexion']
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Erreurs',
      blocks: erreursBlocks
    },
    {
      id: 'faq',
      title: 'Questions fréquentes',
      blocks: faqBlocks
    }
  ]
};

export default psoasIliaque;
