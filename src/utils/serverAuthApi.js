const API_BASE = (import.meta.env.VITE_AUTH_SERVER_BASE || '').trim() || '';
const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE || 'local').trim().toLowerCase();
const REFRESH_TOKEN_KEY = 'momentum:serverRefreshToken';
const ACCESS_TOKEN_KEY = 'momentum:serverAccessToken';

const withBase = (path) => `${API_BASE}${path}`;

const parseJson = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.detail || data?.message || `HTTP ${res.status}`;
    const err = new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    err.status = res.status;
    throw err;
  }
  return data;
};

/**
 * Après un échec de `POST /auth/refresh` : effacer les jetons locaux **seulement** si le serveur
 * indique un refresh invalide / expiré — pas sur erreur réseau ni 5xx (sinon déconnexion
 * factice au redémarrage du serveur ou coupure temporaire).
 *
 * @param {unknown} error
 */
export function shouldDiscardServerTokensAfterFailedRefresh(error) {
  const s = Number(error?.status);
  if (!Number.isFinite(s)) return false;
  return s === 400 || s === 401 || s === 403;
}

export const getAuthMode = () => AUTH_MODE;
export const isServerAuthMode = () => AUTH_MODE === 'server' || AUTH_MODE === 'hybrid';
export const isStrictServerAuthMode = () => AUTH_MODE === 'server';

export const setServerTokens = ({ accessToken, refreshToken }) => {
  try {
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch {
    // ignore
  }
};

export const clearServerTokens = () => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // ignore
  }
};

export const readServerTokens = () => {
  try {
    return {
      accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
      refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY)
    };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
};

export const serverRegister = async ({ username, email, password }) => {
  const res = await fetch(withBase('/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  return parseJson(res);
};

export const serverLogin = async ({ username, password }) => {
  const res = await fetch(withBase('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return parseJson(res);
};

/** Évite deux POST /auth/refresh parallèles (ex. React 18 StrictMode en dev) : la rotation révoque l'ancien jeton, le 2e appel recevrait 401 et effacerait la session. Même jeton → même promesse ; autre jeton → attend la requête en cours puis relance. */
let refreshInFlight = null;
let refreshForToken = null;

export const serverRefresh = async (refreshToken) => {
  const token = String(refreshToken || '').trim();
  if (refreshInFlight) {
    if (refreshForToken === token) {
      return refreshInFlight;
    }
    try {
      await refreshInFlight;
    } catch {
      /* la rotation suivante utilisera le nouveau refresh en localStorage */
    }
  }
  refreshForToken = token;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(withBase('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token })
      });
      return await parseJson(res);
    } finally {
      refreshInFlight = null;
      refreshForToken = null;
    }
  })();
  return refreshInFlight;
};

export const serverLogout = async (refreshToken) => {
  const res = await fetch(withBase('/auth/logout'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  return parseJson(res);
};

export const serverChangePassword = async ({ oldPassword, newPassword, accessToken }) => {
  const res = await fetch(withBase('/auth/change-password'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify({ oldPassword, newPassword })
  });
  return parseJson(res);
};
