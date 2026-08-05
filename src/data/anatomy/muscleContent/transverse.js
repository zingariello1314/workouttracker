/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const transverse = {
  sections: [
    {
      id: 'presentation',
      title: 'Introduction — La ceinture naturelle',
      blocks: [
        {
          type: 'p',
          text:
            'Le transverse de l’abdomen est probablement le muscle abdominal le plus important pour la stabilité : invisible, fibres horizontales en véritable ceinture autour du ventre. Origines : côtes inférieures, fascias lombaires, crête iliaque → ligne blanche.'
        },
        {
          type: 'p',
          text:
            'Rôle prioritaire : compression abdominale, stabilisation du tronc, gestion de la pression interne — pas un grand mouvement visible. Avant un effort lourd, le corps augmente la pression dans l’abdomen ; le transverse y participe fortement (avec diaphragme et plancher pelvien).'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Respiration et rigidité',
      blocks: [
        {
          type: 'p',
          text:
            'Diaphragme, transverse et plancher pelvien fonctionnent ensemble. Effort intense : pression interne qui rigidifie le tronc (principe de la manœuvre de Valsalva en force maximale très courte). Course, endurance, technique et répétitions : respiration adaptée, pas blocage permanent.'
        },
        {
          type: 'p',
          text:
            'Mal développé avec des crunchs seuls — combiner gainage, anti-extension, anti-rotation, hollow body, dead bug.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Contrôle & stabilité',
          stars: 5,
          items: ['Vacuum abdominal', 'Dead bug', 'Hollow body hold', 'Planche (RKC, qualité > durée)', 'Ab wheel']
        },
        {
          type: 'exerciseBlock',
          category: 'Anti-rotation',
          stars: 5,
          items: ['Pallof press', 'Farmer / suitcase carry']
        }
      ]
    },
    {
      id: 'saviez-vous',
      title: 'Types de gainage',
      blocks: [
        {
          type: 'p',
          text:
            'Anti-extension : planche, hollow, dead bug, roue abdominale. Anti-rotation : Pallof, carry unilatéral. Anti-inclinaison : side plank. Un bon gainage intense et court peut surpasser une planche relâchée de plusieurs minutes.'
        }
      ]
    }
  ]
};

export default transverse;
