/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const obliqueExterne = {
  sections: [
    {
      id: 'presentation',
      title: 'Introduction — Côtés du tronc',
      blocks: [
        {
          type: 'p',
          text:
            'Les obliques externes forment la couche superficielle latérale entre côtes et bassin — aspect athlétique du tronc lorsqu’ils sont développés. Origines : faces externes des dernières côtes ; fibres en diagonale (comme les mains dans les poches) vers ligne blanche, pubis et crête iliaque.'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Rotation, inclinaison et anti-rotation',
      blocks: [
        {
          type: 'p',
          text:
            'Rotation du tronc ; les deux côtés ensemble participent à la flexion. Un seul côté : rotation opposée (oblique externe droit quand le tronc tourne à gauche). En vie quotidienne et en sport, rôle majeur : contrôler les rotations — résister aux forces qui cherchent à faire pivoter le corps (boxe, tennis, changement de direction, gymnastique). Puissance = coordination jambes, bassin, abdos, épaules.'
        },
        {
          type: 'p',
          text:
            'Esthétique : densité latérale, transition abdos–dos. « Obliques = taille élargie » : surtout si énormément de flexion latérale lourde en volume ; Pallof, side plank et anti-rotation modèrent l’effet chez la plupart.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Stabilité anti-rotation',
          stars: 5,
          items: ['Pallof press', 'Side plank', 'Farmer carry unilatéral', 'Suitcase carry']
        },
        {
          type: 'exerciseBlock',
          category: 'Dynamique contrôlée',
          stars: 4,
          items: [
            'Relevés de genoux avec rotation contrôlée',
            'Woodchoppers poulie',
            'Russian twist contrôlé (modéré en volume)'
          ]
        }
      ]
    }
  ]
};

export default obliqueExterne;
