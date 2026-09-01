import presentationBlocks from './transverse/presentationBlocks.js';
import anatomieBlocks from './transverse/anatomieBlocks.js';
import fonctionsBlocks from './transverse/fonctionsBlocks.js';
import erreursBlocks from './transverse/erreursBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const transverse = {
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
      title: 'Respiration et rigidité',
      blocks: fonctionsBlocks
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Contrôle & stabilité',
          stars: 5,
          items: ['Vacuum abdominal', 'Dead bug', 'Hollow body hold', 'Planche (RKC, qualité > durée)', 'Ab wheel']
        },
        {
          type: 'exerciseBlock',
          category: 'Anti-rotation',
          stars: 5,
          items: ['Pallof press', 'Farmer / suitcase carry']
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Erreurs fréquentes',
      blocks: erreursBlocks
    },
    {
      id: 'saviez-vous',
      title: 'Types de gainage',
      blocks: [
        {
          type: 'h3',
          text: 'Anti-extension'
        },
        {
          type: 'p',
          text:
            'Résister à la tendance du tronc à partir en extension. Planche, hollow body, ab wheel, variantes de dead bug. Un bon gainage intense et court peut surpasser une planche relâchée de plusieurs minutes.'
        },
        {
          type: 'h3',
          text: 'Anti-rotation'
        },
        {
          type: 'p',
          text:
            'Résister à une force qui cherche à faire tourner le tronc. Pallof press, carry unilatéral, variantes asymétriques au poids du corps.'
        },
        {
          type: 'h3',
          text: 'Anti-inclinaison'
        },
        {
          type: 'p',
          text:
            'Résister à une force qui cherche à faire basculer le tronc sur le côté. Side plank, suitcase carry. Le transverse participe à la tension générale de la paroi, avec les obliques.'
        },
        {
          type: 'h3',
          text: 'Contrôle dynamique et flexion'
        },
        {
          type: 'p',
          text:
            'Maintenir bassin et cage thoracique organisés pendant que les membres bougent : dead bug, relevés, L-sit. La flexion (crunch, crunch lesté, relevés avec rétroversion) développe une autre fonction et complète le gainage, elle ne le remplace pas.'
        }
      ]
    }
  ]
};

export default transverse;
