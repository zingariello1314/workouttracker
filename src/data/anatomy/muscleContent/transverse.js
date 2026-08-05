/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const transverse = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Couche la plus profonde, fibres horizontales en ceinture. Rôle prioritaire : stabiliser, pas produire un grand mouvement visible. Anticipation posturale avant l’effort — base du « gainer ».'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Pression intra-abdominale',
      blocks: [
        {
          type: 'p',
          text:
            'Rigidifie le tronc, améliore le transfert de force et protège les structures passives. Mal développé avec des crunchs seuls : préférer gainage, anti-extension et anti-rotation.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Contrôle',
          stars: 5,
          items: ['Vacuum abdominal', 'Dead bug', 'Hollow body hold', 'Planche']
        }
      ]
    },
    {
      id: 'saviez-vous',
      title: 'Types de gainage',
      blocks: [
        {
          type: 'ul',
          items: [
            'Anti-extension : planche, hollow, dead bug',
            'Anti-rotation : pallof, farmer unilatéral',
            'Anti-inclinaison : side plank, carries'
          ]
        }
      ]
    }
  ]
};

export default transverse;
