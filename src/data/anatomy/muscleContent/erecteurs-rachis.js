/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const erecteursRachis = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation approfondie',
      blocks: [
        {
          type: 'p',
          text:
            'Les érecteurs du rachis (muscles spinaux) forment la colonne musculaire principale de la chaîne postérieure, du bassin à la région cervicale — leur portion lombaire stabilise le bas du dos.'
        },
        {
          type: 'p',
          text:
            'Trois faisceaux : ilio-costal (latéral, extension/inclinaison), longissimus (central, volumineux), épineux (près colonne, posture). Origines larges : sacrum, crête iliaque, vertèbres lombaires ; insertions vers côtes et vertèbres supérieures.'
        },
        {
          type: 'p',
          text:
            'Extension de la colonne, maintien postural permanent (marche, debout, assis), contrôle de la flexion — freiner la descente en hip hinge. En musculation : isométrie sous squat, soulevé, rowing.'
        },
        {
          type: 'p',
          text:
            'Esthétique secondaire mais chaîne postérieure dense chez haltérophiles et gymnastes. Répondent aux tensions prolongées ; progression graduelle pour la colonne.'
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
          type: 'h3',
          text: 'Extensions lombaires et superman'
        },
        {
          type: 'p',
          text:
            'Au sol ou sur banc : extension contrôlée, pas d’amplitude excessive. Superman : contraction dos, pas monter au maximum.'
        },
        {
          type: 'h3',
          text: 'Soulevé de terre et good morning'
        },
        {
          type: 'p',
          text:
            'Soulevé : chaîne postérieure complète. Good morning chargé : technique exigeante, hip hinge.'
        },
        {
          type: 'exerciseBlock',
          category: 'Poids du corps',
          stars: 5,
          items: ['Extensions lombaires au sol', 'Superman', 'Hip hinge', 'Bird dog']
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
