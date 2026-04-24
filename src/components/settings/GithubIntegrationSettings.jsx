import { useState } from 'react';
import { BookOpen, Github, KeyRound, Link2, Unplug } from 'lucide-react';
import {
  fetchGitHubRestUser,
  getGitHubClientId,
  getGitHubOAuthRedirectUri,
  startGitHubOAuthFlow,
} from '../../utils/githubApi';
import { useToast } from '../ui/Toast';
import Button from '../ui/Button';
import { Input } from '../ui/Input';

/**
 * Section Paramètres : liaison GitHub (OAuth + option jeton personnel si backend indisponible).
 */
export default function GithubIntegrationSettings({ currentUser, updateProfile }) {
  const { showSuccess, showError } = useToast();
  const [pat, setPat] = useState('');
  const [busy, setBusy] = useState(false);

  if (!currentUser) {
    return (
      <div
        id="settings-github"
        className="scroll-mt-4 rounded-xl border border-red-900/55 bg-black p-5 text-sm text-red-200/80"
      >
        Connecte-toi pour configurer GitHub.
      </div>
    );
  }

  const gh = currentUser.github || {};
  const connected = !!(gh.accessToken && gh.login);
  const clientId = getGitHubClientId();
  const redirectUri = typeof window !== 'undefined' ? getGitHubOAuthRedirectUri() : '';

  const handleDisconnect = async () => {
    if (!window.confirm('Déconnecter GitHub de ce compte Momentum ? Le module Code ne pourra plus charger tes contributions.')) {
      return;
    }
    setBusy(true);
    try {
      const r = await updateProfile({ github: null });
      if (!r?.success) throw new Error(r?.error || 'Échec');
      showSuccess('GitHub déconnecté.');
    } catch (e) {
      showError(e?.message || 'Erreur', { title: 'GitHub' });
    } finally {
      setBusy(false);
    }
  };

  const handleSavePat = async () => {
    const t = pat.trim();
    if (!t) {
      showError('Collez un jeton GitHub (classic ou fine-grained avec au moins lecture du profil).', {
        title: 'Jeton vide',
      });
      return;
    }
    setBusy(true);
    try {
      const me = await fetchGitHubRestUser(t);
      const r = await updateProfile({
        github: {
          accessToken: t,
          login: me.login,
          avatarUrl: me.avatar_url,
          htmlUrl: me.html_url,
          method: 'pat',
          connectedAt: new Date().toISOString(),
        },
      });
      if (!r?.success) throw new Error(r?.error || 'Échec enregistrement');
      setPat('');
      showSuccess(`GitHub « ${me.login} » enregistré via jeton personnel.`);
    } catch (e) {
      showError(e?.message || 'Jeton invalide ou API inaccessible', {
        title: 'GitHub',
        message:
          'Vérifie que le backend tourne (proxy /api/github) et que le jeton a les droits nécessaires (read:user pour OAuth classique).',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleOAuth = () => {
    if (!clientId) {
      showError(
        'Définissez VITE_GITHUB_CLIENT_ID dans .env.local puis redémarrez Vite.',
        { title: 'Configuration' },
      );
      return;
    }
    startGitHubOAuthFlow();
  };

  return (
    <div
      id="settings-github"
      className="scroll-mt-4 rounded-xl border border-red-900/55 bg-black p-5 shadow-lg shadow-black/40"
    >
      <div className="mb-4 flex items-center gap-2 border-b border-red-900/50 pb-3">
        <Github className="h-6 w-6 text-red-300" />
        <h3 className="text-lg font-semibold text-red-100">Intégration GitHub (module Code)</h3>
      </div>

      <div className="space-y-4 text-sm text-red-200/85">
        <p>
          Le module <strong className="text-white">Code & GitHub</strong> du dashboard affiche ton calendrier de
          contributions et des statistiques. Les jetons sont stockés sur ton profil Momentum (IndexedDB), liés à ton
          compte.
        </p>

        <div className="rounded-lg border border-red-900/40 bg-red-950/20 p-4 text-xs leading-relaxed text-red-100/90">
          <p className="mb-2 font-semibold text-red-50">Configuration développeur GitHub</p>
          <ol className="list-decimal space-y-1 pl-4">
            <li>
              Crée une{' '}
              <a
                href="https://github.com/settings/developers"
                target="_blank"
                rel="noreferrer"
                className="text-sky-300 underline hover:text-sky-200"
              >
                OAuth App
              </a>{' '}
              (type « Web »).
            </li>
            <li>
              <strong>Authorization callback URL</strong> (exacte) :{' '}
              <code className="rounded bg-black/60 px-1 py-0.5 text-emerald-200">{redirectUri || '…'}</code>
            </li>
            <li>
              Copie le <strong>Client ID</strong> dans <code className="text-emerald-200">.env.local</code> :{' '}
              <code className="rounded bg-black/60 px-1">VITE_GITHUB_CLIENT_ID=...</code>
            </li>
            <li>
              Copie le <strong>Client Secret</strong> dans le <code className="text-emerald-200">.env</code> à la
              racine du projet ou dans <code className="text-emerald-200">backend/.env</code> :{' '}
              <code className="rounded bg-black/60 px-1">GITHUB_CLIENT_SECRET=...</code> (et{' '}
              <code className="rounded bg-black/60 px-1">GITHUB_CLIENT_ID=...</code> côté serveur).
            </li>
            <li>Lance le backend FastAPI (port 8000) pour l&apos;échange OAuth et le proxy GraphQL.</li>
          </ol>
        </div>

        {connected ? (
          <div className="flex flex-col gap-3 rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {gh.avatarUrl ? (
                <img src={gh.avatarUrl} alt="" className="h-11 w-11 rounded-full border border-emerald-700/50" />
              ) : (
                <Github className="h-10 w-10 text-emerald-300" />
              )}
              <div>
                <div className="font-medium text-white">Connecté : @{gh.login}</div>
                <div className="text-xs text-emerald-200/80">
                  {gh.method === 'pat' ? 'Jeton personnel' : 'OAuth'} ·{' '}
                  {gh.connectedAt ? new Date(gh.connectedAt).toLocaleString('fr-FR') : ''}
                </div>
              </div>
            </div>
            <Button type="button" variant="danger" size="sm" icon={Unplug} onClick={handleDisconnect} disabled={busy}>
              Déconnecter GitHub
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="button" variant="primary" icon={Link2} onClick={handleOAuth} disabled={busy || !clientId}>
              Ouvrir GitHub (OAuth)
            </Button>
            {!clientId && (
              <span className="text-xs text-amber-200/90">
                Client ID Vite manquant — impossible de lancer OAuth depuis le navigateur.
              </span>
            )}
          </div>
        )}

        <div className="border-t border-red-900/40 pt-4">
          <div className="mb-2 flex items-center gap-2 text-red-50">
            <KeyRound className="h-4 w-4" />
            <span className="font-medium">Jeton personnel (optionnel)</span>
          </div>
          <p className="mb-3 text-xs text-red-200/75">
            Si le secret OAuth n&apos;est pas configuré sur le serveur, tu peux coller un PAT (accès{' '}
            <code className="text-emerald-200">read:user</code>) — même effet pour le module Code, à manier avec
            précaution.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Input
              type="password"
              autoComplete="off"
              placeholder="github_pat_… ou gho_…"
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              className="!border-red-900/50 !bg-black !text-red-50 sm:flex-1"
              containerClassName="sm:flex-1"
            />
            <Button type="button" variant="secondary" onClick={handleSavePat} disabled={busy}>
              Enregistrer le jeton
            </Button>
          </div>
        </div>

        <p className="flex items-start gap-2 text-xs text-red-300/70">
          <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Après OAuth, tu es renvoyé vers l&apos;app avec <code className="text-emerald-200">?oauth=github</code> ; le
          jeton n&apos;est jamais échangé sans le secret serveur.
        </p>
      </div>
    </div>
  );
}
