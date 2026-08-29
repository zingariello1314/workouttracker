import presentationBlocks from './grand-rond/presentationBlocks.js';
import anatomieBlocks from './grand-rond/anatomieBlocks.js';
import fonctionsBlocks from './grand-rond/fonctionsBlocks.js';
import recrutementBlocks from './grand-rond/recrutementBlocks.js';
import erreursBlocks from './grand-rond/erreursBlocks.js';
import blessuresBlocks from './grand-rond/blessuresBlocks.js';
import familleBlocks from './grand-rond/familleBlocks.js';
import faqBlocks from './grand-rond/faqBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const grandRond = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: presentationBlocks
    },
    {
      id: 'anatomie',
      title: 'Origines et insertion',
      blocks: anatomieBlocks
    },
    {
      id: 'fonctions',
      title: 'Fonctions',
      blocks: fonctionsBlocks
    },
    {
      id: 'recrutement',
      title: 'Grand rond et grand dorsal',
      blocks: recrutementBlocks
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
      title: 'Erreurs fréquentes',
      blocks: erreursBlocks
    },
    {
      id: 'blessures',
      title: 'Blessures et déséquilibres',
      blocks: blessuresBlocks
    },
    {
      id: 'mobilite',
      title: 'Liens avec la famille épaule et dos',
      blocks: familleBlocks
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
      blocks: faqBlocks
    }
  ]
};

export default grandRond;
