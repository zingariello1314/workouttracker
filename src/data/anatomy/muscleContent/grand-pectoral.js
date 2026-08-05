/** @typedef {{ type: 'p'|'h3'|'ul'|'callout'|'exerciseBlock'|'portionTable', text?: string, items?: string[], title?: string, tone?: 'tip'|'warn', category?: string, stars?: number, rows?: { label: string, exercises: string[] }[] }} AnatomyBlock */

/** @type {{ sections: { id: string, title: string, blocks: AnatomyBlock[] }[] }} */
const grandPectoral = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Le grand pectoral est un muscle large, épais et puissant qui s’étend de la clavicule, du sternum et des côtes jusqu’à l’humérus. Sa forme en éventail lui permet de produire des mouvements dans plusieurs directions selon les fibres recrutées.'
        },
        {
          type: 'p',
          text:
            'C’est l’un des muscles les plus sollicités dans les sports de force, de lancer, d’escalade, de gymnastique et dans pratiquement tous les mouvements de poussée.'
        }
      ]
    },
    {
      id: 'portions',
      title: 'Les différentes portions',
      blocks: [
        {
          type: 'p',
          text:
            'Il ne s’agit pas de trois muscles différents mais d’un seul muscle composé de trois faisceaux dont le niveau de participation varie selon l’angle du mouvement.'
        },
        {
          type: 'h3',
          text: 'Faisceau claviculaire (haut des pectoraux)'
        },
        {
          type: 'p',
          text:
            'Partie supérieure, origine claviculaire. Sollicité lorsque le bras monte devant le corps — impression de torse « plein » sous les clavicules.'
        },
        {
          type: 'h3',
          text: 'Faisceau sterno-costal (milieu)'
        },
        {
          type: 'p',
          text: 'Plus grande masse du muscle. Très actif en poussée horizontale (développé couché, pompes classiques).'
        },
        {
          type: 'h3',
          text: 'Faisceau abdominal (bas)'
        },
        {
          type: 'p',
          text:
            'Portion inférieure, origine sur la gaine du grand droit. Davantage sollicitée quand le bras pousse vers le bas (dips, décliné).'
        }
      ]
    },
    {
      id: 'anatomie',
      title: 'Anatomie',
      blocks: [
        {
          type: 'h3',
          text: 'Origines'
        },
        {
          type: 'ul',
          items: [
            'Moitié médiale de la clavicule',
            'Face antérieure du sternum',
            'Cartilages des six premières côtes',
            'Gaine du muscle droit de l’abdomen'
          ]
        },
        {
          type: 'h3',
          text: 'Insertion'
        },
        {
          type: 'p',
          text:
            'Toutes les fibres convergent vers la lèvre latérale du sillon intertuberculaire de l’humérus — d’où des directions de tirage légèrement différentes selon la portion.'
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
            'Adduction du bras (rapprocher le bras du corps)',
            'Adduction horizontale (ramener le bras devant soi)',
            'Rotation interne de l’épaule',
            'Flexion de l’épaule (faisceau claviculaire)',
            'Extension depuis une flexion (faisceaux inférieurs)'
          ]
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'En pratique',
          text: 'Pompes, développé couché ou pousser une porte : le grand pectoral est au centre du geste.'
        }
      ]
    },
    {
      id: 'recrutement',
      title: 'Comment bien le recruter',
      blocks: [
        {
          type: 'p',
          text:
            'Il répond mieux quand les bras se rapprochent (penser à « serrer la poitrine ») plutôt qu’à tendre les coudes seuls. Amplitude complète + contraction volontaire en fin de mouvement améliorent souvent la sensation de travail.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Poids du corps — incontournables',
          stars: 5,
          items: [
            'Pompes classiques',
            'Pompes lestées',
            'Dips',
            'Pompes inclinées',
            'Pompes déclinées'
          ]
        },
        {
          type: 'exerciseBlock',
          category: 'Poids du corps — intermédiaire',
          stars: 4,
          items: ['Archer push-ups', 'Ring push-ups', 'Korean dips', 'Pseudo planche push-ups']
        },
        {
          type: 'exerciseBlock',
          category: 'Barre',
          stars: 5,
          items: ['Développé couché', 'Développé incliné', 'Développé décliné']
        },
        {
          type: 'exerciseBlock',
          category: 'Haltères',
          stars: 5,
          items: ['Développé couché haltères', 'Développé incliné haltères', 'Écartés haltères']
        },
        {
          type: 'exerciseBlock',
          category: 'Poulies',
          stars: 5,
          items: ['Écartés poulie vis-à-vis', 'Cross-over']
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
              label: 'Milieu',
              exercises: ['Développé couché', 'Pompes classiques', 'Écartés horizontaux']
            },
            {
              label: 'Bas',
              exercises: ['Dips', 'Développé décliné', 'Cross-over haut → bas']
            }
          ]
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Erreurs fréquentes',
      blocks: [
        {
          type: 'ul',
          items: [
            'Charges trop lourdes au détriment de l’amplitude → épaules et triceps prennent le relais.',
            'Épaules qui partent vers l’avant → moins de pecs, plus de contrainte gléno-humérale.',
            'Croire isoler totalement haut ou bas : les faisceaux travaillent ensemble, seule la participation relative change.'
          ]
        }
      ]
    },
    {
      id: 'blessures',
      title: 'Blessures',
      blocks: [
        {
          type: 'ul',
          items: [
            'Tendinopathie du grand pectoral',
            'Élongation musculaire',
            'Déchirure partielle',
            'Rupture complète (rare, souvent sur DC très lourd)'
          ]
        }
      ]
    },
    {
      id: 'volume',
      title: 'Volume & fréquence',
      blocks: [
        {
          type: 'p',
          text:
            'En général : environ 2 séances / semaine, 10 à 20 séries de qualité selon le niveau. Surcharge progressive, amplitude et technique restent les leviers principaux.'
        }
      ]
    },
    {
      id: 'saviez-vous',
      title: 'Le saviez-vous ?',
      blocks: [
        {
          type: 'callout',
          tone: 'tip',
          text:
            'Les « pectoraux internes » n’existent pas anatomiquement : impossible d’isoler la zone sternale. La séparation entre les deux grands pectoraux dépend surtout de l’anatomie individuelle et du taux de masse grasse.'
        }
      ]
    }
  ]
};

export default grandPectoral;
