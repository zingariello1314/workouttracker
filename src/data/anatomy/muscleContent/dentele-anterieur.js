import presentationBlocks from './dentele-anterieur/presentationBlocks.js';
import anatomieBlocks from './dentele-anterieur/anatomieBlocks.js';
import fonctionsBlocks from './dentele-anterieur/fonctionsBlocks.js';
import blessuresBlocks from './dentele-anterieur/blessuresBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const denteleAnterieur = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation générale',
      blocks: presentationBlocks
    },
    {
      id: 'anatomie',
      title: 'Anatomie',
      blocks: anatomieBlocks
    },
    {
      id: 'fonctions',
      title: 'Fonctions',
      blocks: fonctionsBlocks
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
      blocks: blessuresBlocks
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
