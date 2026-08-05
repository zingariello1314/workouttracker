/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const adducteursEnsemble = {
  sections: [
    {
      id: 'presentation',
      title: 'Introduction — Bien plus que « rapprocher les jambes »',
      blocks: [
        {
          type: 'p',
          text:
            'Les adducteurs (grand, long et court adducteur, gracile, pectiné) occupent la face interne de la cuisse. Adduction de hanche, mais aussi flexion/extension selon les portions, rotation du fémur, stabilité du bassin, changements de direction, course et sports latéraux.'
        },
        {
          type: 'p',
          text:
            'Une chaîne d’adducteurs solide rend l’athlète plus stable, plus capable de produire de la force dans plusieurs directions et plus résistant aux contraintes sportives.'
        }
      ]
    },
    {
      id: 'portions',
      title: 'Grand adducteur et gracile',
      blocks: [
        {
          type: 'h3',
          text: 'Grand adducteur — le géant caché'
        },
        {
          type: 'p',
          text:
            'Le plus volumineux du groupe. Partie supérieure plutôt flexion de hanche ; portion inférieure (ischio-condylienne) participe fortement à l’extension — active en squat profond à la remontée. Beaucoup de force de hanche ne vient pas que des fessiers.'
        },
        {
          type: 'h3',
          text: 'Gracile'
        },
        {
          type: 'p',
          text:
            'Muscle long et fin, bi-articulaire (hanche + genou) : adduction, flexion du genou, rotation interne du tibia — contrôle fin plutôt que grosse production de force.'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Squat, course et muscles profonds de hanche',
      blocks: [
        {
          type: 'p',
          text:
            'Squat profond : adducteurs, surtout grand adducteur, contribuent à l’extension de hanche en position basse. Football, basket, tennis, combat : freinage, stabilisation latérale, absorption — blessures fréquentes si force en position étirée + vitesse (frappe, changement de direction).'
        },
        {
          type: 'p',
          text:
            'Muscles profonds (piriforme, obturateurs, jumeaux, carré fémoral) centrent la tête du fémur dans l’acétabulum. Le « syndrome du piriforme » est une hypothèse parmi d’autres pour une douleur fesse/jambe — lombaires et autres structures peuvent aussi être en cause.'
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
          items: ['Copenhagen plank', 'Squat large (stance adaptée)', 'Fentes latérales', 'Contrôle latéral au sol']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: ['Adduction machine', 'Squat sumo', 'Soulevé sumo', 'Fentes latérales chargées']
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
            'Les réduire à l’esthétique « intérieur cuisse ». Ne jamais les entraîner directement alors que squats/fentes les sollicitent déjà — utile surtout si beaucoup de changements de direction. Forcer un squat ultra-large au-delà de sa morphologie.'
        }
      ]
    },
    {
      id: 'blessures',
      title: 'Blessures fréquentes',
      blocks: [
        {
          type: 'p',
          text:
            'Élongation ou claquage en effort explosif — reprise progressive. Tendinopathie près du pubis (football, course). Manque de coordination fessiers / adducteurs / profonds / abdominaux peut perturber la mécanique de hanche et du genou.'
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
            'L-sit jambes serrées, front lever / handstand (alignement), human flag (résistance latérale). Cette fiche vise la performance : stabiliser le bassin, protéger le genou, améliorer la puissance et compléter quadriceps et fessiers.'
        }
      ]
    },
    {
      id: 'faq',
      title: 'Questions fréquentes',
      blocks: [
        {
          type: 'h3',
          text: 'Adducteurs = cuisses plus larges ?'
        },
        {
          type: 'p',
          text:
            'Ils ajoutent masse et épaisseur interne plutôt que seulement la largeur externe (vaste latéral).'
        },
        {
          type: 'h3',
          text: 'Déjà travaillés au squat ?'
        },
        {
          type: 'p',
          text:
            'Oui en squat profond, selon technique et morphologie. Renforcement spécifique reste pertinent pour sports latéraux explosifs.'
        },
        {
          type: 'h3',
          text: 'Étirer pour la mobilité ?'
        },
        {
          type: 'p',
          text:
            'Peut aider certains ; contrôler l’amplitude (force + mobilité) prime. Hanche très souple mais instable pose problème.'
        }
      ]
    }
  ]
};

export default adducteursEnsemble;
