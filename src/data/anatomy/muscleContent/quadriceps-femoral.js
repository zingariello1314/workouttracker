/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const quadricepsFemoral = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Quatre chefs convergent vers rotule et tendon rotulien — extension du genou, absorption des impacts (excentrique), stabilité rotule. Moteur avant de la jambe : marche, course, saut, squat.'
        }
      ]
    },
    {
      id: 'portions',
      title: 'Les quatre portions',
      blocks: [
        { type: 'h3', text: 'Droit fémoral' },
        {
          type: 'p',
          text: 'Seul chef biarticulaire — flexion hanche + extension genou. L-sit, relevés, sprint. Moins efficace si hanche et genou déjà fléchis (squat profond).'
        },
        { type: 'h3', text: 'Vaste latéral' },
        { type: 'p', text: 'Volume externe, force en poussée, largeur esthétique.' },
        { type: 'h3', text: 'Vaste médial (VMO)' },
        {
          type: 'p',
          text: 'Fin d’extension, trajectoire rotule — pas d’isolation parfaite, amplitude complète utile.'
        },
        { type: 'h3', text: 'Vaste intermédiaire' },
        { type: 'p', text: 'Profond sous le droit fémoral — masse et force globale.' }
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
          items: ['Squat profond', 'Squat bulgare', 'Step-up', 'Pistol squat (progression)', 'Sissy squat']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: ['Squat barre', 'Hack squat', 'Presse', 'Leg extension']
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
            'Amplitude trop courte',
            'Uniquement presse sans stabilité/coordination',
            'Déséquilibre vs ischio-jambiers',
            'Mythe genoux jamais devant les pieds — privilégier contrôle et progression'
          ]
        }
      ]
    }
  ]
};

export default quadricepsFemoral;
