import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import logger from '../utils/logger';
import { useAuthStorage } from '../hooks/useAuthStorage';

const log = logger.module('AuthContext');

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const {
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
  } = useAuthStorage();

  const [currentUser, setCurrentUser] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chargement initial (auto‑login éventuel)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const result = await loadInitialAuth();
      if (cancelled) return;
      setCurrentUser(result.user || null);
      setRememberMe(!!result.rememberMe);
      setLoading(false);
    };
    run().catch((err) => {
      if (!cancelled) {
        log.error('Erreur lors du chargement initial', err);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loadInitialAuth]);

  const handleRegister = useCallback(
    async ({ username, email, password, firstName, lastName, emailVerifiedAtSignup = false }) => {
      setError(null);
      const result = await register({
        username,
        email,
        password,
        firstName,
        lastName,
        emailVerifiedAtSignup
      });
      if (!result.success) {
        setError(result.error || 'REGISTER_FAILED');
        return result;
      }
      // Option : auto‑login après inscription (sans rememberMe par défaut)
      const loginResult = await login({ username, password, rememberMe: false });
      if (loginResult.success) {
        setCurrentUser(loginResult.user);
        setRememberMe(false);
      }
      return loginResult.success ? loginResult : result;
    },
    [register, login],
  );

  const handleLogin = useCallback(
    async ({ username, password, remember }) => {
      setError(null);
      const result = await login({ username, password, rememberMe: remember });
      if (!result.success) {
        setError(result.error || 'LOGIN_FAILED');
        return result;
      }
      setCurrentUser(result.user);
      setRememberMe(!!remember);
      return result;
    },
    [login],
  );

  const handleLogout = useCallback(async () => {
    setError(null);
    await logout();
    setCurrentUser(null);
    setRememberMe(false);
  }, [logout]);

  const handleUpdateProfile = useCallback(
    async (partialUser) => {
      if (!currentUser) return { success: false, error: 'NO_USER' };
      const result = await updateProfile(currentUser.id, partialUser);
      if (result.success) {
        setCurrentUser(result.user);
      } else {
        setError(result.error || 'PROFILE_UPDATE_FAILED');
      }
      return result;
    },
    [currentUser, updateProfile],
  );

  const handleUpdateAvatar = useCallback(
    async (file) => {
      if (!currentUser) return { success: false, error: 'NO_USER' };
      const result = await updateAvatar(currentUser.id, file);
      if (result.success && result.user) {
        setCurrentUser(result.user);
      } else if (!result.success) {
        setError(result.error || 'AVATAR_UPDATE_FAILED');
      }
      return result;
    },
    [currentUser, updateAvatar],
  );

  const handleUpdatePassword = useCallback(
    async (oldPassword, newPassword, options = {}) => {
      if (!currentUser) return { success: false, error: 'NO_USER' };
      const result = await updatePassword(currentUser.id, oldPassword, newPassword, options);
      if (!result.success) {
        setError(result.error || 'PASSWORD_UPDATE_FAILED');
      }
      return result;
    },
    [currentUser, updatePassword],
  );

  const handleLinkAnonymousData = useCallback(
    async (onProgress) => {
      if (!currentUser) return { success: false, error: 'NO_USER' };
      return linkAnonymousDataToUser(currentUser.id, onProgress);
    },
    [currentUser, linkAnonymousDataToUser],
  );

  const handlePreviewAnonymousMigration = useCallback(async () => {
    return previewAnonymousMigration();
  }, [previewAnonymousMigration]);

  const handleRollbackAnonymousMigration = useCallback(async () => {
    if (!currentUser) return { success: false, error: 'NO_USER' };
    return rollbackAnonymousMigration(currentUser.id);
  }, [currentUser, rollbackAnonymousMigration]);

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: !!currentUser,
      rememberMe,
      loading,
      error,
      register: handleRegister,
      login: handleLogin,
      logout: handleLogout,
      updateProfile: handleUpdateProfile,
      updateAvatar: handleUpdateAvatar,
      updatePassword: handleUpdatePassword,
      linkAnonymousDataToUser: handleLinkAnonymousData,
      previewAnonymousMigration: handlePreviewAnonymousMigration,
      rollbackAnonymousMigration: handleRollbackAnonymousMigration,
      setError,
    }),
    [
      currentUser,
      rememberMe,
      loading,
      error,
      handleRegister,
      handleLogin,
      handleLogout,
      handleUpdateProfile,
      handleUpdateAvatar,
      handleUpdatePassword,
      handleLinkAnonymousData,
      handlePreviewAnonymousMigration,
      handleRollbackAnonymousMigration,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


