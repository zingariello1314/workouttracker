export const TAB_ACCESS_RULES = {
  program: { requiresAuth: true },
  exercises: { requiresAuth: true },
  'data-entry': { requiresAuth: true },
  // Garmin reste accessible en mode dégradé hors session.
  garmin: { requiresAuth: false }
};

export const canAccessTab = (tabId, { isAuthenticated }) => {
  const rule = TAB_ACCESS_RULES[tabId];
  if (!rule) return true;
  if (rule.requiresAuth && !isAuthenticated) return false;
  return true;
};
