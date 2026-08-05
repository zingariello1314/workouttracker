/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const carreLombes = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Muscle profond quadrangulaire de chaque côté de la colonne lombaire (12e côte, vertèbres L1–L4, crête iliaque). Stabilisateur entre bassin, colonne et cage thoracique — peu visible, essentiel en marche, course, appui unilatéral et street workout (L-sit, front lever, handstand).'
        },
        {
          type: 'callout',
          tone: 'tip',
          text: 'Abdominaux → stabilité latérale et lombaire. Voir aussi : Bas du dos (érecteurs, multifides), transverse et obliques (ceinture profonde).'
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
            'Inclinaison latérale du tronc (un côté)',
            'Stabilisation du bassin en appui unipodal (anti-basculement)',
            'Contrôle des contraintes asymétriques sur la colonne lombaire',
            'Aide respiratoire accessoire (attache 12e côte)'
          ]
        }
      ]
    },
    {
      id: 'momentum',
      title: 'Mouvements Momentum',
      blocks: [
        {
          type: 'ul',
          items: [
            'L-sit / front lever : éviter rotation ou inclinaison du bassin',
            'Farmer carry / suitcase : résistance à l’inclinaison latérale',
            'Handstand : ligne droite bassin–colonne'
          ]
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Stabilité',
          stars: 5,
          items: ['Side plank', 'Bird dog', 'Dead bug']
        },
        {
          type: 'exerciseBlock',
          category: 'Force fonctionnelle',
          stars: 5,
          items: ['Suitcase carry', 'Farmer walk (bilatéral)', 'Rowing unilatéral anti-rotation']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 4,
          items: ['Side bend haltère contrôlé']
        }
      ]
    },
    {
      id: 'programme',
      title: 'Programme indicatif',
      blocks: [
        {
          type: 'ul',
          items: [
            'Side plank : 3×30–60 s',
            'Bird dog : 3×10/côté',
            'Suitcase carry : 3–5 séries'
          ]
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
            'Uniquement étirer sans endurance ni contrôle',
            'Flexions latérales lourdes sans travail anti-inclinaison',
            'Négliger moyen fessier / grand fessier (bassin mal contrôlé → surcharge QL)'
          ]
        },
        {
          type: 'callout',
          tone: 'warn',
          text: 'Douleur lombaire latérale ≠ muscle « trop court » : fatigue, faiblesse voisins, mobilité hanche ou charge mal gérée.'
        }
      ]
    }
  ]
};

export default carreLombes;
