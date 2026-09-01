import presentationBlocks from './adducteurs-ensemble/presentationBlocks.js';
import anatomieBlocks from './adducteurs-ensemble/anatomieBlocks.js';
import portionsBlocks from './adducteurs-ensemble/portionsBlocks.js';
import fonctionsBlocks from './adducteurs-ensemble/fonctionsBlocks.js';
import erreursBlocks from './adducteurs-ensemble/erreursBlocks.js';
import blessuresBlocks from './adducteurs-ensemble/blessuresBlocks.js';
import faqBlocks from './adducteurs-ensemble/faqBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const adducteursEnsemble = {
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
      title: 'Grand adducteur et gracile',
      blocks: portionsBlocks
    },
    {
      id: 'fonctions',
      title: 'Squat, course et muscles profonds de hanche',
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
          items: ['Copenhagen plank', 'Squat large (stance adaptée)', 'Fentes latérales', 'Contrôle latéral au sol']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: ['Adduction machine', 'Squat sumo', 'Soulevé sumo', 'Fentes latérales chargées']
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
      id: 'momentum',
      title: 'Application Momentum',
      blocks: [
        {
          type: 'p',
          text:
            'L-sit jambes serrées, front lever / handstand (alignement), human flag (résistance latérale). Cette fiche vise la performance : stabiliser le bassin, protéger le genou, améliorer la puissance et compléter quadriceps et fessiers.'
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

export default adducteursEnsemble;
