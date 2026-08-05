/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const grandDroit = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Le grand droit est le muscle vertical de l’avant du ventre, séparé par la ligne blanche. Les intersections tendineuses créent l’aspect « tablettes » lorsque la masse grasse est suffisamment basse — mais son rôle moteur est surtout la flexion du tronc et le contrôle du bassin.'
        }
      ]
    },
    {
      id: 'anatomie',
      title: 'Anatomie',
      blocks: [
        {
          type: 'ul',
          items: [
            'Origines : crête et symphyse pubiennes',
            'Insertions : processus xiphoïde et cartilages des côtes 5–7',
            'Gaine du droit : aponévroses des autres abdominaux'
          ]
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
            'Flexion du tronc (crunch, relevé de buste)',
            'Stabilisation anti-extension (squat, traction)',
            'Contrôle de l’inclinaison du bassin'
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
          category: 'Poids du corps',
          stars: 5,
          items: ['Relevés de genoux suspendu', 'Crunch', 'Dragon flag']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: ['Crunch poulie', 'Machine abdominale', 'Relevé de jambes lesté']
        }
      ]
    },
    {
      id: 'recrutement',
      title: 'Développement',
      blocks: [
        {
          type: 'p',
          text:
            'Surcharge progressive, amplitude contrôlée et récupération — pas seulement des centaines de reps d’endurance. Visibilité = masse musculaire + taux de gras + génétique (nombre de « blocs », symétrie).'
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
            'Relevés de jambes sans rétroversion du bassin (fléchisseurs de hanche dominants)',
            'Chercher uniquement la brûlure sans progression',
            'Crunchs seuls en négligeant transverse et obliques'
          ]
        }
      ]
    }
  ]
};

export default grandDroit;
