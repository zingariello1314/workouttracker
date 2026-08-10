import presentationBlocks from './biceps-brachial/presentationBlocks.js';
import portionsBlocks from './biceps-brachial/portionsBlocks.js';
import anatomieBlocks from './biceps-brachial/anatomieBlocks.js';
import recrutementBlocks from './biceps-brachial/recrutementBlocks.js';
import blessuresBlocks from './biceps-brachial/blessuresBlocks.js';
import saviezVousBlocks from './biceps-brachial/saviezVousBlocks.js';
import faqBlocks from './biceps-brachial/faqBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const bicepsBrachial = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation générale',
      blocks: presentationBlocks
    },
    {
      id: 'portions',
      title: 'Chef long et chef court',
      blocks: portionsBlocks
    },
    {
      id: 'anatomie',
      title: 'Insertion',
      blocks: anatomieBlocks
    },
    {
      id: 'recrutement',
      title: 'Comment le développer',
      blocks: recrutementBlocks
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'p',
          text:
            'Les mouvements ci-dessous complètent la section « Comment le développer ». Ils seront enrichis (technique, variantes, illustrations) dans une prochaine itération.'
        },
        {
          type: 'h3',
          text: 'Poids du corps'
        },
        {
          type: 'p',
          text:
            'Chin-ups (supination) : charge relative élevée ; tractions australiennes supination pour le volume ; curl sur barre basse.'
        },
        {
          type: 'h3',
          text: 'Salle'
        },
        {
          type: 'p',
          text:
            'Curl incliné (position allongée du biceps), curl pupitre, curl barre. Curl marteau surtout brachial/brachio-radial mais complète l’épaisseur — voir fiche Brachial.'
        },
        {
          type: 'exerciseBlock',
          category: 'Poids du corps — incontournables',
          stars: 5,
          items: ['Tractions supination', 'Tractions australiennes supination', 'Curl barre basse']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle — incontournables',
          stars: 5,
          items: ['Curl incliné haltères', 'Curl pupitre', 'Curl barre']
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
      title: 'À savoir',
      blocks: saviezVousBlocks
    },
    {
      id: 'faq',
      title: 'Questions fréquentes',
      blocks: faqBlocks
    },
    {
      id: 'momentum',
      title: 'Analyse Momentum',
      blocks: [
        {
          type: 'p',
          text:
            'Biceps = esthétique, force, street workout, tractions — mais bras complet = biceps + brachial épais + triceps dominant + avant-bras solides. Le rail Momentum te montre ton volume sur 7 jours pour ajuster curls et tirages.'
        }
      ]
    }
  ]
};

export default bicepsBrachial;
