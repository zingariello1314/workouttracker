/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const petitRond = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Le petit rond fait partie de la coiffe des rotateurs mais joue aussi un rôle dans le haut du dos : il stabilise la tête de l’humérus dans la glène et participe à la rotation externe et à l’adduction de l’épaule.'
        },
        {
          type: 'p',
          text:
            'Pour une fiche détaillée sur l’ensemble supra-épineux, infra-épineux, subscapulaire et petit rond, voir aussi la fiche « Coiffe des rotateurs » (famille Épaules).'
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
            'Rotation externe de l’épaule',
            'Adduction de l’épaule',
            'Stabilisation de l’humérus lors des tirages et développés'
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
          category: 'Renforcement coiffe',
          stars: 5,
          items: ['Face pull', 'Rotation externe élastique / câble', 'Cuban rotation légère']
        },
        {
          type: 'exerciseBlock',
          category: 'Tirages',
          stars: 4,
          items: ['Rowing avec pause en rétraction', 'Tractions contrôlées']
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
            'Syndrome d’accrochage si coiffe faible et épaule enroulée',
            'Tendinopathie du petit rond (moins fréquente que supra-épineux)'
          ]
        }
      ]
    }
  ]
};

export default petitRond;
