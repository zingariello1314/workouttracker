import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useToast } from '../ui/Toast';
import {
  clearStoredSpotifyOAuthState,
  exchangeSpotifyOAuthCode,
  fetchSpotifyMe,
  getSpotifyOAuthRedirectUri,
  readStoredSpotifyOAuthState,
} from '../../utils/spotifyApi';

export default function SpotifyOAuthLanding() {
  const { currentUser, isAuthenticated, updateProfile, loading: authLoading } = useAuth();
  const { setActiveTab } = useWorkout();
  const { showSuccess, showError } = useToast();
  const processedCode = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth') !== 'spotify') return;
    const code = params.get('code');
    const state = params.get('state');
    if (!code || authLoading) return;
    if (processedCode.current === code) return;
    processedCode.current = code;

    const cleanUrl = () => {
      try {
        const u = new URL(window.location.href);
        u.searchParams.delete('oauth');
        u.searchParams.delete('code');
        u.searchParams.delete('state');
        u.searchParams.delete('error');
        u.searchParams.delete('error_description');
        const q = u.searchParams.toString();
        const path = `${u.pathname}${q ? `?${q}` : ''}${u.hash || ''}`;
        window.history.replaceState({}, '', path);
      } catch {
        window.history.replaceState({}, '', window.location.pathname);
      }
    };

    const run = async () => {
      if (!isAuthenticated || !currentUser) {
        showError('Connecte-toi à Momentum pour lier Spotify.', { title: 'Session requise' });
        cleanUrl();
        processedCode.current = null;
        return;
      }

      const expected = readStoredSpotifyOAuthState();
      if (expected && state && state !== expected) {
        clearStoredSpotifyOAuthState();
        showError('Session OAuth Spotify invalide ou expirée.', { title: 'Spotify OAuth' });
        cleanUrl();
        processedCode.current = null;
        return;
      }

      try {
        const redirectUri = getSpotifyOAuthRedirectUri();
        const tokenData = await exchangeSpotifyOAuthCode(code, redirectUri);
        const accessToken = tokenData?.access_token;
        const refreshToken = tokenData?.refresh_token;
        const expiresIn = Number(tokenData?.expires_in) || 3600;
        if (!accessToken) throw new Error('Token Spotify absent');

        const me = await fetchSpotifyMe(accessToken);
        const result = await updateProfile({
          spotify: {
            accessToken,
            refreshToken: refreshToken || currentUser?.spotify?.refreshToken || null,
            expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
            connectedAt: new Date().toISOString(),
            product: me?.product || null,
            country: me?.country || null,
            displayName: me?.display_name || null,
            userId: me?.id || null,
          },
        });
        if (!result?.success) throw new Error(result?.error || 'Impossible d’enregistrer Spotify');

        showSuccess(`Spotify lié${me?.display_name ? ` : ${me.display_name}` : ''}.`);
        setActiveTab('settings');
        setTimeout(() => {
          document.getElementById('settings-spotify')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 350);
      } catch (e) {
        showError(e?.message || 'Échec de la connexion Spotify', { title: 'Spotify' });
      } finally {
        clearStoredSpotifyOAuthState();
        cleanUrl();
      }
    };

    run();
  }, [authLoading, currentUser, isAuthenticated, setActiveTab, showError, showSuccess, updateProfile]);

  return null;
}
