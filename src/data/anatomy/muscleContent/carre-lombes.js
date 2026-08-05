/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const carreLombes = {
  sections: [
    {
      id: 'presentation',
      title: 'Introduction — Stabilisateur latéral du bassin',
      blocks: [
        {
          type: 'p',
          text:
            'Le carré des lombes (quadratus lumborum) est un muscle profond de la région lombaire : relie la dernière côte, les vertèbres lombaires et le bassin (crête iliaque). Peu visible, central dans la ceinture abdominale et lombaire avec transverse, obliques et érecteurs (famille Bas du dos).'
        },
        {
          type: 'p',
          text:
            'Flexion latérale du tronc, stabilisation du bassin, maintien de la posture. Exemple : porter une valise lourde d’une main — le carré des lombes empêche le corps de basculer complètement de l’autre côté.'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Ceinture lombaire et douleurs',
      blocks: [
        {
          type: 'p',
          text:
            'Les douleurs lombaires sont multifactorielles : charge, fatigue, contrôle moteur, mobilité, stress, habitudes — pas toujours un muscle « faible ». Un dos douloureux n’est pas forcément un dos fragile ; douleur et capacité mécanique ne sont pas toujours liées.'
        },
        {
          type: 'p',
          text:
            'Érecteurs du rachis : extension et stabilisation sur toute la colonne (soulevé, squat, rowing) — voir fiche Érecteurs du rachis (Bas du dos).'
        }
      ]
    },
    {
      id: 'momentum',
      title: 'Mouvements Momentum',
      blocks: [
        {
          type: 'p',
          text:
            'L-sit, front lever, handstand : éviter rotation ou inclinaison du bassin. Farmer / suitcase carry : résistance à l’inclinaison latérale. Side plank sollicite obliques, transverse, carré des lombes et hanche.'
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
          items: ['Side plank', 'Bird dog', 'Dead bug', 'Pallof press']
        },
        {
          type: 'exerciseBlock',
          category: 'Force fonctionnelle',
          stars: 5,
          items: ['Suitcase carry', 'Farmer walk', 'Rowing unilatéral anti-rotation']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle (modéré)',
          stars: 4,
          items: ['Side bend haltère contrôlé — éviter volume excessif si crainte d’épaissir le tronc']
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
            'Étirer sans endurance ni contrôle. Flexions latérales lourdes sans anti-inclinaison. Négliger fessiers (bassin mal contrôlé → surcharge du carré des lombes). Renforcer les lombaires sans abdominaux, fessiers et ischios crée un déséquilibre du core.'
        }
      ]
    },
    {
      id: 'blessures',
      title: 'Contexte lombaire',
      blocks: [
        {
          type: 'p',
          text:
            'Lombalgies mécaniques, élongations, hernie discale (avis médical si irradiation) — reprise progressive souvent préférable au repos total prolongé. Renforcement lombaire progressif rend les tissus plus résistants, ce n’est pas intrinsèquement dangereux.'
        }
      ]
    }
  ]
};

export default carreLombes;
