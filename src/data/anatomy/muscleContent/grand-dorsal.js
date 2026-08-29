import presentationBlocks from './grand-dorsal/presentationBlocks.js';
import portionsBlocks from './grand-dorsal/portionsBlocks.js';
import anatomieBlocks from './grand-dorsal/anatomieBlocks.js';
import fonctionsBlocks from './grand-dorsal/fonctionsBlocks.js';
import morphologieBlocks from './grand-dorsal/morphologieBlocks.js';
import recrutementBlocks from './grand-dorsal/recrutementBlocks.js';
import erreursBlocks from './grand-dorsal/erreursBlocks.js';
import blessuresBlocks from './grand-dorsal/blessuresBlocks.js';
import faqBlocks from './grand-dorsal/faqBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const grandDorsal = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: presentationBlocks
    },
    {
      id: 'portions',
      title: 'Les différentes zones',
      blocks: portionsBlocks
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
      id: 'morphologie',
      title: 'Morphologie et physique en V',
      blocks: morphologieBlocks
    },
    {
      id: 'recrutement',
      title: 'Comment développer efficacement le grand dorsal',
      blocks: recrutementBlocks
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'p',
          text:
            'Les tractions et tirages au poids du corps peuvent construire un dos très développé ; en salle, le tirage vertical, le rowing et le tirage bras tendus complètent la chaîne. Voici les mouvements les plus utiles et la logique de recrutement associée.'
        },
        {
          type: 'h3',
          text: 'Tractions pronation'
        },
        {
          type: 'p',
          text:
            'La traction est probablement l’exercice roi du grand dorsal au poids du corps. Elle développe la capacité du dos à produire une force importante en tirage vertical et sollicite fortement le grand dorsal, les biceps, les trapèzes et les muscles scapulaires. Pour maximiser le recrutement du dos, il faut éviter de simplement « monter avec les bras » : une bonne traction commence par un contrôle de l’omoplate, puis une descente du coude vers le bas.'
        },
        {
          type: 'h3',
          text: 'Tractions supination'
        },
        {
          type: 'p',
          text:
            'La prise supination augmente généralement la participation du biceps, mais reste excellente pour développer la force globale du tirage. Elle peut permettre davantage de répétitions chez certaines personnes tout en conservant un fort recrutement du dorsal.'
        },
        {
          type: 'h3',
          text: 'Tractions australiennes'
        },
        {
          type: 'p',
          text:
            'Très intéressantes pour apprendre à contrôler le dos : elles permettent un meilleur volume, un travail technique et une contraction plus facile à ressentir. Particulièrement adaptées aux débutants ou aux personnes voulant augmenter leur volume sans trop fatiguer les articulations.'
        },
        {
          type: 'h3',
          text: 'Muscle-up'
        },
        {
          type: 'p',
          text:
            'Mouvement très exigeant où le grand dorsal joue un rôle majeur dans la phase explosive qui tire le corps au-dessus de la barre. Il demande également puissance, coordination, gainage et technique.'
        },
        {
          type: 'h3',
          text: 'Tirage vertical'
        },
        {
          type: 'p',
          text:
            'Équivalent guidé des tractions en salle : charge ajustable et contrôle précis. Une erreur fréquente est de tirer uniquement avec les mains ; le mouvement doit être pensé comme une descente des coudes.'
        },
        {
          type: 'h3',
          text: 'Rowing haltère ou barre'
        },
        {
          type: 'p',
          text:
            'Même si le rowing est souvent associé à l’épaisseur du dos, il sollicite également fortement le grand dorsal. La trajectoire du coude influence le recrutement : un coude proche du corps favorise davantage le grand dorsal.'
        },
        {
          type: 'h3',
          text: 'Tirage bras tendus'
        },
        {
          type: 'p',
          text:
            'Excellent exercice d’isolation relative : il limite l’intervention des bras et permet de se concentrer sur la sensation de contraction du dorsal, en privilégiant l’extension de l’épaule plutôt que la flexion du coude.'
        },
        {
          type: 'exerciseBlock',
          category: 'Poids du corps — incontournables',
          stars: 5,
          items: [
            'Tractions pronation',
            'Tractions supination',
            'Tractions lestées'
          ]
        },
        {
          type: 'exerciseBlock',
          category: 'Poids du corps — intermédiaire',
          stars: 4,
          items: ['Tractions australiennes', 'Muscle-up']
        },
        {
          type: 'exerciseBlock',
          category: 'Barre & haltères — incontournables',
          stars: 5,
          items: ['Rowing barre', 'Rowing haltère', 'Tirage vertical (barre assistée)']
        },
        {
          type: 'exerciseBlock',
          category: 'Poulies — incontournables',
          stars: 5,
          items: [
            'Tirage vertical prise large',
            'Tirage vertical prise serrée',
            'Tirage bras tendus',
            'Rowing poulie'
          ]
        },
        {
          type: 'exerciseBlock',
          category: 'Poulies — complément',
          stars: 4,
          items: ['Pullover poulie', 'Tirage unilatéral']
        },
        {
          type: 'portionTable',
          title: 'Quel mouvement pour quel objectif ?',
          rows: [
            {
              label: 'Largeur — tirage vertical',
              exercises: [
                'Tractions pronation',
                'Tractions supination',
                'Tirage vertical prise large',
                'Tirage vertical prise serrée'
              ]
            },
            {
              label: 'Tirage horizontal (dorsal + épaisseur)',
              exercises: ['Rowing barre', 'Rowing haltère', 'Rowing poulie', 'Tractions australiennes']
            },
            {
              label: 'Extension / connexion mentale',
              exercises: ['Tirage bras tendus', 'Pullover poulie']
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
      title: 'Blessures fréquentes',
      blocks: blessuresBlocks
    },
    {
      id: 'saviez-vous',
      title: 'Le saviez-vous ?',
      blocks: [
        {
          type: 'h3',
          text: 'Le grand dorsal, « muscle de l’escalade »'
        },
        {
          type: 'p',
          text:
            'Les grimpeurs développent souvent des dorsaux impressionnants car leur sport exige exactement ses fonctions principales : tirer le bras vers le bas, rapprocher le corps d’un point fixe et stabiliser l’épaule.'
        },
        {
          type: 'h3',
          text: 'Connecté au bassin'
        },
        {
          type: 'p',
          text:
            'Beaucoup imaginent que le dos est uniquement lié aux bras. Pourtant, grâce à ses attaches sur le bassin et le fascia thoraco-lombaire, le grand dorsal participe aux transferts de force entre le haut et le bas du corps — l’une des raisons pour lesquelles il intervient dans certains mouvements athlétiques explosifs.'
        },
        {
          type: 'h3',
          text: 'Les meilleurs tireurs ne tirent pas avec leurs mains'
        },
        {
          type: 'p',
          text:
            'Un bon mouvement de dos commence rarement par les mains. Le pratiquant expérimenté pense plutôt à déplacer son coude ; cette modification mentale change souvent complètement le recrutement musculaire.'
        }
      ]
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
            'Dans Momentum, le grand dorsal représente la puissance de traction du haut du corps : tractions, escalade, street workout et esthétique du physique en V. Un volume élevé de tractions se reflète surtout sur la zone « dos » du Récap ; les rowings complètent l’épaisseur avec trapèze moyen et rhomboïdes.'
        },
        {
          type: 'p',
          text:
            'Un grand dorsal développé ne doit jamais être considéré seul : il fonctionne avec les trapèzes, les rhomboïdes, le dentelé antérieur et la coiffe des rotateurs. Un dos réellement complet n’est pas seulement large — il est large, dense, stable et capable de produire de la force. Équilibre tirages et poussées pour la santé des épaules.'
        }
      ]
    }
  ]
};

export default grandDorsal;
