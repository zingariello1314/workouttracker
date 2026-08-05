/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const obliqueInterne = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Sous l’oblique externe, couche intermédiaire orientée vers la stabilité profonde, le contrôle du bassin et la compression abdominale. Très sollicité en anti-rotation plutôt qu’en twists isolés.'
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
            'Rotation (travail complémentaire avec l’externe)',
            'Anti-rotation (farmer walk unilatéral, pallof)',
            'Pression intra-abdominale'
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
          category: 'Anti-rotation',
          stars: 5,
          items: ['Pallof press', 'Farmer walk unilatéral', 'Side plank dynamique']
        }
      ]
    },
    {
      id: 'recrutement',
      title: 'Développement',
      blocks: [
        {
          type: 'p',
          text:
            'Peu besoin d’isolation « esthétique » : gainage, mouvements unilatéraux et suspension les renforcent déjà. Objectif : tronc solide et fonctionnel.'
        }
      ]
    }
  ]
};

export default obliqueInterne;
