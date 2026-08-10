/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const brachial = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation — Brachial antérieur',
      blocks: [
        {
          type: 'p',
          text:
            'Le brachial antérieur est sous le biceps, sans attache sur l’omoplate : fléchisseur « pur » du coude — flexion en supination, pronation ou prise neutre. En grossissant, il pousse le biceps vers l’extérieur et épaissit le bras.'
        },
        {
          type: 'p',
          text:
            'Origine sur la face antérieure distale de l’humérus ; insertion sur la tubérosité de l’ulna — efficace quelle que soit la rotation de la main.'
        },
        {
          type: 'figure',
          src: '/anatomy/brachial/planche-anatomie-bras.jpg',
          caption:
            'Planche « Les bras » : le brachial est visible en profondeur sous le biceps ; il n’attache pas sur la scapula et fléchit le coude quelle que soit la prise.',
          alt: 'Anatomie des muscles du bras, brachial sous le biceps'
        }
      ]
    },
    {
      id: 'recrutement',
      title: 'Street workout et épaisseur',
      blocks: [
        {
          type: 'p',
          text:
            'Très sollicité en tractions pronation, prise neutre, escalade et suspension — là où le biceps est moins avantagé mécaniquement.'
        },
        {
          type: 'figure',
          src: '/anatomy/biceps/flechisseurs-prise-neutre.jpg',
          caption:
            'Curl marteau (prise neutre) : le brachial et le brachio-radial montent en contribution ; le biceps reste actif mais n’est plus seul moteur de la flexion.',
          alt: 'Curl marteau, brachial et biceps'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'h3',
          text: 'Tractions et curls'
        },
        {
          type: 'p',
          text:
            'Tractions pronation et neutre ; chin-up descente lente ; curl marteau, pupitre neutre, reverse curl.'
        },
        {
          type: 'exerciseBlock',
          category: 'Incontournables',
          stars: 5,
          items: ['Tractions pronation', 'Tractions prise neutre', 'Curl marteau', 'Curl pupitre neutre']
        },
        {
          type: 'exerciseBlock',
          category: 'Complément',
          stars: 4,
          items: ['Reverse curl', 'Chin-up tempo lent']
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Erreurs et blessures',
      blocks: [
        {
          type: 'p',
          text:
            'Uniquement curls supination : privilégier neutre/pronation pour l’épaisseur. Progression trop rapide tractions/curls → tendinites fléchisseurs coude.'
        }
      ]
    },
    {
      id: 'saviez-vous',
      title: 'Le saviez-vous ?',
      blocks: [
        {
          type: 'p',
          text:
            'Il peut faire paraître le biceps plus gros sans augmenter son volume ; facteur limitant en traction ; grimpeurs souvent très développés.'
        }
      ]
    },
    {
      id: 'faq',
      title: 'FAQ brachial',
      blocks: [
        {
          type: 'h3',
          text: 'Isolation complète ?'
        },
        {
          type: 'p',
          text: 'Non — prise neutre et pronation augmentent son implication relative.'
        },
        {
          type: 'h3',
          text: 'Bras fin de profil ?'
        },
        {
          type: 'p',
          text: 'Développer brachial, triceps et brachio-radial — pas seulement biceps.'
        }
      ]
    },
    {
      id: 'coraco-brachial',
      title: 'Coraco-brachial',
      blocks: [
        {
          type: 'p',
          text:
            'Petit muscle antérieur du bras : origine processus coracoïde (même carrefour que chef court biceps et petit pectoral), insertion face médiale humérus.'
        },
        {
          type: 'p',
          text:
            'Flexion d’épaule, adduction légère, stabilisation humérus — sollicité en dips, développé militaire, pompes profondes. Rarement ciblé directement ; équilibre poussée/tirage/mobilité suffit.'
        },
        {
          type: 'ul',
          items: ['Dips', 'Développé militaire', 'Pompes profondes']
        },
        {
          type: 'p',
          text:
            'Douleurs antérieures épaule ou tensions coracoïde possibles avec excès de poussée sans tirage.'
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
            'Brachial = épaisseur et tractions ; coraco-brachial = stabilité épaule en poussée. Bras complet : biceps puissant, brachial développé, épaule stable.'
        }
      ]
    }
  ]
};

export default brachial;
