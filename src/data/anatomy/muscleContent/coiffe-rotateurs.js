/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const coiffeRotateurs = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Quand on parle des épaules, beaucoup ne voient que le deltoïde. Pourtant l’articulation repose sur un duo : muscles moteurs superficiels (volume et mouvement) et stabilisateurs profonds regroupés sous le nom de coiffe des rotateurs.'
        },
        {
          type: 'p',
          text:
            'Leur rôle n’est pas de produire de grands mouvements visibles, mais de maintenir la tête de l’humérus correctement positionnée dans la glène pendant que le bras bouge — développés, tractions, handstand, lancers. Sans cette centration, stabilité et risque de blessure se dégradent rapidement.'
        },
        {
          type: 'p',
          text:
            'L’épaule dépend énormément de la scapula. Lever le bras au-dessus de la tête implique le rythme scapulo-huméral : l’humérus monte, la scapula tourne vers le haut, la clavicule accompagne. Si cette coordination est mauvaise, certaines structures (dont le supra-épineux) peuvent être comprimées ou sursollicitées.'
        }
      ]
    },
    {
      id: 'muscles',
      title: 'Les quatre muscles de la coiffe',
      blocks: [
        {
          type: 'h3',
          text: 'Supra-épineux'
        },
        {
          type: 'p',
          text:
            'Situé au-dessus de l’épine scapulaire. Il initie les premiers degrés d’abduction avant que le deltoïde ne prenne le relais. Exposé aux tendinopathies et conflits sous-acromiaux lorsque l’épaule est mal positionnée ou compressée sous charge.'
        },
        {
          type: 'h3',
          text: 'Infra-épineux'
        },
        {
          type: 'p',
          text:
            'Juste sous le supra-épineux. Principal rotateur externe — stabilité essentielle en développé, lancer et tirage.'
        },
        {
          type: 'h3',
          text: 'Petit rond'
        },
        {
          type: 'p',
          text:
            'Synergie avec l’infra-épineux : rotation externe et centrage de l’humérus, notamment en fin d’amplitude.'
        },
        {
          type: 'h3',
          text: 'Subscapulaire'
        },
        {
          type: 'p',
          text:
            'Face antérieure de la scapula. Principal rotateur interne et stabilisateur dynamique qui équilibre les muscles postérieurs.'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Fonctions',
      blocks: [
        {
          type: 'p',
          text:
            'Ensemble, ces muscles produisent rotations interne et externe, participent à l’abduction initiale et surtout empêchent la tête humérale de « monter » ou glisser dans la glène sous charge.'
        },
        {
          type: 'p',
          text:
            'Un déficit se manifeste souvent par claquements, perte de force bras levé ou douleur progressive en poussée overhead — bien avant une rupture franche.'
        }
      ]
    },
    {
      id: 'renforcement',
      title: 'Comment renforcer la coiffe',
      blocks: [
        {
          type: 'p',
          text:
            'La coiffe progresse moins avec des charges lourdes qu’avec un travail précis : rotations externes à l’élastique ou à la poulie, face pulls bien exécutés, Full Can Raise, scapular push-up.'
        },
        {
          type: 'p',
          text:
            'Handstand, dips et développés lourds exigent une coiffe solide. Intégrer ce travail plusieurs fois par semaine, en charge légère et amplitude propre, est souvent plus rentable qu’un volume massif de développé militaire sans préparation.'
        },
        {
          type: 'exerciseBlock',
          category: 'Prévention & contrôle',
          stars: 5,
          items: ['Rotation externe élastique', 'Face pull', 'Full Can Raise', 'Scapular push-up']
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Erreurs fréquentes',
      blocks: [
        {
          type: 'p',
          text:
            'Ignorer la coiffe tant que « ça ne fait pas mal », puis augmenter brutalement le volume de poussée overhead — schéma classique vers tendinopathies et conflits.'
        },
        {
          type: 'p',
          text:
            'Rotations « balancées » avec charges trop lourdes : grand dorsal et trapèzes prennent le relais, pas les rotateurs.'
        },
        {
          type: 'p',
          text:
            'Confondre volume de deltoïde et santé articulaire : de grosses épaules sans coiffe entraînée restent vulnérables aux mouvements techniques du street workout.'
        }
      ]
    },
    {
      id: 'blessures',
      title: 'Blessures',
      blocks: [
        {
          type: 'p',
          text:
            'Tendinopathies du supra-épineux, lésions partielles de coiffe, bursite sous-acromiale et irritations chroniques en développé sont les tableaux les plus fréquents chez pratiquants de musculation et street workout.'
        },
        {
          type: 'p',
          text:
            'Un ratio équilibré poussée / tirage, mobilité thoracique et travail régulier du postérieur d’épaule réduisent nettement la fréquence de ces problèmes.'
        }
      ]
    }
  ]
};

export default coiffeRotateurs;
