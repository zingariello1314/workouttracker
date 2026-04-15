import React, { useCallback, useEffect, useState } from 'react';
import { Lock, Shield, Image as ImageIcon, Timer, Smartphone } from 'lucide-react';
import { useAppLock } from '../../context/AppLockContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';

const IDLE_OPTIONS = [
  { value: null, label: 'Jamais (inactivité)' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 h' },
  { value: 90, label: '1 h 30' },
  { value: 120, label: '2 h' },
];

const MAX_BG_BYTES = 4 * 1024 * 1024;

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/**
 * Bloc Paramètres : verrouillage d'application par compte.
 */
const AppLockSettingsPanel = () => {
  const {
    record,
    canUseAppLock,
    updateSettings,
    setNewCode,
    clearCodeAndDisable,
    setLockBackground,
  } = useAppLock();

  const [modeDraft, setModeDraft] = useState(record.mode);
  const [idleDraft, setIdleDraft] = useState(record.idleMinutes);
  const [bgDraft, setBgDraft] = useState(record.lockOnBackground);
  const [codeA, setCodeA] = useState('');
  const [codeB, setCodeB] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setModeDraft(record.mode);
    setIdleDraft(record.idleMinutes);
    setBgDraft(record.lockOnBackground);
  }, [record.mode, record.idleMinutes, record.lockOnBackground]);

  const hasCode = !!(record.codeHash && record.salt);

  const applyTimingOnly = useCallback(async () => {
    setSaving(true);
    setErr('');
    setMsg('');
    try {
      await updateSettings({
        idleMinutes: idleDraft,
        lockOnBackground: bgDraft,
      });
      setMsg('Délai d’inactivité et option d’arrière-plan enregistrés.');
      setTimeout(() => setMsg(''), 2500);
    } catch (e) {
      setErr('Impossible d’enregistrer. Réessayez.');
    } finally {
      setSaving(false);
    }
  }, [idleDraft, bgDraft, updateSettings]);

  const saveNewCode = useCallback(async () => {
    setErr('');
    setMsg('');
    if (modeDraft === 'disabled') {
      setErr('Choisissez un type de code (PIN ou texte) avant de définir un code.');
      return;
    }
    if (codeA !== codeB) {
      setErr('Les deux saisies ne correspondent pas.');
      return;
    }
    const len = modeDraft === 'pin4' ? 4 : modeDraft === 'pin6' ? 6 : null;
    if (len && (!/^\d+$/.test(codeA) || codeA.length !== len)) {
      setErr(`Le code doit contenir exactement ${len} chiffres.`);
      return;
    }
    if (modeDraft === 'alphanumeric' && (codeA.length < 4 || codeA.length > 64)) {
      setErr('Le code texte doit faire entre 4 et 64 caractères.');
      return;
    }
    setSaving(true);
    try {
      const res = await setNewCode(codeA, modeDraft);
      if (!res.success) {
        setErr('Code invalide.');
        setSaving(false);
        return;
      }
      await updateSettings({
        idleMinutes: idleDraft,
        lockOnBackground: bgDraft,
      });
      setCodeA('');
      setCodeB('');
      setMsg('Code enregistré. Le verrouillage est actif pour ce compte.');
      setTimeout(() => setMsg(''), 4000);
    } catch (e) {
      setErr('Erreur lors de l’enregistrement du code.');
    } finally {
      setSaving(false);
    }
  }, [modeDraft, idleDraft, bgDraft, codeA, codeB, setNewCode, updateSettings]);

  const disableLock = useCallback(async () => {
    if (!window.confirm('Désactiver le verrouillage et effacer le code pour ce compte ?')) return;
    setSaving(true);
    setErr('');
    try {
      await clearCodeAndDisable();
      setModeDraft('disabled');
      setCodeA('');
      setCodeB('');
      setMsg('Verrouillage désactivé.');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setErr('Échec de la désactivation.');
    } finally {
      setSaving(false);
    }
  }, [clearCodeAndDisable]);

  const onPickBackground = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErr('Choisissez une image (JPEG, PNG, WebP…).');
      return;
    }
    if (file.size > MAX_BG_BYTES) {
      setErr('Image trop volumineuse (max 4 Mo).');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (typeof dataUrl === 'string' && dataUrl.length > 2_000_000) {
        setErr('Image trop lourde après lecture — choisissez un fichier plus petit.');
        setSaving(false);
        return;
      }
      await setLockBackground(dataUrl);
      setMsg('Fond de l’écran de verrouillage mis à jour.');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setErr('Lecture du fichier impossible.');
    } finally {
      setSaving(false);
    }
  };

  const clearBackground = async () => {
    setSaving(true);
    setErr('');
    try {
      await setLockBackground(null);
      setMsg('Fond réinitialisé (dégradé par défaut).');
      setTimeout(() => setMsg(''), 2500);
    } catch {
      setErr('Impossible d’effacer le fond.');
    } finally {
      setSaving(false);
    }
  };

  if (!canUseAppLock) {
    return (
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Lock className="mr-2" size={20} />
            Verrouillage de l’application
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-sm">Connectez-vous pour configurer le verrouillage par compte.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <Shield className="mr-2" size={20} />
          Verrouillage de l’application
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-slate-300 text-sm">
          Verrouillage optionnel par compte : aucun code, PIN à 4 ou 6 chiffres, ou code texte. Le code n’est
          jamais stocké en clair (empreinte sécurisée dans votre navigateur).
        </p>
        <p className="text-xs text-slate-400 rounded-lg border border-slate-600/50 bg-slate-950/50 p-3 leading-relaxed">
          <span className="font-medium text-slate-300">Oubli du code :</span> sur l’écran de verrouillage, l’onglet{' '}
          <span className="text-slate-300">Gratuit (mot de passe)</span> permet de réinitialiser avec le mot de passe
          Momentum du compte (tout en local, sans serveur) en choisissant un nouveau type (PIN 4, PIN 6 ou texte) et en
          saisissant le code deux fois. L’onglet e-mail envoie un code à 6 chiffres via FastAPI
          (port 8000) : <code className="text-sky-300">RESEND_API_KEY</code>, <code className="text-sky-300">APP_LOCK_EMAIL_FROM</code>, variables{' '}
          <code className="text-sky-300">SMTP_*</code>, ou <code className="text-sky-300">APP_LOCK_DEV_MAIL=1</code> en dev (code dans le terminal).
        </p>

        <div className="rounded-xl border border-slate-600/60 bg-slate-900/40 p-4 space-y-4">
          <h4 className="text-white font-medium flex items-center gap-2">
            <Timer size={18} className="text-emerald-300" />
            Délai d’inactivité
          </h4>
          <p className="text-xs text-slate-400">
            Après cette durée sans interaction, l’application se verrouille (si un code est défini).
          </p>
          <select
            value={idleDraft === null || idleDraft === undefined ? '' : String(idleDraft)}
            onChange={(e) => {
              const v = e.target.value;
              setIdleDraft(v === '' ? null : Number(v));
            }}
            className="w-full max-w-md rounded-lg bg-slate-900 border border-slate-600 text-slate-100 px-3 py-2 text-sm"
          >
            {IDLE_OPTIONS.map((o) => (
              <option key={o.label} value={o.value === null ? '' : String(o.value)}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-slate-600/60 bg-slate-900/40 p-4 space-y-3">
          <h4 className="text-white font-medium flex items-center gap-2">
            <Smartphone size={18} className="text-cyan-300" />
            Retour depuis une autre application
          </h4>
          <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={bgDraft}
              onChange={(e) => setBgDraft(e.target.checked)}
              className="rounded border-slate-500"
            />
            Verrouiller quand l’onglet repasse au premier plan après avoir été en arrière-plan
          </label>
        </div>

        <div className="rounded-xl border border-slate-600/60 bg-slate-900/40 p-4 space-y-3">
          <h4 className="text-white font-medium">Type de protection</h4>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
              <input
                type="radio"
                name="app-lock-mode"
                checked={modeDraft === 'disabled'}
                onChange={() => setModeDraft('disabled')}
              />
              Aucun verrouillage (pas de code)
            </label>
            {hasCode && modeDraft === 'disabled' && (
              <p className="text-xs text-amber-200/90 pl-6">
                Pour retirer le code déjà enregistré, utilisez aussi « Tout désactiver » ci-dessous.
              </p>
            )}
            <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
              <input
                type="radio"
                name="app-lock-mode"
                checked={modeDraft === 'pin4'}
                onChange={() => setModeDraft('pin4')}
              />
              PIN — 4 chiffres
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
              <input
                type="radio"
                name="app-lock-mode"
                checked={modeDraft === 'pin6'}
                onChange={() => setModeDraft('pin6')}
              />
              PIN — 6 chiffres
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
              <input
                type="radio"
                name="app-lock-mode"
                checked={modeDraft === 'alphanumeric'}
                onChange={() => setModeDraft('alphanumeric')}
              />
              Code texte (clavier physique ou visuel, 4 à 64 caractères)
            </label>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={applyTimingOnly}
            className="mt-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-medium text-white disabled:opacity-50"
          >
            Enregistrer délai & options d’arrière-plan
          </button>
        </div>

        {modeDraft !== 'disabled' && (
          <div className="rounded-xl border border-emerald-700/40 bg-emerald-950/20 p-4 space-y-3">
            <h4 className="text-emerald-100 font-medium">Définir ou changer le code</h4>
            <p className="text-xs text-slate-400">
              Saisissez deux fois le même code. Si un code existe déjà, il sera remplacé.
            </p>
            <input
              type="password"
              autoComplete="new-password"
              value={codeA}
              onChange={(e) => setCodeA(e.target.value)}
              placeholder="Nouveau code"
              className="w-full max-w-md rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-sm text-white"
            />
            <input
              type="password"
              autoComplete="new-password"
              value={codeB}
              onChange={(e) => setCodeB(e.target.value)}
              placeholder="Confirmer le code"
              className="w-full max-w-md rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              disabled={saving}
              onClick={saveNewCode}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              Enregistrer le code
            </button>
          </div>
        )}

        {hasCode && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={disableLock}
              className="px-4 py-2 rounded-lg border border-red-500/50 text-red-200 hover:bg-red-950/40 text-sm"
            >
              Tout désactiver (supprimer le code)
            </button>
          </div>
        )}

        <div className="rounded-xl border border-slate-600/60 bg-slate-900/40 p-4 space-y-3">
          <h4 className="text-white font-medium flex items-center gap-2">
            <ImageIcon size={18} className="text-slate-300" />
            Fond de l’écran de verrouillage
          </h4>
          <p className="text-xs text-slate-400">Image affichée derrière le pavé (optionnel, max 4 Mo).</p>
          {record.lockBackgroundDataUrl && (
            <div className="rounded-lg overflow-hidden border border-slate-600 max-h-40 w-full max-w-xs">
              <img src={record.lockBackgroundDataUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <label className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm cursor-pointer text-white">
              Choisir une image
              <input type="file" accept="image/*" className="hidden" onChange={onPickBackground} />
            </label>
            {record.lockBackgroundDataUrl && (
              <button
                type="button"
                onClick={clearBackground}
                disabled={saving}
                className="px-4 py-2 rounded-lg border border-slate-500 text-sm text-slate-200 hover:bg-slate-800"
              >
                Retirer le fond
              </button>
            )}
          </div>
        </div>

        {msg && <p className="text-sm text-emerald-300">{msg}</p>}
        {err && <p className="text-sm text-red-300">{err}</p>}
      </CardContent>
    </Card>
  );
};

export default AppLockSettingsPanel;
