/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const soleaire = {
  sections: [
    {
      id: 'presentation',
      title: 'Introduction — Masse profonde du mollet',
      blocks: [
        {
          type: 'p',
          text:
            'Le soléaire est sous le gastrocnémien, souvent invisible mais parfois majoritaire en volume du triceps sural. Origines sur tibia et fibula, tendon d’Achille commun — flexion plantaire. Une seule articulation (cheville) : genou fléchi, le gastrocnémien est raccourci et perd de l’efficacité ; le soléaire prend le relais.'
        },
        {
          type: 'p',
          text:
            'Endurance debout, marche longue, fibres résistantes à la fatigue. Mollet « complet » = debout (gastroc) + assis (soléaire).'
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
          stars: 4,
          items: ['Mollets assis sur banc (charge sur genoux)', 'Tempo lent debout + assis en superset']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: ['Seated calf raise', 'Presse à mollets genoux fléchis']
        }
      ]
    },
    {
      id: 'saviez-vous',
      title: 'Le saviez-vous ?',
      blocks: [
        {
          type: 'p',
          text:
            'Les mollets participent au retour veineux (« deuxième cœur »). Force et volume ne sont pas toujours corrélés : fibres, nerveux, tendons comptent pour la performance.'
        }
      ]
    },
    {
      id: 'faq',
      title: 'Questions fréquentes — mollets',
      blocks: [
        {
          type: 'h3',
          text: 'Mollets qui ne grossissent pas ?'
        },
        {
          type: 'p',
          text:
            'Volume insuffisant, mauvaise amplitude, charges légères sans progression. Cent répétitions sans surcharge progressive perdent souvent face à un plan structuré.'
        },
        {
          type: 'h3',
          text: 'Tous les jours ?'
        },
        {
          type: 'p',
          text:
            'Récupération rapide possible, mais surcharge progressive et exécution restent la priorité.'
        },
        {
          type: 'h3',
          text: 'Changer la forme des mollets ?'
        },
        {
          type: 'p',
          text:
            'On peut gagner volume, densité et force ; les insertions et la longueur du tendon d’Achille restent largement génétiques.'
        }
      ]
    },
    {
      id: 'momentum',
      title: 'Vision Momentum',
      blocks: [
        {
          type: 'p',
          text:
            'Course, sauts, équilibre, prévention cheville : compléter avec la famille Tibia (tibial antérieur) pour l’équilibre avant/arrière de jambe. Voir aussi Gastrocnémien pour le duo debout/assis.'
        }
      ]
    }
  ]
};

export default soleaire;
