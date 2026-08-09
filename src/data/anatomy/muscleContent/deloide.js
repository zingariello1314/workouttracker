import presentationBlocks from './deltoide/presentationBlocks.js';
import anatomieBlocks from './deltoide/anatomieBlocks.js';
import recrutementBlocks from './deltoide/recrutementBlocks.js';
import morphologieBlocks from './deltoide/morphologieBlocks.js';
import erreursBlocks from './deltoide/erreursBlocks.js';
import volumeBlocks from './deltoide/volumeBlocks.js';
import saviezVousBlocks from './deltoide/saviezVousBlocks.js';

/** Sections détaillées portions / exercices / FAQ — conservées en complément. */
const portionsSection = {
  id: 'portions',
  title: 'Les différentes portions',
  blocks: [
    {
      type: 'p',
      text:
        'Comprendre les trois faisceaux explique pourquoi les développés seuls ne suffisent pas à une épaule « complète », et pourquoi la largeur visuelle dépend surtout du faisceau moyen.'
    },
    {
      type: 'h3',
      text: 'Faisceau antérieur — La partie avant de l’épaule'
    },
    {
      type: 'p',
      text:
        'Le deltoïde antérieur est situé à l’avant de l’épaule. Il est très sollicité dans tous les mouvements où le bras pousse vers l’avant : développés, pompes, dips et travail au-dessus de la tête.'
    },
    {
      type: 'p',
      text:
        'Il participe à la flexion de l’épaule (lever le bras devant soi), à la rotation interne et à l’adduction horizontale — il aide le grand pectoral à rapprocher le bras devant le corps.'
    },
    {
      type: 'p',
      text:
        'Particularité importante : le faisceau antérieur est rarement en retard. Développé couché, développé militaire, pompes et dips lui apportent déjà beaucoup de stimulation. Ajouter un volume spécifique excessif peut créer un déséquilibre avec l’arrière de l’épaule.'
    },
    {
      type: 'ul',
      items: ['Développé militaire', 'Développé haltères', 'Pike push-up', 'Handstand push-up']
    },
    {
      type: 'h3',
      text: 'Faisceau moyen — Le créateur de largeur'
    },
    {
      type: 'p',
      text:
        'Le faisceau moyen est probablement le faisceau le plus recherché esthétiquement. Situé sur le côté de l’épaule, il donne l’impression d’épaule large et arrondie.'
    },
    {
      type: 'p',
      text:
        'Son rôle principal est l’abduction du bras — éloigner le bras du corps, comme en élévation latérale. Il augmente la distance entre le cou et les bras et crée la carrure supérieure ; chez beaucoup de pratiquants naturels, c’est l’un des changements visuels les plus marqués.'
    },
    {
      type: 'p',
      text:
        'Il est parfois difficile à développer car il reçoit moins de travail indirect que l’antérieur, fonctionne mieux avec des charges modérées et souffre des exécutions trop lourdes avec élan. Une élévation latérale à 8 kg contrôlée peut surpasser 20 kg balancés.'
    },
    {
      type: 'ul',
      items: ['Élévations latérales poulie', 'Élévations latérales haltères', 'Machine élévation latérale']
    },
    {
      type: 'h3',
      text: 'Faisceau postérieur — La partie oubliée mais essentielle'
    },
    {
      type: 'p',
      text:
        'Le deltoïde postérieur est situé derrière l’épaule. C’est souvent le faisceau le moins développé chez les débutants, car la majorité des exercices populaires sont des poussées alors qu’il intervient surtout dans les tirages.'
    },
    {
      type: 'p',
      text:
        'Il participe à l’extension horizontale du bras, à la rotation externe et à la stabilisation de l’épaule. Esthétiquement, il complète l’épaule vue de profil, améliore la séparation épaule-dos et densifie le haut du corps.'
    },
    {
      type: 'p',
      text:
        'Pour la santé, il équilibre l’action des muscles antérieurs. Un manque de développement peut favoriser épaules projetées vers l’avant, mauvaise posture et inconfort en mouvement.'
    },
    {
      type: 'ul',
      items: ['Face pull', 'Reverse pec deck', 'Oiseau haltères', 'Rowing avec bonne rétraction scapulaire']
    }
  ]
};

