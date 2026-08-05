/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const obliqueExterne = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Couche superficielle latérale de l’abdomen. Fibres obliques des côtes 5–12 vers le bassin et la ligne blanche — rotation, inclinaison latérale et anti-rotation.'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Fonctions',
      blocks: [
        {
          type: 'ul',
          items: [
            'Rotation du tronc',
            'Inclinaison latérale',
            'Stabilisation anti-rotation sous charge'
          ]
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Rotation & inclinaison',
          stars: 4,
          items: ['Russian twist contrôlé', 'Wood chop poulie', 'Side plank', 'Pallof press', 'Farmer carry unilatéral']
        }
      ]
    }
  ]
};

export default obliqueExterne;
