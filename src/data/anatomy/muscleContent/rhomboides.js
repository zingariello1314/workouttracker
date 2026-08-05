/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const rhomboides = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation générale',
      blocks: [
        {
          type: 'p',
          text:
            'Les rhomboïdes (petit et grand) sont situés entre la colonne vertébrale et les omoplates, sous le trapèze moyen. Leur forme en losange les rend peu visibles, mais ils forment un lien essentiel entre colonne et scapula — le « pilotage » de l’omoplate par rapport au thorax.'
        },
        {
          type: 'p',
          text:
            'La scapula « flotte » sur la cage thoracique : les rhomboïdes empêchent l’omoplate de partir excessivement vers l’avant et influencent mobilité de l’épaule, force en poussée et qualité des tirages.'
        }
      ]
    },
    {
      id: 'portions',
      title: 'Petit et grand rhomboïde',
      blocks: [
        {
          type: 'h3',
          text: 'Petit rhomboïde'
        },
        {
          type: 'p',
          text:
            'Au-dessus du grand rhomboïde, entre dernières vertèbres cervicales et bord médial de la scapula. Origine sur ligament nuchal et vertèbres cervicales ; insertion sur le bord médial de la scapula.'
        },
        {
          type: 'h3',
          text: 'Grand rhomboïde'
        },
        {
          type: 'p',
          text:
            'Plus volumineux, sous le petit rhomboïde — masse importante entre les omoplates. Origine sur les premières vertèbres thoraciques ; même insertion sur le bord médial de la scapula.'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Fonctions',
      blocks: [
        {
          type: 'h3',
          text: 'Rétraction scapulaire'
        },
        {
          type: 'p',
          text:
            'Rôle principal : rapprocher les omoplates vers la colonne (« serrer les omoplates »). Central en rowings, tirages horizontaux et travail postural.'
        },
        {
          type: 'h3',
          text: 'Rotation inférieure et stabilisation'
        },
        {
          type: 'p',
          text:
            'Participent à orienter l’omoplate vers le bas et à la maintenir contre la cage thoracique — en équilibre avec dentelé et trapèzes, sans blocage permanent.'
        },
        {
          type: 'p',
          text:
            'Esthétiquement, ils remplissent la zone centrale du dos : sans eux, un dos large peut paraître « creux » entre les omoplates.'
        }
      ]
    },
    {
      id: 'recrutement',
      title: 'Comment les développer',
      blocks: [
        {
          type: 'p',
          text:
            'Laisser l’omoplate avancer en départ, la ramener progressivement, courte contraction en fin de mouvement — le rowing n’est pas une flexion de coude déguisée.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'h3',
          text: 'Tractions scapulaires'
        },
        {
          type: 'p',
          text:
            'Mouvement court : contrôler les omoplates sans monter avec les bras — excellent pour la connexion cerveau–dos.'
        },
        {
          type: 'h3',
          text: 'Rowing et face pull'
        },
        {
          type: 'p',
          text:
            'Rowing horizontal fondamental ; tractions australiennes avec pause ; reverse fly ; face pull (rhomboïdes, trapèze moyen/inférieur, coiffe).'
        },
        {
          type: 'exerciseBlock',
          category: 'Poids du corps',
          stars: 5,
          items: ['Tractions scapulaires', 'Tractions australiennes pause', 'Row inversé']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: ['Rowing horizontal', 'Reverse fly', 'Face pull']
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Erreurs et tensions',
      blocks: [
        {
          type: 'p',
          text:
            'Tirer uniquement avec les bras : les biceps prennent le relais, le dos reçoit moins de stimulus.'
        },
        {
          type: 'p',
          text:
            'Bloquer constamment les omoplates : une scapula saine reste mobile — la force vient du contrôle, pas du blocage.'
        },
        {
          type: 'p',
          text:
            'Tensions fréquentes si posture bureau, épaules en avant, peu de tirage ou mobilité thoracique limitée ; fatigue si trop de poussée sans tirage équilibré.'
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
            'Les rhomboïdes comptent souvent plus pour la performance que pour le miroir : une meilleure stabilité scapulaire améliore développés, tractions et confort d’épaule.'
        }
      ]
    }
  ]
};

export default rhomboides;
