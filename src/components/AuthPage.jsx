import React, { useState, useEffect, useTransition } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { useTranslation } from '../utils/translations';
import Hyperspeed from './ui/Hyperspeed/Hyperspeed';
import { hyperspeedPresets } from './ui/Hyperspeed/hyperspeedPresets';
import { requestEmailVerificationCode, verifyEmailCode } from '../utils/emailVerificationService';
import { addAvatar, addCardIcon } from '../services/profileCard/profileCardStorage';

const checkWebGLSupport = () => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
};

const AuthPage = () => {
  const { isAuthenticated, loading, error, register, login, setError, currentUser, updateProfile } = useAuth();
  const { setActiveTab } = useWorkout();
  useTranslation();

  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const hasMinLength = password.length >= 8;
  const isStrongPassword = hasUppercase && hasSpecialChar && hasMinLength;
  const [inspirationalPhrase, setInspirationalPhrase] = useState('');
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [cardPhotoFile, setCardPhotoFile] = useState(null);
  const [homeBackgroundFile, setHomeBackgroundFile] = useState(null);
  const [onboardingApplied, setOnboardingApplied] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setWebglSupported(checkWebGLSupport());
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isAuthenticated) setActiveTab('today');
  }, [isAuthenticated, setActiveTab]);

  useEffect(() => {
    if (!isAuthenticated || mode !== 'register' || !currentUser?.id) return;
    if (!inspirationalPhrase.trim()) return;
    void updateProfile({ inspirationalPhrase: inspirationalPhrase.trim(), preferredHomeQuote: inspirationalPhrase.trim() });
  }, [currentUser?.id, inspirationalPhrase, isAuthenticated, mode, updateProfile]);

  useEffect(() => {
    if (!isAuthenticated || mode !== 'register' || !currentUser?.id || onboardingApplied) return;
    const run = async () => {
      try {
        const usernameKey = currentUser?.username || username;
        if (profilePhotoFile) {
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(profilePhotoFile);
          });
          await addAvatar(usernameKey, dataUrl);
        }
        if (cardPhotoFile) {
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(cardPhotoFile);
          });
          await addCardIcon(usernameKey, dataUrl);
        }
        if (homeBackgroundFile && typeof indexedDB !== 'undefined') {
          const bgDataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(homeBackgroundFile);
          });
          await new Promise((resolve, reject) => {
            const request = indexedDB.open('HomepageImagesDB', 3);
            request.onerror = () => reject(request.error);
            request.onupgradeneeded = (event) => {
              const db = event.target.result;
              if (!db.objectStoreNames.contains('images')) {
                const store = db.createObjectStore('images', { keyPath: 'id' });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
              }
            };
            request.onsuccess = (event) => {
              const db = event.target.result;
              const typeKey = `homepage_background_user-${currentUser.id}`;
              const tx = db.transaction(['images'], 'readwrite');
              const store = tx.objectStore('images');
              const getReq = store.getAll();
              getReq.onsuccess = () => {
                (getReq.result || []).forEach((item) => {
                  if (item.type === typeKey) {
                    store.delete(item.id);
                  }
                });
                store.add({
                  id: `homepage_bg_${Date.now()}_onboarding`,
                  type: typeKey,
                  data: bgDataUrl,
                  timestamp: new Date().toISOString(),
                  version: '2.0'
                });
              };
              tx.oncomplete = () => {
                db.close();
                resolve();
              };
              tx.onerror = () => reject(tx.error);
            };
          });
        }
      } finally {
        setOnboardingApplied(true);
      }
    };
    void run();
  }, [cardPhotoFile, currentUser?.id, currentUser?.username, homeBackgroundFile, isAuthenticated, mode, onboardingApplied, profilePhotoFile, username]);

  const resetError = () => {
    if (error && setError) setError(null);
  };

  const requestCode = async () => {
    if (!email) return;
    const result = await requestEmailVerificationCode({ email, displayName: `${firstName} ${lastName}`.trim() });
    if (!result.success) {
      setEmailStatus("Impossible d'envoyer le code.");
      return;
    }
    if (result.delivery === 'email') {
      setEmailStatus('Code envoyé par email (valide 10 min).');
    } else {
      setEmailStatus(`Mode fallback actif. Code: ${result.debugCode}`);
    }
  };

  const validateCode = () => {
    const result = verifyEmailCode({ email, code: emailCode });
    if (!result.success) {
      setEmailStatus('Code invalide ou expiré.');
      setEmailVerified(false);
      return;
    }
    setEmailVerified(true);
    setEmailStatus('Email vérifié.');
  };

  const canContinueFromStep1 = Boolean(
    username.trim() &&
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    confirmEmail.trim() &&
    email.trim().toLowerCase() === confirmEmail.trim().toLowerCase()
  );
  const canContinueFromStep2 = emailVerified;
  const canContinueFromStep3 = Boolean(password && confirmPassword && password === confirmPassword && isStrongPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetError();
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login({ username, password, remember });
        return;
      }
      if (!emailVerified) {
        setEmailStatus("Vérifie l'email avant de créer le compte.");
        return;
      }
      await register({ username, email, password, firstName, lastName, emailVerifiedAtSignup: emailVerified });
    } finally {
      setSubmitting(false);
    }
  };

  const errorMessage = error === 'USERNAME_TAKEN'
    ? 'Ce nom d’utilisateur est déjà utilisé.'
    : error === 'INVALID_CREDENTIALS'
      ? 'Identifiants invalides.'
      : error === 'PASSWORD_POLICY_FAILED'
        ? 'Mot de passe invalide: minimum 8 caractères, 1 majuscule, 1 caractère spécial.'
      : error === 'CREATE_FAILED'
        ? 'Erreur lors de la création du compte.'
        : error === 'LOGIN_FAILED'
          ? 'Erreur lors de la connexion.'
          : null;

  const optimizedOptions = isMobile
    ? { ...hyperspeedPresets.one, totalSideLightSticks: 15, lightPairsPerRoadWay: 30, lanesPerRoad: 2 }
    : hyperspeedPresets.one;

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden">
      <div className="fixed inset-0 z-0 w-full h-full">
        {webglSupported ? <Hyperspeed effectOptions={optimizedOptions} /> : <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />}
      </div>

      <div className="relative z-10 max-w-3xl w-full grid gap-8 md:grid-cols-2 items-stretch">
        <Card variant="glass" padding="lg" className="h-full flex flex-col justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-4 text-white">{mode === 'login' ? 'Connexion à Momentum' : 'Inscription guidée Momentum'}</h2>
            <p className="text-slate-300 text-sm mb-6">
              {mode === 'login'
                ? 'Connecte-toi pour retrouver toutes tes données.'
                : 'Inscription en 4 étapes : identité, vérification email, sécurité, personnalisation.'}
            </p>
          </div>
          <div className="space-y-3 text-xs text-slate-400">
            {mode === 'register' && <p>Étape actuelle: {registerStep}/4</p>}
            <p>• Les données restent locales (IndexedDB).</p>
            <p>• Les images et préférences sont compartimentées par compte.</p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10">
            <Button onClick={() => startTransition(() => setActiveTab('pricing'))} variant="primary" className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
              ⭐ Passer à l'abonnement premium
            </Button>
          </div>
        </Card>

        <Card variant="glass" padding="lg" className="h-full">
          <div className="flex mb-6 border-b border-white/10">
            <button type="button" onClick={() => { setMode('login'); resetError(); }} className={`flex-1 py-2 text-sm font-semibold ${mode === 'login' ? 'text-white border-b-2 border-purple-400' : 'text-slate-400 hover:text-slate-200'}`}>Se connecter</button>
            <button type="button" onClick={() => { setMode('register'); resetError(); }} className={`flex-1 py-2 text-sm font-semibold ${mode === 'register' ? 'text-white border-b-2 border-purple-400' : 'text-slate-400 hover:text-slate-200'}`}>Créer un compte</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'login' && (
              <>
                <Input label="Nom d’utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} required variant="glass" />
                <Input label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required variant="glass" minLength={8} autoComplete="current-password" />
                <label className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded border-slate-500 bg-slate-800 text-purple-400 focus:ring-purple-500" />
                  Se souvenir de moi sur cet appareil
                </label>
                <Button type="submit" variant="primary" className="w-full" disabled={loading || submitting}>
                  {submitting || loading ? 'Connexion…' : 'Se connecter'}
                </Button>
              </>
            )}

            {mode === 'register' && registerStep === 1 && (
              <>
                <Input label="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} required variant="glass" />
                <Input label="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} required variant="glass" />
                <Input label="Nom d’utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} required variant="glass" />
                <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required variant="glass" />
                <Input
                  label="Confirmer l'email"
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  required
                  variant="glass"
                />
                {email && confirmEmail && email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase() && (
                  <div className="text-xs text-red-400">Les deux adresses email doivent être identiques.</div>
                )}
                <Button type="button" variant="secondary" className="w-full" disabled={!canContinueFromStep1} onClick={() => setRegisterStep(2)}>Continuer</Button>
              </>
            )}

            {mode === 'register' && registerStep === 2 && (
              <>
                <div className="text-xs text-slate-300">Vérification email: {email}</div>
                <Button type="button" variant="secondary" className="w-full" onClick={requestCode}>Envoyer un code</Button>
                <Input label="Code reçu" value={emailCode} onChange={(e) => setEmailCode(e.target.value)} variant="glass" />
                <Button type="button" variant="secondary" className="w-full" onClick={validateCode}>Vérifier le code</Button>
                {emailStatus && <div className="text-xs text-slate-300">{emailStatus}</div>}
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" className="w-full" onClick={() => setRegisterStep(1)}>Retour</Button>
                  <Button type="button" variant="primary" className="w-full" disabled={!canContinueFromStep2} onClick={() => setRegisterStep(3)}>Continuer</Button>
                </div>
              </>
            )}

            {mode === 'register' && registerStep === 3 && (
              <>
                <Input label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required variant="glass" minLength={8} autoComplete="new-password" />
                <Input label="Confirmer le mot de passe" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required variant="glass" minLength={8} autoComplete="new-password" />
                <div className="text-xs text-slate-300">
                  Règles mot de passe: 8 caractères minimum, au moins 1 majuscule, au moins 1 caractère spécial.
                </div>
                {!hasMinLength && password.length > 0 && (
                  <div className="text-xs text-red-400">Le mot de passe doit contenir au moins 8 caractères.</div>
                )}
                {!hasUppercase && password.length > 0 && (
                  <div className="text-xs text-red-400">Le mot de passe doit contenir au moins une lettre majuscule.</div>
                )}
                {!hasSpecialChar && password.length > 0 && (
                  <div className="text-xs text-red-400">Le mot de passe doit contenir au moins un caractère spécial.</div>
                )}
                {password && confirmPassword && password !== confirmPassword && (
                  <div className="text-xs text-red-400">Les mots de passe ne correspondent pas.</div>
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" className="w-full" onClick={() => setRegisterStep(2)}>Retour</Button>
                  <Button type="button" variant="primary" className="w-full" disabled={!canContinueFromStep3} onClick={() => setRegisterStep(4)}>Continuer</Button>
                </div>
              </>
            )}

            {mode === 'register' && registerStep === 4 && (
              <>
                <Input
                  label="Phrase inspirante (affichée sur la page d'accueil)"
                  value={inspirationalPhrase}
                  onChange={(e) => setInspirationalPhrase(e.target.value)}
                  variant="glass"
                />
                <label className="text-xs text-slate-300 block">
                  Photo de profil (optionnel)
                  <input type="file" accept="image/*" onChange={(e) => setProfilePhotoFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-xs" />
                </label>
                <label className="text-xs text-slate-300 block">
                  Photo carte sidebar (optionnel)
                  <input type="file" accept="image/*" onChange={(e) => setCardPhotoFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-xs" />
                </label>
                <label className="text-xs text-slate-300 block">
                  Image de fond accueil (optionnel)
                  <input type="file" accept="image/*" onChange={(e) => setHomeBackgroundFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-xs" />
                </label>
                <div className="text-xs text-slate-300">Les photos profil/carte/fond seront paramétrables juste après inscription dans Paramètres &gt; Mon profil.</div>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" className="w-full" onClick={() => setRegisterStep(3)}>Retour</Button>
                  <Button type="submit" variant="primary" className="w-full" disabled={loading || submitting}>
                    {submitting || loading ? 'Création du compte…' : 'Créer mon compte'}
                  </Button>
                </div>
              </>
            )}

            {errorMessage && <div className="text-xs text-red-400 mt-2">{errorMessage}</div>}
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;


