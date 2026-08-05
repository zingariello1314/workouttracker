const petitPectoral = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Muscle triangulaire situé sous le grand pectoral. Invisible chez la plupart des pratiquants, mais essentiel au mouvement et à la stabilité de l’omoplate.'
        },
        {
          type: 'p',
          text:
            'Origine : 3e, 4e et 5e côtes. Insertion : processus coracoïde de la scapula.'
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
            'Tire l’omoplate vers l’avant et vers le bas',
            'Stabilise la scapula pendant la poussée',
            'Inspirateur accessoire lorsque les épaules sont fixes'
          ]
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Recrutement en entraînement',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Renforcement scapulaire',
          stars: 5,
          items: ['Scapular push-up', 'Push-up plus', 'Dips contrôlés (mobilité épaule)']
        },
        {
          type: 'exerciseBlock',
          category: 'Mobilité',
          stars: 5,
          items: ['Étirement petit pectoral au mur', 'Ouverture cage thoracique']
        },
        {
          type: 'p',
          text:
            'Pompes, développés et dips sollicitent aussi le petit pectoral — équilibrer avec trapèze inférieur, dentelé et rhomboïdes.'
        }
      ]
    },
    {
      id: 'mobilite',
      title: 'Mobilité & équilibre',
      blocks: [
        {
          type: 'callout',
          tone: 'warn',
          text:
            'Un petit pectoral trop raide favorise les épaules enroulées et limite la mobilité gléno-humérale. Étirements doux et équilibre avec le haut du dos sont importants (bureau, musculation poussée-dominante).'
        }
      ]
    }
  ]
};

export default petitPectoral;
