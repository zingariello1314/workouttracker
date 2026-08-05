/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const denteleAnterieur = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Le dentelé antérieur (serratus anterior) est un muscle souvent oublié, situé sur le flanc du thorax sous l’aisselle. Il relie les côtes au bord médial de l’omoplate et est essentiel pour une épaule fonctionnelle.'
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
            'Origine : faces externe des 1re à 9e côtes (en règle générale)',
            'Insertion : bord médial et angle inférieur de la scapula',
            'Innervation : nerf thoracique long (C5–C7)'
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
            'Protraction de l’omoplate (éloigner la scapula en avant)',
            'Rotation supérieure de la scapula',
            'Maintien de l’omoplate contre la cage thoracique'
          ]
        },
        {
          type: 'callout',
          tone: 'tip',
          text: 'Sollicité lors des pompes, mouvements au-dessus de la tête, frappes et lancers.'
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
          items: ['Push-up plus', 'Scapular push-up', 'Planche protraction', 'Bear crawl']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 4,
          items: ['Landmine press', 'Élévations avec rotation scapulaire', 'Développé avec protraction contrôlée']
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Pourquoi c’est important',
      blocks: [
        {
          type: 'ul',
          items: [
            'Dentelé faible → winging scapula (omoplate qui « ressort »)',
            'Moins de stabilité en développé et au-dessus de la tête',
            'Mauvaise coordination avec trapèze et rhomboïdes sur les tirages'
          ]
        }
      ]
    }
  ]
};

export default denteleAnterieur;
