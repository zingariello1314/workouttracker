/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const trapezes = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation générale',
      blocks: [
        {
          type: 'p',
          text:
            'Le trapèze est probablement l’un des muscles les plus mal compris du corps. L’imaginaire collectif ne voit souvent que la masse entre le cou et l’épaule ; en réalité, c’est un muscle immense en forme de losange, de la base du crâne au milieu de la colonne thoracique, qui relie la colonne à la scapula.'
        },
        {
          type: 'p',
          text:
            'Son rôle dépasse l’esthétique : c’est un centre de contrôle de l’omoplate. Chaque traction, port de charge ou bras levé au-dessus de la tête l’implique. Un trapèze équilibré améliore stabilité, transmission de force et posture ; un déséquilibre entre portions favorise épaules enroulées, tensions cervicales et perte de contrôle scapulaire.'
        },
        {
          type: 'p',
          text:
            'La scapula n’est pas fixée par une articulation osseuse classique : le trapèze participe à sa rotation supérieure, rétraction, élévation et dépression. Une mauvaise position de la scapula modifie directement le mouvement de l’humérus.'
        }
      ]
    },
    {
      id: 'portions',
      title: 'Les trois portions du trapèze',
      blocks: [
        {
          type: 'p',
          text:
            'Trois faisceaux, un seul muscle — chacun tire la scapula selon un axe différent. Un dos mature exige un équilibre supérieur / moyen / inférieur, pas seulement des shrugs.'
        },
        {
          type: 'h3',
          text: 'Trapèze supérieur — Puissance et nuque'
        },
        {
          type: 'p',
          text:
            'Zone entre base du cou, clavicule et sommet de l’épaule. Origines : occipital, ligament nuchal, vertèbres cervicales. Insertions : clavicule et acromion.'
        },
        {
          type: 'p',
          text:
            'Fonctions : élévation de la scapula (shrug) et rotation supérieure lorsque le bras monte au-dessus de la tête. Développé indirectement par soulevés de terre, farmer walk, rowings et tractions lourdes.'
        },
        {
          type: 'ul',
          items: ['Shrugs haltères', 'Farmer walk', 'Tirages lourds (accessoire)']
        },
        {
          type: 'h3',
          text: 'Trapèze moyen — Densité entre les omoplates'
        },
        {
          type: 'p',
          text:
            'Entre les omoplates, origine sur vertèbres thoraciques supérieures, insertion sur acromion et épine scapulaire. Fonction clé : rétraction — rapprocher les omoplates (serrer les épaules en arrière).'
        },
        {
          type: 'p',
          text:
            'Responsable de l’impression de dos « épais » : de grands dorsaux sans trapèze moyen manquent de relief. Rowings horizontaux et reverse fly avec contrôle scapulaire sont prioritaires.'
        },
        {
          type: 'ul',
          items: ['Rowing horizontal', 'Reverse fly', 'Face pull']
        },
        {
          type: 'h3',
          text: 'Trapèze inférieur — Santé de l’épaule'
        },
        {
          type: 'p',
          text:
            'Portion la plus négligée, entre omoplates inférieures et colonne. Abaissement de la scapula, rotation supérieure, stabilisation bras au-dessus de la tête — travaille avec le supérieur pour la mécanique overhead.'
        },
        {
          type: 'p',
          text:
            'Supérieur dominant + inférieur faible → épaules remontées, mobilité réduite, tensions cervicales. Qualité du mouvement prioritaire sur la charge.'
        },
        {
          type: 'ul',
          items: ['Y-raise', 'Face pull rotation externe', 'Wall slides']
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'h3',
          text: 'Shrugs et farmer walk'
        },
        {
          type: 'p',
          text:
            'Shrugs : monter la scapula verticalement, pause brève, redescente contrôlée — éviter la rotation des épaules vers l’arrière en haut. Farmer walk : trapèzes, gainage, préhension et stabilité proches de la vie réelle.'
        },
        {
          type: 'h3',
          text: 'Rowing et face pull'
        },
        {
          type: 'p',
          text:
            'Rowing : laisser l’omoplate avancer en bas, ramener le coude, finir en contraction — pas seulement déplacer le poids. Face pull : trapèze moyen et inférieur, deltoïde postérieur et coiffe — idéal si beaucoup de poussée.'
        },
        {
          type: 'h3',
          text: 'Y-raise et wall slides'
        },
        {
          type: 'p',
          text:
            'Y-raise pour recruter le trapèze inférieur sans charge excessive. Wall slides pour le contrôle scapulaire et les épaules enroulées.'
        },
        {
          type: 'exerciseBlock',
          category: 'Trapèze supérieur',
          stars: 5,
          items: ['Shrugs haltères', 'Farmer walk', 'Shrugs barre']
        },
        {
          type: 'exerciseBlock',
          category: 'Trapèze moyen',
          stars: 5,
          items: ['Rowing barre', 'Rowing haltère', 'Reverse fly', 'Tirage horizontal poulie']
        },
        {
          type: 'exerciseBlock',
          category: 'Trapèze inférieur',
          stars: 5,
          items: ['Y-raise', 'Face pull', 'Wall slides', 'Rowing dépression scapulaire']
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
            'Garder les épaules remontées pendant tous les tirages : domination du trapèze supérieur, moins de dorsaux et rhomboïdes. L’objectif n’est pas de hausser les épaules mais de déplacer l’omoplate correctement.'
        },
        {
          type: 'p',
          text:
            'Croire que « plus de trapèzes » = plus esthétique : un supérieur très dominant peut réduire visuellement la largeur d’épaule. Équilibre global.'
        },
        {
          type: 'p',
          text:
            'Maintenir une rétraction maximale permanente : la scapula doit rester mobile — bon mouvement = alternance mouvement, contrôle, contraction.'
        },
        {
          type: 'p',
          text:
            'Penser que les shrugs suffisent à un dos complet : ils ciblent surtout le supérieur, pas les rowings ni le travail de stabilité.'
        }
      ]
    },
    {
      id: 'saviez-vous',
      title: 'Le saviez-vous ?',
      blocks: [
        {
          type: 'h3',
          text: 'Muscle de précision'
        },
        {
          type: 'p',
          text:
            'Une grande part de son rôle consiste en ajustements fins de l’omoplate, pas seulement en puissance brute.'
        },
        {
          type: 'h3',
          text: 'Fort sans être énorme'
        },
        {
          type: 'p',
          text:
            'Un gymnaste peut avoir un contrôle scapulaire exceptionnel sans trapèzes hypertrophiés.'
        },
        {
          type: 'h3',
          text: 'Actif au quotidien'
        },
        {
          type: 'p',
          text: 'Posture debout, sac, ordinateur : activité constante des muscles scapulaires.'
        }
      ]
    },
    {
      id: 'faq',
      title: 'Questions fréquentes',
      blocks: [
        {
          type: 'h3',
          text: 'Entraîner directement les trapèzes ?'
        },
        {
          type: 'p',
          text:
            'Ils reçoivent déjà tractions, rowings, développés et carries. Le trapèze inférieur bénéficie souvent d’un travail spécifique (Y-raise, face pull).'
        },
        {
          type: 'h3',
          text: 'Trapèzes supérieurs toujours contractés ?'
        },
        {
          type: 'p',
          text:
            'Stress, posture, dominance musculaire ou technique. Renforcer uniquement le supérieur n’est pas toujours la solution — équilibrer avec inférieur et dentelé.'
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
            'Le trapèze relie colonne, épaules et bras. Son développement améliore stabilité, posture, force et longévité articulaire. Un haut du dos Momentum équilibre trapèze supérieur (puissance), moyen (densité) et inférieur (contrôle) — pas seulement la nuque épaisse.'
        }
      ]
    }
  ]
};

export default trapezes;
