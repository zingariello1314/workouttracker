/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const pyramidal = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Petit muscle triangulaire en bas de la ligne blanche, absent chez une partie de la population. Rôle surtout structurel : tension de la ligne blanche, impact moteur et sportif limité.'
        }
      ]
    },
    {
      id: 'fonctions',
      title: 'Fonction',
      blocks: [
        {
          type: 'p',
          text: 'Participation à la tension de la paroi médiane ; pas de programme d’isolation dédié en pratique courante.'
        }
      ]
    }
  ]
};

export default pyramidal;
