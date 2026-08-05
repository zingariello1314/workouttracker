/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const grandFessier = {
  sections: [
    {
      id: 'presentation',
      title: 'Introduction — Le muscle le plus volumineux du corps',
      blocks: [
        {
          type: 'p',
          text:
            'Le grand fessier est le plus gros muscle humain — lié à la bipédie, à la stabilité du bassin debout et à l’extension puissante de hanche. Il recouvre l’arrière du bassin (ilium, sacrum, coccyx) et s’insère via le tractus ilio-tibial et la tubérosité glutéale du fémur.'
        },
        {
          type: 'p',
          text:
            'Extension de hanche (marche, sprint, saut, hip thrust), rotation externe, stabilisation du bassin et contribution à la stabilité du genou. Puissance au sol en accélération : les premières foulées de sprint dépendent fortement des fessiers.'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Sport, posture et chaîne postérieure',
      blocks: [
        {
          type: 'p',
          text:
            'Un grand fessier puissant améliore course, sauts, force en jambes et protection articulaire. Vie sédentative : fessiers souvent sous-utilisés — manque d’activation de la chaîne postérieure peut modifier les compensations (lombaires, quadriceps dominants).'
        },
        {
          type: 'p',
          text:
            'Complément indispensable aux ischio-jambiers (famille Cuisses) et aux mollets pour une chaîne inférieure complète.'
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
            'Hip thrust au sol',
            'Ponts de hanche / une jambe',
            'Fentes bulgares',
            'Extensions de hanche',
            'Sprints et sauts (puissance)'
          ]
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: [
            'Hip thrust chargé',
            'Squat profond (selon morphologie)',
            'Soulevé de terre / RDL',
            'Fentes marchées',
            'Pull-through poulie'
          ]
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
            'Croire que le hip thrust suffit à tout : le fessier travaille sous plusieurs angles. Squat uniquement sans extension directe (hip thrust, pull-through) ou amplitude courte (peu de flexion hanche). Extension par cambrure lombaire au lieu du bassin.'
        }
      ]
    },
    {
      id: 'momentum',
      title: 'Application Momentum',
      blocks: [
        {
          type: 'p',
          text:
            'Muscle-up explosif, front lever (contrôle du bassin sans cambrure excessive), transfert avec ischio-jambiers et mollets. Moyen et petit fessier (autres fiches) complètent abduction et stabilité unipodale.'
        }
      ]
    },
    {
      id: 'faq',
      title: 'Questions fréquentes',
      blocks: [
        {
          type: 'h3',
          text: 'Développer les fessiers sans squat ?'
        },
        {
          type: 'p',
          text:
            'Oui : hip thrust, fentes, extensions de hanche, sprints — la tension mécanique compte plus qu’un exercice unique.'
        },
        {
          type: 'h3',
          text: 'Quadriceps progressent, pas les fessiers ?'
        },
        {
          type: 'p',
          text:
            'Souvent technique favorisant flexion du genou sans extension de hanche — ajuster amplitude, inclinaison et exercices d’extension ciblée.'
        }
      ]
    }
  ]
};

export default grandFessier;
