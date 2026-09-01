import presentationBlocks from './brachio-radial/presentationBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const brachioRadial = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: presentationBlocks
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Prise neutre',
          stars: 5,
          items: ['Curl marteau', 'Tractions neutres', 'Carries']
        },
        {
          type: 'exerciseBlock',
          category: 'Pronation',
          stars: 5,
          items: ['Reverse curl barre', 'Reverse curl haltères']
        }
      ]
    },
    {
      id: 'saviez-vous',
      title: 'Vision Momentum',
      blocks: [
        {
          type: 'callout',
          tone: 'tip',
          text:
            'Bras complet = biceps (forme + supination) + brachial (épaisseur) + brachio-radial (transition) + triceps (volume) + avant-bras (prise).'
        }
      ]
    }
  ]
};

export default brachioRadial;
