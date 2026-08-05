/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const bicepsBrachial = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation générale',
      blocks: [
        {
          type: 'p',
          text:
            'Le biceps brachial est le muscle le plus connu de l’avant-bras — « bi » = deux chefs. Ils convergent vers un tendon commun sur le radius. Il ne représente qu’une partie du volume du bras (le triceps en forme la majorité), mais il est central en flexion, supination et tractions.'
        },
        {
          type: 'p',
          text:
            'En street workout, il joue un rôle majeur : tractions, tirages, port de charges. Un bras complet associe fléchisseurs, extenseurs et avant-bras.'
        }
      ]
    },
    {
      id: 'portions',
      title: 'Chef long et chef court',
      blocks: [
        {
          type: 'p',
          text:
            'Deux chefs, un muscle — la position du bras modifie la tension ; on ne isole pas totalement l’un sans l’autre.'
        },
        {
          type: 'h3',
          text: 'Chef long — Tubercule supraglénoïdal'
        },
        {
          type: 'p',
          text:
            'Portion externe, tendon traverse l’épaule — « pic » du biceps selon génétique (longueur tendon, ventre musculaire). Flexion d’épaule légère ; tendinopathie du chef long possible avec volume élevé de tractions et développés.'
        },
        {
          type: 'ul',
          items: ['Curl incliné', 'Curl supination forte', 'Chin-ups']
        },
        {
          type: 'h3',
          text: 'Chef court — Processus coracoïde'
        },
        {
          type: 'p',
          text:
            'Portion interne, épaisseur du bras. Même flexion et supination que le chef long.'
        }
      ]
    },
    {
      id: 'anatomie',
      title: 'Insertion',
      blocks: [
        {
          type: 'p',
          text:
            'Tubérosité du radius ; aponévrose bicipitale vers l’avant-bras. Trois fonctions : flexion du coude, supination (paume vers le haut), participation à la flexion d’épaule (chef long).'
        }
      ]
    },
    {
      id: 'recrutement',
      title: 'Comment le développer',
      blocks: [
        {
          type: 'p',
          text:
            'Tension mécanique, amplitude, progression, proximité de l’échec, variété d’angles. Bras derrière le corps (curl incliné) étire le chef long ; bras devant le raccourcit l’épaule côté biceps.'
        },
        {
          type: 'p',
          text:
            'Erreurs : charge excessive avec élan du dos et des épaules ; négliger la phase négative ; croire que le pic en haut suffit sans étirement et répétitions efficaces.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'h3',
          text: 'Poids du corps'
        },
        {
          type: 'p',
          text:
            'Chin-ups (supination) : charge relative élevée ; tractions australiennes supination pour le volume ; curl sur barre basse.'
        },
        {
          type: 'h3',
          text: 'Salle'
        },
        {
          type: 'p',
          text:
            'Curl incliné (chef long), curl pupitre, curl barre. Curl marteau surtout brachial/brachio-radial mais complète l’épaisseur.'
        },
        {
          type: 'exerciseBlock',
          category: 'Poids du corps — incontournables',
          stars: 5,
          items: ['Tractions supination', 'Tractions australiennes supination', 'Curl barre basse']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle — incontournables',
          stars: 5,
          items: ['Curl incliné haltères', 'Curl pupitre', 'Curl barre']
        }
      ]
    },
    {
      id: 'blessures',
      title: 'Blessures',
      blocks: [
        {
          type: 'h3',
          text: 'Tendinopathie chef long'
        },
        {
          type: 'p',
          text: 'Douleur avant épaule, gêne curls ou bras levé — volume tractions + développés.'
        },
        {
          type: 'h3',
          text: 'Déchirure'
        },
        {
          type: 'p',
          text: 'Effort brutal, charge qui chute — fatigue et préparation insuffisantes.'
        }
      ]
    },
    {
      id: 'saviez-vous',
      title: 'Le saviez-vous ?',
      blocks: [
        {
          type: 'h3',
          text: 'Pas le plus gros muscle du bras'
        },
        {
          type: 'p',
          text: 'Le triceps domine le volume — maximiser le tour de bras exige un triceps développé.'
        },
        {
          type: 'h3',
          text: 'Génétique et forme'
        },
        {
          type: 'p',
          text: 'Insertions et longueur du ventre modifient l’aspect ; l’entraînement développe, ne change pas les attaches.'
        },
        {
          type: 'h3',
          text: 'Tractions = vrai travail biceps'
        },
        {
          type: 'p',
          text: 'Les chin-ups peuvent être le principal exercice biceps en street workout.'
        }
      ]
    },
    {
      id: 'faq',
      title: 'Questions fréquentes',
      blocks: [
        {
          type: 'h3',
          text: 'Isoler chef long ou court ?'
        },
        {
          type: 'p',
          text: 'Non totalement — les deux travaillent ensemble ; certains angles modifient la proportion de recrutement.'
        },
        {
          type: 'h3',
          text: 'Fréquence hebdomadaire ?'
        },
        {
          type: 'p',
          text: 'Souvent deux stimulations suffisent avec le volume indirect du dos.'
        },
        {
          type: 'h3',
          text: 'Curls obligatoires ?'
        },
        {
          type: 'p',
          text: 'Non — tractions suffisent pour beaucoup ; les curls ajoutent volume et ciblage.'
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
            'Biceps = esthétique, force, street workout, tractions — mais bras complet = biceps + brachial épais + triceps dominant + avant-bras solides.'
        }
      ]
    }
  ]
};

export default bicepsBrachial;
