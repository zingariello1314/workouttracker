/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const avantBrasEnsemble = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'L’avant-bras regroupe de nombreux muscles : flexion/extension du poignet, pronation, supination, préhension. Indispensables en musculation, escalade, gymnastique, street workout et sports de combat.'
        },
        {
          type: 'callout',
          tone: 'tip',
          text: 'Esthétique ★★★★☆ · Fonctionnel ★★★★★ · Tractions ★★★★★ — la prise limite souvent la progression avant le dos.'
        }
      ]
    },
    {
      id: 'anatomie',
      title: 'Organisation',
      blocks: [
        {
          type: 'ul',
          items: [
            'Fléchisseurs du poignet (face interne)',
            'Extenseurs du poignet (face externe)',
            'Pronateurs et supinateurs',
            'Muscles de la préhension'
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
          category: 'Fléchisseurs',
          stars: 5,
          items: ['Wrist curl', 'Tractions (prise)', 'Dead hang']
        },
        {
          type: 'exerciseBlock',
          category: 'Extenseurs',
          stars: 5,
          items: ['Reverse wrist curl', 'Extensions doigts', 'Équilibre coude']
        },
        {
          type: 'exerciseBlock',
          category: 'Préhension (grip)',
          stars: 5,
          items: ['Farmer walk', 'Dead hang / lesté', 'Plate pinch', 'Crushing / supporting grip']
        }
      ]
    },
    {
      id: 'brachio-radial',
      title: 'Brachio-radial',
      blocks: [
        {
          type: 'p',
          text: 'Lien bras–avant-bras — curl marteau, flexion coude en prise neutre. Voir fiche Brachio-radial (famille Bras).'
        }
      ]
    },
    {
      id: 'programme',
      title: 'Programme Momentum (2×/sem.)',
      blocks: [
        {
          type: 'ul',
          items: ['Dead hang : 3 séries', 'Farmer walk : 4 séries', 'Wrist curl / reverse : 3×15', 'Extensions doigts : 3×20']
        }
      ]
    },
    {
      id: 'saviez-vous',
      title: 'Vision Momentum',
      blocks: [
        {
          type: 'callout',
          tone: 'tip',
          text:
            'Un bras « complet » équilibre biceps, brachial, brachio-radial, triceps et avant-bras — la prise solidifie tout le haut du corps en tirage.'
        }
      ]
    }
  ]
};

export default avantBrasEnsemble;
