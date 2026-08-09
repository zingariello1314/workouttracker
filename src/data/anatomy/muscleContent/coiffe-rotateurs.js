import presentationBlocks from './coiffe-rotateurs/presentationBlocks.js';
import musclesBlocks from './coiffe-rotateurs/musclesBlocks.js';
import fonctionsBlocks from './coiffe-rotateurs/fonctionsBlocks.js';
import erreursBlocks from './coiffe-rotateurs/erreursBlocks.js';
import blessuresBlocks from './coiffe-rotateurs/blessuresBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const coiffeRotateurs = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: presentationBlocks
    },
    {
      id: 'muscles',
      title: 'Les quatre muscles de la coiffe',
      blocks: musclesBlocks
    },
    {
      id: 'fonctions',
      title: 'Fonctions',
      blocks: fonctionsBlocks
    },
    {
      id: 'renforcement',
      title: 'Comment renforcer la coiffe',
      blocks: [
        {
          type: 'p',
          text:
            'La coiffe progresse moins avec des charges lourdes qu’avec un travail précis : rotations externes à l’élastique ou à la poulie, face pulls bien exécutés, Full Can Raise, scapular push-up.'
        },
        {
          type: 'p',
          text:
            'Handstand, dips et développés lourds exigent une coiffe solide. Intégrer ce travail plusieurs fois par semaine, en charge légère et amplitude propre, est souvent plus rentable qu’un volume massif de développé militaire sans préparation.'
        },
        {
          type: 'exerciseBlock',
          category: 'Prévention & contrôle',
          stars: 5,
          items: ['Rotation externe élastique', 'Face pull', 'Full Can Raise', 'Scapular push-up']
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
      title: 'Blessures et troubles fréquents',
      blocks: blessuresBlocks
    }
  ]
};

export default coiffeRotateurs;
