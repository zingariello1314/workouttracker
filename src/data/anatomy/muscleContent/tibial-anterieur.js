import presentationBlocks from './tibial-anterieur/presentationBlocks.js';
import fonctionsBlocks from './tibial-anterieur/fonctionsBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const tibialAnterieur = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation générale',
      blocks: presentationBlocks
    },
    {
      id: 'fonctions',
      title: 'Pourquoi ne pas l’oublier',
      blocks: fonctionsBlocks
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Renforcement',
          stars: 5,
          items: ['Tibialis raise', 'Marche sur talons', 'Appui unipodal contrôlé', 'Flexion dorsale résistée']
        }
      ]
    },
    {
      id: 'momentum',
      title: 'Application Momentum',
      blocks: [
        {
          type: 'p',
          text:
            'Réceptions de saut, course, équilibre en figures : complément naturel aux mollets (famille Mollets). Charges modérées, amplitude complète, fréquence possiblement élevée.'
        }
      ]
    }
  ]
};

export default tibialAnterieur;
