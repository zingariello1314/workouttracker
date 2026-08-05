const coiffeRotateurs = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'La coiffe des rotateurs n’a pas pour rôle principal de produire de grands mouvements : elle centre la tête de l’humérus dans la glène pendant que le bras bouge. Sans elle, stabilité et risque de blessure se dégradent rapidement.'
        }
      ]
    },
    {
      id: 'muscles',
      title: 'Les quatre muscles',
      blocks: [
        {
          type: 'h3',
          text: 'Supra-épineux'
        },
        {
          type: 'p',
          text:
            'Au-dessus de l’épine scapulaire. Initie les premiers degrés d’abduction avant le deltoïde. Exposé aux tendinopathies et conflits sous-acromiaux.'
        },
        {
          type: 'h3',
          text: 'Infra-épineux'
        },
        {
          type: 'p',
          text: 'Rotateur externe majeur. Stabilité en développés, tractions et lancers.'
        },
        {
          type: 'h3',
          text: 'Petit rond'
        },
        {
          type: 'p',
          text: 'Synergie avec l’infra-épineux — rotation externe et centrage de l’humérus.'
        },
        {
          type: 'h3',
          text: 'Subscapulaire'
        },
        {
          type: 'p',
          text:
            'Face antérieure de la scapula. Principal rotateur interne. Stabilisateur dynamique face aux muscles postérieurs.'
        }
      ]
    },
    {
      id: 'renforcement',
      title: 'Comment renforcer la coiffe',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Prévention & contrôle',
          stars: 5,
          items: ['Rotation externe élastique', 'Face pull', 'Full Can Raise', 'Scapular push-up']
        },
        {
          type: 'callout',
          tone: 'tip',
          text: 'Charges légères, amplitude propre — plusieurs fois par semaine. Handstand et dips demandent une coiffe solide.'
        }
      ]
    }
  ]
};

export default coiffeRotateurs;