const exercicesSection = {
  id: 'exercices',
  title: 'Exercices',
  blocks: [
    {
      type: 'p',
      text:
        'Les mouvements de poussée verticale construisent la force globale ; les isolations ciblent la tension sur un faisceau ; les tirages et le contrôle scapulaire protègent l’articulation sur le long terme.'
    },
    {
      type: 'h3',
      text: 'Pike push-up'
    },
    {
      type: 'p',
      text:
        'L’un des meilleurs exercices au poids du corps pour les épaules : bassin haut, corps en triangle, poussée en rapprochant la tête du sol — mouvement proche du développé militaire. Cible surtout deltoïde antérieur, moyen dans une certaine mesure, triceps et stabilisateurs scapulaires.'
    },
    {
      type: 'h3',
      text: 'Handstand push-up'
    },
    {
      type: 'p',
      text:
        'Poussée verticale avancée exigeant force d’épaules, gainage, équilibre et contrôle nerveux. Sollicite antérieur, triceps, trapèzes et muscles scapulaires.'
    },
    {
      type: 'h3',
      text: 'Développé militaire et haltères'
    },
    {
      type: 'p',
      text:
        'Fondamentaux de force en poussée verticale (antérieur, moyen, triceps, trapèzes, tronc). Les haltères demandent plus de stabilisation, symétrie et amplitude que la barre.'
    },
    {
      type: 'h3',
      text: 'Élévations latérales'
    },
    {
      type: 'p',
      text:
        'Exercice emblématique pour la largeur. Mieux vaut coude légèrement fléchi, plan légèrement vers l’avant, descente contrôlée. La poulie maintient une tension plus constante que l’haltère en bas de mouvement.'
    },
    {
      type: 'h3',
      text: 'Arrière d’épaule'
    },
    {
      type: 'p',
      text:
        'Reverse pec deck, face pull et oiseau haltères ciblent le postérieur. Le face pull est aussi un pilier pour deltoïde postérieur, infra-épineux et trapèzes moyen/inférieur.'
    },
    {
      type: 'exerciseBlock',
      category: 'Poids du corps — incontournables',
      stars: 5,
      items: ['Pike push-up', 'Handstand push-up', 'Pompes pseudo-planche', 'Handstand (maintien)']
    },
    {
      type: 'exerciseBlock',
      category: 'Moyen — salle',
      stars: 5,
      items: ['Élévations latérales haltères', 'Élévations latérales poulie', 'Machine latérale']
    },
    {
      type: 'exerciseBlock',
      category: 'Postérieur — salle',
      stars: 5,
      items: ['Reverse pec deck', 'Face pull', 'Oiseau haltères']
    }
  ]
};

const volumeSection = {
  id: 'volume',
  title: 'Volume et programmation',
  blocks: volumeBlocks
};

const saviezVousSection = {
  id: 'saviez-vous',
  title: 'Questions fréquentes',
  blocks: saviezVousBlocks
};

/** @type {{ sections: { id: string, title: string, blocks: object[] }[] }} */
const deloide = {
  sections: [
    {
      id: 'presentation',
      title: 'Présentation',
      blocks: presentationBlocks
    },
    {
      id: 'anatomie',
      title: 'Origine et insertion',
      blocks: anatomieBlocks
    },
    {
      id: 'recrutement',
      title: 'Comment bien recruter le deltoïde',
      blocks: recrutementBlocks
    },
    {
      id: 'morphologie',
      title: 'Largeur, morphologie et physique en V',
      blocks: morphologieBlocks
    },
    {
      id: 'erreurs',
      title: 'Erreurs fréquentes',
      blocks: erreursBlocks
    },
    portionsSection,
    exercicesSection,
    volumeSection,
    saviezVousSection
  ]
};

export default deloide;
