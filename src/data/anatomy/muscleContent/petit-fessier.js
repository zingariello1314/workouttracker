/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const petitFessier = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Le plus profond des fessiers — stabilisateur de la tête fémorale dans l’acétabulum. Abduction, rotation interne, contrôle fin en appui unipodal (course, changements de direction). Analogie : coiffe de la hanche.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Activation',
          stars: 5,
          items: ['Clamshell', 'Élévation latérale bassin fixe', 'Side plank abduction']
        },
        {
          type: 'exerciseBlock',
          category: 'Fonctionnel',
          stars: 5,
          items: ['Abduction poulie', 'Bulgarian split squat', 'Équilibre unipodal']
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Erreurs',
      blocks: [
        {
          type: 'ul',
          items: [
            'Mouvements rapides sans contrôle',
            'Chercher uniquement la brûlure (priorité à la précision)',
            'Négliger le travail sur une jambe'
          ]
        }
      ]
    }
  ]
};

export default petitFessier;
