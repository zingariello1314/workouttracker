import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useToast } from '../ui/Toast';
import {
  clearStoredOAuthState,
  exchangeGitHubOAuthCode,
  fetchGitHubRestUser,
  getGitHubOAuthRedirectUri,
  readStoredOAuthState,
} from '../../utils/githubApi';

/**
 * Traite le retour OAuth GitHub (?oauth=github&code=…&state=…) puis nettoie l’URL.
 * Doit être rendu sous AuthProvider + WorkoutProvider + ToastProvider.
 */
export default function GitHubOAuthLanding() {
  const { currentUser, isAuthenticated, updateProfile, loading: authLoading } = useAuth();
  const { setActiveTab } = useWorkout();
  const { showSuccess, showError } = useToast();
  const processedCode = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth') !== 'github') return;
    const code = params.get('code');
    const state = params.get('state');
    if (!code) return;
    if (authLoading) return;
    if (processedCode.current === code) return;
    processedCode.current = code;

    const cleanUrl = () => {
      try {
        const u = new URL(window.location.href);
        u.searchParams.delete('oauth');
        u.searchParams.delete('code');
        u.searchParams.delete('state');
        const q = u.searchParams.toString();
        const path = `${u.pathname}${q ? `?${q}` : ''}${u.hash || ''}`;
        window.history.replaceState({}, '', path);
      } catch {
        window.history.replaceState({}, '', window.location.pathname);
      }
    };

    const run = async () => {
      if (!isAuthenticated || !currentUser) {
        showError(
          'Connectez-vous à Momentum pour enregistrer GitHub sur votre compte.',
          { title: 'Session requise' },
        );
        cleanUrl();
        processedCode.current = null;
        return;
      }

      const expected = readStoredOAuthState();
      if (expected && state && state !== expected) {
        clearStoredOAuthState();
        showError('Session OAuth invalide ou expirée. Réessayez depuis Paramètres.', {
          title: 'État OAuth',
        });
        cleanUrl();
        processedCode.current = null;
        return;
      }
      clearStoredOAuthState();

      const redirectUri = getGitHubOAuthRedirectUri();
      try {
        const tok = await exchangeGitHubOAuthCode(code, redirectUri);
        const accessToken = tok.access_token;
        if (!accessToken) throw new Error('Token absent');
        const me = await fetchGitHubRestUser(accessToken);
        const result = await updateProfile({
          github: {
            accessToken,
            login: me.login,
            avatarUrl: me.avatar_url,
            htmlUrl: me.html_url,
            method: 'oauth',
            connectedAt: new Date().toISOString(),
          },
        });
        if (!result?.success) {
          throw new Error(result?.error || 'Impossible d’enregistrer le profil');
        }
        showSuccess(`Compte GitHub « ${me.login} » lié à Momentum.`);
        setActiveTab('settings');
        setTimeout(() => {
          document.getElementById('settings-github')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 400);
      } catch (e) {
        console.error('[GitHubOAuth]', e);
        showError(e?.message || 'Échec de la connexion GitHub', {
          title: 'GitHub',
          message:
            typeof e?.message === 'string'
              ? e.message
              : 'Vérifiez que le backend tourne (port 8000) et que GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET sont définis dans .env.',
        });
      } finally {
        cleanUrl();
      }
    };

    run();
  }, [
    authLoading,
    currentUser,
    isAuthenticated,
    updateProfile,
    setActiveTab,
    showSuccess,
    showError,
  ]);

  return null;
}
