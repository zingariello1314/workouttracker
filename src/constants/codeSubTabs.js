/** Sous-onglets du méta-onglet « Code » (Navigation). */
export const CODE_SUB_TAB_IDS = ['code-calendar', 'code-journal', 'code-stats'];

export const isCodeSubTab = (tabId) => typeof tabId === 'string' && CODE_SUB_TAB_IDS.includes(tabId);
