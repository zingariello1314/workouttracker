/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const grandDorsal = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Le grand dorsal est le muscle le plus large du dos. En forme de voile triangulaire, il descend du haut du tronc jusqu’à la région lombaire et se dirige vers l’humérus. C’est lui qui donne surtout l’impression de largeur lorsque les bras sont vus de face.'
        },
        {
          type: 'p',
          text:
            'Contrairement au trapèze ou aux rhomboïdes, son rôle moteur principal est la force de tirage : tractions, tirages verticaux, rowing. Il travaille en synergie avec les muscles qui contrôlent l’omoplate.'
        }
      ]
    },
    {
      id: 'anatomie',
      title: 'Anatomie',
      blocks: [
        {
          type: 'h3',
          text: 'Origines'
        },
        {
          type: 'ul',
          items: [
            'Processus spinaux des vertèbres thoraciques et lombaires inférieures',
            'Crête iliaque et fascia thoraco-lombaire',
            'Côtes inférieures (partie costale)',
            'Angle inférieur de l’omoplate (petite portion)'
          ]
        },
        {
          type: 'h3',
          text: 'Insertion'
        },
        {
          type: 'p',
          text:
            'Sillon intertuberculaire (gouttière bicipitale) de l’humérus — les fibres tournent sur elles-mêmes avant insertion, d’où la forme caractéristique « aile de mouette ».'
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
            'Adduction du bras (rapprocher le coude du corps)',
            'Extension de l’épaule (bras vers l’arrière)',
            'Rotation interne de l’humérus',
            'Contribution à l’extension du tronc (avec les érecteurs)'
          ]
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'En pratique',
          text:
            'Les tractions larges développent surtout la largeur ; les rowings horizontaux complètent l’épaisseur avec trapèze moyen et rhomboïdes. Un dos esthétique demande plusieurs angles, pas uniquement du tirage vertical.'
        }
      ]
    },
    {
      id: 'recrutement',
      title: 'Recrutement',
      blocks: [
        {
          type: 'p',
          text:
            'Pour sentir le dorsal : commencer le tirage en déprimant légèrement l’omoplate, garder le coude relativement proche du corps, amplitude complète sans arrondir excessivement le bas du dos sous charge lourde.'
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
          items: ['Tractions pronation', 'Tractions supination', 'Tractions lestées', 'Muscle-up']
        },
        {
          type: 'exerciseBlock',
          category: 'Barre & haltères',
          stars: 5,
          items: ['Rowing barre', 'Rowing haltère', 'Tirage poulie basse', 'Pullover']
        },
        {
          type: 'exerciseBlock',
          category: 'Poulies',
          stars: 5,
          items: ['Tirage vertical prise large', 'Tirage vertical prise serrée', 'Rowing poulie']
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
            'Tirer uniquement avec les biceps sans initier le mouvement par l’omoplate.',
            'Hausser les épaules (trapèze supérieur) au lieu de rapprocher le coude vers la hanche.',
            'Négliger les stabilisateurs : un grand dorsal fort sans rhomboïdes / trapèze inférieur favorise les déséquilibres d’épaule.'
          ]
        }
      ]
    },
    {
      id: 'posture',
      title: 'Rôle postural',
      blocks: [
        {
          type: 'p',
          text:
            'Au-delà de la largeur, le grand dorsal participe à la stabilité du tronc et du complexe épaule en tirage. À compléter avec trapèzes, rhomboïdes et dentelé (famille Haut du dos / Épaules).'
        }
      ]
    },
    {
      id: 'saviez-vous',
      title: 'Le saviez-vous ?',
      blocks: [
        {
          type: 'callout',
          tone: 'tip',
          text:
            'Dans Momentum, un volume élevé de tractions se reflète surtout sur la zone « dos » du Récap ; les rowings complètent l’épaisseur. Équilibre tirages / poussées pour la santé des épaules.'
        }
      ]
    }
  ]
};

export default grandDorsal;
