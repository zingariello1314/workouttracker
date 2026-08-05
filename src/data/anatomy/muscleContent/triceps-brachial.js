/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const tricepsBrachial = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation générale',
      blocks: [
        {
          type: 'p',
          text:
            'Le triceps brachial représente environ 60 à 70 % de la masse du bras — le véritable constructeur du volume. Trois chefs (long, latéral, médial), un tendon commun sur l’olécrâne : extension du coude, pilier des pompes, dips, développés, HSPU, planche et muscle-up.'
        },
        {
          type: 'p',
          text:
            'Ce ne sont pas trois muscles séparés : leurs origines diffèrent, leurs fibres convergent. Le chef long seul traverse l’épaule — sa longueur varie selon la position du bras (overhead vs pushdown).'
        }
      ]
    },
    {
      id: 'portions',
      title: 'Les trois chefs',
      blocks: [
        {
          type: 'p',
          text:
            'Impossible d’isoler totalement un chef ; la position de l’épaule et du coude modifie surtout la contribution relative du chef long.'
        },
        {
          type: 'h3',
          text: 'Chef long — Traverse l’épaule'
        },
        {
          type: 'p',
          text:
            'Origine tubercule infraglénoïdal ; extension coude, adduction/extension épaule. Volume arrière du bras ; souvent sous-stimulé si seuls dips/pompes bras le long du corps — extensions overhead intéressantes en position étirée.'
        },
        {
          type: 'ul',
          items: ['Extension au-dessus de la tête', 'Dips', 'Pompes diamant']
        },
        {
          type: 'h3',
          text: 'Chef latéral — Fer à cheval'
        },
        {
          type: 'p',
          text:
            'Face externe humérus ; largeur visuelle du triceps. Pushdown, développé serré, pompes serrées.'
        },
        {
          type: 'ul',
          items: ['Pushdown corde', 'Développé serré', 'Pompes serrées']
        },
        {
          type: 'h3',
          text: 'Chef médial — Profondeur et endurance'
        },
        {
          type: 'p',
          text:
            'Sous les autres portions ; extensions répétées, pompes volume, contrôle fin.'
        },
        {
          type: 'ul',
          items: ['Extensions poulie', 'Volume pompes']
        }
      ]
    },
    {
      id: 'recrutement',
      title: 'Recrutement efficace',
      blocks: [
        {
          type: 'p',
          text:
            'Amplitude complète (flexion puis extension), surcharge progressive, plusieurs angles — chef long = position épaule (overhead vs coude au corps). Extension overhead vs pushdown : complémentaires, pas rivaux.'
        },
        {
          type: 'p',
          text:
            'Développé couché : triceps verrouille en fin de mouvement. Dips : amplitude + charge relative. Pompes : excellentes chez débutant, variantes lest/tempo pour avancés.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'h3',
          text: 'Poids du corps'
        },
        {
          type: 'p',
          text: 'Dips, pompes diamant/serrées, HSPU — progression dips lestés et variantes.'
        },
        {
          type: 'h3',
          text: 'Salle'
        },
        {
          type: 'p',
          text: 'Développé serré, extension overhead, pushdown, barre au front (charge modérée, coude).'
        },
        {
          type: 'exerciseBlock',
          category: 'Poids du corps',
          stars: 5,
          items: ['Dips', 'Pompes diamant', 'Handstand push-up', 'Pompes serrées']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: ['Développé couché serré', 'Extension overhead', 'Pushdown corde', 'Barre au front']
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
            'Croire que seuls développés/dips suffisent sans travail overhead (chef long). Demi-répétitions. Extensions trop lourdes → douleur coude.'
        }
      ]
    },
    {
      id: 'blessures',
      title: 'Blessures',
      blocks: [
        {
          type: 'p',
          text:
            'Tendinopathie triceps olécrâne ; douleurs coude avec volume poussée excessif, progression rapide dips/pompes/extensions — adapter amplitude et récupération.'
        }
      ]
    },
    {
      id: 'saviez-vous',
      title: 'Le saviez-vous ?',
      blocks: [
        {
          type: 'h3',
          text: 'Facteur limitant en poussée avancée'
        },
        {
          type: 'p',
          text: 'Verrouillage final dips/HSPU/développé serré = triceps.'
        },
        {
          type: 'h3',
          text: 'Gymnastes'
        },
        {
          type: 'p',
          text: 'Volume énorme d’extensions au coude sans curls isolés.'
        },
        {
          type: 'h3',
          text: 'Bras massifs, biceps moyens'
        },
        {
          type: 'p',
          text: 'Triceps + brachial + avant-bras > biceps visuellement.'
        }
      ]
    },
    {
      id: 'faq',
      title: 'Questions fréquentes',
      blocks: [
        {
          type: 'h3',
          text: 'Plus de triceps que biceps ?'
        },
        {
          type: 'p',
          text: 'Souvent oui pour l’esthétique ; équilibre reste important pour le coude.'
        },
        {
          type: 'h3',
          text: 'Pompes suffisent ?'
        },
        {
          type: 'p',
          text: 'Débutant oui ; avancé : variantes difficiles, lest, overhead.'
        },
        {
          type: 'h3',
          text: 'Dips dangereux ?'
        },
        {
          type: 'p',
          text: 'Non si amplitude, technique et progression adaptées ; dip vertical = plus triceps.'
        },
        {
          type: 'h3',
          text: 'Volume hebdo ?'
        },
        {
          type: 'p',
          text: '10–20 séries directes selon volume indirect poussée — individualiser.'
        }
      ]
    },
    {
      id: 'momentum',
      title: 'Analyse Momentum',
      blocks: [
        {
          type: 'p',
          text:
            'Triceps = esthétique (largeur bras) + performance (pompes, dips, HSPU). Approche : lourd + overhead (chef long) + poids du corps pour coordination.'
        }
      ]
    }
  ]
};

export default tricepsBrachial;
