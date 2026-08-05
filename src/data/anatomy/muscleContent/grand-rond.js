/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const grandRond = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation générale',
      blocks: [
        {
          type: 'p',
          text:
            'Le grand rond est un petit muscle comparé au grand dorsal ou au trapèze, mais son importance esthétique et fonctionnelle dépasse largement sa taille. Il se situe dans la partie postérieure de l’épaule, juste sous le petit rond, au niveau de l’angle inférieur de la scapula.'
        },
        {
          type: 'p',
          text:
            'Sa position explique pourquoi il est souvent confondu avec le grand dorsal. Visuellement, il participe à la zone de transition entre l’arrière de l’épaule, le haut du dos et le début du grand dorsal — cette région « épaisse » sous le deltoïde postérieur chez les pratiquants très développés.'
        }
      ]
    },
    {
      id: 'anatomie',
      title: 'Anatomie',
      blocks: [
        {
          type: 'h3',
          text: 'Origine'
        },
        {
          type: 'p',
          text: 'Face postérieure de l’angle inférieur de la scapula — lien direct avec les mouvements de l’omoplate et du bras.'
        },
        {
          type: 'h3',
          text: 'Trajet et insertion'
        },
        {
          type: 'p',
          text:
            'Ses fibres se dirigent vers l’extérieur et l’avant, longent en partie le bord inférieur du grand dorsal et se terminent sur la lèvre médiale du sillon intertuberculaire de l’humérus — insertion proche du grand dorsal, d’où leur complémentarité.'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Fonctions',
      blocks: [
        {
          type: 'h3',
          text: 'Extension du bras'
        },
        {
          type: 'p',
          text: 'Il aide à ramener le bras vers l’arrière — tirages, rame, phases de traction.'
        },
        {
          type: 'h3',
          text: 'Adduction et rotation interne'
        },
        {
          type: 'p',
          text:
            'Il rapproche le bras du corps et oriente l’humérus vers l’intérieur, en synergie avec grand dorsal, grand pectoral et subscapulaire.'
        }
      ]
    },
    {
      id: 'recrutement',
      title: 'Grand rond et grand dorsal',
      blocks: [
        {
          type: 'p',
          text:
            'Le grand dorsal produit la grande force de tirage ; le grand rond agit comme muscle complémentaire de l’épaule. On pourrait résumer : le grand dorsal donne l’aile, le grand rond renforce la jonction entre l’aile et l’épaule.'
        },
        {
          type: 'p',
          text:
            'Il est rarement isolé volontairement : il se développe avec les mouvements combinant extension, tirage et adduction, surtout lorsque les coudes restent proches du corps.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'p',
          text:
            'Un programme de dos bien construit (tractions, tirages, rowings) suffit généralement — chercher à isoler chaque petit muscle du dos n’est pas toujours efficace.'
        },
        {
          type: 'h3',
          text: 'Tractions prise neutre'
        },
        {
          type: 'p',
          text:
            'Trajectoire naturelle du coude, sollicite grand dorsal, grand rond, biceps et muscles scapulaires — bon compromis performance / confort.'
        },
        {
          type: 'h3',
          text: 'Tractions australiennes et muscle-up'
        },
        {
          type: 'p',
          text:
            'Volume et contrôle pour apprendre à sentir le dos ; le muscle-up implique fortement le grand rond en transition mais demande un niveau technique élevé.'
        },
        {
          type: 'exerciseBlock',
          category: 'Poids du corps',
          stars: 5,
          items: ['Tractions prise neutre', 'Tractions australiennes', 'Muscle-up']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: ['Tirage vertical prise neutre', 'Rowing coude près du corps', 'Pull-over à la poulie']
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Blessures et déséquilibres',
      blocks: [
        {
          type: 'p',
          text:
            'Surcharge lors de mouvements explosifs (muscle-up, tractions explosives, lancers) : progression trop rapide → irritation musculaire ou tendineuse au complexe grand rond–grand dorsal.'
        },
        {
          type: 'p',
          text:
            'Excès de poussée sans tirage équilibré : le grand rond participe à la rotation interne — déséquilibre possible avec la posture.'
        }
      ]
    },
    {
      id: 'saviez-vous',
      title: 'Le saviez-vous ?',
      blocks: [
        {
          type: 'h3',
          text: 'Le petit assistant du grand dorsal'
        },
        {
          type: 'p',
          text: 'Il n’a ni la puissance ni la taille du grand dorsal, mais l’accompagne dans de nombreux mouvements importants.'
        },
        {
          type: 'h3',
          text: 'Gymnastes et grimpeurs'
        },
        {
          type: 'p',
          text:
            'Cette zone est souvent très visible chez eux : entraînements avec bras tiré vers le corps avec contrôle.'
        }
      ]
    },
    {
      id: 'faq',
      title: 'Questions fréquentes',
      blocks: [
        {
          type: 'h3',
          text: 'Exercice spécifique pour le grand rond ?'
        },
        {
          type: 'p',
          text:
            'Dans la majorité des cas, non : tractions, tirages et rowings bien exécutés suffisent. L’objectif reste la qualité des mouvements globaux.'
        },
        {
          type: 'h3',
          text: 'Haut du dos « vide » malgré de bons dorsaux ?'
        },
        {
          type: 'p',
          text:
            'Souvent trapèzes moyens, rhomboïdes et grand rond insuffisants : la largeur seule ne crée pas un dos tridimensionnel.'
        }
      ]
    }
  ]
};

export default grandRond;
