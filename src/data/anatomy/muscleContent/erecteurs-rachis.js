/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const erecteursRachis = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Les érecteurs du rachis forment deux longues colonnes musculaires de chaque côté de la colonne, du bassin jusqu’à la région cervicale. Ils permettent de rester debout et interviennent dès que le tronc doit être maintenu ou redressé.'
        },
        {
          type: 'p',
          text:
            'En musculation, leur travail est souvent surtout isométrique : lors d’un squat, d’un soulevé de terre ou d’un rowing lourd, ils empêchent la colonne de s’arrondir sous la charge.'
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Profil Momentum',
          text:
            'Fonctionnel ★★★★★ · Sportif ★★★★★ · Esthétique ★★★☆☆ · Prévention blessures ★★★★★ · Fréquence indicative : 2–3 stimulations / semaine selon le volume global.'
        }
      ]
    },
    {
      id: 'anatomie',
      title: 'Anatomie',
      blocks: [
        {
          type: 'p',
          text: 'Trois muscles principaux : ilio-costal, longissimus et épineux — organisation parallèle le long de la colonne.'
        },
        {
          type: 'ul',
          items: [
            'Origines : bassin, sacrum, vertèbres, côtes',
            'Insertions : vertèbres supérieures, côtes, structures du crâne',
            'Architecture en « armature » autour du rachis'
          ]
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Fonctions',
      blocks: [
        {
          type: 'ul',
          items: [
            'Extension de la colonne (redresser le tronc)',
            'Stabilisation sous charge (rôle prioritaire en force)',
            'Inclinaisons latérales lorsque les deux côtés ne travaillent pas symétriquement'
          ]
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Développement',
          text:
            'Répondent bien aux tensions prolongées. La congestion n’est pas toujours un bon indicateur ; la progression doit rester graduelle pour la colonne.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Poids du corps — apprentissage',
          stars: 5,
          items: ['Superman', 'Extensions lombaires au sol', 'Bird dog (stabilité)', 'Hip hinge au poids du corps']
        },
        {
          type: 'exerciseBlock',
          category: 'Poids du corps — limites',
          stars: 2,
          items: ['Superman seul (surcharge limitée à long terme)']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle — polyarticulaires',
          stars: 5,
          items: ['Soulevé de terre', 'Squat', 'Good morning (avancé)']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle — ciblage lombaires',
          stars: 5,
          items: ['Extensions lombaires sur banc', 'Hyperextensions contrôlées']
        },
        {
          type: 'exerciseBlock',
          category: 'Fonctionnel',
          stars: 5,
          items: ['Farmer walk', 'Farmer walk unilatéral', 'Marche lestée']
        }
      ]
    },
    {
      id: 'momentum',
      title: 'Street workout & tronc',
      blocks: [
        {
          type: 'ul',
          items: [
            'Front lever / handstand : colonne alignée sans hypercambrure',
            'L-sit : érecteurs + abdominaux + fléchisseurs de hanche',
            'Tractions strictes : limiter balancement et extension excessive'
          ]
        },
        {
          type: 'callout',
          tone: 'tip',
          text: 'Ceinture abdominale complète : abdominaux (avant) + érecteurs (arrière). Voir fiche Carré des lombes et Transverse (famille Abdominaux).'
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Erreurs fréquentes',
      blocks: [
        {
          type: 'ul',
          items: [
            'Hyperextension excessive en fin d’extensions lombaires — viser la contraction, pas forcer la colonne.',
            'Progression trop rapide sur le soulevé de terre sans technique ni mobilité hanche.',
            'Renforcer les lombaires sans abdominaux, fessiers et ischio-jambiers (déséquilibre du core).'
          ]
        }
      ]
    },
    {
      id: 'blessures',
      title: 'Blessures & prévention',
      blocks: [
        {
          type: 'ul',
          items: [
            'Lombalgie mécanique (surcharge, manque de contrôle, progression rapide)',
            'Fatigue des érecteurs qui compensent des fessiers ou une mauvaise mobilité de hanche',
            'Irritation par perte de neutralité sous charge'
          ]
        },
        {
          type: 'callout',
          tone: 'tip',
          text:
            'Mobilité hanches et extension thoracique, contrôle du bassin : souvent aussi important que « plus de lombaires ».'
        }
      ]
    },
    {
      id: 'saviez-vous',
      title: 'Vision Momentum',
      blocks: [
        {
          type: 'callout',
          tone: 'tip',
          text:
            'Le bas du dos est une plateforme de transmission de force, pas seulement un muscle « à sculpter ». Largeur (dorsaux) + profondeur (multifides, érecteurs) = utiliser la force en sécurité.'
        }
      ]
    }
  ]
};

export default erecteursRachis;
