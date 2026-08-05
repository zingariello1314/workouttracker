/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const obliqueInterne = {
  sections: [
    {
      id: 'presentation',
      title: 'Introduction — Couche profonde complémentaire',
      blocks: [
        {
          type: 'p',
          text:
            'Les obliques internes se situent sous les obliques externes, fibres orientées différemment — grande complémentarité entre les deux couches. Un grand droit développé sans musculature profonde = tronc incomplet ; la vraie force du centre = stabilité multidirectionnelle.'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Fonctions',
      blocks: [
        {
          type: 'p',
          text:
            'Rotation du tronc, flexion latérale, compression abdominale, stabilisation. Travail étroit avec le transverse pour une ceinture autour du tronc — surtout sollicités en anti-rotation et contrôle du bassin plutôt qu’en twists isolés à répétition.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Anti-rotation & gainage',
          stars: 5,
          items: ['Pallof press', 'Side plank (statique et dynamique)', 'Farmer walk unilatéral', 'Dead bug']
        }
      ]
    },
    {
      id: 'recrutement',
      title: 'Développement',
      blocks: [
        {
          type: 'p',
          text:
            'Peu besoin d’isolation esthétique : suspension, carries, planches latérales et mouvements unilatéraux renforcent déjà obliques internes et transverse. Objectif : tronc solide pour sport et street workout.'
        }
      ]
    }
  ]
};

export default obliqueInterne;
