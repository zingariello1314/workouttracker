/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const tricepsBrachial = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Le triceps est le muscle le plus volumineux du bras (~⅔ de la masse). Trois chefs (long, latéral, médial) convergent vers l’olécrâne. Extension du coude et pilier de toute chaîne de poussée.'
        }
      ]
    },
    {
      id: 'portions',
      title: 'Les trois chefs',
      blocks: [
        {
          type: 'h3',
          text: 'Chef long'
        },
        {
          type: 'p',
          text:
            'Seul chef qui traverse l’épaule (tubercule infraglénoïdal). Extension du coude, adduction du bras, stabilisation. Très sollicité bras au-dessus de la tête (extensions overhead).'
        },
        {
          type: 'h3',
          text: 'Chef latéral'
        },
        {
          type: 'p',
          text: 'Face externe — aspect « fer à cheval ». Extension du coude, poussées lourdes.'
        },
        {
          type: 'h3',
          text: 'Chef médial'
        },
        {
          type: 'p',
          text: 'Profond, moins visible. Présent dans presque toutes les extensions, force et contrôle fin.'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Biomécanique',
      blocks: [
        {
          type: 'ul',
          items: [
            'Extension du coude (pompes, dips, développé, pousser)',
            'Street workout : pompes, dips, HSPU, muscle-up',
            'Programme complet : poussée lourde + position étirée (chef long) + travail contrôlé'
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
          items: ['Dips (buste vertical)', 'Pompes diamant', 'Pompes serrées', 'Handstand push-up']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: [
            'Développé couché prise serrée',
            'Extension au-dessus de la tête',
            'Barre au front',
            'Pushdown poulie'
          ]
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
            'Dips : descente trop profonde sans contrôle, épaules en avant',
            'Ignorer le chef long (pas d’extensions overhead)',
            'Morphologie : longueur des ventres et tendons (génétique)'
          ]
        }
      ]
    }
  ]
};

export default tricepsBrachial;
