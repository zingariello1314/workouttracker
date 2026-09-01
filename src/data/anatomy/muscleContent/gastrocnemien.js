import presentationBlocks from './gastrocnemien/presentationBlocks.js';
import anatomieBlocks from './gastrocnemien/anatomieBlocks.js';
import fonctionsBlocks from './gastrocnemien/fonctionsBlocks.js';
import erreursBlocks from './gastrocnemien/erreursBlocks.js';
import blessuresBlocks from './gastrocnemien/blessuresBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const gastrocnemien = {
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
      title: 'Sprint et tendon d’Achille',
      blocks: fonctionsBlocks
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Poids du corps',
          stars: 5,
          items: [
            'Élévations mollets debout sur marche (amplitude)',
            'Élévations mollets une jambe',
            'Élévations mollets pointes vers l’extérieur (accent chef médial)',
            'Élévations mollets pointes vers l’intérieur (variation, pas isolation du chef latéral)',
            'Sauts / pliométrie (puissance élastique)'
          ]
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: ['Standing calf raise', 'Presse à mollets (volume)']
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
      title: 'Blessures fréquentes',
      blocks: blessuresBlocks
    }
  ]
};

export default gastrocnemien;
