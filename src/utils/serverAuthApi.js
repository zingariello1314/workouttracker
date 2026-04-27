const API_BASE = (import.meta.env.VITE_AUTH_SERVER_BASE || '').trim() || '';
const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE || 'local').trim().toLowerCase();
const REFRESH_TOKEN_KEY = 'momentum:serverRefreshToken';
const ACCESS_TOKEN_KEY = 'momentum:serverAccessToken';

const withBase = (path) => `${API_BASE}${path}`;

const parseJson = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.detail || data?.message || `HTTP ${res.status}`;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return data;
};

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

export const serverRefresh = async (refreshToken) => {
  const res = await fetch(withBase('/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  return parseJson(res);
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
