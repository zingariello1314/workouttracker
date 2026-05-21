export const isAdminUser = (user) => {
  return Boolean(user && user.role === 'admin');
};

/** Tout utilisateur connecté peut lire/écrire ses données locales (IndexedDB). */
export const canAccessPrivateData = ({ user, isAuthenticated }) => {
  return Boolean(isAuthenticated && user?.id);
};

/** Clé QuietQuest en IndexedDB : profil admin = legacy `main`, autres = id utilisateur. */
export const getQuietQuestUserId = (user) => {
  if (!user?.id) return 'main';
  return isAdminUser(user) ? 'main' : user.id;
};

const QUIET_QUEST_BASE_KEYS = {
  quests: 'quietquest_quests',
  validations: 'quietquest_validations',
  userData: 'quietquest_user_data',
  dailyPerformances: 'quietquest_daily_performances',
  appState: 'quietquest_app_state',
};

/** Clés localStorage isolées par utilisateur. */
export const getQuietQuestStorageKeys = (userId) => {
  const suffix = userId && userId !== 'main' ? `:${userId}` : '';
  return {
    quests: `${QUIET_QUEST_BASE_KEYS.quests}${suffix}`,
    validations: `${QUIET_QUEST_BASE_KEYS.validations}${suffix}`,
    userData: `${QUIET_QUEST_BASE_KEYS.userData}${suffix}`,
    dailyPerformances: `${QUIET_QUEST_BASE_KEYS.dailyPerformances}${suffix}`,
    appState: `${QUIET_QUEST_BASE_KEYS.appState}${suffix}`,
  };
};

export const getSessionTtlMs = (rememberMe) => {
  // Session courte sans "se souvenir de moi", longue sinon.
  return rememberMe ? 30 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
};

export const computeSessionExpiry = (rememberMe) => {
  return Date.now() + getSessionTtlMs(rememberMe);
};
