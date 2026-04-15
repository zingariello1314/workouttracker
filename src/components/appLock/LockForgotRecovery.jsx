import React, { useCallback, useEffect, useState } from 'react';
import { X, Mail, KeyRound, ShieldCheck, Loader2, Lock } from 'lucide-react';
import { requestAppLockRecoveryCode, verifyAppLockRecoveryCode } from '../../services/appLock/appLockRecoveryApi';
import { useAppLock } from '../../context/AppLockContext';

const MODE_OPTIONS = [
  { value: 'pin4', label: 'PIN 4 chiffres' },
  { value: 'pin6', label: 'PIN 6 chiffres' },
  { value: 'alphanumeric', label: 'Code texte (4–64 car.)' },
];

const normalizeLockMode = (m) =>
  m === 'pin4' || m === 'pin6' || m === 'alphanumeric' ? m : 'pin6';

const pinLenFor = (mode) => (mode === 'pin4' ? 4 : mode === 'pin6' ? 6 : null);

/**
 * Récupération du code app lock :
 * - Gratuit / local : mot de passe du compte Momentum (connexion)
 * - Optionnel : e-mail via backend (Resend, SMTP ou mode dev)
 */
const LockForgotRecovery = ({ isOpen, onClose, defaultEmail, lockMode }) => {
  const { completeEmailRecovery, resetAppLockWithMainAccountPassword } = useAppLock();
  const [channel, setChannel] = useState('password');
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [mainPwd, setMainPwd] = useState('');
  const [newA, setNewA] = useState('');
  const [newB, setNewB] = useState('');
  /** Type du nouveau code après récupération (peut différer de l’ancien verrou) */
  const [recoveryMode, setRecoveryMode] = useState(() => normalizeLockMode(lockMode));
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setChannel('password');
    setStep('email');
    setEmail((defaultEmail || '').trim());
    setEmailCode('');
    setResetToken('');
    setMainPwd('');
    setNewA('');
    setNewB('');
    setRecoveryMode(normalizeLockMode(lockMode));
    setMsg('');
    setErr('');
    setBusy(false);
  }, [isOpen, defaultEmail, lockMode]);

  const pinLen = pinLenFor(recoveryMode);

  const onRecoveryModeChange = (next) => {
    setRecoveryMode(next);
    setNewA('');
    setNewB('');
    setErr('');
  };

  const sendEmail = useCallback(async () => {
    setErr('');
    setMsg('');
    const em = email.trim();
    if (!em.includes('@')) {
      setErr('Adresse e-mail invalide.');
      return;
    }
    setBusy(true);
    try {
      const data = await requestAppLockRecoveryCode(em);
      if (!data.ok) {
        setErr(data.error || 'Envoi impossible.');
        return;
      }
      if (data.devMode) {
        setMsg(data.message || 'Consultez le terminal du serveur backend pour le code.');
      } else {
        setMsg('Si cette adresse est valide, un e-mail avec un code à 6 chiffres vient de partir.');
      }
      setStep('code');
    } catch (e) {
      setErr('Impossible de joindre le serveur (backend sur le port 8000 ?).');
    } finally {
      setBusy(false);
    }
  }, [email]);

  const verifyCode = useCallback(async () => {
    setErr('');
    setMsg('');
    const c = emailCode.trim();
    if (!/^\d{6}$/.test(c)) {
      setErr('Saisissez les 6 chiffres reçus par e-mail.');
      return;
    }
    setBusy(true);
    try {
      const data = await verifyAppLockRecoveryCode(email.trim(), c);
      if (!data.ok || !data.resetToken) {
        setErr(data.error || 'Code incorrect ou expiré.');
        return;
      }
      setResetToken(data.resetToken);
      setMsg('Code accepté. Choisissez un nouveau code de verrouillage.');
      setStep('newpin');
    } catch (e) {
      setErr('Erreur réseau.');
    } finally {
      setBusy(false);
    }
  }, [email, emailCode]);

  const submitEmailRecovery = useCallback(async () => {
    setErr('');
    setMsg('');
    if (newA !== newB) {
      setErr('Les deux saisies ne correspondent pas.');
      return;
    }
    if (recoveryMode === 'pin4' || recoveryMode === 'pin6') {
      if (!/^\d+$/.test(newA) || newA.length !== pinLen) {
        setErr(`Le nouveau code doit contenir exactement ${pinLen} chiffres.`);
        return;
      }
    } else if (recoveryMode === 'alphanumeric') {
      if (newA.length < 4 || newA.length > 64) {
        setErr('Le code doit faire entre 4 et 64 caractères.');
        return;
      }
    }
    setBusy(true);
    try {
      const out = await completeEmailRecovery({
        email: email.trim(),
        resetToken,
        newPlainCode: newA,
        mode: recoveryMode,
      });
      if (!out.success) {
        setErr(out.hint ? `${out.error || 'Erreur'}. ${out.hint}` : out.error || 'Échec.');
        return;
      }
      onClose();
    } catch (e) {
      setErr('Erreur inattendue.');
    } finally {
      setBusy(false);
    }
  }, [newA, newB, recoveryMode, pinLen, email, resetToken, completeEmailRecovery, onClose]);

  const submitPasswordRecovery = useCallback(async () => {
    setErr('');
    setMsg('');
    if (!mainPwd.trim()) {
      setErr('Saisissez le mot de passe de votre compte Momentum (page Connexion).');
      return;
    }
    if (newA !== newB) {
      setErr('Les deux nouveaux codes ne correspondent pas.');
      return;
    }
    if (recoveryMode === 'pin4' || recoveryMode === 'pin6') {
      if (!/^\d+$/.test(newA) || newA.length !== pinLen) {
        setErr(`Le nouveau code doit contenir exactement ${pinLen} chiffres.`);
        return;
      }
    } else if (recoveryMode === 'alphanumeric') {
      if (newA.length < 4 || newA.length > 64) {
        setErr('Le code doit faire entre 4 et 64 caractères.');
        return;
      }
    }
    setBusy(true);
    try {
      const out = await resetAppLockWithMainAccountPassword(mainPwd, newA, recoveryMode);
      if (!out.success) {
        if (out.error === 'BAD_MAIN_PASSWORD') {
          setErr('Mot de passe du compte incorrect.');
        } else if (out.error === 'NO_ACCOUNT_PASSWORD') {
          setErr('Ce compte n’a pas de mot de passe enregistré. Utilisez l’onglet e-mail ou créez un mot de passe dans Paramètres.');
        } else {
          setErr(out.error || 'Échec de la réinitialisation.');
        }
        return;
      }
      onClose();
    } catch (e) {
      setErr('Erreur inattendue.');
    } finally {
      setBusy(false);
    }
  }, [mainPwd, newA, newB, recoveryMode, pinLen, resetAppLockWithMainAccountPassword, onClose]);

  const switchChannel = (ch) => {
    setChannel(ch);
    setErr('');
    setMsg('');
    setStep('email');
    setEmailCode('');
    setResetToken('');
    setMainPwd('');
    setNewA('');
    setNewB('');
    setRecoveryMode(normalizeLockMode(lockMode));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-forgot-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-slate-900/95 shadow-2xl p-6 text-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="lock-forgot-title" className="text-lg font-semibold pr-10 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-sky-400" />
          Code oublié
        </h2>

        <div className="flex rounded-xl bg-slate-950/80 p-1 mb-5 border border-slate-700/80">
          <button
            type="button"
            onClick={() => switchChannel('password')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-medium transition ${
              channel === 'password'
                ? 'bg-gradient-to-r from-emerald-600/90 to-teal-600/90 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4 shrink-0" />
            Gratuit (mot de passe)
          </button>
          <button
            type="button"
            onClick={() => switchChannel('email')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-medium transition ${
              channel === 'email'
                ? 'bg-gradient-to-r from-sky-600/90 to-indigo-600/90 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4 shrink-0" />
            E-mail
          </button>
        </div>

        {channel === 'password' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              100 % gratuit, sans serveur : entrez le <strong className="text-slate-300">même mot de passe</strong> que
              sur l’écran de connexion Momentum, puis choisissez le <strong className="text-slate-300">type</strong> du
              nouveau verrou et saisissez le code <strong className="text-slate-300">deux fois</strong> (identique).
              Vous pouvez passer, par exemple, d’un PIN à un code texte.
            </p>
            <label className="block text-sm text-slate-300">Mot de passe du compte Momentum</label>
            <input
              type="password"
              autoComplete="current-password"
              value={mainPwd}
              onChange={(e) => setMainPwd(e.target.value)}
              disabled={busy}
              className="w-full rounded-xl bg-slate-950 border border-slate-600 px-3 py-2.5 text-sm"
              placeholder="Mot de passe de connexion"
            />

            <div className="pt-1 space-y-2">
              <span className="block text-sm text-slate-300">Nouveau type de code</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {MODE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    disabled={busy}
                    onClick={() => onRecoveryModeChange(o.value)}
                    className={`rounded-xl border px-2 py-2.5 text-xs font-medium transition ${
                      recoveryMode === o.value
                        ? 'border-sky-500 bg-sky-950/70 text-sky-100 shadow-inner'
                        : 'border-slate-600 bg-slate-950/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block text-sm text-slate-300">
              {recoveryMode === 'alphanumeric' ? 'Nouveau code (4 à 64 caractères)' : `Nouveau PIN (${pinLen} chiffres)`}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              inputMode={recoveryMode === 'alphanumeric' ? 'text' : 'numeric'}
              value={newA}
              onChange={(e) =>
                setNewA(
                  recoveryMode === 'alphanumeric' ? e.target.value : e.target.value.replace(/\D/g, '').slice(0, pinLen),
                )
              }
              disabled={busy}
              className="w-full rounded-xl bg-slate-950 border border-slate-600 px-3 py-2.5 text-sm"
              placeholder={recoveryMode === 'alphanumeric' ? 'Nouveau code' : '•'.repeat(pinLen)}
            />
            <label className="block text-sm text-slate-300">Confirmation (même code, deuxième saisie)</label>
            <input
              type="password"
              autoComplete="new-password"
              inputMode={recoveryMode === 'alphanumeric' ? 'text' : 'numeric'}
              value={newB}
              onChange={(e) =>
                setNewB(
                  recoveryMode === 'alphanumeric' ? e.target.value : e.target.value.replace(/\D/g, '').slice(0, pinLen),
                )
              }
              disabled={busy}
              className="w-full rounded-xl bg-slate-950 border border-slate-600 px-3 py-2.5 text-sm"
              placeholder={recoveryMode === 'alphanumeric' ? 'Retaper le même code' : 'Retaper le même PIN'}
            />
            <button
              type="button"
              disabled={busy}
              onClick={submitPasswordRecovery}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
              Réinitialiser et déverrouiller
            </button>
          </div>
        )}

        {channel === 'email' && (
          <>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Nécessite le backend sur le port 8000 avec Resend, SMTP ou{' '}
              <code className="text-sky-300">APP_LOCK_DEV_MAIL=1</code>. Le jeton expire 10 min après validation du
              code.
            </p>

            {step === 'email' && (
              <div className="space-y-4">
                <label className="block text-sm text-slate-300">E-mail du compte</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={busy}
                  className="w-full rounded-xl bg-slate-950 border border-slate-600 px-3 py-2.5 text-sm"
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                />
                {!defaultEmail && (
                  <p className="text-xs text-amber-200/90">
                    Même adresse que dans Paramètres → Profil, pour recevoir le mail.
                  </p>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={sendEmail}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 font-semibold text-white disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                  Recevoir le code par e-mail
                </button>
              </div>
            )}

            {step === 'code' && (
              <div className="space-y-4">
                <label className="block text-sm text-slate-300">Code à 6 chiffres</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={busy}
                  className="w-full tracking-[0.4em] text-center text-2xl font-mono rounded-xl bg-slate-950 border border-slate-600 px-3 py-3"
                  placeholder="000000"
                  autoComplete="one-time-code"
                />
                <button
                  type="button"
                  disabled={busy || emailCode.length !== 6}
                  onClick={verifyCode}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 font-semibold text-white disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
                  Vérifier le code
                </button>
                <button type="button" className="text-xs text-sky-300 hover:underline" onClick={() => setStep('email')}>
                  Modifier l’e-mail
                </button>
              </div>
            )}

            {step === 'newpin' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-300">
                  Choisissez le type du nouveau verrou, puis saisissez le code deux fois de suite.
                </p>
                <div className="space-y-2">
                  <span className="block text-sm text-slate-300">Nouveau type de code</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {MODE_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        disabled={busy}
                        onClick={() => onRecoveryModeChange(o.value)}
                        className={`rounded-xl border px-2 py-2.5 text-xs font-medium transition ${
                          recoveryMode === o.value
                            ? 'border-sky-500 bg-sky-950/70 text-sky-100 shadow-inner'
                            : 'border-slate-600 bg-slate-950/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block text-sm text-slate-300">
                  {recoveryMode === 'alphanumeric'
                    ? 'Nouveau code (4 à 64 caractères)'
                    : `Nouveau PIN (${pinLen} chiffres)`}
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  inputMode={recoveryMode === 'alphanumeric' ? 'text' : 'numeric'}
                  value={newA}
                  onChange={(e) =>
                    setNewA(
                      recoveryMode === 'alphanumeric'
                        ? e.target.value
                        : e.target.value.replace(/\D/g, '').slice(0, pinLen),
                    )
                  }
                  disabled={busy}
                  className="w-full rounded-xl bg-slate-950 border border-slate-600 px-3 py-2.5 text-sm"
                  placeholder={recoveryMode === 'alphanumeric' ? 'Nouveau code' : '•'.repeat(pinLen)}
                />
                <label className="block text-sm text-slate-300">Confirmation (même code, deuxième saisie)</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  inputMode={recoveryMode === 'alphanumeric' ? 'text' : 'numeric'}
                  value={newB}
                  onChange={(e) =>
                    setNewB(
                      recoveryMode === 'alphanumeric'
                        ? e.target.value
                        : e.target.value.replace(/\D/g, '').slice(0, pinLen),
                    )
                  }
                  disabled={busy}
                  className="w-full rounded-xl bg-slate-950 border border-slate-600 px-3 py-2.5 text-sm"
                  placeholder={recoveryMode === 'alphanumeric' ? 'Retaper le même code' : 'Retaper le même PIN'}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={submitEmailRecovery}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 font-semibold text-white disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enregistrer et déverrouiller'}
                </button>
              </div>
            )}
          </>
        )}

        {msg && <p className="mt-3 text-xs text-emerald-300">{msg}</p>}
        {err && <p className="mt-3 text-xs text-red-300">{err}</p>}
      </div>
    </div>
  );
};

export default LockForgotRecovery;
