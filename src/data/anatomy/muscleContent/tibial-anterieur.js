/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const tibialAnterieur = {
  sections: [
    {
      id: 'presentation',
      title: 'Introduction — Face avant de la jambe',
      blocks: [
        {
          type: 'p',
          text:
            'Le tibial antérieur occupe l’avant du tibia. C’est le principal dorsiflexeur : ramener le pied vers le tibia (orteils vers le haut). En marche, il contrôle la descente du pied après contact talon.'
        },
        {
          type: 'p',
          text:
            'Avec les mollets, il équilibre la cheville : mollets poussent, tibial antérieur freine et stabilise. Déséquilibre avant/arrière peut influencer course, stabilité de cheville et tolérance aux impacts. Le pied (petits muscles) complète stabilité et adaptation au terrain — chaîne pied → cheville → genou → hanche.'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Pourquoi ne pas l’oublier',
      blocks: [
        {
          type: 'p',
          text:
            'Un pied qui s’affaisse excessivement vers l’intérieur peut influencer le genou ; toutes les douleurs ne viennent pas du pied, mais une jambe « complète » inclut le contrôle dorsiflexeur et l’appui, pas seulement gastrocnémien et quadriceps.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Renforcement',
          stars: 5,
          items: ['Tibialis raise', 'Marche sur talons', 'Appui unipodal contrôlé', 'Flexion dorsale résistée']
        }
      ]
    },
    {
      id: 'momentum',
      title: 'Application Momentum',
      blocks: [
        {
          type: 'p',
          text:
            'Réceptions de saut, course, équilibre en figures : complément naturel aux mollets (famille Mollets). Charges modérées, amplitude complète, fréquence possiblement élevée.'
        }
      ]
    }
  ]
};

export default tibialAnterieur;
