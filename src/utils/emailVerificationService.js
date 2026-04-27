/** localStorage : survit à la fermeture d’onglet (sessionStorage perdait le code trop vite). */
const STORAGE_KEY = 'momentum:emailVerification:v1';
const CODE_TTL_MS = 10 * 60 * 1000;

const EMAILJS_ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const writeStore = (next) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next || {}));
  } catch {
    // ignore storage errors
  }
};

const readStore = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const base = parsed && typeof parsed === 'object' ? parsed : {};
    const now = Date.now();
    let changed = false;
    const cleaned = { ...base };
    Object.keys(cleaned).forEach((k) => {
      const exp = Number(cleaned[k]?.expiresAt || 0);
      if (exp && now > exp) {
        delete cleaned[k];
        changed = true;
      }
    });
    if (changed) writeStore(cleaned);
    return cleaned;
  } catch {
    return {};
  }
};

const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

const sendViaEmailJs = async ({ toEmail, code, displayName }) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    return { ok: false, reason: 'EMAILJS_NOT_CONFIGURED' };
  }

  try {
    const response = await fetch(EMAILJS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: toEmail,
          verification_code: code,
          display_name: displayName || 'Utilisateur Momentum'
        }
      })
    });
    if (!response.ok) {
      return { ok: false, reason: `EMAILJS_HTTP_${response.status}` };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: 'EMAILJS_NETWORK_ERROR' };
  }
};

export const requestEmailVerificationCode = async ({ email, displayName = '' }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, error: 'EMAIL_INVALID' };
  }

  const code = generateCode();
  const expiresAt = Date.now() + CODE_TTL_MS;

  const store = readStore();
  store[normalizedEmail] = { code, expiresAt };
  writeStore(store);

  const emailResult = await sendViaEmailJs({
    toEmail: normalizedEmail,
    code,
    displayName
  });

  if (emailResult.ok) {
    return {
      success: true,
      delivery: 'email',
      expiresInMs: CODE_TTL_MS
    };
  }

  return {
    success: true,
    delivery: 'fallback',
    expiresInMs: CODE_TTL_MS,
    debugCode: code
  };
};

export const verifyEmailCode = ({ email, code }) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = String(code || '').trim();
  const store = readStore();
  const entry = store[normalizedEmail];

  if (!entry) {
    return { success: false, error: 'CODE_NOT_REQUESTED' };
  }
  if (Date.now() > Number(entry.expiresAt || 0)) {
    delete store[normalizedEmail];
    writeStore(store);
    return { success: false, error: 'CODE_EXPIRED' };
  }
  if (normalizedCode !== String(entry.code)) {
    return { success: false, error: 'CODE_INVALID' };
  }

  delete store[normalizedEmail];
  writeStore(store);
  return { success: true };
};

