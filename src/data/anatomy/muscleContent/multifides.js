/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const multifides = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Les multifides sont des muscles profonds au contact de la colonne. Ils ne produisent pas de grands mouvements visibles : ils ajustent finement la position de chaque vertèbre pour maintenir une colonne stable et efficace.'
        },
        {
          type: 'p',
          text:
            'Indispensables en course, sauts, soulevés lourds et gainage : un déficit de contrôle profond peut faire compenser certaines zones et augmenter les contraintes mécaniques.'
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Profil Momentum',
          text:
            'Fonctionnel ★★★★★ · Prévention ★★★★★ · Esthétique visible ★☆☆☆☆ · Recrutement conscient souvent nécessaire.'
        }
      ]
    },
    {
      id: 'anatomie',
      title: 'Anatomie',
      blocks: [
        {
          type: 'p',
          text:
            'Groupe transverso-épineux : nombreux petits faisceaux reliant vertèbres adjacentes, action locale segment par segment (contrairement aux longs érecteurs).'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Fonctions',
      blocks: [
        {
          type: 'ul',
          items: [
            'Extension bilatérale de la colonne',
            'Rotation et inclinaison unilatérales',
            'Stabilisation intervertébrale (fonction prioritaire)'
          ]
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Contrôle moteur',
          stars: 5,
          items: ['Bird dog', 'Dead bug', 'Gainage dynamique contrôlé']
        },
        {
          type: 'exerciseBlock',
          category: 'Prévention',
          stars: 5,
          items: ['Pallof press', 'Planche latérale', 'Marche lestée stable']
        },
        {
          type: 'exerciseBlock',
          category: 'Hypertrophie directe',
          stars: 1,
          items: ['Peu d’isolation — renforcement indirect via stabilité']
        }
      ]
    },
    {
      id: 'recrutement',
      title: 'Core & chaîne postérieure',
      blocks: [
        {
          type: 'p',
          text:
            'Les multifides travaillent avec le transverse, les obliques, le diaphragme, les érecteurs et le plancher pelvien. La stabilité du tronc = pression et contrôle globaux, pas un muscle isolé.'
        },
        {
          type: 'ul',
          items: [
            'Équilibre chaîne antérieure / postérieure',
            'Fessiers et ischio-jambiers actifs pour ne pas sur-solliciter les lombaires',
            'Haut du dos (rétraction) pour une posture globale cohérente'
          ]
        }
      ]
    },
    {
      id: 'blessures',
      title: 'Mobilité & santé',
      blocks: [
        {
          type: 'ul',
          items: [
            'Hanches raides → compensation lombaire',
            'Thorax raide → contraintes sur les lombaires',
            'Fessiers peu actifs → érecteurs surmenés'
          ]
        },
        {
          type: 'callout',
          tone: 'tip',
          text:
            'Un bon entraînement du bas du dos combine renforcement, contrôle moteur, mobilité et progression — pas un exercice miracle ni l’évitement systématique des lombaires.'
        }
      ]
    }
  ]
};

export default multifides;
