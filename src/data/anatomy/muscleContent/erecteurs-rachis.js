import presentationBlocks from './erecteurs-rachis/presentationBlocks.js';
import anatomieBlocks from './erecteurs-rachis/anatomieBlocks.js';
import fonctionsBlocks from './erecteurs-rachis/fonctionsBlocks.js';
import momentumBlocks from './erecteurs-rachis/momentumBlocks.js';
import erreursBlocks from './erecteurs-rachis/erreursBlocks.js';
import blessuresBlocks from './erecteurs-rachis/blessuresBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const erecteursRachis = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation approfondie',
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
          text: 'Extensions lombaires et superman'
        },
        {
          type: 'p',
          text:
            'Au sol ou sur banc : extension contrôlée, pas d’amplitude excessive. Superman : contraction dos, pas monter au maximum.'
        },
        {
          type: 'h3',
          text: 'Soulevé de terre et good morning'
        },
        {
          type: 'p',
          text:
            'Soulevé : chaîne postérieure complète. Good morning chargé : technique exigeante, hip hinge.'
        },
        {
          type: 'exerciseBlock',
          category: 'Poids du corps',
          stars: 5,
          items: ['Extensions lombaires au sol', 'Superman', 'Hip hinge', 'Bird dog']
        },
        {
          type: 'exerciseBlock',
          category: 'Poids du corps — limites',
          stars: 2,
          items: ['Superman seul (surcharge limitée à long terme)']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle — polyarticulaires',
          stars: 5,
          items: ['Soulevé de terre', 'Squat', 'Good morning (avancé)']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle — ciblage lombaires',
          stars: 5,
          items: ['Extensions lombaires sur banc', 'Hyperextensions contrôlées']
        },
        {
          type: 'exerciseBlock',
          category: 'Fonctionnel',
          stars: 5,
          items: ['Farmer walk', 'Farmer walk unilatéral', 'Marche lestée']
        }
      ]
    },
    {
      id: 'momentum',
      title: 'Street workout & tronc',
      blocks: momentumBlocks
    },
    {
      id: 'erreurs',
      title: 'Erreurs fréquentes',
      blocks: erreursBlocks
    },
    {
      id: 'blessures',
      title: 'Blessures & prévention',
      blocks: blessuresBlocks
    },
    {
      id: 'saviez-vous',
      title: 'Vision Momentum',
      blocks: [
        {
          type: 'callout',
          tone: 'tip',
          text:
            'Le bas du dos est une plateforme de transmission de force, pas seulement un muscle « à sculpter ». Largeur (dorsaux) + profondeur (multifides, érecteurs) = utiliser la force en sécurité.'
        }
      ]
    }
  ]
};

export default erecteursRachis;
