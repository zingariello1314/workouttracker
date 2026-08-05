/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const elevateurScapula = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'L’élévateur de la scapula est un muscle du cou et du haut du dos qui relie les vertèbres cervicales (C1 à C4) à l’angle supérieur de l’omoplate. Il participe à l’élévation de la scapula et travaille en lien étroit avec le trapèze supérieur.'
        },
        {
          type: 'p',
          text:
            'Il n’est pas le muscle « star » de l’esthétique d’épaule, mais il influence la posture cervico-scapulaire. Posture bureau prolongée, stress et shrugs mal exécutés peuvent le raccourcir et contribuer à une sensation de cou tendu ou d’épaules remontées en permanence.'
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
            'Élévation de la scapula, inclinaison du cou du côté du muscle actif, et aide à la rotation de l’omoplate dans certains mouvements. Lorsque la tête est fixe, il peut aussi participer à des mouvements de la colonne cervicale — d’où son rôle dans la mécanique globale tête-épaules.'
        }
      ]
    },
    {
      id: 'recrutement',
      title: 'Entretien et équilibre',
      blocks: [
        {
          type: 'p',
          text:
            'Un développement excessif du trapèze supérieur et de l’élévateur sans travail du trapèze inférieur, du dentelé antérieur et de la coiffe peut perturber le rythme scapulo-huméral. L’objectif n’est pas de « grossir » ce muscle indéfiniment, mais de le garder fonctionnel et équilibré avec le reste de la chaîne.'
        },
        {
          type: 'exerciseBlock',
          category: 'Renforcement / posture',
          stars: 4,
          items: ['Shrugs contrôlés', 'Farmer walk', 'Y-raise (trapèze inférieur)', 'Mobilité cervicale']
        }
      ]
    },
    {
      id: 'mobilite',
      title: 'Liens avec la famille épaule',
      blocks: [
        {
          type: 'p',
          text:
            'Pour la mécanique complète de l’épaule, voir aussi trapèze et rhomboïdes (famille Dos), coiffe des rotateurs et dentelé antérieur (Haut du dos). Le deltoïde produit la force visible ; l’élévateur et ses voisins orientent comment la scapula se place pour recevoir cette force.'
        }
      ]
    }
  ]
};

export default elevateurScapula;
