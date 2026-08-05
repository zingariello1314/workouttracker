/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const adducteursEnsemble = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Grand adducteur (puissance, extension hanche en squat profond), long et court adducteur, gracile (genou), pectiné — face interne cuisse. Adduction, stabilité bassin, changements de direction, football/combat/sprint.'
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
            'L-sit : jambes serrées, bassin contrôlé',
            'Front lever / handstand : alignement',
            'Human flag : résistance latérale'
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
          items: ['Copenhagen plank', 'Fentes latérales', 'Squat profond', 'Glissement latéral contrôlé']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: ['Adducteur machine', 'Squat sumo', 'Soulevé de terre sumo', 'Fentes latérales chargées']
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
            'Négligés car peu visibles de face',
            'Uniquement étirements sans force',
            'Montée de volume brutale (sensibles chez les sportifs)'
          ]
        }
      ]
    }
  ]
};

export default adducteursEnsemble;
