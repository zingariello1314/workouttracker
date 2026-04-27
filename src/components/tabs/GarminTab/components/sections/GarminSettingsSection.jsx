import React, { useMemo, useState } from 'react';

const panelClass = 'rounded-xl border-2 border-[#0F4C5C]/70 bg-black p-4 shadow-md shadow-black/40';
const inputClass =
  'w-full rounded border border-[#0F4C5C]/50 bg-black px-3 py-2 text-sm text-teal-100 placeholder:text-teal-700 focus:border-sky-400 focus:outline-none';
const buttonPrimary =
  'rounded border border-[#0F5C45]/70 bg-[#0F5C45]/35 px-3 py-2 text-sm text-white hover:bg-[#0F5C45]/55';
const buttonDanger =
  'rounded border border-red-700/70 bg-red-900/30 px-3 py-2 text-sm text-red-100 hover:bg-red-900/50';

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function GarminSettingsSection({
  sources = [],
  activeSourceId = null,
  activeSource = null,
  loading = false,
  onAddSource,
  onRemoveSource,
  onSetActiveSource,
  onUpdateSource,
  onAddWatch,
  onRemoveWatch,
  onToggleWatch,
  onSyncNow,
  onBackfill,
  onVerifySource
}) {
  const [form, setForm] = useState({
    label: '',
    email: '',
    password: '',
    tokenNamespace: ''
  });

  const [watchForm, setWatchForm] = useState({
    label: '',
    deviceId: ''
  });

  const [backfillRange, setBackfillRange] = useState(() => {
    const end = todayStr();
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return { start, end };
  });
  const [verifyState, setVerifyState] = useState({
    loading: false,
    result: null,
    error: null
  });
  const [copyHint, setCopyHint] = useState('');
  const [wizardState, setWizardState] = useState({
    didSync: false,
    didBackfill: false
  });

  const canAddSource = useMemo(
    () => Boolean(form.label.trim() && form.email.trim() && form.password.trim()),
    [form]
  );

  const handleSubmitSource = (event) => {
    event.preventDefault();
    if (!canAddSource || typeof onAddSource !== 'function') return;
    onAddSource(form);
    setForm({ label: '', email: '', password: '', tokenNamespace: '' });
  };

  const handleAddWatch = (event) => {
    event.preventDefault();
    if (!activeSource || typeof onAddWatch !== 'function') return;
    if (!watchForm.label.trim() || !watchForm.deviceId.trim()) return;
    onAddWatch(activeSource.id, watchForm);
    setWatchForm({ label: '', deviceId: '' });
  };

  const handleVerifySource = async () => {
    if (!activeSource || typeof onVerifySource !== 'function') return;
    setVerifyState({ loading: true, result: null, error: null });
    const result = await onVerifySource(activeSource, { lookbackDays: 30 });
    if (!result?.ok) {
      setVerifyState({
        loading: false,
        result: null,
        error: result?.error || 'Verification impossible.'
      });
      return;
    }
    setVerifyState({
      loading: false,
      result,
      error: null
    });
    if (activeSource?.id && typeof onUpdateSource === 'function') {
      onUpdateSource(activeSource.id, {
        verifiedAt: new Date().toISOString(),
        verifiedEmail: result?.profile?.email || activeSource.email
      });
    }
  };

  const applyDetectedDevice = (device) => {
    if (!activeSource || !device?.deviceId || typeof onAddWatch !== 'function') return;
    onAddWatch(activeSource.id, {
      label: device.label || `Garmin ${device.deviceId}`,
      deviceId: String(device.deviceId)
    });
  };

  const copyDeviceId = async (deviceId) => {
    const value = String(deviceId || '').trim();
    if (!value) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        setCopyHint(`deviceId copie: ${value}`);
        window.setTimeout(() => setCopyHint(''), 1800);
      }
    } catch {
      setCopyHint('Impossible de copier automatiquement. Copie manuelle.');
      window.setTimeout(() => setCopyHint(''), 2200);
    }
  };

  const runSyncForWizard = () => {
    onSyncNow?.({ forceRefresh: false, skipDelay: true });
    setWizardState((prev) => ({ ...prev, didSync: true }));
  };

  const runBackfillForWizard = () => {
    onBackfill?.(backfillRange.start, backfillRange.end);
    setWizardState((prev) => ({ ...prev, didBackfill: true }));
  };

  const isSourceConnected = Boolean(activeSource);
  const isVerified = Boolean(activeSource?.verifiedAt || verifyState.result?.ok);
  const hasWatch = Boolean((activeSource?.watches || []).length > 0);
  const isWizardComplete = isSourceConnected && isVerified && hasWatch && wizardState.didSync;

  return (
    <div className="space-y-6">
      <div className={panelClass}>
        <h3 className="text-white font-semibold mb-2">Parametres Garmin</h3>
        <p className="text-xs text-teal-300/80">
          Configure des sources Garmin par compte utilisateur, puis lance la sync/backfill avec la
          source active. Les donnees restent scopees par utilisateur dans l&apos;app.
        </p>
      </div>

      <div className={`${panelClass} grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4`}>
        <div className="space-y-3">
          <h4 className="text-teal-100 font-medium">Sources connectees</h4>
          {sources.length === 0 ? (
            <p className="text-xs text-teal-700">Aucune source configuree.</p>
          ) : (
            <div className="space-y-2">
              {sources.map((source) => (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => onSetActiveSource?.(source.id)}
                  className={`w-full rounded border px-3 py-2 text-left ${
                    source.id === activeSourceId
                      ? 'border-sky-400 bg-[#0F4C5C]/30 text-sky-100'
                      : 'border-[#0F4C5C]/40 bg-black text-teal-100 hover:border-[#0F5C45]/70'
                  }`}
                >
                  <div className="font-medium">{source.label}</div>
                  <div className="text-xs opacity-80">{source.email}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <form onSubmit={handleSubmitSource} className="space-y-2">
            <div className="text-sm font-medium text-teal-100">Ajouter une source Garmin</div>
            <input
              className={inputClass}
              placeholder="Nom (ex: Montre perso)"
              value={form.label}
              onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
            />
            <input
              className={inputClass}
              placeholder="Email Garmin"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            <input
              className={inputClass}
              type="password"
              placeholder="Mot de passe Garmin"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            />
            <input
              className={inputClass}
              placeholder="Namespace tokens (optionnel)"
              value={form.tokenNamespace}
              onChange={(e) => setForm((prev) => ({ ...prev, tokenNamespace: e.target.value }))}
            />
            <button type="submit" className={buttonPrimary} disabled={!canAddSource || loading}>
              Ajouter la source
            </button>
          </form>

          {activeSource && (
            <div className="rounded border border-[#0F4C5C]/40 p-3 space-y-3">
              <div className="rounded border border-[#0F4C5C]/40 p-2 space-y-2">
                <div className="text-sm font-medium text-teal-100">Assistant guide (P4)</div>
                <div className="text-xs text-teal-700">
                  Suis ces etapes dans l&apos;ordre. Aucun changement de cooldown/sync n&apos;est applique.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className={`rounded border p-2 ${isSourceConnected ? 'border-emerald-700/60 text-emerald-300' : 'border-[#0F4C5C]/40 text-teal-200'}`}>
                    1) Source active: {isSourceConnected ? 'OK' : 'A faire'}
                  </div>
                  <div className={`rounded border p-2 ${isVerified ? 'border-emerald-700/60 text-emerald-300' : 'border-[#0F4C5C]/40 text-teal-200'}`}>
                    2) Compte verifie: {isVerified ? 'OK' : 'A faire'}
                  </div>
                  <div className={`rounded border p-2 ${hasWatch ? 'border-emerald-700/60 text-emerald-300' : 'border-[#0F4C5C]/40 text-teal-200'}`}>
                    3) Montre ajoutee: {hasWatch ? 'OK' : 'A faire'}
                  </div>
                  <div className={`rounded border p-2 ${wizardState.didSync ? 'border-emerald-700/60 text-emerald-300' : 'border-[#0F4C5C]/40 text-teal-200'}`}>
                    4) Sync lancee: {wizardState.didSync ? 'OK' : 'A faire'}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={buttonPrimary} disabled={loading || verifyState.loading} onClick={handleVerifySource}>
                    Etape 2: Verifier compte
                  </button>
                  <button type="button" className={buttonPrimary} disabled={loading || !hasWatch} onClick={runSyncForWizard}>
                    Etape 4: Lancer sync
                  </button>
                  <button type="button" className={buttonPrimary} disabled={loading} onClick={runBackfillForWizard}>
                    Etape 5: Lancer backfill
                  </button>
                </div>
                <div className={`text-xs ${isWizardComplete ? 'text-emerald-300' : 'text-teal-700'}`}>
                  {isWizardComplete
                    ? 'Assistant termine: ta source est prete et operationnelle.'
                    : 'Continue les etapes pour finaliser la configuration.'}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-teal-100 font-medium">{activeSource.label}</div>
                  <div className="text-xs text-teal-700">{activeSource.email}</div>
                  {activeSource.verifiedAt && (
                    <div className="text-[11px] text-emerald-300">
                      Compte verifie le {String(activeSource.verifiedAt).slice(0, 10)}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className={buttonDanger}
                  onClick={() => onRemoveSource?.(activeSource.id)}
                >
                  Supprimer
                </button>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-teal-100">Montres liees</div>
                {(activeSource.watches || []).length === 0 ? (
                  <p className="text-xs text-teal-700">Aucune montre ajoutee.</p>
                ) : (
                  <div className="space-y-2">
                    {activeSource.watches.map((watch) => (
                      <div
                        key={watch.id}
                        className="rounded border border-[#0F4C5C]/40 bg-black p-2 flex items-center justify-between gap-2"
                      >
                        <label className="flex items-center gap-2 text-sm text-teal-100">
                          <input
                            type="checkbox"
                            checked={watch.enabled !== false}
                            onChange={() => onToggleWatch?.(activeSource.id, watch.id)}
                          />
                          <span>
                            {watch.label} - <span className="text-teal-700">{watch.deviceId}</span>
                          </span>
                        </label>
                        <button
                          type="button"
                          className="text-xs text-red-300 hover:text-red-100"
                          onClick={() => onRemoveWatch?.(activeSource.id, watch.id)}
                        >
                          Suppr.
                        </button>
                        <button
                          type="button"
                          className="text-xs text-teal-300 hover:text-teal-100"
                          onClick={() => copyDeviceId(watch.deviceId)}
                        >
                          Copier deviceId
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleAddWatch} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    className={inputClass}
                    placeholder="Nom montre"
                    value={watchForm.label}
                    onChange={(e) => setWatchForm((prev) => ({ ...prev, label: e.target.value }))}
                  />
                  <input
                    className={inputClass}
                    placeholder="deviceId Garmin"
                    value={watchForm.deviceId}
                    onChange={(e) =>
                      setWatchForm((prev) => ({ ...prev, deviceId: e.target.value }))
                    }
                  />
                  <button type="submit" className={buttonPrimary} disabled={loading}>
                    Ajouter montre
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <button
                  type="button"
                  className={buttonPrimary}
                  disabled={loading}
                  onClick={runSyncForWizard}
                >
                  Synchroniser avec cette source
                </button>
                <button
                  type="button"
                  className={buttonPrimary}
                  disabled={loading}
                  onClick={() => onSyncNow?.({ forceRefresh: true, skipDelay: true })}
                >
                  Forcer sync (source active)
                </button>
              </div>

              <div className="rounded border border-[#0F4C5C]/40 p-2 space-y-2">
                <div className="text-sm font-medium text-teal-100">
                  Verifier le compte Garmin et detecter les deviceId
                </div>
                <p className="text-xs text-teal-700">
                  Cette verification est independante de la sync classique: elle ne change pas
                  ton flux actuel, n&apos;ajoute aucun cooldown dans l&apos;app et sert juste a
                  retrouver les montres vues sur les 30 derniers jours.
                </p>
                <button
                  type="button"
                  className={buttonPrimary}
                  disabled={loading || verifyState.loading}
                  onClick={handleVerifySource}
                >
                  {verifyState.loading ? 'Verification en cours...' : 'Verifier compte + detecter montres'}
                </button>

                {verifyState.error && (
                  <p className="text-xs text-red-300">{verifyState.error}</p>
                )}

                {verifyState.result?.ok && (
                  <div className="space-y-2">
                    <p className="text-xs text-emerald-300">
                      Compte verifie: {verifyState.result.profile?.email || activeSource.email}
                    </p>
                    {(verifyState.result.devices || []).length === 0 ? (
                      <p className="text-xs text-teal-700">
                        Aucune montre detectee automatiquement. Lance une sync puis reessaie.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {(verifyState.result.devices || []).map((device) => (
                          <div
                            key={device.deviceId}
                            className="rounded border border-[#0F4C5C]/40 bg-black p-2 flex items-center justify-between gap-2"
                          >
                            <div className="text-xs text-teal-100">
                              <div className="font-medium">{device.label || `Garmin ${device.deviceId}`}</div>
                              <div className="text-teal-700">
                                deviceId: {device.deviceId}
                                {device.lastSeenAt ? ` - vu le ${device.lastSeenAt}` : ''}
                              </div>
                            </div>
                            <button
                              type="button"
                              className={buttonPrimary}
                              onClick={() => applyDetectedDevice(device)}
                            >
                              Ajouter
                            </button>
                            <button
                              type="button"
                              className={buttonPrimary}
                              onClick={() => copyDeviceId(device.deviceId)}
                            >
                              Copier deviceId
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {copyHint && <p className="text-xs text-sky-300">{copyHint}</p>}
              </div>

              <div className="rounded border border-[#0F4C5C]/40 p-2 space-y-2">
                <div className="text-sm font-medium text-teal-100">Backfill source active</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    className={inputClass}
                    type="date"
                    value={backfillRange.start}
                    onChange={(e) =>
                      setBackfillRange((prev) => ({ ...prev, start: e.target.value }))
                    }
                  />
                  <input
                    className={inputClass}
                    type="date"
                    value={backfillRange.end}
                    onChange={(e) =>
                      setBackfillRange((prev) => ({ ...prev, end: e.target.value }))
                    }
                  />
                </div>
                <button
                  type="button"
                  className={buttonPrimary}
                  disabled={loading}
                  onClick={runBackfillForWizard}
                >
                  Lancer backfill
                </button>
                <div className="text-xs text-teal-700">
                  Comment recuperer un deviceId manuellement: lance une sync, ouvre ce bloc de verification,
                  puis clique sur "Verifier compte + detecter montres". Les deviceId detectes peuvent etre ajoutes
                  en un clic.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
