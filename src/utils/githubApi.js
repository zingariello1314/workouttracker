/**
 * GitHub API via proxy Momentum (évite CORS + garde le client_secret côté serveur).
 */

const API_PREFIX = '/api/github';

export function getGitHubOAuthRedirectUri() {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/?oauth=github`;
}

export function getGitHubClientId() {
  return (import.meta.env.VITE_GITHUB_CLIENT_ID || '').trim();
}

export function buildGitHubAuthorizeUrl() {
  const clientId = getGitHubClientId();
  if (!clientId) return null;
  const redirectUri = getGitHubOAuthRedirectUri();
  const state =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `st_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  try {
    sessionStorage.setItem('momentum_github_oauth_state', state);
  } catch {
    // ignore
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user',
    state,
    allow_signup: 'true',
  });
  return { url: `https://github.com/login/oauth/authorize?${params.toString()}`, state, redirectUri };
}

export function readStoredOAuthState() {
  try {
    return sessionStorage.getItem('momentum_github_oauth_state');
  } catch {
    return null;
  }
}

export function clearStoredOAuthState() {
  try {
    sessionStorage.removeItem('momentum_github_oauth_state');
  } catch {
    // ignore
  }
}

export async function exchangeGitHubOAuthCode(code, redirectUri) {
  const clientId = getGitHubClientId();
  const res = await fetch(`${API_PREFIX}/oauth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      redirect_uri: redirectUri,
      ...(clientId ? { client_id: clientId } : {}),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.detail || data?.message || `HTTP ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data;
}

export async function fetchGitHubGraphql(accessToken, query, variables = {}) {
  const res = await fetch(`${API_PREFIX}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-GitHub-Token': accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Réponse GraphQL invalide (${res.status})`);
  }
  if (!res.ok) {
    throw new Error(json?.message || json?.errors?.[0]?.message || `GraphQL HTTP ${res.status}`);
  }
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }
  return json.data;
}

export function startGitHubOAuthFlow() {
  const built = buildGitHubAuthorizeUrl();
  if (!built?.url) {
    return { ok: false, error: 'missing_client_id' };
  }
  window.location.href = built.url;
  return { ok: true };
}

export async function fetchGitHubRestUser(accessToken) {
  const res = await fetch(`${API_PREFIX}/rest/user`, {
    headers: {
      'X-GitHub-Token': accessToken,
      Accept: 'application/vnd.github+json',
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.detail || `HTTP ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data;
}
