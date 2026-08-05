/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const psoasIliaque = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation — Flexion de hanche et figures',
      blocks: [
        {
          type: 'p',
          text:
            'Psoas majeur et iliaque : vertèbres lombaires / fosse iliaque → petit trochanter. Principal fléchisseur de hanche — lien colonne, bassin et cuisses. L-sit, relevés suspendus, retour de jambe en course. Le L-sit n’est pas « que des abdos » : coordination abdominaux, quadriceps, psoas, épaules, triceps ; échec souvent = mobilité ischios, compression ou force de hanche.'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Relevés de jambes : abdos ou psoas ?',
      blocks: [
        {
          type: 'p',
          text:
            'Les fléchisseurs de hanche participent naturellement aux relevés. Pour maximiser les abdominaux : rétroversion du bassin, enroulement, éviter de monter les pieds haut avec cambrure et élan. Voir aussi droit fémoral (Quadriceps) pour la flexion de hanche.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Street workout',
          stars: 5,
          items: [
            'Hanging knee raise (bassin contrôlé)',
            'Hanging leg raise / toes to bar',
            'Tuck sit → L-sit → V-sit',
            'Compression drills',
            'Mountain climber contrôlé'
          ]
        },
        {
          type: 'exerciseBlock',
          category: 'Mobilité + force',
          stars: 5,
          items: ['Étirement psoas en fente', 'Couch stretch', 'Cable hip flexion']
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Erreurs',
      blocks: [
        {
          type: 'p',
          text:
            'Relevés = psoas dominant si bassin non rétroversé. Toujours étirer sans renforcement actif. Déséquilibre fessiers / extenseurs de hanche. Posture assise prolongée sans gainage ni mobilité.'
        }
      ]
    },
    {
      id: 'faq',
      title: 'Questions fréquentes',
      blocks: [
        {
          type: 'h3',
          text: 'Pourquoi je sens les fléchisseurs de hanche en relevés ?'
        },
        {
          type: 'p',
          text:
            'Ils participent au mouvement ; augmenter le travail abdominal par contrôle du bassin et rétroversion, pas seulement la hauteur des pieds.'
        }
      ]
    }
  ]
};

export default psoasIliaque;
