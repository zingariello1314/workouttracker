import presentationBlocks from './soleaire/presentationBlocks.js';
import anatomieBlocks from './soleaire/anatomieBlocks.js';
import fonctionsBlocks from './soleaire/fonctionsBlocks.js';
import erreursBlocks from './soleaire/erreursBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const soleaire = {
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
          type: 'exerciseBlock',
          category: 'Poids du corps',
          stars: 4,
          items: ['Mollets assis sur banc (charge sur genoux)', 'Tempo lent debout + assis en superset']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: ['Seated calf raise', 'Presse à mollets genoux fléchis']
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Erreurs fréquentes',
      blocks: erreursBlocks
    },
    {
      id: 'saviez-vous',
      title: 'Le saviez-vous ?',
      blocks: [
        {
          type: 'p',
          text:
            'Les mollets participent au retour veineux (« deuxième cœur »). Force et volume ne sont pas toujours corrélés : fibres, nerveux, tendons comptent pour la performance.'
        }
      ]
    },
    {
      id: 'faq',
      title: 'Questions fréquentes — mollets',
      blocks: [
        {
          type: 'h3',
          text: 'Mollets qui ne grossissent pas ?'
        },
        {
          type: 'p',
          text:
            'Volume insuffisant, mauvaise amplitude, charges légères sans progression. Cent répétitions sans surcharge progressive perdent souvent face à un plan structuré.'
        },
        {
          type: 'h3',
          text: 'Tous les jours ?'
        },
        {
          type: 'p',
          text:
            'Récupération rapide possible, mais surcharge progressive et exécution restent la priorité.'
        },
        {
          type: 'h3',
          text: 'Changer la forme des mollets ?'
        },
        {
          type: 'p',
          text:
            'On peut gagner volume, densité et force ; les insertions et la longueur du tendon d’Achille restent largement génétiques.'
        }
      ]
    },
    {
      id: 'momentum',
      title: 'Vision Momentum',
      blocks: [
        {
          type: 'p',
          text:
            'Course, sauts, équilibre, prévention cheville : compléter avec la famille Tibia (tibial antérieur) pour l’équilibre avant/arrière de jambe. Voir aussi Gastrocnémien pour le duo debout/assis.'
        }
      ]
    }
  ]
};

export default soleaire;
