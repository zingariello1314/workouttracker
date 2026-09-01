import presentationBlocks from './avant-bras-ensemble/presentationBlocks.js';
import anatomieBlocks from './avant-bras-ensemble/anatomieBlocks.js';
import erreursBlocks from './avant-bras-ensemble/erreursBlocks.js';
import blessuresBlocks from './avant-bras-ensemble/blessuresBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const avantBrasEnsemble = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation générale',
      blocks: presentationBlocks
    },
    {
      id: 'anatomie',
      title: 'Muscles clés',
      blocks: anatomieBlocks
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'h3',
          text: 'Poids du corps'
        },
        {
          type: 'p',
          text:
            'Tractions, dead hang (endurance prise), tractions serviette, marche ours / appuis mains.'
        },
        {
          type: 'h3',
          text: 'Salle'
        },
        {
          type: 'p',
          text:
            'Farmer walk, curl marteau, wrist curl, reverse wrist curl, reverse curl.'
        },
        {
          type: 'exerciseBlock',
          category: 'Préhension & suspension',
          stars: 5,
          items: ['Tractions', 'Dead hang', 'Dead hang lesté', 'Farmer walk']
        },
        {
          type: 'exerciseBlock',
          category: 'Poignet et équilibre',
          stars: 5,
          items: ['Wrist curl', 'Reverse wrist curl', 'Reverse curl', 'Curl marteau']
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Erreurs fréquentes',
      blocks: erreursBlocks
    },
    {
      id: 'blessures',
      title: 'Blessures',
      blocks: blessuresBlocks
    },
    {
      id: 'saviez-vous',
      title: 'Le saviez-vous ?',
      blocks: [
        {
          type: 'p',
          text:
            'Force de préhension corrélée à marqueurs de condition ; grimpeurs = avant-bras extrêmes ; tendons récupèrent plus lentement que muscles.'
        }
      ]
    },
    {
      id: 'faq',
      title: 'Questions fréquentes',
      blocks: [
        {
          type: 'h3',
          text: 'Tractions suffisent ?'
        },
        {
          type: 'p',
          text: 'Souvent oui jusqu’à intermédiaire ; travail spécifique pour maximiser.'
        },
        {
          type: 'h3',
          text: 'Avant-bras brûlent avant le dos ?'
        },
        {
          type: 'p',
          text: 'La prise est souvent le maillon faible — normal, pas forcément un dos faible.'
        },
        {
          type: 'h3',
          text: 'Augmenter taille poignets ?'
        },
        {
          type: 'p',
          text: 'Non osseusement ; oui pour muscles autour.'
        }
      ]
    },
    {
      id: 'momentum',
      title: 'Analyse Momentum',
      blocks: [
        {
          type: 'p',
          text:
            'Esthétique, performance (tractions, carries, anneaux), santé poignet — bras complet = biceps + brachial + triceps + avant-bras + prise.'
        }
      ]
    }
  ]
};

export default avantBrasEnsemble;
