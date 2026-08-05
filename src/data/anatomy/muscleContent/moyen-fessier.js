/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const moyenFessier = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Face externe ilium → grand trochanter. Abduction de hanche et stabilisation du bassin en appui unilatéral (marche, course, fentes). Complète le grand fessier : puissance vs contrôle. Faiblesse → bassin qui bascule, valgus dynamique du genou.'
        }
      ]
    },
    {
      id: 'momentum',
      title: 'Street workout',
      blocks: [
        {
          type: 'ul',
          items: [
            'L-sit : bassin aligné',
            'Handstand : corrections via hanche',
            'Human flag : résistance aux forces latérales'
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
          category: 'Poids du corps',
          stars: 5,
          items: [
            'Élévation latérale jambe (bassin fixe)',
            'Side plank + abduction',
            'Marche latérale élastique',
            'Single-leg glute bridge',
            'Hip hike sur marche'
          ]
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: ['Abduction machine', 'Bulgarian split squat (stabilité)']
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Erreurs',
      blocks: [
        {
          type: 'ul',
          items: [
            'Rotation du bassin pour « monter plus haut » en abduction',
            'Uniquement charges lourdes sans contrôle unilatéral',
            'Grand fessier fort sans moyen fessier → force mal contrôlée'
          ]
        }
      ]
    }
  ]
};

export default moyenFessier;
