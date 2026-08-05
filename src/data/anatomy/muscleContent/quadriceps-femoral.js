/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const quadricepsFemoral = {
  sections: [
    {
      id: 'presentation',
      title: 'Introduction — Le moteur de l’extension du genou',
      blocks: [
        {
          type: 'p',
          text:
            'Le quadriceps est l’emblème de la face avant de la cuisse : quatre chefs convergent vers le tendon quadricipital et le tendon rotulien pour tendre la jambe. Escaliers, relevé de chaise, saut, course, frappe au ballon — il est le moteur de propulsion.'
        },
        {
          type: 'p',
          text:
            'Au-delà de l’esthétique, un quadriceps développé participe à la stabilité du genou, à l’absorption des impacts, à la force et à la prévention de certaines blessures. La rotule augmente le bras de levier du quadriceps ; le genou n’est pas stabilisé que par les ligaments, mais par toute la musculature péri-articulaire.'
        }
      ]
    },
    {
      id: 'portions',
      title: 'Les quatre chefs',
      blocks: [
        {
          type: 'h3',
          text: 'Droit fémoral'
        },
        {
          type: 'p',
          text:
            'Seul chef biarticulaire (hanche + genou) : extension du genou et flexion de hanche (genou vers la poitrine). Superficiel, centre de la face avant. En squat profond, hanche fléchie et genou fléchi : longueur complexe, contribution à la force variable selon la position.'
        },
        {
          type: 'h3',
          text: 'Vaste latéral'
        },
        {
          type: 'p',
          text:
            'Face externe de la cuisse — largeur visuelle, « mur » latéral chez les pratiquants avancés. Origines sur grand trochanter, ligne âpre et fémur latéral. Extension du genou et contribution à l’alignement de la rotule.'
        },
        {
          type: 'h3',
          text: 'Vaste médial (VMO)'
        },
        {
          type: 'p',
          text:
            'Portion interne ; la partie basse oblique (VMO) est souvent citée pour le guidage de la rotule. Pas de « isolation parfaite » en pratique, mais amplitude complète et équilibre global autour du genou restent pertinents.'
        },
        {
          type: 'h3',
          text: 'Vaste intermédiaire'
        },
        {
          type: 'p',
          text:
            'Profond sous le droit fémoral, peu visible, mais masse et force importantes pour l’extension globale.'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Biomécanique — squat et morphologie',
      blocks: [
        {
          type: 'p',
          text:
            'Le squat sollicite quadriceps, fessiers, ischio-jambiers, adducteurs et gainage. La part quadriceps dépend de la profondeur, de la largeur de stance, de l’inclinaison du buste et de la morphologie (longueur fémur/tibia, mobilité cheville, bassin). Il n’existe pas un squat universel parfait : deux personnes peuvent ressentir un travail différent avec la même consigne.'
        },
        {
          type: 'p',
          text:
            'Plus de profondeur augmente en général l’amplitude au genou et peut augmenter la demande quadriceps, sans que ce soit la seule variable. Technique, proportions et mobilité comptent autant.'
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
            'Pistol squat (progression)',
            'Fentes bulgares',
            'Squats tempo (descente lente)',
            'Wall sit'
          ]
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: ['Hack squat', 'Front squat', 'Presse à cuisses', 'Leg extension (volume ciblé, charge progressive)']
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
            'Confondre brûlure métabolique et hypertrophie : un exercice peut être efficace sans sensation extrême. Réduire l’amplitude pour charger plus lourd limite souvent la stimulation. Négliger le unilatéral prive de stabilité, de correction droite/gauche et de contrôle moteur.'
        }
      ]
    },
    {
      id: 'blessures',
      title: 'Blessures fréquentes (genou & quadriceps)',
      blocks: [
        {
          type: 'h3',
          text: 'Tendinopathie rotulienne'
        },
        {
          type: 'p',
          text:
            'Fréquente chez sauteurs et coureurs explosifs — tendon sous la rotule. Volume monté trop vite, répétition de sauts, manque de progression.'
        },
        {
          type: 'h3',
          text: 'Syndrome fémoro-patellaire'
        },
        {
          type: 'p',
          text:
            'Douleur autour ou derrière la rotule : contrôle du mouvement, charge, faiblesses relatives, technique — causes multiples, pas une seule « clé magique ».'
        },
        {
          type: 'h3',
          text: 'Déchirure du quadriceps'
        },
        {
          type: 'p',
          text:
            'Plutôt accélérations violentes ou efforts explosifs dépassant la capacité du muscle ; plus rare en musculation contrôlée.'
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
            'En sprint, saut ou descente d’escaliers, les forces au genou peuvent dépasser plusieurs fois le poids du corps — d’où l’importance de la progression. Un entraînement lourd bien géré renforce la tolérance aux charges ; les problèmes viennent surtout d’une montée trop rapide, d’une mauvaise technique ou d’un volume excessif.'
        }
      ]
    },
    {
      id: 'faq',
      title: 'Questions fréquentes',
      blocks: [
        {
          type: 'h3',
          text: 'Les squats détruisent-ils les genoux ?'
        },
        {
          type: 'p',
          text:
            'Non, si le squat est adapté au niveau et bien exécuté. Le corps est fait pour fléchir le genou. Risque surtout si charge, technique ou récupération sont mal gérés.'
        },
        {
          type: 'h3',
          text: 'Quadriceps qui brûlent mais ne grossissent pas ?'
        },
        {
          type: 'p',
          text:
            'La brûlure n’est qu’un signal. Hypertrophie : tension mécanique, progression, volume adapté, récupération.'
        },
        {
          type: 'h3',
          text: 'Verrouiller les genoux en haut du mouvement ?'
        },
        {
          type: 'p',
          text:
            'Extension complète contrôlée est en général acceptable ; le danger est plutôt un verrouillage violent sous charge.'
        }
      ]
    }
  ]
};

export default quadricepsFemoral;
