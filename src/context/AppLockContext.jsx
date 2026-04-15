import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import { generateSalt, hashPassword, verifyPassword } from '../utils/authCrypto';
import { getAppLockRecord, saveAppLockRecord, getDefaultAppLockRecord } from '../services/appLock/appLockStorage';
import { consumeAppLockResetToken } from '../services/appLock/appLockRecoveryApi';
import { getUserById } from '../utils/authIndexedDB';

const AppLockContext = createContext(null);

const MAX_FAILED = 5;
const LOCKOUT_MS = 45_000;
const IDLE_CHECK_MS = 4_000;
const ACTIVITY_THROTTLE_MS = 400;

export const useAppLock = () => {
  const ctx = useContext(AppLockContext);
  if (!ctx) {
    throw new Error('useAppLock doit être utilisé dans AppLockProvider');
  }
  return ctx;
};

const isLockConfigured = (rec) =>
  rec &&
  rec.mode !== 'disabled' &&
  !!rec.codeHash &&
  !!rec.salt;

const pinLengthForMode = (mode) => {
  if (mode === 'pin4') return 4;
  if (mode === 'pin6') return 6;
  return null;
};

export const AppLockProvider = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const userId = currentUser?.id || null;

  const [record, setRecord] = useState(() => getDefaultAppLockRecord(''));
  const [hydrated, setHydrated] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [shakeToken, setShakeToken] = useState(0);
  const [lockoutUntilMs, setLockoutUntilMs] = useState(null);
  const [lockoutTick, setLockoutTick] = useState(0);

  const lastActivityRef = useRef(Date.now());
  const wasHiddenRef = useRef(false);
  const recordRef = useRef(record);
  recordRef.current = record;

  const bumpActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Charger la config quand le compte change
  useEffect(() => {
    let cancelled = false;
    if (!userId || authLoading) {
      setRecord(getDefaultAppLockRecord(userId || ''));
      setHydrated(!authLoading && !userId);
      setIsLocked(false);
      return () => {
        cancelled = true;
      };
    }
    setHydrated(false);
    (async () => {
      const r = await getAppLockRecord(userId);
      if (cancelled) return;
      setRecord(r);
      // À chaque chargement (ex. npm run dev / F5) : verrouillage immédiat si un code est défini
      setIsLocked(isLockConfigured(r));
      setHydrated(true);
      bumpActivity();
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, authLoading, bumpActivity]);

  const persist = useCallback(async (partial) => {
    if (!userId) return getDefaultAppLockRecord('');
    const next = await saveAppLockRecord({ ...partial, userId });
    setRecord(next);
    return next;
  }, [userId]);

  const lockNow = useCallback(() => {
    if (!userId || !hydrated) return;
    if (!isLockConfigured(recordRef.current)) return;
    setIsLocked(true);
  }, [userId, hydrated]);

  // Écoute globale : verrouillage manuel (Header, raccourcis)
  useEffect(() => {
    const onRequest = () => lockNow();
    window.addEventListener('momentum:app-lock-request', onRequest);
    return () => window.removeEventListener('momentum:app-lock-request', onRequest);
  }, [lockNow]);

  const applyLockoutIfNeeded = useCallback(
    async (failed) => {
      if (!userId) return;
      const r = recordRef.current;
      if (failed >= MAX_FAILED) {
        const until = new Date(Date.now() + LOCKOUT_MS).toISOString();
        await persist({ failedAttempts: 0, lockoutUntil: until });
        setLockoutUntilMs(Date.now() + LOCKOUT_MS);
        return;
      }
      await persist({ failedAttempts: failed });
    },
    [userId, persist],
  );

  const unlockWithCode = useCallback(
    async (code) => {
      if (!userId) return { success: false, error: 'NO_USER' };
      const r = recordRef.current;
      if (!isLockConfigured(r)) {
        setIsLocked(false);
        return { success: true };
      }
      if (r.lockoutUntil) {
        const until = new Date(r.lockoutUntil).getTime();
        if (until > Date.now()) {
          setLockoutUntilMs(until);
          return { success: false, error: 'LOCKOUT' };
        }
      }

      const ok = await verifyPassword(code, r.salt, r.codeHash);
      if (ok) {
        await persist({ failedAttempts: 0, lockoutUntil: null });
        setLockoutUntilMs(null);
        setIsLocked(false);
        bumpActivity();
        return { success: true };
      }

      setShakeToken((t) => t + 1);
      const failed = (r.failedAttempts || 0) + 1;
      await applyLockoutIfNeeded(failed);
      return { success: false, error: 'BAD_CODE' };
    },
    [userId, persist, applyLockoutIfNeeded, bumpActivity],
  );

  const updateSettings = useCallback(
    async (partial) => {
      if (!userId) return { success: false, error: 'NO_USER' };
      await persist(partial);
      return { success: true };
    },
    [userId, persist],
  );

  const setNewCode = useCallback(
    async (plainCode, mode) => {
      if (!userId) return { success: false, error: 'NO_USER' };
      const len = pinLengthForMode(mode);
      if (mode === 'pin4' || mode === 'pin6') {
        if (!/^\d+$/.test(plainCode) || plainCode.length !== len) {
          return { success: false, error: 'INVALID_PIN' };
        }
      } else if (mode === 'alphanumeric') {
        if (plainCode.length < 4 || plainCode.length > 64) {
          return { success: false, error: 'INVALID_LENGTH' };
        }
      } else {
        return { success: false, error: 'INVALID_MODE' };
      }
      const salt = generateSalt(16);
      const codeHash = await hashPassword(plainCode, salt);
      await persist({
        mode,
        salt,
        codeHash,
        failedAttempts: 0,
        lockoutUntil: null,
      });
      return { success: true };
    },
    [userId, persist],
  );

  const clearCodeAndDisable = useCallback(async () => {
    if (!userId) return { success: false, error: 'NO_USER' };
    await persist({
      mode: 'disabled',
      salt: null,
      codeHash: null,
      failedAttempts: 0,
      lockoutUntil: null,
    });
    setIsLocked(false);
    return { success: true };
  }, [userId, persist]);

  const setLockBackground = useCallback(
    async (dataUrlOrNull) => {
      if (!userId) return { success: false, error: 'NO_USER' };
      await persist({ lockBackgroundDataUrl: dataUrlOrNull });
      return { success: true };
    },
    [userId, persist],
  );

  /**
   * Après vérification e-mail + resetToken : consomme le jeton serveur puis enregistre le nouveau code app lock et déverrouille.
   */
  const completeEmailRecovery = useCallback(
    async ({ email, resetToken, newPlainCode, mode }) => {
      if (!userId) return { success: false, error: 'NO_USER' };
      const cons = await consumeAppLockResetToken(email, resetToken);
      if (!cons.ok) {
        return { success: false, error: cons.error || 'TOKEN_INVALID' };
      }
      const sc = await setNewCode(newPlainCode, mode);
      if (!sc.success) {
        return {
          success: false,
          error: sc.error || 'SET_FAILED',
          hint: "Le jeton a été utilisé. Demandez un nouveau code e-mail si le nouveau code n'a pas été enregistré.",
        };
      }
      await persist({ failedAttempts: 0, lockoutUntil: null });
      setLockoutUntilMs(null);
      setIsLocked(false);
      bumpActivity();
      return { success: true };
    },
    [userId, setNewCode, persist, bumpActivity],
  );

  /**
   * Réinitialisation gratuite 100 % locale : mot de passe du compte Momentum (IndexedDB), aucun e-mail.
   */
  const resetAppLockWithMainAccountPassword = useCallback(
    async (mainPassword, newPlainCode, mode) => {
      if (!userId) return { success: false, error: 'NO_USER' };
      const pwd = (mainPassword || '').trim();
      if (!pwd) return { success: false, error: 'EMPTY_PASSWORD' };

      const user = await getUserById(userId);
      if (!user?.passwordSalt || !user?.passwordHash) {
        return { success: false, error: 'NO_ACCOUNT_PASSWORD' };
      }
      const mainOk = await verifyPassword(pwd, user.passwordSalt, user.passwordHash);
      if (!mainOk) {
        return { success: false, error: 'BAD_MAIN_PASSWORD' };
      }

      const sc = await setNewCode(newPlainCode, mode);
      if (!sc.success) return sc;

      await persist({ failedAttempts: 0, lockoutUntil: null });
      setLockoutUntilMs(null);
      setIsLocked(false);
      bumpActivity();
      return { success: true };
    },
    [userId, setNewCode, persist, bumpActivity],
  );

  // Inactivité
  useEffect(() => {
    if (!userId || !hydrated || authLoading) return;
    if (!isLockConfigured(record)) return;
    if (record.idleMinutes == null) return;

    const idleMs = record.idleMinutes * 60_000;
    const tick = () => {
      if (!isLockConfigured(recordRef.current)) return;
      if (recordRef.current.idleMinutes == null) return;
      const limit = recordRef.current.idleMinutes * 60_000;
      if (Date.now() - lastActivityRef.current >= limit) {
        setIsLocked(true);
      }
    };
    const id = window.setInterval(tick, IDLE_CHECK_MS);
    return () => window.clearInterval(id);
  }, [userId, hydrated, authLoading, record.idleMinutes, record.mode, record.codeHash, record.salt]);

  // Activité utilisateur (fenêtre)
  useEffect(() => {
    if (!userId || !hydrated) return;
    let last = 0;
    const onAct = () => {
      if (isLocked) return;
      const now = Date.now();
      if (now - last < ACTIVITY_THROTTLE_MS) return;
      last = now;
      bumpActivity();
    };
    const opts = { capture: true, passive: true };
    window.addEventListener('pointerdown', onAct, opts);
    window.addEventListener('keydown', onAct, opts);
    window.addEventListener('wheel', onAct, opts);
    window.addEventListener('scroll', onAct, opts);
    return () => {
      window.removeEventListener('pointerdown', onAct, opts);
      window.removeEventListener('keydown', onAct, opts);
      window.removeEventListener('wheel', onAct, opts);
      window.removeEventListener('scroll', onAct, opts);
    };
  }, [userId, hydrated, isLocked, bumpActivity]);

  // Arrière-plan
  useEffect(() => {
    if (!userId || !hydrated) return;
    const onVis = () => {
      const r = recordRef.current;
      if (document.visibilityState === 'hidden') {
        wasHiddenRef.current = true;
        return;
      }
      if (document.visibilityState === 'visible' && wasHiddenRef.current) {
        wasHiddenRef.current = false;
        if (r.lockOnBackground && isLockConfigured(r)) {
          setIsLocked(true);
        }
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [userId, hydrated]);

  // Déverrouillage forcé à la déconnexion
  useEffect(() => {
    if (!userId) {
      setIsLocked(false);
    }
  }, [userId]);

  const lockoutRemainingMs = useMemo(() => {
    if (!lockoutUntilMs) return 0;
    const d = lockoutUntilMs - Date.now();
    return d > 0 ? d : 0;
  }, [lockoutUntilMs, record.lockoutUntil, lockoutTick]);

  useEffect(() => {
    if (!lockoutUntilMs || Date.now() >= lockoutUntilMs) return undefined;
    const id = window.setInterval(() => setLockoutTick((x) => x + 1), 400);
    return () => window.clearInterval(id);
  }, [lockoutUntilMs]);

  useEffect(() => {
    const r = record.lockoutUntil;
    if (!r) {
      setLockoutUntilMs(null);
      return;
    }
    const t = new Date(r).getTime();
    if (t > Date.now()) setLockoutUntilMs(t);
    else setLockoutUntilMs(null);
  }, [record.lockoutUntil]);

  const canUseAppLock = !!userId && hydrated && !authLoading;
  const lockReady = canUseAppLock && isLockConfigured(record);

  const value = useMemo(
    () => ({
      record,
      hydrated,
      isLocked,
      shakeToken,
      lockoutRemainingMs,
      canUseAppLock,
      lockReady,
      lockNow,
      unlockWithCode,
      updateSettings,
      setNewCode,
      clearCodeAndDisable,
      setLockBackground,
      bumpActivity,
      completeEmailRecovery,
      resetAppLockWithMainAccountPassword,
    }),
    [
      record,
      hydrated,
      isLocked,
      shakeToken,
      lockoutRemainingMs,
      canUseAppLock,
      lockReady,
      lockNow,
      unlockWithCode,
      updateSettings,
      setNewCode,
      clearCodeAndDisable,
      setLockBackground,
      bumpActivity,
      completeEmailRecovery,
      resetAppLockWithMainAccountPassword,
    ],
  );

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
};
