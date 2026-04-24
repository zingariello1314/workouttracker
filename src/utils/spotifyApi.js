const SPOTIFY_ACCOUNTS_BASE = 'https://accounts.spotify.com';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

const SPOTIFY_STATE_KEY = 'momentum_spotify_oauth_state';
const SPOTIFY_VERIFIER_KEY = 'momentum_spotify_code_verifier';

export function getSpotifyClientId() {
  return String(import.meta.env.VITE_SPOTIFY_CLIENT_ID || '').trim();
}

/**
 * URI de retour OAuth Spotify — doit correspondre exactement au dashboard Spotify.
 * En dev, Spotify exige une adresse de bouclage explicite (127.0.0.1), pas "localhost".
 */
export function getSpotifyOAuthRedirectUri() {
  if (typeof window === 'undefined') return '';
  const { hostname, port, protocol } = window.location;
  const isLoopbackHost =
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';
  if (isLoopbackHost) {
    const portPart = port ? `:${port}` : '';
    return `http://127.0.0.1${portPart}/?oauth=spotify`;
  }
  const origin = `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  return `${origin}/?oauth=spotify`;
}

function toBase64Url(uint8array) {
  const str = btoa(String.fromCharCode(...uint8array));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomString(length = 64) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[b % 66]).join('');
}

async function sha256(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  return crypto.subtle.digest('SHA-256', data);
}

export async function buildSpotifyAuthorizeUrl() {
  const clientId = getSpotifyClientId();
  if (!clientId) return null;

  const redirectUri = getSpotifyOAuthRedirectUri();
  const state = randomString(32);
  const codeVerifier = randomString(64);
  const digest = await sha256(codeVerifier);
  const codeChallenge = toBase64Url(new Uint8Array(digest));

  try {
    sessionStorage.setItem(SPOTIFY_STATE_KEY, state);
    sessionStorage.setItem(SPOTIFY_VERIFIER_KEY, codeVerifier);
  } catch {
    // ignore
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state,
    show_dialog: 'true',
    scope: 'user-read-private user-read-email user-read-playback-state user-read-currently-playing user-modify-playback-state',
  });

  return {
    url: `${SPOTIFY_ACCOUNTS_BASE}/authorize?${params.toString()}`,
    state,
    redirectUri,
  };
}

export function readStoredSpotifyOAuthState() {
  try {
    return sessionStorage.getItem(SPOTIFY_STATE_KEY);
  } catch {
    return null;
  }
}

export function clearStoredSpotifyOAuthState() {
  try {
    sessionStorage.removeItem(SPOTIFY_STATE_KEY);
    sessionStorage.removeItem(SPOTIFY_VERIFIER_KEY);
  } catch {
    // ignore
  }
}

function readStoredSpotifyCodeVerifier() {
  try {
    return sessionStorage.getItem(SPOTIFY_VERIFIER_KEY);
  } catch {
    return null;
  }
}

async function postSpotifyToken(params) {
  const res = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error_description || data?.error || `HTTP ${res.status}`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }
  return data;
}

export async function exchangeSpotifyOAuthCode(code, redirectUri) {
  const clientId = getSpotifyClientId();
  const codeVerifier = readStoredSpotifyCodeVerifier();
  if (!clientId) throw new Error('VITE_SPOTIFY_CLIENT_ID manquant');
  if (!codeVerifier) throw new Error('Code verifier Spotify introuvable (session expirée)');
  return postSpotifyToken({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });
}

export async function refreshSpotifyAccessToken(refreshToken) {
  const clientId = getSpotifyClientId();
  if (!clientId) throw new Error('VITE_SPOTIFY_CLIENT_ID manquant');
  if (!refreshToken) throw new Error('Refresh token Spotify manquant');
  return postSpotifyToken({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
  });
}

export async function fetchSpotifyMe(accessToken) {
  const res = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message || `HTTP ${res.status}`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }
  return data;
}

export async function fetchSpotifyCurrentPlayback(accessToken) {
  const res = await fetch(`${SPOTIFY_API_BASE}/me/player/currently-playing`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message || `HTTP ${res.status}`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }
  return data;
}

async function spotifyPlayerRequest(accessToken, path, method = 'PUT', query = null) {
  const url = new URL(`${SPOTIFY_API_BASE}${path}`);
  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  const res = await fetch(url.toString(), {
    method,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 204) return true;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message || `HTTP ${res.status}`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }
  return true;
}

export async function spotifyNextTrack(accessToken, deviceId = null) {
  return spotifyPlayerRequest(accessToken, '/me/player/next', 'POST', deviceId ? { device_id: deviceId } : null);
}

export async function spotifyPreviousTrack(accessToken, deviceId = null) {
  return spotifyPlayerRequest(accessToken, '/me/player/previous', 'POST', deviceId ? { device_id: deviceId } : null);
}

export async function spotifyPausePlayback(accessToken, deviceId = null) {
  try {
    return await spotifyPlayerRequest(accessToken, '/me/player/pause', 'PUT', deviceId ? { device_id: deviceId } : null);
  } catch (error) {
    // Certains lecteurs refusent pause/play quand device_id est forcé : fallback sans device.
    if (deviceId) {
      return spotifyPlayerRequest(accessToken, '/me/player/pause', 'PUT');
    }
    throw error;
  }
}

export async function spotifyResumePlayback(accessToken, deviceId = null) {
  try {
    return await spotifyPlayerRequest(accessToken, '/me/player/play', 'PUT', deviceId ? { device_id: deviceId } : null);
  } catch (error) {
    // Fallback sans device_id pour les appareils qui appliquent des restrictions strictes.
    if (deviceId) {
      return spotifyPlayerRequest(accessToken, '/me/player/play', 'PUT');
    }
    throw error;
  }
}

export async function spotifySetVolume(accessToken, volumePercent, deviceId = null) {
  const safe = Math.max(0, Math.min(100, Math.round(Number(volumePercent) || 0)));
  try {
    return await spotifyPlayerRequest(accessToken, '/me/player/volume', 'PUT', {
      volume_percent: safe,
      ...(deviceId ? { device_id: deviceId } : {}),
    });
  } catch (error) {
    if (deviceId) {
      return spotifyPlayerRequest(accessToken, '/me/player/volume', 'PUT', { volume_percent: safe });
    }
    throw error;
  }
}

export async function startSpotifyOAuthFlow() {
  const built = await buildSpotifyAuthorizeUrl();
  if (!built?.url) return { ok: false, error: 'missing_client_id' };
  window.location.href = built.url;
  return { ok: true };
}
