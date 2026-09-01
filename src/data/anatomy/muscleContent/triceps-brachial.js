import presentationBlocks from './triceps-brachial/presentationBlocks.js';
import portionsBlocks from './triceps-brachial/portionsBlocks.js';
import recrutementBlocks from './triceps-brachial/recrutementBlocks.js';
import blessuresBlocks from './triceps-brachial/blessuresBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const tricepsBrachial = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation générale',
      blocks: presentationBlocks
    },
    {
      id: 'portions',
      title: 'Les trois chefs',
      blocks: portionsBlocks
    },
    {
      id: 'recrutement',
      title: 'Recrutement efficace',
      blocks: recrutementBlocks
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
          text: 'Dips, pompes diamant/serrées, HSPU — progression dips lestés et variantes.'
        },
        {
          type: 'h3',
          text: 'Salle'
        },
        {
          type: 'p',
          text: 'Développé serré, extension overhead, pushdown, barre au front (charge modérée, coude).'
        },
        {
          type: 'exerciseBlock',
          category: 'Poids du corps',
          stars: 5,
          items: ['Dips', 'Pompes diamant', 'Handstand push-up', 'Pompes serrées']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: ['Développé couché serré', 'Extension overhead', 'Pushdown corde', 'Barre au front']
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
            'Croire que seuls développés/dips suffisent sans travail overhead (chef long). Demi-répétitions. Extensions trop lourdes → douleur coude.'
        }
      ]
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
          type: 'h3',
          text: 'Facteur limitant en poussée avancée'
        },
        {
          type: 'p',
          text: 'Verrouillage final dips/HSPU/développé serré = triceps.'
        },
        {
          type: 'h3',
          text: 'Gymnastes'
        },
        {
          type: 'p',
          text: 'Volume énorme d’extensions au coude sans curls isolés.'
        },
        {
          type: 'h3',
          text: 'Bras massifs, biceps moyens'
        },
        {
          type: 'p',
          text: 'Triceps + brachial + avant-bras > biceps visuellement.'
        }
      ]
    },
    {
      id: 'faq',
      title: 'Questions fréquentes',
      blocks: [
        {
          type: 'h3',
          text: 'Plus de triceps que biceps ?'
        },
        {
          type: 'p',
          text: 'Souvent oui pour l’esthétique ; équilibre reste important pour le coude.'
        },
        {
          type: 'h3',
          text: 'Pompes suffisent ?'
        },
        {
          type: 'p',
          text: 'Débutant oui ; avancé : variantes difficiles, lest, overhead.'
        },
        {
          type: 'h3',
          text: 'Dips dangereux ?'
        },
        {
          type: 'p',
          text: 'Non si amplitude, technique et progression adaptées ; dip vertical = plus triceps.'
        },
        {
          type: 'h3',
          text: 'Volume hebdo ?'
        },
        {
          type: 'p',
          text: '10–20 séries directes selon volume indirect poussée — individualiser.'
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
            'Triceps = esthétique (largeur bras) + performance (pompes, dips, HSPU). Approche : lourd + overhead (chef long) + poids du corps pour coordination.'
        }
      ]
    }
  ]
};

export default tricepsBrachial;
