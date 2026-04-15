const BASE = '/api/app-lock';

async function readDetail(res) {
  try {
    const j = await res.json();
    if (typeof j.detail === 'string') return j.detail;
    if (Array.isArray(j.detail)) return j.detail.map((d) => d.msg || d).join(', ');
    return res.statusText;
  } catch {
    return res.statusText;
  }
}

/**
 * Demande l'envoi d'un code à 6 chiffres par e-mail (backend FastAPI).
 * @param {string} email
 * @returns {Promise<{ ok: boolean, devMode?: boolean, message?: string, error?: string }>}
 */
export async function requestAppLockRecoveryCode(email) {
  const res = await fetch(`${BASE}/request-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: (email || '').trim() }),
  });
  if (!res.ok) {
    return { ok: false, error: await readDetail(res) };
  }
  return await res.json();
}

/**
 * Vérifie le code e-mail ; renvoie resetToken pour la dernière étape.
 * @param {string} email
 * @param {string} code
 */
export async function verifyAppLockRecoveryCode(email, code) {
  const res = await fetch(`${BASE}/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: (email || '').trim(), code: (code || '').trim() }),
  });
  if (!res.ok) {
    return { ok: false, error: await readDetail(res) };
  }
  return await res.json();
}

/**
 * Invalide le jeton côté serveur (à appeler après enregistrement du nouveau code app lock).
 * @param {string} email
 * @param {string} resetToken
 */
export async function consumeAppLockResetToken(email, resetToken) {
  const res = await fetch(`${BASE}/consume-reset-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: (email || '').trim(), resetToken }),
  });
  if (!res.ok) {
    return { ok: false, error: await readDetail(res) };
  }
  return await res.json();
}
