/** Familles de l’onglet Paramètres. L’accent ne change que la teinte, pas les modules. */
export const SETTINGS_GROUPS = [
  {
    id: 'account',
    label: 'Compte & sécurité',
    accent: '#fb7185',
    sectionIds: ['settings-quiz', 'settings-profil', 'settings-verrou'],
  },
  {
    id: 'integrations',
    label: 'Intégrations',
    accent: '#38bdf8',
    layout: 'grid',
    sectionIds: ['settings-github', 'settings-spotify', 'settings-garmin'],
  },
  {
    id: 'appearance',
    label: 'Apparence',
    accent: '#c4b5fd',
    sectionIds: [
      'settings-apparence',
      'settings-fonds-ecran',
      'settings-carte',
      'settings-bannieres',
      'settings-citations',
    ],
  },
  {
    id: 'data',
    label: 'Données',
    accent: '#fbbf24',
    sectionIds: [
      'settings-export',
      'settings-quests',
      'settings-livres',
      'settings-budget',
      'settings-apprentissage',
      'settings-import',
      'settings-nettoyage',
    ],
  },
  {
    id: 'behavior',
    label: 'Comportement',
    accent: '#2dd4bf',
    sectionIds: ['settings-navigation', 'settings-repos', 'settings-langue', 'settings-priere'],
  },
  {
    id: 'info',
    label: 'Infos',
    accent: '#a1a1aa',
    sectionIds: ['settings-infos'],
  },
];
