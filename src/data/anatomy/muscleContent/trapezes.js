/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const trapezes = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Le trapèze est l’un des plus grands muscles du corps. En forme de losange, il recouvre la nuque, l’arrière des épaules et le haut du dos, de la base du crâne jusqu’au milieu de la colonne thoracique.'
        },
        {
          type: 'p',
          text:
            'Son rôle principal est le contrôle de la scapula (omoplate). Développer surtout le trapèze supérieur en négligeant les portions moyenne et inférieure favorise souvent épaules remontées et enroulées.'
        }
      ]
    },
    {
      id: 'portions',
      title: 'Les portions du trapèze',
      blocks: [
        {
          type: 'h3',
          text: 'Trapèze supérieur'
        },
        {
          type: 'p',
          text:
            'Entre la base du crâne, le cou et le sommet de l’épaule — la « bosse » visible sur des trapèzes développés. Origines : occipital, ligament nuchal, vertèbres cervicales. Insertions : clavicule et acromion.'
        },
        {
          type: 'ul',
          items: [
            'Élévation de la scapula (hausser les épaules)',
            'Rotation supérieure de l’omoplate',
            'Stabilisation du cou'
          ]
        },
        {
          type: 'h3',
          text: 'Trapèze moyen'
        },
        {
          type: 'p',
          text:
            'Entre les omoplates, sur les vertèbres thoraciques supérieures, insertion sur l’épine scapulaire. Fonction clé : rétraction — rapprocher les omoplates.'
        },
        {
          type: 'h3',
          text: 'Trapèze inférieur'
        },
        {
          type: 'p',
          text:
            'Portion basse entre les omoplates inférieures. Abaissement de la scapula, rotation supérieure, stabilisation au-dessus de la tête. Souvent la plus négligée — pourtant essentielle pour la coiffe et les développés.'
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
            'Trapèze supérieur : élévation et rotation supérieure de l’omoplate',
            'Trapèze moyen : rétraction scapulaire (épaisseur du dos)',
            'Trapèze inférieur : dépression / abaissement scapulaire, santé de l’épaule'
          ]
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Interaction haut du dos',
          text:
            'Le grand dorsal produit la force de tirage ; trapèze et rhomboïdes orientent l’omoplate ; le dentelé antérieur permet le glissement correct de la scapula sur le thorax.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Trapèze supérieur — salle',
          stars: 5,
          items: ['Shrugs haltères', 'Shrugs barre', 'Farmer walk']
        },
        {
          type: 'exerciseBlock',
          category: 'Trapèze supérieur — complément',
          stars: 4,
          items: ['Tirage vertical lourd', 'Rowing lourd (accessoire)']
        },
        {
          type: 'exerciseBlock',
          category: 'Trapèze moyen',
          stars: 5,
          items: ['Rowing barre', 'Rowing haltère', 'Tirage horizontal poulie', 'Reverse fly']
        },
        {
          type: 'exerciseBlock',
          category: 'Trapèze moyen — complément',
          stars: 4,
          items: ['Tractions avec rétraction scapulaire', 'Face pull']
        },
        {
          type: 'exerciseBlock',
          category: 'Trapèze inférieur',
          stars: 5,
          items: ['Y-raise', 'Face pull rotation externe', 'Rowing avec dépression scapulaire']
        },
        {
          type: 'exerciseBlock',
          category: 'Trapèze inférieur — complément',
          stars: 4,
          items: ['Tractions contrôlées', 'Élévations en Y haltères']
        },
        {
          type: 'exerciseBlock',
          category: 'Poids du corps (supérieur)',
          stars: 4,
          items: ['Tractions lourdes', 'Muscle-up', 'Carries', 'Maintien en équilibre']
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
            'Hausser systématiquement les épaules pendant les tirages → surcharge trapèze supérieur, moins de dorsaux / rhomboïdes.',
            'Ignorer trapèze inférieur alors que le volume de développés est élevé.',
            'Confondre « gros trapèzes » avec un dos complet : l’épaisseur demande surtout trapèze moyen et rowings.'
          ]
        }
      ]
    },
    {
      id: 'blessures',
      title: 'Blessures & épaule',
      blocks: [
        {
          type: 'ul',
          items: [
            'Trapèze inférieur faible → mauvaise position scapulaire, contraintes accrues sur la coiffe',
            'Tension chronique trapèze supérieur (stress, posture bureau + shrugs excessifs)'
          ]
        }
      ]
    },
    {
      id: 'saviez-vous',
      title: 'Application Momentum',
      blocks: [
        {
          type: 'callout',
          tone: 'tip',
          text:
            'Tractions = surtout largeur (dorsaux) ; rowings = davantage épaisseur (trapèze moyen, rhomboïdes). Trapèze supérieur = aussi esthétique cou (famille Cou). Équilibre supérieur / moyen / inférieur, pas seulement shrugs.'
        }
      ]
    }
  ]
};

export default trapezes;
