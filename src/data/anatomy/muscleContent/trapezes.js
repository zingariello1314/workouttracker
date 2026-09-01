import presentationBlocks from './trapezes/presentationBlocks.js';
import portionsBlocks from './trapezes/portionsBlocks.js';
import erreursBlocks from './trapezes/erreursBlocks.js';
import faqBlocks from './trapezes/faqBlocks.js';

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const trapezes = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation générale',
      blocks: presentationBlocks
    },
    {
      id: 'portions',
      title: 'Les trois portions du trapèze',
      blocks: portionsBlocks
    },
    {
      id: 'exercices',
      title: 'Exercices',
      blocks: [
        {
          type: 'h3',
          text: 'Shrugs et farmer walk'
        },
        {
          type: 'p',
          text:
            'Shrugs : monter la scapula verticalement, pause brève, redescente contrôlée — éviter la rotation des épaules vers l’arrière en haut. Farmer walk : trapèzes, gainage, préhension et stabilité proches de la vie réelle.'
        },
        {
          type: 'h3',
          text: 'Rowing et face pull'
        },
        {
          type: 'p',
          text:
            'Rowing : laisser l’omoplate avancer en bas, ramener le coude, finir en contraction — pas seulement déplacer le poids. Face pull : trapèze moyen et inférieur, deltoïde postérieur et coiffe — idéal si beaucoup de poussée.'
        },
        {
          type: 'h3',
          text: 'Y-raise et wall slides'
        },
        {
          type: 'p',
          text:
            'Y-raise pour recruter le trapèze inférieur sans charge excessive. Wall slides pour le contrôle scapulaire et les épaules enroulées.'
        },
        {
          type: 'exerciseBlock',
          category: 'Trapèze supérieur',
          stars: 5,
          items: ['Shrugs haltères', 'Farmer walk', 'Shrugs barre']
        },
        {
          type: 'exerciseBlock',
          category: 'Trapèze moyen',
          stars: 5,
          items: ['Rowing barre', 'Rowing haltère', 'Reverse fly', 'Tirage horizontal poulie']
        },
        {
          type: 'exerciseBlock',
          category: 'Trapèze inférieur',
          stars: 5,
          items: ['Y-raise', 'Face pull', 'Wall slides', 'Rowing dépression scapulaire']
        }
      ]
    },
    {
      id: 'erreurs',
      title: 'Erreurs fréquentes',
      blocks: erreursBlocks
    },
    {
      id: 'saviez-vous',
      title: 'Le saviez-vous ?',
      blocks: [
        {
          type: 'h3',
          text: 'Muscle de précision'
        },
        {
          type: 'p',
          text:
            'Une grande part de son rôle consiste en ajustements fins de l’omoplate, pas seulement en puissance brute.'
        },
        {
          type: 'h3',
          text: 'Fort sans être énorme'
        },
        {
          type: 'p',
          text:
            'Un gymnaste peut avoir un contrôle scapulaire exceptionnel sans trapèzes hypertrophiés.'
        },
        {
          type: 'h3',
          text: 'Actif au quotidien'
        },
        {
          type: 'p',
          text: 'Posture debout, sac, ordinateur : activité constante des muscles scapulaires.'
        }
      ]
    },
    {
      id: 'faq',
      title: 'Questions fréquentes',
      blocks: faqBlocks
    },
    {
      id: 'momentum',
      title: 'Analyse Momentum',
      blocks: [
        {
          type: 'p',
          text:
            'Le trapèze relie colonne, épaules et bras. Son développement améliore stabilité, posture, force et longévité articulaire. Un haut du dos Momentum équilibre trapèze supérieur (puissance), moyen (densité) et inférieur (contrôle) — pas seulement la nuque épaisse.'
        }
      ]
    }
  ]
};

export default trapezes;
