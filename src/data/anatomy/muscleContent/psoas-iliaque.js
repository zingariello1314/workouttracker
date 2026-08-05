/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const psoasIliaque = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Psoas majeur + iliaque : vertèbres lombaires / fosse iliaque → petit trochanter. Principal fléchisseur de hanche — colonne, bassin, fémur. L-sit, relevés suspendus, course (retour de jambe).'
        },
        {
          type: 'callout',
          tone: 'tip',
          text: 'Autres fléchisseurs de hanche : droit fémoral (voir Quadriceps), sartorius, tenseur du fascia lata (bandelette ilio-tibiale, stabilité genou avec moyen/petit fessier).'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Street workout',
          stars: 5,
          items: ['Hanging knee raise', 'Hanging leg raise', 'Tuck L-sit / L-sit', 'Compression drill', 'Mountain climber contrôlé']
        },
        {
          type: 'exerciseBlock',
          category: 'Mobilité + force',
          stars: 5,
          items: ['Étirement psoas en fente', 'Couch stretch', 'Cable hip flexion']
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
            'Relevés jambes = souvent psoas si bassin non rétroversé',
            'Toujours étirer sans renforcer actif',
            'Déséquilibre fessiers / extenseurs de hanche',
            'Posture assise prolongée sans gainage ni mobilité'
          ]
        }
      ]
    }
  ]
};

export default psoasIliaque;
