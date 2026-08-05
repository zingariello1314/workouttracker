/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const petitRond = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation générale',
      blocks: [
        {
          type: 'p',
          text:
            'Le petit rond appartient à la coiffe des rotateurs mais possède un lien fort avec le haut du dos : il stabilise l’arrière de l’articulation et participe à la rotation externe.'
        },
        {
          type: 'p',
          text:
            'Situé dans la partie postérieure de l’épaule, il complète le système rhomboïdes–trapèze–dorsaux pour une épaule saine en tirage et en poussée. Fiche coiffe complète : famille Épaules.'
        }
      ]
    },
    {
      id: 'anatomie',
      title: 'Anatomie',
      blocks: [
        {
          type: 'h3',
          text: 'Origine et insertion'
        },
        {
          type: 'p',
          text:
            'Origine sur le bord latéral de la scapula ; insertion sur le tubercule majeur de l’humérus.'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Fonctions',
      blocks: [
        {
          type: 'p',
          text:
            'Rotation externe de l’épaule et stabilisation de la tête humérale — équilibre face aux rotateurs internes renforcés par développés, pompes et dips.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Coiffe & arrière d’épaule',
          stars: 5,
          items: ['Rotation externe élastique / poulie', 'Face pull', 'Cuban rotation légère']
        },
        {
          type: 'exerciseBlock',
          category: 'Tirages',
          stars: 4,
          items: ['Rowing rétraction pause', 'Tractions contrôlées']
        }
      ]
    },
    {
      id: 'blessures',
      title: 'Blessures',
      blocks: [
        {
          type: 'p',
          text:
            'Rarement blessé seul ; problèmes dans un contexte de coiffe faible, déséquilibre poussée/tirage ou surcharge de poussée. Syndrome d’accrochage si épaule enroulée et coiffe déficiente.'
        }
      ]
    }
  ]
};

export default petitRond;
