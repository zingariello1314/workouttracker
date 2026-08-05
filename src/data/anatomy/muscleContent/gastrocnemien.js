/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const gastrocnemien = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Chefs médial et latéral — mollet superficiel, forme visible. Biarticulaire (genou + cheville) : genou tendu → gastroc dominant. Flexion plantaire, sprint, saut. Converge vers le tendon d’Achille (stockage/restitution d’énergie élastique).'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Mollets debout',
          stars: 5,
          items: ['Mollets sur marche (amplitude)', 'Mollets unilatéraux', 'Standing calf raise']
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
            'Rebonds sans pause basse/haute',
            'Uniquement debout (soléaire négligé)',
            'Volume insuffisant (muscle habitué à la marche quotidienne)'
          ]
        }
      ]
    }
  ]
};

export default gastrocnemien;
