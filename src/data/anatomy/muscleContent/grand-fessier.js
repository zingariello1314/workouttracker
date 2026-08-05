/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const grandFessier = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: [
        {
          type: 'p',
          text:
            'Muscle le plus volumineux du corps — ilium, sacrum, coccyx → bandelette ilio-tibiale et tubérosité glutéale du fémur. Extension de hanche, rotation externe, stabilisation du bassin : sprint, saut, squat, soulevé de terre, hip thrust.'
        },
        {
          type: 'p',
          text:
            'Faisceaux supérieurs (abduction/stabilité) et inférieurs (extension puissante). Faiblesse → compensation lombaires / quadriceps, genou en valgus dynamique.'
        }
      ]
    },
    {
      id: 'momentum',
      title: 'Momentum & sport',
      blocks: [
        {
          type: 'ul',
          items: [
            'Muscle-up explosif : chaîne postérieure + hanches',
            'Front lever : contrôle du bassin (éviter cambrure)',
            'Transfert avec ischio-jambiers et mollets'
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
          items: ['Hip thrust au sol', 'Bulgarian split squat', 'Fente arrière', 'Step-up']
        },
        {
          type: 'exerciseBlock',
          category: 'Salle',
          stars: 5,
          items: ['Hip thrust chargé', 'Squat profond', 'Soulevé de terre / RDL', 'Pull-through poulie', 'Fentes marchées']
        }
      ]
    },
    {
      id: 'programme',
      title: 'Programme indicatif',
      blocks: [
        {
          type: 'ul',
          items: [
            'PDC : Bulgarian 4×8–15, hip thrust PDC 4×15–25',
            'Salle : hip thrust 3–5×6–12, RDL 3–4×8–12, squat 3–5×6–12'
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
            'Amplitude courte (peu de flexion hanche)',
            'Uniquement squat sans extension directe (hip thrust, pull-through)',
            'Extension de hanche par cambrure lombaire au lieu du bassin'
          ]
        }
      ]
    }
  ]
};

export default grandFessier;
