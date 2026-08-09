import presentationBlocks from './petit-pectoral/presentationBlocks.js';
import anatomieBlocks from './petit-pectoral/anatomieBlocks.js';
import fonctionsBlocks from './petit-pectoral/fonctionsBlocks.js';
import mobiliteBlocks from './petit-pectoral/mobiliteBlocks.js';
import recrutementBlocks from './petit-pectoral/recrutementBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const petitPectoral = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: presentationBlocks
    },
    {
      id: 'anatomie',
      title: 'Origine et insertion',
      blocks: anatomieBlocks
    },
    {
      id: 'fonctions',
      title: 'Fonctions',
      blocks: fonctionsBlocks
    },
    {
      id: 'mobilite',
      title: 'Importance posturale et mécanique',
      blocks: mobiliteBlocks
    },
    {
      id: 'recrutement',
      title: 'Exercices et entretien',
      blocks: recrutementBlocks
    }
  ]
};

export default petitPectoral;
