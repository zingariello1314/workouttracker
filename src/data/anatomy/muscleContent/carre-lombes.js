import presentationBlocks from './carre-lombes/presentationBlocks.js';
import anatomieBlocks from './carre-lombes/anatomieBlocks.js';
import fonctionsBlocks from './carre-lombes/fonctionsBlocks.js';
import erreursBlocks from './carre-lombes/erreursBlocks.js';
import blessuresBlocks from './carre-lombes/blessuresBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const carreLombes = {
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
      title: 'Ceinture lombaire et douleurs',
      blocks: fonctionsBlocks
    },
    {
      id: 'momentum',
      title: 'Mouvements Momentum',
      blocks: [
        {
          type: 'p',
          text:
            'L-sit, front lever, handstand : éviter rotation ou inclinaison du bassin. Farmer / suitcase carry : résistance à l’inclinaison latérale. Side plank sollicite obliques, transverse, carré des lombes et hanche.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Stabilité',
          stars: 5,
          items: ['Side plank', 'Bird dog', 'Dead bug', 'Pallof press']
        },
        {
          type: 'exerciseBlock',
          category: 'Force fonctionnelle',
          stars: 5,
          items: ['Suitcase carry', 'Farmer walk', 'Rowing unilatéral anti-rotation']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle (modéré)',
          stars: 4,
          items: ['Side bend haltère contrôlé — éviter volume excessif si crainte d’épaissir le tronc']
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
      title: 'Contexte lombaire',
      blocks: blessuresBlocks
    }
  ]
};

export default carreLombes;
