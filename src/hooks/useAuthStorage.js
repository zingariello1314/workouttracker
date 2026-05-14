import { useCallback } from 'react';
import logger from '../utils/logger';
import { generateSalt, hashPassword, verifyPassword } from '../utils/authCrypto';
import {
  migrateDataToUser,
  previewAnonymousDataMigration,
  rollbackLastMigration
} from '../utils/authMigration';
import { computeSessionExpiry } from '../utils/accessControl';
import {
  decryptProfileSecretsUser,
  encryptProfileSecretsPatch
} from '../utils/secureProfileSecrets';
import { logAuthAuditEvent } from '../utils/authAuditTrail';
import {
  clearServerTokens,
  isServerAuthMode,
  isStrictServerAuthMode,
  readServerTokens,
  serverChangePassword,
  serverLogin,
  serverLogout,
  serverRefresh,
  serverRegister,
  setServerTokens,
  shouldDiscardServerTokensAfterFailedRefresh
} from '../utils/serverAuthApi';
import {
  createUser,
  getUserByUsername,
  getUserById,
  updateUser,
  deleteUserById,
  saveAvatar,
  saveAuthState,
  getAuthState,
  clearAuthState,
} from '../utils/authIndexedDB';

const log = logger.hook('useAuthStorage');

const REMEMBERED_KEY = 'momentum:rememberedUserId';
const REMEMBERED_EXPIRES_KEY = 'momentum:rememberedUserExpiresAt';
const LEGACY_ADMIN_USERNAMES = new Set(['zingariello1314']);

const maybeMigrateLegacyAdminRole = async (user) => {
  if (!user || user.role === 'admin') return user;
  if (!LEGACY_ADMIN_USERNAMES.has(String(user.username || '').toLowerCase())) return user;
  const migrated = {
    ...user,
    role: 'admin',
    updatedAt: new Date().toISOString()
  };
  const ok = await updateUser(migrated);
  if (ok) return migrated;
  return user;
};

const sanitizeProfilePatch = (partialUser) => {
  const blocked = new Set([
    'id',
    'role',
    'passwordHash',
    'passwordSalt',
    'createdAt',
    'updatedAt',
    'username'
  ]);
  const clean = {};
  Object.entries(partialUser || {}).forEach(([key, value]) => {
    if (!blocked.has(key)) clean[key] = value;
  });
  return clean;
};

const upsertServerUserLocally = async (user) => {
  if (!user?.id || !user?.username) return user;
  const existing = await getUserById(user.id);
  const sameUsername = await getUserByUsername(user.username);
  if (sameUsername && String(sameUsername.id) !== String(user.id)) {
    await deleteUserById(sameUsername.id);
  }
  const now = new Date().toISOString();
  const base = {
    id: user.id,
    username: user.username,
    email: user.email || null,
    emailVerified: Boolean(user.emailVerified ?? user.email_verified ?? existing?.emailVerified),
    firstName: user.firstName ?? existing?.firstName ?? '',
    lastName: user.lastName ?? existing?.lastName ?? '',
    role: user.role || 'user',
    serverManaged: true,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    passwordSalt: existing?.passwordSalt || '',
    passwordHash: existing?.passwordHash || '',
    avatarId: existing?.avatarId || null
  };
  if (!existing) {
    const created = await createUser(base);
    if (!created.success) {
      await updateUser(base);
    }
  } else {
    await updateUser({ ...existing, ...base });
  }
  return base;
};

