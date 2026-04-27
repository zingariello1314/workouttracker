export const isAdminUser = (user) => {
  return Boolean(user && user.role === 'admin');
};

export const canAccessPrivateData = ({ user, isAuthenticated }) => {
  return Boolean(isAuthenticated && isAdminUser(user));
};

export const getSessionTtlMs = (rememberMe) => {
  // Session courte sans "se souvenir de moi", longue sinon.
  return rememberMe ? 30 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
};

export const computeSessionExpiry = (rememberMe) => {
  return Date.now() + getSessionTtlMs(rememberMe);
};
