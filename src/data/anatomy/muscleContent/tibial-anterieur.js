/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const tibialAnterieur = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text: 'Face avant tibia — dorsiflexion (pointe vers soi). Course, réception sauts, équilibre avec mollets.'
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
          items: ['Tibialis raise', 'Marche sur talons', 'Appui unipodal']
        }
      ]
    }
  ]
};

export default tibialAnterieur;
