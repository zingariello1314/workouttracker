/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const sternoCleidoMastoidien = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'SCM — sternum et clavicule → mastoïde. Bandes visibles sur les côtés du cou. Flexion cervicale (bilatéral), rotation et inclinaison (unilatéral). Transition esthétique mâchoire–cou–épaules.'
        },
        {
          type: 'callout',
          tone: 'tip',
          text: 'Voir aussi Trapèzes (Haut du dos) pour la zone cou–trapèze supérieur ; muscles profonds (chin tucks) pour la posture.'
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
          items: ['Chin tucks', 'Isométriques cervicales (4 directions)', 'Flexion cervicale légère / lestée progressive']
        },
        {
          type: 'exerciseBlock',
          category: 'Indirect',
          stars: 4,
          items: ['Farmer walk', 'Shrugs (trapèze supérieur lié)']
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Précautions',
      blocks: [
        {
          type: 'callout',
          tone: 'warn',
          text: 'Zone sensible — progression lente, pas d’amplitude forcée ni charges brusques. SCM fort sans profonds = posture fragile.'
        }
      ]
    }
  ]
};

export default sternoCleidoMastoidien;
