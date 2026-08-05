/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const grandDroit = {
  sections: [
    {
      id: 'presentation',
      title: 'Introduction — Le muscle des « tablettes »',
      blocks: [
        {
          type: 'p',
          text:
            'Le grand droit est le muscle abdominal le plus connu : vertical sur l’avant de l’abdomen, du bassin au sternum, séparé droite/gauche par la ligne blanche. Les « tablettes » ne sont pas des muscles distincts — ce sont les intersections tendineuses qui découpent visuellement le muscle.'
        },
        {
          type: 'p',
          text:
            'Son rôle dépasse l’esthétique : flexion du tronc (rapprocher cage thoracique et bassin), stabilisation du bassin, respiration forcée, pression intra-abdominale. Crunchs, relevés de buste, enroulement du bassin en suspension.'
        }
      ]
    },
    {
      id: 'anatomie',
      title: 'Origines et insertions',
      blocks: [
        {
          type: 'p',
          text:
            'Origines : pubis, symphyse pubienne. Insertions : processus xiphoïde du sternum, cartilages des côtes 5 à 7. Gaine du droit : aponévroses des autres muscles abdominaux.'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Crunchs : utiles mais mal compris',
      blocks: [
        {
          type: 'p',
          text:
            'Critiqués comme « non fonctionnels » — simpliste : le grand droit produit bien une flexion de colonne ; un mouvement contrôlé peut être pertinent pour le développer. Problème = excès : uniquement des crunchs, centaines de reps sans progression, négliger transverse, obliques et anti-rotation. Adapter le stimulus à l’objectif.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Poids du corps',
          stars: 5,
          items: [
            'Relevés de genoux suspendus (bassin en rétroversion)',
            'Reverse crunch',
            'Dragon flag (progression)',
            'Hollow body → relevés jambes'
          ]
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: ['Crunch poulie', 'Relevé de jambes lesté', 'Machine abdominale avec progression']
        }
      ]
    },
    {
      id: 'recrutement',
      title: 'Visibilité et développement',
      blocks: [
        {
          type: 'p',
          text:
            'Abdos visibles : surtout taux de masse grasse, taille du muscle, génétique de la séparation tendineuse — tout le monde possède un grand droit. Surcharge progressive, amplitude contrôlée, récupération ; combiner flexion dynamique et travail anti-extension (planche, ab wheel).'
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
            'Relevés de jambes sans rétroversion (fléchisseurs de hanche dominants). Chercher la brûlure sans progression. Crunchs seuls en oubliant le reste du core.'
        }
      ]
    },
    {
      id: 'faq',
      title: 'Questions fréquentes',
      blocks: [
        {
          type: 'h3',
          text: 'Faire des abdos enlève-t-il le ventre ?'
        },
        {
          type: 'p',
          text:
            'Non en localisation : renforce les muscles ; la graisse dépend de l’équilibre énergétique et de l’activité globale.'
        }
      ]
    }
  ]
};

export default grandDroit;
