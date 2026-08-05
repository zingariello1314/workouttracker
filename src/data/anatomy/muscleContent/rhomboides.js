/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const rhomboides = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Les rhomboïdes (petit et grand) sont situés entre la colonne vertébrale et le bord médial de l’omoplate. Moins visibles que les dorsaux ou les trapèzes, ils sont pourtant fondamentaux pour la rétraction scapulaire et une bonne posture des épaules.'
        }
      ]
    },
    {
      id: 'portions',
      title: 'Petit et grand rhomboïde',
      blocks: [
        {
          type: 'h3',
          text: 'Petit rhomboïde'
        },
        {
          type: 'p',
          text: 'Origine sur les vertèbres cervicales basses ; insertion sur le bord médial de la scapula.'
        },
        {
          type: 'h3',
          text: 'Grand rhomboïde'
        },
        {
          type: 'p',
          text: 'Origine sur les vertèbres thoraciques ; même insertion sur le bord médial de la scapula.'
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
            'Rétraction de l’omoplate (rapprocher les omoplates)',
            'Rotation inférieure de la scapula',
            'Stabilisation de l’omoplate contre la cage thoracique'
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
          category: 'Salle',
          stars: 5,
          items: ['Rowing horizontal', 'Tirage poitrine avec pause', 'Reverse fly']
        },
        {
          type: 'exerciseBlock',
          category: 'Complément',
          stars: 4,
          items: ['Face pull', 'Tractions scapulaires (rétraction sans flexion coude complète)']
        }
      ]
    },
    {
      id: 'recrutement',
      title: 'Recrutement',
      blocks: [
        {
          type: 'p',
          text:
            'Beaucoup de pratiquants tirent surtout avec les bras. Pour les rhomboïdes : initier avec les omoplates, rapprocher les épaules en arrière, courte pause en fin de tirage sans compenser en extension lombaire.'
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Erreurs fréquentes',
      blocks: [
        {
          type: 'ul',
          items: [
            'Charges trop lourdes sans contrôle scapulaire',
            'Oublier la rétraction en fin de mouvement sur les tirages verticaux',
            'Posture bureau (épaules enroulées) sans travail de rétraction régulier'
          ]
        }
      ]
    }
  ]
};

export default rhomboides;
