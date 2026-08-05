/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const petitPectoral = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Le petit pectoral est un muscle plus profond situé sous le grand pectoral. Il n’a pratiquement aucun impact esthétique mais il est essentiel pour la mécanique de l’épaule.'
        }
      ]
    },
    {
      id: 'anatomie',
      title: 'Origine et insertion',
      blocks: [
        {
          type: 'h3',
          text: 'Origine'
        },
        {
          type: 'p',
          text: 'Il prend naissance sur la troisième, la quatrième et la cinquième côtes.'
        },
        {
          type: 'h3',
          text: 'Insertion'
        },
        {
          type: 'p',
          text: 'Il se termine sur le processus coracoïde de la scapula.'
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
            'Son rôle principal est de contrôler l’omoplate. Il participe à l’abaissement de la scapula, à la projection de l’omoplate vers l’avant et à la rotation vers le bas.'
        },
        {
          type: 'p',
          text:
            'Il intervient également légèrement dans la respiration forcée lorsque les épaules sont fixes.'
        }
      ]
    },
    {
      id: 'mobilite',
      title: 'Importance posturale',
      blocks: [
        {
          type: 'p',
          text:
            'Un petit pectoral trop raide peut contribuer à une position d’épaule enroulée vers l’avant. C’est fréquent chez les personnes assises longtemps ou chez les pratiquants qui font beaucoup de poussées mais peu de tirages. Cela peut limiter certains mouvements au-dessus de la tête.'
        }
      ]
    },
    {
      id: 'recrutement',
      title: 'Exercices et entretien',
      blocks: [
        {
          type: 'p',
          text:
            'Il n’est pas réellement isolable par un exercice classique. Il est cependant influencé par le travail global de poussée (pompes, dips, développés) et par la qualité du contrôle scapulaire.'
        },
        {
          type: 'exerciseBlock',
          category: 'Entretien recommandé',
          stars: 5,
          items: ['Face pull', 'Rowing avec bonne rétraction scapulaire', 'Mobilité thoracique', 'Étirement du petit pectoral']
        }
      ]
    }
  ]
};

export default petitPectoral;
