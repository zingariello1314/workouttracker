/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const soleaire = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Muscle profond sous le gastrocnémien — uniquement cheville (pas le genou). Genou fléchi (mollets assis) : soléaire prioritaire. Endurance debout, marche longue, fibres résistantes à la fatigue. Partie majeure du volume réel du triceps sural + tendon d’Achille.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Mollets assis',
          stars: 5,
          items: ['Seated calf raise', 'Mollets assis barre/haltères']
        }
      ]
    },
    {
      id: 'programme',
      title: 'Complément debout',
      blocks: [
        {
          type: 'callout',
          tone: 'tip',
          text: 'Développement complet : mollets debout (gastroc) + assis (soléaire) 2–4×/sem., amplitude complète. Voir Tibial antérieur (famille Tibia) pour l’équilibre cheville.'
        }
      ]
    }
  ]
};

export default soleaire;
