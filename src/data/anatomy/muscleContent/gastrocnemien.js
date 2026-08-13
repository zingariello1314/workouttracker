/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const gastrocnemien = {
  sections: [
    {
      id: 'presentation',
      title: 'Introduction — Mollet visible et propulsion',
      blocks: [
        {
          type: 'p',
          text:
            'Le gastrocnémien forme le mollet superficiel (chefs médial et latéral), la forme en « diamant » lorsqu’il est développé. Interface entre pied, cheville, genou et reste du corps : force, absorption d’impact, restitution élastique en sprint et sauts.'
        },
        {
          type: 'p',
          text:
            'Biarticulaire (genou + cheville), origine au fémur, insertion via le tendon d’Achille sur le calcanéum. Flexion plantaire (pointe vers le bas), légère flexion du genou. Genou tendu : le gastrocnémien est le chef dominant du triceps sural.'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Sprint et tendon d’Achille',
      blocks: [
        {
          type: 'p',
          text:
            'En accélération, le mollet agit comme un ressort : le tendon d’Achille stocke et restitue l’énergie — puissance avec une meilleure économie mécanique. Les meilleurs coureurs combinent mollets puissants et tendons efficaces.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Poids du corps',
          stars: 5,
          items: [
            'Élévations mollets debout sur marche (amplitude)',
            'Élévations mollets une jambe',
            'Élévations mollets pointes vers l’extérieur (accent chef médial)',
            'Élévations mollets pointes vers l’intérieur (variation, pas isolation du chef latéral)',
            'Sauts / pliométrie (puissance élastique)'
          ]
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: ['Standing calf raise', 'Presse à mollets (volume)']
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Erreurs fréquentes',
      blocks: [
        {
          type: 'p',
          text:
            'Rebonds sans pause en bas et en haut, amplitude réduite. Uniquement debout sans mollets assis (soléaire négligé). Volume faible : les mollets supportent des milliers de pas par jour — stimulus léger adapte peu. Génétique (insertions, longueur tendon) influence la forme, pas seulement la force.'
        }
      ]
    },
    {
      id: 'blessures',
      title: 'Blessures fréquentes',
      blocks: [
        {
          type: 'h3',
          text: 'Claquage du gastrocnémien'
        },
        {
          type: 'p',
          text:
            'Accélération brutale, saut, changement de direction — force maximale en très peu de temps.'
        },
        {
          type: 'h3',
          text: 'Tendinopathie d’Achille'
        },
        {
          type: 'p',
          text:
            'Charge montée trop vite (course, sauts), fatigue, manque de progression.'
        }
      ]
    }
  ]
};

export default gastrocnemien;
