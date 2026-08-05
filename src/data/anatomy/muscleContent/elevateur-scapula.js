/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const elevateurScapula = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'C1–C4 → angle supérieur omoplate. Élévation scapula, lien cou/trapèze supérieur. Souvent tendu avec posture bureau + shrugs excessifs.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Renforcement / posture',
          stars: 4,
          items: ['Shrugs contrôlés', 'Farmer walk', 'Trapèze inférieur + Y-raise (équilibre)']
        }
      ]
    },
    {
      id: 'posture',
      title: 'Lien stabilisateurs',
      blocks: [
        {
          type: 'p',
          text:
            'Voir aussi : trapèze (famille Dos), coiffe des rotateurs, dentelé antérieur (Haut du dos) pour la mécanique scapulaire complète.'
        }
      ]
    }
  ]
};

export default elevateurScapula;
