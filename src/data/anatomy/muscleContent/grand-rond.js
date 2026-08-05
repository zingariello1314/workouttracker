/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const grandRond = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Le grand rond est un muscle relativement petit situé sur la face postérieure de l’omoplate, sous le deltoïde postérieur. Il participe aux mouvements de tirage et contribue au « remplissage » esthétique de la zone sous l’épaule.'
        }
      ]
    },
    {
      id: 'anatomie',
      title: 'Anatomie',
      blocks: [
        {
          type: 'ul',
          items: [
            'Origine : bord inférieur de l’omoplate',
            'Insertion : sillon intertuberculaire de l’humérus (avec le grand dorsal)',
            'Innervation : nerf subscapulaire (C5–C6)'
          ]
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
            'Adduction de l’épaule',
            'Extension de l’épaule',
            'Rotation interne de l’humérus'
          ]
        },
        {
          type: 'p',
          text:
            'Peu d’exercices « isolent » le grand rond : il est sollicité avec le grand dorsal et les rotateurs externes en fin de tirage.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Tirages',
          stars: 4,
          items: ['Tractions', 'Rowing horizontal', 'Tirage poulie']
        }
      ]
    }
  ]
};

export default grandRond;
