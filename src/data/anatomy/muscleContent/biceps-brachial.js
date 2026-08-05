/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const bicepsBrachial = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Le biceps brachial est le muscle le plus connu de la face antérieure du bras. Deux chefs (long et court) convergent vers un tendon commun inséré sur le radius — d’où son rôle majeur en flexion du coude et supination.'
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Profil Momentum',
          text:
            'Esthétique ★★★★★ · Fonctionnel ★★★★☆ · Hypertrophie ★★★★★ · Tirages ★★★★★ — le volume total du bras dépend surtout du triceps.'
        }
      ]
    },
    {
      id: 'portions',
      title: 'Chef long et chef court',
      blocks: [
        {
          type: 'h3',
          text: 'Chef long'
        },
        {
          type: 'p',
          text:
            'Partie externe, origine sur le tubercule supraglénoïdal (tendon traverse l’épaule). Souvent associé au « pic » du biceps ; mieux étiré en curl incliné.'
        },
        {
          type: 'h3',
          text: 'Chef court'
        },
        {
          type: 'p',
          text:
            'Partie interne, origine sur le processus coracoïde. Contribue à l’épaisseur du bras. Flexion et supination comme le chef long.'
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
            'Flexion du coude',
            'Supination de l’avant-bras (paume vers le haut)',
            'Aide aux tractions (secondaire vs dos)',
            'Stabilisation de l’épaule (chef long)'
          ]
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
            'Combiner charges lourdes progressives, positions étirées (curl incliné) et exécution stricte. L’élan réduit la tension réelle — petit muscle, grande sensibilité à la technique.'
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
          items: ['Tractions supination (chin-ups)', 'Curl barre basse / anneaux']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle — fondamentaux',
          stars: 5,
          items: ['Curl incliné haltères', 'Curl barre', 'Curl pupitre']
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Erreurs & morphologie',
      blocks: [
        {
          type: 'ul',
          items: [
            'Balancer le corps pour soulever plus lourd',
            'Négliger les positions étirées',
            'Uniquement des curls sans triceps ni brachial',
            'Rendu visuel : longueur du tendon distal et du ventre musculaire (génétique)'
          ]
        }
      ]
    }
  ]
};

export default bicepsBrachial;
