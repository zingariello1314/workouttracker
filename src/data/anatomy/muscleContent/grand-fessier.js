import presentationBlocks from './grand-fessier/presentationBlocks.js';
import fonctionsBlocks from './grand-fessier/fonctionsBlocks.js';
import erreursBlocks from './grand-fessier/erreursBlocks.js';
import faqBlocks from './grand-fessier/faqBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const grandFessier = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation générale',
      blocks: presentationBlocks
    },
    {
      id: 'fonctions',
      title: 'Sport, posture et chaîne postérieure',
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
            'Hip thrust au sol',
            'Ponts de hanche / une jambe',
            'Fentes bulgares',
            'Extensions de hanche',
            'Sprints et sauts (puissance)'
          ]
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: [
            'Hip thrust chargé',
            'Squat profond (selon morphologie)',
            'Soulevé de terre / RDL',
            'Fentes marchées',
            'Pull-through poulie'
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
      id: 'momentum',
      title: 'Application Momentum',
      blocks: [
        {
          type: 'p',
          text:
            'Muscle-up explosif, front lever (contrôle du bassin sans cambrure excessive), transfert avec ischio-jambiers et mollets. Moyen et petit fessier (autres fiches) complètent abduction et stabilité unipodale.'
        }
      ]
    },
    {
      id: 'faq',
      title: 'Questions fréquentes',
      blocks: faqBlocks
    }
  ]
};

export default grandFessier;
