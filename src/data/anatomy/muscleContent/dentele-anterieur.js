/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const denteleAnterieur = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation générale',
      blocks: [
        {
          type: 'p',
          text:
            'Le dentelé antérieur (serratus anterior) est l’un des muscles les plus sous-estimés du haut du corps. Sur le flanc du thorax, sous l’aisselle, ses insertions sur les côtes évoquent une scie — il relie les côtes au bord médial de la scapula.'
        },
        {
          type: 'p',
          text:
            'Il maintient la scapula collée à la cage thoracique. S’il fonctionne mal, l’omoplate peut « ressortir » (scapula ailée / winging), avec perte de stabilité et difficultés au-dessus de la tête.'
        }
      ]
    },
    {
      id: 'anatomie',
      title: 'Anatomie',
      blocks: [
        {
          type: 'h3',
          text: 'Origine et insertion'
        },
        {
          type: 'p',
          text:
            'Origine sur les neuf premières côtes (en règle générale) ; insertion sur le bord médial et l’angle inférieur de la scapula.'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Fonctions',
      blocks: [
        {
          type: 'p',
          text:
            'Protraction de la scapula — éloigner les omoplates, comme en poussée devant soi. Rotation supérieure et maintien de l’omoplate contre le thorax.'
        },
        {
          type: 'p',
          text:
            'Sollicité fortement en pompes, développés overhead, frappes, lancers et gymnastique.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'h3',
          text: 'Push-up plus et wall slides'
        },
        {
          type: 'p',
          text:
            'Pompe avec protraction en fin de mouvement ; glissades au mur pour le contrôle scapulaire (rééducation et prépa physique).'
        },
        {
          type: 'h3',
          text: 'Pompes et scapular push-up'
        },
        {
          type: 'p',
          text:
            'Pompes avec protraction contrôlée ; bear crawl et appuis au sol pour stabilité du poignet et du dentelé.'
        },
        {
          type: 'exerciseBlock',
          category: 'Poids du corps',
          stars: 5,
          items: ['Push-up plus', 'Wall slides', 'Scapular push-up', 'Pompes protraction']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 4,
          items: ['Landmine press', 'Développé protraction contrôlée']
        }
      ]
    },
    {
      id: 'blessures',
      title: 'Scapula ailée et épaule',
      blocks: [
        {
          type: 'p',
          text:
            'Dentelé faible ou mal activé → winging, mauvaise stabilité, gêne overhead, perte de force. Peut perturber le rythme scapulo-huméral et augmenter les contraintes sur coiffe et espace sous-acromial.'
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
            'Surnommé parfois « muscle du boxeur » : frappe rapide avec épaule stable — projection du bras et contrôle scapulaire.'
        }
      ]
    }
  ]
};

export default denteleAnterieur;
