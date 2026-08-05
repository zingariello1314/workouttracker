/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const avantBrasEnsemble = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation générale',
      blocks: [
        {
          type: 'p',
          text:
            'Les avant-bras sont le lien entre la force produite (dos, bras) et la main qui tient barre, anneaux ou adversaire. Sans prise solide, dorsaux et biceps plafonnent — facteur limitant fréquent en tractions, muscle-up, soulevés et escalade.'
        },
        {
          type: 'p',
          text:
            'Plus d’une vingtaine de muscles : fléchisseurs (paume), extenseurs (dos main), pronateurs/supinateurs, brachio-radial (transition coude, prise neutre).'
        }
      ]
    },
    {
      id: 'anatomie',
      title: 'Muscles clés',
      blocks: [
        {
          type: 'h3',
          text: 'Fléchisseurs des doigts'
        },
        {
          type: 'p',
          text:
            'Profond et superficiel — fermeture main, suspension, escalade. Fatigue prise avant le dos sur les tractions.'
        },
        {
          type: 'h3',
          text: 'Fléchisseurs et extenseurs du poignet'
        },
        {
          type: 'p',
          text:
            'Stabilisation du poignet en curl et en maintien de barre ; extenseurs équilibrent fléchisseurs (prévention épicondylalgies).'
        },
        {
          type: 'h3',
          text: 'Brachio-radial'
        },
        {
          type: 'p',
          text:
            'Flexion coude en prise neutre — curl marteau ; visible sur le côté externe. Voir aussi fiche Brachio-radial (famille Bras).'
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
            'Tractions, dead hang (endurance prise), tractions serviette, marche ours / appuis mains.'
        },
        {
          type: 'h3',
          text: 'Salle'
        },
        {
          type: 'p',
          text:
            'Farmer walk, curl marteau, wrist curl, reverse wrist curl, reverse curl.'
        },
        {
          type: 'exerciseBlock',
          category: 'Préhension & suspension',
          stars: 5,
          items: ['Tractions', 'Dead hang', 'Dead hang lesté', 'Farmer walk']
        },
        {
          type: 'exerciseBlock',
          category: 'Poignet et équilibre',
          stars: 5,
          items: ['Wrist curl', 'Reverse wrist curl', 'Reverse curl', 'Curl marteau']
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
            'Négliger extenseurs ; sangles systématiques (moins de travail prise) ; croire que poignets fins empêchent gros avant-bras — les muscles peuvent beaucoup grossir.'
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
            'Tendinopathies coude, épicondylalgie latérale (grimpeurs, tractions), douleurs poignet (pompes, anneaux) — progression et équilibre fléchisseurs/extenseurs.'
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
            'Force de préhension corrélée à marqueurs de condition ; grimpeurs = avant-bras extrêmes ; tendons récupèrent plus lentement que muscles.'
        }
      ]
    },
    {
      id: 'faq',
      title: 'Questions fréquentes',
      blocks: [
        {
          type: 'h3',
          text: 'Tractions suffisent ?'
        },
        {
          type: 'p',
          text: 'Souvent oui jusqu’à intermédiaire ; travail spécifique pour maximiser.'
        },
        {
          type: 'h3',
          text: 'Avant-bras brûlent avant le dos ?'
        },
        {
          type: 'p',
          text: 'La prise est souvent le maillon faible — normal, pas forcément un dos faible.'
        },
        {
          type: 'h3',
          text: 'Augmenter taille poignets ?'
        },
        {
          type: 'p',
          text: 'Non osseusement ; oui pour muscles autour.'
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
            'Esthétique, performance (tractions, carries, anneaux), santé poignet — bras complet = biceps + brachial + triceps + avant-bras + prise.'
        }
      ]
    }
  ]
};

export default avantBrasEnsemble;
