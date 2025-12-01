import { useCallback } from 'react';
import logger from '../utils/logger';
import { generateSalt, hashPassword, verifyPassword } from '../utils/authCrypto';
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
    const user = await getUserByUsername(username);
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

  // Stub : sera complété pour migrer les données workouts/livres vers un userId
  const linkAnonymousDataToUser = useCallback(async (userId) => {
    log.debug('Migration des données anonymes vers userId', { userId });
    // TODO: implémenter la logique réelle (workouts, livres, nutrition...)
    return { success: true };
  }, []);

  return {
    loadInitialAuth,
    register,
    login,
    logout,
    updateProfile,
    updateAvatar,
    linkAnonymousDataToUser,
  };
};


