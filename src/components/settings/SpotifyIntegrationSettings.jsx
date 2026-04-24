import { useState } from 'react';
import { Link2, Music2, Unplug } from 'lucide-react';
import { useToast } from '../ui/Toast';
import Button from '../ui/Button';
import { getSpotifyClientId, getSpotifyOAuthRedirectUri, startSpotifyOAuthFlow } from '../../utils/spotifyApi';

export default function SpotifyIntegrationSettings({ currentUser, updateProfile }) {
  const { showError, showSuccess } = useToast();
  const [busy, setBusy] = useState(false);

  if (!currentUser) {
    return (
      <div id="settings-spotify" className="scroll-mt-4 rounded-xl border border-red-900/55 bg-black p-5 text-sm text-red-200/80">
        Connecte-toi pour configurer Spotify.
      </div>
    );
  }

  const spotify = currentUser.spotify || null;
  const connected = !!(spotify?.accessToken && spotify?.userId);
  const clientId = getSpotifyClientId();
  const redirectUri = typeof window !== 'undefined' ? getSpotifyOAuthRedirectUri() : '';

  const disconnect = async () => {
    if (!window.confirm('Déconnecter Spotify de ce compte Momentum ?')) return;
    setBusy(true);
    try {
      const r = await updateProfile({ spotify: null });
      if (!r?.success) throw new Error(r?.error || 'Échec');
      showSuccess('Spotify déconnecté.');
    } catch (e) {
      showError(e?.message || 'Erreur de déconnexion', { title: 'Spotify' });
    } finally {
      setBusy(false);
    }
  };

  const connect = async () => {
    if (!clientId) {
      showError('Définissez VITE_SPOTIFY_CLIENT_ID dans .env.local puis redémarrez Vite.', {
        title: 'Configuration Spotify',
      });
      return;
    }
    await startSpotifyOAuthFlow();
  };

  return (
    <div id="settings-spotify" className="scroll-mt-4 rounded-xl border border-red-900/55 bg-black p-5 shadow-lg shadow-black/40">
      <div className="mb-4 flex items-center gap-2 border-b border-red-900/50 pb-3">
        <Music2 className="h-6 w-6 text-emerald-300" />
        <h3 className="text-lg font-semibold text-red-100">Intégration Spotify (Premium)</h3>
      </div>

      <div className="space-y-4 text-sm text-red-200/85">
        <p>
          Lie ton compte Spotify pour afficher le son en cours dans la sidebar (carte Spotify).
        </p>

        <div className="rounded-lg border border-red-900/40 bg-red-950/20 p-4 text-xs leading-relaxed text-red-100/90">
          <p className="mb-2 font-semibold text-red-50">Configuration développeur Spotify</p>
          <ol className="list-decimal space-y-1 pl-4">
            <li>
              Crée une app sur{' '}
              <a
                href="https://developer.spotify.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-300 underline hover:text-emerald-200"
              >
                Spotify Developer Dashboard
              </a>.
            </li>
            <li>
              Ajoute cette Redirect URI (identique, caractère par caractère) :{' '}
              <code className="rounded bg-black/60 px-1 py-0.5 text-emerald-200">{redirectUri || '...'}</code>
              <span className="mt-1 block text-amber-200/90">
                En local, utilise <strong className="text-amber-100">127.0.0.1</strong> et le bon port (ex.{' '}
                <code className="text-emerald-200">3001</code>), pas <code className="text-emerald-200">localhost</code> — comme indiqué par Spotify.
              </span>
            </li>
            <li>
              Mets le Client ID dans <code className="rounded bg-black/60 px-1 py-0.5 text-emerald-200">.env.local</code> :{' '}
              <code className="rounded bg-black/60 px-1 py-0.5">VITE_SPOTIFY_CLIENT_ID=...</code>
            </li>
          </ol>
        </div>

        {connected ? (
          <div className="flex flex-col gap-3 rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-medium text-white">
                Connecté : {spotify.displayName || spotify.userId}
              </div>
              <div className="text-xs text-emerald-200/80">
                Offre : {spotify.product || 'inconnue'} ·{' '}
                {spotify.connectedAt ? new Date(spotify.connectedAt).toLocaleString('fr-FR') : ''}
              </div>
            </div>
            <Button type="button" variant="danger" size="sm" icon={Unplug} onClick={disconnect} disabled={busy}>
              Déconnecter Spotify
            </Button>
          </div>
        ) : (
          <Button type="button" variant="primary" icon={Link2} onClick={connect} disabled={busy || !clientId}>
            Connecter Spotify
          </Button>
        )}
      </div>
    </div>
  );
}
