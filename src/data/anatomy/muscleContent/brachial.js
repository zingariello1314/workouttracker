/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const brachial = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Le brachial est situé sous le biceps. En se développant, il pousse le biceps vers l’extérieur et augmente l’épaisseur du bras. Il ne croise pas l’épaule et ne supine pas — c’est un fléchisseur pur du coude.'
        },
        {
          type: 'callout',
          tone: 'tip',
          text: 'Esthétique ★★★★☆ · Hypertrophie ★★★★★ · Recrutement ★★★★★ — souvent sous-estimé.'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Fonctions',
      blocks: [
        {
          type: 'p',
          text: 'Flexion du coude en pronation, supination ou prise neutre — d’où l’efficacité des curls marteau et des tractions neutres.'
        }
      ]
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'exerciseBlock',
          category: 'Curl marteau',
          stars: 5,
          items: ['Curl marteau haltères', 'Curl marteau corde poulie']
        },
        {
          type: 'exerciseBlock',
          category: 'Tractions',
          stars: 4,
          items: ['Tractions prise neutre', 'Tractions marteau']
        }
      ]
    }
  ]
};

export default brachial;
