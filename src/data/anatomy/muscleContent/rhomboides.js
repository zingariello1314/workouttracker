import presentationBlocks from './rhomboides/presentationBlocks.js';
import portionsBlocks from './rhomboides/portionsBlocks.js';
import fonctionsBlocks from './rhomboides/fonctionsBlocks.js';
import recrutementBlocks from './rhomboides/recrutementBlocks.js';
import erreursBlocks from './rhomboides/erreursBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const rhomboides = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation générale',
      blocks: presentationBlocks
    },
    {
      id: 'portions',
      title: 'Petit et grand rhomboïde',
      blocks: portionsBlocks
    },
    {
      id: 'fonctions',
      title: 'Fonctions',
      blocks: fonctionsBlocks
    },
    {
      id: 'recrutement',
      title: 'Comment les développer',
      blocks: recrutementBlocks
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'h3',
          text: 'Tractions scapulaires'
        },
        {
          type: 'p',
          text:
            'Mouvement court : contrôler les omoplates sans monter avec les bras — excellent pour la connexion cerveau–dos.'
        },
        {
          type: 'h3',
          text: 'Rowing et face pull'
        },
        {
          type: 'p',
          text:
            'Rowing horizontal fondamental ; tractions australiennes avec pause ; reverse fly ; face pull (rhomboïdes, trapèze moyen/inférieur, coiffe).'
        },
        {
          type: 'exerciseBlock',
          category: 'Poids du corps',
          stars: 5,
          items: ['Tractions scapulaires', 'Tractions australiennes pause', 'Row inversé']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: ['Rowing horizontal', 'Reverse fly', 'Face pull']
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Erreurs et tensions',
      blocks: erreursBlocks
    },
    {
      id: 'saviez-vous',
      title: 'Le saviez-vous ?',
      blocks: [
        {
          type: 'p',
          text:
            'Les rhomboïdes comptent souvent plus pour la performance que pour le miroir : une meilleure stabilité scapulaire améliore développés, tractions et confort d’épaule.'
        }
      ]
    }
  ]
};

export default rhomboides;
