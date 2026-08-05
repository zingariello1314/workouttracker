/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const splenius = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Muscles postérieurs du cou (splénius tête et cou) — extension, rotation, stabilité. Complètent le SCM et les sous-occipitaux. Posture « tête en avant » sollicite souvent la chaîne postérieure cervicale.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Posture',
          stars: 5,
          items: ['Isométriques cervicales', 'Extension cervicale contrôlée', 'Chin tucks']
        }
      ]
    },
    {
      id: 'momentum',
      title: 'Momentum',
      blocks: [
        {
          type: 'ul',
          items: [
            'Handstand : cou neutre, pas d’hyperextension',
            'Tractions / muscle-up : rigidité axiale du haut du corps'
          ]
        }
      ]
    }
  ]
};

export default splenius;
