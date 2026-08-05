/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const ischioJambiers = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Biceps fémoral (long + court), semi-tendineux, semi-membraneux — biarticulaires (hanche + genou). Extension hanche, flexion genou, freinage excentrique en sprint. Équilibre avec quadriceps pour stabilité du genou.'
        }
      ]
    },
    {
      id: 'portions',
      title: 'Les trois muscles',
      blocks: [
        { type: 'h3', text: 'Biceps fémoral' },
        { type: 'p', text: 'Externe — chef long (ischion), sprint et rotation externe tibia.' },
        { type: 'h3', text: 'Semi-tendineux' },
        { type: 'p', text: 'Interne — patte d’oie, rotation interne, course.' },
        { type: 'h3', text: 'Semi-membraneux' },
        { type: 'p', text: 'Profond — stabilité genou, extension hanche.' }
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
          items: ['Nordic curl', 'Glute ham raise', 'Sliding leg curl', 'Single-leg RDL PDC']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: ['Soulevé roumain (RDL)', 'Leg curl couché/assis', 'Good morning', 'Soulevé de terre']
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
            'Uniquement leg curl sans charnière hanche (RDL)',
            'Manque de travail excentrique (Nordic)',
            'Négligence vs volume quadriceps / presse'
          ]
        }
      ]
    },
    {
      id: 'saviez-vous',
      title: 'Équilibre',
      blocks: [
        {
          type: 'callout',
          tone: 'tip',
          text: 'Flexion genou + extension hanche. L-sit : ischios raides limitent jambes tendues — mobilité + force. Voir Fessiers.'
        }
      ]
    }
  ]
};

export default ischioJambiers;
