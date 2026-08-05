/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const brachioRadial = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Le brachio-radial forme la saillie externe du bras vers l’avant-bras. Il assiste la flexion du coude, surtout en prise neutre, et épaissit la transition bras / avant-bras.'
        }
      ]
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
