/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const ischioJambiers = {
  sections: [
    {
      id: 'presentation',
      title: 'Introduction — Chaîne postérieure de la cuisse',
      blocks: [
        {
          type: 'p',
          text:
            'Les ischio-jambiers (biceps fémoral, semi-tendineux, semi-membraneux) forment l’arrière de la cuisse avec le grand fessier et les érecteurs dans la chaîne postérieure. Ils produisent la force vers l’arrière, stabilisent le bassin et permettent les mouvements explosifs.'
        },
        {
          type: 'p',
          text:
            'La vitesse ne vient pas seulement de lever vite les jambes : surtout d’appliquer une grande force au sol rapidement. Sprinteurs et sportifs explosifs ont des ischio-jambiers très développés et préparés.'
        }
      ]
    },
    {
      id: 'portions',
      title: 'Les trois muscles',
      blocks: [
        {
          type: 'h3',
          text: 'Biceps fémoral'
        },
        {
          type: 'p',
          text:
            'Deux chefs : le long (ischion) participe extension de hanche et flexion du genou ; le court surtout au genou. Visible à l’extérieur de l’arrière de cuisse.'
        },
        {
          type: 'h3',
          text: 'Semi-tendineux et semi-membraneux'
        },
        {
          type: 'p',
          text:
            'Plutôt médiaux : flexion du genou, extension de hanche, rotation interne du tibia, stabilité du genou. Bi-articulaires comme le droit fémoral — longueur change selon hanche et genou (ex. soulevé jambes tendues, positions étirées).'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Pourquoi sont-ils souvent blessés ?',
      blocks: [
        {
          type: 'p',
          text:
            'Sports explosifs (sprint, football, rugby) : le muscle doit produire beaucoup de force, s’allonger vite et contrôler un mouvement violent. En course, phase de retour de la jambe vers l’avant — forte demande excentrique. Facteurs : volume brutal, manque de préparation excentrique, fatigue, déficit de force en allongement.'
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
          items: ['Nordic curl (progression)', 'Glute ham raise', 'Sliding leg curl', 'Single-leg RDL au poids du corps']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: [
            'Soulevé de terre jambes tendues / RDL',
            'Leg curl couché ou assis',
            'Good morning',
            'Soulevé de terre classique (chaîne complète)'
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
            'Ne développer que l’avant de la cuisse : quadriceps dominants, fessiers et ischios négligés — déséquilibre et genou moins stable. Croire qu’un « exercice jambes » équilibre tout : squat, leg extension et soulevé n’ont pas la même répartition. Leg curl seul sans charnière de hanche (RDL) limite le transfert.'
        }
      ]
    },
    {
      id: 'blessures',
      title: 'Blessures fréquentes',
      blocks: [
        {
          type: 'h3',
          text: 'Claquage des ischio-jambiers'
        },
        {
          type: 'p',
          text:
            'Effort explosif, souvent avec montée de charge ou fatigue. Renforcement excentrique progressif (Nordic) est une base moderne de prévention.'
        },
        {
          type: 'h3',
          text: 'Tendinopathie proximale'
        },
        {
          type: 'p',
          text:
            'Attache haute près du bassin — coureurs, endurance, parfois étirements agressifs sans renforcement adapté.'
        },
        {
          type: 'h3',
          text: 'Compensation lombaire'
        },
        {
          type: 'p',
          text:
            'Chaîne postérieure faible ou mal coordonnée : le bas du dos compense. Parfois le problème est la répartition du travail, pas seulement le manque de force brute.'
        }
      ]
    },
    {
      id: 'faq',
      title: 'Questions fréquentes',
      blocks: [
        {
          type: 'h3',
          text: 'Étirer les ischios après chaque séance ?'
        },
        {
          type: 'p',
          text:
            'Pas obligatoire. Contrôler une amplitude (renforcement en positions longues) est souvent plus utile que la seule souplesse passive.'
        },
        {
          type: 'h3',
          text: 'Jambes fortes et haut du corps ?'
        },
        {
          type: 'p',
          text:
            'Indirectement oui : stabilité, force globale, capacité athlétique — le corps fonctionne en ensemble.'
        }
      ]
    }
  ]
};

export default ischioJambiers;
