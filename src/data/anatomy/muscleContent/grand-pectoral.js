import presentationBlocks from './grand-pectoral/presentationBlocks.js';
import recrutementBlocks from './grand-pectoral/recrutementBlocks.js';
import morphologieBlocks from './grand-pectoral/morphologieBlocks.js';
import fonctionsBlocks from './grand-pectoral/fonctionsBlocks.js';
import erreursBlocks from './grand-pectoral/erreursBlocks.js';
import saviezVousBlocks from './grand-pectoral/saviezVousBlocks.js';
import anatomieBlocks from './grand-pectoral/anatomieBlocks.js';
import blessuresBlocks from './grand-pectoral/blessuresBlocks.js';
import volumeBlocks from './grand-pectoral/volumeBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const grandPectoral = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation approfondie du grand pectoral',
      blocks: presentationBlocks
    },
    {
      id: 'portions',
      title: 'Les différentes portions',
      blocks: [
        {
          type: 'p',
          text:
            'Le grand pectoral est un seul muscle, mais il est organisé en plusieurs faisceaux. Cette organisation explique pourquoi certains exercices donnent davantage de sensation dans certaines zones — sans qu’une portion puisse être totalement isolée des autres.'
        },
        {
          type: 'h3',
          text: 'Faisceau claviculaire — Le haut des pectoraux'
        },
        {
          type: 'p',
          text:
            'Le faisceau claviculaire correspond à la partie supérieure du grand pectoral. Ses fibres prennent naissance au niveau de la clavicule et descendent légèrement vers l’humérus.'
        },
        {
          type: 'p',
          text:
            'Son orientation lui permet de participer davantage aux mouvements où le bras monte devant le corps. C’est cette portion qui contribue à donner un aspect de poitrine « pleine » sous les clavicules.'
        },
        {
          type: 'p',
          text:
            'Chez beaucoup de pratiquants, cette zone paraît moins développée car les mouvements classiques comme le développé couché horizontal sollicitent davantage les fibres sternales. Pour accentuer son développement, il faut généralement utiliser des mouvements où le bras pousse légèrement vers le haut.'
        },
        {
          type: 'ul',
          items: ['Développé incliné', 'Pompes pieds surélevés', 'Écartés inclinés']
        },
        {
          type: 'h3',
          text: 'Faisceau sterno-costal — Le volume principal de la poitrine'
        },
        {
          type: 'p',
          text:
            'Il représente la majorité de la masse du grand pectoral. Ses fibres prennent naissance au niveau du sternum et des cartilages costaux.'
        },
        {
          type: 'p',
          text:
            'C’est la partie la plus sollicitée lors des mouvements de poussée horizontale. Elle intervient énormément dans le développé couché, les pompes classiques et les dips contrôlés. C’est généralement cette portion qui donne l’épaisseur générale de la poitrine.'
        },
        {
          type: 'ul',
          items: ['Développé couché', 'Pompes classiques', 'Dips contrôlés']
        },
        {
          type: 'h3',
          text: 'Faisceau abdominal — La partie inférieure'
        },
        {
          type: 'p',
          text:
            'Cette portion est souvent appelée « bas des pectoraux ». Ses fibres prennent naissance au niveau de la gaine du muscle droit de l’abdomen.'
        },
        {
          type: 'p',
          text:
            'Elle participe davantage aux mouvements où le bras descend ou revient depuis une position haute.'
        },
        {
          type: 'ul',
          items: ['Dips penchés en avant', 'Développé décliné', 'Cross-over de haut vers le bas']
        }
      ]
    },
    {
      id: 'anatomie',
      title: 'Origines et insertion',
      blocks: anatomieBlocks
    },
    {
      id: 'fonctions',
      title: 'Fonctions principales',
      blocks: fonctionsBlocks
    },
    {
      id: 'recrutement',
      title: 'Comment réellement développer le grand pectoral',
      blocks: recrutementBlocks
    },
    {
      id: 'morphologie',
      title: 'Morphologie et développement du grand pectoral',
      blocks: morphologieBlocks
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'p',
          text:
            'Les poids du corps peuvent développer une vraie poitrine : le muscle répond à la tension, qu’elle vienne d’une barre, d’un haltère ou du corps. Voici les mouvements les plus utiles au quotidien dans Momentum, avec leur logique de recrutement.'
        },
        {
          type: 'h3',
          text: 'Pompes classiques'
        },
        {
          type: 'p',
          text:
            'Exercice fondamental : elles développent surtout le faisceau sterno-costal, les triceps et le deltoïde antérieur. Elles constituent une excellente base pour débuter et restent pertinentes à vie si l’on progresse via les répétitions, le tempo, le lest ou les variantes.'
        },
        {
          type: 'h3',
          text: 'Pompes lestées'
        },
        {
          type: 'p',
          text:
            'Lorsque les pompes classiques deviennent trop faciles, ajouter une charge permet de continuer la surcharge progressive — le même principe qu’en salle avec une barre ou des haltères.'
        },
        {
          type: 'h3',
          text: 'Dips penchés en avant'
        },
        {
          type: 'p',
          text:
            'L’un des meilleurs exercices au poids du corps pour la partie inférieure et la poitrine globale. Ils demandent une bonne mobilité d’épaule ; buste penché en avant → davantage pectoraux, buste droit → davantage triceps.'
        },
        {
          type: 'h3',
          text: 'Pompes déclinées et variantes avancées'
        },
        {
          type: 'p',
          text:
            'Les pompes déclinées accentuent le faisceau claviculaire. Les archer push-ups et ring push-ups augmentent la charge unilatérale ou la demande de stabilité scapulaire — utiles lorsque la base est solide.'
        },
        {
          type: 'exerciseBlock',
          category: 'Poids du corps — incontournables',
          stars: 5,
          items: [
            'Pompes classiques',
            'Pompes lestées',
            'Dips penchés en avant',
            'Pompes inclinées',
            'Pompes déclinées'
          ]
        },
        {
          type: 'exerciseBlock',
          category: 'Poids du corps — intermédiaire',
          stars: 4,
          items: [
            'Pompes déclinées (accent claviculaire)',
            'Archer push-ups',
            'Ring push-ups',
            'Pseudo planche push-ups'
          ]
        },
        {
          type: 'exerciseBlock',
          category: 'Poids du corps — débutant',
          stars: 3,
          items: ['Pompes sur les genoux', 'Pompes contre un mur']
        },
        {
          type: 'exerciseBlock',
          category: 'Barre',
          stars: 5,
          items: ['Développé couché', 'Développé incliné', 'Développé décliné']
        },
        {
          type: 'exerciseBlock',
          category: 'Haltères — incontournables',
          stars: 5,
          items: ['Développé couché haltères', 'Développé incliné haltères']
        },
        {
          type: 'exerciseBlock',
          category: 'Haltères — complément',
          stars: 4,
          items: ['Écartés haltères']
        },
        {
          type: 'exerciseBlock',
          category: 'Poulies — incontournables',
          stars: 5,
          items: ['Écartés à la poulie vis-à-vis', 'Cross-over']
        },
        {
          type: 'exerciseBlock',
          category: 'Poulies & machines — complément',
          stars: 4,
          items: ['Presse convergente', 'Pec Deck']
        },
        {
          type: 'portionTable',
          title: 'Quel exercice cible quelle portion ?',
          rows: [
            {
              label: 'Haut des pectoraux',
              exercises: ['Développé incliné', 'Pompes pieds surélevés', 'Écartés inclinés']
            },
            {
              label: 'Milieu des pectoraux',
              exercises: ['Développé couché', 'Pompes classiques', 'Écartés horizontaux']
            },
            {
              label: 'Bas des pectoraux',
              exercises: ['Dips penchés en avant', 'Développé décliné', 'Cross-over de haut en bas']
            }
          ]
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Les erreurs les plus fréquentes',
      blocks: erreursBlocks
    },
    {
      id: 'blessures',
      title: 'Blessures et problèmes fréquents',
      blocks: blessuresBlocks
    },
    {
      id: 'prevention',
      title: 'Prévention des blessures',
      blocks: [
        {
          type: 'p',
          text:
            'Un entraînement intelligent des pectoraux ne consiste pas seulement à pousser lourd. Il faut également développer la mobilité thoracique, les muscles du dos, les rotateurs externes de l’épaule et le contrôle scapulaire. Un ratio équilibré entre poussée et tirage est essentiel.'
        }
      ]
    },
    {
      id: 'volume',
      title: 'Fréquence et programmation',
      blocks: volumeBlocks
    },
    {
      id: 'saviez-vous',
      title: 'Le saviez-vous ?',
      blocks: saviezVousBlocks
    }
  ]
};

export default grandPectoral;
