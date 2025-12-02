import { useCallback } from 'react';
import logger from '../utils/logger';
import { generateSalt, hashPassword, verifyPassword } from '../utils/authCrypto';
import { migrateDataToUser } from '../utils/authMigration';
import {
  createUser,
  getUserByUsername,
  getUserById,
  updateUser,
  saveAvatar,
  saveAuthState,
  getAuthState,
  clearAuthState,
} from '../utils/authIndexedDB';

const log = logger.hook('useAuthStorage');

const REMEMBERED_KEY = 'momentum:rememberedUserId';

// Compte admin pré-configuré pour ton usage personnel.
// Ce compte pourra ensuite servir de "profil maître" auquel on migrera les données existantes.
const ADMIN_USERNAME = 'zingariello1314';
const ADMIN_PASSWORD = 'MdpMdp123';

export const useAuthStorage = () => {
  // Chargement initial : tente d'auto‑connecter un utilisateur si rememberMe est actif
  const loadInitialAuth = useCallback(async () => {
    try {
      // 1) Priorité à la clé rememberMe dans localStorage
      let rememberedId = null;
      try {
        rememberedId = localStorage.getItem(REMEMBERED_KEY);
      } catch {
        rememberedId = null;
      }

      if (rememberedId) {
        const user = await getUserById(rememberedId);
        if (user) {
          await saveAuthState({ userId: user.id, rememberMe: true });
          log.debug('Auto‑login via rememberMe', { userId: user.id });
          return { user, rememberMe: true };
        }
        // Si l'utilisateur n'existe plus, nettoyer la clé
        try {
          localStorage.removeItem(REMEMBERED_KEY);
        } catch {
          // ignore
        }
      }

      // 2) Sinon, regarder l'état d'authentification en base
      const state = await getAuthState();
      if (state && state.userId) {
        const user = await getUserById(state.userId);
        if (user) {
          log.debug('Auto‑login via authState', { userId: user.id, rememberMe: !!state.rememberMe });
          return { user, rememberMe: !!state.rememberMe };
        }
      }

      return { user: null, rememberMe: false };
    } catch (error) {
      log.error('Erreur loadInitialAuth', error);
      return { user: null, rememberMe: false };
    }
  }, []);

  const register = useCallback(async ({ username, email, password }) => {
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
      email: email || null,
      passwordSalt: salt,
      passwordHash,
      avatarId: null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await createUser(user);
    if (!result.success) {
      return { success: false, error: 'CREATE_FAILED' };
    }

    log.debug('Utilisateur enregistré', { id: user.id, username: user.username });
    return { success: true, user };
  }, []);

  const login = useCallback(async ({ username, password, rememberMe }) => {
    let user = await getUserByUsername(username);

    // Création automatique du compte admin si inexistant et identifiants exacts
    if (!user && username === ADMIN_USERNAME) {
      if (password !== ADMIN_PASSWORD) {
        return { success: false, error: 'INVALID_CREDENTIALS' };
      }
      const salt = generateSalt(16);
      const passwordHash = await hashPassword(password, salt);
      const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `admin_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const now = new Date().toISOString();
      user = {
        id,
        username: ADMIN_USERNAME,
        email: null,
        passwordSalt: salt,
        passwordHash,
        avatarId: null,
        role: 'admin',
        createdAt: now,
        updatedAt: now,
      };
      const createResult = await createUser(user);
      if (!createResult.success) {
        return { success: false, error: 'CREATE_FAILED' };
      }
      log.debug('Compte admin créé automatiquement', { id: user.id });
    }

    if (!user || !user.passwordSalt || !user.passwordHash) {
      return { success: false, error: 'INVALID_CREDENTIALS' };
    }

    const ok = await verifyPassword(password, user.passwordSalt, user.passwordHash);
    if (!ok) {
      return { success: false, error: 'INVALID_CREDENTIALS' };
    }

    await saveAuthState({ userId: user.id, rememberMe: !!rememberMe });

    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_KEY, user.id);
      } else {
        localStorage.removeItem(REMEMBERED_KEY);
      }
    } catch {
      // ignore
    }

    log.debug('Login réussi', { userId: user.id, rememberMe: !!rememberMe });
    return { success: true, user };
  }, []);

  const logout = useCallback(async () => {
    await clearAuthState();
    try {
      localStorage.removeItem(REMEMBERED_KEY);
    } catch {
      // ignore
    }
    log.debug('Logout exécuté');
  }, []);

  const updateProfile = useCallback(async (userId, partialUser) => {
    const current = await getUserById(userId);
    if (!current) return { success: false, error: 'NOT_FOUND' };

    const updated = {
      ...current,
      ...partialUser,
      updatedAt: new Date().toISOString(),
    };

    const ok = await updateUser(updated);
    return ok ? { success: true, user: updated } : { success: false, error: 'UPDATE_FAILED' };
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
    return profileResult;
  }, [updateProfile]);

  const updatePassword = useCallback(async (userId, oldPassword, newPassword) => {
    if (!oldPassword || !newPassword) {
      return { success: false, error: 'MISSING_PASSWORD' };
    }

    if (newPassword.length < 6) {
      return { success: false, error: 'PASSWORD_TOO_SHORT' };
    }

    const current = await getUserById(userId);
    if (!current) return { success: false, error: 'NOT_FOUND' };

    // Vérifier l'ancien mot de passe
    const isValid = await verifyPassword(oldPassword, current.passwordSalt, current.passwordHash);
    if (!isValid) {
      return { success: false, error: 'INVALID_OLD_PASSWORD' };
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
    return ok ? { success: true, user: updated } : { success: false, error: 'UPDATE_FAILED' };
  }, []);

  // Migration des données existantes (actuellement: livres)
  const linkAnonymousDataToUser = useCallback(async (userId, onProgress) => {
    log.debug('Migration des données anonymes vers userId', { userId });
    const result = await migrateDataToUser(userId, onProgress);
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
  };
};