export const useAuthStorage = () => {
  const isStrongRegistrationPassword = (pwd) => {
    const value = String(pwd || '');
    if (value.length < 8) return false;
    if (!/[A-Z]/.test(value)) return false;
    if (!/[^A-Za-z0-9]/.test(value)) return false;
    return true;
  };

  // Chargement initial : tente d'auto‑connecter un utilisateur si rememberMe est actif
  const loadInitialAuth = useCallback(async () => {
    try {
      if (isServerAuthMode()) {
        const { refreshToken } = readServerTokens();
        if (refreshToken) {
          try {
            const refreshed = await serverRefresh(refreshToken);
            const user = await upsertServerUserLocally(refreshed.user);
            setServerTokens({
              accessToken: refreshed.accessToken,
              refreshToken: refreshed.refreshToken
            });
            await saveAuthState({
              userId: user.id,
              rememberMe: true,
              expiresAt: computeSessionExpiry(true),
              authSource: 'server'
            });
            return { user, rememberMe: true };
          } catch (error) {
            if (shouldDiscardServerTokensAfterFailedRefresh(error)) {
              clearServerTokens();
            }
            if (isStrictServerAuthMode()) {
              return { user: null, rememberMe: false };
            }
          }
        } else if (isStrictServerAuthMode()) {
          return { user: null, rememberMe: false };
        }
      }

      // 1) Priorité à la clé rememberMe dans localStorage
      let rememberedId = null;
      let rememberedExpiresAt = null;
      try {
        rememberedId = localStorage.getItem(REMEMBERED_KEY);
        rememberedExpiresAt = localStorage.getItem(REMEMBERED_EXPIRES_KEY);
      } catch {
        rememberedId = null;
        rememberedExpiresAt = null;
      }

      if (rememberedId) {
        const now = Date.now();
        const expiresAt = rememberedExpiresAt ? Number(rememberedExpiresAt) : null;
        if (expiresAt && expiresAt <= now) {
          try {
            localStorage.removeItem(REMEMBERED_KEY);
            localStorage.removeItem(REMEMBERED_EXPIRES_KEY);
          } catch {
            // ignore
          }
        } else {
        let user = await getUserById(rememberedId);
        user = await maybeMigrateLegacyAdminRole(user);
        user = await decryptProfileSecretsUser(user);
        if (user) {
          const effectiveRemember = true;
          await saveAuthState({
            userId: user.id,
            rememberMe: effectiveRemember,
            expiresAt: computeSessionExpiry(effectiveRemember)
          });
          log.debug('Auto‑login via rememberMe', { userId: user.id });
          return { user, rememberMe: effectiveRemember };
        }
        // Si l'utilisateur n'existe plus, nettoyer la clé
        try {
          localStorage.removeItem(REMEMBERED_KEY);
          localStorage.removeItem(REMEMBERED_EXPIRES_KEY);
        } catch {
          // ignore
        }
        }
      }

      // 2) Sinon, regarder l'état d'authentification en base
      const state = await getAuthState();
      if (state && state.userId) {
        const now = Date.now();
        if (state.expiresAt && Number(state.expiresAt) <= now) {
          await clearAuthState();
          try {
            if (!state.rememberMe) {
              localStorage.removeItem(REMEMBERED_KEY);
              localStorage.removeItem(REMEMBERED_EXPIRES_KEY);
            }
          } catch {
            // ignore
          }
          return { user: null, rememberMe: false };
        }
        let user = await getUserById(state.userId);
        user = await maybeMigrateLegacyAdminRole(user);
        user = await decryptProfileSecretsUser(user);
        if (user) {
          log.debug('Auto‑login via authState', { userId: user.id, rememberMe: !!state.rememberMe });
          await saveAuthState({
            userId: user.id,
            rememberMe: !!state.rememberMe,
            expiresAt: computeSessionExpiry(!!state.rememberMe)
          });
          return { user, rememberMe: !!state.rememberMe };
        }
      }

      return { user: null, rememberMe: false };
    } catch (error) {
      log.error('Erreur loadInitialAuth', error);
      return { user: null, rememberMe: false };
    }
  }, []);

  const register = useCallback(async ({
    username,
    email,
    password,
    firstName = '',
    lastName = '',
    emailVerifiedAtSignup = false
  }) => {
    if (!isStrongRegistrationPassword(password)) {
      return { success: false, error: 'PASSWORD_POLICY_FAILED' };
    }

    if (isServerAuthMode()) {
      try {
        const result = await serverRegister({ username, email, password });
        let user = await upsertServerUserLocally(result.user);
        if (emailVerifiedAtSignup) {
          const row = await getUserById(user.id);
          if (row) {
            const dec = await decryptProfileSecretsUser(row);
            await updateUser({ ...dec, emailVerified: true, updatedAt: new Date().toISOString() });
            user = { ...user, emailVerified: true };
          }
        }
        setServerTokens({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        });
        await saveAuthState({
          userId: user.id,
          rememberMe: true,
          expiresAt: computeSessionExpiry(true),
          authSource: 'server'
        });
        void logAuthAuditEvent('register_success', { userId: user.id, username: user.username, source: 'server' });
        return { success: true, user };
      } catch (error) {
        void logAuthAuditEvent('register_failed', { username, reason: error?.message || 'SERVER_REGISTER_FAILED' });
        if (isStrictServerAuthMode()) {
          return { success: false, error: 'REGISTER_FAILED' };
        }
      }
    }

    const existing = await getUserByUsername(username);
    if (existing) {
      return { success: false, error: 'USERNAME_TAKEN' };
    }

    const salt = generateSalt(16);
    const passwordHash = await hashPassword(password, salt);

    const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `user_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const now = new Date().toISOString();
    const user = {
      id,
      username,
      firstName: firstName || '',
      lastName: lastName || '',
      email: email || null,
      emailVerified: Boolean(emailVerifiedAtSignup),
      passwordSalt: salt,
      passwordHash,
      avatarId: null,
      inspirationalPhrase: '',
      homepageBackgroundHint: '',
      createdAt: now,
      updatedAt: now,
    };

    const result = await createUser(user);
    if (!result.success) {
      void logAuthAuditEvent('register_failed', { username, reason: 'CREATE_FAILED' });
      return { success: false, error: 'CREATE_FAILED' };
    }

    log.debug('Utilisateur enregistré', { id: user.id, username: user.username });
    void logAuthAuditEvent('register_success', { userId: user.id, username: user.username });
    return { success: true, user };
  }, []);

  const login = useCallback(async ({ username, password, rememberMe }) => {
    if (isServerAuthMode()) {
      try {
        const result = await serverLogin({ username, password });
        const user = await upsertServerUserLocally(result.user);
        setServerTokens({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        });
        await saveAuthState({
          userId: user.id,
          rememberMe: !!rememberMe,
          expiresAt: computeSessionExpiry(!!rememberMe),
          authSource: 'server'
        });
        if (rememberMe) {
          localStorage.setItem(REMEMBERED_KEY, user.id);
          localStorage.setItem(REMEMBERED_EXPIRES_KEY, String(computeSessionExpiry(true)));
        } else {
          localStorage.removeItem(REMEMBERED_KEY);
          localStorage.removeItem(REMEMBERED_EXPIRES_KEY);
        }
        void logAuthAuditEvent('login_success', {
          userId: user.id,
          username: user.username,
          rememberMe: !!rememberMe,
          source: 'server'
        });
        return { success: true, user };
      } catch (error) {
        void logAuthAuditEvent('login_failed', {
          username,
          reason: error?.message || 'SERVER_LOGIN_FAILED'
        });
        if (isStrictServerAuthMode()) {
          return { success: false, error: 'INVALID_CREDENTIALS' };
        }
      }
    }

    let user = await getUserByUsername(username);

    if (!user || !user.passwordSalt || !user.passwordHash) {
      void logAuthAuditEvent('login_failed', { username, reason: 'INVALID_CREDENTIALS' });
      return { success: false, error: 'INVALID_CREDENTIALS' };
    }

    const ok = await verifyPassword(password, user.passwordSalt, user.passwordHash);
    if (!ok) {
      void logAuthAuditEvent('login_failed', { username, reason: 'INVALID_CREDENTIALS' });
      return { success: false, error: 'INVALID_CREDENTIALS' };
    }

    user = await maybeMigrateLegacyAdminRole(user);
    user = await decryptProfileSecretsUser(user);
    await saveAuthState({
      userId: user.id,
      rememberMe: !!rememberMe,
      expiresAt: computeSessionExpiry(!!rememberMe)
    });

    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_KEY, user.id);
        localStorage.setItem(REMEMBERED_EXPIRES_KEY, String(computeSessionExpiry(true)));
      } else {
        localStorage.removeItem(REMEMBERED_KEY);
        localStorage.removeItem(REMEMBERED_EXPIRES_KEY);
      }
    } catch {
      // ignore
    }

    log.debug('Login réussi', { userId: user.id, rememberMe: !!rememberMe });
    void logAuthAuditEvent('login_success', {
      userId: user.id,
      username: user.username,
      rememberMe: !!rememberMe
    });
    return { success: true, user };
  }, []);

  const logout = useCallback(async () => {
    if (isServerAuthMode()) {
      try {
        const { refreshToken } = readServerTokens();
        if (refreshToken) {
          await serverLogout(refreshToken);
        }
      } catch {
        // ignore
      } finally {
        clearServerTokens();
      }
    }
    await clearAuthState();
    try {
      localStorage.removeItem(REMEMBERED_KEY);
      localStorage.removeItem(REMEMBERED_EXPIRES_KEY);
    } catch {
      // ignore
    }
    log.debug('Logout exécuté');
    void logAuthAuditEvent('logout', {});
  }, []);

  const updateProfile = useCallback(async (userId, partialUser) => {
    const current = await getUserById(userId);
    if (!current) return { success: false, error: 'NOT_FOUND' };
    const safePatch = sanitizeProfilePatch(partialUser);
    const encryptedPatch = await encryptProfileSecretsPatch(safePatch);

    const updated = {
      ...current,
      ...encryptedPatch,
      updatedAt: new Date().toISOString(),
    };

    const ok = await updateUser(updated);
    if (!ok) return { success: false, error: 'UPDATE_FAILED' };
    const decrypted = await decryptProfileSecretsUser(updated);
    void logAuthAuditEvent('profile_update', { userId, fields: Object.keys(safePatch || {}) });
    return { success: true, user: decrypted };
  }, []);

  const updateAvatar = useCallback(async (userId, file) => {
    if (!file) return { success: false, error: 'NO_FILE' };

    const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `avatar_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const blob = file instanceof Blob ? file : new Blob([file]);
    const mimeType = blob.type || 'image/png';

    const ok = await saveAvatar({ id, userId, blob, mimeType });
    if (!ok) return { success: false, error: 'AVATAR_SAVE_FAILED' };

    const profileResult = await updateProfile(userId, { avatarId: id });
    if (profileResult?.success) {
      void logAuthAuditEvent('avatar_update', { userId });
    }
    return profileResult;
  }, [updateProfile]);

  const updatePassword = useCallback(async (userId, oldPassword, newPassword, options = {}) => {
    const { skipOldPasswordCheck = false } = options;

    if (!newPassword) {
      return { success: false, error: 'MISSING_PASSWORD' };
    }

    if (!isStrongRegistrationPassword(newPassword)) {
      return { success: false, error: 'PASSWORD_POLICY_FAILED' };
    }

    const current = await getUserById(userId);
    if (!current) return { success: false, error: 'NOT_FOUND' };

    if (current.serverManaged && isServerAuthMode()) {
      if (!oldPassword) {
        return { success: false, error: 'MISSING_PASSWORD' };
      }
      try {
        const { accessToken } = readServerTokens();
        const result = await serverChangePassword({ oldPassword, newPassword, accessToken });
        if (result?.ok) {
          void logAuthAuditEvent('password_update', { userId, source: 'server' });
          return { success: true, user: current };
        }
        return { success: false, error: 'UPDATE_FAILED' };
      } catch (error) {
        void logAuthAuditEvent('password_update_failed', { userId, source: 'server' });
        return { success: false, error: 'INVALID_OLD_PASSWORD' };
      }
    }

    const canSkipOld = Boolean(skipOldPasswordCheck) && !current.serverManaged;
    if (!canSkipOld) {
      if (!oldPassword) {
        return { success: false, error: 'MISSING_PASSWORD' };
      }
      const isValid = await verifyPassword(oldPassword, current.passwordSalt, current.passwordHash);
      if (!isValid) {
        return { success: false, error: 'INVALID_OLD_PASSWORD' };
      }
    }

    // Générer un nouveau salt et hasher le nouveau mot de passe
    const newSalt = generateSalt();
    const newHash = await hashPassword(newPassword, newSalt);

    // Mettre à jour l'utilisateur
    const updated = {
      ...current,
      passwordHash: newHash,
      passwordSalt: newSalt,
      updatedAt: new Date().toISOString(),
    };

    const ok = await updateUser(updated);
    if (ok) {
      void logAuthAuditEvent('password_update', { userId });
    } else {
      void logAuthAuditEvent('password_update_failed', { userId });
    }
    return ok ? { success: true, user: updated } : { success: false, error: 'UPDATE_FAILED' };
  }, []);

  // Migration des données existantes (actuellement: livres)
  const linkAnonymousDataToUser = useCallback(async (userId, onProgress) => {
    log.debug('Migration des données anonymes vers userId', { userId });
    const result = await migrateDataToUser(userId, onProgress);
    void logAuthAuditEvent(result?.success ? 'migration_success' : 'migration_failed', {
      userId,
      result
    });
    return result;
  }, []);

  const previewAnonymousMigration = useCallback(async () => {
    return previewAnonymousDataMigration();
  }, []);

  const rollbackAnonymousMigration = useCallback(async (userId) => {
    const result = await rollbackLastMigration(userId);
    void logAuthAuditEvent(result?.success ? 'migration_rollback_success' : 'migration_rollback_failed', {
      userId,
      result
    });
    return result;
  }, []);

  return {
    loadInitialAuth,
    register,
    login,
    logout,
    updateProfile,
    updateAvatar,
    updatePassword,
    linkAnonymousDataToUser,
    previewAnonymousMigration,
    rollbackAnonymousMigration,
  };
};


