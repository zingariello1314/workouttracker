const deloide = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Le deltoïde recouvre l’épaule et lui donne sa forme arrondie. Trois faisceaux, trois rôles — un seul muscle. Son volume influence la largeur du haut du corps et l’aspect en « V ».'
        }
      ]
    },
    {
      id: 'portions',
      title: 'Les différentes portions',
      blocks: [
        {
          type: 'h3',
          text: 'Faisceau antérieur'
        },
        {
          type: 'p',
          text:
            'Origine claviculaire. Flexion et poussée. Déjà très sollicité sur les développés pecs — peu utile de lui consacrer un volume excessif.'
        },
        {
          type: 'h3',
          text: 'Faisceau moyen'
        },
        {
          type: 'p',
          text: 'Abduction du bras — largeur visuelle des épaules. Potentiel esthétique élevé chez la majorité des pratiquants.'
        },
        {
          type: 'h3',
          text: 'Faisceau postérieur'
        },
        {
          type: 'p',
          text:
            'Souvent sous-développé. Extension horizontale, rotation externe, posture. Équilibre indispensable face aux mouvements de poussée.'
        }
      ]
    },
    {
      id: 'anatomie',
      title: 'Anatomie',
      blocks: [
        {
          type: 'h3',
          text: 'Origines'
        },
        {
          type: 'ul',
          items: ['Tiers externe de la clavicule', 'Acromion', 'Épine de la scapula']
        },
        {
          type: 'h3',
          text: 'Insertion'
        },
        {
          type: 'p',
          text: 'Tubérosité deltoïdienne de l’humérus.'
        }
      ]
    },
    {
      id: 'recrutement',
      title: 'Comment bien le recruter',
      blocks: [
        {
          type: 'p',
          text:
            'Le deltoïde répond au contrôle du mouvement plus qu’aux charges maximales. Élévations latérales lentes > charges balancées. Postérieur : guider avec les coudes plutôt qu’avec les mains.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Antérieur — poids du corps',
          stars: 5,
          items: ['Pike push-up', 'Handstand push-up', 'Pompes pseudo-planche']
        },
        {
          type: 'exerciseBlock',
          category: 'Postérieur — poids du corps',
          stars: 5,
          items: ['Australian pull-up prise large', 'Face pull anneaux', 'Reverse row']
        },
        {
          type: 'exerciseBlock',
          category: 'Antérieur — salle',
          stars: 5,
          items: ['Développé militaire', 'Développé haltères', 'Front raise']
        },
        {
          type: 'exerciseBlock',
          category: 'Moyen — salle',
          stars: 5,
          items: ['Élévations latérales haltères', 'Élévations latérales poulie', 'Machine latérale']
        },
        {
          type: 'exerciseBlock',
          category: 'Postérieur — salle',
          stars: 5,
          items: ['Reverse pec deck', 'Face pull', 'Oiseau haltères']
        },
        {
          type: 'portionTable',
          title: 'Portion ↔ exercices',
          rows: [
            { label: 'Antérieur', exercises: ['Développé militaire', 'Développé Arnold', 'Pike push-up'] },
            { label: 'Moyen', exercises: ['Élévations latérales', 'Poulie unilatérale', 'Machine latérale'] },
            { label: 'Postérieur', exercises: ['Face pull', 'Reverse pec deck', 'Oiseau'] }
          ]
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
            'Charges trop lourdes en élévations latérales → balancement et trapèzes.',
            'Négliger le postérieur → épaules enroulées, inconfort antérieur.',
            'Sur-volume antérieur alors qu’il est déjà sollicité sur les pecs.'
          ]
        }
      ]
    },
    {
      id: 'blessures',
      title: 'Blessures',
      blocks: [
        {
          type: 'ul',
          items: [
            'Conflit sous-acromial',
            'Tendinopathie du deltoïde',
            'Bursite',
            'Lésions de coiffe (voir fiche dédiée)'
          ]
        }
      ]
    },
    {
      id: 'volume',
      title: 'Volume & fréquence',
      blocks: [
        {
          type: 'p',
          text:
            'Souvent : plus de volume sur moyen et postérieur que sur antérieur. Séries de 10–20 reps, exécution contrôlée.'
        }
      ]
    }
  ]
};

export default deloide;
