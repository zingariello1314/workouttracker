const LOCAL_KEY_STORAGE = 'momentum:profileSecretsKey:v1';
const ENC_PREFIX = 'enc:v1:';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toBase64 = (bytes) => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

const fromBase64 = (b64) => {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
};

const getOrCreateRawKey = () => {
  try {
    const existing = localStorage.getItem(LOCAL_KEY_STORAGE);
    if (existing) return fromBase64(existing);
    const key = crypto.getRandomValues(new Uint8Array(32));
    localStorage.setItem(LOCAL_KEY_STORAGE, toBase64(key));
    return key;
  } catch {
    return null;
  }
};

const getCryptoKey = async () => {
  if (typeof crypto === 'undefined' || !crypto.subtle) return null;
  const raw = getOrCreateRawKey();
  if (!raw) return null;
  try {
    return await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
      'encrypt',
      'decrypt'
    ]);
  } catch {
    return null;
  }
};

const encryptString = async (plain) => {
  if (!plain) return plain;
  const key = await getCryptoKey();
  if (!key) return plain;
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = textEncoder.encode(String(plain));
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
    return `${ENC_PREFIX}${toBase64(iv)}:${toBase64(new Uint8Array(cipher))}`;
  } catch {
    return plain;
  }
};

const decryptString = async (value) => {
  if (!value || typeof value !== 'string' || !value.startsWith(ENC_PREFIX)) return value;
  const key = await getCryptoKey();
  if (!key) return value;
  try {
    const payload = value.slice(ENC_PREFIX.length);
    const [ivB64, dataB64] = payload.split(':');
    if (!ivB64 || !dataB64) return value;
    const iv = fromBase64(ivB64);
    const data = fromBase64(dataB64);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return textDecoder.decode(plain);
  } catch {
    return value;
  }
};

export const isEncryptedSecretString = (value) =>
  typeof value === 'string' && value.startsWith(ENC_PREFIX);

export const encryptSecretString = async (plain) => encryptString(plain);

export const decryptSecretString = async (value) => decryptString(value);

export const encryptProfileSecretsPatch = async (partialUser = {}) => {
  const out = { ...(partialUser || {}) };
  if (out.github && typeof out.github === 'object') {
    out.github = { ...out.github };
    if (out.github.accessToken) {
      out.github.accessToken = await encryptString(out.github.accessToken);
    }
  }
  if (out.spotify && typeof out.spotify === 'object') {
    out.spotify = { ...out.spotify };
    if (out.spotify.accessToken) {
      out.spotify.accessToken = await encryptString(out.spotify.accessToken);
    }
    if (out.spotify.refreshToken) {
      out.spotify.refreshToken = await encryptString(out.spotify.refreshToken);
    }
  }
  return out;
};

export const decryptProfileSecretsUser = async (user) => {
  if (!user || typeof user !== 'object') return user;
  const out = { ...user };
  if (out.github && typeof out.github === 'object') {
    out.github = { ...out.github };
    if (out.github.accessToken) {
      out.github.accessToken = await decryptString(out.github.accessToken);
    }
  }
  if (out.spotify && typeof out.spotify === 'object') {
    out.spotify = { ...out.spotify };
    if (out.spotify.accessToken) {
      out.spotify.accessToken = await decryptString(out.spotify.accessToken);
    }
    if (out.spotify.refreshToken) {
      out.spotify.refreshToken = await decryptString(out.spotify.refreshToken);
    }
  }
  return out;
};
