import presentationBlocks from './quadriceps-femoral/presentationBlocks.js';
import anatomieBlocks from './quadriceps-femoral/anatomieBlocks.js';
import portionsBlocks from './quadriceps-femoral/portionsBlocks.js';
import fonctionsBlocks from './quadriceps-femoral/fonctionsBlocks.js';
import erreursBlocks from './quadriceps-femoral/erreursBlocks.js';
import blessuresBlocks from './quadriceps-femoral/blessuresBlocks.js';
import faqBlocks from './quadriceps-femoral/faqBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const quadricepsFemoral = {
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
      title: 'Les quatre chefs',
      blocks: portionsBlocks
    },
    {
      id: 'fonctions',
      title: 'Biomécanique — squat et morphologie',
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
            'Pistol squat (progression)',
            'Fentes bulgares',
            'Squats tempo (descente lente)',
            'Wall sit'
          ]
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: ['Hack squat', 'Front squat', 'Presse à cuisses', 'Leg extension (volume ciblé, charge progressive)']
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
      id: 'saviez-vous',
      title: 'Le saviez-vous ?',
      blocks: [
        {
          type: 'p',
          text:
            'En sprint, saut ou descente d’escaliers, les forces au genou peuvent dépasser plusieurs fois le poids du corps — d’où l’importance de la progression. Un entraînement lourd bien géré renforce la tolérance aux charges ; les problèmes viennent surtout d’une montée trop rapide, d’une mauvaise technique ou d’un volume excessif.'
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

export default quadricepsFemoral;
